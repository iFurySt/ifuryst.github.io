---
layout: post
title: "LLM Infra 101 v0.5: KV Cache分块管理"
date: 2026-05-28T08:00:00+08:00
lang: zh
translation_key: llm-infra-101-v0-5-kv-cache-block
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

系列的第六集，前面的可以看：

1. [LLM Infra 101 v0.0: 推理模型](https://www.ifuryst.com/blog/2026/llm-infra-101-model-inference/)

2. [LLM Infra 101 v0.1: API调用](https://www.ifuryst.com/blog/2026/llm-infra-101-v0-1-openai-compatible-api/)

3. [LLM Infra 101 v0.2: KV Cache](https://www.ifuryst.com/blog/2026/llm-infra-101-v0-2-kv-cache-decode/)

4. [LLM Infra 101 v0.3: 静态批处理](https://www.ifuryst.com/blog/2026/llm-infra-101-v0-3-static-batching/)

5. [LLM Infra 101 v0.4: 连续批处理](https://www.ifuryst.com/blog/2026/llm-infra-101-v0-4-continuous-batching/)

这一期的代码在 [https://github.com/iFurySt/nanoLLMServe/tree/release/v0.5.0](https://github.com/iFurySt/nanoLLMServe/tree/release/v0.5.0)

前面已经完成了Continuous Batching的建设了，这波我们会进一步做KV Cache的Block管理模型，为了后续完整的Paged Attention做个基础。

前面我们让请求动态进入Batch，动态完成离开Batch，这里面有个比较大的问题，就是请求的序列长度是不一样的，KV Cache的占用也不同，这样我们每个请求都按照一个很大的连续空间去与留KV Cache空间，就会有很多显存浪费了。举例说明一下：

```python
Request A: prompt 200 tokens，最终生成 100 tokens  → 需要 300 tokens 的 KV
Request B: prompt 4,000 tokens，最终生成 1,000 tokens → 需要 5,000 tokens 的 KV
Request C: prompt 50 tokens，最终生成 20 tokens → 需要 70 tokens 的 KV

Req A 实际用 300   / 预留 8000  → 大量浪费
Req B 实际用 5000  / 预留 8000  → 还行
Req C 实际用 70    / 预留 8000  → 极大浪费
```

大概这样的一个情况，对传统的软件开发了解比较深的人应该有熟悉的感觉，可以直接类比联想到OS里的分页Paging逻辑，也就是OS抽象出一个内存页的内存单元，实际上内存页在物理内存里存放的位置不需要连续了。实际上vLLM的Paged Attention也是沿用了这个理念了，把申请的显存打成一个一个的block，这样可以减少显存的碎片化和无用消耗。（所以说万变不离其宗，有些东西不要停留在表面，理解底层原理，换到不同的应用场景下，都能从根源倒推上去，而不会每次都是八股文式的记忆，也能有很多乐趣），我们的block分块管理就是其中的一环，原来的布局是：

```python
Req A:
[.................... 8000 token buffer ....................]

Req B:
[.................... 8000 token buffer ....................]

Req C:
[.................... 8000 token buffer ....................]
```

现在的请求和显存布局会变成这样

```python
Req A:
[block][block]

Req B:
[block][block][block][block][block][block]

Req C:
[block]
```

现在是以固定大小的KV块/页来分配，block在请求结束后会收到池子。这样的显存利用率一下提升了，并且可以动态增长，按需分配。

大概知道这个原理后，我们来看看怎么实现

# 实现

```python
.
├── benchmarks/
│   └── benchmark_block_manager.py      # 新增 block KV cache 碎片率 benchmark
├── src/
│   └── nanollmserve/
│       ├── cache/
│       │   ├── __init__.py             # 导出 block manager 相关类型
│       │   └── block_manager.py        # 核心：KVBlockManager / block table / usage metrics
│       └── engine/
│           └── engine.py               # 在生成生命周期里接入 allocate / append / release
└── tests/
    ├── test_block_manager.py           # block 分配、追加、释放、超分配测试
    ├── test_benchmark_block_manager.py # benchmark 汇总字段测试
    └── test_engine.py                  # engine 生成时 block 生命周期测试
```

相关改动是这些文件，核心是增加了`KVBlockManager`

## KV Block

首先引入了一个Block单元

```python
@dataclass(frozen=True)
class KVBlock:
    block_id: int        # == blocks.index
    capacity_tokens: int # == block_size
```

KVBlock是一个固定大小的Token Block，用于承载Token的

```python
@dataclass
class KVBlockManager:
    total_blocks: int
    block_size: int = 16

    def __post_init__(self) -> None:
        if self.total_blocks < 1:
            raise ValueError("total_blocks must be at least 1")
        if self.block_size < 1:
            raise ValueError("block_size must be at least 1")
        self.blocks = [KVBlock(block_id=index, capacity_tokens=self.block_size) for index in range(self.total_blocks)]
        self.free_block_ids: deque[int] = deque(block.block_id for block in self.blocks)
        self.request_tables: dict[str, RequestBlockTable] = {}
```

这里默认定义了KVBlock默认可以承载16个token，id简单对应到block在所有blocks里的下标位置。

另外增加某个请求和Block的关系表

```python
@dataclass
class RequestBlockTable:
    request_id: str
    block_ids: list[int] = field(default_factory=list)
    token_count: int = 0
```

比如：

```python
req-a:
  token_count = 33
  block_ids = [0, 1, 2]
```

代表的就是req-a的KV Cache被影射到3个block上了，总共有33个token

## KV Block Manager

有了上面这两个定义后，就可以开始针对请求和对应的token数量去分配block了。这个过程就需要一个管理器来负责管理所有block的生命周期，从分配到对应的请求，到回收block，以及彻底销毁 block，这些会统一在`KVBlockManager` 里管理

我们按照整个流程来走，首先是请求进来后，会调用

```python
def _allocate_prompt_blocks(
    kv_block_manager: KVBlockManager | None,
    request_id: str,
    prompt_tokens: int,
) -> None:
    if kv_block_manager is not None:
        kv_block_manager.allocate(request_id, prompt_tokens)
```

内部是

```python

@dataclass
class KVBlockManager:
    total_blocks: int
    block_size: int = 16

		# ...

    def allocate(self, request_id: str, token_count: int) -> RequestBlockTable:
        if request_id in self.request_tables:
            raise ValueError(f"request already has allocated blocks: {request_id}")
        if token_count < 0:
            raise ValueError("token_count must be non-negative")

        needed_blocks = self._blocks_for_tokens(token_count)
        self._ensure_free_blocks(needed_blocks)
        table = RequestBlockTable(
            request_id=request_id,
            block_ids=self._take_blocks(needed_blocks),
            token_count=token_count,
        )
        self.request_tables[request_id] = table
        return self.snapshot_request(request_id)
```

会根据token数量计算需要几个block

```python
9 tokens  -> ceil(9 / 16)  = 1 block
17 tokens -> ceil(17 / 16) = 2 blocks
33 tokens -> ceil(33 / 16) = 3 blocks
```

然后到Free Pool里确认是否有足够的block（这里非常基础的版本，初始化默认分配`total_blocks`块，后续没有动态增加分配之类的管理），然后分配这些blocks给对应的Req并记录对应的关系表。

```python
free_block_ids = [0, 1, 2, 3, 4]
request_tables = {}

# 变成

free_block_ids = [3, 4]
request_tables = {
  "req-a": block_ids=[0, 1, 2], token_count=33
}
```

接着在Decode生成Token后，会调用

```python
def _append_generated_block_token(
    kv_block_manager: KVBlockManager | None,
    request_id: str,
) -> None:
    if kv_block_manager is not None:
        kv_block_manager.append_tokens(request_id, 1)
```

内部是

```python
@dataclass
class KVBlockManager:
    total_blocks: int
    block_size: int = 16

		# ...

    def append_tokens(self, request_id: str, token_count: int = 1) -> RequestBlockTable:
        if token_count < 0:
            raise ValueError("token_count must be non-negative")
        if request_id not in self.request_tables:
            raise KeyError(f"request has no allocated blocks: {request_id}")
        if token_count == 0:
            return self.snapshot_request(request_id)

        table = self.request_tables[request_id]
        old_blocks = self._blocks_for_tokens(table.token_count)
        new_token_count = table.token_count + token_count
        new_blocks = self._blocks_for_tokens(new_token_count)
        additional_blocks = new_blocks - old_blocks
        self._ensure_free_blocks(additional_blocks)
        table.block_ids.extend(self._take_blocks(additional_blocks))
        table.token_count = new_token_count
        return self.snapshot_request(request_id)
```

基本上就是告诉Manager增加了一个token，然后会确认一下是否需要增加block，增加的话需要看看是否还有空闲的block可用

```python
req-a: 48 tokens -> 49 tokens

原来 3 blocks
现在需要 4 blocks
追加一个 block
```

请求完成后会释放

```python
def _release_blocks(kv_block_manager: KVBlockManager | None, request_ids: list[str]) -> None:
    if kv_block_manager is None:
        return
    for request_id in reversed(request_ids):
        kv_block_manager.release(request_id)
```

会将这个Req直接从Block Table里删除，对应的blocks放回到Free Pool

```python
@dataclass
class KVBlockManager:
    total_blocks: int
    block_size: int = 16

		# ...

    def release(self, request_id: str) -> list[int]:
        table = self.request_tables.pop(request_id, None)
        if table is None:
            raise KeyError(f"request has no allocated blocks: {request_id}")
        released = list(table.block_ids)
        self.free_block_ids.extend(released)
        return released
```

到这里就完整的过完KV Cache Block的全生命周期了，再用High Level来看看

```python
tokenize prompt
-> allocate prompt blocks
-> prefill
-> sample token
-> append generated token block
-> decode loop
-> append generated token block
-> release blocks in finally
```

有了这个机制后，现在Continuous Batching会在请求完成后释放对应的Block，而不是等到整个Batch都结束才释放

```python
step 0: short-0 running
step 1: short-0 finished, late-1 running
       -> release short-0 blocks immediately
step 2: late-1 running
...
```

# 推理

我们还是走bench来观测Block的情况，里面几个指标的意思：

| **字段**                      | **含义**                                         |
| ----------------------------- | ------------------------------------------------ |
| used_blocks                   | 当前被请求占用的block数                          |
| free_blocks                   | 当前空闲block数                                  |
| allocated_tokens              | 请求真实需要的token数                            |
| reserved_tokens               | block实际预留的token容量，也就是block_size的大小 |
| internal_fragmentation_tokens | block内部浪费的token容量                         |
| block_utilization             | allocated_tokens / reserved_tokens               |

举例来说：

```python
block_size = 16
req-a = 9 tokens
```

需要一个block，这种情况下：

```python
allocated_tokens = 9
reserved_tokens = 16
internal_fragmentation_tokens = 7
utilization = 9 / 16
```

这个时候利用率只有大概56%。我们来看bench的结果

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-28-llm-infra-101-v0-5-kv-cache-block/1779949860_7.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

```python
(base) gpu-A100-05 nanoLLMServe # CUDA_VISIBLE_DEVICES=0 PYTHONPATH=src /data/anaconda3/bin/python -m benchmarks.benchmark_block_manager \
  --block-size 16 \
  --total-blocks 64 \
  --request-tokens 9,17,33,5,41,12
{
  "block_size": 16,
  "block_usage": {
    "allocated_tokens": 117,
    "block_utilization": 0.6647727272727273,
    "free_blocks": 53,
    "internal_fragmentation_tokens": 59,
    "reserved_tokens": 176,
    "used_blocks": 11
  },
  "contiguous_fixed_slot_baseline": {
    "internal_fragmentation_tokens": 129,
    "reserved_tokens": 246,
    "utilization": 0.47560975609756095
  },
  "fragmentation_tokens_saved_vs_contiguous": 70,
  "request_tokens": [
    9,
    17,
    33,
    5,
    41,
    12
  ]
}
```

模拟6个请求，每个请求的token数分别是9,17,33,5,41,12，Block size 16的情况下：

| **Request** | **实际 Tokens (**allocated_tokens**)** | **使用 Blocks (**used_blocks**)** | **预留容量 (**reserved_tokens**)** | **内部碎片 (**fragmentation**)** | **利用率** |
| ----------- | -------------------------------------- | --------------------------------- | ---------------------------------- | -------------------------------- | ---------- |
| Req A       | 9                                      | 1                                 | 16                                 | 7                                | 56.3%      |
| Req B       | 17                                     | 2                                 | 32                                 | 15                               | 53.1%      |
| Req C       | 33                                     | 3                                 | 48                                 | 15                               | 68.8%      |
| Req D       | 5                                      | 1                                 | 16                                 | 11                               | 31.3%      |
| Req E       | 41                                     | 3                                 | 48                                 | 7                                | 85.4%      |
| Req F       | 12                                     | 1                                 | 16                                 | 4                                | 75.0%      |

因此实际上：

| **指标**    | **数值** |
| ----------- | -------- |
| 实际 Tokens | 117      |
| 使用 Blocks | 11       |
| Block Size  | 16       |
| 预留容量    | 176      |
| 内部碎片    | 59       |
| 总体利用率  | 66.5%    |

结果里有个`contiguous_fixed_slot_baseline` 对对照组，按照最长的41去分配连续的空间，我们也计算一下：

| **Request** | **实际 Tokens** | **固定预留容量** | **内部碎片** | **利用率** |
| ----------- | --------------- | ---------------- | ------------ | ---------- |
| Req A       | 9               | 41               | 32           | 22.0%      |
| Req B       | 17              | 41               | 24           | 41.5%      |
| Req C       | 33              | 41               | 8            | 80.5%      |
| Req D       | 5               | 41               | 36           | 12.2%      |
| Req E       | 41              | 41               | 0            | 100%       |
| Req F       | 12              | 41               | 29           | 29.3%      |

整体是

| **指标**       | **数值** |
| -------------- | -------- |
| 实际 Tokens    | 117      |
| 请求数         | 6        |
| 每请求固定槽位 | 41       |
| 总预留容量     | 246      |
| 内部碎片       | 129      |
| 总体利用率     | 47.6%    |

拉到一个表里对比一下：

| **指标**    | **Paged Blocks** | **Fixed Contiguous** | **改善** |
| ----------- | ---------------- | -------------------- | -------- |
| 实际 Tokens | 117              | 117                  | —        |
| 预留容量    | 176              | 246                  | ↓ 70     |
| 内部碎片    | 59               | 129                  | ↓ 70     |
| 利用率      | 66.5%            | 47.6%                | ↑ 18.9%  |

很直观的看出来，有了分块（分页）的处理后，整体的显存利用率都得到提升了

# 总结

大块固定分配的内存（显存）块提升成按固定块去分配，虽然在单块里依然存在浪费的情况，但是范围局限在单个Block里了，这一点就已经将内存利用率提升上来了，另一点就是在一些请求结束后动态回收对应的内存用于分配给其他请求使用，又进一步提升利用率。

最后还记得我们最早v0.2的时候做了KV Cache，针对单个请求用Prefill去做KV Cache，但是实际上多个请求之间是有可能有一样的前缀KV Cache，我们后续就要继续做一个更接近生产级别的优化，前缀缓存Prefix Cache
