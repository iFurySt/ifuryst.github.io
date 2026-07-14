---
layout: post
title: "LLM Infra 101 v0.4: Continuous Batching"
date: 2026-05-25T08:00:00+08:00
lang: en
translation_key: llm-infra-101-v0-4-continuous-batching
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

> **Note:** This article was translated for me by AI. I wrote the original in Chinese. I never use AI to write my articles, because that would cost me my own expression; my freedom to express myself is always the most valuable part of my work. So if you can read Chinese, I recommend reading the Chinese version, where you will get the most original and unfiltered version. That said, technological progress exists to give us more convenience, so I will continue using AI to translate my writing into multiple languages, allowing valuable content to reach more people.

This is the fifth episode in the series. You can read the previous ones here:

1. [LLM Infra 101 v0.0: Model Inference](https://www.ifuryst.com/blog/2026/llm-infra-101-model-inference/)

2. [LLM Infra 101 v0.1: API Calls](https://www.ifuryst.com/blog/2026/llm-infra-101-v0-1-openai-compatible-api/)

3. [LLM Infra 101 v0.2: KV Cache](https://www.ifuryst.com/blog/2026/llm-infra-101-v0-2-kv-cache-decode/)

4. [LLM Infra 101 v0.3: Static Batching](https://www.ifuryst.com/blog/2026/llm-infra-101-v0-3-static-batching/)

The code for this episode is at [https://github.com/iFurySt/nanoLLMServe/tree/release/v0.4.0](https://github.com/iFurySt/nanoLLMServe/tree/release/v0.4.0)

In the previous episode, we implemented Static Batching. The problems it left behind were clear:

- New requests cannot join midway through a batch.

- When a request finishes, its position in the batch remains occupied and cannot be released.

- The lifecycle of the entire batch is held back by its slowest request.

To deal with these problems, we need to introduce Continuous Batching.

# Implementation

These are the main changes this time:

```shell
.
├── src/
│   └── nanollmserve/
│       └── engine/
│           ├── engine.py              # Add generate_continuous_batch: runtime admission, rebuild active batch each step, remove completed requests
│           └── scheduler.py           # Core scheduling structures: waiting/running/finished queues, RequestLifecycle, SchedulerStepStats
└── tests/
    ├── test_benchmark_generate.py     # Regression coverage for continuous_batch benchmark summary fields: active batch size / request count / scheduler steps
    └── test_engine.py                 # Continuous batching regression tests: mid-run admission, completion removal, max_batch_size backpressure
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

This time, we introduced a Scheduler to process and schedule requests. First, we define the request lifecycle:

```python
class RequestLifecycle(str, Enum):
    WAITING = "waiting"
    RUNNING = "running"
    FINISHED = "finished"
```

When a request first arrives, it is in `waiting`. At a particular scheduler step, when it is admitted into the active batch, it becomes `running`. Once generation finishes and it is removed from the running set, it becomes `finished`.

An incoming request now looks like this:

```python
@dataclass(frozen=True)
class ContinuousBatchRequest:
    request_id: str
    prompt: str
    max_new_tokens: int = 32
    arrival_step: int = 0
```

And is called like this:

```python
ContinuousBatchRequest("req-0", "hello", arrival_step=0)
ContinuousBatchRequest("req-1", "你好", arrival_step=2)
```

This represents two requests: `req-0` arrives at step 0, and `req-1` arrives at step 2.

Two lists and one queue are defined here:

```python
@dataclass
class ContinuousBatchScheduler:
    requests: list[ContinuousBatchRequest]
    max_batch_size: int | None = None
    waiting: deque[ScheduledRequestState] = field(init=False)
    running: list[ScheduledRequestState] = field(default_factory=list, init=False)
    finished: list[ScheduledRequestState] = field(default_factory=list, init=False)
```

They correspond to requests in the three lifecycle stages above. Two important methods support them:

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

`admit` moves arrived requests from `waiting` to `running`, while `finish` moves completed requests from `running` to `finished`.

## Engine

Continuous Batching is actually handled by `generate_continuous_batch` in `src/nanollmserve/engine/engine.py`:

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

First, we let the Scheduler add requests that can execute at the current step to `running`:

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

Then we retrieve all `running_ids` and use them to rebuild the active batch:

```python
running_ids = [state.request.request_id for state in scheduler.running]
if not running_ids:
    continue

batch = _continuous_batch_tensors(states, running_ids, tokenizer, device)
```

`_continuous_batch_tensors` combines the running requests into a padded batch. As we discussed before, requests in a batch need to be aligned.

Everything after that is the same as before: obtain the logits and sample the next token.

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

Next, we go through the requests in this forward pass and append each generated token to its request state, while extending its attention mask by one position. Finally, we check which requests have finished and report them back to the Scheduler.

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

That is the complete Continuous Batching implementation. But there are still some problems: the granularity is too coarse, and performance is not optimal.

Every time we call `_continuous_batch_tensors`, we do this:

```python
sequence = state.prompt_token_ids + state.generated_token_ids
```

The entire sequence is forwarded again. In other words, we have lost KV Cache again: the KV Cache from v0.2 is not actually being used here. Later, we will implement paged-KV continuous batching to address this.

# Inference

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-25-llm-infra-101-v0-4-continuous-batching/1779683395_2.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

For now, we can still only observe it in the benchmark. You can see the metrics under `continuous_batch`.

# Summary

This time we added Continuous Batching, achieving the goal that whoever finishes gets out and whoever arrives fills the vacancy. A finished request no longer continues occupying a VRAM slot in the batch.

But as mentioned earlier, this version is more of a complete demonstration of the Continuous Batching concept itself. It is not yet something that can run in production like vLLM or SGLang. We still have work to do. The next step is to use Paged KV Cache blocks to support Paged-KV Continuous Batching.
