---
layout: post
title: "LeoTalk AI周知 8: 注意力机制发展"
date: 2025-11-11T08:00:00+08:00
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

最近通过[这篇文章](https://magazine.sebastianraschka.com/p/beyond-standard-llms)和[这个播客](https://www.xiaoyuzhoufm.com/episode/6908b9c80ceab2a71c48668c?s=eyJ1IjogIjY4Mzk3OTM0ZDFkMzUwNzI2OWRiOTQ4NCJ9)，了解了一下现在一些模型厂探索的方向，以及Transformer和对应的注意力机制在行业如何演进的，有一种很清晰的认知提升了，推荐有时间的可以去看看和听听。用我自己的理解大概总结一下相关的内容：

1. Transformer包含FFN和Attention，前者在DeepSeek的助推下，MoE已经全面流行，后者是会继续发展的一个方向
2. DeepSeek走了稀疏注意力机制（Sparse Attention）的方向
3. MiniMax原来M1走了线性注意力机制（Linear Attention）的方向，但是最新发布的M2又回到全局意力（Full Attention）
4. Kimi还持续在Linear Attention方向探索
5. OAI之类的硅谷模型厂不发paper了，但是应该也有在这些方面去探索
6. Transformer不一定最好的架构，但却是最亲和GPU的架构，效率最大化

关于几个注意力：

- 全局注意力（Full Attention）：默认的，每个Token看所有Token；**O(n²)**，成本高，上下文变长就爆炸
- 局部注意力/滑动窗口（Sliding Window Attention）：成本更低，适合长序列；只能看到局部，信息传播慢。OpenAI开源的OSS就走了这个方案
- 稀疏注意力（Sparse Attention）：高效看重点信息；需要特殊设计
- 线性注意力（Linear Attention）：理论可扩展到超长序列；可能损失精度
- 混合注意力（Hybrid Attention）：多宗注意力机制混搭，让模型既能看长上下文，又能不爆内存，不降低速度

最近明显感觉到AI for Science这种用于科学研究和探索的应用变多了，这周也能看到好几个类似的AI科学的应用，OAI也有相应的口径去表达这个。

# 研究报告

- Artificial Analysis发布[2025-Q3的AI报告](https://artificialanalysis.ai/downloads/state-of-ai/2025/Q3-2025-Artificial-Analysis-State-of-AI-Highlights-Report.pdf)：大模型竞争剧烈；Agentic能力成为重点；开源模型加速度迭代发布；STS模型达到生产应用级别；图片编辑和视频生成成为主流
- 麦肯锡发布[**The state of AI in 2025**](https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai)：AI带来的重点不在于省人省事，而在于用AI重新设计工作方式、在全公司推广，并把它当成增长和创新的引擎

# 产品&模型发布

- Chrome支持SplitView
- Kimi[推出](https://moonshotai.github.io/Kimi-K2/thinking.html)K2 Thinking，可以在无人干预下连续执行200-300个工具调用
- Google[推出](https://blog.google/technology/developers/file-search-gemini-api/)File Search Tool，包装好的RAG，通过接口提供，省心开发，对个开或者快速MVP landing来说是可行的
- [Gleato-30B-A3B](https://huggingface.co/mlfoundations/Gelato-30B-A3B)，用于GUI Computer-Use任务，基于Qwen3 VL
- Google[推出](https://cloud.google.com/blog/products/compute/ironwood-tpus-and-new-axion-based-vms-for-your-ai-workloads)第七代TPU Ironwood，比v5p（5代里最强的版本）快10倍
- 小鹏[推出](https://www.xpeng.com/news/019a56f54fe99a2a0a8d8a0282e402b7)VLA2.0、RoboTaxi、 Iron机器人、飞行汽车
- OpenAI[发了](https://openai.com/index/introducing-indqa/)一个能理解文化差异的基准测试IndQA

# 投资&商业

- OpenAI与Amazon达成380亿美元的计算能力[交易](https://x.com/ajassy/status/1985351258333643172)。（截至目前OAI和微软、Google、Oracle和亚马逊都有类似的交易了
- 微软97亿美元从IREN购买算力，批准向UAE运送NVIDIA显卡，和Lambda达成数十亿美元协议
- Perplexity付4亿美元（现金+股权）给Snap，用于在Snapchat里集成Perplexity，Snap的股价涨了15%

# 热点论文

- [**Towards Robust Mathematical Reasoning**](https://arxiv.org/abs/2511.01846)，Google DeepMind推出IMO-Bench基准测试
- [**Step-Audio-EditX Technical Report**](https://arxiv.org/abs/2511.03601)：StepFun AI开源的3B Step-Audio-EditX音频编辑模型的技术报告
- [**Kosmos: An AI Scientist for Autonomous Discovery**](https://arxiv.org/abs/2511.02824)：AI科学家，[Edison Scientific](https://edisonscientific.com/)的
- [**NVIDIA Nemotron Nano V2 VL**](https://arxiv.org/pdf/2511.03929)
- [**Cambrian-S: Towards Spatial Supersensing in Video**](https://arxiv.org/abs/2511.04670)：纽约大学和斯坦福大学推出的Cambrian-S模型，用于空间推理，还提出一个benchmark
- [**Introducing Nested Learning: A new ML paradigm for continual learning**](https://research.google/blog/introducing-nested-learning-a-new-ml-paradigm-for-continual-learning/) by Google
- [**Scaling Agent Learning via Experience Synthesis**](https://arxiv.org/abs/2511.03773) by Meta，提出了DreamGym框架，用模拟和推理生成的经验来训练Agent，RL就不在依赖于真实环境跑任务。
- [**Magentic Marketplace: an open-source simulation environment for studying agentic markets**](https://www.microsoft.com/en-us/research/blog/magentic-marketplace-an-open-source-simulation-environment-for-studying-agentic-markets/) by Microsoft，推出Magentic Marketplace，一个开源仿真平台，模拟未来AI Agent经济
- [**Context Engineering 2.0: The Context of Context Engineering**](https://arxiv.org/abs/2510.26493)：把上下文工程定义为降低熵的过程，定义了上下文的4个时代，从最早人类负责把混乱世界压缩成AI能懂的内容，到逐渐转向AI自主去构建上下文的未来
- [**Beyond a Million Tokens: Benchmarking and Enhancing Long-Term Memory in LLMs**](https://arxiv.org/abs/2510.27246)

# 其他阅读

- 李飞飞在写Substack了，第一篇文章聊了[空间智能（Spatial Intelligence）](https://drfeifei.substack.com/p/from-words-to-worlds-spatial-intelligence)，空间智能基于世界模型，有三个原则：可生成generative，多模态multimodal，可交互interactive。（Substack助推了一群反碎片化信息摄入人群的需求，顺势而为，越做越大
