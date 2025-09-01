---
layout: post
title: "大模型上下文工程实践指南-第2章：上下文工程技术栈"
date: 2025-09-02T08:00:00+08:00
tags:
  - AI
  - Book
  - CE101
categories: AI
giscus_comments: true
tabs: true
pretty_table: true
toc:
  sidebar: left
---

# 2.1 上下文窗口限制与问题分类

## 2.1.1 长上下文≠好上下文

### **上下文窗口**

要了解和学习上下文工程， 首先需要理解上下文窗口。我们先来看下面这个表：

可以看到，现在所有的SOTA大模型的上下文空间都在**1M以内**（[Llama4有10M](https://ai.meta.com/blog/llama-4-multimodal-intelligence/)），这个就是天然的限制，也是**为什么上下文工程存在的原因之一**。这就好比内存之于CPU一样，CPU运算的时候需要不断访问数据，而硬盘的访问速度太慢，因此需要借助内存来提供较快的访问速度，但是内存是有上限的，所以计算机不能无限制的运行程序（运行程序就是将程序和对应的数据都加载到内存中），随着技术的发展，也延伸出很多相关的内存技术，比如分页分段、虚拟内存、内存置换等等。虽然现在内存不断提升，尤其在大语言模型训练和推理过程中都使用了大量的内存，但是依然没有逃脱资源限制的问题。上下文空间就是这么一个存在，让大语言模型可以基于这些数据去推理，因此才有了围绕上下文空间限制而衍生的一系列技术，这些技术就统称为上下文工程技术。

围绕着上下文窗口，可以很直观的得出这么几个场景：

- 上下文太长，超过上下文窗口限制
- 上下文太短，不足以支撑推理
- 上下文很长，但是还没超过上下文窗口限制
- 上下文适中

基本上从长度来说，我们可以得出这些情况，进一步看看。首先我们会遇到第一个问题**上下文长度限制**，现在的大语言模型都有上下文窗口长度，通常SOTA模型是1百万左右的上下文空间，因此我们能传入的上下文有长度限制，此时就会遇到第一个情况，上下文超过上下文窗口限制的情况。

其次是当上下文存在长度限制的时候，我们可以在有限范围内组装上下文，这就有这么几种情况，传入太少的上下文，这种情况可能会导致**上下文不足**，导致模型无法顺利输出想要的结果。那我们尽可能填满上下文窗口呢？也就是尽可能多的上下文，这种情况会出现几种问题，**过多的上下文**会导致模型无法聚焦于关键目标，容易分心。因此在长度这个维度，我们的目标是提供**合适长度的上下文**。

### 从长度到语义

上面是基于上下文长短来进行分类的，但是实际上上下文工程里遇到的问题不是这么简单的问题，还有更深层的问题， 因为上下文说到底还是自然语言的范畴，是为了让大模型更容易理解背景信息和目标而提供的内容，因此其实我们海英个进一步关注上下文遇到的问题。[Drew Breunig](https://x.com/dbreunig?lang=en)在[这篇文章中](https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html)提出了四个定义：

1. **上下文污染（Context Poisoning）**：幻觉等错误进入上下文，被模型反复引用，导致持续的错误
2. **上下文分心（Context Distraction）**：上下文太长，模型反而忽略了训练中学到的东西
3. **上下文混淆（Context Confusion）**：无关的上下文被模型用来生成低质量回答
4. **上下文冲突（Context Clash）**：上下文中的不同信息或工具互相矛盾

这几个分类涵盖了我们前面分析拆解的几种情况，因此我们会按照这几个划分的方向来看看。只不过这几个方向有些许重叠，我思考了一下，总结出有这么几个分类：

1. **信息污染（Information Poisoning）**：错误信息持续留在上下文中，其实不局限于当前的上下文，这个信息污染是有可能从运行时的上下文外溢到外部存储的，比如长短期记忆，或者一些Specification。容易造成重复错误行为、目标偏离和行为死循环。
2. **注意力偏移（Attention Misalignment）**：上下文长度增加会导致效果变差，其中的核心是上下文分心，模型被上下文分散了注意力，并且还会进一步让注意力从目标或指令转向无关的上下文，容易造成忽略指令、回答随机和无法聚焦。
3. **语义冲突与混乱（Semantic Conflict & Confusion）**：上下文存在歧义、矛盾或冗余等情况，导致模型难以理解和识别，导致最终效果不符合预期。容易造成误解、矛盾回答和答非所问。

这个是我自己的分类，其实整体识别和认识的问题是类似的，我们也会借用Drew Breunig的一些例子和其他的资料引用来说明和佐证。我们基于这几个分类分析学习，未来遇到问题时能快速分类定位并进一步思考解决方案。

## 2.1.2 常见问题分类

### 信息污染（Information Poisoning）

**信息污染（Information Poisoning）**是在上下文中充满了各种数据，尤其是在Agent这种复杂环境下，容易产生很多相关和不相干的数据。随着时间的推移，上下文就会堆积各种数据，当以Transformer的注意力机制驱动的大模型在推理的时候，就会导致被大量不相关的内容分散注意力，此时就会导致效果的下降。

这里面比较严重且突出的问题是**上下文污染（Context Poisoning）**，或者也可以称为**上下文投毒**。[Gemini 2.5 技术报告](https://storage.googleapis.com/deepmind-media/gemini/gemini_v2_5_report.pdf)里描述了Gemini 2.5 Pro被用来作为Agent自主通关了宝可梦游戏，这份报告主要展现了Gemini 2.5 Pro的长上下文推理和多步任务规划能力，能够解决复杂迷宫、道具获取、战斗策略等问题。里面有一部分值得我们注意的，就是关于在处理超长历史时偶尔会陷入重复行为或幻觉，在部分情境下会很出现目标混淆或策略固执等问题。文中有一段是这样描述的：

> Fixations on delusions due to goal-setting and also due to the Guidance Gemini instance are not an uncommon occurrence in watching Gemini Plays Pokémon - the TEA incidence is hardly the only example of this behavior. An especially egregious form of this issue can take place with “context poisoning” – where many parts of the context (goals, summary) are “poisoned” with misinformation about the game state, which can often take a very long time to undo. As a result, the model can become fixated on achieving impossible or irrelevant goals. This failure mode is also highly related to the looping issue mentioned above. These delusions, though obviously nonsensical to a human (“Let me try to go through the entrance to a house and back out again. Then, hopefully the guard who is blocking the entrance might move.”), by virtue of poisoning the context in many places, can lead the model to ignore common sense and repeat the same incorrect statement. Context poisoning can also lead to strategies like the “black-out” strategy (cause all Pokémon in the party to faint, “blacking out” and teleporting to the nearest Pokémon Center and losing half your money, instead of attempting to leave).
> 翻译成中文是
> 在观看 Gemini 玩《宝可梦》的过程中，常常会看到因为设定目标或受到“指导版 Gemini 实例”的影响而产生的执念式妄想，这并不是个别现象，TEA 事件也只是其中一个例子而已。其中一种更严重的情况被称为“上下文污染”（context poisoning）——即大量关于游戏状态的错误信息被写入到上下文中（包括目标设定、总结等部分），这类污染往往需要很长时间才能纠正。一旦发生这种情况，模型可能会执着于实现一些根本不可能或毫无意义的目标。这种错误还常常伴随着“死循环”现象。尽管这些行为对人类来说明显是荒谬的，比如模型可能会不断尝试“进出一座房子，希望门口的守卫因此移动位置”，但由于上下文中的错误信息大量存在，它会使模型忽视常识，不断重复错误的判断。上下文污染甚至会导致模型采取一些极端策略，比如所谓的“黑屏策略”：故意让队伍中所有宝可梦全部昏迷，从而“黑屏”被传送回最近的宝可梦中心，同时损失一半的钱，而不是尝试正常离开当前区域。
> 也就是**在上下文过长的情况之下，因为一些错误或者不合适的信息混杂在上下文并且一直持续存在于上下文中，导致Agent可能不断重复做出错误的决策或举动，这个负面效果需要经历较长的时间，这个时间就是对应的信息慢慢从上下文中淡化或者消失的过程。**

因此上下文窗口大小在现在这个发展阶段仍是一把双刃剑，而不是银弹，也就是意味着更大的上下文不一定是最好的选择，还是要取决于具体的使用场景和上下文工程策略来决定，因此不要盲目追求大上下文窗口和超长上下文的组装，那样有可能让结果恶化，并且这个不一定在开发阶段能感知到，很有可能是一个较为隐蔽不好观测的一个情况。

之前我也[分析](https://ifuryst.substack.com/p/manusai-agent)过，Manus分享的[这篇AI Agent的上下文实践的文章](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)中提到，AI Agent实践中使用少样本提示（Few-Shot）需要谨慎：

> Language models are excellent mimics; they imitate the pattern of behavior in the context. If your context is full of similar past action-observation pairs, the model will tend to follow that pattern, even when it's no longer optimal.
> This can be dangerous in tasks that involve repetitive decisions or actions. For example, when using Manus to help review a batch of 20 resumes, the agent often falls into a rhythm—repeating similar actions simply because that's what it sees in the context. This leads to drift, overgeneralization, or sometimes hallucination.
> 翻译成中文是：
> Few-shot 提示是一种常见的技术，用于提升大语言模型（LLM）的输出质量。但在智能体（agent）系统中，它有时却会在不经意间带来反效果。
> 语言模型擅长“模仿”，它们会学习和复刻上下文中呈现的行为模式。如果你提供的上下文里充满了相似的“动作—观察”对，模型往往会机械地遵循这些模式，即便这些行为已经不再是最优选择。
> 在需要重复决策或执行操作的任务中，这种问题尤为明显。比如，当使用 Manus 帮助审阅一批共 20 份简历时，智能体很容易陷入“节奏”中——重复执行同样的操作，只因为它在上下文中看到类似的例子。这种现象会导致“漂移”、过度泛化，甚至出现幻觉（hallucination）。
> 大模型倾向于模仿，因此如果提供的样本是规律重复的，就会导致模型倾向于模仿样本，导致后续的行为不断重复。尤其当你把模型先前的响应结果一起带入到新一轮推理中时，就可能造成结果偏差。模型会误以为“你希望我继续往这个方向走”，久而久之形成错误的趋势。

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-09-02-context-engineering-stack/1756742889_1.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
Manus的解决方法：
> The fix is to increase diversity. Manus introduces small amounts of structured variation in actions and observations—different serialization templates, alternate phrasing, minor noise in order or formatting. This controlled randomness helps break the pattern and tweaks the model's attention.
In other words, **don't few-shot yourself into a rut**. The more uniform your context, the more brittle your agent becomes.
中文是：
> 解决方法是引入更多的多样性。Manus 通过在动作和观察中加入少量有结构的变化来实现这一点——比如使用不同的序列化模板、替换措辞、在顺序或格式上加入细微扰动。这种“可控的随机性”有助于打破固定模式，重新调整模型的注意力焦点。
换句话说，别让 few-shot 提示把你困在一种套路里。上下文越单一、越一致，你的智能体就越脆弱。
也就是通过一定得刻意微调，避免大模型陷入一个循环圈套里，这是一个小技巧。

无论是Gemini在游戏中陷入错误幻觉与循环，还是Agent因少样本提示而产生重复行为，背后都体现了同一个风险：**当上下文中充斥了不相关、误导性强或错误的信息时，大模型容易产出错误倾向的结果。**并且这种错误倾向无法在短期内被快速纠正，通常需要有检测和预防机制才可有效缓解和进一步解决这类问题。

### 注意力偏移（Attention Misalignment）

虽然上下文空间的长度已经拉到了1M的Tokens数，但是实际我们在应用中，为了保持好的效果输出，几乎**不会撑满整个上下文空间**，因为**随着上下文的长度增大，最终的效果并不会持续正向提升，甚至有可能是降低的**。因为大语言模型底层是以Transformer为主的注意力机制驱动的，**过多的上下文会使注意力分散**，这个在后续Prompt技术中我们也会了解到，类似Claude Code里会有保证不断回想之前计划的目标以便模型不断集中在目标的执行上。

因此**注意力偏移（Attention Misalignment）**就是包括这一类问题，随着上下文长度增加，开始出现效果下降的现象。我们首先可以来看看[Chroma的一篇技术报告](https://research.trychroma.com/context-rot)，开篇提到了：

> Large Language Models (LLMs) are typically presumed to process context uniformly—that is, the model should handle the 10,000th token just as reliably as the 100th. However, in practice, this assumption does not hold. We observe that model performance varies significantly as input length changes, even on simple tasks.
> 大模型通常被假设可以均匀处理上下文，比如处理第10,000个token的效果和处理第100个token一样可靠。实际上这个假设不成立，即便是简单任务，随着输入上下文长度的变化，模型的表现会出现显著差异。

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-09-02-context-engineering-stack/1756742890_2.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-09-02-context-engineering-stack/1756742890_3.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
这张图是基于输入不同长度的重复单词，让模型去输出重复的单词，但是里面会包含一些特定的相似但是却不同的词汇，比如：
```plain text
Simply replicate the following text, output the exact same text: apple apple apple apple **apples** apple apple apple apple apple apple apple apple apple apple apple apple apple apple apple apple apple apple apple apple

````
大模型处理过程中，可以看到随着输入的长度增加，输出的效果呈现下降的趋势，也就是模型无法正常输出输入的文本了。可以观察长上下文对于模型效果的影响。

其中还做了另外一个实验，在语料库里增加**相似文本**，是会影响效果的
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-09-02-context-engineering-stack/1756742890_4.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
上面这个Needle就是正确的答案所在的位置，而Distractor是分散注意力的文本，也就是和答案有一定相似性的内容，而其他绿色部分则是完全不想关的内容。基于这个可以增加更多的干扰文本，如下图，分别表示不同数量的干扰文本。
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-09-02-context-engineering-stack/1756742890_5.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
基于这个情况，结果如下：
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-09-02-context-engineering-stack/1756742890_6.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
可以看到，在上下文固定的情况之下，随着相似文本数量增加，最终的效果也是呈现下降趋势的。
这里我们进一步引出上下文分心这个问题。上下文分心有多种可能，上面这个是因为**上下文充满了一些相似但是对结果没有帮助的干扰文本，甚至有些内容是和真正有用的内容是矛盾的**，这些综合起来就会对大模型产生干扰，使得生成效果下降。除此之外就是前面提到的上下文长度增加导致效果下降，这个问题不仅会导致分心，甚至会导致模型忘记了在训练过程中获得的通识能力。我们一起来看看这个情况。

**当上下文长度到达一定程度的时候，会导致模型过于专注于上下文，而忽略了在训练时获得的知识。**通常而言，哪怕我们没有提供任何上下文，模型都可以在接收到问题时给出回答，这是因为模型通过极其庞大的语料库训练之后，拥有了一定程度上的通识能力，而上下文可以看作是实时的信息。就好比我们一个普通的高中生可能就是一个拥有基础的通识能力的人，但是到大学就会选择不同的专业，目的就是成为一个专才，后续可以在某个行业里就业。

问题在于，随着多轮次的交互，上下文历史不断构建和累积，有可能会导致模型注意被过度集中在上下文而导致效果不佳的情况出现，我们依然还是在Gemini的技术报告中可以看到一段这样的描述：
> While Gemini 2.5 Pro supports 1M+ token context, making effective use of it for agents presents a new research frontier. In this agentic setup, it was observed that as the context grew significantly beyond 100k tokens, the agent showed a tendency toward favoring repeating actions from its vast history rather than synthesizing novel plans. This phenomenon, albeit anecdotal, highlights an important distinction between long-context for retrieval and long-context for multi-step, generative reasoning.
翻译成中文是：
> 虽然 Gemini 2.5 Pro 支持超过 100 万个 token 的上下文，但如何在智能体（agent）系统中有效利用这一能力，仍是一个新的研究前沿。在这类 agentic 设置中，有观察发现：当上下文显著超过 10 万 token 时，智能体往往倾向于重复其历史中的动作，而不是生成新的计划。这种现象虽然仍属经验观察，但它揭示了一个重要的区别：长上下文在检索任务中的应用，与在多步生成式推理中的作用，其实并不相同。
其实前面我们也有看到类似的情况了，也就是随着上下文不断累积，模型出现了不断重复一些动作，哪怕那些动作是错误的，为什么会出现这个情况呢？其实本质上就是因为模型过于关注上下文内容了，这其实也从另一个侧面说明了上下文之于模型推理的重要性，也间接说明了，**如果我们构建的上下文是不合适的或错误的，那么对于模型的推理有可能起到副作用**，这也是上下文工程中很重要的一点。

[Databrcks有一篇研究](https://www.databricks.com/blog/long-context-rag-performance-llms)给出了一些有趣的结论：**使用更长的上下文并不总能提升RAG的表现**。
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-09-02-context-engineering-stack/1756742890_7.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
这边是基于4份数据集来做RAG的效果评估。可以看到随着上下文增加，RAG的平均效果曲线不一样，随着上下文长度的增加，一开始所有模型的表现都是准确率的提升，但是随后开始不太一样，小参数模型开始出现恶化，准确率不升反降；而大参数级别的模型，还能多增长一小会才开始进入准确率的衰减区间；最后是大参数级别的SOTA模型，在增长到一定的程度后准确率的提升开始趋缓，也就是说到一定程度不再有明显的效果提升。

这里可以明确看到小参数模型对于上下文长度增加的耐受程度更低，而SOTA模型可以有更好的抵抗作用，但是可以明显感受到，**最初的上下文带来的增量是收益最好的**，因此在成本和效果直接，我们很容易找到平衡点应该是中间偏左的区域里，换句话说**在实际应用中不应盲目追求更多的上下文，而是要追求最好最合适的上下文**。

上下文分心还有一点，就是因为**上下文过长，模型无法专注于指令（instruction）**，比如我们在System Prompt里给出了对应的指示甚至是目标，但是在执行过程中，持续增长的上下文会导致指令和目标被“淹没”，使得模型忽略了一些很重要的信息，在Databricks这篇研究中也有提到失败的有几种原因：
- **重复内容(repeated_content)**：当大模型的回答是完全重复的词语或字符（无意义的重复）。
- **随机内容(random_content)**：当模型生成的回答完全是随机的、与内容无关，或在逻辑或语法上不通顺。
- **未遵循指令（fail_to_follow_instruction）**：当模型没有理解指令的意图，或未按照问题中指定的要求作答。例如，指令要求根据给定上下文回答问题，而模型却去总结上下文。
- **错误回答（wrong_answer）**：当模型试图按照指令作答，但提供的答案是错误的。
- **其他（others）**：当失败情况不属于上述任何一种类别时使用。
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-09-02-context-engineering-stack/1756742891_8.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-09-02-context-engineering-stack/1756742891_9.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
我们再来看看，在[Claude Code](https://www.anthropic.com/claude-code)执行任务的过程中，我们可以反复看到其会不断更新目标：
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-09-02-context-engineering-stack/1756742891_10.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-09-02-context-engineering-stack/1756742892_11.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
可以看到一个小任务计划出来5个目标，在执行过程中会持续更新目标，一个是给用户进度反馈，另一个更重要的是让模型持续聚焦于模型中。我们可以在抓包的请求里看到上下文是非常的多
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-09-02-context-engineering-stack/1756742892_12.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
这是一次请求的请求体内容，实际上消耗的token没有这么多的
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-09-02-context-engineering-stack/1756742892_13.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
根据响应可以看到大部分是命中缓存的，关于这个我们在Agent环节有机会讲一下大模型推理缓存相关的技术。
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-09-02-context-engineering-stack/1756742892_14.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
回过头来看，我们可以看到在上下文传递中，Claude Code会持续拼接TODO List到上下文中，给大模型判断目前的进度情况和正在进行的任务。这就是为了让大模型不要在如此长的上下文中无法聚焦要处理什么任务，要达成什么样的目标。换句话说就是用于**锚定大模型的注意力**。
这点其实在Manus那篇分享中也有提到
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-09-02-context-engineering-stack/1756742893_15.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
Manus也是一样的做法，通过复述来操控注意力：
> If you've worked with Manus, you've probably noticed something curious: when handling complex tasks, it tends to create a todo.md file—and update it step-by-step as the task progresses, checking off completed items.
That's not just cute behavior—it's a deliberate mechanism to **manipulate attention**.
A typical task in Manus requires around **50 tool calls** on average. That's a long loop—and since Manus relies on LLMs for decision-making, it's vulnerable to drifting off-topic or forgetting earlier goals, especially in long contexts or complicated tasks.
By constantly rewriting the todo list, Manus is **reciting its objectives into the end of the context**. This pushes the global plan into the model's recent attention span, avoiding "**lost-in-the-middle**" issues and reducing goal misalignment. In effect, it's using natural language to bias its own focus toward the task objective—without needing special architectural changes.
中文是：
> 如果你用过 Manus，可能会注意到一个有趣的现象：在处理复杂任务时，它常常会创建一个 todo.md 文件，并在任务执行过程中逐步更新，勾选已经完成的项目。
这并不是一种“可爱”的行为，而是一种有意设计的注意力操控机制。
Manus 处理的典型任务平均需要调用大约 50 次工具。这是一个非常长的执行链——而由于 Manus 的决策依赖 LLM，它在上下文很长或任务很复杂的情况下，容易出现跑题或忘记最初目标的问题。
通过不断地重写这份待办清单，Manus 实质上是在将任务目标“复述”到上下文的结尾处。这样做可以把全局计划强行推入模型最近的注意力范围，避免“上下文中段丢失”问题，同时减少目标偏移。换句话说，它是在用自然语言主动引导模型关注核心任务目标——无需修改模型结构，就能实现注意力的偏置。
Manus可以看作是和Claude Code相差不会特别大的AI Agent的产品，因此我们可以看到殊途同归，业界的实践方式都是相似的，你也可以在其他的AI Agent里看到同样的实践，目的都是为了让注意力不要产生偏移。

其实提示词技术（或者说上下文）在某种程度就是加强或者说提供一个遮罩层，这样可以对训练时获得的权重进行一定程度的补充，使得结果偏向于更正确的可能，但是某些情况下会导致模型分散了注意力。

### 语义冲突与混乱（Semantic Conflict & Confusion）
在多轮交互或复杂上下文环境中，语义冲突与混乱是影响大模型表现的重要隐患之一。它通常表现为：**新引入的信息或工具与已有上下文中的内容产生矛盾，导致模型产生困惑、做出错误判断，甚至出现“随机选择”的不稳定行为**

[微软和Salesforce在一篇论文](https://arxiv.org/pdf/2505.06120)中展示了这样一个现象：将单轮次的交互拆成多轮次，会导致模型的效果显著下降。
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-09-02-context-engineering-stack/1756742893_16.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
也就是类似我们平时与模型交互，我们会一次性发送相关的问题和描述，但是当我们把这个输入进行分片（Sharding），拆成多次给到模型，会导致效果下降。原因是，**每次模型接收到的信息都是局部的，不够完整，模型在早期做出了不完整甚至是错误的回答，这些错误信息会持续留在上下文中，并在最终生成答案时影响模型判断。**

现在AI Agent基本都会挂载工具集，不管是内置的还是遵循MCP协议的工具调用，从几个到几十个甚至上百个工具，这种情况下就有可能出现工具出现相似描述导致模型不知道选择哪个，最终结果就是在相似的工具里进行**非确定性选择**（或可称为随机选择），导致生成结果不稳定甚至错误。这种混乱的根源在于上下文中存在过多、冗余且难以区分的信息。

# 2.2 上下文工程技术（Techniques in CE）
前面我们提到了在实际应用中上下文出现不足、过长、矛盾和混淆等问题。本节我们将总览几类可用于解决这些问题的上下文工程技术。它们各自针对不同挑战，在系统架构中承担不同职责。更深入的技术细节和实现方式将在第二部分具体展开。

这里我会将上下文涉及的一些技术手段划分为这三个类别：
1. **上下文增强（Context Augmentation）**：主要目的是补充信息，比如提示词技术、RAG和MCP
2. **上下文优化（Context Optimization）**：主要目的是清洗和优化上下文，会包括隔离、修剪和压缩等手段
3. **上下文持久化（Context Persistence）**：主要目的是保留信息，涉及一些外部记忆模块的持久化服务

## 2.2.1 上下文增强（Context Augmentation）
### 提示词技术（Prompting）
提示词技术也就是Prompting，一直以来就是为了增强模型输出的存在，虽然现在我们关注的目标是上下文，但是提示词技术仍然是上下文工程里很重要的一个东西，最基础的就是写好系统提示词。现在几乎所有的AI应用和产品都离不开提示词，甚至有些服务里会有很多的提示词，需要在不同的场景下加载不同的提示词到上下文中。

我们会着重关注在一些主流的提示词技术，来帮助我们写出更好、更适用的提示词。

### RAG（Retrieval-Augmented Generation）
RAG是一种结合检索外部文档来辅助推理，提高结果准确性的技术：通过从外部知识库中检索相关信息，再将其与用户输入一同送入生成模型，从而提升响应的准确性与上下文的丰富性。

其优势在于：
1. 减少幻觉（Hallucination）
2. 提升信息的时效性
3. 专业或领域信息增强

关键技术：
- 索引：切分策略（语义/结构化切分）、元数据（时间、作者、标签）、多索引（向量+倒排）、段落-表格-图片多模态
- 查询加工：重写（Query Rewriting）、多路查询（Multi-Query）、分解（Decomposition）、意图判别（是否需要检索）
- 检排：向量召回+交叉编码器重排（Rerank）；MMR/多样性；新鲜度与时效权重
- 变体：多跳/链式RAG、Agentic RAG（规划+迭代检索）、GraphRAG（图结构汇总）、结构化检索（SQL/知识图谱）

在此前，每次SOTA模型的上下文窗口增长，势必会带来RAG是否已死的争论，但是就目前行业的实践来看，**长上下文模型≠RAG替代品**，更长的上下文窗口实际上是增强了RAG的效果，而不是取代RAG。我们有理由相信在可预见的未来一段时间内，RAG依然会在上下文工程中持续扮演非常重要的角色，是大模型应用过程中不可或缺的一个技术。

### 工具集成与函数调用（MCP）
当模型自身通过训练得到的权重里包含的基础知识和上下文内容结合都无法回答用户问题的时候，模型可以基于预定的外部工具来获取外部数据或执行相应的任务。这一配套相当于解放了模型，**使模型从一个孤岛系统成功接入了现实世界**，可以从浏览器、本地计算机、外部接口等地方获取相应的数据来辅助决策，也可以直接执行某些动作，比如创建一个日程待办，发送一封邮件等等。

甚至现在具身智能领域为模型配上了类人的躯体，拥有视觉、触觉，有四肢可以与现实世界交互，得到信息，决策后续采取的行动。本质上模型就类似人类的大脑，人类也是解决外部的工具与这个世界交流，眼睛、鼻子、耳朵和手脚等都可以收集相应的信息，进而基于这些信息与我们自身已经学到的知识做出合适的决策和行动。

在大语言模型刚流行的头两年，不同模型都各自实现了工具调用（Tool Calling）或函数调用（Function Calling），在2024年11月Anthropic推出了[MCP（Model Context Protocol）](https://modelcontextprotocol.io/)，旨在规范模型与外部环境的交互过程，推动上下文管理与工具调用机制的标准化。这也是我在这个小标题里的英文写的是MCP，因为目前大部分模型厂商都宣布支持MCP，以MCP为主的服务也不断涌现，因此我们会着重以MCP为出发点去了解这部分内容。

下面是一张我没找到出处但在网上广为流传的图，用于将MCP类比成TypeC的存在：
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-09-02-context-engineering-stack/1756742893_17.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
MCP的出现标志着大模型调用外部工具的标准化，使得各厂商和模型之间都可以遵循统一协议，从而使得应用层更容易复用底层模型能力。同时，外部工具也可以在 MCP 统一规范下形成可共享的生态体系，各使用方只需通过简单配置，即可接入市场上已有的 MCP Server，实现即插即用。

也使得外部工具得以在遵循相同标准下衍生出生态，各使用方可以通过简单的配置就能使用市场上存在的MCP Server。这一模式的兴起，或可被视为大语言模型时代“应用商店”概念的雏形，为模型赋能提供了新的基础设施。

随着MCP的发展和普及，现在客户端可能挂载了数十甚至上百的MCP Server，每个MCP Server内含几个到几十个工具，因此这种情况下，MCP或者说工具的治理已经成为一个重要研究方向。
## 2.2.2 上下文优化（Context Optimization）
### 上下文隔离（Context Isolation）
这个技术在多智能体（Multi-Agent）上得到了极好的发挥。也就是将复杂任务通过拆分，细化成多个智能体（Agent），每个智能体单独执行专一的任务，每个智能体拥有独立的上下文窗口，可以使用合适的MCP服务，可以搭配不同的RAG等，正因为隔离，所以多个智能体之间无需关注非必要的上下文，进而减少了干扰。

多智能体是上下文隔离的一种应用，在不同的应用场景下，还有其他的一些手法：
- **任务分片（Task Sharding）**：将任务分成多个子流程或阶段，每一阶段单独运行于自己的上下文中，避免累积无关信息
- **记忆系统分区（Memory Partitioning）**：通过将长期记忆和短期记忆隔离管理，只在需要时引用跨区域记忆，避免上下文污染
- **领域专属上下文（Domain-specific Context Pools）**：为不同的任务域（如法律、医疗、编程）配置专属上下文池，确保大语言模型使用最相关的信息

在实际应用中，应根据任务复杂度、协同粒度和系统架构需求，灵活选择或组合这些策略。

### 上下文压缩（Context Compression）
**上下文压缩（Context Compression）**或者也可以说是**上下文摘要（Context Summarization）**，在某些地方也会以**上下文修剪（Context Pruning）**出现，可以视为相同的东西，但是我觉得上下文压缩会比较贴切一点，且涵盖的范围更广一点。这一策略最早的出现是为了应对上下文窗口不足的问题，但是现在依然是一个非常重要的技术。常见的上下文压缩策略包括：
- **提取式摘要（Extractive Summarization）**：直接选出原文中最相关的段落、句子
- **抽象式摘要（Abstractive Summarization**）：用自己的话总结信息，常结合LLM实现
- **结构化摘要（Structured Summarization）**：提取出知识点、任务、目标等结构化信息，如To-do列表、决策路径
- **自我总结（Self-summarization）**：模型每一轮对话之后，自动总结这轮信息并作为输入传递，形成压缩上下文链
- **摘要记忆（Summarized Memory）**：结合记忆机制，将历史摘要作为长期记忆引用
- **时间窗口裁剪（Time-based Pruning）**：仅保留最近或关键时段的上下文，剔除历史冗余信息，提升推理精度
上下文压缩在实际使用中非常常见，也是多轮次、长会话和智能体里必备的一个技术，**它不仅节省了上下文窗口，还提升了信息的结构化程度**。我们经常可以在AI Agent中看到需要对上下文进行压缩的动作，这也是Agent在持续运作过程中会累积历史上下文，当接近上下文窗口或者一定阈值的情况下就需要进行上下文压缩，使得Agent可以持续运作。甚至在很多情况下我们都会主动进行压缩，就如前面提到的，上下文长度增加有可能会导致效果的下降，因此有时候保持上下文在低水位是有助于任务执行速度和效果的。

我们来看一份Claude Code是怎么做压缩的。Claude Code里是借助大语言模型配合提示词进行压缩的，提示词如下：
```plain text
Your task is to create a detailed summary of the conversation so far, paying close attention to the user's explicit requests and your previous actions.
This summary should be thorough in capturing technical details, code patterns, and architectural decisions that would be essential for continuing development work without losing context.

Before providing your final summary, wrap your analysis in <analysis> tags to organize your thoughts and ensure you've covered all necessary points. In your analysis process:

1. Chronologically analyze each message and section of the conversation. For each section thoroughly identify:
   - The user's explicit requests and intents
   - Your approach to addressing the user's requests
   - Key decisions, technical concepts and code patterns
   - Specific details like:
     - file names
     - full code snippets
     - function signatures
     - file edits
  - Errors that you ran into and how you fixed them
  - Pay special attention to specific user feedback that you received, especially if the user told you to do something differently.
2. Double-check for technical accuracy and completeness, addressing each required element thoroughly.

Your summary should include the following sections:

1. Primary Request and Intent: Capture all of the user's explicit requests and intents in detail
2. Key Technical Concepts: List all important technical concepts, technologies, and frameworks discussed.
3. Files and Code Sections: Enumerate specific files and code sections examined, modified, or created. Pay special attention to the most recent messages and include full code snippets where applicable and include a summary of why this file read or edit is important.
4. Errors and fixes: List all errors that you ran into, and how you fixed them. Pay special attention to specific user feedback that you received, especially if the user told you to do something differently.
5. Problem Solving: Document problems solved and any ongoing troubleshooting efforts.
6. All user messages: List ALL user messages that are not tool results. These are critical for understanding the users' feedback and changing intent.
6. Pending Tasks: Outline any pending tasks that you have explicitly been asked to work on.
7. Current Work: Describe in detail precisely what was being worked on immediately before this summary request, paying special attention to the most recent messages from both user and assistant. Include file names and code snippets where applicable.
8. Optional Next Step: List the next step that you will take that is related to the most recent work you were doing. IMPORTANT: ensure that this step is DIRECTLY in line with the user's explicit requests, and the task you were working on immediately before this summary request. If your last task was concluded, then only list next steps if they are explicitly in line with the users request. Do not start on tangential requests without confirming with the user first.
                       If there is a next step, include direct quotes from the most recent conversation showing exactly what task you were working on and where you left off. This should be verbatim to ensure there's no drift in task interpretation.

Here's an example of how your output should be structured:

<example>
<analysis>
[Your thought process, ensuring all points are covered thoroughly and accurately]
</analysis>

<summary>
1. Primary Request and Intent:
   [Detailed description]

2. Key Technical Concepts:
   - [Concept 1]
   - [Concept 2]
   - [...]

3. Files and Code Sections:
   - [File Name 1]
      - [Summary of why this file is important]
      - [Summary of the changes made to this file, if any]
      - [Important Code Snippet]
   - [File Name 2]
      - [Important Code Snippet]
   - [...]

4. Errors and fixes:
    - [Detailed description of error 1]:
      - [How you fixed the error]
      - [User feedback on the error if any]
    - [...]

5. Problem Solving:
   [Description of solved problems and ongoing troubleshooting]

6. All user messages:
    - [Detailed non tool use user message]
    - [...]

7. Pending Tasks:
   - [Task 1]
   - [Task 2]
   - [...]

8. Current Work:
   [Precise description of current work]

9. Optional Next Step:
   [Optional Next step to take]

</summary>
</example>

Please provide your summary based on the conversation so far, following this structure and ensuring precision and thoroughness in your response.

There may be additional summarization instructions provided in the included context. If so, remember to follow these instructions when creating the above summary. Examples of instructions include:
<example>
## Compact Instructions
When summarizing the conversation focus on typescript code changes and also remember the mistakes you made and how you fixed them.
</example>

<example>
# Summary instructions
When you are using compact - please focus on test output and code changes. Include file reads verbatim.
</example>

````

翻译成中文如下：

```plain text
你的任务是创建一份当前对话的详细总结，需特别关注用户的明确请求以及你之前的操作记录。
这份总结必须详尽，准确捕捉技术细节、代码模式和架构决策，以确保继续开发工作时不丢失上下文。

在提供最终总结之前，请将你的分析过程包裹在 `<analysis>` 标签中，用以组织你的思考，并确保你已覆盖所有必要内容。在分析过程中：

1. 按时间顺序分析对话的每条消息和每个部分。对每个部分请详细识别：
   - 用户的明确请求和意图
   - 你是如何响应用户请求的
   - 关键的决策、技术概念和代码模式
   - 包括以下内容在内的具体细节：
     - 文件名
     - 完整代码片段
     - 函数签名
     - 文件修改情况
   - 出现的错误以及你是如何修复的
   - 特别注意用户反馈，尤其是用户要求你更改做法的地方

2. 仔细检查技术准确性和完整性，确保每个要素都得到详尽处理。

你的总结应包含以下部分：

## 1. Primary Request and Intent（主要请求与意图）
详细记录用户所有明确的请求与意图。

## 2. Key Technical Concepts（关键技术概念）
列出所有讨论过的重要技术概念、技术框架等。

## 3. Files and Code Sections（涉及的文件与代码部分）
列出查看、修改或创建的具体文件与代码片段。特别注意最新的消息，提供完整代码片段并说明其重要性。

## 4. Errors and fixes（错误与修复）
列出出现的所有错误及其修复方式，尤其是用户给出的反馈和修正指示。

## 5. Problem Solving（问题解决）
说明已解决的问题和仍在进行的问题排查工作。

## 6. All user messages（所有用户消息）
列出所有用户的非工具使用消息。这对于理解用户反馈和意图变化至关重要。

## 7. Pending Tasks（待办任务）
列出用户明确要求你继续完成的任务。

## 8. Current Work（当前工作）
详细说明在本次总结请求前你正在处理的具体任务，尤其要关注 assistant 和 user 最近的互动内容，并附带文件名和代码片段（若有）。

## 9. Optional Next Step（可选的下一步）
列出与你最近正在进行的工作直接相关的下一步行动。**必须**确保此步骤完全符合用户的明确请求，并引用最近对话中的原话作为依据。若上一任务已结束，仅在用户有明确指示时列出下一步。

---

## 示例结构（Example Structure）

以下是你的输出应遵循的结构示例：

```

<example>
<analysis>
[你的思考过程，确保所有要点都被充分且准确地覆盖]
</analysis>

<summary>
1. Primary Request and Intent:
   [详细描述]

2. Key Technical Concepts:

   - [概念1]
   - [概念2]
   - [...]

3. Files and Code Sections:

   - [文件名1]
     - [为何该文件重要的说明]
     - [对该文件所做的修改总结（如有）]
     - [重要的代码片段]
   - [文件名2]
     - [重要的代码片段]
   - [...]

4. Errors and fixes:

   - [错误1的详细描述]：
     - [你是如何修复该错误的]
     - [用户对该错误的反馈（如有）]
   - [...]

5. Problem Solving:
   [已解决的问题及任何仍在排查的问题]

6. All user messages:

   - [用户的非工具请求消息]
   - [...]

7. Pending Tasks:

   - [任务1]
   - [任务2]
   - [...]

8. Current Work:
   [当前正在处理的任务具体说明]

9. Optional Next Step:
   [下一步行动（如适用）]

</summary>
</example>
```

```
可以看到，这里应用了提示词技术，来指示大模型通过什么样的方式来进行上下文压缩，这一段非常值得学习，说是压缩，其实结合了9个不同方向的摘要，这样确保重要信息都压缩保留，如果没有明确指示这9点的话，可能会导致压缩的时候其中一些重要的信息被过滤掉，导致后续执行的效果下降。

## 2.2.3 上下文持久化（Context Persistence）
**上下文持久化（Context Persistence）**指的是将模型历史的上下文内容，尤其是重要的用户信息、对话摘要、任务状态等进行**长期存储**，以便后续访问和复用。这类机制在类人交互系统、Agent 系统中非常关键，它帮助模型记住用户的偏好、上下文、历史任务等信息。

上下文持久化的典型方式包括：

存储介质：
- 文件系统（如.json, .txt）
- 数据库存储（PostgreSQL, MongoDB 等）
- 向量数据库（用于检索式记忆）
- Key-Value 缓存（如Redis）

应用场景：
- 会话记忆（Chat Memory）：例如对话中用户提到“我下周要去东京”，可以在后续对话中继续引用；
- Agent任务状态保存：例如 Agent 正在处理一个流程任务，下次接入可从断点恢复；
- 用户偏好记录：如用户喜欢markdown格式、喜欢精炼回答等。

持久化策略：
- 自动摘要持久化（如每天一次自动保存摘要）
- 用户关键输入保存（如计划、目标等）
- 分阶段持久化（如每完成一个任务后存储）
# 小结
第一部分到这里就结束了，这一部分更多还是一些概念上和理论上的内容，算是从全局的角度来了解上下文工程的前世今生，接下去我们即将进入到第二部分，这部分会主要集中在几个比较重要的上下文工程技术，这也是目前在AI应用层中会涉及的主要技术。

在第二部分最后一个章节我们也会深入AI Agent，虽然这个狭义上来说不好算作上下文工程的一个技术，但是其实从广义的角度来看，可以算。Agent这个概念并不新，我们最常用的浏览器本身就是一个Agent，或者叫User Agent，也就是用户代理，因此AI Agent其实也就是一个应用，代理了我们与AI（大模型）交互，在此过程中这个Agent自然就会将上下文工程涉及的技术都应用进来，去构建合适的上下文，以达到最好的效果，这样这个Agent就可以在大模型的帮助之下完成我们的任务。因此AI Agent是现在最热门的AI应用方向。

现在，让我们一起进入第二部分：核心技术篇
```
