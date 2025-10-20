---
layout: post
title: "LeoTalk AI周知 5: Deep Agent"
date: 2025-10-20T08:00:00+08:00
tags:
  - AI
  - LeoTalkAIWeekly
  - Tech
categories: AI
giscus_comments: true
tabs: true
pretty_table: true
toc:
  sidebar: left
---

最近开始有不少人聊Deep Agent这个词了，人们热衷于发明新的名词，但是同时热词也反映了人们的共同经历。

Deep Agent，或者说Agent 2.0大体上就是从Loop进化了，不单是套一个Loop就够了，比较窄面的理解其实就是往Multi Agent的方向演进了

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-10-20-leotalk-ai-weekly-1-deep-agent/1760966090_9.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
原因是任务越来越复杂，没办法通过简单的基于Loop实现ReAct类型的Agent了，上下文会爆炸，各种任务混杂在一起，也很难将上下文精准卸载出去或者做摘要缩减，而拆分成多Agent的好处也在AI Agent度过初期阶段后成为必须。业务场景的扩展、任务复杂度提升、迭代差异和效果评估等因素都促使大家往这个方面去推进了，所以不难理解现在Deep Agent的重要性持续提升。Agent 1.0大家都在关注Prompting Engineering、MCP、记忆等，Agent 2.0需要开始考虑编排、稳健运行的runtime环境、agent的通信等。

# 技术研究/技术突破

- v0发布[The State of Vibe Coding](https://v0.app/vibecoding)
- Google Cloud的[Startup technical guide AI Agents](https://services.google.com/fh/files/misc/startup_technical_guide_ai_agents_final.pdf)：在推销自己的云服务、AI服务和配套的开源、协议等
- Sonar的营销性质白皮书：[The Coding Personalities of Leading LLMs](https://www.sonarsource.com/the-coding-personalities-of-leading-llms.pdf)，有趣的是根据静态分析工具分析了几个SOTA模型的人格类型和特征描述
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-10-20-leotalk-ai-weekly-1-deep-agent/1760966090_10.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

# 产品&模型发布

- InclusionAI（蚂蚁金服）[发布](https://x.com/AntLingAGI/status/1977767599657345027)Ring-1T，基于Ling2.0架构，总1万亿参数（500亿活跃，128K上下文），取得IMO银牌
- [Encord E-MM1](https://encord.com/multimodal-dataset-emm1/)，号称全球最大规模的多模态数据集开源了
- Google[发布](https://blog.google/technology/ai/veo-updates-flow/)Veo3.1：引用RundownAI的一句话很有趣：在今天这个注意力经济的时代，有用可能比不过有记忆点。暗讽Veo3.1的风光已经被Sora2抢光了。对于Google来说不可谓不深刻，之前就已经被OAI搞了好几次
- Anthropic[发布](https://www.anthropic.com/news/claude-haiku-4-5)Claude Haiku4.5：主打便宜&快（比Sonnet4.5快一倍）。不得不说现在CC比Codex的速度快很多
- Google和耶鲁大学研究者[发布](https://blog.google/technology/ai/google-gemma-ai-cancer-therapy-discovery/)C2S-Scale 27B基础模型（基于Google的open-Gemma）：发现了此前未知的癌症治疗路径。
- 微软[发布](https://microsoft.ai/news/introducing-mai-image-1-debuting-in-the-top-10-on-lmarena/)MAI-Image-1，文生图模型，莫前在LMArena排Top10（值得注意的是第一还是腾讯的Hunyuan-image-3.0）
- ChatGPT Go（便宜版订阅）在[89个国家可用](https://help.openai.com/en/articles/11989085-what-is-chatgpt-go)
- Anthropic[发布](https://www.anthropic.com/news/skills)Agent Skills：通过`SKILL.md`定义为出发点，分了三级的Skills设定，感觉有点类似插件系统了，写各种Prompt和工具使用，还可以使用脚本，甚至感觉有些场景下比MCP更好用
- ChatGPT现在可以[自动管理保存的记忆](https://x.com/OpenAI/status/1978608684088643709)了，不会再有memory full的提醒了，非常make sense的一个功能，原来我一直觉得让用户手动管理内存是非常不合理的一件事情。
- Andrej Karpathy[发布了nanochat](https://github.com/karpathy/nanochat)：用最小的方式展示了端到端的训练、微调的ChatGPT克隆，非常值得学习，可以有个全局的认知
- Cognition[推出](https://cognition.ai/blog/swe-grep)SWE-grep和SWE-grep-mini模型（RL后），用于快速的上下文检索
- n8n[推出](https://docs.n8n.io/advanced-ai/ai-workflow-builder/)Workflow Builder
- DeepSeek[推出](https://github.com/deepseek-ai/DeepSeek-OCR)DeepSeek-OCR

# 热点论文

- [**LongCodeZip: Compress Long Context for Code Language Models**](https://arxiv.org/abs/2510.00446)**：**一个为代码LLM设计的高效上下文压缩框架，专门解决长上下文代码生成的高成本和延迟问题
- [**Recursive Language Models**](https://alexzhang13.github.io/blog/2025/rlm/)：递归语言模型是一种允许模型通过递归调用自身来处理长上下文的技术，由RLM驱动的GPT-5 mini在长上下文基准测试中的表现比GPT-5高出 114%
- [**Demystifying Reinforcement Learning in Agentic Reasoning**](https://arxiv.org/abs/2510.11701)：探讨RL在智能体推理中的关键因素：数据、算法、推理模式
- [**Scaling Large Language Models for Next-Generation Single-Cell Analysis**](https://www.biorxiv.org/content/10.1101/2025.04.14.648850v2)：把基因表达数据转成细胞句子，让LLM可以理解单细胞生物学
- [**The Art of Scaling Reinforcement Learning Compute for LLMs**](https://arxiv.org/abs/2510.13786)：提出ScaleRL，一种可预测的RL训练规模化规律
- [**Emergent Coordination in Multi-Agent Language Models**](https://arxiv.org/abs/2510.05174)：提出信息论方法量化多Agent系统中的群体智能
- [**Attention Is All You Need for KV Cache in Diffusion LLMs**](https://arxiv.org/abs/2510.14973)：一种无训练、架构无关的加速LLM推理方法
- [**Dr.LLM: Dynamic Layer Routing in LLMs**](https://arxiv.org/abs/2510.12773)：提出一种新的LLM动态路由框架：让大模型在推理时按需选择执行、跳过或重复某些Transformer层，从而在不牺牲精度的前提下减少计算量
- [**Hybrid Reinforcement: When Reward Is Sparse, It's Better to Be Dense**](https://arxiv.org/abs/2510.07242)：提出HERO框架，结合信号验证器和奖励模型分数的RL框架，旨在同时保持可验证性和丰富的反馈的优点
- [**Holistic Agent Leaderboard: The Missing Infrastructure for AI Agent Evaluation**](https://arxiv.org/abs/2510.11977)：HAL框架，建立一个高效、可复现、全维度的评测体系，推动从能过基准测试到能在真实世界中可靠工作的转变
- [**LLMs Can Get "Brain Rot"!**](https://arxiv.org/abs/2510.13928)：提出LLM脑腐假说：持续接触低质量的网络文本会导致大模型认知退化
- [**Kimi-Dev: Agentless Training as Skill Prior for SWE-Agents**](https://www.arxiv.org/abs/2509.23045)：融合两类软件工程LLM范式：Agentless和Agent-based（SWE-Agent），证明两者并非对立，而是可以互补强化

# 其他阅读

- [老罗和Tim的对话](https://www.xiaoyuzhoufm.com/episode/68e74f521bef327f3d7ddcd7)
- [Agentic Design Patterns](https://docs.google.com/document/d/1rsaK53T3Lg5KoGwvf8ukOUvbELRtH-V0LnOIFDxBryE/edit?pli=1&tab=t.0)
- Andrew Ng的[课程](https://www.deeplearning.ai/courses/agentic-ai/)
- [Deep Agents](https://nlp.elvissaravia.com/p/deep-agents), [Agents 2.0: From Shallow Loops to Deep Agents](https://www.philschmid.de/agents-2.0-deep-agents)
- [Anthropic’s Prompt Engineering Interactive Tutorial](https://github.com/anthropics/prompt-eng-interactive-tutorial)
