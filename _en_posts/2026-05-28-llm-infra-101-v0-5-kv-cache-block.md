---
layout: post
title: "LLM Infra 101 v0.5: Block-Based KV Cache Management"
date: 2026-05-28T08:00:00+08:00
lang: en
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

> **Note:** This article was translated for me by AI. I wrote the original in Chinese. I never use AI to write my articles, because that would cost me my own expression; my freedom to express myself is always the most valuable part of my work. So if you can read Chinese, I recommend reading the Chinese version, where you will get the most original and unfiltered version. That said, technological progress exists to give us more convenience, so I will continue using AI to translate my writing into multiple languages, allowing valuable content to reach more people.

This is the sixth episode in the series. You can read the previous ones here:

1. [LLM Infra 101 v0.0: Model Inference](https://www.ifuryst.com/blog/2026/llm-infra-101-model-inference/)

2. [LLM Infra 101 v0.1: API Calls](https://www.ifuryst.com/blog/2026/llm-infra-101-v0-1-openai-compatible-api/)

3. [LLM Infra 101 v0.2: KV Cache](https://www.ifuryst.com/blog/2026/llm-infra-101-v0-2-kv-cache-decode/)

4. [LLM Infra 101 v0.3: Static Batching](https://www.ifuryst.com/blog/2026/llm-infra-101-v0-3-static-batching/)

5. [LLM Infra 101 v0.4: Continuous Batching](https://www.ifuryst.com/blog/2026/llm-infra-101-v0-4-continuous-batching/)

The code for this episode is at [https://github.com/iFurySt/nanoLLMServe/tree/release/v0.5.0](https://github.com/iFurySt/nanoLLMServe/tree/release/v0.5.0)

We have already completed the Continuous Batching implementation. This time, we will go a step further and build a block-based management model for KV Cache, laying the foundation for a complete Paged Attention implementation later.

Previously, we allowed requests to enter and leave a batch dynamically. One major problem remains: requests have different sequence lengths and therefore occupy different amounts of KV Cache. If we reserve one large contiguous KV Cache region for every request, a great deal of VRAM is wasted. For example:

```python
Request A: 200-token prompt, 100 tokens ultimately generated  → needs KV for 300 tokens
Request B: 4,000-token prompt, 1,000 tokens ultimately generated → needs KV for 5,000 tokens
Request C: 50-token prompt, 20 tokens ultimately generated → needs KV for 70 tokens

Req A actually uses 300  / 8000 reserved → a lot of waste
Req B actually uses 5000 / 8000 reserved → acceptable
Req C actually uses 70   / 8000 reserved → enormous waste
```

Anyone with a deep understanding of traditional software development will probably find this familiar. It maps directly to paging in an operating system: the OS abstracts memory into pages, and those pages do not need to be stored contiguously in physical memory. vLLM's Paged Attention follows the same idea. It divides allocated VRAM into blocks, reducing fragmentation and unnecessary consumption. This is why the underlying principles always come back around. Do not stop at the surface. Once you understand the fundamentals, you can work backward from them in different application scenarios instead of memorizing each case like an exam answer—and it is much more fun. Our block-based management is one part of that. The old layout looked like this:

```python
Req A:
[.................... 8000 token buffer ....................]

Req B:
[.................... 8000 token buffer ....................]

Req C:
[.................... 8000 token buffer ....................]
```

The request and VRAM layout now becomes:

```python
Req A:
[block][block]

Req B:
[block][block][block][block][block][block]

Req C:
[block]
```

KV is now allocated in fixed-size blocks/pages, and blocks return to the pool when a request finishes. VRAM utilization improves immediately, while the allocation can grow dynamically and on demand.

With the basic idea clear, let's look at the implementation.

# Implementation

```python
.
├── benchmarks/
│   └── benchmark_block_manager.py      # New benchmark for block-based KV cache fragmentation
├── src/
│   └── nanollmserve/
│       ├── cache/
│       │   ├── __init__.py             # Export block manager-related types
│       │   └── block_manager.py        # Core: KVBlockManager / block table / usage metrics
│       └── engine/
│           └── engine.py               # Integrate allocate / append / release into the generation lifecycle
└── tests/
    ├── test_block_manager.py           # Tests for block allocation, append, release, and overallocation
    ├── test_benchmark_block_manager.py # Tests for benchmark summary fields
    └── test_engine.py                  # Tests for the block lifecycle during engine generation
```

These are the relevant changes. The core addition is `KVBlockManager`.

## KV Block

First, we introduce a Block unit:

```python
@dataclass(frozen=True)
class KVBlock:
    block_id: int        # == blocks.index
    capacity_tokens: int # == block_size
```

`KVBlock` is a fixed-size token block used to hold tokens.

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

By default, each `KVBlock` can hold 16 tokens, and its ID simply corresponds to the block's index in the complete list of blocks.

We also add a table describing the relationship between a request and its Blocks:

```python
@dataclass
class RequestBlockTable:
    request_id: str
    block_ids: list[int] = field(default_factory=list)
    token_count: int = 0
```

For example:

```python
req-a:
  token_count = 33
  block_ids = [0, 1, 2]
```

This means the KV Cache for `req-a` is mapped to three blocks and contains 33 tokens in total.

## KV Block Manager

With these two definitions, we can allocate blocks based on each request and its token count. A manager is needed to oversee the lifecycle of every block—from allocating it to a request, to reclaiming it, to destroying it entirely. All of this is handled by `KVBlockManager`.

Following the complete flow, we first call this when a request arrives:

```python
def _allocate_prompt_blocks(
    kv_block_manager: KVBlockManager | None,
    request_id: str,
    prompt_tokens: int,
) -> None:
    if kv_block_manager is not None:
        kv_block_manager.allocate(request_id, prompt_tokens)
```

Internally:

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

It calculates how many blocks are needed from the token count:

```python
9 tokens  -> ceil(9 / 16)  = 1 block
17 tokens -> ceil(17 / 16) = 2 blocks
33 tokens -> ceil(33 / 16) = 3 blocks
```

It then checks the Free Pool for enough blocks. This is a very basic version: initialization allocates `total_blocks` blocks up front, with no management for dynamically adding more later. It assigns the available blocks to the request and records the relationship in the corresponding table.

```python
free_block_ids = [0, 1, 2, 3, 4]
request_tables = {}

# becomes

free_block_ids = [3, 4]
request_tables = {
  "req-a": block_ids=[0, 1, 2], token_count=33
}
```

After Decode generates a token, we call:

```python
def _append_generated_block_token(
    kv_block_manager: KVBlockManager | None,
    request_id: str,
) -> None:
    if kv_block_manager is not None:
        kv_block_manager.append_tokens(request_id, 1)
```

Internally:

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

Basically, we tell the Manager that one token has been added. It checks whether another block is needed and, if so, whether a free block is available:

```python
req-a: 48 tokens -> 49 tokens

previously 3 blocks
now needs 4 blocks
append one block
```

When the request finishes, its blocks are released:

```python
def _release_blocks(kv_block_manager: KVBlockManager | None, request_ids: list[str]) -> None:
    if kv_block_manager is None:
        return
    for request_id in reversed(request_ids):
        kv_block_manager.release(request_id)
```

The request is removed directly from the Block Table, and its blocks return to the Free Pool:

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

That covers the complete KV Cache Block lifecycle. At a high level, it looks like this:

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

With this mechanism, Continuous Batching can now release a request's Blocks as soon as it completes, instead of waiting for the entire Batch to finish:

```python
step 0: short-0 running
step 1: short-0 finished, late-1 running
       -> release short-0 blocks immediately
step 2: late-1 running
...
```

# Inference

We will again use a benchmark to observe the Blocks. Here is what the metrics mean:

| **Field**                     | **Meaning**                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------ |
| used_blocks                   | Number of blocks currently occupied by requests                               |
| free_blocks                   | Number of blocks currently free                                               |
| allocated_tokens              | Number of tokens actually needed by requests                                  |
| reserved_tokens               | Token capacity actually reserved by blocks—that is, their `block_size`         |
| internal_fragmentation_tokens | Token capacity wasted inside blocks                                           |
| block_utilization             | allocated_tokens / reserved_tokens                                            |

For example:

```python
block_size = 16
req-a = 9 tokens
```

One block is needed, so:

```python
allocated_tokens = 9
reserved_tokens = 16
internal_fragmentation_tokens = 7
utilization = 9 / 16
```

Utilization is only about 56%. Now let's look at the benchmark results.

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

This simulates six requests with 9, 17, 33, 5, 41, and 12 tokens respectively, using a Block size of 16:

| **Request** | **Actual Tokens (**allocated_tokens**)** | **Blocks Used (**used_blocks**)** | **Reserved Capacity (**reserved_tokens**)** | **Internal Fragmentation** | **Utilization** |
| ----------- | ---------------------------------------- | -------------------------------- | ------------------------------------------- | -------------------------- | --------------- |
| Req A       | 9                                        | 1                                | 16                                          | 7                          | 56.3%           |
| Req B       | 17                                       | 2                                | 32                                          | 15                         | 53.1%           |
| Req C       | 33                                       | 3                                | 48                                          | 15                         | 68.8%           |
| Req D       | 5                                        | 1                                | 16                                          | 11                         | 31.3%           |
| Req E       | 41                                       | 3                                | 48                                          | 7                          | 85.4%           |
| Req F       | 12                                       | 1                                | 16                                          | 4                          | 75.0%           |

So in practice:

| **Metric**           | **Value** |
| -------------------- | --------- |
| Actual Tokens        | 117       |
| Blocks Used          | 11        |
| Block Size           | 16        |
| Reserved Capacity    | 176       |
| Internal Fragmentation | 59      |
| Overall Utilization  | 66.5%     |

The results include a `contiguous_fixed_slot_baseline` control. It allocates contiguous space according to the longest request, 41 tokens. Let's calculate that too:

| **Request** | **Actual Tokens** | **Fixed Reserved Capacity** | **Internal Fragmentation** | **Utilization** |
| ----------- | ----------------- | --------------------------- | -------------------------- | --------------- |
| Req A       | 9                 | 41                          | 32                         | 22.0%           |
| Req B       | 17                | 41                          | 24                         | 41.5%           |
| Req C       | 33                | 41                          | 8                          | 80.5%           |
| Req D       | 5                 | 41                          | 36                         | 12.2%           |
| Req E       | 41                | 41                          | 0                          | 100%            |
| Req F       | 12                | 41                          | 29                         | 29.3%           |

Overall:

| **Metric**                | **Value** |
| ------------------------- | --------- |
| Actual Tokens             | 117       |
| Number of Requests        | 6         |
| Fixed Slot per Request    | 41        |
| Total Reserved Capacity   | 246       |
| Internal Fragmentation    | 129       |
| Overall Utilization       | 47.6%     |

Putting them into one table for comparison:

| **Metric**           | **Paged Blocks** | **Fixed Contiguous** | **Improvement** |
| -------------------- | ---------------- | -------------------- | --------------- |
| Actual Tokens        | 117              | 117                  | —               |
| Reserved Capacity    | 176              | 246                  | ↓ 70            |
| Internal Fragmentation | 59             | 129                  | ↓ 70            |
| Utilization          | 66.5%            | 47.6%                | ↑ 18.9%         |

It is immediately clear that block-based, or paged, processing improves overall VRAM utilization.

# Summary

We upgraded from allocating large, fixed regions of memory—or VRAM—to allocating fixed-size blocks. Although waste still exists inside an individual block, it is now confined to that one Block, which alone improves memory utilization. We can also dynamically reclaim the memory associated with completed requests and allocate it to other requests, improving utilization even further.

Finally, remember the KV Cache we built for a single request back in v0.2, using Prefill? Different requests may actually share the same KV Cache prefix. Next, we will continue with an optimization closer to production-grade systems: Prefix Cache.
