---
layout: post
title: "我们是如何在AI Era飙车的"
date: 2026-04-02T08:00:00+08:00
lang: zh
translation_key: speedrunning-the-ai-era
tags:
  - Thoughts
  - AI
  - Insights
categories: Thoughts
giscus_comments: true
tabs: true
pretty_table: true
toc:
  sidebar: left
---

# 写在前面

好久没有沉下心来好好写点有价值的文章分享了，最近连续战斗了3周多，也是时候稍微松下油门，讲讲我们在做的事情，从个人和团队以及组织的角度来讲讲我们对于AI横行的时代下，如何应对变化并拥抱变化。

我们是在火山下的**AgentSphere**团队，主要面向B端市场去递送SuperApp，目前我的看法是可以斗胆的对标一下OpenAI目前在推进的Frontier和SuperApp，也就是以ChatGPT+Codex（CodingAgent）+B端市场的逻辑。$840B的第二大Startup因为第三的Anthropic的缘故，目前也押宝Coding市场和B端市场，这是非常确定性的收入，有利于财报和IPO，因此我们也在锚定这个方向使劲推进，相信未来B端的大市场下，Applied AI会以应用层Agent为核心，辅以各类面向AI的服务去不断提升，这也是B端有别于C端的逻辑所在。

今年以来以OpenClaw风靡全球为开端，让整个市场一下子火爆起来，个人到企业也顺利的完成了教育，现在\*Claw都能轻松的售卖了，所有人的心智一下子都被打开了，在这狂欢的背后，有自媒体的狂欢，有Geek的狂欢，有MaaS、云服务云计算的狂欢，也有个人和公司的FOMO。市场被教育了，机会多了，竞争也大了，一片光怪陆离的野蛮生长，同时也充满了机会。

在这期间我们做了什么？首先是革命自己，展开之前，先来说一个东西：OpenClaw这些概念都是旧的，没什么新奇的，就那样，2年前就存在的。这种话很多人会说，也很多人会想，包括我。我喜欢先尝试打自己的脸：那为什么我们没有呢？可以马上交出这个东西么？

这就是我喜欢打自己脸的原因，不习惯打自己脸，一定会有别人打，自己不淘汰昨天的自己，一定会有人在市场上淘汰自己。确实OpenClaw的一切理念都不新，2年前(24年3月)Devin出来后，我们在做OpenHands的时候很多东西都已经有了，一些理念也在后续陆陆续续的发展。OpenClaw的出圈就好像奇点（Singularity）到了，模型能力到了，一切能力都整合了，开箱即用，简单直接，适合传播，符合各方的利益。这不是偶然，是必然。

透过现象看本质，能勇敢的下山就是我们攀登下一座山峰的开始。我们也思考并讨论了很多，甚至在春节假期期间，在飞往瑞士的飞机上，我几乎无眠，看了很多资讯，想了很多东西，也写下了很多。回到工位后，我们开始尝试去做出一些改变。

# 歪脖扣腚，百废待兴

3月4日早上的这个会是一个很重要的转折点，我们的三人Momentum小队出现了。或许只有德国不限速高速能形容这段时间以来我们的状态了：那是车的极限，不是速度的极限。

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-02-speedrunning-the-ai-era/1775142780_8.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
这是人的极限，不是AI的极限
脱敏专用：大体是平均每天30个Commits的水平
我关注Peter哥很久了，从他开始做OpenClaw之前就已经关注了，因为他做了很多东西，开源了很多东西，在我看来非常Cool，也是我一直在践行的理念。
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-02-speedrunning-the-ai-era/1775142781_9.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
现在我们有一点很重要的特质就是对标他的速度（虽然目前依然不是一个数量级的，这个也不是一个客观的衡量标准
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-02-speedrunning-the-ai-era/1775142784_10.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
就像我们内部在传播的一张图
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-02-speedrunning-the-ai-era/1775142784_11.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
我们以速度为最高优先级，开启了新的敏捷迭代和协作方式的探索，并且以AI Native的方式开启了我们的探索。我们不单单是为了构建一个产品，而是为了探索一套面向AI的方式，因为这个方式可以支撑我们去迭代出N个产品。

大家都在谈AI Native，那么来看看我们是怎么做的吧：

- 定调：服务AI>服务人。如果这个原则没有确立，没有后续的了，现代的一切基础设施都是面向人，服务于人，未来不是
- 组织方式，我坚持采用Monorepo的方式来组织和管理。为什么呢？因为我们是AI-oriented（不是面向过程，也不是面向对象，是面向AI），如果你的服务是散落在各种repo下，那么你就需要不断给AI上下文，在不同repo里协作，亲身痛过，知道其间速度会差多少
- 架构：服务能少则少，链路不负责则不复杂，less is more这个原则已经被多少伟大的产品证明了。C端同学别捶我。这个是有一个平衡点的，自我取舍，原则还是服务AI。

发现想要总结出来还真不容易，就跟着我一路听我碎碎念。

# Mindset开天眼

当你第一次访问我们的Repo就会发现，映入眼帘的是一些比较奇特的东西：

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-02-speedrunning-the-ai-era/1775142785_12.jpg" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
这是我们面对每个进来贡献的人的准则，我自己花了10分钟手写的，主要还是希望能在意识层面就能让新加入的人对齐。叠个甲，支持我们的code模型还有Trae之类的产品的发展，我们也会用coco（trae-cli）做一些事情，也希望我们的code模型和coding plan能发展的更好，这样我们也可以在面向B端客户的时候拥有强大的Coding能补齐我们的Coding这块拼图来实现某种意义上的“AGI”。

这里面很值得提的是`./docs/histories`这个东西，先来看看我们的AGENTS.md和CLAUDE.md吧，在项目伊始，这两个文件是最先被加入的。因为这个repo的一切东西（无限接近100%）都应是AI带来的，所以我们从一开始就不断在写并完善这份文件

这个能做什么呢？就是能在脱敏和去噪后保留用户的query，以及本次改动的原因，改动到的文件，以及用的是什么AI Agent，是什么模型。这比在git commit里或者PR/MR里加的信息都有用太多了，可追溯，上下文源于此也留于此。未来不管是新人Onboarding还是追查某个feat的变迁史，都有迹可循！

这里的用户Query也很值得一提。Codex的起源也是类似这样的方式，现在有新人加入早上半天是shadow的时间

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-02-speedrunning-the-ai-era/1775142785_13.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
可以理解为新人找个老人，坐在他旁边看他干活半天，为什么要这样？因为学习！我们在做的事情就是这个，我们很难通过一次两次的分享告诉某些人我们应该怎么做，怎样才能像我一样能这么快，最好的方法就是让他看看我是怎么做的，我怎么Prompt的，我怎么做端到端验收的，遇到问题的时候我是怎么处理的。这个就是我们每个走在前面的人的无私奉献，我们愿意付出我们自己的收获去造福后来的新人。正常的情况下这是一个人的竞争力的一部分，但是我们的底气在于，我们拥有很强的学习和适应能力，我们也希望自己的Peer，自己的战友能更加牛逼，从整体的角度去看待这个问题。因此我们选择留下自己的Query。

关于看代码这个事情会有较多争议，长远看，不看是更好的选择，拥有的context从业务逻辑+代码细节+架构设计到产品定义+业务逻辑+架构设计。AI产AI看AI改，从概率的角度看，比人这个变量加入后带来的熵增会更好一些。我们现在的时间也更多花在了Dog fooding，端到端验收，产品讨论和设计，思考并不断推翻之前的一些设想，我们的方案就是执行，我们要用结果来验证方案。

以前的草创以及之前很长一段时间的SideProject里从IndieDev学会的就是Idea is cheap。这个在现在更加放大了，知易行难，说的很容易，做的都很难。因此我们不喜欢长篇累牍的出一个方案，who cares?我们在意的是你的实际想法和快速行动，我们可以快速10分钟会议听你讲方案，从不同的角度质疑一下发表一下自己的想法，然后就可以开干了。我们在意的是最后的效果，在意的是你用了1h递送出来的新feat，不行或者不合适，直接干掉，只留下了2个histories/\*.md，没有一行妥协的代码留下

另外我们会在快速迭代的几天做一次refactor，当管理者听到重构，面色大变，值得投入么？要多少人天？似乎这个东西也不适合提到meego上，这个不应该是你之前就考虑好的么？现在有什么理由需要重构么？相信很多人都会有同样的感受和经历吧？

现在的情况是？我们可以用1、2个小时直接重构掉一大块东西，一点灰都不留下，追求速度的同时本身就带债（强如Codex也经常带债），那不是我们担心的东西，但是我们需要对产品负责，我们就要时不时还债。这也是不断质疑和挑战几天前的自己的一个点，当时的设计对么？这两个功能组合起来没问题么？现在最新的方案是这样实现的么？新的证据表明这个或许要调整？这个才是传统意义上的敏捷迭代。

再谈一点反直觉的东西，继重构之后第二个雷点：复用。相信Allhands上已经充分被讨论过了，也欣赏一些发言者的态度，make sense。但是不分情况只提倡复用就是耍流氓。简单的例子，我们发现langsmith不开源，我们又习惯用了，我们就花了2天的时间造了一个专用的inhouse版本，如果我们寻求复用的话，或许能找到，但是会只是花费2天的时间么？因为现在造轮子的成本，太低了，开源慢慢走向死亡的讨论由来就是这样的，如果你已经知道一个东西是怎么运作的，你知道以前你需要花1个月投入人力资源去造出来，现在你只需要花上1、2天，你会怎么选择呢？但凡复用一定有妥协，看哪一方的话语权大。用的人喷（不一定是喷产品不好），服务的人傲慢（叠个甲，我也曾经服务过别人，我也傲慢过，也吃过教训），硬凑的结果就是沟通成本巨大，速度进一步拉慢。当然这些堆人都能解决，也是“大厂管理游戏不能说的秘密”

我承认我的看法一定会有偏见的，我只就我们的场景论证，我觉得这个不是一刀切的，该复用的时候复用，但是应该回归第一性原理，先谈清楚追求的是什么东西，再来谈这个问题。就好像前年写的

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-02-speedrunning-the-ai-era/1775142785_14.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
应该追求通用还是专用？或许市场给出了一些答案。

到这里其实我们已经掀开了第一层面纱了，我们继续往前看。我们是如何Coding的呢？

# 就让我来~~Rap~~Code

以我个人为例，同一时间我一般会开3-6个会话同时进行（我不用worktree，但我觉得有些人会需要它），我喜欢用CLI，从Claude Code出来后就陆续在其与Codex之间不断切换使用，CLI有个好处就是同时可以多个会话，所有的IDE包括Codex App都很难拥有这种全局掌控的能力表现，一眼就知道什么结束了，马上就可以继续Query或者提交相关改动（that’s where the magic happens）了。

其次是万物皆可CLI，举个例子，我们的服务除了本地跑以外一些minio之类的服务都在k8s里了，kubectl/ssh/mysql这类cli可以解万物，当某个会话有什么问题的时候，直接给session id，其就会自动连接到本地mysql和开发环境里去查看对应的问题，**一切能验证的问题都能被解决**。如果一个问题AI一直解决不了，那大概率是因为它无法验证！我们要做的就是帮它补齐验证的能力。（有没有一些熟悉的味道？就好像一个领导者，不会去怪自己兄弟太笨，要做的是为他们扫平一切的roadblock，让大家可以更加舒服的战斗和成长）

另外就是前端实现，我们通常是figma+截图+人话直接原地飞升，最后配合一些细节调控去做修正，期间有时候我们会利用chrome-devtools-mcp或者playwright之类的工具连到浏览器，直接做DOM/Styles或者截图的获取，甚至进一步到Console里取log。这些本质上都是在为AI的验证环节做闭环。

这里的Coding其实是广义Coding，因为除了Coding外，还有大量的东西都是借助此完成了，包括前面提到的排查定位问题和测试等等，这个展开就有很多东西可以说了。

我们从简单的单测、端到端测试、冒烟测试、性能测试、安全测试和评估测试都是让AI完成的，我们会编排好这一系列动作，下班的时候就发射一波，明早来已经有报告在等我们了，这好比开快车的时候，系好安全带、握好方向盘、擦亮眼睛一样。同时我们也在不断探索Ralph Loop这类形态，通过永远的循环来持续达成一些目的，这块我们也在积极探索融入到我们的产品之中

大概就rap这些吧，接下去小小看下产品吧

# 产品

敏感缘故就不放产品了。有兴趣的小伙伴可以找我聊

我浅谈一下一些思路吧。我觉得现在很多东西大家都能做，现在harness满天飞，昨天被强制开源的claude code是其中之一，还有codex、gemini-cli、pi、opencode、deepagents、deerflow 2.0等等。从技术的角度来看，早已不缺任何技术了，从产品的角度来看，最重要的依然是模型即产品，也是为什么现在这些人薪酬这么顶的缘故，不可否认。

除此之外，其实在做产品的时候我们会反复强调两条线：显学和隐学。

显学永远是吸引人注意的东西，就好比我们会轻视一些自媒体发的内容，但是不妨碍其带来的巨大影响力。就是这样的道理，产品里一定要时刻显学，MCP、Skills、Mem、Self-Improving、IM渠道，这些都是例子，还有更多比如UIUX上的体现，看着就很棒的卡片效果，Gen-UI的使用，工具调用的渲染，多Agent的可视化等等。没有显学，再牛逼的产品就像一个小石子丢到海里，毫无波澜。显学也不一定是产品本身，一些外部的影响力、声量等等也可以是显学的一部分。

隐学则是初见杀之后的立世之本。效果要好，底盘要稳。各种Fancy的技术手段，都抵不够这两点。怎么做到这些的？就是靠各种技术去架构出这一套系统，人们不需要知道其间用了什么技术，只需要知道它牛逼好用就完事了，很多技术人往往就是在追逐隐学的过程中倒地而亡，但是我们也不能不追求这个东西，否则就是看起来大猪样打下去小猪声了。丢一张meme：

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-02-speedrunning-the-ai-era/1775142786_15.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
能支撑产品，支持口碑，支撑售卖，支撑不断前行的就是这个。广义的隐学还有背后的人和团队，不断的自我提升适应新的环境，追求完成且会继续追求完美。

最后就是产品一定要dog fooding，不是在造电子垃圾，要从客户出发。你自己用一下看看难用么，如果自己都不想用还妄想忽悠别人买，杀猪盘没跑了

# 关于组织

组织的形态怎么变化我没什么发言权，随性谈点自己的想法吧

信息能更透明的流通或许是最重要的，尤其是大变革的时候，往往是自下而上的，由外向里的，如何能让各种信息能上下左右流通，是管理者们应该思考和行动的。AI能带来的是更高效的信息流通，在市场层面这就对各种主体带来很大的要求，但是也增加了很多机会。外部信息流通加大的同时，好保持信息流通速度的不变化，相对而言就是退步，失去竞争力或淘汰指日可待。

允许让一部分先快起来（或者换个角度：允许一部分人慢下来）。我相信不是每一个人都上快车道的，有些人可以马上，有些人需要一段时间，有的人则需要一生。当然也不是都要快起来，这里先丢一张前天看到的图，当梗图看吧

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-02-speedrunning-the-ai-era/1775142786_16.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
一句话，资本永不眠，技术的进步初衷以及在引领者的嘴里大多是正向的，但是现实会告诉我们答案。因此不要逼着每个人都快起来，快慢刀才是点睛之笔。

跑题了。就好像新的浪潮来了，一部分人要先下水弄潮，这部分人去探索时候每个团队/部门的新协作形态，反哺回去，最终带动整个大盘，这样会是一个不那么容易扯到蛋的方案。说来简单，实现不易，找到合适的人，用合适的方式去尝试，有合理的机制保障等等，都是难的部分。

提供合适的土壤。这个怎么说呢？巧妇难为无米之炊，我们如果追求的是有市场价值的产品，SOTA的产品，那么就应该让所有人都能轻松获取SOTA工具/产品。也是知易行难的一个东西。简单举例，或许因为我们本身就是模型厂，我们有自己的模型，我们无限制供应给内部去孵化，但是除此之外的很多外部的API绝大部分部门和团队都特别难拿到，复杂的流程，繁琐的手续，让一切可能性束之高阁。当然这点反过来说，dog fooding是支持自家模型/产品进步所需要的，合规和安全也需要考量，成本也需要留意，但如果这些是重重阻力的话，会让很多人丧失顶尖产品的Sense和创造下一个优秀产品的机会。别小看获取难度这个点，在安全攻防里，有种说法，没有绝对的安全，一些都是相对的，防守方就是无限拉高入侵成本以抵御攻击方的入侵。在获取SOTA工具上，难度达到一定阈值就会极大抑制人的主观能动以及随之而来的潜在创新。里面还有太多复杂敏感的东西就不展开了，但从组织层面，或许该重视这个问题。

暂时先写这些吧。

# 尾声

愚人节的夜晚，早上10点的咖啡因似乎还有点后劲，亦或者只是高亢的神经不曾放松。写下这些东西是希望能让更多人的mindset有一些改变吧，不提倡什么，你能看懂什么学到什么，全凭你自己。

最后的最后，我一直是个乐观主义者，但是偶尔也会有点小悲观，或许我们在努力拼搏的东西，在某一天会把我们彻底抬走，但愿我们还能一直拥有快乐的能力。

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-02-speedrunning-the-ai-era/1775142789_17.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

_PS：因为脱敏，文中多处地方已删去对应的图片和文字_
