---
layout: post
title: "LLM Infra 101 v0.1: API调用"
date: 2026-05-18T08:00:00+08:00
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

这一期的代码在 [https://github.com/iFurySt/nanoLLMServe/tree/release/v0.1.0](https://github.com/iFurySt/nanoLLMServe/tree/release/v0.1.0)

上一期过完，有了一个能通过CLI调用的，这一期我们做个新的特性，我们做一个兼容OpenAI的API调用接口，这样现有的大部分sdk都可以无缝接入了。大体上会支持这样的内容：

1. HTTP Server

2. OpenAI-Compatible endpoint

3. 支持stream参数，可以全量返回也可以流式返回

4. 支持chat接口，暂时不支持response接口

# 实现

这次改动的不多，基本上就是包装了API，相关改动情况：

```shell
.
└── src/
    └── nanollmserve/
        ├── api/
        │   ├── __init__.py        # API 包入口，占位导出用
        │   ├── openai_server.py   # OpenAI-compatible HTTP server：/v1/models、/v1/responses、/v1/chat/completions、/v1/completions
        │   └── protocol.py        # OpenAI-compatible 协议模型：请求/响应 schema、prompt 转换、usage/response 构造
        └── engine/
            └── engine.py          # 增加 streaming generation：GenerationStep、stream_generate_one，并让 generate_one 复用流式路径
```

新增接口如下：

| **接口**             | **用途**                                                             |
| -------------------- | -------------------------------------------------------------------- |
| /v1/models           | 返回当前 server 暴露的模型列表                                       |
| /v1/responses        | OpenAI 新推荐的 Responses API，支持 text-only create/stream/retrieve |
| /v1/chat/completions | 兼容传统 chat messages 格式                                          |
| /v1/completions      | 兼容 legacy prompt completion 格式                                   |

实现里关注Chat和Response API，一个原因是这两个接口都是主流使用，另一个是这两个接口是典型对比。比如现在很多AI Agent都接入Response了，因为可以走前缀缓存，命中缓存后，不管速度和费用都能得到收益

整体基本就是兼容OpenAI的接口协议，比如Chat Completion：

```json
{
  "model": "xxx",
  "messages": [{ "role": "user", "content": "hello" }]
}
```

Response类似：

```json
{
  "model": "xxx",
  "input": "hello"
}
```

之后就是数据转换，转成Engine能识别的格式。其他就没有太多值得展开讲的

# 推理

过一下整体的推理过程，首先是启动HTTP服务

```shell
CUDA_VISIBLE_DEVICES=0 PYTHONPATH=src /data/anaconda3/bin/python -m nanollmserve.api.openai_server \
  --model /data2/nanoLLMServe/models/Qwen3-8B \
  --served-model-name Qwen3-8B \
  --local-files-only \
  --host 127.0.0.1 \
  --port 18080 \
  --device cuda \
  --dtype bfloat16
```

启动后可以看看模型列表

```shell
curl -s http://127.0.0.1:18080/v1/models | jq .
```

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-18-llm-infra-101-v0-1-openai-compatible-api/1779115783_1.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

请求Response API

```shell
curl -sS http://127.0.0.1:18080/v1/responses \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "Qwen3-8B",
    "instructions": "Answer briefly.",
    "input": "Explain KV cache in one sentence.",
    "max_output_tokens": 100,
    "temperature": 0,
    "store": true
  }' | jq .
```

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-18-llm-infra-101-v0-1-openai-compatible-api/1779115783_2.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

Response API开启Stream流式返回

```shell
curl -sS http://127.0.0.1:18080/v1/responses \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "Qwen3-8B",
    "instructions": "Answer briefly.",
    "input": "Explain KV cache in one sentence.",
    "max_output_tokens": 100,
    "temperature": 0,
    "stream": true,
    "store": true
  }'
```

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-18-llm-infra-101-v0-1-openai-compatible-api/1779115784_3.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

尝试用resp id请求之前已经请求过的

```shell
curl -sS http://127.0.0.1:18080/v1/responses/resp-1770dd64b5d44d1bbd93fc7dc5857bda | jq .
```

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-18-llm-infra-101-v0-1-openai-compatible-api/1779115784_4.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

请求Chat Completion API

```shell
curl -sS http://127.0.0.1:18080/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "Qwen3-8B",
    "messages": [
      {"role": "user", "content": "Explain KV cache in one sentence."}
    ],
    "max_tokens": 100,
    "temperature": 0
  }' | jq .
```

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-18-llm-infra-101-v0-1-openai-compatible-api/1779115784_5.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

Chat Completion API开启stream流式返回

```shell
curl -sS http://127.0.0.1:18080/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "Qwen3-8B",
    "messages": [
      {"role": "user", "content": "Explain KV cache in one sentence."}
    ],
    "max_tokens": 100,
    "temperature": 0,
    "stream": true
  }'
```

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-18-llm-infra-101-v0-1-openai-compatible-api/1779115785_6.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

# 总结

这波很简单，包了一下API，没有太多东西需要讲。总体而言这些Infra对外其实也是一个HTTP Server，屏蔽掉下面模型调度推理的细节，调用方无需感知那么多，从最早的无状态化Chat Completion API慢慢过渡到现在有一些状态信息的Response API，背后也反应了行业在模型推理层面的变化。
