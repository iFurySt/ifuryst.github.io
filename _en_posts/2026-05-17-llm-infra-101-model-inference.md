---
layout: post
title: "LLM Infra 101 v0.0: Model Inference"
date: 2026-05-17T08:00:00+08:00
lang: en
translation_key: llm-infra-101-model-inference
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

This is the first episode of the series. The goal for this episode is simple: run a large model.

The code for this episode is at [https://github.com/iFurySt/nanoLLMServe/tree/release/v0.0.0](https://github.com/iFurySt/nanoLLMServe/tree/release/v0.0.0)

After model training is finished, what we get is a weights file. For open-source models, this is usually what gets released. More complete open source will also disclose the full training process in technical reports or related papers, to the point where anyone who reads it can reproduce it themselves. The first goal of infra is to run this model weights file.

Based on that, we can plan a few simple steps:

1. Download model weights from Hugging Face, which I will call hf from now on.
2. Load the model weights into GPU memory through code and run inference.
3. Use a one-shot CLI call, non-interactive, to input a prompt and get a result.

A very simple implementation.

# Model Selection

In general, infra needs to support many models and run inference tests on many kinds of cards. At the beginning, we will just use whatever we have at hand. We will first focus on inference on a single GPU, so the parameter count should not be too large. We will keep it under 10B parameters. Given that Qwen basically provides models across all parameter sizes, it is objectively the preferred choice at this stage. So we choose:

1. [Qwen/Qwen3-0.6B](https://huggingface.co/Qwen/Qwen3-0.6B)
2. [Qwen/Qwen3-1.7B](https://huggingface.co/Qwen/Qwen3-1.7B)
3. [Qwen/Qwen3-4B](https://huggingface.co/Qwen/Qwen3-4B)
4. [Qwen/Qwen3-8B](https://huggingface.co/Qwen/Qwen3-8B)

These model weights will be used for inference. When we open Files, we can see these files:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-llm-infra-101-model-inference/1779004380_1.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

| File                                | Purpose                                                                                                                                                                                        |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| .gitattributes                      | File-management config for git/hf                                                                                                                                                             |
| LICENSE                             | Model license                                                                                                                                                                                  |
| README.md                           | Model card, including model introduction, usage, limitations, sample code, and so on                                                                                                           |
| config.json                         | Model architecture config, such as layer count, hidden size, attention heads, vocabulary size, RoPE parameters, dtype, and so on. Transformers reads this file first when loading the model     |
| generation_config.json              | Default generation parameters, such as temperature: 0.6, top_p: 0.95, top_k: 20, do_sample: true, EOS/PAD token, and so on                                                                     |
| tokenizer.json                      | Tokenizer file, including tokenization model, rules, special tokens, and so on                                                                                                                  |
| tokenizer_config.json               | Extra tokenizer config, mainly including chat template, special tokens, max length, and so on. Qwen's chat format mainly lives here                                                            |
| vocab.json                          | Vocabulary for the BPE tokenizer, mapping tokens to ids                                                                                                                                        |
| merges.txt                          | BPE merge rules, determining how characters/subwords are gradually merged into tokens                                                                                                           |
| model.safetensors                   | Model weights file for 0.6B, in the safe tensor format                                                                                                                                         |
| model-00001-of-00005.safetensors etc. | Model weight shards for 8B. When files are too large, they are split into multiple shards                                                                                                      |
| model.safetensors.index.json        | Only needed for sharded models. It records which `.safetensors` shard each weight tensor is stored in, so the loader can stitch the full model back together                                   |

# Tokenizer

The tokenizer is used for tokenization. It converts the natural-language text we input into tokens. For example:

1. Input `Hello world`
2. Tokenize it into `["Hello", " world"]`
3. Convert it into token ids `[15496, 995]`

The core tokenizer definition lives in `tokenizer.json`. If it does not exist, the tokenizer will be rebuilt through `vocab.json` and `merges.txt`.

# Implementation

With a rough understanding of the principles, we can start implementing a version. First, look directly at the file structure:

```bash
.
├── benchmarks/
│   └── benchmark_generate.py    # v0 naive single-request generation benchmark, outputs latency and tokens/s
├── src/
│   └── nanollmserve/
│       ├── __init__.py          # package entry point, exposes version/basic package info
│       ├── api/                 # external API layer, later hosts the OpenAI-compatible HTTP interface
│       │   ├── __init__.py
│       │   ├── openai_server.py # v0.1 OpenAI-compatible HTTP server placeholder
│       │   └── protocol.py      # OpenAI-compatible request/response protocol model placeholder
│       ├── cache/               # data-structure boundary for KV cache and prefix cache
│       │   ├── __init__.py
│       │   ├── block_manager.py # block-based KV cache allocator placeholder
│       │   ├── kv_cache.py      # KV cache tensor/metadata management placeholder
│       │   ├── prefix_cache.py  # prefix cache lookup and eviction policy placeholder
│       │   └── radix_tree.py    # prefix cache radix tree index placeholder
│       ├── cli/                 # command-line entry layer, kept as a thin wrapper
│       │   ├── __init__.py
│       │   └── generate.py      # `nanollmserve-generate` style single-prompt generation CLI
│       ├── distributed/         # multi-process/multi-node coordination boundary
│       │   ├── __init__.py
│       │   ├── router.py        # cross-worker request routing placeholder
│       │   └── worker.py        # distributed worker process glue placeholder
│       ├── engine/              # request lifecycle and decode orchestration core
│       │   ├── __init__.py
│       │   ├── engine.py        # current core implementation: naive single-request decode loop
│       │   ├── request.py       # request state/lifecycle contract placeholder
│       │   └── scheduler.py     # batching/scheduling policy placeholder
│       ├── metrics/             # runtime stats and metrics export boundary
│       │   ├── __init__.py
│       │   ├── prometheus.py    # Prometheus exporter placeholder
│       │   └── stats.py         # engine/scheduler/cache stats data-structure placeholder
│       ├── model/               # model loading and model execution boundary
│       │   ├── __init__.py
│       │   └── hf_runner.py     # Hugging Face causal LM/tokenizer loading, device/dtype resolution
│       ├── sampling/            # logits processing and token selection
│       │   ├── __init__.py
│       │   ├── params.py        # sampling parameter contract placeholder
│       │   └── sampler.py       # greedy and temperature sampling implementation
│       ├── structured_output/   # schema/grammar constrained decoding boundary
│       │   └── __init__.py
│       └── worker/              # local execution worker boundary
│           ├── __init__.py
│           └── gpu_worker.py    # single-GPU worker execution placeholder
└── tests/
    ├── test_cli.py              # CLI arg parsing, main output, and stats behavior tests
    ├── test_engine.py           # generate_one decode, EOS, attention mask, and parameter validation tests
    ├── test_hf_runner.py        # device/dtype resolution and HF loading compatibility tests
    └── test_sampling.py         # greedy/temperature sampling and invalid input tests
```

Because we have long-term plans, and to make later iteration more elegant, we created some placeholder files and directories. After removing those, the actual effective changes for this version are:

```bash
.
├── benchmarks/
│   └── benchmark_generate.py # single-request naive generation benchmark, validates throughput, latency, tokens/s
├── pyproject.toml            # package config, dependencies, test config, and CLI entry point
├── README.md                 # current usage, v0 capability notes, and run examples
├── src/
│   └── nanollmserve/
│       ├── __init__.py       # package version/top-level package info
│       ├── cli/
│       │   ├── __init__.py
│       │   └── generate.py   # command-line generation entry: parse args, load model, call engine, print result/stats
│       ├── engine/
│       │   ├── __init__.py   # engine public exports
│       │   └── engine.py     # core naive decode loop: single prompt, autoregressive generation, EOS stop, timing stats
│       ├── model/
│       │   ├── __init__.py   # model public exports
│       │   └── hf_runner.py  # Hugging Face tokenizer/model loading, device/dtype resolution and compatibility handling
│       └── sampling/
│           ├── __init__.py   # sampling public exports
│           └── sampler.py    # token selection logic: greedy decoding and temperature sampling
└── tests/
    ├── test_cli.py           # CLI args, main call chain, stdout/stderr stats tests
    ├── test_engine.py        # generation loop, EOS, max token, attention mask, input validation tests
    ├── test_hf_runner.py     # device/dtype resolution, HF loading compatibility fallback, optional dependency isolation tests
    └── test_sampling.py      # greedy/temperature sampling and invalid logits/temperature tests
```

The implementation is very simple. It basically satisfies the minimum runnable path: CLI -> model loading -> Engine decode loop -> Sample. Next, let us look at what the actual inference process looks like.

# Inference

This time, there are only two things we need to focus on:

1. Model
2. Tokenizer

Let us use one inference process to see what happens overall. We trigger one inference through the following command:

```bash
(base) gpu-A100-05 nanoLLMServe # export MODEL=/data2/nanoLLMServe/models/Qwen3-8B
(base) gpu-A100-05 nanoLLMServe # CUDA_VISIBLE_DEVICES=0 PYTHONPATH=src /data/anaconda3/bin/python -m nanollmserve.cli.generate \
  --model "$MODEL" \
  --local-files-only \
  --prompt "Explain KV cache in one sentence." \
  --max-new-tokens 100 \
  --temperature 0 \
  --device cuda \
  --dtype bfloat16 \
  --show-stats
Loading checkpoint shards: 100%|███████████████████████████████████████████████████████████████████████████████████████| 5/5 [00:00<00:00, 136.32it/s]
 KV cache is a technique used in transformer models to store the keys and values of previous attention computations, allowing the model to efficiently process sequential data by reusing these cached values instead of recalculating them for each new input token.
KV cache is a technique used in transformer models to store the keys and values of previous attention computations, allowing the model to efficiently process sequential data by reusing these cached values instead of recalculating them for each new input token.
Okay, I need to explain what a
prompt_tokens=8 generated_tokens=100 elapsed_seconds=3.932 tokens_per_second=25.43 device=cuda dtype=bfloat16
```

Let me briefly explain what these parameters mean.

| Parameter                    | Meaning                                                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CUDA_VISIBLE_DEVICES=0       | Only let the program see GPU 0. We are focusing on a single card for now                                                                                                                                                                   |
| PYTHONPATH=src               | Add the repo's `src/` to Python's import path, making it convenient to run the source directly                                                                                                                                             |
| /data/anaconda3/bin/python   | Use conda's Python                                                                                                                                                                                                                         |
| -m nanollmserve.cli.generate | Run the command-line entry point as a module                                                                                                                                                                                               |
| --model "$MODEL"             | Specify the model path or model name on hf. Here we downloaded the offline model files in advance, so we set a local path earlier                                                                                                          |
| --local-files-only           | Use only existing local model files, without downloading from the internet                                                                                                                                                                 |
| --prompt "xxxx"              | The prompt given to the model. It is very bare for now; in practice, it is usually a combination like system prompt + user prompt                                                                                                          |
| --max-new-tokens 100         | Generate at most 100 new tokens. Right now we do not consume EOS or other stop tokens, so inference continues until 100 tokens are generated. You can see that even after it should have ended, it keeps repeating output until 100 tokens |
| --temperature 0              | Temperature is 0, using greedy decoding. Each step chooses the token with the highest probability. Repeated output is also partly caused by this parameter                                                                                 |
| --device cuda                | Put the model on a CUDA GPU                                                                                                                                                                                                                |
| --dtype bfloat16             | Use bfloat16 precision. dtype means data type, or what numeric format data uses for storage and computation                                                                                                                                |
| --show-stats                 | Output generation statistics, such as token counts, latency, tokens/s, device, and dtype                                                                                                                                                   |

The output result is:

```
 KV cache is a technique used in transformer models to store the keys and values of previous attention computations, allowing the model to efficiently process sequential data by reusing these cached values instead of recalculating them for each new input token.
KV cache is a technique used in transformer models to store the keys and values of previous attention computations, allowing the model to efficiently process sequential data by reusing these cached values instead of recalculating them for each new input token.
Okay, I need to explain what a
```

This is the inference process. This is the most primitive, bare model output. It feels very different from what we usually experience, because at this point there is no instruction and no system prompt to harness the model's output. We will gradually add these later.

As for the final line:

```
prompt_tokens=8 generated_tokens=100 elapsed_seconds=3.932 tokens_per_second=25.43 device=cuda dtype=bfloat16
```

That is the related stats. The input `Explain KV cache in one sentence.` was split by the tokenizer into 8 tokens. Then it actually generated 100 new tokens. It took 3.932 seconds. Throughput was 25.43 tokens per second.

With a global understanding in place, let us look at what happened during the important stages.

## 1. CLI Entry

`src/nanollmserve/cli/generate.py:31`

```python
loaded = load_model_and_tokenizer(
    args.model,
    device=args.device,
    dtype=args.dtype,
    local_files_only=args.local_files_only,
)
result = generate_one(
    loaded.model,
    loaded.tokenizer,
    args.prompt,
    max_new_tokens=args.max_new_tokens,
    temperature=args.temperature,
    seed=args.seed,
)
```

This does two things:

1. Load the model and tokenizer.
2. Hand the model and tokenizer to `generate_one` for one inference run.

## 2. Loading the Model and Tokenizer

`src/nanollmserve/model/hf_runner.py:49`

```python
resolved_device = resolve_device(device) # resolve_device("cuda") -> cuda
resolved_dtype = resolve_dtype(dtype, device=resolved_device) # resolve_dtype("bfloat16") -> torch.bfloat16

tokenizer = AutoTokenizer.from_pretrained( # load tokenizer
    model_path, # /data2/nanoLLMServe/models/Qwen3-8B
    local_files_only=local_files_only,
)

model = AutoModelForCausalLM.from_pretrained( # load model
    model_path,
    dtype=resolved_dtype,
    local_files_only=local_files_only,
)

model.to(resolved_device) # model.to("cuda") moves model weights into GPU0 memory
model.eval() # switch model to inference mode; there is also model.train() for training mode
```

Here we use hf's [transformers](https://github.com/huggingface/transformers) library to load the model and tokenizer, through `AutoTokenizer` and `AutoModelForCausalLM`. The tokenizer reads:

```
/data2/nanoLLMServe/models/Qwen3-8B/tokenizer_config.json
/data2/nanoLLMServe/models/Qwen3-8B/tokenizer.json
```

Only when fallback is needed will it read `vocab.json` and `merges.txt`. Otherwise, these two configs are enough.

Model loading reads the corresponding model architecture config and safetensor files:

```
config.json
model.safetensors.index.json
model-00001-of-00005.safetensors
model-00002-of-00005.safetensors
model-00003-of-00005.safetensors
model-00004-of-00005.safetensors
model-00005-of-00005.safetensors
```

In STDOUT we can see one line:

```
Loading checkpoint shards: 100%|███████| 5/5 [00:00<00:00, 136.32it/s]
```

This means it read 5 weight shards.

In addition, here we manually specified `bfloat16`. Like `float16`, it takes 2 bytes. Because the exponent bits and precision bits are smaller, the computation is lighter, while the quality loss is not large. Here we can roughly estimate the VRAM usage as:
*8B*2Bytes=8*10^9*2Bytes/1024^3=~16G\*

There are also some other memory costs.

Finally, we move the model that has already been loaded into CPU memory into GPU memory:

```python
model.to(resolved_device) # model.to("cuda") moves model weights into GPU0 memory
model.eval() # switch model to inference mode; there is also model.train() for training mode
```

That is, when we call `AutoModelForCausalLM.from_pretrained`, the model has already been loaded from the on-disk weight files into CPU memory and constructed according to the model architecture and config. So machine RAM is usually very large; otherwise loading the model would already be a problem. But because CPU compute parallelism is not enough and is too slow, the model still needs to be moved into GPU memory and computed in parallel by GPU compute cores.

| **Item**                         | **8× A100 80GB (typical DGX/HGX A100)**     | **8× H100 80GB (typical DGX/HGX H100)**    |
| -------------------------------- | ------------------------------------------- | ------------------------------------------ |
| GPU model                        | NVIDIA A100 80GB SXM4                       | NVIDIA H100 80GB SXM5                      |
| GPU count                        | 8                                           | 8                                          |
| Per-GPU memory                   | 80GB HBM2e                                  | 80GB HBM3                                  |
| Total GPU memory                 | 640GB                                       | 640GB                                      |
| Per-GPU memory bandwidth         | ~2.0 TB/s                                   | ~3.0 TB/s                                  |
| GPU peak power (TDP)             | ~400W                                       | ~700W                                      |
| GPU architecture                 | Ampere                                      | Hopper                                     |
| Tensor Core                      | 3rd generation                              | 4th generation                             |
| FP8 support                      | No                                          | Yes (Transformer Engine)                   |
| BF16 support                     | Yes                                         | Yes                                        |
| NVLink version                   | NVLink 3                                    | NVLink 4                                   |
| Per-GPU NVLink bandwidth         | 600 GB/s (bidirectional)                    | 900 GB/s (bidirectional)                   |
| NVSwitch                         | 6× NVSwitch                                 | 3rd-generation NVSwitch                    |
| GPU topology                     | all-to-all                                  | all-to-all                                 |
| GPU ↔ GPU communication          | NVSwitch Fabric                             | NVSwitch Fabric                            |
| PCIe generation                  | PCIe Gen4                                   | PCIe Gen5                                  |
| PCIe x16 one-way bandwidth       | ~32 GB/s                                    | ~64 GB/s                                   |
| PCIe x16 bidirectional bandwidth | ~64 GB/s                                    | ~128 GB/s                                  |
| CPU (official DGX typical)       | dual AMD EPYC 7742                          | dual Intel Xeon Sapphire Rapids            |
| CPU core count                   | 64C ×2 = 128 cores                          | ~56–60C ×2                                 |
| CPU architecture codename        | Rome                                        | Sapphire Rapids                            |
| System memory                    | 1TB–2TB DDR4                                | 2TB DDR5                                   |
| Memory bandwidth                 | DDR4                                        | DDR5 (higher)                              |
| Local NVMe                       | multiple NVMe SSDs                          | multiple Gen4/Gen5 NVMe                    |
| Network                          | Mellanox ConnectX-6                         | ConnectX-7                                 |
| InfiniBand                       | HDR 200Gbps                                 | NDR 400Gbps                                |
| RDMA                             | supported                                   | supported                                  |
| DPU                              | usually none                                | BlueField-3                                |
| Whole-machine power              | ~6.5–8 kW                                   | ~10–12 kW                                  |
| Cooling                          | high-pressure air cooling                   | high-pressure air cooling / liquid cooling |
| Typical use                      | GPT-3/LLaMA1-era training                   | GPT-4-era training/inference               |
| Typical bottleneck               | NVLink/memory bandwidth                     | power/cooling/cross-node communication     |
| Training characteristic          | more compute-bound                          | memory/communication-bound is more obvious |
| MoE support                      | possible but communication pressure is high | very suitable                              |
| Tensor Parallel                  | strong                                      | extremely strong                           |
| Inference KV Cache performance   | strong                                      | extremely strong                           |
| Typical price (whole machine)    | ~$120k–200k                                 | ~$250k–500k+                               |

Looking briefly at this table, we can see that machine RAM is often above 1T, which is no longer in the same dimension as the 32GB/64GB/128GB computers or servers we usually think of. Another thing worth noting here is the speed difference between PCIe, NVLink, and HBM.

| **Item**               | **NVIDIA A100 80GB SXM4** | **NVIDIA H100 80GB SXM5** |
| ---------------------- | ------------------------- | ------------------------- |
| HBM type               | HBM2e                     | HBM3                      |
| HBM bandwidth          | ~2 TB/s                   | ~3 TB/s                   |
| PCIe                   | Gen4 x16                  | Gen5 x16                  |
| PCIe one-way bandwidth | ~32 GB/s                  | ~64 GB/s                  |
| NVLink                 | NVLink 3                  | NVLink 4                  |
| NVLink bandwidth       | 600 GB/s                  | 900 GB/s                  |
| GPU topology           | NVSwitch all-to-all       | NVSwitch all-to-all       |
| Cross-machine network  | 200G IB                   | 400G IB                   |

```
         [ GPU Compute ]
                │
                │ ultra high speed
                ▼
        HBM3 ~3000 GB/s
                │
                │
      ┌─────────┴─────────┐
      │                   │
      ▼                   ▼
 NVLink 900 GB/s     PCIe 64 GB/s
      │                   │
      ▼                   ▼
 Other GPUs           CPU RAM
```

This is especially important in mature infra, because what infra solves is precisely communication. The most important problem in model inference today is not compute, but transfer speed. Much of the time is spent waiting for transfers, preventing compute utilization from being fully maximized. If efficiency is insufficient, there will be idle capacity. NVIDIA's moat now is also its ability to build machines such as **NVL72**, an entire rack that lets 72 GPUs collaborate as much like one GPU as possible.

| **Platform** | **HBM** | **NVLink** |
| ------------ | ------- | ---------- |
| A100         | 2 TB/s  | 600 GB/s   |
| H100         | 3 TB/s  | 900 GB/s   |
| GB200 NVL72  | 8 TB/s  | 1.8 TB/s   |

That is a side note, just to build a bit of global understanding in advance. Let us continue.

## 3. Encoding the Prompt and Moving It to GPU

`src/nanollmserve/engine/engine.py:68`

```python
encoded = tokenizer(prompt, return_tensors="pt")
encoded = _move_batch_to_device(encoded, device)
input_ids = encoded["input_ids"]
attention_mask = encoded.get("attention_mask")
```

What happens here is basically tokenizing the input prompt and then moving it to the GPU. The behavior is roughly like this:

```
"Explain KV cache in one sentence."
  -> tokenizer
  -> input_ids: shape [1, 8]
  -> attention_mask: shape [1, 8]
  -> .to(cuda)
```

After moving it to the GPU, it can be computed together with the model parameters that were already moved into GPU memory.

## 4. Inference

`src/nanollmserve/engine/engine.py:87`

```python
with torch.inference_mode():
    for _ in range(max_new_tokens):
        outputs = model(input_ids=input_ids, attention_mask=attention_mask)
        next_logits = outputs.logits[:, -1, :]
        next_token = sample_next_token(
            next_logits,
            temperature=temperature,
            generator=generator,
        )
```

The overall flow is like this. At the end of step 3, we got token ids, which are the first `input_ids` here:

```
Explain KV cache in one sentence.
input_ids = [[849, 735, 6634, 304, 825, 11652, 13, 151645]] # example only; actual token ids are not these
```

At this point, the shape is `[1, 8]`. A simple way to understand it is that there is one request, and the request contains 8 tokens. The same applies to `attention_mask`.

- `1 = batch size`, currently only one request. We will explain this in more detail later when we implement batched inference.
- `8 = sequence length`, this sentence was split into 8 tokens. By the way, model context length is also called sequence length.

Here we also need to understand what `attention_mask` is. It is actually a padding mask, not the causal mask inside the decoder. Suppose we now have 2 requests that need inference:

```
1. I love AI
2. Hello
```

If we run batched inference, to enable GPU parallelism, we need to pad them to the same length:

```
1. ["I", "love", "AI"]
2. ["Hello", "[PAD]", "[PAD]"]
```

At this point, the second request does not have enough tokens, so it is padded to the same length. But during actual inference, it is impossible to attend to the padded part, so we need a padding mask to mark it:

```python
attention_mask = [
  [1, 1, 1],
  [1, 0, 0]
]
```

This turns the attention scores for padded positions into negative infinity, so after softmax their probability is approximately 0, meaning they are completely ignored. This is more algorithmic detail, so I will not go deeper for now.

Continuing:

```python
outputs = model(input_ids=input_ids, attention_mask=attention_mask)
```

This sends the token sequence and padding mask into the model together. After the model forward pass, it outputs logits. Here, forward means one forward computation of the model, roughly including:

1. token -> embedding
2. passing through many layers, transformer layers
3. repeated attention/MLP computation
4. final logits output

The final logits are the prediction scores for every token. Their shape is `[batch, seq_len, vocab_size]`. Suppose the vocabulary size is 151936. Then here it appears as `[1, 8, 151936]`, a three-dimensional tensor. In plain language: there is 1 sample; each sample has 8 token positions; and each token position gives a score for 151936 tokens, all tokens in the vocabulary.

```
sample 0
  ├── position 0 -> 151936 scores
  ├── position 1 -> 151936 scores
  ├── position 2 -> 151936 scores
  ...
  └── position 7 -> 151936 scores


position 0: what may come after Explain
position 1: what may come after Explain KV
position 2: what may come after Explain KV cache
...
position 7: what may come after the full prompt
```

So even though we originally use 8 input tokens to generate the 9th token, we still need to compute logits for the previous 8 tokens once. This is so that when generating the 9th token, the model has the full context. This is also the capability expressed by the attention mechanism in Transformers.

Then we only care about the final token, so we only take the logits from the last position:

```python
next_logits = outputs.logits[:, -1, :]
```

Corresponding to:

```
[1, 8, 151936]
[:, -1, :]
```

We get:

```
[1, 151936]
```

This is the prediction score of the last position, position 7 if counting from 0, for every token in the vocabulary. With this, we can get the predicted next token. Here we enter a stage called sampling.

```python
  next_token = sample_next_token(
      next_logits,
      temperature=temperature, # 0
      generator=generator,
  )

  def sample_next_token(logits, *, temperature: float = 0.0, generator=None):
    """Return one next-token tensor from a `[batch, vocab]` logits tensor.

    `temperature <= 0` means greedy decoding. Positive temperatures sample from
    the softmax distribution, matching the first serving concept this milestone
    needs without adding top-k/top-p policy surface yet.
    """

    import torch

    if logits.ndim != 2:
        raise ValueError(f"expected logits with shape [batch, vocab], got {tuple(logits.shape)}")
    if not math.isfinite(temperature):
        raise ValueError("temperature must be finite")

    if temperature <= 0:
        return torch.argmax(logits, dim=-1, keepdim=True)

    probs = torch.softmax(logits / temperature, dim=-1)
    return torch.multinomial(probs, num_samples=1, generator=generator)
```

Sampling means sampling the next token from the probability distribution. There are many sampling methods. For example, top-1 means taking the token with the highest probability, which is one of the most basic methods. Here, when `temperature=0`, we use greedy decoding. We take `argmax(logits)`, the token with the highest probability. Greedy here means always taking the largest one each time, without considering later or longer-term consequences at all. Here `dim=-1` indicates that logits are on the final dimension, and `keepdim=True` means keeping the final dimension. The input `next_logits` has shape `[1, 151936]`; after `argmax`, the default shape would become `[1]`, but with the dimension kept it becomes `[1, 1]`. This allows the generated token to be concatenated back into `input_ids` later.

```python
input_ids = torch.cat([input_ids, next_token.to(input_ids.device)], dim=-1)
attention_mask = torch.cat([attention_mask, torch.ones_like(next_token)], dim=-1)
```

The original shape was `[1, 8]`. After generating one token, `next_token` has shape `[1, 1]`. After concatenation, it becomes `[1, 9]`. Here `next_token.to(input_ids.device)` moves it onto the same GPU card as `input_ids`. This is the core loop of LLM autoregressive generation.

After that, the new `input_ids` are sent into another forward pass, repeating again and again until 100 tokens have been generated. Here we can notice that every forward pass is a full forward pass:

```
round 1:
[1, 8]

round 2:
[1, 9]

round 3:
[1, 10]

round 100:
[1, 107]
```

That is, each round repeatedly computes attention for the entire sequence. It is easy to think that we should avoid recomputing previous work, so we can save a lot of compute and time. Exactly. This is where KV Cache comes from:

```
1st time: input the full prompt, compute and save KV cache
2nd time: only input the newly generated 1 token, reuse the previous KV cache
3rd time: only input the newly generated 1 token, continue reusing KV cache
...
```

This is also what we will do later.

The overall inference process is roughly:

```
prompt
  ↓
forward
  ↓
logits (score for each token)
  ↓
argmax (decoding strategy; argmax is only one strategy, there are others)
  ↓
select next token
  ↓
append it back to input (input_ids)
  ↓
continue forward
```

In real large-model inference, a more mature inference engine follows a process like this:

```
input_ids
    ↓
Transformer forward
    ↓
logits
    ↓
temperature scaling
    ↓
top-k / top-p filtering
    ↓
sampling / argmax
    ↓
next token
    ↓
append to KV cache + input_ids
    ↓
next decoding step
```

As we keep implementing and iterating more deeply, we will slowly move in this direction.

# Summary

Through this simple implementation, we already have a barely runnable version. Although it is very basic and the result is bad, it already helps us fully understand what infra needs to do when helping a model run inference. It also plants some points for future evolution.

You should know that all the main features in LLM infra such as vLLM/SGLang were not invented out of nowhere. Behind them are pain points and requirements pushing things forward, and groups of people with ideas and the ability to execute building different implementations. In essence, all of this serves increasingly large models doing inference across multiple GPUs and multiple devices, while continuously obtaining faster, more economical, and better inference.
