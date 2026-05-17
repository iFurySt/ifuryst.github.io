---
layout: post
title: "日常Harness"
date: 2026-05-17T08:00:00+08:00
lang: zh
translation_key: daily-harness
tags:
  - AI
  - Thoughts
categories: AI
giscus_comments: true
tabs: true
pretty_table: true
toc:
  sidebar: left
---

是时候写点Harness相关的了，此前零零散散在各种地方输出，都是碎片化的。加之Public后得到的反馈都是正向的，我想这个东西对于很多人来说，是个有价值的东西。牺牲自己的2小时时间，送给有缘人

# 解放思想

我的东西不新，甚至不一定适合你的工作流或产品，但是我的想法一定会让你有所得，这也是我想要通过这篇文章传达的。

相信还有很多人并不相信大模型的能力已经严重溢出了，一个可能是认知不够，一个是尝试的不够，后者是被前者驱动着的，因此从根源（fancy的说法：第一性原理）来看待，认知是需要首先解决的。

最近我反复和身边的人传播着敢想，敢于去挑战AI的能力边界，努力摸到天花板，读完这篇文章或许你会对于这句话有更好的理解。

# Harness Template

就从这个开源的Repo开始吧。相关的repo有三个：

- [https://github.com/iFurySt/harness-template](https://github.com/iFurySt/harness-template)
- [https://github.com/iFurySt/harness-template-cn](https://github.com/iFurySt/harness-template-cn)
- [https://github.com/iFurySt/harness-cli](https://github.com/iFurySt/harness-cli)

前面两个是一样的，中英文差异，我个人大部分会喜欢用中文的，少部分开源项目会用英文的。第三个是是用来快速new以项目的cli，本质也是是用了前面两个。用法如下：

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989811_1.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
直接在GitHub上使用Template来创建一个仓库。这个方式对于我整体要new新项目来说属于脱裤子放屁，多此一举了，所以我一般就是直接cli跑一下：
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989811_2.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
然后就可以快乐的开始与AI共舞了

开始更深入之前，先来说下Harness这个东西，AI Agent的发展有这么几个重要阶段：

1. Prompt Engineering
2. Context Engineering
3. Harness

遥想去年我还在写CE101这本书，往事不堪回首，毫不客气的讲，现在看到那些东西感觉就应该直接丢带垃圾桶里去。但是我依然觉得当时我花时间写是值得的，虽然现在我需要打自己的脸

直到大半年来Harness已经红遍大街小巷了，我不知道这个词的源头是哪里来的，我也不感兴趣，但是我觉得这个词用的太精妙了。

我们知道模型是非确定性的，我们不断写Prompt、Skills就是去约束模型的行为，让其朝着我们期望的方向去走，就好像骑马一样，马鞍、马勒、缰绳、马镫等这些东西都是未来去约束马朝着我们想要的方向行走、奔跑或停住。但是马只是动物，听不懂人话，只能通过训练和这些外部的工具去约束，大模型也是，模型无法做出确定性的结果，我们无法控制它，只能约束他，这就是为什么我们用Harness而不用Control之类的词的缘故

关于Harness，其实根据不同的语境，我觉得可以分为两种：

1. 针对产品/服务的Harness：比如配套的工具、配套的Memory机制、配套的Sandbox等，服务于模型，让其更好的发挥效果
2. 针对研发、创造等生产过程中的Harnes：配套的脚手架、环境、上下文等，是为了更好的创作

针对1型Harness，没啥好说的，去clone一下codex、claude code、openclaw或hermes的源码看看，借助ai分析一下，都真相大白了，没有什么太多的magic，号称自己harness牛逼的人，无外乎这几种可能：

1. 能力和眼界一般
2. 吹牛逼的骗子
3. 系统过于复杂（让他在各种努力下打造出一个高于SOTA baseline的产品，然后很高兴）

现有的这些harness技术，很早都有了，那为什么2年前没有这样呢？回头看看2年前的大模型能力。因此现阶段回归模型即产品，会是一个更加客观和正确的认知。所以关于1型Harness，我不再展开，各家产品好烂自己门清，要怎么集成应该也都心里有数

现在回归2型Harness，这个也是我的Harness Template的主战场，也是我相信能给个人、团队和组织带来实打实提升的点。展开之前，有几篇前面写的文章，有时间我觉得也值得看看：

- [**我们是如何在AI Era飙车的**](https://www.ifuryst.com/blog/2026/speedrunning-the-ai-era/)
- [**解决问题的原始冲动**](https://www.ifuryst.com/blog/2026/the-urge-to-solve/)
- [**Browser Use详解**](https://www.ifuryst.com/blog/2026/open-browser-use/)

里面或多或少的都讲了一些我在摸索和实践Harness的过程中的一些想法和实际的实践。

这套方法论的核心其实就在于让一切的东西始于AI也终于AI，AI产AI用，一切信息不出Repo。有点虚，一步步来，先看张图：

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989811_3.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
这个是我自己写的，我觉得这些点能较好的表达出我的想法。

## AGENTS.md

接着看看项目的目录：

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989813_4.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
非常简单，进来首先是到AGENTS.md和CLAUDE.md，基本能Cover主流的Agent了，然后这边的AGNETS.md通常是做目录（TOC）的，会把东西打散到docs里，这样能按需取用，减少上下文损耗
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989813_5.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
通常我们会按一些关键的节点或领域来划分，比如：
- 开始前要读：通常是一些协作规范、Repo的简要情况和一些指导性的东西
- 工作完要读：一般是一些收尾的东西，比如写历史记录、测试覆盖、验收等动作
- 提交前要读：通常会做一些比如全量本地测试或一些分支操作等动作
- 领域读取：最常见无外乎前后端了，再细化也有按照模块或者DDD之类的去选择性读取

这些基本上就是一个大型的自然语言Harness现场，用现在流行的说法，就是写了好多非标Skills，然后按需加载使用。

## docs

接下去docs，这里就很关键了，套用现在的说法，可以理解这里就是Karpathy大佬的LLM Wiki的思想了，只能说大佬（AI头部网红）的传播度比较高。

这里的目录划分没什么讲究的，只是我自己拍脑袋了一套出来，实际可以按照自己项目的情况和需求来调整，大概是这么一些想法点：

- AGENTS.md拆分出来的一些独立文件可以落在这里，可以单md文件，也可以上目录，里面更细化
- histories：这个我自己想出来的天才之作，有了这个，整个repo从Day1开始的一切Query和变化的历史都在案，带来的好处是，不需要写文档了，新人onboarding上AI就能知道过往的一切了。当一个功能出问题后也可以快速回溯哪里改了，哪里导致的，哪里退化的。也可以借机让一些跑得比较慢的人学习其他高手怎么Vibe的。某种意义可以当作是这个repo的记忆
- milestone/feature规划：一般是用文件系统来跟踪TODO的，哪怕在有了/goal（Ralph Loop）的今天，这个依然很有用，在上下文里跟踪TODO属于找死，更别说大feat，在文件里跟踪的好处是可以支撑长时任务的进行，也可以在进行中通过调整文件来动态修改milestone和目标（后续还会提到这部分）
- 其他都是什么产品定义、设计规范、参考文件、release文档等等

## 其他

其他的不多了，举几个重要的：

- scripts，通常是一些可复用的脚本，这部分AI也可以沉淀，这样后续可以持续服用
- skills，我没包含在template里，但是这部分其实是会有很多skills的，比如操作浏览器，登陆堡垒机或开发机，部署的指导等等
- 敏感文件，我一般会用诸如.harness或.agents之类的目录来存放一些敏感文件，这个目录会加到gitignore，目录里的文件也可以套用环境变量来做加密，避免key之类的明文罗盘，AI是可以在取用的时候执行一个脚本实时从env读取密钥解密拿到内容的。

# 用法

讲完了，或许很一般，但就好像我前面截图里那句名言`**Less is more**`一样，当我们使用起来，魔法就来了。我用实际的例子来讲吧。

## Open Computer Use

先来看看[Open Computer Use](https://github.com/iFurySt/open-codex-computer-use)。在开始这个项目之前，我需要先对现有的机制去做分析，如果是裸的直接用codex分析的话，很多内容无法沉淀的，最终会在一次次上下文compact中丢失很多分析的细节，因此我就通过harness template的机制让我在分析的过程中把得到的信息不断沉淀到docs里

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989814_6.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
而且因为逆向分析的过程是持续性的，需要用很多不同的工具搭配着来分析（~~买不起IDA Pro~~），有时候后面收集到的最新信息会覆盖掉之前错误的结论，因此这个持久化可**复利**的体系就显得非常有必要了。

有了这些信息，在后面的实现过程中，可以不断参阅这些信息去做实现，哪怕后续官方的版本升级后，也可以持续增量更新新内容，永续性就来了

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989814_7.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

## AIFi

再来到[AIFi](https://github.com/iFurySt/aifi)这个项目，这是一个金融分析的项目，项目名的灵感来源于DeFi之于非中心化金融，AIFi之于AI金融。这个项目0代码需求，本身就是大量的Skills组成的产品，目录即产品。

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989814_8.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
新时代开源，就是开源Skill。这边就是通过把传统的投资理财领域的专家建模成一个一个Skill，来达到让AI可以按需扮演不同的人来做不同的工作。经典的来了，这次我就不是使用docs了，我直接让AI在根目录的research里持久化每次调研分析的结果，这样可以实现调研**复利**
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989815_9.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
这里让架构已经不是软件的架构了，而是整个体系的架构。
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989815_10.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
看一些分析效果
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989815_11.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
整体可以说是和以前的deep research类似了，但是现在我们还需要单独打造一个deep research么？codex/claude code打开，套上这样一个harness，不管是什么领域的，都可以沉淀出很好的内容
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989816_12.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
上点[Gen UI的Skill](https://github.com/iFurySt/visual-html-gen-ui)就可以产出一些可视化的内容了。

# 解放认知

提到的这些都是希望以小见大，让你的认知打开。当遇到任何的问题时都尝试去挑战一下AI，不断扩宽它的边界，看看它的天花板在那里，这会决定你在这个时代的天花板在哪里。

再举个简单的例子，最近我在实践一个叫[Nano LLM Serve](https://github.com/iFurySt/nanoLLMServe)的项目，主要是想build from scratch，从实践层面去撬动自己对于模型和Infra的认知，在这期间，我不断和ChatGPT/Codex去Co-Learning，去Co-Work，我一个毫无名气的破本科生，看公式如看天书的人，现在我可以和别人讨论Speculative Decoding，讨论Steering Vectors，讨论KV Cache Network。而且还能自己探索最新的Interaction Model，探索Diffusion Language Model。从应用出发，反推理论，和AI一起，不断打碎旧认知里为自己设下的边界，这不仅是这个时代的生存法则，更是任何时代都应该具备的生存法则。

说到生存法则有点硬，从Just For Fun的角度来阐述或更好点，我昨天才发了一条消息给朋友：

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989816_13.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989817_14.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
或许对于喜欢整活的人来说，有了AI放大的能力是无限的，能限制的只有碳基身体的脆弱以及24h的时间限制

# 尾声

我相信如果你能把这个harness template用起来，那肯定会开始慢慢认知到一些原来无法认知到的东西。我并不觉得这个东西一定会适合你，但是可以陆续去调整成适合自己的harness

最近最有感触的依然还是学会与AI共舞，就像在AI时代长大的年轻一代，会顺其自然的就把AI当作工具使用，就好像我们以前使用PC、互联网、手机等东西一样。只不过因为习以为常，加上年龄增长带来的阅历提升，开始慢慢丧失了不断尝试、不断试错、不断失败最后有所得的能力了。时代其实一直在变，只是人从变开始慢慢寻求不变，短暂的一生无法拥抱太多的变化。
