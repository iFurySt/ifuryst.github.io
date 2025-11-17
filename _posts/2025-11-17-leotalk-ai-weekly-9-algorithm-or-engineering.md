---
layout: post
title: "LeoTalk AI周知 9: 算法or工程"
date: 2025-11-17T08:00:00+08:00
tags:
  - AI
  - Tech
  - LeoTalkAIWeekly
categories: AI
giscus_comments: true
tabs: true
pretty_table: true
toc:
  sidebar: left
---

这周内容不多，也没有什么特别有亮点的。

最近在思考算法和工程这两个东西。我们应该追求算法还是工程？前者更多是偏向研究和前沿探索，后者为Idea提供了实际应用落地的能力。

虽然我是坚定的模糊学科边界的支持者，但是我还是会觉得对于大部分人来说是会有侧重的，毕竟牛人双修的还是少数。算法非常吃学历，或者进一步挖一下，非常吃个人的“学术”能力，这个和学历的高低有一定的正相关性。而后者更注重实操，学历和能力的正相关性没有前者高。

没有算法也就没有大模型的出现，一代一代人不断研究和探索未知，技术才能不断发展，这个很重要，虽然现在模型增速放缓了，但是不代表未来也更远了，并且AI的发展本来也不是线形的，很多时候是跨越式的。

没有工程化，大模型很难进一步挖掘出商业价值，进一步普适。很多商业价值的创造并不在于前沿科技的突破，而是行业化、规模化，这个也符合我们过往几十年互联网和移动互联网的认知。在行业或产业中大规模应用多种技术，不同的结合手段和规模创新，可以产生很好的产品和应用，进一步创造很大的商业价值，或许还能进一步反哺研究。

其实我也不迷茫或困惑，我是偏工程侧的。只是最近看到不少青年朋友关于这块产生了很大的疑惑和撕扯感，会有一种很错配很怪诞的想法。或许问题的根源就不是算法还是工程的问题。

# 产品&模型发布

- OpenAI[推出](https://openai.com/index/gpt-5-1/)GPT 5.1，个人感觉没什么亮点需要关注
- 百度推出[**ERNIE-4.5-VL-28B-A3B-Thinking**](https://huggingface.co/baidu/ERNIE-4.5-VL-28B-A3B-Thinking)模型，多模态推理开源模型，
- World Labs[推出](https://www.worldlabs.ai/blog/marble-world-model)Marble，李飞飞他们推出的首个世界模型
- 阿里抽调上百人团队准备打造千问APP，对标ChatGPT（也能理解，相对于豆包和DeepSeek，千问的C端产品认知一直很弱，一组数据：豆包1.59亿日活，通义只有7百万月活
- OpenAI[推出](https://openai.com/index/group-chats-in-chatgpt/)群聊（部分地区）
- 百度[推出](https://x.com/Baidu_Inc/status/1988820837898829918)多模态大模型ERNIE 5.0
- LM Arena[推出](https://news.lmarena.ai/code-arena/)Code Arena
- Cerebras推出[MiniMax-M2-REAP-162B-A10B](https://huggingface.co/cerebras/MiniMax-M2-REAP-162B-A10B)，基于minimax m2的一个内存更高效的变体版本

# 投资&商业

- 软银清仓Nvidia股票58亿美元，为了all in OpenAI和其他AI bets

# 其他阅读

- [**The Era of Agentic Organization: Learning to Organize with Language Models**](https://arxiv.org/abs/2510.26658)：提出AsyncThink，推理通过fork分叉最后再合并来提高效果，需要runtime来支持<FORK-1>和<JOIN-1>这种特殊的token
- [**Omnilingual ASR: Open-Source Multilingual Speech Recognition for 1600+ Languages**](https://ai.meta.com/research/publications/omnilingual-asr-open-source-multilingual-speech-recognition-for-1600-languages/)：Meta FAIR推出的Omnilingual ASR，支持1600种语音的多语种语音识别，7B大小
- [Scaling Agent Learning via Experience Synthesis](https://arxiv.org/pdf/2511.03773)
- [**SIMA 2: An Agent that Plays, Reasons, and Learns With You in Virtual 3D Worlds**](https://deepmind.google/blog/sima-2-an-agent-that-plays-reasons-and-learns-with-you-in-virtual-3d-worlds/)
- [**Memori**](https://github.com/GibsonAI/Memori)：An open-source SQL-Native memory engine for AI
- Google发了一份[上下文工程白皮书](https://www.kaggle.com/whitepaper-context-engineering-sessions-and-memory)
