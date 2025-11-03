---
layout: post
title: "LeoTalk AI周知 7: 从云计算和数据中心看AI"
date: 2025-11-03T08:00:00+08:00
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

最近几家Big Tech都披露财报了，可以看到云计算三家的份额增长都不错，云计算的需求增长背后是市场对于AI需求在持续增长的一个信号。股票也都涨了，进一步提振了投资人和市场的信心。

另外这几个月来数据中心的新闻持续发酵，包括OpenAI自己也联合几家芯片厂（Nvidia、AMD等）和有能力建设数据中心（Oracle等）的厂合作，也释放出很多信号。虽然GPU从采购到实际投产，有3、4年的gap（也就是数据中心里大规模跑的GPU并不是最前沿的GPU），但是预先规划说明了模型厂对未来的预期。

题外话：

- 最近关于Web Agent的论文明显增多了，或许是个信号
- 这周报告和新出的模型很多，也是个信号

# 研究报告

- [**2025: The State of AI in Healthcare**](https://menlovc.com/perspective/2025-the-state-of-ai-in-healthcare/)：医疗行业AI的采用率从2023年的3%飙升到今年的22%，医疗投入达14亿美元，85%流向初创。从评估到落地只需要6个月，远超过去的IT项目周期。采购方向主要集中在两个方向：临床文档（医生减负）和编码/计费自动化（提升收入），不过也有在蔓延到医患互动、事前授权等新场景。初创发展速度快，但是传统巨头也在通过将AI整合进自身体统来反击（商机）
- Anthropic和Thinking Machines Lab联合研究[**Stress-testing model specs reveals character differences among language models**](https://alignment.anthropic.com/2025/stress-testing-model-specs/)，用一种“模型间分歧”来发现模型规范（spec）漏洞的方法，从30万+价值冲突场景中揭示了不同AI公司的模型性格和规范缺陷。有开源了数据集，从Claude中提取了3307个细分人类情绪，自动创建了30万+价值冲突场景（比如社会公平vs商业效率）。几个结论，Anthropic的Claude倾向伦理责任、客观和知识完整性，OpenAI的GPT系列强调效率和资源优化，Google的Gemini和xAI的Grok偏重情感深度和真实连结
- [Atlassian AI Collaboration Report 2025](https://atlassianblog.wpengine.com/wp-content/uploads/2025/09/atlassian-ai-collaboration-report-2025.pdf)，Atlassian的AI报告（全球Fortune 1000的高管与1.2万名知识工作者的研究结果），大概讲了AI虽然提升了个人生产力，但企业层面没有特别显著的收益提现，报告很长，不过很多不错的图表可以比较直观的查看，翻看一下图表也能得到不错的insight
- Postman的[**State of the API Report**](https://www.postman.com/state-of-api/2025/)，主要针对API和AI的分析
- 沃顿商学院AI报告[GEN AI FAST-TRACKS INTO THE ENTERPRISE](https://ai.wharton.upenn.edu/wp-content/uploads/2025/10/2025-Wharton-GBK-AI-Adoption-Report_Full-Report.pdf)：AI的每周使用率从2023的37%升到82%了；AI最受欢迎的使用场景是日常工作生产力提升，如数据分析73%，文档或会议摘要70%，写作和编辑68%；75%的领导者表示在AI方面的投入有正向ROI；但是未来成功的关键可能不是技术、软件或模型，而是员工。归根到底，人依然是AI采用过程中的最大瓶颈，但同时也最有可能成为最有潜力的加速引擎
- Artificial Analysis（一个基准测试平台）发布了[**State of Generative Media Survey Report 2025**](https://artificialanalysis.ai/media/survey-2025)报告。图片生成个人采用率达到89%，组织使用率是57%。Gemini以74%份额领先，GPT-Image是64%，BFL FLUX是37%。ChatGPT和Gemini是最常用的，大约是70%。而Adobe和Midjourney在组织用户中使用率最高。视频生成相对于图片来说稍微滞后，但是也在增长中，其中个人采用率62%，组织32%，Google Veo是69%，Kling是48%，Hailuo是35%，Runway是30%。视频使用场景主要是营销广告55%，娱乐内容43%。模型选择因素里质量74%仍然是最重要的，其次是成本和速度。65%的企业在12月内看到投资回报，其中34%已实现盈利。为适应生成式媒体，43%改进工作流程，33%设立AI团队和新岗位，30%调整预算投入。

_Opinion：看报告基本各家说各家的，乐观悲观的都有，大家都会声称自己的报告受访者是多少什么的。不过基本上没人能保持绝对权威。我不是统计学专家，不过一个普通直觉就是，当所有人都在讨论一个东西，它的重要性是无与伦比的。国产模型毫无意外的基本包揽了第二梯队，AI的两个主要参与国基本成型。语言模型增速趋缓之下，大家都在等待一些底层架构、数据或范式更新带来更大的突破的同时，多模态绝对是一个非常重要的增长曲线和赛道，基本上属于兵家必争之地，甚至有一些观点表示通往AGI的路是多模态，而不是语言模型。_

### 2025年人工智能指数报告（**The 2025 AI Index Report**）

斯坦福大学HAI发布今年的[AI指数报告](https://hai.stanford.edu/ai-index/2025-ai-index-report)，[英文PDF](https://hai.stanford.edu/assets/files/hai_ai_index_report_2025.pdf)，[中文PDF](https://hai.stanford.edu/assets/files/hai_ai_index_report_2025_chinese_version_061325.pdf)。这份报告的参考价值还挺高的，分8章从多个维度去评估AI发展情况。

1. **研究与开发**：产业主导AI发展（规模和费用的提升，学术无法自己推进，SOTA模型90%来自产业界），不过学术依然贡献了高被引的论文（费用日渐攀高的模型训练，不确定未来学术界会怎么演进，持续和产业界深化合作是能预见的一条路）。中美两国为AI主要输出国的格局基本确定，包括模型、论文和专利在内。不过美国的私人投资规模、机房规模、SOTA模型性能和数量都走在前列。另外一个矛盾的点在于AI硬件变得更快、更便宜和更节能，模型推理成本持续下降；但同时模型规模变得更大，算力需求更多，能耗更强，碳排放更高
2. **技术性能**：开源模型逼近闭源了，模型整体性能也收敛了。流行的基准测试不够用了，需要更有挑战性的基准测试。多模态和小模型持续突破。复杂推理仍然是难题。
3. 负责任的AI：安全、虚假信息等风险持续增加。很多网站开始反制AI爬虫爬取数据，公共数据资源正在迅速萎缩。研究人员和政策制定者开始关注这一领域
4. 经济：AI领域投资激增，24年AI投资规模2523亿美元，其中GenAI占339亿美元。美国AI私人投资规模达1091亿美元，中国93亿美元，英国45亿美元，单美国就比后面几个加起来还多。企业AI采用率从23年55%升到78%，个人从33%到71%。中国安装了27.63万台工业机器人（全球占51.1%），是日本6倍，美国7.3倍。AI在推动能源结构的重大变革，尤以核能为主
5. 科学与医学：AI For Science持续发展，比如更先进的大规模蛋白质测序模型、大模型临床水平提升且关键任务优于医生、公共蛋白质数据库规模不断扩大。FDA批准AI医疗设备数量激增。合成数据在医学领域展现巨大潜力。AI研究也获得了2项诺贝尔奖
6. 政策：各国政府加大AI投资力度。相关的法律法规在持续跟上。
7. 教育：CS普及率提升，并且开始下沉到K12。22-23年美国获得AI硕士学位的毕业生几乎翻了一倍。
8. 公共观点：全球范围对AI产品和服务态度持谨慎乐观的态度。2/3的人认为AI在未来3-5年会显著改变日常生活。对AI的乐观程度因国家不同，中国83%，印尼80%，泰国77%，加拿大40%，美国39%，荷兰36%。

_Opinion：统计的是2024年的情况，但是今年已经过了10个月了，所以报告中的一些结论，会有一点错配的感觉，这也是这种大篇幅较深入的报告面临的问题，现在AI相关的所有东西发展速度都非常快，接近一年后才发布前一年的报告，势必就会造成很多过期的数据和信息。本来想放几张图，但是太困了不想截图了。但是还是强烈建议哪怕是翻看图表也应该去快速过一遍，我觉得这份报告还挺有用的_

# 产品&模型发布

- MiniMax[推出](https://www.minimax.io/news/minimax-m2)[MiniMax-M2模型](https://github.com/MiniMax-AI/MiniMax-M2)：为Agent和代码而生的，1/12价格实现接近Claude Sonnet 3.5的表现
- xAI[推出](https://x.com/elonmusk/status/1983008145925386481)Grokipedia，类似维基百科，80万+Grok生成的文章
- GitHub[推出](https://github.blog/news-insights/company-news/welcome-home-agents/)Agent HQ
- Flowith[推出](https://x.com/flowith_ai/status/1983183206791958711)FlowithOS，Agentic Web任务上击败OpenAI Operator，ChatGPT Atlas，Gemini 2.5 Computer Use
- Cursor[推出](https://cursor.com/blog/2-0)Cursor 2.0，同时[推出](https://x.com/cursor_ai/status/1983567621602881992)Composer，他们的第一个Coding模型
- Google Labs[推出](https://blog.google/technology/google-labs/pomelli/)Pomelli，AI营销助手
- Adobe[推出](https://www.youtube.com/watch?v=ETTXQSa4A0k)Firefly Image 5图片模型
- Cognition[发布](https://windsurf.com/blog/swe-1-5)SWE-1.5，自有Agent模型
- Kimi[发布](https://x.com/Kimi_Moonshot/status/1984207733177090274)[kimi-cli](https://github.com/MoonshotAI/kimi-cli)
- 微软发布[Agent Lightning](https://github.com/microsoft/agent-lightning)，一个新的AI框架用于支持agent的RL，不需要重写代码，通过训练和执行解藕为部署后的AI Agent的训练提供支持
- Google[发布](https://blog.google/technology/research/new-updates-and-more-access-to-google-earth-ai/)Earth AI，结合地图（卫星图片和AI）帮助企业解决一些环境挑战，比如洪水和山火等
- Odyssey[发布](https://odyssey.ml/introducing-odyssey-2)Odyssey-2，交互式视频模型，以每秒20帧的速度生成，让用户可以通过文本来控制几分钟的视频走向
- OpenAI[发布](https://openai.com/index/introducing-gpt-oss-safeguard/)gpt-oss-safeguard开源模型（120b和20b），可以通过一些自定义的策略（policy），可以自动判断某些内容是否符合规则。推理过程会输出CoT，方便审计和改进
- Tiktok[推出](https://newsroom.tiktok.com/new-ai-powered-tools-to-make-it-easier-to-create-and-share-on-tiktok?lang=en)AI工具，可自动智能切分（Smart Split）和概要（AI Outline），可以将长视频转成短视频
- IBM[推出](https://huggingface.co/blog/ibm-granite/granite-4-nano)Granite 4.0 Nano，350M到1.5B的小模型家族，用于设备端使用
- Cartesia[发布](https://cartesia.ai/sonic)Sonic 3，TTS模型
- 美团发布[LongCat-Flash-Omni](https://github.com/meituan-longcat/LongCat-Flash-Omni)

# 投资&商业

- 高通推出用于数据中心的AI200和AI250芯片（对标英伟达），可组成完成机架系统，做多支持72颗芯片协同工作，沙地阿拉伯AI初创Humain成为第一个客户。在AI头部玩家寻找英伟达替代品的时候出现，是个好时机（麦肯锡预测2030数据中心支出会到6.7万亿美元）
- [OpenAI正式摆脱非营利性组织的限制](https://www.reuters.com/business/microsoft-openai-reach-new-deal-allow-openai-restructure-2025-10-28/)：微软取消了此前的融资限制，使得OpenAI有IPO的可能，微软保留27%的股份，但是失去了计算的排他权，Altman可以进一步往14000亿美元的数据中心的方向走了。对于微软来说，之前投资了138亿美元的赌局几乎获得了10倍的收益
- Anthropic宣布和Google达成100万颗TPU（超过1吉瓦算力）的交易。Anthropic紧跟OpenAI的步伐布局数据中心。同时也利好有能力建设数据中心的公司
- Paypal[宣布](https://www.cnbc.com/2025/10/28/paypal-openai-chatgpt-payments-deal.html)和OpenAI合作，让用户可以在ChatGPT里用Paypal支付，预计2026年上

# 热点论文

- [**Tongyi DeepResearch Technical Report**](https://arxiv.org/abs/2510.24701)
- [**Supervised Reinforcement Learning: From Expert Trajectories to Step-wise Reasoning**](https://arxiv.org/abs/2510.25992)
- [**Stress-Testing Model Specs Reveals Character Differences among Language Models**](https://arxiv.org/abs/2510.07686)：Anthropic和Thinking Machines一起做的哟俺就，发现当前SOTA大模型有不同的性格倾向
- [**Agent Lightning: Train ANY AI Agents with Reinforcement Learning**](https://arxiv.org/abs/2508.03680)
- [**Agent Data Protocol: Unifying Datasets for Diverse, Effective Fine-tuning of LLM Agents**](https://arxiv.org/abs/2510.24702)
- [**TOM-SWE: User Mental Modeling For Software Engineering Agents**](https://www.arxiv.org/abs/2510.21903)
- [**Kimi Linear: An Expressive, Efficient Attention Architecture**](https://arxiv.org/abs/2510.26692)：提出混合线形注意力结构么，将Kimi Delta Attention和周期全注意力（3:1）结合，保持性能的同时KV缓存减少75%，1M上下文推理获得6倍速度
- [**AgentFold: Long-Horizon Web Agents with Proactive Context Management**](https://arxiv.org/abs/2510.24699)：阿里通义Lab，提出主动上下文管理机制，为长程Agent解决上下文饱和问题，通过多层级折叠压缩与保留关键信息，显著减少噪声并保持任务一致性，展示了智能上下文折叠可替代巨型参数规模
- [**Multi-Agent Evolve: LLM Self-Improve through Co-evolution**](https://arxiv.org/abs/2510.23595)：提出Proposer- Solver-Judge三代理共演机制。让大模型在无标注情况下通过互相博弈式RL优化，实现Self-improvement
- [**GAP: Graph-Based Agent Planning with Parallel Tool Use and Reinforcement Learning**](https://arxiv.org/abs/2510.25320)：引入基于图的代理规划框架GAP，可并行执行多个工具，结合RL学习优化工具选择和执行顺序，可以大幅度加快多步任务完成速度并提高成功率，适用于Web Agent和复杂问答系统
- [**Defeating the Training-Inference Mismatch via FP16**](https://arxiv.org/abs/2510.26788)：发现RL中BF16与FP16精度不匹配是训练不稳定的主因。改用FP16可以显著提升收敛速度和稳定性

# 其他阅读

- [2024年60%用于AI应用的数据是合成数据](https://news.mit.edu/2025/3-questions-pros-cons-synthetic-data-ai-kalyan-veeramachaneni-0903)
- [Nvidia GTC 2025](https://www.youtube.com/playlist?list=PLZHnYvH1qtOZCUU5UAui608MaZN_60dmK)，非常值得一看。每次看完GTC，对AI泡沫的感觉又少了一点，感叹人类科技的发展。另外Nvidia的Creative Team做的视频是真的很有料，点赞。NVIDIA市值直接上$5T了
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-11-03-leotalk-ai-weekly-7-from-cloud-computing-n-data-ce/1762183010_1.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
- [**Emergent Introspective Awareness in Large Language Models**](https://transformer-circuits.pub/2025/introspection/index.html)，Anthropic研究模型自我察觉能力，发现当前大模型能有限识别自身内部状态但不稳定，利用激活注入（activation steering）实验评估，现实Claude Opus 4系列只有20%成功率，说明模型内省不可靠但是具有潜在对其和解释价值
- Ilya Sutskever（OAI联合创始人）[发布](https://storage.courtlistener.com/recap/gov.uscourts.cand.433688/gov.uscourts.cand.433688.340.1.pdf)一份法庭证词的细节，围绕着23年11月Sam Altman被赶出公司的事件。52页回忆详细说了不诚实和操作的模式，前CTO Mira Murati（现在Thinking Machines）提供了很多证据m
