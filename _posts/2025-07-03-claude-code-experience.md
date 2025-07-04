---
layout: post
title: "Claude Code实测报告: 当我不再Debug"
date: 2025-07-03T08:00:00+08:00
tags:
  - AI
  - Tech
  - Thoughts
categories: AI
giscus_comments: true
tabs: true
pretty_table: true
toc:
  sidebar: left
---


## 深度体验了一段时间Claude Code（以下称呼为CC），是时候稍微聊一下

## ## 🚀 CC拔得头筹

目前得到的反馈和评价基本一致，CC远超Cursor，不管在Cursor中选择什么Model，都无法扳回，唯一能说的就是Cursor在产品化能力上是更胜一筹的，至少就目前的迭代速度和产品交互上来说，Cursor的体验更加优 但是终究耐不住效果的差异，就是那句简单的话：**在强大的实力面前，一切锦上添花的东西都显得不重要了** 言语万千，不如置身一试。下面就简单过一下CC使用方式

## ## ⚒️ 使用技巧

## 通过npm全局安装

## ```text
bash
## npm i -g @anthropic-ai/claude-code
## 
```text

## ### 默认允许 `--dangerously-skip-permissions`

## 我通常都是

## ```text
bash
## claude --dangerously-skip-permissions
## 
```text

这样启动的，就是允许其执行任何的命令，当然你应该根据你的实际情况来决定，我是MacOS，本身不是root，我的rm也是删到回收站，我认为我的需求都在我的控制范围内

## ### 恢复会话 `--continue`

如果你在一个session里不小心退掉了，可以通过这个命令回到之前的任务，会保留当时的相关的context，很适合用于继续之前的工作，或者之前的上下文对于后续的任务比较重要的话，可以持续使用

## ### 单次任务执行 `-p`

可以单次执行某个任务来利用claude去处理，可以是基于repo来做一些动作，比如：

## ```text
bash
claude -p "看看哪里用到users.gender"
git commit -m "$(claude -p "查看暂存的 git 更改并创建一个总结性的 git commit 标题。只回复标题，不要确认。")"
## 
```text

## 可以分析代码，可以生成git commit，也能不依托repo直接使用的

## ```text
bash
## claude -p "glucose 中文意思"
## 
```text

## 我觉得这点比ChatGPT的订阅好，平时可以在某些地方直接集成使用，很方便

## ### 登录 `/login`

有时候凭证过期了，可以通过这个方式再去浏览器授权后refresh token，持续使用

## ### 上下文压缩 `/compact`

通常我们很容易遇到上下文超过的情况，CC会在右下角提醒，出现百分比的时候就是快到上下限制，到0%就会自动去compact上下文，会丢失掉一些内容，但是依然保持了一些相关的上下文 有时候我会主动去compact，我个人的观点是，在连续或者相关联的任务场景下，compact后的上下文，依然比没有上下文来得更好，更加有助于实现 不过依然可能存在关键信息compact后丢失，根据情况自我取舍

## ### 清空会话 `/clear`

和直接Ctrl+C后再重开一个全新的会话是相同的，只不过可以快速清理，适合准备开启一个全新无依赖的任务，可以有效降低token消耗和无关上下文的干扰

## ### 多Repo结合

除了上面之外，还有一个比较重要的技巧，就是善用多repo结合，有些人会使用git worktree来把多个项目集中到同一个目录，这样方便claude可以同时在多个项目里工作，某些场景下很适合，比如前后端分离仓库的时候。 不过我自己的实践是喜欢使用软链，比如：

## ```text
bash
## cd /path/to/project1
## mkdir -p temp
## ln -s /path/to/project2 temp
## 
```text

好处是，我自己有一个projects的管理机制，并且有可能是不相关的项目，各自有自己的工作目录，最好的方式就是通过这样共享一份代码，我还会在temp里放大量给CC参考的东西，比如我在做页面开发的时候，我希望样式能参考某些站点的时候，我就会放置对应的html之类的文件 我觉得还挺重要的，包括有时候可以丢一些日志或者辅助文件，CC自己读取，会比自己贴到问题里好一些，哪怕很长的上下文也不会有问题

## ## **📉 **关于Limit & Token

我订阅的是Pro，基本每天都会遇到3次limit，比如中午12点，下午6点，晚上12点这种 关于CC的Token计算，始终不知道限制的Token数量是多少，网上流行的[Claude-Code-Usage-Monitor](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor) 是从`~/.claude/projects`里去统计对应的josnl文件里的，相当不准确，就我个人抓包分析和观测来看，这里面没有包含完整的token消耗情况 改了一下cli.js里的，在这个session里输出了一下cost，大概如图所示 可以看到一开始问题走了sonnet，所以input不大，output特别大，后来降到haiku。 另外其中包含大量的命中缓存，这些都是LLM厂商在推理过程中做的一些优化，有KV之类的缓存减少推理成本提高速度

## ## **📄 **System Prompt

我们其实也可以自己指定System Prompt，我在抓包的时候也看到，一个简单的问题背后，产生了3次请求：

1. 先请求quota

1. 对本次任务生成一个标题

1. 开始实际的问答completion

这期间还会配套一些监控统计的采集。我觉得要做到监控准确，可以开发一个服务做代理，代理CC的请求，期间通过里面的数据去做统计是最准确的

## ## 💼 实际项目

## ### 信息Hub: Tididi

[https://tididi.amoylab.com/](https://tididi.amoylab.com/) 这个项目会演变成一个信息Hub的平台，目前主要还是服务于自己和身边几个比较好的朋友，我希望能提高自己对有效有价值信息的高效摄入，不借助LLMs去做信息聚合是不太可能的。目前期望借助LLMs从一些确定价值的信息渠道去聚合，可以有效排除网上的一些噪声。有兴趣的朋友可以试试，目前免费使用，有想找我交流的可以公众号留言 目前是一个闭源的项目，未来有可能会开源一个个人版，这个项目全部是用CC写的，我介入的情况不多，只有一点点，接近100%代码是CC写的

## ### 内容集中分发: Ripple

[https://github.com/iFurySt/Ripple](https://github.com/iFurySt/Ripple) 我不想要再浪费大量时间在不同的平台和分发渠道去重复性的编辑自己写的文章，但是依然希望能保持一定的风格和格式去分发，所以有了这个内容分发的项目。 这个项目我相信我可以长期保持95%以上的代码交给AI来写，目前主要还是CC在驱动

## ### MCP网关服务: Unla

[https://github.com/AmoyLab/Unla](https://github.com/AmoyLab/Unla) 通过配置就可以将一些诸如HTTP的存量服务直接转成MCP Server，类似MCP时代的Nginx，也可以平行代理MCP Servers。企业级性能和特性。在开源社区这已经是一个很流行的项目了，目前已经有1.4K的Stars✨了，包括字节在内的多家企业和大量的个人用户都采用了Unla 不过这个项目最开始是用Cursor启动的，前些日子才开始用CC，但是依然是一个大量代码由AI产生的一个项目

## ## 🤔 背后的意义

使用CC我觉得有点动手能力的在AI Era基本自己都能捣鼓会了，我其实更想聊的是延伸产生的一些思考