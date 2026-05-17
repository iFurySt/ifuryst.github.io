---
layout: post
title: "LLM Infra 101: 推理模型"
date: 2026-05-17T08:00:00+08:00
lang: zh
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

系列的第一集，这集需要达到的目标很简单：能跑一个大模型。

这一期的代码在 [https://github.com/iFurySt/nanoLLMServe/tree/release/v0.0.0](https://github.com/iFurySt/nanoLLMServe/tree/release/v0.0.0)

模型训练完得到的是一个权重文件，一般开源的也就是这个模型权重（开源更加完全的是会在技术报告或相关论文里去详细披露出自己怎么训练的全过程，谁看完都可以自己去复现的那种），Infra的首要目的就是能把这个模型权重文件跑起来！

基于此，我们规划出这么几个简单的步骤：

1. 从Hugging Face（以后都叫hf了）下载模型权重
2. 通过代码将模型权重加载到GPU显存里进行推理
3. 通过CLI单次调用（非交互）可以输入Prompt得到结果

很简单的实现

# 模型选择

一般Infra是需要支持很多模型的，也要在很多卡上去做推理测试，我们一开始，手头有什么就用什么了。我们会先着重在单GPU卡上去做推理，因此我们的参数量不会太大，我们控制在10B以内的参数，基于Qwen基本提供了全参数的模型，已经是现阶段首选的客观事实，我们就选择：

1. [Qwen/Qwen3-0.6B](https://huggingface.co/Qwen/Qwen3-0.6B)
2. [Qwen/Qwen3-1.7B](https://huggingface.co/Qwen/Qwen3-1.7B)
3. [Qwen/Qwen3-4B](https://huggingface.co/Qwen/Qwen3-4B)
4. [Qwen/Qwen3-8B](https://huggingface.co/Qwen/Qwen3-8B)

这么几个模型权重来推理。我们打开Files可以看到有这些文件

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-llm-infra-101-model-inference/1779004380_1.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
| 文件 | 作用 |
| --- | --- |
| .gitattributes | git/hf 的文件管理配置 |
| LICENSE | 模型许可证 |
| README.md | 模型卡，包含模型介绍、用法、限制、示例代码等 |
| config.json | 模型结构配置，比如层数、hidden size、attention heads、词表大小、RoPE 参数、dtype 等。Transformers 加载模型时会先读这个文件 |
| generation_config.json | 默认生成参数。比如 temperature: 0.6、top_p: 0.95、top_k: 20、do_sample: true、EOS/PAD token 等 |
| tokenizer.json | tokenizer文件，包含分词模型、规则、特殊token等 |
| tokenizer_config.json | tokenizer的额外配置，重点包括chat template、特殊token、最大长度等。Qwen聊天格式主要放在这里 |
| vocab.json | BPE tokenizer的词表，token到id的映射。 |
| merges.txt | BPE合并规则，决定字符/子词如何逐步合并成token。 |
| model.safetensors | 0.6B的模型权重文件，安全张量格式 |
| model-00001-of-00005.safetensors 等 | 8B的模型权重分片，文件太大时会拆成多个 shard |
| model.safetensors.index.json | 只在分片模型里需要，记录每个权重tensor存在哪个.safetensors分片里，加载器靠它拼回完整模型 |

# Tokenizer

用来分词的，也就是用来把我们输入的自然语言文本转成token，比如：

1. 输入Hello world
2. 分词成["Hello", " world"]
3. 转成token ids[15496, 995]

tokenizer核心定义在tokenizer.json里，如果没有的话会通过vocab.json和merges.txt去重建tokenizer

# 实现

大概有了原理后，我们就着手实现一版，直接看文件结构：

```bash
.
├── benchmarks/
│   └── benchmark_generate.py    # v0 naive 单请求生成性能基准，输出耗时和 tokens/s
├── src/
│   └── nanollmserve/
│       ├── __init__.py          # 包入口，暴露版本/基础包信息
│       ├── api/                 # 对外 API 层，后续承载 OpenAI-compatible HTTP 接口
│       │   ├── __init__.py
│       │   ├── openai_server.py # v0.1 OpenAI-compatible HTTP server 占位
│       │   └── protocol.py      # OpenAI-compatible 请求/响应协议模型占位
│       ├── cache/               # KV cache 与 prefix cache 相关数据结构边界
│       │   ├── __init__.py
│       │   ├── block_manager.py # block-based KV cache 分配器占位
│       │   ├── kv_cache.py      # KV cache tensor/metadata 管理占位
│       │   ├── prefix_cache.py  # prefix cache 查询与淘汰策略占位
│       │   └── radix_tree.py    # prefix cache radix tree 索引占位
│       ├── cli/                 # 命令行入口层，保持薄封装
│       │   ├── __init__.py
│       │   └── generate.py      # `nanollmserve-generate` 风格的单 prompt 生成 CLI
│       ├── distributed/         # 多进程/多节点协调边界
│       │   ├── __init__.py
│       │   ├── router.py        # 跨 worker 请求路由占位
│       │   └── worker.py        # 分布式 worker 进程胶水代码占位
│       ├── engine/              # 请求生命周期与 decode 编排核心
│       │   ├── __init__.py
│       │   ├── engine.py        # 当前核心实现：naive 单请求 decode loop
│       │   ├── request.py       # 请求状态/生命周期 contract 占位
│       │   └── scheduler.py     # batching/scheduling policy 占位
│       ├── metrics/             # 运行时统计与指标导出边界
│       │   ├── __init__.py
│       │   ├── prometheus.py    # Prometheus exporter 占位
│       │   └── stats.py         # engine/scheduler/cache stats 数据结构占位
│       ├── model/               # 模型加载与模型执行边界
│       │   ├── __init__.py
│       │   └── hf_runner.py     # Hugging Face causal LM/tokenizer 加载、device/dtype 解析
│       ├── sampling/            # logits 处理与 token 选择
│       │   ├── __init__.py
│       │   ├── params.py        # sampling 参数 contract 占位
│       │   └── sampler.py       # greedy 和 temperature sampling 实现
│       ├── structured_output/   # schema/grammar constrained decoding 边界
│       │   └── __init__.py
│       └── worker/              # 本地执行 worker 边界
│           ├── __init__.py
│           └── gpu_worker.py    # single-GPU worker execution 占位
└── tests/
    ├── test_cli.py              # CLI 参数解析、main 输出和 stats 行为测试
    ├── test_engine.py           # generate_one decode、EOS、attention mask、参数校验测试
    ├── test_hf_runner.py        # device/dtype 解析、HF 加载兼容性测试
    └── test_sampling.py         # greedy/temperature sampling 和异常输入测试
```

因为我们有长远的规划，为了后续能优雅的迭代，我们做了一些占位文件和目录，去掉那些后，我们保留本次真正有效改动的：

```bash
.
├── benchmarks/
│   └── benchmark_generate.py # 单请求 naive generation 基准脚本，验证吞吐、耗时、tokens/s
├── pyproject.toml            # 包配置、依赖、测试配置和 CLI entry point
├── README.md                 # 当前使用方式、v0 能力说明和运行示例
├── src/
│   └── nanollmserve/
│       ├── __init__.py       # 包版本/顶层包信息
│       ├── cli/
│       │   ├── __init__.py
│       │   └── generate.py   # 命令行生成入口：解析参数、加载模型、调用 engine、打印结果/统计
│       ├── engine/
│       │   ├── __init__.py   # engine 对外导出
│       │   └── engine.py     # 核心 naive decode loop：单 prompt、自回归生成、EOS 停止、计时统计
│       ├── model/
│       │   ├── __init__.py   # model 对外导出
│       │   └── hf_runner.py  # Hugging Face tokenizer/model 加载，device/dtype 解析与兼容处理
│       └── sampling/
│           ├── __init__.py   # sampling 对外导出
│           └── sampler.py    # token 选择逻辑：greedy decoding 和 temperature sampling
└── tests/
    ├── test_cli.py           # CLI 参数、main 调用链、stdout/stderr stats 测试
    ├── test_engine.py        # 生成循环、EOS、max token、attention mask、输入校验测试
    ├── test_hf_runner.py     # device/dtype 解析、HF 加载兼容 fallback、可选依赖隔离测试
    └── test_sampling.py      # greedy/temperature sampling 和异常 logits/temperature 测试
```

很简单的实现，基本满足了最小可运行链路：CLI→模型加载→Engine Decode循环→Sample。下面我们来看看实际的推理过程是怎样的

# 推理

这一次我们最需要关注的只有两个东西：

1. 模型
2. Tokenizer

我们用一次推理的过程来看看整体都发生了什么，我们通过以下命令来触发单次推理：

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

稍微解释一下这些参数都是什么意义
| 参数 | 含义 |
| --- | --- |
| CUDA_VISIBLE_DEVICES=0 | 只让程序看到第0张GPU，我们现在聚焦单卡 |
| PYTHONPATH=src | 把仓库的src/加到python import路径，方便直接运行源码 |
| /data/anaconda3/bin/python | 用conda的python |
| -m nanollmserve.cli.generate | 以模块方式运行命令行入口 |
| --model "$MODEL" | 指定模型路径或hf上的模型名，这边我们提前下载离线模型文件了，所以我们前面设置了路径 |
| --local-files-only | 只使用本地已有模型文件，不联网下载 |
| --prompt "xxxx" | 输入给模型的prompt，现在是很裸的，实际上一般会有system prompt+user prompt这种结合起来的 |
| --max-new-tokens 100 | 最多生成100个新 token，现在没有吃EOS之类的结束符，我们会一直推理到100个token才结束，所以实际上可以看到哪怕应该结束了还是重复在输出知道100个token |
| --temperature 0 | 温度为0，使用贪心解码（greedy decoding），每步选概率最高的token（重复输出也有这个参数的原因） |
| --device cuda | 把模型放到CUDA GPU上运行 |
| --dtype bfloat16 | 使用bfloat16精度（dtype=data type，数据用什么数值格式存储和计算） |
| --show-stats | 输出生成统计信息，比如token数、耗时、tokens/s、device、dtype |
然后输出的结果是

```plain text
 KV cache is a technique used in transformer models to store the keys and values of previous attention computations, allowing the model to efficiently process sequential data by reusing these cached values instead of recalculating them for each new input token.
KV cache is a technique used in transformer models to store the keys and values of previous attention computations, allowing the model to efficiently process sequential data by reusing these cached values instead of recalculating them for each new input token.
Okay, I need to explain what a
```

这就是推理过程，这个就是最原始最裸的模型输出，和我们平时感受差别很大，因为现在还没有任何的instruction，没有任何的system prompt来harness模型的输出，这些后续我们都会陆续加上

至于最后的

```plain text
prompt_tokens=8 generated_tokens=100 elapsed_seconds=3.932 tokens_per_second=25.43 device=cuda dtype=bfloat16
```

就是相关的统计信息，输入的`Explain KV cache in one sentence.` 被tokenizer切成了8个token；然后实际生成了100个新token；耗时3.932秒；吞吐是每秒25.43个token

有了全局的认知，我们来看看这期间重要的阶段发生了什么

## 1. CLI入口

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

这边就做了2件事情：

1. 加载模型和tokenizer
2. 把模型和tokenizer交给generate_one去做单次推理

## 2. 加载模型和Tokenizer

`src/nanollmserve/model/hf_runner.py:49`

```python
resolved_device = resolve_device(device) # resolve_device("cuda") -> cuda
resolved_dtype = resolve_dtype(dtype, device=resolved_device) # resolve_dtype("bfloat16") -> torch.bfloat16

tokenizer = AutoTokenizer.from_pretrained( # 加载tokenizer
    model_path, # /data2/nanoLLMServe/models/Qwen3-8B
    local_files_only=local_files_only,
)

model = AutoModelForCausalLM.from_pretrained( # 加载模型
    model_path,
    dtype=resolved_dtype,
    local_files_only=local_files_only,
)

model.to(resolved_device) # model.to("cuda") 把模型权重搬到GPU0卡显存内
model.eval() # 模型切换到推理模式，还有model.train()训练模式
```

我们这边采用了hf的[transformers](https://github.com/huggingface/transformers)库来加载模型和Tokenizer（AutoTokenizer和AutoModelForCausalLM）。其中tokenizer会去读取

```python
/data2/nanoLLMServe/models/Qwen3-8B/tokenizer_config.json
/data2/nanoLLMServe/models/Qwen3-8B/tokenizer.json
```

如果有需要fallback才会去读取`vocab.json`和`merges.txt`，否则这两个配置就足够了
模型加载则是读取对应的模型结构配置和safetensor文件：

```python
config.json
model.safetensors.index.json
model-00001-of-00005.safetensors
model-00002-of-00005.safetensors
model-00003-of-00005.safetensors
model-00004-of-00005.safetensors
model-00005-of-00005.safetensors
```

在STDOUT我们可以看到有输出一行

```python
Loading checkpoint shards: 100%|███████| 5/5 [00:00<00:00, 136.32it/s]
```

这个就是读取了5个权重分片。

另外这边我们手动制定了使用bfloat16，和float16一样都是占用2bytes（但是因为指数位和精度位更小，所以计算量更小，但是同时效果损失不大），这里我们可以估算大概（还有一些其他的消耗）的显存消耗为：
*8B*2Bytes=8*10^9*2Bytes/1024^3=~16G\*

最后就是把已经加载到CPU内存的模型送到GPU显存里

```python
model.to(resolved_device) # model.to("cuda") 把模型权重搬到GPU0卡显存内
model.eval() # 模型切换到推理模式，还有model.train()训练模式
```

也就是我们前面在做`AutoModelForCausalLM.from_pretrained` 的时候，模型已经从磁盘里的权重文件被加载到CPU内存里按模型结构和配置构建好了，所以整机的内存一般都很大，否则加载进来都是个问题。但是因为CPU计算并行度不够，太慢了，所以仍然需要把模型送到GPU显存里，在GPU的计算核心里并行的计算。
| **项目** | **8× A100 80GB（DGX/HGX A100 典型）** | **8× H100 80GB（DGX/HGX H100 典型）** |
| --- | --- | --- |
| GPU 型号 | NVIDIA A100 80GB SXM4 | NVIDIA H100 80GB SXM5 |
| GPU 数量 | 8 | 8 |
| 单卡显存 | 80GB HBM2e | 80GB HBM3 |
| 总 GPU 显存 | 640GB | 640GB |
| 单卡显存带宽 | ~2.0 TB/s | ~3.0 TB/s |
| GPU 峰值功耗（TDP） | ~400W | ~700W |
| GPU 架构 | Ampere | Hopper |
| Tensor Core | 第三代 | 第四代 |
| FP8 支持 | 无 | 有（Transformer Engine） |
| BF16 支持 | 有 | 有 |
| NVLink 版本 | NVLink 3 | NVLink 4 |
| 单 GPU NVLink 带宽 | 600 GB/s（双向） | 900 GB/s（双向） |
| NVSwitch | 6× NVSwitch | 第三代 NVSwitch |
| GPU 拓扑 | 全互联（all-to-all） | 全互联（all-to-all） |
| GPU ↔ GPU 通信 | NVSwitch Fabric | NVSwitch Fabric |
| PCIe 代际 | PCIe Gen4 | PCIe Gen5 |
| PCIe x16 单向带宽 | ~32 GB/s | ~64 GB/s |
| PCIe x16 双向带宽 | ~64 GB/s | ~128 GB/s |
| CPU（官方 DGX 典型） | 双路 AMD EPYC 7742 | 双路 Intel Xeon Sapphire Rapids |
| CPU 核心数 | 64C ×2 = 128 核 | ~56–60C ×2 |
| CPU 架构代号 | Rome | Sapphire Rapids |
| 系统内存 | 1TB–2TB DDR4 | 2TB DDR5 |
| 内存带宽 | DDR4 | DDR5（更高） |
| 本地 NVMe | 多块 NVMe SSD | 多块 Gen4/Gen5 NVMe |
| 网络 | Mellanox ConnectX-6 | ConnectX-7 |
| InfiniBand | HDR 200Gbps | NDR 400Gbps |
| RDMA | 支持 | 支持 |
| DPU | 通常无 | BlueField-3 |
| 单机整机功耗 | ~6.5–8 kW | ~10–12 kW |
| 散热 | 高压风冷 | 高压风冷/液冷 |
| 典型用途 | GPT-3/LLaMA1时代训练 | GPT-4时代训练/推理 |
| 典型瓶颈 | NVLink/显存带宽 | 电力/散热/跨节点通信 |
| 训练特点 | Compute-bound 较多 | Memory/Communication-bound 更明显 |
| MoE 支持 | 可以但通信压力大 | 非常适合 |
| Tensor Parallel | 强 | 极强 |
| 推理 KV Cache 性能 | 较强 | 极强 |
| 典型价格（整机） | ~$120k–200k | ~$250k–500k+ |
简单看这个表格，我们就能看到整机内存都是1T以上的这种级别，和我们认知里的电脑或者服务器里32GB/64GB/128GB已经不是一个纬度的了。另外这里值得留意的是PCIe、NVLINK和HBM的速度差异
| **项目** | **NVIDIA A100 80GB SXM4** | **NVIDIA H100 80GB SXM5** |
| --- | --- | --- |
| HBM 类型 | HBM2e | HBM3 |
| HBM 带宽 | ~2 TB/s | ~3 TB/s |
| PCIe | Gen4 x16 | Gen5 x16 |
| PCIe 单向带宽 | ~32 GB/s | ~64 GB/s |
| NVLink | NVLink 3 | NVLink 4 |
| NVLink 带宽 | 600 GB/s | 900 GB/s |
| GPU 拓扑 | NVSwitch 全互联 | NVSwitch 全互联 |
| 跨机网络 | 200G IB | 400G IB |

```python
         [ GPU Compute ]
                │
                │ 超高速
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

这个在成熟的Infra里尤其重要，因为Infra解决的正是通信问题，现在模型推理里最重要的问题不是算力，而是传输速度，很多时候都是在等待传输导致计算的利用率不能最大化拉满，效率不足就会有闲置。现在NVIDIA的护城河也是其做到诸如**NVL72**这种整机柜，让72张GPU尽可能像一张GPU一样协同工作
| **平台** | **HBM** | **NVLink** |
| --- | --- | --- |
| A100 | 2 TB/s | 600 GB/s |
| H100 | 3 TB/s | 900 GB/s |
| GB200 NVL72 | 8 TB/s | 1.8 TB/s |
题外话，就当提前了解有个全局的认知。我们继续

## 3. Prompt编码并送到GPU

`src/nanollmserve/engine/engine.py:68`

```python
encoded = tokenizer(prompt, return_tensors="pt")
encoded = _move_batch_to_device(encoded, device)
input_ids = encoded["input_ids"]
attention_mask = encoded.get("attention_mask")
```

这里基本上做的就是把输入的提示词去做tokenizer，然后送到GPU里，大概行为类似这样：

```python
"Explain KV cache in one sentence."
  -> tokenizer
  -> input_ids: shape [1, 8]
  -> attention_mask: shape [1, 8]
  -> .to(cuda)
```

搬到GPU后，就可以和前面已经搬到GPU显存里的模型参数一起做推理计算了

## 4. 推理

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

大体流程是这样的，第三步最后拿到的是token ids，也就是这里第一次的input_ids

```python
Explain KV cache in one sentence.
input_ids = [[849, 735, 6634, 304, 825, 11652, 13, 151645]] # 这边举例，实际的token ids不是这样
```

此时的shape是`[1, 8]` ，简单理解含义就是一条请求，请求里有8个token（attention_mask也是同理）

- `1 = batch size`，当前只有一个请求（之后我们做到batch推理的时候会更详细展开说明）
- `8 = sequence length`，这句话被切成了8个token（btw，模型上下文长度也是叫sequence length，或者说序列长度）

这里我们也会理解一下attention_mask这个东西，这个其实是Padding Mask，不是Decoder里的Causal Mask。假设现在有2个请求需要推理：

```python
1. I love AI
2. Hello
```

我们走batch推理，为了GPU并行，需要补齐，变成：

```python
1. ["I", "love", "AI"]
2. ["Hello", "[PAD]", "[PAD]"]
```

这个时候可以看到第二个请求的token数不够，被补齐成一样的长度了，但是实际推理中是不可能去关注补齐的那部分内容，所以需要一个填充掩码来标记

```python
attention_mask = [
  [1, 1, 1],
  [1, 0, 0]
]
```

这样实际计算中就会把attention score做成负无穷，softmax后的概率约等于0，也就是完全忽略。这边比较算法细节，我暂时不继续深入展开

继续看

```python
outputs = model(input_ids=input_ids, attention_mask=attention_mask)
```

这里就把token序列和填充掩码一起送入模型了，模型forward后会输出logits，这里的forward就是模型的一次前向计算，大概包含了：

1. token→embedding
2. 经过很多层（transformer layer）
3. attention/MLP不断计算
4. 最后输出logits

最后生成的logits其实就是得到的每个token的预测分数，shape是`[batch, seq_len, vocab_size]` ，词表vocab_size假设是151936，那么我么这边表现出来的是`[1, 8, 151936]` ，一个三维张量（tensor），白话讲就是：1个样本，每个样本里有8个token位置，每个token位置对151936个token（词表的所有token）都给出一个分数

```python
第0个样本
  ├── 第0个位置 -> 151936个分数
  ├── 第1个位置 -> 151936个分数
  ├── 第2个位置 -> 151936个分数
  ...
  └── 第7个位置 -> 151936个分数


位置 0：Explain 后面可能是什么
位置 1：Explain KV 后面可能是什么
位置 2：Explain KV cache 后面可能是什么
...
位置 7：完整 prompt 后面可能是什么
```

所以哪怕我们原来用8个输入的token去生成第9个token，我们仍然要计算一次前面的8个token的logits，这是为了在生成第9个token的时候拥有完整的上下文，这也是Transformer的注意力机制所表达的能力。

然后我们只关系最后的那个token，所以我们只取最后一个位置的logits

```python
next_logits = outputs.logits[:, -1, :]
```

对应到

```python
[1, 8, 151936]
[:, -1, :]
```

得到

```python
[1, 151936]
```

这个就是最后一个位置（从0开始，就是位置7）对于词表里所有的token的预测分数，有了这个我们就可以得到预测的下一个token了，这边我们要进入到一个叫做采样（sample）的阶段

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

采样也就是对下一个token做采样，意思是从概率分布中采样一个token，有很多种采样方式，比如top1，概率最高的那个token，这是一种最基础的方式。这里我们temperature=0的时候就走贪心解码（greedy decoding），我们`argmax(logis)` 取概率最高的那个token（这里贪心的意思就是每次都拿最大的，完全不考虑后续或者长远的情况）。这里的dim=-1指明logits在最后那个纬度，然后keepdim=True表示为最后保留维度（shape保持不变，前面输入的next_logits是`[1, 151936]`，argmax处理后默认shape会变为`[1]`，保留后是`[1, 1]`），因为这样后续就可以继续把生成的token拼接到input_ids里了

```python
input_ids = torch.cat([input_ids, next_token.to(input_ids.device)], dim=-1)
attention_mask = torch.cat([attention_mask, torch.ones_like(next_token)], dim=-1)
```

原来的`[1, 8]` ，生成一个token后next_token shape: `[1, 1]`，拼接后变成`[1, 9]` 了，这边有个`next_token.to(input_ids.device)` ，是把这个送到input_ids所在的GPU卡上，这是自回归生成（LLM autoregressive generation）的核心循环

之后就是再次把新的input_ids送入进行新一轮的forward，不断往复，直到生成100个token就结束了。然后这边我们可以注意到，在做forward的时候都是一次完整的forward：

```python
第 1 轮：
[1, 8]

第 2 轮：
[1, 9]

第 3 轮：
[1, 10]

第 100 轮：
[1, 107]
```

也就是每轮都会重复计算整段序列的attention，可以轻而易举的想到，我们之前的计算不要重复计算，这样就可以节省大量的算力和时间了，没错，这个就是KV Cache的由来了：

```python
第 1 次：输入完整 prompt，计算并保存 KV cache
第 2 次：只输入新生成的 1 个 token，复用前面的 KV cache
第 3 次：只输入新生成的 1 个 token，继续复用 KV cache
...
```

这个也是我们后面要去做的。

整个推理的过程大概如下：

```python
prompt
  ↓
forward
  ↓
logits（每个token的分数)
  ↓
argmax（decoding strategy，解码策略，argmax只是一种，还有其他）
  ↓
选出next token
  ↓
拼回输入（input_ids）
  ↓
继续forward
```

实际的大模型推理中，比较成熟的推理引擎会是这样的流程：

```python
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

后面随着我们持续深入去实现和迭代，我们也会慢慢往这个方向走的

# 总结

通过这样一个简单的实现，我们已经有一版勉强能跑的版本，虽然很基础，跑得效果很烂，但是这个已经能帮助我们完全理解一个Infra在帮助模型做推理的过程中需要做的事情，也帮我们埋了一些未来演进方向的点。

要知道vLLM/SGLang这种LLM Infra里的所有主要feature都不是平白无故的造出来的，背后都是有痛点和需求在推动，一批有想法有动手能力的人去做出不同的实现，本质还是服务于参数规模越来越的模型在多GPU、多设备上去做推理，且要持续获得更快、更经济和效果更好的推理
