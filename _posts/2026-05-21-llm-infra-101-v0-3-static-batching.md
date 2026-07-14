---
layout: post
title: "LLM Infra 101 v0.3: 静态批处理"
date: 2026-05-21T08:00:00+08:00
lang: zh
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

系列的第二集，前面的可以看：

1. [LLM Infra 101 v0.0: 推理模型](https://www.ifuryst.com/blog/2026/llm-infra-101-model-inference/)

2. [LLM Infra 101 v0.1: API调用](https://www.ifuryst.com/blog/2026/llm-infra-101-v0-1-openai-compatible-api/)

3. [LLM Infra 101 v0.2: KV Cache](https://www.ifuryst.com/blog/2026/llm-infra-101-v0-2-kv-cache-decode/)

这一期的代码在 [https://github.com/iFurySt/nanoLLMServe/tree/release/v0.3.1](https://github.com/iFurySt/nanoLLMServe/tree/release/v0.3.1)

上期过完我们对于KV Cache已经有了认知和实现了，现在我们要继续看一个问题，我们现在每次收到请求是把这个请求单独处理，下个请求也是单独处理，但是实际生产中这样会带来一些问题诸如吞吐低、时延高、资源利用率低这些问题。

因为每次请求一个请求，可以理解为是串行的处理，GPU算力空闲率高，并且每个请求独立做prefill。因此自然而然我们就会做一些批量（Batching）的优化动作，这样可以并行处理多个请求，提高整体的GPU利用率，也能批量化内存和算子调度。

Batching这块核心就是两种：

- 静态批处理（Static Batching）：相对传统的Batching，但是对于我们理解机制原理很有帮助

- 连续批处理（Continuous Batching）：现在主流的infra采用的技术

我们这次主要针对Static Batching，下一集会推进到Continuous Batching。

Static Batching的原理是，一次固定处理一批请求，整批一起forward，大概如下：

```plaintext
req1
req2
req3
↓
组成一个固定 batch
↓
一起 forward
↓
等整个 batch 全部结束
↓
再处理下一批
```

对比一下，原来是这样的

```python
时间轴 →

Req A ───── GPU forward ─────
Req B                     ───── GPU forward ─────
Req C                                         ───── GPU forward ─────
```

现在是

```python
              ┌───────────────┐
Req A ───────▶│               │
Req B ───────▶│   Batch=3     │───▶ GPU Forward
Req C ───────▶│               │
              └───────────────┘
```

# 实现

改动涉及的文件：

```bash
.
├── src/
│   └── nanollmserve/
│       ├── api/
│       │   ├── openai_server.py    # Responses 子集对齐：服务层接口行为和路由处理扩展
│       │   └── protocol.py         # 协议模型更新：响应子集相关字段、请求/响应结构收敛
│       └── engine/
│           └── engine.py           # 在现有 generate_one 的基础上引入静态批处理路径与调度
└── tests/
    ├── test_benchmark_generate.py   # benchmark 汇总项与静态/响应场景回归覆盖
    ├── test_engine.py               # engine 行为回归（含批处理/状态路径）
    └── test_openai_server.py        # OpenAI 兼容层改造后的接口回归（含 Responses 子集）
```

## Batching

原来只有`generate_one(model, tokenizer, prompt, ...)` ，这次新增了`generate_batch(model, tokenizer, prompts, ...)` ，现在调用变成了一组prompt

```python
results = generate_batch(
    model,
    tokenizer,
    ["hello", "world"],
    max_new_tokens=32,
    temperature=0.0,
)
```

但是我们没有把generate_batch对接到API和CLI里，因为马上我们就要做Continuous Batching了，这边就做一个过渡

因为这边prompt进来是一组的，prompt长度可能都不一样：

```plaintext
A input_ids: [101, 102]
B input_ids: [201, 202, 203, 204]
```

因此tokenizer需要打开Padding

```python
encoded = tokenizer(
    prompts,
    return_tensors="pt",
    padding=True,
)
```

padding后会变为类似这样的：

```plaintext
A input_ids: [101, 102, 0, 0]
A attention_mask: [1, 1, 0, 0]

B input_ids: [201, 202, 203, 204]
B attention_mask: [1, 1, 1, 1]
```

这个其实我们第一章的时候已经说过一次了，当时我们没有batching机制，所以当时默认bacth 1，现在就会有多个batch了

## Batch Prefill

之前我们做了prefill，不过当时针对的是单个请求：

```plaintext
prompt -> model -> past_key_values
```

现在变成了batch prefill

```plaintext
[prompt A, prompt B, prompt C] -> model -> batch past_key_values
```

第一次forward变成了batch，这个其实之前也都有，所以机制上是已经有了，只不过有个小地方需要调整，原来logits是从-1取的，但是现在-1可能是padding，所以需要调整一下

```python
def _select_last_token_logits(logits, attention_mask):
    indices = torch.clamp(attention_mask.sum(dim=1) - 1, min=0)
    batch = torch.arange(logits.size(0), device=logits.device)
    return logits[batch, indices, :]
```

现在是根据attention_mask来找最后一个真实token的位置，因为掩码里有对应的信息

## batch decode

decode也是一样，原来已经有batch的机制了：

```python
input_ids = [[last_token]]
```

现在是

```python
input_ids = [
  [last_token_for_A],
  [last_token_for_B],
  [last_token_for_C],
]
```

现在会在某个step里分别去生成batch里的请求的下一个token

```python
step 1: A生成一个token，B生成一个 token，C生成一个token
step 2: A生成一个token，B生成一个 token，C生成一个token
step 3: ...
```

但是因为实际序列都不一样长，有一些请求会更早结束

```python
Req A → 10 tokens
Req B → 500 tokens
Req C → 50 tokens

Req A: finished
Req B: running
Req C: running
```

在Static Batching里，先遇到EOS结束的请求会标记成finished，后续不会再往它的generated_token_ids里追加token了。但是这个batch里已经有请求结束了，GPU就会出现空洞的情况：

```python
batch = [EMPTY, B, C]
[ _, B, C ]

batch = [EMPTY, B, EMPTY]
[ _, B, _ ]
```

这样GPU计算的利用率到后面是越来越少的，也就是退化回单条请求。但是同时显存的slot并不会释放，造成了显存的浪费

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

这个其实也是我们下一章Continuous Batching要解决的！（大体解决思路是谁结束了谁滚蛋，谁来了谁补位）这边我们先不展开

# 推理

这次我们基本也是在bench里观测一下

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
    "generated_tokens": [
      64,
      64,
      64,
      64,
      64
    ],
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
    "generated_tokens": [
      64,
      64,
      64,
      64,
      64
    ],
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
    "generated_tokens": [
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64
    ],
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
    "generated_tokens": [
      64,
      64,
      64,
      64,
      64
    ],
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
    "generated_tokens": [
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64
    ],
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
    "generated_tokens": [
      64,
      64,
      64,
      64,
      64
    ],
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
    "generated_tokens": [
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64,
      64
    ],
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

解读一下，跑了4次，分别是batch为1、2、4、8的场景

| **Batch** | **batch elapsed** | **total tokens/s** | **单请求等效 tokens/s** |
| --------- | ----------------- | ------------------ | ----------------------- |
| 1         | ~1.93s            | ~33.1 tok/s        | ~33.1 tok/s             |
| 2         | ~1.99s            | ~64.3 tok/s        | ~32.2 tok/s             |
| 4         | ~1.95s            | ~131.5 tok/s       | ~32.9 tok/s             |
| 8         | ~1.99s            | ~257.3 tok/s       | ~32.2 tok/s             |

可以看出，吞吐是变多了，单个请求的时候是33tokens/s，8个请求一批的时候，系统整体的吞吐达到了257token/s，也就是每个请求得到的吞吐一样的情况下，并行的去推理导致系统整体吞吐量得到的极大的提升。这个就是批处理带来的提升！

# 总结

这一波聊了Batching技术，这个特性的出发点就是从infra的角度去提升系统整体的吞吐量并减少接口调用时延。因为batch了，所以GPU的利用率也得到了提升。

但是Static Batching也留下了一下问题，比如固定批次，导致已经结束的req也还是不断被带着一起forward，GPU的显存也要保留已经结束的req对应的KV Cache等不能释放，需要等到这批请求都结束后才能被释放，显存利用率降低了。这些都会在下一章Continuous Batching里解决
