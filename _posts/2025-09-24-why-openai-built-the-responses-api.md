---
layout: post
title: "为什么OpenAI要推出Responses API"
date: 2025-09-24T08:00:00+08:00
tags:
  - AI
  - Insights
categories: AI
giscus_comments: true
tabs: true
pretty_table: true
toc:
  sidebar: left
---

9月22日OpenAPI[发布](https://developers.openai.com/blog/responses-api)了[Responses API](https://platform.openai.com/docs/api-reference/responses)，是基于`/v1/completions`和`/v1/chat/completions`之后的一个新的接口：**一个具备持久推理、原声多模态和托管工具的状态化Agent接口，让开发者可以在一次API中同时获取模型的对话内容、推理过程中的动作（如函数调用）以及工具使用结果**。

原来的`/v1/chat/completions` 是基于回合返回的，也就是一来一往，虽然相比于最早的`/v1/completions`来说已经支持了不同的Role，这样可以通过聊天记录的形式对大模型展示之前的聊天记录，但是过程数据有困难在后续的推理请求中被丢弃，比如下图展示的

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-09-24-why-openai-built-the-responses-api/1758720622_31.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
可以看到第一次请求的推理信息在第二次请求的时候被丢弃了。其实我不觉得这一定是一个不好的事情，从上下文工程的角度来看，这个行为很难评判其效果。OAI在这里是为了展示一个推理的连续性，让大模型拥有足够的上下文信息，而不是缺少。就好像Anthropic决定让Claude Code保留哪怕是工具执行失败的信息在上下文里，就是为了达到这个效果，哪怕看似没用的上下文，对于大模型在某次的推理中都有可能起到重要作用。目前的上下文工程难点之一就是难以鉴别到底什么上下文数据是“合适的”，在现在的发展阶段，这是一个很难量化的东西。

`/v1/chat/completions` 这个接口确实有一定的局限性，文章中这段话很精辟：

> Chat completions emits one **message** per request. The structure of a message is limiting: did the message or the function call come first?

```javascript
{
  "message": {
    "role": "assistant",
    "content": "I'm going to use the get_weather tool to find the weather.",
    "tool_calls": [
      {
        "id": "call_88O3ElkW2RrSdRTNeeP1PZkm",
        "type": "function",
        "function": {
          "name": "get_weather",
          "arguments": "{\"location\":\"New York, NY\",\"unit\":\"f\"}"
        }
      }
    ],
    "refusal": null,
    "annotations": []
  }
}
```

消息和工具调用哪个先产生呢？这种同时到达的消息在某种程度上会造成一定的语义和逻辑困扰。我们应该走消息响应还是工具调用的流程？完全靠开发者去判断。这就是时序和结构不清晰带来的问题。

为什么会存在这种问题呢？哈哈，背后的故事似乎也算是意料之外情理之中：`/v1/chat/completions`这个接口是[Atty Eleti](https://x.com/athyuttamre)和[Rachel Lim](https://x.com/_rlys)在[一个周末的时间里Build出来的](https://x.com/athyuttamre/status/1899541474297180664)，然后全世界都adopt了。贴一张我的quote

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-09-24-why-openai-built-the-responses-api/1758720622_32.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
很多人一定会有这种感受，买定离手的那种感觉，你永远不知道自己多草率决定的一个东西，居然因为大火被很多人采用之后，你的那种感觉！

回到前面，从某个角度，我们可以认为Responses API是OAI在还债！我们常常听到的技术债！另外顺带做一些提升，也迎合一下市场对于Agentic API的需求。两全其美？现在Responses API返回的数据相对来说也更加合理的，按照时间线的形式来展示，非常清晰：

```javascript
[
  {
    id: "rs_6888f6d0606c819aa8205ecee386963f0e683233d39188e7",
    type: "reasoning",
    summary: [
      {
        type: "summary_text",
        text: "**Determining weather response**\n\nI need to answer the user's question about the weather in San Francisco. ....",
      },
    ],
  },
  {
    id: "msg_6888f6d83acc819a978b51e772f0a5f40e683233d39188e7",
    type: "message",
    status: "completed",
    content: [
      {
        type: "output_text",
        text: "I’m going to check a live weather service to get the current conditions in San Francisco, providing the temperature in both Fahrenheit and Celsius so it matches your preference.",
      },
    ],
    role: "assistant",
  },
  {
    id: "fc_6888f6d86e28819aaaa1ba69cca766b70e683233d39188e7",
    type: "function_call",
    status: "completed",
    arguments: '{"location":"San Francisco, CA","unit":"f"}',
    call_id: "call_XOnF4B9DvB8EJVB3JvWnGg83",
    name: "get_weather",
  },
];
```

OAI也明确表明了未来几年会主推这个接口，希望其可以成为默认的接口，我觉得Agentic API确实有其独到之处，从上下文工程的角度来看，内化了状态化和上下文隔离的手段。但是这会不会让开发者丧失更多的控制权呢？让子弹再飞一会。
