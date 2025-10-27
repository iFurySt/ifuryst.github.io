---
layout: post
title: "LeoTalk AI周知 6: AI浏览器大战"
date: 2025-10-27T08:00:00+08:00
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

随着OpenAI和微软在这周进入AI浏览器大战，现在的战局已经是：

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-10-27-leotalk-ai-weekly-6-the-ai-browser-wars/1761530735_1.jpg" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

- Perplexity的Comet：最近也免费了
- The Browser Company的Dia（还有之前的Arc，很多人还在用）：前段时间公司被Atlassian（做Jira的公司）
- Opera的Neon
- Google的Chrome：最近在美国推，其他地区暂无
- OpenAI的Atlas
- Zen Browser：开源的
- Fellou

AI功能基本都是集中在侧边栏聊天、划词什么的，相对来说还是基础了一些，一些有半自动化的功能，但是场景也很限制，全自动化更是远了。并且这些产品基本都是基于Chromium（Chrome的开源）二开的。

在思考安全问题，这些浏览器无一例外都面临了类似提示词注入（Prompt Injection）的风险。假设一下， 一个页面上看不到但是隐含了一下内容，是被精心设计好用来针对大模型的，那有可能在摘要一个页面的时候被攻击了，大模型有浏览器的控制权，类似CSRF之类的攻击就可以轻易实施了。

# 技术研究/技术突破

- [ChatGPT的用户访问量过去一年持续下降](https://x.com/Similarweb/status/1979863740670480674)，而Google的Gemini增加了12.9%。不过大头还是在ChatGPT
- Galileo的[Mastering AI Agents](https://github.com/iFurySt/AI-EBooks/blob/main/Mastering%20Multi-Agent%20Systems%20eBook.pdf)
- Glean的[Building AI agents for the enterprise](https://github.com/iFurySt/AI-EBooks/blob/main/Glean-AWS-ebook.pdf)

## NVIDIA Inception计划

[Starcloud](https://blogs.nvidia.com/blog/starcloud/)是NVIDIA的Inception计划（面向AI初创的加速计划）成员。starcloud计划部署搭载了H100的卫星，在太空中建设数据中心。几个点：

- 能源几乎无限：靠太阳能驱动
- 冷却高效：利用真空环境做散热，通过红外辐射排热
- 环境效益大：发射的碳排放只发生一次，长期看可减少约10倍CO2排放
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-10-27-leotalk-ai-weekly-6-the-ai-browser-wars/1761530735_2.webp" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
*Opinion：属于科幻照进现实系列了，不过维修成本怎么计算呢？数据传输问题也需要考虑，带宽、速度等，商业模式暂时也不太明朗。*

# 产品&模型发布

- DeepSeek[推出](https://github.com/deepseek-ai/DeepSeek-OCR)DeepSeek-OCR，上周发了，不过还是再发一次，DS提出了将文本转成图片，再用图片输入到大模型，可以达到消耗更少的token。算是这周比较多人在讨论的一个东西
- OpenAI[推出](https://openai.com/index/introducing-chatgpt-atlas/)浏览器Atlas
- 微软的Edge浏览器[支持](https://blogs.windows.com/msedgedev/2025/10/23/meet-copilot-mode-in-edge-your-ai-browser/)Copilot模式
- Anthropic将Claude记忆推送到pro和max，可以区分工作和个人的记忆了（9月份的时候[推出](https://www.anthropic.com/news/memory)只对企业和Team开放）
- 腾讯[开源](https://3d-models.hunyuan.tencent.com/world/)世界模型Hunyuan World 1.1（HunyuanWorld-Mirror），[技术报告](https://3d-models.hunyuan.tencent.com/world/worldMirror1_0/HYWorld_Mirror_Tech_Report.pdf)
- Claude Code[可在](https://www.anthropic.com/news/claude-code-on-the-web)Web上使用了
- Anthropic[推出](https://www.anthropic.com/news/claude-for-life-sciences)Claude for Life Sciences，新的科学研究平台连接器、AI实验技能和生物医学任务的性能提升
- Google[推出](https://blog.google/outreach-initiatives/education/google-skills/)[Google Skills](https://www.skills.google/)，包含3000 AI和技术课程
- Fish Audio[推出](https://x.com/hehe6z/status/1980303682932744439)Fish Audio S1
- [PokeeResearch](https://pokee.ai/deepresearch-preview)，7B的SOTA模型，用于Deep Research
- Lightricks[推出](https://x.com/ltx_model/status/1981346235194683497)LTX-2，开源视频模型，可以生成50fps+十几秒长度的4k
- 松延动力（Noetix Robotics，北京的机器人公司）[推出](https://x.com/TheHumanoidHub/status/1981048822509031896)家庭友好的机器人Bumi，1400美元（9998元）的价格非常便宜了
- 宇树（Unitree）[推出](https://www.youtube.com/watch?v=eUdBIFkMh-M)了H2。也推出了面向教育的宇树四足机器人实训平台
- 亚马逊[推出](https://www.aboutamazon.com/news/operations/new-robots-amazon-fulfillment-agentic-ai)Blue Jay用于仓储分拣
- 加速进化（Booster Robotics，北京的公司）[推出](https://www.youtube.com/watch?v=3Jo6dd6hWqk)k1，针对孩子和教育
- 苹果[推出](https://arxiv.org/abs/2510.17790)UltraCUA基础CUA模型
- Huggingface[发布](https://huggingface.co/chat/)Hugging Chat
- Anthropic[推出](https://www.anthropic.com/engineering/claude-code-sandboxing)Sandbox Runtime，是[开源](https://github.com/anthropic-experimental/sandbox-runtime)的，不需要容器，直接对进程施加文件和网络限制
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-10-27-leotalk-ai-weekly-6-the-ai-browser-wars/1761530736_3.webp" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

# 投资&商业

- OpenEvidence（号称ChatGPT for doctors）估值达到60亿美元，仅仅三个月估值就翻了一倍。其模型基于可信医学资料（如美国医学会杂志，新英格兰医学杂志等）训练，主要是帮助医生和护士获取专业的医学知识，今年7月以来，月度咨询量飙升到1500万次
- OpenAI[收购](https://openai.com/index/openai-acquires-software-applications-incorporated/)Software Applications Incorporated（sky背后的公司），更多开始布局CUA？
- [泄漏的文件](https://www.nytimes.com/2025/10/21/technology/inside-amazons-plans-to-replace-workers-with-robots.html)表示Amazon计划在美国用机器人替换掉600K+的工作岗位

# 热点论文

- [**Every Attention Matters: An Efficient Hybrid Architecture for Long-Context Reasoning**](https://arxiv.org/abs/2510.19338)：蚂蚁集团的Ring-linear系列模型，一种高效的长上下文推理模型架构
- [UltraCUA: A Foundation Model for Computer Use Agents with Hybrid Action](https://arxiv.org/abs/2510.17790)：苹果新推出的基础CUA模型，主要点是将GUI操作（点击、滚动）和程序化调用（API、工具函数）结合的混合动作（Hybrid Action）
- [WALT: Web Agents that Learn Tools](https://arxiv.org/abs/2510.01524)：web agent框架，让agent学会网站自带的功能，而不是一步步去点击输入。一开始利用工具构建智能体去做工具发现、构建和验证，最后再用浏览器智能体使用这些工具
- [**Tensor Logic: The Language of AI**](https://arxiv.org/abs/2510.12269)：提出一种新的编程语言Tensor Logic，用来统一神经网络（Neural）和符号推理（Symbolic）两大AI范式，期望成为C for AI的底层语言标准
- [Robot Learning: A Tutorial](https://arxiv.org/pdf/2510.12403)：牛津和Hugging Face发的
- [**Qwen3Guard Technical Report**](https://arxiv.org/abs/2510.14276)
- [**Fantastic (small) Retrievers and How to Train Them: mxbai-edge-colbert-v0 Tech Report**](https://arxiv.org/abs/2510.14880)：早稻田大学发布轻量级ColBERT检索模型，17M/32M的参数却超越ColBERTv2，在低维嵌入下保持高性能，并大幅节省内存和算力，适合边缘设备高效检索
- [**A2FM: An Adaptive Agent Foundation Model for Tool-Aware Hybrid Reasoning**](https://arxiv.org/abs/2510.12838)
- [**BitNet Distillation**](https://arxiv.org/abs/2510.13998)：微软提出将全精度模型蒸馏为三值权重网络（BitNet），结合子层归一化与注意力蒸馏，实现极大内存节省与更快CPU推理速度。
- [**RAG-Anything: All-in-One RAG Framework**](https://arxiv.org/abs/2510.12323)：港大学提出统一多模态文档的 RAG 框架，通过双图结构与跨模态混合检索，实现对长篇异构证据的统一推理
- [**LLM-guided Hierarchical Retrieval**](https://arxiv.org/abs/2510.13217)：构建语义层级树并由大模型引导逐层检索，在无需微调的情况下实现对复杂推理任务的高效对数级检索。
- [**OmniVinci: Enhancing Architecture and Data for Omni-Modal Understanding LLM**](https://arxiv.org/abs/2510.15870)：NVIDIA提出OmniVinci，通过音频与视觉嵌入对齐及多模态对话数据优化，以更少训练token超越更大规模的全模态模型。
- [**Enterprise Deep Research: Steerable Multi-Agent Deep Research for Enterprise Analytics**](https://arxiv.org/abs/2510.17797)：Salesforce提出透明多Agent框架，结合任务管理和可控上下文工程，实现企业级“深度研究”，在多项基准超越LangChain方案且节省4倍token。

# 其他阅读

- [minio停止发布Docker镜像](https://github.com/minio/minio/issues/21647)，辩证的看待，开源商业化的困境，但是至少它还是开源的，但是团队已经失去社区的信任了，谁知道后续LICENSE是否会出现变化。不过哪怕追逐商业化，这个举措依然不是一个好的决策，包括发现的一些CVE，现在也没办法官方公开的修复镜像了，会导致很多安全问题。
- [CME 295 - Transformers & Large Language Models](https://cme295.stanford.edu/)：斯坦福大模型课程
- cto.new[声称](https://cto.new/blog/why-we-raised-5-7m-to-launch-cto-new-completely-for-free)完全免费的AI Code Agent，用融资（目前570万美元融资）来支撑。希望成为基础设施的方向后再考虑盈利。目前采用等待邀请制。可以用SOTA模型，他们也会自己优化和部署模型
