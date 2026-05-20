---
layout: post
title: "LLM Infra 101 v0.1: API Calls"
date: 2026-05-18T08:00:00+08:00
lang: en
translation_key: llm-infra-101-v0-1-openai-compatible-api
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

This is the second episode in the series. You can read the previous one here:

1. [LLM Infra 101 v0.0: Model Inference](https://www.ifuryst.com/blog/2026/llm-infra-101-model-inference/)

The code for this episode is at [https://github.com/iFurySt/nanoLLMServe/tree/release/v0.1.0](https://github.com/iFurySt/nanoLLMServe/tree/release/v0.1.0)

After the previous episode, we had something that could be called through the CLI. In this episode, we will build a new feature: an OpenAI-compatible API interface, so most existing SDKs can connect to it seamlessly. At a high level, it will support:

1. HTTP Server

2. OpenAI-compatible endpoint

3. Support for the `stream` parameter, so it can return either a full response or a streaming response

4. Support for the chat interface, with no support for the responses interface for now

# Implementation

There are not many changes this time. It is basically an API wrapper. The relevant changes are:

```shell
.
└── src/
    └── nanollmserve/
        ├── api/
        │   ├── __init__.py        # API package entry point, used as a placeholder export
        │   ├── openai_server.py   # OpenAI-compatible HTTP server: /v1/models, /v1/responses, /v1/chat/completions, /v1/completions
        │   └── protocol.py        # OpenAI-compatible protocol models: request/response schema, prompt conversion, usage/response construction
        └── engine/
            └── engine.py          # Adds streaming generation: GenerationStep, stream_generate_one, and makes generate_one reuse the streaming path
```

The newly added endpoints are:

| **Endpoint**         | **Purpose**                                                                         |
| -------------------- | ----------------------------------------------------------------------------------- |
| /v1/models           | Returns the list of models exposed by the current server                            |
| /v1/responses        | OpenAI's newly recommended Responses API, supports text-only create/stream/retrieve |
| /v1/chat/completions | Compatible with the traditional chat messages format                                |
| /v1/completions      | Compatible with the legacy prompt completion format                                 |

The implementation focuses on the Chat and Responses APIs. One reason is that both are mainstream interfaces. Another is that they make for a typical comparison. For example, many AI Agents now connect to Responses, because it can use prefix caching. Once the cache is hit, both speed and cost can benefit.

Overall, this is basically compatibility with OpenAI's interface protocol. For example, Chat Completion:

```json
{
  "model": "xxx",
  "messages": [{ "role": "user", "content": "hello" }]
}
```

Responses is similar:

```json
{
  "model": "xxx",
  "input": "hello"
}
```

After that, it is just data conversion: turning the request into a format the Engine can understand. There is not much else worth expanding on.

# Inference

Let us go through the overall inference process. First, start the HTTP service:

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

After it starts, we can check the model list:

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

Request the Responses API:

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

Enable streaming responses for the Responses API:

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

Try requesting a previous response by `resp id`:

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

Request the Chat Completion API:

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

Enable streaming responses for the Chat Completion API:

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

# Summary

This round is very simple: we wrapped an API, and there is not much else to talk about. Overall, this kind of infra is also an HTTP Server on the outside. It hides the details of model scheduling and inference underneath, so callers do not need to be aware of so much. From the earlier stateless Chat Completion API to today's Responses API with some state information, this also reflects the industry's changes at the model inference layer.
