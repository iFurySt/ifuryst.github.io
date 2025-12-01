---
layout: post
title: "LeoTalk AI周知 11: VLA到世界模型"
date: 2025-12-01T08:00:00+08:00
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

可以明显感觉到这几个月来VLA和世界模型的提及率变高了。

首先是以自动驾驶为主的企业，基本上都在押注VLA（Vision Language Action）。得益于大语言模型的发展，原来通过写规则的自动驾驶，在Tesla转向端到端模型之后，其他自动驾驶也纷纷跟进。现在基本上头部的自动驾驶都有相应的VLA模型了。通过相关的语料训练（更多后阶段），让模型可以基于视觉+文本，直接产出对应的行动指令。这个方向其实和机器人（或者具身智能）是匹配的，机器人也可以通过视觉+文本（指令等）来生成下一步的行动。

其实我们也可以看到，现在有一些大模型开始直接是输出Agent和Tool了，也是一样的趋势，因为很多应用场景已经不在满足于纯文本输入输出了，很多时候输出并不需要是可阅读的文本，很多时候是需要输出下一步的Action，比如调用什么Agent、调用什么工具、执行什么命令等等。之前大多是在提示词级别来做，跟之前CoT一样，现在这部分也开始下沉到训练阶段来做了。所以我们也可以看到一些Agent模型的出现。

再来说说世界模型，LeCun、李飞飞都开始押注世界模型，现在硅谷基本上也在世界模型方向上加大投入了。可以看到今年下半年来，不断有世界模型的出现。在某些情况下，世界模型和视频模型是有一定的overlap，不冲突，不过最重要的区别还是在于是否可接受输入来改变输出。比如单纯视频生成模型，一般给完文本提示词后一次生成，而世界模型则是可以通过类似前后左右的控制去影响下一帧的产生。

从某种角度也可以理解，这个还是蛮符合直觉的，毕竟纯文本的信息密度和带宽还是远远不足的，就好像你看一篇文章和刷视频的差别一样。

另外很重要的一点是，世界模型有很多可预见甚至是正在发生的有价值的应用场景。比如我们前面提到的VLA对于自动驾驶和机器人来说，世界模型是一个很重要的方向，甚至某种程度上可以是VLA的后续发展和结合的方向。

现在一个非常重要的应用场景就是用世界模型去合成训练自动驾驶和机器人所需要的数据，尤其是机器人，这类数据的量特别少的，如果要人为去产生成本是极其大的（人遥控机器人，采集数据。或者人挂摄像头，采集人的行动数据等），合成数据应该是未来非常重要的方向。这个其实也不止这个方向，甚至大语言模型现在都开始借助合成数据来训练。合成数据的起点不高，但是天花板很高，毕竟人类产生的数据是不可能比机器产生的多和快，现在是在探索一些通过量和覆盖率来提升整体的基线，这样可以在质量赶不上真是数据的同时，用量级+算力来换质量

差不多是这些碎片化的想法

# 产品&模型发布

- Google[推出](https://developers.googleblog.com/introducing-code-wiki-accelerating-your-code-understanding/)[CodeWiki](https://codewiki.google/)，和DeepWiki一样的产品
- Anthropic[推出](https://www.anthropic.com/news/claude-opus-4-5)Claude Opus 4.5，看着主要还是应对来自Gemini3和GPT5.1-Codex-Max的压力
- DeepSeek[发布](https://github.com/deepseek-ai/DeepSeek-Math-V2)DeepSeek-Math-V2
- 腾讯开源[HunyuanOCR](https://github.com/Tencent-Hunyuan/HunyuanOCR)
- 微软[推出](https://www.microsoft.com/en-us/research/blog/fara-7b-an-efficient-agentic-model-for-computer-use/)Fara-7B，CUA场景
- Black Forest Labs推出[FLUX.2](https://bfl.ai/models/flux-2)图片生成和编辑模型

# 投资&商业

- Meta愿意接受TPU的背后表明了一个解决方案的可能性，之前NVIDIA提供显卡，不管上层平台和Infra，现在TPU的模式可以走Google的全家桶。我觉得这个点才是NVIDIA股价应声下跌的一个重要诱因。

# 其他阅读

- Ilya的[访谈](https://www.dwarkesh.com/p/ilya-sutskever-2)，大家都在讨论他说的Scaling时代结束，我觉得不如直接听听他的整体观点
- [General Agentic Memory (GAM)](https://github.com/VectorSpaceLab/general-agentic-memory)
- [A Simple Yet Strong Baseline for Long-Term Conversational Memory of LLM Agents](https://arxiv.org/abs/2511.17208)
- [MCP Apps](https://blog.modelcontextprotocol.io/posts/2025-11-21-mcp-apps/)扩展MCP，让MCP Server可以返回可交互UI给客户端
- [ToolOrchestra: Elevating Intelligence via Efficient Model and Tool Orchestration](https://arxiv.org/abs/2511.21689)：规模效应被质疑的同时，大量小参数模型表现出不错的推理能力的背后也是一个探索方向的分叉
- [Stanford AI Club: Jeff Dean on Important AI Trends](https://www.youtube.com/watch?app=desktop&v=AnTw_t21ayE)DeepMind纪录片，30年跟拍，很牛
- [DeepMind纪录片](https://thinkinggamefilm.com/)，跟拍Demis的30年，牛
