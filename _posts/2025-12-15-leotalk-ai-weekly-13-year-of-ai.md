---
layout: post
title: "LeoTalk AI周知 13: AI这一年"
date: 2025-12-15T08:00:00+08:00
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

时代杂志发布了The Architects of AI. 八个在AI领域重要的人（欧美为视角的国际视野）。

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-15-leotalk-ai-weekly-13-year-of-ai/1765811447_69.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-12-15-leotalk-ai-weekly-13-year-of-ai/1765811451_70.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
2025年也接近尾声了，大家也纷纷在做Recap了，去回顾这一年来的情况。从AI的角度来看，1年的变化非常的大。有些东西真的去回顾了才恍然，才一年不到啊。

今年过年期间DeepSeek开源，轩然大波，目前看来，最大的意义是直接带动全世界的企业（尤其国内企业）的AI发展进程（中大企业无需投入资源去练基模，中小企业可以直接享用在当时非常不错的推理模型），更是直接把推理模型达成事实标准（在这个事件之后OpenAI才跟进免费开放o1推理模型，现在推理模型成为各家基模厂商的免费标配了），也进一步推动今年AI Agent普遍利用推理去做CoT等Test Time Scaling。

今年以千问、DeepSeek、Kimi、GLM、MiniMax为首的这些模型厂，通过开源的势头，已经陆续追上世界第一梯队的能力，现在和闭源头部模型的差距越来越小了，也成功接过Meta的开源大棒。

阿里虽然因为打外卖战浪费掉很多资源，尤其是现金，也损失了一些风评，但是在下半年可以感觉到在整个组织层面调整战略方向，现在重新重视AI，包括现在重构推出千问APP（原来通义全部合并进去）以期望能在C端流量入口去和豆包、DeepSeek以及元宝竞争。另外不得不说千问在开源领域的牛逼，今年发布无数的开源模型，一个比一个牛，现在Qwen的模型已经成为很多厂商微调或者特点垂类任务的事实标准，基本上大家都用，这点基本上和DeepSeek的开源一样，只是一个是一战成名，一个是持续输出，这些势必会在人工智能里的历史上留下浓墨重彩的一笔！现在投资人和市场也开始重新审视阿里，不再把阿里当成单纯的电商公司了，开始用AI公司来看待，也愿意给到20倍PE的高估值。

Anthropic在今年也进一步分化，更专注于Coding领域，这个领域的市场规模和利润空间已经被证明了，Anthropic也靠着大量的toB、toD稳步拿到利润，正在进一步推进明年的IPO。

反观OpenAI，GPT-5没有出现Aha Moment，融资也开始承压，包括大厂（尤以Google为首）的挤压，今年（尤其H2）OpenAI明显在应用层持续发力，开始卷日活，希望通过生态位来对抗大厂的挤压。但是这几个月受到Gemini持续的冲击，现在想对收敛了一下应用层的探索，但是依然还是会往这个方向。可以发想OAI和Anthropic的方向彻底不同

Google这边组织架构也持续调整，今年持续在Gemini发力，Veo等视频模型也是有非常大的建树，包括今年反垄断法的胜利，让投资人减少了很多顾虑，加之对于ChatGPT抢走Google的搜索流量的担忧，在现在看来似乎不是一个很需要担心的点，至少目前Google的搜索量依然健康，Google也在大力革命自己的搜索，现在AI Mode+Gemini，全面下场。

也可以看到今年不仅仅只有以Transformer为主的语言模型在发展，现在也出现了包括世界模型在内的探索方向，以LeCun和李飞飞在内的就是典型代表。

另外在今年我们也可以看到Nvidia以5万亿美元的市值规模登顶全球市值第一。现在也在大量的对外投资（虽然引发了循环投资和泡沫化的讨论）。AI公司也纷纷下场卷数据中心，卷机房，重资产投资。

今年也可以说是Agent元年，虽然市面上能看到的只有类似Manus、Lovart之类的产品走出来，但是其实在非C端领域，已经有非常多的实际应用，甚至不乏很有价值的应用。并且其实可以说Agent不是一个单独的概念，理论上应该是一种技术，所有的现有产品都可以将AI Agent这个技术融入进去，到每个环节，所以目前看不到杀手级应用也是合理的。

今年还有太多都关系没办法一一列出来了，只能说今年实在太精彩了。很喜欢这种每周甚至没天都有新的东西出现的日子和节奏。

# 研究报告

- 微软基于去年的3千万Copilot会话得出的[报告](https://microsoft.ai/wp-content/uploads/2025/12/What_people_do_with_Copilot-8.pdf)，移动端与健康有关的问题为主。深夜时段更容易出现哲学、宗教和存在主义之类的形而上话题。年初编程和技术为主，年中后社会和生活话题上升。总体而言看起来像是在表达Copilot从技术全往外走
- 麦肯锡[今年报告](https://www.mckinsey.com/featured-insights/year-in-review/year-in-charts)

# 产品&模型发布

- OpenAI[发布](https://openai.com/index/introducing-gpt-5-2/)GPT5.2，知识拉到2025年8月31日了，5.1的1.4倍花费，视觉能力提升多。Code Red之后还是更聚焦，更有危机意识了
- Mistral[发布](https://mistral.ai/news/devstral-2-vibe-cli)Devstral2和Mistral Vibe CLI
- Adobe[宣布](https://news.adobe.com/news/2025/12/adobe-photoshop-express-acrobat-chatgpt)可以在ChatGPT里免费使用Photoshop、Adobe Express和Acrobat，比如P图、编辑PDF等
- Google Labs[推出](https://blog.google/technology/google-labs/gentabs-gemini-3)[disco](https://labs.google/disco)，还有GenTab。新的浏览器形态探索，还挺有意思的！
- Google Labs更新了[Mixboard](https://labs.google.com/mixboard/welcome)和[Doppl](https://labs.google/doppl)。只能说Google Labs现在探索新的应用形态的速度还是相当可以的，希望能看到更多新时代产品走出来
- Cursor[推出](https://cursor.com/blog/browser-visual-editor)Visual Editor，可视化设计工具，类似拖拉拽低代码

# 投资&商业

- Fed还是继续降息了
- MiniMax和智谱计划在几周内完成港股IPO
- OAI取消了6个月的Vesting Cliff，进一步吸引顶尖人才的手段

# 其他阅读

- MCP进Linux Foundation了
