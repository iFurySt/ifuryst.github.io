---
layout: post
title: "解决问题的原始冲动"
date: 2026-04-21T08:00:00+08:00
lang: zh
translation_key: the-urge-to-solve
tags:
  - AI
  - Product
categories: AI
giscus_comments: true
tabs: true
pretty_table: true
toc:
  sidebar: left
---

AI时代改变的只是解决问题的方法，但是Geek或者说解决问题的人，依然是不变的。

今天就借助这两天做[Open Computer Use](https://github.com/iFurySt/open-codex-computer-use)的经历来聊聊这个。

背景是周五OpenAI发了一片文章[https://openai.com/index/codex-for-almost-everything/](https://openai.com/index/codex-for-almost-everything/)，然后Codex APP也更新了，其中Background Computer Use，着实让我和我的小伙伴震惊了，我们对于其带来的非抢占式Computer Use和那个灵动又自然的鼠标样式深深震撼了。在此之前我们的认知都是Connectors(比如Gmail之类的)+GUI（鼠标和键盘）去实现的Computer Use。但是OAI还是交出了一份牛逼的作业。

我们花了一天的时间分析和复刻，成功实现并开源了这个版本，对外通过MCP的方式可以给到所有的AI Agent去直接拥有非抢占式Computer Use的能力，录屏丢油管了：
{% include video.liquid path="https://www.youtube.com/embed/2s6aVpGiwaQ" class="img-fluid rounded z-depth-1" %}

这一版我们把功能性的都做掉了，也就是open-computer-use可以无缝的替换掉官方的computer-use，除了那个灵动的鼠标样式。我们先来说说这个过程，记得是早上11点开始处理，到凌晨2点正式发掉，差不多12个小时的时间，我们完成了这个曾经几乎不可能完成的。这背后的故事，我有话要说

# 解决问题的原始冲动

回顾ChatGPT发布前的年代，从学生时代起，捣鼓就成了主旋律，也是我一直在说的，just for fun，也正是这样，就算把自己的喜好玩成了自己的职业，内核一直没有变化过，就是发现问题，尝试解决，最后获得满足和喜悦。和玩游戏或者刷短视频在本质上没有太大的区别，都是人在满足自身的生化需求

但是过程还是有一定的差异的。我们会分析问题，收集信息，解决问题，验证结果并交付，整个过程可以按部就班，也可以充满了各种奇思妙想。

回到09年的时光，那时候除了灰鸽子、肉鸡之类的流行的东西以外，还有二进制逆向也很火，加密混淆脱壳这些字眼能勾起不少的回忆，还记得当时为了能逆向一个二进制，研究各种脱壳、汇编和OllyDbg等等，对着枯燥无味的界面津津有味的调试

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746581_18.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
回忆杀一波。再加上后来做安全，攻防更加对于解决（未知）问题的能力提出了新的视角。虽然我很菜，但是我学到了很多，不是工具使用技巧，而是那个思想。

现在仔细想想，其实也不是那个时间培养的所有的这些习惯和能力，我能回忆起更加老的经历，似乎从小就喜欢用自己感悟的野家拳去整活，不喜欢从寻常路，这个内核一直跟随着我，直到今天

就好像Logan昨天repost了他在前年Devin刚出来时写的文章附带的那个核心观点：

> It's been two years since I wrote this article, and the premise is still true: software engineers are paid to solve problems. Coding is just a tool to do so.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746581_19.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
如果有人觉得AI的Coding能力可以抬走自己，那其实只是把自己当作一个Coder。有2个方向可以聊：
1. 从AI所有的角度思考，确实可以抬走自己，而不是因为Coding
2. 把自己当作解决问题的人，或者提出解决方案的人，那AI的Coding能力，只是其中很小的一部分

这也是为什么我们会很兴奋的在一天内把这个东西搞定的原因，因为我们都保留了解决问题的原始冲动，而且AI为我们提供了更加强大的军火库，能阻碍我们的，只有我们的思维。

# 打破一切的墙

首先就是执行，也是一样的方法，在开始之前，我们需要足够的信息支撑我们（或者AI）的下一步行动。那我们就从我们想要的这个开始。

我依然选择从我们沉淀出来的[harness-template](https://github.com/iFurySt/harness-template)开始，作为一个template开启一个新的repo，好处是不再需要额外写什么东西了，直接拉过来用，AI在分析和执行过程中会持续把一些内容沉淀到这个repo里的docs里，这何尝不是Karpathy提出的LLM Wiki呢？

其实我已经不知道一开始是如何发掘的，就是自然而然的，我们分析出了Codex APP是靠着一个独立的MCP服务来实现Computer Use的，在这个位置`~/.codex/plugins/cache/openai-bundled/computer-use/1.0.750/Codex Computer Use.app`

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746582_20.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
小小的26.5MB，承载了这个牛逼的功能，不仅感到欣喜，因为分析它的工作量不会特别大。后来我们进一步分析出其中有个Client服务`SkyComputerUseClient` ，然后我们就打算开始了，我已经不记得了，但是好在我们有template
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746582_21.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
翻看下历史记录，可以很明确的知道，我们一开始就是让Codex去帮忙分析这两个，然后内容不断落到了这个repo里了。期间并行的几个session都在做不通的工作，关于Codex Computer Use的全貌也开始慢慢浮现了：
- 基于Swift写的。知道这个后，我们也直接用swift实现（还记得以前学swift的艰难，现在AI分分钟写完）
- 整体对外是MCP提供的，有9个工具。知道后直接复刻
- 原理是通过Accessibility（AX）去和UI树交互，从而达到可以在后台与APP交互，并附带截图回来做多模态推理下一个Action。在AX不行的时候会回推到osascript（Apple script），甚至是鼠标操作。

一开始我们并不打算直接提供MCP，这就是神奇所在。Usoon上完厕所回来跟我说，我们应该直接做一个MCP服务，听完他解释的，我立马表示认可，这或许就是人类的蜂巢智慧，一个人再牛逼，也永远有偏见。

一开始我们是通过让codex将他上下文里的9个工具的描述和参数输出，实际上是有点出入的，不是100%严格对齐的，后来我们直接给codex配齐了mitmdump，然后让其调用自己的codex去实现抓包dump，里面有大量的system prompt和tools，一下就能严格获取描述和参数定义。

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746584_22.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
这就是CLI的魅力，套娃获取，后续我们对比评测也是走了一样的方式，query里明确指定叫他走computer-use或者走open-computer-use去做任务，就能达到对比并且dump过程得到数据，这个就是eval和改进最需要的东西！

在忙碌之余，我甚至还拉了一个独立的session，叫他直接设计LOGO，通过直接生成几份SVG，往来几下，就得到了一个我们要的LOGO了（现在看来，回头要换一下那个鼠标，换成无柄的）

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746585_23.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746587_24.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
ffmpeg/magick之类的工具用得比谁都溜，而且拥有多模态能力，自己可以验收结果，这点非常舒服

在往后其实是对工具执行结果做一个校验，一开始是通过让codex对computer-use的9个工具分别做3个调用输出samples来迭代，后来发现这样其实也不太严格对齐，因为又单独开了一个独立的session，去分析为什么不能通过mcp client直接调用Codex Computer Use，本质上它就是一个符合MCP协议的，前面试了一下一连上进程就死。这次分析发现，实际上是因为SkyComputerUseClient只认同样签名的父进程调用，因为我们让Codex用go直接拉一个cli，通过一定的手段直接吃Codex app的签名过去，顺利执行了，现在我们就拥有了通过CLI执行官方MCP的能力了。

有了这个能力后，可以非常方便的让Codex去校验两边的输入输出做对齐了，这也是经常在实践中遇到的问题，当AI一直解决不了一个问题的时候，你叫他再试试，努力什么的都没用，因为他缺少你想要的那个东西的相关上下文，因此能提供上下文给AI，是人的责任和义务，也是最终AI能走到什么地步的关键。（这个贯穿在这篇文章或者说这次整活的全过程）

至此我们的功能性都解决了， 其他是给流程和丝滑度加分的产品力。因为是一个独立的服务（APP），因此需要单独获取Accessibility和Screen & System Audio Recording的权限，所以为了体验好，OpenAI借助Software.inc（被前者收购了）的能力，做了一个体验超级丝滑的浮窗，只要拖动就行，这个东西也花费了我们一点时间去调试和改造，但是效果还是很棒的（具体参见YouTube里的录屏）

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746587_25.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
以及发布到npmjs，通过npm i -g open-computer-use就能一键安装，这些全都是AI做的，给一个gh，帮忙点击一些东西就完事了。
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746590_26.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
还包括一键安装到codex的mcp或者codex.app的plugin，也包装了plugin。方便一键启用，而不需要复制json之类的去对应的配置里配置。这些都是丝滑的体现

后来的迭代中，我们直接用了自己的open-computer-use做dog fooding，结果是非常丝滑，很有效，功能性上和官方的没啥差别了。

最后就是传统艺能了，录屏和剪辑，问AI要了音频网站，随便捞了一个配乐，至此这个开源项目就可以发布了。

但是故事到此还没结束，功能性满足之后，我们还是放不下那个鼠标，到X上逛了一下发现Software.inc的Ari发的：

他们是3个人实现的这个，我就把视频下载下来，丢给codex去抽帧分析，开始了单独实现一个StandaloneCursorLab的项目，几个小时后，我们有了一个还算过得去的初始版本：

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746591_27.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
这个版本还是调优过的，也让codex去找一些相关的paper和开源项目做参考和借鉴，里面最关键的就是曲线的绘制和选择以及cursor移动速度的控制。

就这个版本直接上，其实是没问题的，但是还是没有刻画出原版的那种灵动的感觉！我又让grok帮忙基于那个推文去挖掘一下信息，看看能否找到一些开源的方案，

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746596_28.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746598_29.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
只能整体从他们的推文和其他的评论里推断出一些关键字，其中：
> calculates natural and aesthetic motion paths
是我最想要的，但是计算出几个都不是很理想。然后我又新开了一个独立的session，开始逆向工程，因为我想要的一切算法都在二进制里，然后就看到了这些画面：
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746600_30.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746601_31.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746601_32.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746602_33.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
不敢想一个人要去逆向分析这些东西，需要耗费多久？AI就可以自主的去完成，然后实现并验证。

{% include video.liquid path="https://www.youtube.com/embed/KRUq5GUHv1Q" class="img-fluid rounded z-depth-1" %}

至此艺术已成

# 尾声

一段小旅程，也是一段奇幻冒险。

想象力和行动加起来，是一个很厉害的组合能力，在畅想诗和远方的同时，也能稳稳把住方向盘，用力踩油门。
