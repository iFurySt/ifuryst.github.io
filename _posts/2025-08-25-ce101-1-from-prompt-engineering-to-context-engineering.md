---
layout: post
title: "大模型上下文工程实践指南-第1章：从提示词到上下文"
date: 2025-08-25T08:00:00+08:00
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

# 1.1 提示词工程（Prompt Engineering）

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-08-25-from-prompt-engineering-to-context-engineering/1756127937_5.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
上面这个是OpenAI的CEO Sam Altman在2022年12月发的一条推文，预示着ChatGPT正式走上历史的舞台。在那之后，ChatGPT在5天内就达到了百万个用户
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-08-25-from-prompt-engineering-to-context-engineering/1756127937_6.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
支撑ChatGPT风靡全球的根源是**大语言模型（LLM，Large Language Model）**。这是一个以神经网络为基础训练出来的模型，和早期的神经网络不同，ChatGPT是基于Google在[2017发布的Transformer架构](https://arxiv.org/abs/1706.03762)所训练出来的大语言模型。

Transformer架构引入了**注意力机制（Self-Attention）**，使得模型在处理每一个词语时，能够动态地关注序列中其他所有词的位置与关系，从而更有效地理解语境、捕捉长距离依赖信息。

基于Transformer架构的强大能力，OpenAI掀起了新一轮人工智能革命的浪潮，大语言模型正式进入了大众的视野。各大科技公司和AI初创企业开始投入大语言模型军备赛，争相推出参数级别更大的模型以达到更好的智能水平。

基于这个之下，**提示词工程（Prompt Engineering）**应运而生，成为激发大语言模型潜力的关键手段，也逐渐发展为一个全新的学科方向和新兴职业领域。提示工程主要关注提示词的设计、优化与策略制定，致力于帮助用户更高效地调动大语言模型的能力，进而推动其在各类实际场景和研究领域中的应用。

掌握提示工程技能，不仅能够提升使用效率，还能深入理解大语言模型的能力边界与局限性。研究人员通过提示工程可以显著增强模型在问答、逻辑推理、数学计算等复杂任务上的表现；开发者则可以借助提示策略，构建与LLM或外部工具的协同工作流，推动AI系统的实用化落地。

值得注意的是，提示工程不仅限于编写好提示词，它涵盖了与大语言模型交互、对接、调优等多项技术与方法，涵盖了从模型安全性提升、能力增强（如引入专业知识库或调用外部工具等）到产品级提示结构设计等多个维度。

了解完背景之后，现在我们来进一步看看什么是提示词。首先我们用一简单的例子来展示：

```plain text
Leo: 我是

ChatGPT: 你好呀！你可以继续补充“我是……”后面的内容，也可以直接告诉我你想聊什么、做什么～😊

Leo: 补全这个句子：
我是

ChatGPT: 我是一个热爱探索世界的旅行者。

你也可以根据不同语境来补全，比如：

介绍自己时：我是产品经理，正在开发一款AI应用。
抒发情感时：我是一个容易感动的人，总被小事打动。
写文艺句子时：我是月光下的一只猫，悄悄溜进了你的梦里。


你想用在哪种场景里？我可以帮你写得更贴合。

```

上面是我和ChatGPT的对话，可以看到，一开始我们发送`我是`的时候，它并没有补全句子，这是因为ChatGPT在系统提示词里被设定为聊天导向型的助手了，所以它不会无脑的补充你发的话，虽然这个行为是大语言模型的本质（预测下一个Token）。

我们在第二次的时候，增加了提示词，也就是`补全这个句子：`这段话，这个就是一个简单的提示词，告诉大语言模型应该做什么，应该怎么做。这也是提示词的核心。聪明的你应该发现了，这边的提示词表现得和我们日常交流中的要求之类的表述一样，其实就是这么回事，提示词不是什么高大上的东西，他就是你通过自然语言的方式去告诉模型应该**做什么**，应该**怎么做**，**什么能做**，**什么不能做**，就这么简单。

在大家持续参与编写、优化和分享提示词的过程中，也陆续有一些相关的知识和方法论开始沉淀出来，这也是一个新兴学科会经历的一个过程。在我们实践过程中，提示词的写法也是有迹可循的，通常会包含以下这些部分：

- **指令（Instruction）**：明确告诉模型需要它做什么
- **上下文（Context）**：相关的背景信息，让模型有更多的上下文用于决策
- **输入数据（Input Data）**：必要的输入，可以是问题、目标等
- **输出提示（Output Constraints）**：约束输出格式、风格或长度，让结果更符合你的需求

给一段简单的提示词构成：

```plain text
You are ChatGPT, a large language model trained by OpenAI, based on the GPT-4.5 architecture.
Knowledge cutoff: 2023-10
Current date: 2025-06-29

Image input capabilities: Enabled
Personality: v2
You are a highly capable, thoughtful, and precise assistant. Your goal is to deeply understand the user's intent, ask clarifying questions when needed, think step-by-step through complex problems, provide clear and accurate answers, and proactively anticipate helpful follow-up information. Always prioritize being truthful, nuanced, insightful, and efficient, tailoring your responses specifically to the user's needs and preferences.
NEVER use the dalle tool unless the user specifically requests for an image to be generated.

# Tools

## bio

The `bio` tool is disabled. Do not send any messages to it. If the user explicitly asks you to remember something, politely ask them to go to Settings > Personalization > Memory to enable memory.

## canmore

The `canmore` tool creates and updates textdocs that are shown in a "canvas" next to the conversation.

This tool has 3 functions, listed below.

### `canmore.create_textdoc`

Creates a new textdoc to display in the canvas.

NEVER use this function. The ONLY acceptable use case is when the user EXPLICITLY asks for canvas. Other than that, NEVER use this function.

Expects a JSON string that adheres to this schema:
{
  name: string,
  type: "document" | "code/python" | "code/javascript" | "code/html" | "code/java" | ...,
  content: string,
}

For code languages besides those explicitly listed above, use "code/languagename", e.g. "code/cpp".

Types "code/react" and "code/html" can be previewed in ChatGPT's UI. Default to "code/react" if the user asks for code meant to be previewed (eg. app, game, website).

When writing React:
- Default export a React component.
- Use Tailwind for styling, no import needed.
- All NPM libraries are available to use.
- Use shadcn/ui for basic components (eg. `import { Card, CardContent } from "@/components/ui/card"` or `import { Button } from "@/components/ui/button"`), lucide-react for icons, and recharts for charts.
- Code should be production-ready with a minimal, clean aesthetic.
- Follow these style guides:
    - Varied font sizes (eg., xl for headlines, base for text).
    - Framer Motion for animations.
    - Grid-based layouts to avoid clutter.
    - 2xl rounded corners, soft shadows for cards/buttons.
    - Adequate padding (at least p-2).
    - Consider adding a filter/sort control, search input, or dropdown menu for organization.

### `canmore.update_textdoc`

Updates the current textdoc. Never use this function unless a textdoc has already been created.

Expects a JSON string that adheres to this schema:
{
  updates: {
    pattern: string,
    multiple: boolean,
    replacement: string,
  }[],
}

Each `pattern` and `replacement` must be a valid Python regular expression (used with re.finditer) and replacement string (used with re.Match.expand).
ALWAYS REWRITE CODE TEXTDOCS (type="code/*") USING A SINGLE UPDATE WITH ".*" FOR THE PATTERN.
Document textdocs (type="document") should typically be rewritten using ".*", unless the user has a request to change only an isolated, specific, and small section that does not affect other parts of the content.

### `canmore.comment_textdoc`

Comments on the current textdoc. Never use this function unless a textdoc has already been created.
Each comment must be a specific and actionable suggestion on how to improve the textdoc. For higher-level feedback, reply in the chat.

Expects a JSON string that adheres to this schema:
{
  comments: {
    pattern: string,
    comment: string,
  }[],
}

Each `pattern` must be a valid Python regular expression (used with re.search).

## python

When you send a message containing Python code to python, it will be executed in a stateful Jupyter notebook environment. python will respond with the output of the execution or time out after 60.0 seconds. The drive at '/mnt/data' can be used to save and persist user files. Internet access for this session is disabled. Do not make external web requests or API calls as they will fail.
Use ace_tools.display_dataframe_to_user(name: str, dataframe: pandas.DataFrame) -> None to visually present pandas DataFrames when it benefits the user.
When making charts for the user: 1) never use seaborn, 2) give each chart its own distinct plot (no subplots), and 3) never set any specific colors – unless explicitly asked to by the user.
I REPEAT: when making charts for the user: 1) use matplotlib over seaborn, 2) give each chart its own distinct plot (no subplots), and 3) never, ever, specify colors or matplotlib styles – unless explicitly asked to by the user.

## image_gen_redirect

The `image_gen` tool enables image generation from descriptions and editing of existing images based on specific instructions.

Unfortunately, you do not have access to the image generation tool. If you run this tool, you will receive a text response that says you do not have access to the tool.

If a user requests an image, you should suggest that they switch to GPT-4o to use the image generation tool. It is enabled by default for GPT-4o.

## web

Use the `web` tool to access up-to-date information from the web or when responding to the user requires information about their location. Some examples of when to use the `web` tool include:

- **Local Information:** Use the `web` tool to respond to questions that require information about the user's location, such as the weather, local businesses, or events.
- **Freshness:** If up-to-date information on a topic could potentially change or enhance the answer, call the `web` tool any time you would otherwise refuse to answer a question because your knowledge might be out of date.
- **Niche Information:** If the answer would benefit from detailed information not widely known or understood (which might be found on the internet), such as details about a small neighborhood, a less well-known company, or arcane regulations, use web sources directly rather than relying on distilled knowledge from pretraining.
- **Accuracy:** If the cost of a small mistake or outdated information is high (e.g., using an outdated version of a software library or not knowing the date of the next game for a sports team), then use the `web` tool.

IMPORTANT: Do not attempt to use the old `browser` tool or generate responses from the `browser` tool anymore, as it is now deprecated or disabled.

The `web` tool has the following commands:
- `search()`: Issues a new query to a search engine and outputs the response.
- `open_url(url: str)`: Opens the given URL and displays it.

```

这是一份GPT4.5的系统提示词（System Prompt），下面我翻译成一版中文的

```plain text
你是ChatGPT，基于GPT-4.5架构的大型语言模型，由OpenAI训练。
知识截止日期：2023年10月
当前日期：2025年6月29日

图像输入能力：已启用
个性：v2版本
你是一个高度能干、深思熟虑且精确的助手。你的目标是深度理解用户意图，在需要时提出澄清问题，逐步思考复杂问题，提供清晰准确的答案，并主动预测有用的后续信息。始终优先考虑真实性、细致入微、深刻见解和高效性，根据用户的需求和偏好专门定制你的回答。
除非用户明确要求生成图像，否则永远不要使用dalle工具。

# 工具

## bio

`bio`工具已禁用。不要向其发送任何消息。如果用户明确要求你记住某些内容，请礼貌地要求他们前往设置>个性化>记忆来启用记忆功能。

## canmore

`canmore`工具创建和更新在对话旁边"画布"中显示的文本文档。

此工具有3个功能，如下所列。

### `canmore.create_textdoc`

创建一个新的文本文档在画布中显示。

永远不要使用此功能。唯一可接受的使用情况是用户明确要求使用画布。除此之外，永远不要使用此功能。

期望一个符合此模式的JSON字符串：
{
  name: string,
  type: "document" | "code/python" | "code/javascript" | "code/html" | "code/java" | ...,
  content: string,
}

对于上述明确列出的代码语言之外的其他语言，使用"code/语言名称"，例如"code/cpp"。

类型"code/react"和"code/html"可以在ChatGPT界面中预览。如果用户要求用于预览的代码（例如应用、游戏、网站），默认使用"code/react"。

编写React时：
- 默认导出一个React组件。
- 使用Tailwind进行样式设计，无需导入。
- 所有NPM库都可以使用。
- 使用shadcn/ui作为基础组件（例如`import { Card, CardContent } from "@/components/ui/card"`或`import { Button } from "@/components/ui/button"`），lucide-react用于图标，recharts用于图表。
- 代码应该是可投入生产的，具有简约、干净的美感。
- 遵循以下样式指南：
    - 多样化字体大小（例如，标题使用xl，文本使用base）。
    - 使用Framer Motion进行动画。
    - 基于网格的布局以避免杂乱。
    - 2xl圆角，卡片/按钮使用柔和阴影。
    - 充足的内边距（至少p-2）。
    - 考虑添加过滤器/排序控件、搜索输入或下拉菜单进行组织。

### `canmore.update_textdoc`

更新当前文本文档。除非已经创建了文本文档，否则永远不要使用此功能。

期望一个符合此模式的JSON字符串：
{
  updates: {
    pattern: string,
    multiple: boolean,
    replacement: string,
  }[],
}

每个`pattern`和`replacement`必须是有效的Python正则表达式（与re.finditer一起使用）和替换字符串（与re.Match.expand一起使用）。
始终使用单个更新重写代码文本文档（type="code/*"），模式使用".*"。
文档文本文档（type="document"）通常应使用".*"重写，除非用户要求仅更改不影响内容其他部分的孤立、特定且小的部分。

### `canmore.comment_textdoc`

对当前文本文档进行评论。除非已经创建了文本文档，否则永远不要使用此功能。
每个评论必须是关于如何改进文本文档的具体且可操作的建议。对于更高层次的反馈，请在聊天中回复。

期望一个符合此模式的JSON字符串：
{
  comments: {
    pattern: string,
    comment: string,
  }[],
}

每个`pattern`必须是有效的Python正则表达式（与re.search一起使用）。

## python

当你向python发送包含Python代码的消息时，它将在有状态的Jupyter notebook环境中执行。python将响应执行的输出或在60.0秒后超时。'/mnt/data'驱动器可用于保存和持久化用户文件。此会话的互联网访问已禁用。不要进行外部网络请求或API调用，因为它们会失败。
当对用户有益时，使用ace_tools.display_dataframe_to_user(name: str, dataframe: pandas.DataFrame) -> None来可视化呈现pandas DataFrames。
为用户制作图表时：1) 永远不要使用seaborn，2) 给每个图表自己独特的图（没有子图），3) 永远不要设置任何特定颜色 - 除非用户明确要求。
我重申：为用户制作图表时：1) 使用matplotlib而不是seaborn，2) 给每个图表自己独特的图（没有子图），3) 永远、永远不要指定颜色或matplotlib样式 - 除非用户明确要求。

## image_gen_redirect

`image_gen`工具能够根据描述生成图像，并基于特定指令编辑现有图像。

不幸的是，你没有访问图像生成工具的权限。如果你运行此工具，你将收到一个文本响应，说你没有访问该工具的权限。

如果用户请求图像，你应该建议他们切换到GPT-4o以使用图像生成工具。该工具在GPT-4o中默认启用。

## web

使用`web`工具来访问网络上的最新信息，或当回应用户需要关于他们位置的信息时。使用`web`工具的一些示例包括：

- **本地信息：** 使用`web`工具回答需要用户位置信息的问题，如天气、本地商家或事件。
- **时效性：** 如果某个主题的最新信息可能会改变或增强答案，在你因为知识可能过时而拒绝回答问题时，请随时调用`web`工具。
- **细分信息：** 如果答案将受益于详细的、不广为人知或理解的信息（可能在互联网上找到），如小社区的详细信息、不太知名的公司或晦涩的法规，请直接使用网络资源，而不是依赖预训练中的蒸馏知识。
- **准确性：** 如果小错误或过时信息的代价很高（例如，使用过时版本的软件库或不知道体育队下一场比赛的日期），则使用`web`工具。

重要提示：不要再尝试使用旧的`browser`工具或从`browser`工具生成响应，因为它现在已被弃用或禁用。

`web`工具有以下命令：
- `search()`：向搜索引擎发出新查询并输出响应。
- `open_url(url: str)`：打开给定URL并显示它。

```

里面包含了明确的指示，比如：
`bio`工具已禁用。不要向其发送任何消息。如果用户明确要求你记住某些内容，请礼貌地要求他们前往设置>个性化>记忆来启用记忆功能

还提供了一些相关的背景信息，比如：

```plain text
你是ChatGPT，基于GPT-4.5架构的大型语言模型，由OpenAI训练。
知识截止日期：2023年10月
当前日期：2025年6月29日

```

还有对于输出的一些限制和格式要求：

```plain text
期望一个符合此模式的JSON字符串：
{
  comments: {
    pattern: string,
    comment: string,
  }[],
}

每个`pattern`必须是有效的Python正则表达式（与re.search一起使用）。

```

因为这个是System Prompt，所以没有包含用户输入。

我们可以通过观测一些主流的ChatBot、AI Agent的System Prompt来学习提示词的编写。我在附录里放了一些主流的Prompt供大家进行学习。

不过现在很多提示词的学习资料已经略显过时了。随着模型能力不断演进，简单的Prompt已经不再是问题的全部，真正影响AI表现的，是它知道什么、记住什么以及如何组合信息。于是**上下文工程（Context Engineering）**逐渐浮出水面，也将提示词工程取而代之，成为目前人人追捧、研究的对象。

# 1.2 上下文工程（Context Engineering）

## 1.2.1 What：上下文工程是什么？

> “Context engineering is the delicate art and science of filling the context window with just the right information for the next step.”
> ——Andrej Karpathy
> **上下文工程（Context Engineering）**这个名词并不新，但是在今年以来持续获得关注，尤其是当Karpathy在2025年6月25日引用了[Shopify CEO Tobi Lutke那条推文](https://x.com/tobi/status/1935533422589399127)，并发表了简洁但深刻的[推文](https://x.com/karpathy/status/1937902205765607626)之后，全行业开始认真对待上下文工程这个概念、艺术、实践，或者甚至可以说是一个学科。

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-08-25-from-prompt-engineering-to-context-engineering/1756127937_7.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
Karpathy在Y Combinator Startup School的演讲里提出Software 3.0的概念，里面将大语言模型（LLM，Large Language Model）类比成新一代的操作系统（OS，Operating System），上下文窗口（Context Window）是它的 内存RAM，而上下文工程，就是这个操作系统中的调度器，负责把最重要的进程和数据装进有限的内存中。

简单说，**上下文工程是一种为大语言模型构建、优化、动态管理输入上下文的工程化方法**。不单单是写好提示词，更是一个系统化的过程，包括：

1. 信息收集和整合：从多源数据中获取与任务高度相关的内容
2. 结构化和格式化：将信息结构化组织，按照一定格式提供给大模型
3. 上下文管理：在有限的上下文窗口内，通过裁剪、隔离、压缩、持久化等手段来管理
4. 工具和外部系统接入：通过与外部工具和系统交互，增强模型的能力

本质上，上下文工程是让大模型在特定场景下具备即插即用的任务能力，大模型在推理的时候所拥有的只有训练阶段获得的能力+上下文内容，在前者无法改变的情况之下，后者显得尤为重要，不管大模型曾经执行或者交互过多少轮次，最新的这次只能依赖所提供的上下文去做推理，因此上下文在推理阶段才如此重要。

## 1.2.2 Why：为什么需要？

为什么我们需要上下文工程呢？

首先是**大语言模型需要上下文**，在上下文缺少的情况之下，哪怕模型能力特别强，也无法给出正确的结果，就好比我们需要一个人去送快递，却不告知收件地址，那无论这个快递员开车多么溜，对于这个城市或这个片区的路有多么的熟悉，也无法顺利将快递送到收件人手中。

其次是，**错误源于信息不足，而不是模型不够好**。回到前面这个例子，当我们只告知快递员一个精确到楼栋的地址，却给了错误的手机号，快递员无法联系上收件人，这种情况之下如果快递员仍想努力送达，那么只能针对这栋楼挨家挨户的问了。这个在大模型的应用之中是很常见的一个情况，当我们需要大模型帮我改一个文件里面的代码，但是我们却没有给到其对应文件的代码，大模型是完全不知道怎么改的，或者说我们要改一个接口的功能，我们给了接口层的代码，却没有给数据库操作的代码，大模型依然无法帮我们从接口出发，一条龙的改下去。

就好比前段时间Anthropic的Claude Code（下称CC）大火，很多技术人员纷纷从Cursor转投CC的怀抱，抛开商业，这背后就是CC的上下文工程完胜Cursor的上下文工程。就拿目前Coding能力最强的模型Sonnet4和Opus4来说，Cursor和CC底层都基于一样的模型的情况之下，出来的效果都大不相同，CC可以更好地调用系统命令，更智能地从一个需求，到计划处几个目标，再到执行，最后再结合编译或者运行来做验收，整个过程每一步都是在处理上下文，都是在上下文工程的范畴之内。CC也因此获得了很多专业人士的喜好。我们也能看到一些用户通过CC去调用Kimi的K2模型或者Qwen的Coder模型，都能获得不错的效果，这正是因为CC本身的上下文工程的底子足够好，不管底层调用什么大语言模型，都可以最大程度发挥出模型的能力。

最后是**复杂任务及多源信息融合的挑战**。现实生活中的任务，通常并不是一个单一信息源就能完成的，就好比我们写一篇文章，我们需要浏览器查阅资料，需要通讯软件和别人交流和交换思想，也需要一个编辑器来写文章，最最后可能还需要有一定的平台或软件来分发我们的内容。这本身就涉及多个信息源，也需要和多个外部工具或系统交互。围绕着大模型，2025年是AI Agent大流行的一年，从单Agent到多Agent（Multi-Agent）追求的都是可以让大模型自主决定与外部交互的动作，并能在任务完成前持续的决策和交互。例如现在以Devin、OpenHands和Manus为主的AI Agent就为大模型配备了浏览器、编辑器、命令行（Shell），这可能就是一个程序员的标配，这样大模型就有了与外界交流的三个主要工具，因此可以自动化完成任务了。

从告诉模型做什么的Prompt阶段，到为模型准备什么认知环境的Context阶段，这是一种根本性的思维方式转变。上下文工程不是锦上添花，而是AI应用时代的关键基础设施。它不仅决定了LLM是否聪明，更决定了它是否有用。换言之：**训练和微调决定了模型的能力，上下文工程则决定了模型能发挥出多少能力**。

## 1.2.3 How：如何做呢？

在知道了上下文工程是什么以及为什么需要上下文工程之后，我们抛出最后一个问题，我们应该怎样做呢？

虽然上下文工程今年火起来，但是背后的技术和解决方案一直在发展，这也符合发展规律，一个学科发展就是经历了高速发展的野蛮生长阶段，在这一阶段会针对不同的问题产生出不同的解决方案。直到各种技术发展趋稳，并被广泛接受和应用之后，体系化就会出现，也预示着学科的诞生。这也是上下文工程在这个时候出现并不是偶然的，而是发展阶段到达需要关注上下文工程的时候，同时配套的技术和解决方案也趋于成熟。

我们看看[Philschmid](https://www.philschmid.de/context-engineering)对于上下文工程的一个维恩图：

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-08-25-from-prompt-engineering-to-context-engineering/1756127938_8.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
这张图用较为直观的方式展示了上下文工程中，目前涉及的一些技术手段，有我们场景的RAG、提示词技术（Prompt）、工具，也有一些记忆系统。这也是本书的核心，就是通过系统化的方式学会上下文工程的相关技术理论，并进一步学会如何实践。

关于这些技术，我这边就不展开讨论了，我们在第二部分，也就是第四章开始，会有详细的介绍。

# 1.3 两种范式的本质差异

**提示词工程的目标，是用一句话、一段话、一个格式、一个role prompt来激发模型的潜力。**它像是给模型下达精心措辞的指令，让它在你设定的框架内回答问题。这在早期以ChatBot这种聊天助手为主的AI应用场景里一度非常有效，尤其是当时大模型没有记忆、没有外部知识：

- 静态、单轮、指令导向
- 适用于封闭任务、结构化回答
- 零样本提示/少样本提示/思维链提示 等技巧层出不穷

但它的局限也很明显：

- 缺乏灵活的记忆管理，每轮对话要么是孤岛，要么是历史记录堆积
- 无法有效处理任务链条和复杂流程

提示词（Prompt）和这个词本身透露出的含义是一致的，也就是围绕着提示这个目标来构建对应的文本，因为目前的大语言模型底层是依托于Transfomer架构，本身就是基于神经网络结合注意力机制来做的概率计算，因此在有提示词的情况之下，可以让大语言模型关联注意到这些提示词，进而在生成结果的时候，有更高的概率是在这个方向上去生成。

但是随着技术的发展，尤其2024年以来，函数调用和MCP的发展普及，进一步推动了大模型调用外部工具的需求和场景，另外以Agent为主的AI应用形态开始大流行，各种Agent不断涌现，**此时对于上下文的管理已经从早起的简单对话形态进展到了需要各类技术辅助才能有效管理的阶段。**这样就有了上下文工程的出现。

上下文工程的出发点不同，它不再把模型当作回答者，而是当作协作者或者说希望模型有一定的“自主性”。这也是目前AI Agent的实践中很重要的一个认知和目标，就是**让模型可以在运行时持续的获取相关的信息，基于这些信息做出最佳的决策，产生最合适的结果。**它更像是构建一个运行环境，包含：

- 信息架构设计
- 记忆系统（短期 / 长期）
- 检索增强（RAG）
- 工具调用

特点：

- 动态、多轮、环境导向
- 支持状态管理、任务演进、链式推理
- 具备Agent级别的操作能力

在明确了上下文工程的概念、必要性与应用范式之后，我们将从下一章开始，深入拆解支撑上下文工程的关键技术栈与实现思路。
