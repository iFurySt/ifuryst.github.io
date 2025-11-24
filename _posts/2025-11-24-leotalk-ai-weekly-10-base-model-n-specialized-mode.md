---
layout: post
title: "LeoTalk AI周知 10: 基模&专模"
date: 2025-11-24T08:00:00+08:00
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

各厂商仍然在卷基模，但也只是头部的还在坚持。很多没那么头部的模型厂已经开始分化了，甚至很多上升到应用层了，实在是ROI很难评。尤其是本身没有现金牛的情况下，基本上属于在烧VC的钱，如果没办法做到行业TOP，基本上很难持续。

最近OAI内部流出来的[memo](https://www.theinformation.com/articles/openai-ceo-braces-possible-economic-headwinds-catching-resurgent-google)也表明了其对于Google这类互联网时代大厂的强力追赶表示出忧虑，Ed Zitron的[分析](https://www.wheresyoured.at/oai_docs/)也表明OAI的推理成本是很高的。从这几个月来OAI的应用层产品迭代情况也可以窥见一些背后的动机。成本居高不下，非常吃投资，降本并探索应用层产品的更多盈利空间成为了必然。

另外一个点是，很多实际的应用，并不依赖于最SOTA的模型，对于一个大而全模型的追求，似乎也不是完全的共识了。甚至现在专模专用成为了很多行业的现状，最SOTA的模型不一定能带来最大的价值，反而是小参数微调后的模型的价值有可能更高。

期待基模的下次“涌现”，下次aha moment。在此之前，多关注基模之外的世界

# 产品&模型发布

- xAI[发布](https://x.ai/news/grok-4-1)Grok 4.1
- Google[发布](https://blog.google/products/gemini/gemini-3-gemini-app/)Gemini3，反响不错，大家都在讨论
- Google发布[Antigravity](https://antigravity.google/)，类似Cursor，可以免费使用Gemini 3 pro，小试了一下，体感不错
- OpenAI[推出](https://openai.com/index/gpt-5-1-codex-max/)GPT‑5.1-Codex-Max
- Meta[发布](https://ai.meta.com/blog/segment-anything-model-3/)SAM 3模型（Segment Anything Model 3），用文本、示例图像和视觉提示（如点、框）在图像和视频中进行对象检测、分割和跟踪
- AI2[发布](https://allenai.org/blog/olmo3)OLMo 3（7B，32B），真正的开源，不仅开源权重，还开源了训练数据、训练过程、checkpoint、中间思维过程
- Google[推出](https://blog.google/technology/ai/nano-banana-pro/)Nano Banana Pro
- 微软[推出](https://www.microsoft.com/en-us/microsoft-365/blog/2025/11/18/microsoft-agent-365-the-control-plane-for-ai-agents/)Agent 365

# 投资&商业

- Cursor用2年达到了10亿美元的ARR，很猛
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-11-24-leotalk-ai-weekly-10-base-model-n-specialized-mode/1763997047_1.jpeg" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
- BTC掉下9万刀了
- 微软（$10B）和英伟达（$5B）一起投资Anthropic（估值达到$350B）

# 其他阅读

- [https://github.com/ZHZisZZ/dllm](https://github.com/ZHZisZZ/dllm)
- [Seer: Online Context Learning for Fast Synchronous LLM Reinforcement Learning](https://arxiv.org/pdf/2511.14617)
- [TiDAR: Think in Diffusion, Talk in Autoregression](https://arxiv.org/abs/2511.08923)
