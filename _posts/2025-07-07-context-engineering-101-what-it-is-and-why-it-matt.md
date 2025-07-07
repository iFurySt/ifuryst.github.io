---
layout: post
title: "一文看懂上下文工程（Context Engineering）"
date: 2025-07-07T08:00:00+08:00
tags: AI
categories: AI
giscus_comments: true
tabs: true
pretty_table: true
toc:
  sidebar: left
---

为什么最近大家都在聊Context Engineering？

这个词似乎突然爆火，但这个概念并不是新的概念，而是从大语言模型诞生并进入应用层之后一直存在。只不过随着AI能力的发展和实际应用需求的提升，它终于被重新放上了聚光灯下，[Andrej Karpathy](https://x.com/karpathy/status/1937902205765607626)6月25日的推文助推下，更多人关注了

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-07-07-context-engineering-101-what-it-is-and-why-it-matt/1751866810_1.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

本文将带你从提示词工程一路走到上下文工程，梳理清楚它们的关系，并了解为什么上下文工程这么重要

## TL;DR

对于不想看全文的，可以直接看摘要：

本质来说上下文工程（Context Engineering）和提示词工程（Prompt Engineering）是一个东西，前者是一个更加fancy的叫法，也从狭义的提示词扩大到上下文的维度，涵盖更加广的上下文工程实践

用Agent的例子来说明，就是Agent每次执行的时候都需要有合适的上下文（太多太少不够准确的都不行），这些上下文可以是预设的（比如预先写好的系统提示词），也可以是运行时获取的（通过工具调用外部获取），配合一些诸如RAG、Memory、读写、Compact/Compression等手段可以更好的管理上下文，因此上下文工程就是如何将合适的信息填充到有限的上下文里的艺术和科学

## Prompt vs Context

在与大语言模型（LLM）打交道的过程中，我们其实一直在围绕两类输入工程打转：提示词工程（Prompt Engineering）和上下文工程（Context Engineering）

**前者更像是在告诉模型它是谁，而后者是喂给模型它需要知道的相关信息**

其实非常好理解，在基于LLM的应用运行期间，需要一些预设背景信息，且拥有合适的上下文信息，尤其是现在以Agent为主的应用，多轮次交互中每一轮次都需要不同的、合适的且准确的上下文信息，才可以最大化Agent的效果

## 提示词工程Prompt Engineering

最早底层模型能力还没有被大幅提升的时候，大家都在利用提示词挖掘底层模型的能力，我还记得当时Sam Altman还说过写提示词这个东西有些人很有天份，一下就知道怎么写

早期大家都是管理一堆的提示词，用于不同的使用场景，这也衍生出了一些诸如：GPTs，Character.AI、星野等这一些“Cosplay”的AI应用，这类应用本质上就是允许用户去编写提示词来驱动模型以某种形式去回复用户的问题

通过提示词控制也是相对符合直觉的一个行为，提示词工程里还有一些更加高阶一点的手段，比如：

- 少样本提示（Few-shot Prompt）：给出几个类似的示例，引导模型模仿
- 零样本提示（Zero-shot Prompt）：不给任何示例，让模型自主决定输出
- 思维链提示（Chain-of-Thought Prompt）：引导模型一步步说出来的自我思考过程，重点是提示格式而不是答案示例

少样本提示（Few-shot Prompt）:

```bash
文本：我太喜欢这部电影了！
情感：正面

文本：这道菜太难吃了。
情感：负面

文本：还行吧，我觉得。
情感：
```

零样本提示（Zero-shot Prompt:

```bash
文本：还行吧，我觉得。
情感：
```

思维链提示（Chain-of-Thought Prompt）：

```bash
文本：还行吧，我觉得。
情感分析：我们来分析一下这句话。"还行吧" 表示中等、不好不坏，"我觉得" 表示语气不确定或者没有强烈的情绪。整体来看，这句话情绪不强烈，偏向中性。
情感：中性
```

因此本质上提示词工程就是在告诉模型开始处理任务之前的一些预设，可以很有效的帮助模型做一个锚定，在此之后就让模型在这个范围内和方向上自我发挥

在这个阶段模型没有任何外部知识，也没有记忆等，全部依赖于提示词本身

## 上下文工程 Context Engineering

上下文窗口一直是模型能力的重要衡量指标之一，原因就是**上下文对于模型应用效果非常关键**

前面提到最早通过较为直觉的方式来写提示词，随着底层模型的发展和模型应用的普及，对于效果的追求也越来越高，从最早的泛娱乐式消费，到生产力提升的需求，上下文是**相对于模型微调来说更加低成本且可操作性更高**的方式来提升整体的效果

在上下文工程领域延伸出很多手段：

- RAG（Retrieval-Augmented Generation，检索增强生成）：通过语义化响亮搜索，从知识库中检索与用户问题最相关的文档片段，并拼接到上下文，提升回答准确性
- Memory（记忆）：引入长短期记忆，帮助模型回顾过往记录
- Tool Calling/MCP（工具调用）：通过结构化提示词告诉模型如何调用预定工具（如数据库查询、API调用等）来获取外部信息，是一种与世界连接的输入增强方式

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-07-07-context-engineering-101-what-it-is-and-why-it-matt/1751866811_2.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
我们是可以参考[**Context Engineering for Agents**](https://rlancemartin.github.io/2025/06/23/context_engineering/)里所做的分类（主要针对Agent语境下的分类）：
- 写上下文（Write Context）：上下文窗口限制，需要把过往的上下文存到外部，必要时召回
- 选择上下文（Select Context）：从已经保存的数据中选择合适的部分注入到上下文窗口中，帮助LLMs更好完成任务
- 压缩上下文（Compressing Context）：上下文超出的情况下，对上下文进行合理的压缩保留必要的最小内容
- 隔离上下文（Isolating Context）：拆分并分配不同的上下文给不同的子智能体或子任务，提高效率和清晰度

目前大家都在上下文工程领域持续深耕。简单说，就是**底层模型的性能提升是取决于几家头部模型厂商的，在有限的情况之下，应用层都是在拼上下文处理能力以及和用户交互的UI/UX**

因此我们其实可以留意到目前AI应用都是围绕这两点展开的，如何帮助模型更好的获取上下文去完成用户的需求+如何用更好的交互方式让用户与模型交互。反观UI/UX已经是一个体系化的学科之后，对于一个AI应用能否足够好用，就取决于上下文工程的能力。这样想我们就能知道为什么上下文工程如此重要且受关注面这么广

我们可以看到早期的RAG就是一种相对固定的外部信息获取，一般我们在RAG里做召回会用topk，也就是最匹配的k份材料（chunk）给到模型，本质上就是因为上下文是有限的，如何获取最合适的材料，就是RAG里需要不断去摸索的方向。

记忆模块也是一部分，现在也有很多人在这块投入研究，我觉得是一个非常值得投入研究的领域，记忆可分为长时记忆和短期记忆，通过ChatGPT这个APP我们也可以看得到一些实践，现在它可以召回以前的对话（本质上也是向量搜索这类方式），这样就是通过对话来实现记忆recall的一个过程，同时它也会在日常对话中去记录一些关键点到记忆条目里，这样就能建立一个长期记忆（最早记忆是会满的，我觉得没理由让用户去手动删除和管理记忆，现在就没有这个问题了）。

前段时间疯狂流行的MCP，也就是和以前的Function Tool，或者Tool Calling一样，就是让模型能调用一些预设的工具，去获取对应的信息来做决策，也是上下文工程的一种，这个方向是对于现有服务和基础设施，甚至是物理世界交互的一个标准接口，所以意义深远

总体而言，上下文工程涵盖的就是很简单的东西，给到模型的上下文内容，但是期间涉及的手段有很多值得研究和发展的领域和方向。这个也为未来AGI方向提供了一个必要的基础

## 界限并没有那么清晰

通常系统提示词不太会变，这个是有别于上下文的，否则严格意义上来说，提示词也是上下文的一部分，所有模型能看到的内容都统称为上下文。因此实际上现在讨论Context Engineering并不是一个全新的概念呢，而是自大语言模型诞生之初就一直存在的，只不过现在规范化、专业化和学科化

现在越来越多人认识到，随着底层模型能力的提升，prompt的需求程度在降低，现在演变出一个更加fancy的叫法，就是上下文工程Context Engineering，从更加广义的角度来定义，上下文工程自此进入人们的视野，也使得越来越多人关注

因此可以认为这两个工程都是在同样的目的：**目标很明确，就是通过合理的处理组装上下文，让模型效果最大化**

举例来说，我们来看看Claude Code的系统提示词（System Prompt）:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-07-07-context-engineering-101-what-it-is-and-why-it-matt/1751866812_3.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-07-07-context-engineering-101-what-it-is-and-why-it-matt/1751866812_4.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-07-07-context-engineering-101-what-it-is-and-why-it-matt/1751866813_5.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
从Claude Code的System Prompt中可以看出，我们可以看到它融合了**角色设定、少样本提示、工具调用**等手段，同时通过 Tool 使用能力动态扩展上下文，比如支持查看文件、编辑代码、提交 Git、拉取图片等。**这种设计结合了提示词工程与上下文工程，是一种典型的 Prompt + Context 混合型应用，本质上构建出了一个具备自主决策能力的 Agent**

## 新学科的出现

这边有一段在[Context Engineering for Agents](https://rlancemartin.github.io/2025/06/23/context_engineering/)这篇文章中的一段话，我觉得描述得很好：

> As Andrej Karpathy puts it, LLMs are like a [new kind of operating system](https://www.youtube.com/watch?si=-aKY-x57ILAmWTdw&t=620&v=LCEmiRjPEtQ&feature=youtu.be). The LLM is like the CPU and its [context window](https://docs.anthropic.com/en/docs/build-with-claude/context-windows) is like the RAM, serving as the model’s working memory. Just like RAM, the LLM context window has limited [capacity](https://lilianweng.github.io/posts/2023-06-23-agent/) to handle various sources of context. And just as an operating system curates what fits into a CPU’s RAM, “context engineering” plays a similar role. [Karpathy summarizes this well](https://x.com/karpathy/status/1937902205765607626):
> [Context engineering is the] ”…delicate art and science of filling the context window with just the right information for the next step.”

把LLMs类比成新的操作系统（OS），而上下文窗口（Context Window）则是LLMs的内存，内存是有限的，因此需要用一些辅助手段在磁盘、网络间去置换合适的数据到内存里，上下文窗口也是同理，在运行时需要合适的数据加载到上下文窗口内，才可以让LLMs发挥最大效果

随着LLM的流行和应用，未来的会涌现更多不同的学科， 我觉得上下文工程就是其中一个方向，是一个为LLM设计和管理输入上下文的一门新兴技术学科，可以预见，在未来的一段时间内，随着AI工程化的复杂程度提升，LLM与外界交互变多的情况下，上下文工程是一个极其重要的研究方向，可以进一步决定LLM能发挥出多大的潜力和能力

从应用到具身智能，都离不开模型对于外界信息的获取和感知，外界信息是无穷多的，如何在有限的上下文内把最有价值的信息提供给模型，决定了这个学科研究的方向

在未来，**Context Engineer**也许会成为AI团队中的关键角色之一，就像数据工程师之于机器学习团队那样重要

如果说Prompt是语言的编程，那么**Context Engineering就是系统级调度与资源管理，决定了模型能否发挥巨大的潜力**

## 上下文工程，是AI工程化时代的关键基建

随着大语言模型底层能力的不断突破，我们对如何更好地用好模型的关注也正从提示词的微调，逐渐转向对**上下文的理解、管理与动态构建**

Prompt Engineering是起点，Context Engineering则是让它走得更远的路。我们可以预设提示词来激发模型潜力，但能否持续发挥作用，最终还要看上下文工程能否构建出**精准、动态、可扩展**的输入

在未来，无论是智能体（Agent）的构建，复杂任务的编排，还是具身智能（Embodied AI）的落地，**Context Engineering都会是连接模型与现实世界的桥梁**。**它不仅是工程问题，更是产品问题、交互问题、认知问题**

也许未来我们会看到一个新角色的诞生：**上下文设计师（Context Architect）**，就像数据工程师之于机器学习，它将成为AI团队中不可或缺的一环。

这场革命，已经从写好一句提示词进入到了设计一个完整的上下文生态，也就是大行其道的Agent在做的事情和方向
