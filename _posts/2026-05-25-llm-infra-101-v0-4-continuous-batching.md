---
layout: post
title: "LLM Infra 101 v0.4: 连续批处理"
date: 2026-05-25T08:00:00+08:00
tags:
  - AI
  - LLMInfra-101
categories: AI
giscus_comments: true
tabs: true
pretty_table: true
toc:
  sidebar: left
---

系列的第五集，前面的可以看：

1. [LLM Infra 101 v0.0: 推理模型](https://www.ifuryst.com/blog/2026/llm-infra-101-model-inference/)

2. [LLM Infra 101 v0.1: API调用](https://www.ifuryst.com/blog/2026/llm-infra-101-v0-1-openai-compatible-api/)

3. [LLM Infra 101 v0.2: KV Cache](https://www.ifuryst.com/blog/2026/llm-infra-101-v0-2-kv-cache-decode/)

4. [LLM Infra 101 v0.3: 静态批处理](https://www.ifuryst.com/blog/2026/llm-infra-101-v0-3-static-batching/)

这一期的代码在 [https://github.com/iFurySt/nanoLLMServe/tree/release/v0.4.0](https://github.com/iFurySt/nanoLLMServe/tree/release/v0.4.0)

上期做到Static Batching，遗留下来的问题很明确：

- 新请求不能中途进入

- 某个请求结束后，batch里这个请求的位置还会占用着不能释放出来

- 整个batch生命周期被最慢的那个请求拖住

为了处理这些问题，我们需要引入连续批处理（Continuous Batching）

# 实现

这次主要涉及的改动是

```shell
.
├── src/
│   └── nanollmserve/
│       └── engine/
│           ├── engine.py              # 新增 generate_continuous_batch：运行中 admission、每步重建 active batch、完成请求移出
│           └── scheduler.py           # 核心调度结构：waiting/running/finished 队列、RequestLifecycle、SchedulerStepStats
└── tests/
    ├── test_benchmark_generate.py     # continuous_batch benchmark 汇总字段回归：active batch size / request count / scheduler steps
    └── test_engine.py                 # 连续批处理行为回归：中途加入、完成移除、max_batch_size backpressure
```

## Scheduler

`src/nanollmserve/engine/scheduler.py`

```python
"""Teaching-scale continuous batching scheduler."""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from enum import Enum


class RequestLifecycle(str, Enum):
    WAITING = "waiting"
    RUNNING = "running"
    FINISHED = "finished"


@dataclass(frozen=True)
class ContinuousBatchRequest:
    request_id: str
    prompt: str
    max_new_tokens: int = 32
    arrival_step: int = 0


@dataclass(frozen=True)
class SchedulerStepStats:
    step: int
    admitted_request_ids: list[str]
    running_request_ids: list[str]
    completed_request_ids: list[str]
    active_batch_size: int


@dataclass
class ScheduledRequestState:
    request: ContinuousBatchRequest
    lifecycle: RequestLifecycle = RequestLifecycle.WAITING
    admitted_step: int | None = None
    finished_step: int | None = None


@dataclass
class ContinuousBatchScheduler:
    requests: list[ContinuousBatchRequest]
    max_batch_size: int | None = None
    waiting: deque[ScheduledRequestState] = field(init=False)
    running: list[ScheduledRequestState] = field(default_factory=list, init=False)
    finished: list[ScheduledRequestState] = field(default_factory=list, init=False)

    def __post_init__(self) -> None:
        if self.max_batch_size is not None and self.max_batch_size < 1:
            raise ValueError("max_batch_size must be at least 1")

        seen: set[str] = set()
        indexed_states: list[tuple[int, ScheduledRequestState]] = []
        for index, request in enumerate(self.requests):
            if request.request_id in seen:
                raise ValueError(f"duplicate request_id: {request.request_id}")
            seen.add(request.request_id)
            if request.arrival_step < 0:
                raise ValueError("arrival_step must be non-negative")
            if request.max_new_tokens < 1:
                raise ValueError("max_new_tokens must be at least 1")
            if not request.prompt:
                raise ValueError("prompt must not be empty")
            indexed_states.append((index, ScheduledRequestState(request=request)))

        indexed_states.sort(key=lambda item: (item[1].request.arrival_step, item[0]))
        self.waiting = deque(state for _, state in indexed_states)

    def has_work(self) -> bool:
        return bool(self.waiting or self.running)

    def next_arrival_step(self) -> int | None:
        if not self.waiting:
            return None
        return self.waiting[0].request.arrival_step

    def admit(self, step: int) -> list[ScheduledRequestState]:
        admitted: list[ScheduledRequestState] = []
        while self.waiting and self.waiting[0].request.arrival_step <= step:
            if self.max_batch_size is not None and len(self.running) >= self.max_batch_size:
                break
            state = self.waiting.popleft()
            state.lifecycle = RequestLifecycle.RUNNING
            state.admitted_step = step
            self.running.append(state)
            admitted.append(state)
        return admitted

    def finish(self, request_ids: set[str], step: int) -> list[ScheduledRequestState]:
        completed: list[ScheduledRequestState] = []
        still_running: list[ScheduledRequestState] = []
        for state in self.running:
            if state.request.request_id in request_ids:
                state.lifecycle = RequestLifecycle.FINISHED
                state.finished_step = step
                completed.append(state)
            else:
                still_running.append(state)
        self.running = still_running
        self.finished.extend(completed)
        return completed

    def record_step(
        self,
        *,
        step: int,
        admitted: list[ScheduledRequestState],
        running_request_ids: list[str],
        completed: list[ScheduledRequestState],
    ) -> SchedulerStepStats:
        return SchedulerStepStats(
            step=step,
            admitted_request_ids=[state.request.request_id for state in admitted],
            running_request_ids=running_request_ids,
            completed_request_ids=[state.request.request_id for state in completed],
            active_batch_size=len(running_request_ids),
        )

```

这次引入了Scheduler用来处理和调度请求，首先是定义请求的生命周期：

```python
class RequestLifecycle(str, Enum):
    WAITING = "waiting"
    RUNNING = "running"
    FINISHED = "finished"
```

请求刚来的时候在waiting中，到了某个scheduler step的时候，被admit进入active batch的时候，就会变成running，在生成结束后，从running set里被移出后，会变成finished

现在进来的请求长这样：

```python
@dataclass(frozen=True)
class ContinuousBatchRequest:
    request_id: str
    prompt: str
    max_new_tokens: int = 32
    arrival_step: int = 0
```

类似这样调用

```python
ContinuousBatchRequest("req-0", "hello", arrival_step=0)
ContinuousBatchRequest("req-1", "你好", arrival_step=2)
```

这个代表了2个请求，req-0在step0的时候到达，req-1在step2的时候到达

这里面定义了2个列表和1个队列：

```python
@dataclass
class ContinuousBatchScheduler:
    requests: list[ContinuousBatchRequest]
    max_batch_size: int | None = None
    waiting: deque[ScheduledRequestState] = field(init=False)
    running: list[ScheduledRequestState] = field(default_factory=list, init=False)
    finished: list[ScheduledRequestState] = field(default_factory=list, init=False)
```

分别代表了前面提到的3个不同生命周期阶段对应的请求，另外配套了两个重要的方法

```python
def admit(self, step: int) -> list[ScheduledRequestState]:
    admitted: list[ScheduledRequestState] = []
    while self.waiting and self.waiting[0].request.arrival_step <= step:
        if self.max_batch_size is not None and len(self.running) >= self.max_batch_size:
            break
        state = self.waiting.popleft()
        state.lifecycle = RequestLifecycle.RUNNING
        state.admitted_step = step
        self.running.append(state)
        admitted.append(state)
    return admitted

def finish(self, request_ids: set[str], step: int) -> list[ScheduledRequestState]:
    completed: list[ScheduledRequestState] = []
    still_running: list[ScheduledRequestState] = []
    for state in self.running:
        if state.request.request_id in request_ids:
            state.lifecycle = RequestLifecycle.FINISHED
            state.finished_step = step
            completed.append(state)
        else:
            still_running.append(state)
    self.running = still_running
    self.finished.extend(completed)
    return completed
```

admin会把已经到达在等待的请求从waiting移到running，而finish会把已经完成的请求从running移到finished

## Engine

真正处理Continuous Batching是在`src/nanollmserve/engine/engine.py` 里的`generate_continuous_batch`

```python
with torch.inference_mode():
    while scheduler.has_work():
        if not scheduler.running and scheduler.next_arrival_step() is not None:
            step = max(step, scheduler.next_arrival_step())

        admitted = scheduler.admit(step)
        for scheduled in admitted:
            states[scheduled.request.request_id] = _state_from_prompt(
                tokenizer,
                scheduled.request.prompt,
                device,
            )
            admitted_at[scheduled.request.request_id] = perf_counter()

        running_ids = [state.request.request_id for state in scheduler.running]
        if not running_ids:
            continue

        batch = _continuous_batch_tensors(states, running_ids, tokenizer, device)
        batch_start = perf_counter()
        outputs = model(
            input_ids=batch["input_ids"],
            attention_mask=batch["attention_mask"],
            use_cache=False,
        )
        batch_elapsed = perf_counter() - batch_start
        next_logits = _select_last_token_logits(outputs.logits, batch["attention_mask"])
        next_tokens = _sample_from_logits(
            next_logits,
            temperature=temperature,
            generator=generator,
        )

        completed_ids: set[str] = set()
        for index, request_id in enumerate(running_ids):
            state = states[request_id]
            request = request_by_id[request_id]
            token_id = int(next_tokens[index, 0].item())
            state.generated_token_ids.append(token_id)
            state.attention_mask = torch.cat(
                [
                    state.attention_mask,
                    torch.ones(1, dtype=state.attention_mask.dtype, device=state.attention_mask.device),
                ],
                dim=-1,
            )
            if state.generated_tokens == 1:
                state.ttft_seconds = perf_counter() - admitted_at[request_id]
                state.prefill_seconds += batch_elapsed
            else:
                state.decode_seconds += batch_elapsed
            if token_id in eos_token_ids or state.generated_tokens >= request.max_new_tokens:
                state.finished = token_id in eos_token_ids
                completed_ids.add(request_id)
                finished_at[request_id] = perf_counter()

        completed = scheduler.finish(completed_ids, step)
        scheduler_steps.append(
            scheduler.record_step(
                step=step,
                admitted=admitted,
                running_request_ids=running_ids,
                completed=completed,
            )
        )
        step += 1
```

先让scheduler（基于当前step）把可以执行的请求加到running里：

```python
admitted = scheduler.admit(step)
for scheduled in admitted:
    states[scheduled.request.request_id] = _state_from_prompt(
        tokenizer,
        scheduled.request.prompt,
        device,
    )
    admitted_at[scheduled.request.request_id] = perf_counter()
```

然后拿到所有的running_ids，并根据running_ids去重建active batch

```python
running_ids = [state.request.request_id for state in scheduler.running]
if not running_ids:
    continue

batch = _continuous_batch_tensors(states, running_ids, tokenizer, device)
```

其中\_continuous_batch_tensors是把running的多个请求拼成一个padding后的batch，之前我们也有说过，batch的请求是需要对齐的

然后后面的处理和之前的就都一样了，得到logits，采样出下个token

```python
outputs = model(
    input_ids=batch["input_ids"],
    attention_mask=batch["attention_mask"],
    use_cache=False,
)
batch_elapsed = perf_counter() - batch_start
next_logits = _select_last_token_logits(outputs.logits, batch["attention_mask"])
next_tokens = _sample_from_logits(
    next_logits,
    temperature=temperature,
    generator=generator,
)
```

接着过一遍这次forward的请求，把生成的token追加回每个请求的state里，包括attention mask增加一位。最后看看有哪些请求已经结束了，可以反馈给Scheduler

```python
completed_ids: set[str] = set()
for index, request_id in enumerate(running_ids):
    state = states[request_id]
    request = request_by_id[request_id]
    token_id = int(next_tokens[index, 0].item())
    state.generated_token_ids.append(token_id)
    state.attention_mask = torch.cat(
        [
            state.attention_mask,
            torch.ones(1, dtype=state.attention_mask.dtype, device=state.attention_mask.device),
        ],
        dim=-1,
    )
    if state.generated_tokens == 1:
        state.ttft_seconds = perf_counter() - admitted_at[request_id]
        state.prefill_seconds += batch_elapsed
    else:
        state.decode_seconds += batch_elapsed
    if token_id in eos_token_ids or state.generated_tokens >= request.max_new_tokens:
        state.finished = token_id in eos_token_ids
        completed_ids.add(request_id)
        finished_at[request_id] = perf_counter()

completed = scheduler.finish(completed_ids, step)
```

这就是完整的Continuous Batching。但是这里面还有一些问题，粒度太粗，性能不是最优的

现在每次`_continuous_batch_tensors` 的时候，都是

```python
sequence = state.prompt_token_ids + state.generated_token_ids
```

把整个序列都重新forward了，也就是KV Cache又掉了，也就是我们v0.2的KV Cache并没有实际运用进来。这个是后续我们会做的一个paged-KV continuous batching

# 推理

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-25-llm-infra-101-v0-4-continuous-batching/1779683395_2.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

我们这波也还只能在bench里观测，可以看到`continuous_batch` 里的数据指标

# 总结

这波支持了Continuous Batching了，实现谁结束了谁滚蛋，谁来了谁补位的目标，不会在batch里有请求已经结束的情况下还占用显存的slot

但是我们前面也提到，现在的更多是完整展示Continuous Batching这个概念本身，实际并不是vllm/sglang之类在生产环境上能跑的版本，我们还需要做一些工作来支持，下一步我们要做的就是借助Paged KV Cache（Block）来支持Paged-KV Continuous Batching
