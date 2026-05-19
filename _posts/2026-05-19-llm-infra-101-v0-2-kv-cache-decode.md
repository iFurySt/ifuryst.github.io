---
layout: post
title: "LLM Infra 101 v0.2: KV Cache"
date: 2026-05-19T08:00:00+08:00
lang: zh
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

系列的第二集，前面的可以看：

1. [LLM Infra 101 v0.0: 推理模型](https://www.ifuryst.com/blog/2026/llm-infra-101-model-inference/)

2. [LLM Infra 101 v0.1: API调用](https://www.ifuryst.com/blog/2026/llm-infra-101-v0-1-openai-compatible-api/)

这一期的代码在 [https://github.com/iFurySt/nanoLLMServe/tree/release/v0.2.0](https://github.com/iFurySt/nanoLLMServe/tree/release/v0.2.0)

上一期过完，能通过API调用模型了。这期我们来支持KV Cache。在第一集的时候我们发现，每次forward 的时候都会重复计算：

```plaintext
prompt
-> forward(prompt)
-> 采样 token1
-> forward(prompt + token1)
-> 采样 token2
-> forward(prompt + token1 + token2)
-> ...
```

这里每次推入的序列都会重新计算一遍，Transformer的计算就贵在Attention的计算：

```plaintext
Q = xW_Q
K = xW_K
V = xW_V
Attention(Q, K, V)
```

所以当我们没有KV缓存的时候，大概流程是这样的：

1. forward(prompt)

2. 计算prompt里每个token的Q/K/V

3. 计算prompt内部的Attention

4. 采样得到token1

5. forward(prompt+token1)

6. 计算prompt里每个token的Q/K/V

7. 计算prompt内部的Attention

8. 采样得到token2

9. forward(prompt+token1+token2)

10. 计算prompt里每个token的Q/K/V

11. 计算prompt内部的Attention

12. 采样得到token3

如果有了KV Cache，那流程会是这样的：

1. forward(prompt)

2. 计算prompt里每个token的Q/K/V

3. 计算prompt内部的Attention

4. 保存K/V到KV Cache

5. 采样得到token1

6. forward(token1+past_kv(也就是prompt的))

7. 只计算token1的Q/K/V

8. 读取prompt的K/V

9. 计算Attention(Q_token1, K_prompt+token1, V_prompt+token1)

10. 保存token1的K/V

11. 采样得到token2

12. forward(token2+past_kv(也就是prompt+token1的))

13. 只计算token2的Q/K/V

14. 读取prompt+token1的K/V

15. 计算Attention(Q_token2, K_prompt+token1+token2, V_prompt+token1+token2)

16. 保存token2的K/V

17. 采样得到token3

本质上KV Cache就是为了后续计算可以重复利用，我们来看一个实际推理过程中的环节：

```plaintext
Token
 ↓
Attention（看上下文）
 ↓
FFN（自己思考）
 ↓
下一层
```

可以看到Attention里的K/V都Cache里，但是FFN里没有任何Cache的，这个是因为Attention的计算都是依赖于之前计算的，但是FFN都是针对当前token自己去做计算（非线性变换）的

```plaintext
token3
 ↓
Linear Up Projection（升维，高纬空间有更复杂的表达能力）
 ↓
Activation (GELU / SwiGLU)
 ↓
Linear Down Projection（降维）
 ↓
output
```

这个过程中只涉及到token3本身的计算，输出的FFN(hidden3)只会在当前layer使用一次，后续就没用了，所以没办法做Cache

知道了原理后，来看看实现

# 实现

改动文件涉及这些：

```shell
.
├── benchmarks/
│   └── benchmark_generate.py      # 增加 KV cache vs v0.0 naive baseline 对比，输出 TTFT/TPOT
├── src/
│   └── nanollmserve/
│       ├── cli/
│       │   └── generate.py        # show-stats 新增 TTFT / TPOT
│       └── engine/
│           ├── engine.py          # 核心改动：prefill + decode + past_key_values 复用
│           └── request.py         # 新增 GenerationRequestState，保存单请求生成状态
└── tests/
    ├── test_engine.py             # 验证 decode 阶段只喂单 token，且复用 past_key_values
    ├── test_request_state.py      # 验证 request state 的 token 统计和 TPOT
    └── test_benchmark_generate.py # 验证 benchmark 汇总字段和 speedup 计算
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

这边的model是基于transformers加载进来的模型对象

```python
loaded = load_model_and_tokenizer(...)
result = generate_one(
    loaded.model,
    loaded.tokenizer,
    prompt,
    ...
)
```

传入`use_cache=True` 参数后，会要求模型forward后返回`past_key_values` ，后续decode的时候再把这个KV Cache传回去。

这里做的就是预填充Prefill，简单说就是把传入的prompt完整的处理一遍，建立KV Cache，后续就只要做新的token的Q计算，然后就可以服用之前的KV Cache做Attention的计算了

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

后续的循环这里，可以看到进入的已经不再是不断拼接的input_ids了，而是`next_token` ，也就是前一次生成的token，然后会通过`past_key_values=state.past_key_values,`带上前面的KV

# 推理

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-19-llm-infra-101-v0-2-kv-cache-decode/1779196784_7.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

因此这次改动是单个请求内的KV Cache Reuse，prefill后decode复用，所以没办法在多个请求之间命中缓存，就没办法做那种演示了，但是bench是可以看出来`kv_cache_decode.mean_prefill_seconds`是非0

```python
"elapsed_speedup": 1.066
"tpot_speedup": 1.073
```

现在总耗时和TOPT（Time per Output Token）都变快了，但是因为输入的prompt很短，没有更明显的差距体现

# 总结

这些大概就是引入KV Cache带来的变化，代码改动不多，也相对简洁，因为transformers这类框架帮我屏蔽了很多实现细节。

另外这里的KV Cache在GPU显存里，会涉及到`每层` 和`每个token` 都要存K/V，KV Cache的大小近似于：

`2*L*T*H*dtype`

| **参数** | **含义**        |
| -------- | --------------- |
| L        | layer 数        |
| T        | sequence length |
| H        | hidden size     |
| 2        | K+V             |

比如我们简单算一个Qwen3 32B的：

2*64*128k*5120*2bytes/1024^3=~156.25GB

但是实际上Qwen3走了GQA（attention heads是40，kv heads是8，head_dim是128），所以实际大概会是33.5GB左右（GQA这些技术的意义来了）

可以看出大模型在推理的时候，显存会被大量的KV Cache占满！这个也是Infra里需要解决的一个重要课题。现在很多模型使用一些技术来降低KV Cache，列举几个，比如模型层可以做的有：

- GQA（Grouped Query Attention）这种技术，Q Heads很多KV Heads很少，这样可以大量降低KV Cache

- MQA（Multi-Query Attention）：比GQA更激进，所有的Q共享同一组KV，但是效果会下降比较多

- MLA（Multi-head Latent Attention）：是DeepSeek很关键的方向，不直接存完整的KV，而是存压缩的latent（KV Compression），需要的时候再恢复

- Sliding Window Attention：只看最近的窗口，比如看最近4k，而不是完整的1M上下文

- Sparse Attention：不是所有的token都两两attention（比如只关注附近的token、少量关键的token以及一些summary token等）

Inference Engine层可以做的有：

- PagedAttention：vllm主要的特性，kv cache做分页

- Prefix Cache：共享相同前缀的prompt的kv，不重复做prefill

- KV Quantization：KV不存bf16，改成存int8/int4，但是伴随量化也会带来精度下降

- Distributed KV Cache：KV分布到多GPU，按head/layer/sequence去做shard

- PD分离（Prefill-Decode Disaggregation）：Prefill和Decode分不同机器，因为前者是Compute-bound型，后者是Memory-bound型，这也可以有不同的机器支撑

这些手段或多或少都在解决KV Cache相关的问题，只不过关注的角度不太一样。后续我们也会接触到里面的某些内容，其他的有价值值得写的也会单独有文章来聊
