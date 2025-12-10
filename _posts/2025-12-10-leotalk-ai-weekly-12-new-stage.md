---
layout: post
title: "LeoTalk AI周知 12: 新阶段"
date: 2025-12-10T08:00:00+08:00
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

重发一下我在pyq里发的内容吧：

或许可以认为进入新阶段了。以Transformer为主的预训练百尺竿头了。oai在卷超级入口，应用化产品化争日活。Google产品矩阵拉起来。字节的豆包和阿里的千问（蚂蚁灵光）开始陆续。Token消耗量持续增长，基模或者maas还是只有大厂和头部玩家可以继续玩。这波技术浪潮已经够各行各业蔓延和玩好几年了。商业世界的叙事很多都是面向大厂。纯工具很难防守，生态位很窄，垂类、私有化更有市场。有时候会有很罗生门的感觉，一边solopreneur疯狂鼓吹，一边大厂会更大，叙事主体、背景和目的的差异导致结论和话术的差异。技术服务于商业化么？或者说只有商业化能驱动世界发展吗？

# 研究报告

- [How AI is transforming work at Anthropic](https://www.anthropic.com/research/how-ai-is-transforming-work-at-anthropic)：基于132个工程师的报告

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-10-leotalk-ai-weekly-12-new-stage/1765370447_24.webp" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-10-leotalk-ai-weekly-12-new-stage/1765370447_25.webp" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-10-leotalk-ai-weekly-12-new-stage/1765370447_26.webp" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
- UN的报告：[THE NEXT GREAT DIVERGENCE Why AI May Widen Inequality Between Countries](https://www.undp.org/sites/g/files/zskgke326/files/2025-12/why-ai-may-widen-inequality-between-countries.pdf)
- Adobe的[黑五报告](https://business.adobe.com/resources/holiday-shopping-report.html)，AI购物流量增加805%
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-10-leotalk-ai-weekly-12-new-stage/1765370448_27.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
- OpenAI发布[State of Enterprise AI](https://cdn.openai.com/pdf/7ef17d82-96bf-4dd1-9df2-228f7f377a29/the-state-of-enterprise-ai_2025-report.pdf)报告，大概讲了Adoption上升，其他感觉没啥亮点值得关注
- OpenRouter发布[State of AI An Empirical 100 Trillion Token Study with OpenRouter](https://openrouter.ai/state-of-ai)，50%用于变成，超过写作、搜索等场景。2024-12后（o1发布后），推理模型承担一半以上的流量，，工具调用常态化。开源模型占1/3用量，DeepSeek和Qwen占比30%，开源模型多用于角色扮演的场景。Claude 4 Sonnet在5个月后仍有40%的留存，其他大量模型被快速淘汰，说明能适配真实应用场景的可以持续留存；开发者普遍采用多模型策略。
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-10-leotalk-ai-weekly-12-new-stage/1765370448_28.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-10-leotalk-ai-weekly-12-new-stage/1765370448_29.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-10-leotalk-ai-weekly-12-new-stage/1765370449_30.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-10-leotalk-ai-weekly-12-new-stage/1765370449_31.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-10-leotalk-ai-weekly-12-new-stage/1765370450_32.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-10-leotalk-ai-weekly-12-new-stage/1765370450_33.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-10-leotalk-ai-weekly-12-new-stage/1765370451_34.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-10-leotalk-ai-weekly-12-new-stage/1765370451_35.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-10-leotalk-ai-weekly-12-new-stage/1765370451_36.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-10-leotalk-ai-weekly-12-new-stage/1765370452_37.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-10-leotalk-ai-weekly-12-new-stage/1765370452_38.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-10-leotalk-ai-weekly-12-new-stage/1765370453_39.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-10-leotalk-ai-weekly-12-new-stage/1765370453_40.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-10-leotalk-ai-weekly-12-new-stage/1765370453_41.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-10-leotalk-ai-weekly-12-new-stage/1765370454_42.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-10-leotalk-ai-weekly-12-new-stage/1765370454_43.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-10-leotalk-ai-weekly-12-new-stage/1765370455_44.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
# 产品&模型发布
- DeepSeek[发布](https://x.com/deepseek_ai/status/1995452641430651132)DeepSeek-V3.2和DeepSeek-V3.2-Speciale，对标GPT-5，稀疏注意力
- Mistral[发布](https://mistral.ai/news/mistral-3)Mistral 3模型，包含14B、8B、3B和Large 3
- 苹果推出视频模型[StarFlow-V](https://starflow-v.github.io/)
- 豆包和中兴推出豆包手机助手预览版。意想不到的火了，卖光了，中兴股价上涨，底层OS出现锤子的SmartisanOS身影。当然也引发了一些诸如微信封号的事件。进一步引出生态之战。
- 这周快手连着几天发布可灵相关的模型：[Kling O1](https://x.com/Kling_ai/status/1995506929461002590)多模态（文本图片视频）模型，[IMAGE O1](https://x.com/Kling_ai/status/1995741899517542818)图片生成和编辑模型，[VIDEO 2.6](https://x.com/Kling_ai/status/1996238606814593196)多模态视频生成模型，[Avatar 2.0](https://x.com/Kling_ai/status/1996592857096868075)数字人生成模型。和之前千问的策略一样，连着炸，声量更大
- 字节发布[Seedream 4.5](https://seed.bytedance.com/en/seedream4_5)，图片生成和编辑模型
- 马斯克发了Tesla的机器人[跑步视频](https://x.com/elonmusk/status/1995974292300071015)，拟人程度高。Figure AI也回了一个他们家机器人的[视频](https://x.com/adcock_brett/status/1996426782590070860)
- 智谱[发布](https://z.ai/blog/glm-4.6v)GLM-4.6V
- Google针对Ultra级别的订阅[推出](https://blog.google/products/gemini/gemini-3-deep-think/)Gemini 3 Deep Think
- 微软开源[VibeVoice](https://microsoft.github.io/VibeVoice/)，TTS模型，可以Gen 90分钟长度的音频，包含4个不同的音色
- Google[推出](https://workspace.google.com/blog/product-announcements/introducing-google-workspace-studio-agents-for-everyday-work)Workspace Studio，基于Google的产品比如Gmail、Drive等，用自然语言控制自动化任务

# 投资&商业

- [Anthropic雇佣律师准备IPO](https://techcrunch.com/2025/12/03/anthropic-hires-lawyers-as-it-preps-for-ipo/)，有望2026年初，有望将估值推到3千亿美元同时OpenAI也在准备IPO，有望达到1万亿美元。不管谁先上都有机会达成历史上最大的IPO
- 川普统一卖H200给中国，收走25%的钱，真生意人

# 其他阅读

- Anthropic收购JS运行时Bun（Node.js竞品）
- Sam在OAI内部发出红色警戒，公司会延迟广告、购物、健康等Agent的进程，专注于提升ChatGPT。来自Google的压力非常大
- Poetiq基于Gemini 3.0 Pro在ARC-AGI-2取得了54%的成绩（一个任务$30），超过Gemini 3 Deep Think（一个任务$77）。展示了在应用层深耕能取得的成果。他们[开源](https://github.com/poetiq-ai/poetiq-arc-agi-solver)了
