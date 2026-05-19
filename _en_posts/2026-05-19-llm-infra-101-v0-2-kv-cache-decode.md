---
layout: post
title: "LLM Infra 101 v0.2: KV Cache"
date: 2026-05-19T08:00:00+08:00
lang: en
translation_key: llm-infra-101-v0-2-kv-cache-decode
tags:
  - Blog
  - 微信公众号
  - Substack
categories: Blog
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

The code for this episode is at [https://github.com/iFurySt/nanoLLMServe/tree/release/v0.2.0](https://github.com/iFurySt/nanoLLMServe/tree/release/v0.2.0)

After the previous episode, we could call the model through an API. In this episode, we will add KV Cache support. In the first episode, we noticed that every forward pass repeatedly recalculates:

```plaintext
prompt
-> forward(prompt)
-> sample token1
-> forward(prompt + token1)
-> sample token2
-> forward(prompt + token1 + token2)
-> ...
```

Every sequence we feed in here gets recalculated from scratch each time, and the expensive part of Transformer computation is Attention:

```plaintext
Q = xW_Q
K = xW_K
V = xW_V
Attention(Q, K, V)
```

So when we do not have KV Cache, the rough process looks like this:

1. forward(prompt)

2. Compute Q/K/V for every token in the prompt

3. Compute Attention inside the prompt

4. Sample token1

5. forward(prompt+token1)

6. Compute Q/K/V for every token in the prompt

7. Compute Attention inside the prompt

8. Sample token2

9. forward(prompt+token1+token2)

10. Compute Q/K/V for every token in the prompt

11. Compute Attention inside the prompt

12. Sample token3

With KV Cache, the process becomes:

1. forward(prompt)

2. Compute Q/K/V for every token in the prompt

3. Compute Attention inside the prompt

4. Save K/V into KV Cache

5. Sample token1

6. forward(token1+past_kv, meaning the prompt's KV)

7. Compute only token1's Q/K/V

8. Read the prompt's K/V

9. Compute Attention(Q_token1, K_prompt+token1, V_prompt+token1)

10. Save token1's K/V

11. Sample token2

12. forward(token2+past_kv, meaning the KV for prompt+token1)

13. Compute only token2's Q/K/V

14. Read the K/V for prompt+token1

15. Compute Attention(Q_token2, K_prompt+token1+token2, V_prompt+token1+token2)

16. Save token2's K/V

17. Sample token3

In essence, KV Cache exists so later computation can reuse earlier results. Let us look at one step in an actual inference process:

```plaintext
Token
 ↓
Attention (looks at context)
 ↓
FFN (thinks by itself)
 ↓
Next layer
```

You can see that the K/V inside Attention are cached, but nothing inside the FFN is cached. That is because Attention computation depends on previous computation, while the FFN only computes on the current token itself through nonlinear transformations.

```plaintext
token3
 ↓
Linear Up Projection (increase dimensionality; higher-dimensional space has stronger expressive capacity)
 ↓
Activation (GELU / SwiGLU)
 ↓
Linear Down Projection (reduce dimensionality)
 ↓
output
```

This process only involves computation for token3 itself. The output FFN(hidden3) is used only once in the current layer and will not be used later, so there is no way to cache it.

Now that we understand the principle, let us look at the implementation.

# Implementation

The changed files are:

```shell
.
├── benchmarks/
│   └── benchmark_generate.py      # Adds KV cache vs v0.0 naive baseline comparison, outputs TTFT/TPOT
├── src/
│   └── nanollmserve/
│       ├── cli/
│       │   └── generate.py        # show-stats adds TTFT / TPOT
│       └── engine/
│           ├── engine.py          # Core change: prefill + decode + past_key_values reuse
│           └── request.py         # Adds GenerationRequestState to store per-request generation state
└── tests/
    ├── test_engine.py             # Verifies decode only feeds one token and reuses past_key_values
    ├── test_request_state.py      # Verifies request-state token statistics and TPOT
    └── test_benchmark_generate.py # Verifies benchmark summary fields and speedup calculation
```

## Prefill

`src/nanollmserve/engine/engine.py:160`

```python
model.eval()
with torch.inference_mode():
    prefill_start = perf_counter()
    outputs = model(input_ids=input_ids, attention_mask=state.attention_mask, use_cache=True)
    state.prefill_seconds = perf_counter() - prefill_start
    state.past_key_values = getattr(outputs, "past_key_values", None)
    if state.past_key_values is None:
        raise RuntimeError("model did not return past_key_values; KV cache decode requires use_cache support")
```

Here, `model` is the model object loaded through transformers:

```python
loaded = load_model_and_tokenizer(...)
result = generate_one(
    loaded.model,
    loaded.tokenizer,
    prompt,
    ...
)
```

After passing in `use_cache=True`, we ask the model to return `past_key_values` after the forward pass. During later decode steps, we pass this KV Cache back in again.

What we do here is the Prefill stage. Put simply, we process the full input prompt once and build the KV Cache. Later, we only need to compute Q for the new token, then reuse the previous KV Cache to compute Attention.

## Decode

`src/nanollmserve/engine/engine.py:179`

```python
next_token = _sample_from_outputs(outputs, temperature=temperature, generator=generator)
yield _record_step(
    tokenizer,
    state,
    next_token,
    eos_token_ids=eos_token_ids,
    start=start,
    max_new_tokens=max_new_tokens,
)
if state.finished:
    return

for _ in range(max_new_tokens - 1):
    decode_start = perf_counter()
    outputs = model(
        input_ids=next_token.to(input_ids.device),
        attention_mask=state.attention_mask,
        past_key_values=state.past_key_values,
        use_cache=True,
    )
    state.past_key_values = getattr(outputs, "past_key_values", None)
    if state.past_key_values is None:
        raise RuntimeError("model did not return past_key_values during decode")

    next_token = _sample_from_outputs(outputs, temperature=temperature, generator=generator)
    yield _record_step(
        tokenizer,
        state,
        next_token,
        eos_token_ids=eos_token_ids,
        start=start,
        max_new_tokens=max_new_tokens,
        decode_start=decode_start,
    )
    if state.finished:
        break
```

In the later loop, you can see that what goes in is no longer the continuously concatenated `input_ids`, but `next_token`, which is the token generated in the previous step. Then we bring along the previous KV through `past_key_values=state.past_key_values,`.

# Inference

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-19-llm-infra-101-v0-2-kv-cache-decode/1779196784_7.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

So this change is KV Cache reuse within a single request: after prefill, decode reuses the cache. That means we cannot hit the cache across multiple requests, so there is no way to demo that kind of reuse here. But the benchmark can show that `kv_cache_decode.mean_prefill_seconds` is nonzero.

```python
"elapsed_speedup": 1.066
"tpot_speedup": 1.073
```

The total elapsed time and TPOT (Time per Output Token) are both faster now. But because the input prompt is very short, the difference is not especially obvious.

# Summary

These are roughly the changes brought by introducing KV Cache. The code changes are not large, and they are relatively clean, because frameworks like transformers hide many implementation details from me.

Also, this KV Cache lives in GPU memory. It involves storing K/V for `every layer` and `every token`, so the size of KV Cache is approximately:

`2*L*T*H*dtype`

| **Parameter** | **Meaning**      |
| ------------- | ---------------- |
| L             | Number of layers |
| T             | Sequence length  |
| H             | Hidden size      |
| 2             | K+V              |

For example, if we do a simple calculation for Qwen3 32B:

2*64*128k*5120*2bytes/1024^3=~156.25GB

But in practice, Qwen3 uses GQA (attention heads are 40, kv heads are 8, head_dim is 128), so the actual size is around 33.5GB (this is where techniques like GQA start to matter).

You can see that during large-model inference, GPU memory gets heavily occupied by KV Cache. This is also an important problem that infra needs to solve. Many models now use techniques to reduce KV Cache. To list a few, at the model layer we have:

- GQA (Grouped Query Attention): this technique has many Q Heads but very few KV Heads, which can significantly reduce KV Cache

- MQA (Multi-Query Attention): more aggressive than GQA. All Q heads share the same set of KV, but the quality drops more

- MLA (Multi-head Latent Attention): a key direction for DeepSeek. It does not directly store the full KV, but stores compressed latent representations instead (KV Compression), then restores them when needed

- Sliding Window Attention: only looks at the most recent window, such as the latest 4k tokens, instead of the full 1M context

- Sparse Attention: not every pair of tokens attends to each other, for example only nearby tokens, a small number of key tokens, and some summary tokens

At the Inference Engine layer, we have:

- PagedAttention: vLLM's main feature, paging the KV cache

- Prefix Cache: share the KV for prompts with the same prefix, avoiding repeated prefill

- KV Quantization: do not store KV in bf16, store it as int8/int4 instead, though quantization also brings accuracy loss

- Distributed KV Cache: distribute KV across multiple GPUs, sharding by head/layer/sequence

- PD Disaggregation (Prefill-Decode Disaggregation): put Prefill and Decode on different machines, because the former is compute-bound while the latter is memory-bound. This can also be supported by different machine types

All of these methods are more or less solving KV Cache related problems, just from different angles. We will touch some of them later, and other valuable topics worth writing about will also get their own articles.
