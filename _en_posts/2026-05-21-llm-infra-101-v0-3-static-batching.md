---
layout: post
title: "LLM Infra 101 v0.3: Static Batching"
date: 2026-05-21T08:00:00+08:00
lang: en
translation_key: llm-infra-101-v0-3-static-batching
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

This is the next episode in the series. You can read the previous ones here:

1. [LLM Infra 101 v0.0: Model Inference](https://www.ifuryst.com/blog/2026/llm-infra-101-model-inference/)

2. [LLM Infra 101 v0.1: API Calls](https://www.ifuryst.com/blog/2026/llm-infra-101-v0-1-openai-compatible-api/)

3. [LLM Infra 101 v0.2: KV Cache](https://www.ifuryst.com/blog/2026/llm-infra-101-v0-2-kv-cache-decode/)

The code for this episode is at [https://github.com/iFurySt/nanoLLMServe/tree/release/v0.3.1](https://github.com/iFurySt/nanoLLMServe/tree/release/v0.3.1)

In the previous episode, we developed an understanding of KV Cache and implemented it. Now we will look at another problem. At the moment, whenever we receive a request, we process it on its own, and then process the next request on its own. In actual production, however, this causes problems such as low throughput, high latency, and poor resource utilization.

Handling one request at a time is essentially serial processing. A large portion of the GPU's compute capacity sits idle, and every request performs prefill independently. So naturally, we introduce batching optimizations. This lets us process multiple requests in parallel, improve overall GPU utilization, and batch memory and operator scheduling as well.

There are two core approaches to batching:

- Static Batching: the more traditional form of batching, but very helpful for understanding the underlying mechanism.

- Continuous Batching: the technique used by mainstream infrastructure today.

This episode focuses on Static Batching. In the next one, we will move on to Continuous Batching.

The idea behind Static Batching is to process a fixed batch of requests at a time, forwarding the entire batch together. It looks roughly like this:

```plaintext
req1
req2
req3
↓
form a fixed batch
↓
forward together
↓
wait for the entire batch to finish
↓
process the next batch
```

For comparison, this is what we had before:

```python
timeline →

Req A ───── GPU forward ─────
Req B                     ───── GPU forward ─────
Req C                                         ───── GPU forward ─────
```

And this is what we have now:

```python
              ┌───────────────┐
Req A ───────▶│               │
Req B ───────▶│   Batch=3     │───▶ GPU Forward
Req C ───────▶│               │
              └───────────────┘
```

# Implementation

The changes involve these files:

```bash
.
├── src/
│   └── nanollmserve/
│       ├── api/
│       │   ├── openai_server.py    # Responses subset alignment: extend service-layer interface behavior and routing
│       │   └── protocol.py         # Protocol model updates: response-subset fields and consolidated request/response structures
│       └── engine/
│           └── engine.py           # Add a static batching path and scheduling on top of the existing generate_one
└── tests/
    ├── test_benchmark_generate.py   # Benchmark summaries and regression coverage for static/response scenarios
    ├── test_engine.py               # Engine behavior regression tests, including batching and state paths
    └── test_openai_server.py        # API regression tests after OpenAI compatibility changes, including the Responses subset
```

## Batching

Previously we only had `generate_one(model, tokenizer, prompt, ...)`. This time we added `generate_batch(model, tokenizer, prompts, ...)`, so the call now takes a group of prompts:

```python
results = generate_batch(
    model,
    tokenizer,
    ["hello", "world"],
    max_new_tokens=32,
    temperature=0.0,
)
```

We did not connect `generate_batch` to the API and CLI, however, because we are about to implement Continuous Batching. This is just a transitional step.

Because a group of prompts comes in here, their lengths may differ:

```plaintext
A input_ids: [101, 102]
B input_ids: [201, 202, 203, 204]
```

The tokenizer therefore needs padding enabled:

```python
encoded = tokenizer(
    prompts,
    return_tensors="pt",
    padding=True,
)
```

After padding, the result looks like this:

```plaintext
A input_ids: [101, 102, 0, 0]
A attention_mask: [1, 1, 0, 0]

B input_ids: [201, 202, 203, 204]
B attention_mask: [1, 1, 1, 1]
```

We actually covered this once in the first chapter. At the time, we did not have a batching mechanism, so the default batch size was 1. Now we have multiple items in a batch.

## Batch Prefill

We implemented prefill before, but it only handled a single request:

```plaintext
prompt -> model -> past_key_values
```

Now it becomes batch prefill:

```plaintext
[prompt A, prompt B, prompt C] -> model -> batch past_key_values
```

The first forward pass is now batched. The underlying mechanism was already there, so only one small adjustment is needed. We previously took the logits at index `-1`, but that position may now be padding:

```python
def _select_last_token_logits(logits, attention_mask):
    indices = torch.clamp(attention_mask.sum(dim=1) - 1, min=0)
    batch = torch.arange(logits.size(0), device=logits.device)
    return logits[batch, indices, :]
```

We now use `attention_mask` to locate the last real token, because the mask contains exactly that information.

## Batch Decode

Decode is the same. The mechanism already supported a batch. Before, we had:

```python
input_ids = [[last_token]]
```

Now we have:

```python
input_ids = [
  [last_token_for_A],
  [last_token_for_B],
  [last_token_for_C],
]
```

At each step, it generates the next token for every request in the batch:

```python
step 1: A generates one token, B generates one token, C generates one token
step 2: A generates one token, B generates one token, C generates one token
step 3: ...
```

But because the sequences have different actual lengths, some requests finish earlier:

```python
Req A → 10 tokens
Req B → 500 tokens
Req C → 50 tokens

Req A: finished
Req B: running
Req C: running
```

In Static Batching, a request that reaches EOS first is marked as finished, and no more tokens are appended to its `generated_token_ids`. But now a request inside the batch has ended, leaving a hole in GPU utilization:

```python
batch = [EMPTY, B, C]
[ _, B, C ]

batch = [EMPTY, B, EMPTY]
[ _, B, _ ]
```

GPU compute utilization gets lower and lower toward the end, eventually degrading back to a single request. At the same time, the VRAM slot is not released, wasting memory:

```python
# step1: GPU0 KV Memory
┌────┬────┬────┐
│ A  │ B  │ C  │
└────┴────┴────┘

# step2: GPU0 KV Memory
┌────┬────┬────┐
│idle│ B  │ C  │
└────┴────┴────┘

# step3: GPU0 KV Memory
┌────┬────┬────┐
│idle│ B  │idle│
└────┴────┴────┘
```

This is exactly what we will solve in the next chapter on Continuous Batching! The rough idea is that whoever finishes gets out, and whoever arrives fills the vacancy. We will not expand on that here.

# Inference

This time, once again, we mainly observe the results in the benchmark:

```json
(base) gpu-A100-05 nanoLLMServe # for BS in 1 2 4 8; do
  CUDA_VISIBLE_DEVICES=0 PYTHONPATH=src /data/anaconda3/bin/python -m benchmarks.benchmark_generate \
    --model /data2/nanoLLMServe/models/Qwen3-8B \
    --prompt "Explain static batching in one sentence." \
    --max-new-tokens 64 \
    --runs 5 \
    --warmup 1 \
    --batch-size "$BS" \
    --device cuda \
    --dtype bfloat16 \
    --local-files-only \
    --skip-naive-baseline
done
Loading checkpoint shards: 100%|██████████████| 5/5 [00:00<00:00, 142.39it/s]
{
  "batch_size": 1,
  "device": "cuda",
  "dtype": "bfloat16",
  "kv_cache_decode": {
    "generated_tokens": [64, 64, 64, 64, 64],
    "mean_decode_seconds": 1.8507717087864877,
    "mean_elapsed_seconds": 1.9322640344500541,
    "mean_prefill_seconds": 0.030887942016124725,
    "mean_tokens_per_second": 33.12221489162687,
    "mean_tpot_seconds": 0.029377328710896627,
    "mean_ttft_seconds": 0.03308003842830658
  },
  "model": "/data2/nanoLLMServe/models/Qwen3-8B",
  "prompt_tokens": 8,
  "runs": 5,
  "warmup": 1
}
Loading checkpoint shards: 100%|██████████████| 5/5 [00:00<00:00, 139.83it/s]
{
  "batch_size": 2,
  "device": "cuda",
  "dtype": "bfloat16",
  "kv_cache_decode": {
    "generated_tokens": [64, 64, 64, 64, 64],
    "mean_decode_seconds": 1.8655244752764701,
    "mean_elapsed_seconds": 1.9476028025150298,
    "mean_prefill_seconds": 0.03145704716444016,
    "mean_tokens_per_second": 32.86332616672236,
    "mean_tpot_seconds": 0.02961149960756302,
    "mean_ttft_seconds": 0.03360582888126373
  },
  "model": "/data2/nanoLLMServe/models/Qwen3-8B",
  "prompt_tokens": 8,
  "runs": 5,
  "static_batch": {
    "batch_size": 2,
    "generated_tokens": [64, 64, 64, 64, 64, 64, 64, 64, 64, 64],
    "mean_batch_elapsed_seconds": 1.9898763984441756,
    "mean_batch_tokens_per_second": 64.32565239699788,
    "mean_decode_seconds": 1.9065125167369843,
    "mean_generated_tokens": 64,
    "mean_prefill_seconds": 0.03188993483781814,
    "mean_prompt_tokens": 8,
    "mean_tpot_seconds": 0.03026210344026959,
    "mean_ttft_seconds": 0.034097179770469666
  },
  "warmup": 1
}
Loading checkpoint shards: 100%|██████████████| 5/5 [00:00<00:00, 141.49it/s]
{
  "batch_size": 4,
  "device": "cuda",
  "dtype": "bfloat16",
  "kv_cache_decode": {
    "generated_tokens": [64, 64, 64, 64, 64],
    "mean_decode_seconds": 1.8458494618535042,
    "mean_elapsed_seconds": 1.9274740874767304,
    "mean_prefill_seconds": 0.031040719151496886,
    "mean_tokens_per_second": 33.204527220435416,
    "mean_tpot_seconds": 0.029299197807198477,
    "mean_ttft_seconds": 0.033210942149162294
  },
  "model": "/data2/nanoLLMServe/models/Qwen3-8B",
  "prompt_tokens": 8,
  "runs": 5,
  "static_batch": {
    "batch_size": 4,
    "generated_tokens": [64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64],
    "mean_batch_elapsed_seconds": 1.9469317257404328,
    "mean_batch_tokens_per_second": 131.49626546592532,
    "mean_decode_seconds": 1.8595415592193603,
    "mean_generated_tokens": 64,
    "mean_prefill_seconds": 0.030785535275936127,
    "mean_prompt_tokens": 8,
    "mean_tpot_seconds": 0.029516532686021592,
    "mean_ttft_seconds": 0.033043819665908816
  },
  "warmup": 1
}
Loading checkpoint shards: 100%|██████████████| 5/5 [00:00<00:00, 141.55it/s]
{
  "batch_size": 8,
  "device": "cuda",
  "dtype": "bfloat16",
  "kv_cache_decode": {
    "generated_tokens": [64, 64, 64, 64, 64],
    "mean_decode_seconds": 1.8693151980638505,
    "mean_elapsed_seconds": 1.9508710712194444,
    "mean_prefill_seconds": 0.031239084899425507,
    "mean_tokens_per_second": 32.80601897231402,
    "mean_tpot_seconds": 0.02967166981053731,
    "mean_ttft_seconds": 0.0333852082490921
  },
  "model": "/data2/nanoLLMServe/models/Qwen3-8B",
  "prompt_tokens": 8,
  "runs": 5,
  "static_batch": {
    "batch_size": 8,
    "generated_tokens": [64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64],
    "mean_batch_elapsed_seconds": 1.989836023747921,
    "mean_batch_tokens_per_second": 257.34328723459373,
    "mean_decode_seconds": 1.8920533761382103,
    "mean_generated_tokens": 64,
    "mean_prefill_seconds": 0.031170780956745147,
    "mean_prompt_tokens": 8,
    "mean_tpot_seconds": 0.030032593272035085,
    "mean_ttft_seconds": 0.03355635851621628
  },
  "warmup": 1
}
(base) gpu-A100-05 nanoLLMServe #
```

Let's interpret the results. We ran four scenarios with batch sizes of 1, 2, 4, and 8:

| **Batch** | **batch elapsed** | **total tokens/s** | **equivalent tokens/s per request** |
| --------- | ----------------- | ------------------ | ----------------------------------- |
| 1         | ~1.93s            | ~33.1 tok/s        | ~33.1 tok/s                         |
| 2         | ~1.99s            | ~64.3 tok/s        | ~32.2 tok/s                         |
| 4         | ~1.95s            | ~131.5 tok/s       | ~32.9 tok/s                         |
| 8         | ~1.99s            | ~257.3 tok/s       | ~32.2 tok/s                         |

As we can see, throughput increased. With a single request, throughput was 33 tokens/s. With eight requests in a batch, total system throughput reached 257 tokens/s. In other words, while each request received roughly the same throughput, running inference in parallel produced a huge increase in the system's overall throughput. That is the improvement batching gives us!

# Summary

This time we discussed batching. The motivation for this feature is to improve overall system throughput and reduce API call latency from an infrastructure perspective. Batching also improves GPU utilization.

Static Batching still leaves some problems, however. Because the batch is fixed, completed requests continue to be carried through each forward pass. The GPU must also retain the KV Cache corresponding to those completed requests, and it cannot free that memory until every request in the batch has finished, reducing VRAM utilization. We will solve all of these issues in the next chapter on Continuous Batching.
