---
layout: post
title: "GPT 5.6发布会让我意识到一个趋势"
date: 2026-07-13T08:00:00+08:00
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

[https://www.youtube.com/watch?v=Wq45rvPGNHs](https://www.youtube.com/watch?v=Wq45rvPGNHs)

[https://www.youtube.com/watch?v=GphgJjaKKhw](https://www.youtube.com/watch?v=GphgJjaKKhw)

周四OpenAI的发布会，发了GPT 5.6，以及传说中的SuperAPP（Codex和ChatGPT整合后集中在ChatGPT下），以及ChatGPT Work。OAI还是OAI，不过这些东西都不是我留意到的点，我留意到的是另外一个很重要的趋势！

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844704_35.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844705_36.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844705_37.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844706_38.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

视频中演示部分的输入，已经全面从文本输入转向语音输入了，这个我相信应该是今年以来最大的一个变化吧。那这个变化是从哪里开始呢？它是Typeles流行带来的一个趋势，几乎改变了现在很多公司和个人对于输入的范式思考和实践

[Typeless](https://www.typeless.com/)这个东西，它本身所涉及的技术并不是什么新的东西，之前也有[WisprFlow](https://wisprflow.ai/)的存在，但Typeless用一种简洁、丝滑的产品体验以及它marketing的能力，把这个东西从硅谷圈子里推了出来，目前开始影响各个公司关于语音输入的再思考

在背景之下，我也收到很多朋友的反馈，包括他们的一些日常使用感受：

- 朋友A：他其实日常就会比较大量的去使用，就会觉得这个语音输入，和Vibe Coding结合起来是非常丝滑、非常高效的一种方式

- 朋友B：他们公司的 CEO 到硅谷考察逛了一圈之后回来，直接付费给全公司的人订阅了，强制所有人都用Typeless，平时会统计一下使用情况。体感上会有点狗，但是对于初创来说，也不失为一种强制Push大家去接受新事物的一种方式

我自己也用了一段时间，这个东西确实是可以很大地提升我们的输入能力。像WisperFlow它的 onboarding引导页其实也有一个这样的说明。它说键盘输入的效率是比语音输入低几十倍，大部分人看到一定是嗤之以鼻，但是它下面马上show了一个可交互的页面，你不信的话你可以自己试。我试了一下，可以达到的效果确实是会比文本输入更快，快的不是一倍两倍，而是几十倍。这是可以量化的

就如我一开始认为的，觉得做一个这个东西非常简单，但是做完之后还是感叹，哪怕是这种看似简单单一的产品，打磨到丝滑体验的程度，会被无数的细节给压死，不仅联想起，在大厂“很难做出好产品”这句话背后隐含着无数的痛苦面具

# HeyYo

接下去会聊一下我做[HeyYo](https://hey-yo.app/)背后的故事

首先是分析和学习，因为在此之前，对于语音识别只是简单的了解，也知道他们做这些背后靠STT（Speech-to-Text）的技术，基本上就是这样

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844706_39.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

这个是最裸的形态了，我们进一步包装一下，会是这样的

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844706_40.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

可以了，有第一版了，相关的工作基本都是客户端和服务端开发，到这一步可以有第一版了

这里首先就面临了语言的处理了，基于此就稍微分析了一下现有的语音处理相关的知识，首先是音频的处理，是这样的一个流程

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844706_41.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

因此经常会看到的一些参数比如`16kHz 16bit mono`，这种其实就是代表了：

- 采样率是16kHz，每秒采16000次声音

- 位深16bit，就是用16位整数来存储

- mono是单声道，Stereo是双声道，大部分模型是用单声道训练的

*为什么这个场景下，基本用16kHz呢，因为根据奈奎斯特采样定理（Nyquist-Shannon Sampling Theorem），采样率≥2*最高频率，所以16kHz采样率可以覆盖最高8kHz的频率，而人说话大部分有效信息（元音、大部分辅音、共振峰等）都集中在8kHz以下，所以足够了\*

_同理位深16bit的也是一个道理，16bit按照量化噪声公式可以算出理论信噪比是98dB（分贝），人类正常说话是60-70分贝，大喊差不多是80-90分贝，所以98分贝可以完整覆盖日常说话场景了_

这里我们可以关注两个重要的东西，就是**编码格式**和**文件格式（容器）**：

|          |          |          |                             |
| -------- | -------- | -------- | --------------------------- |
| 编码格式 | 文件格式 | 文件大小 | 备注                        |
| PCM      | WAV      | 大       | 最原始的采样数据，无需解码  |
| Opus     | Ogg      | 小       | 有损压缩，需要解码（可CPU） |

为什么要了解这个，因为这关乎网络传输和存储成本，看下这个：

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844707_42.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844707_43.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844707_44.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

列个表格对比一下：

| 音频时长 | 采样率 | 编码格式/文件格式 | 文件大小 |
| -------- | ------ | ----------------- | -------- |
| 4s       | 48kHz  | PCM/WAV           | 416KB    |
| 9min5s   | 48kHz  | PCM/WAV           | 52.3MB   |
| 4s       | 16kHz  | PCM/WAV           | 141KB    |
| 9min5s   | 16kHz  | PCM/WAV           | 17.4MB   |
| 4s       | 16kHz  | Opus/Ogg          | 10KB     |
| 9min5s   | 16kHz  | Opus/Ogg          | 1.1MB    |

可以很明显的看出差别，Opus/Ogg带来的收益特别大，一个是传输的数据变少了，能得到更多的时延，一个是存储的成本也成顿的减少了。人耳听完全听不出差异的，解码的损耗也可以忽略。这个也是目前主流的方案了

到这里就解决音频相关的问题了，现在就需要来看识别的模型了。这个有很多选择，最早的自然是OpenAI的[whisper-large-v3-turbo](https://huggingface.co/openai/whisper-large-v3-turbo)，算是比较有名的了，截止目前也还是有人在用，虽然已经好多年了，但是底子还可以，就是长尾效果差，时延不稳定

另一个选择就是走目前的多模态大语言模型，现在的多模态模型很多都支持图片、语音、文本的混合输入，然后得到文本，在这个场景下就很合适。因此在这个情况下，就可以针对这边STT使用什么模型做一个对比了，我自己录了3个Case：

- 英文

- 中文

- 中英混

跑了一个简单的bench，每个模型针对每个case各跑5次，用这个汇总数据感受一下：

| Provider/Model                      | avg时延 | 中位时延 | avg评分 |
| ----------------------------------- | ------- | -------- | ------- |
| Gemini / 2.5 Flash                  | 3.11s   | 2.86s    | 0.829   |
| Soniox / stt-rt-v4                  | 19.09s  | 17.99s   | 0.974   |
| Deepgram / nova-3                   | 18.16s  | 17.52s   | 0.553   |
| Cloudflare / Whisper large v3 turbo | 3.15s   | 2.44s    | 0.888   |
| SiliconFlow / SenseVoiceSmall       | 0.76s   | 0.66s    | 0.558   |

不是完全的严肃严谨，提供一个基础的感知，因为这里面还是有一些空间去调优的，包括多模态大模型是可以有Prompt和Reasoning Effort的调整，后面会讲。原始数据抽一些列：

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844707_45.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

可以直观看到速度，和识别的效果，有些诸如deepgram和soniox还是挺多人用的，但是我敢肯定的是，他们不适合这个场景，完败到没话说

从这里，我们初见杀至少是相对明确的，我们能选择的模型就是耗时最短的那几个（_FYI，这边举例说明而已，实际上还有特别的SOTA模型我没有bench结果上来，他们的表现也各不相同，这边暂时不列出完整的结果，后续考虑开一个完整的榜单列出语音相关的这些数据_）

但是到这里就可以用了么？是可以用，但还可以再进一步。比如这边如果我们选择类似Whisper或SenseVoice之类的，很验证的问题是不稳定，一个是输出效果的不稳定，一个是时延不稳定。

因此更好的选择是选择大模型，但是**大**模型，会带来时延的上升，尤其现在整个行业已经都自带思考了，这个东西对于STT来说，没啥用，或者说收益远远小于速度的牺牲。因此这里不管用什么多模态大模型，最终都是走向关闭思考，或者最小化思考Effort

到这里其实第一阶段的探索和实施结束了。到这里基本上就可以做出一个可用的产品了，但是进一步推进的话，会发现，架构上或许还需要再调整一下，从一阶段拆成两阶段，应该是很多成熟产品的路线，因此关于架构（或者说pipeline）演变成这样：

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844709_46.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

一切都是双刃剑，有双阶段的好处是：

1. 可以多路并行识别，在Refine阶段可互相补充印证识别情况，避免单一模型短板

2. 可以进一步扩展功能，比如从文本识别扩展到翻译、搜索等更多的功能面，这个在单阶段是比较难做到的

但是相应的，一个很明显的问题就是增加了时延，我做了一些简单的bench得出的一个对比：

| 指标     | 2阶段  | 1阶段  |
| -------- | ------ | ------ |
| 中位时延 | 2608ms | 1537ms |

依然是不是严肃严谨的测试，但是整体是这个情况，多一次Roundtrip自然多一程时延，是个取舍的问题。在这个架构调整之后，产品的整个使用已经打磨的相对舒服了，但是这也只是一个Baseline版本，这期间其实也有一些我印象比较深刻的点有助于速度的提升：

- 关掉或者最小化思考，前面也有提到，这个对于我们这种分秒必争的场景很重要

- 默认走WebSocket，Fallback走HTTP，这样可以边录边传输，可以节省掉大部分传输耗时。服务端也可以优化出ws陆续传输到模型侧

- 端侧转码，因为这期间也试过PCM到云端，但是会有转码瓶颈。通常在端侧做好Opus的编码，然后chunk流上传

- System Prompt的调优，也会有影响，prompt长度也会有影响，和Coding Agent这类有着本着的差别！

接着要做一些配套的机制了，重要的是这么几个：

1. 环境上下文采集

2. 字典：公共/领域字典+个人字典

环境上下文采集就是针对输入框所在的地方采集相应的上下文信息，比如：

- 所在APP：Notion和微信里的期望风格是不同的，这就可以通过这个信息来客制化

- 前后的文本，是否选中文本等这类信息：有选中文本的话，通常就会被结果替代。光标前后的一些相对距离较近的文本，也能帮助我们去输出更好的结果

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844709_47.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

这些相关的就统称为环境上下文，这个也是通常这类软件需要Accessibility权限的原因，有了这个就可以针对APP优化了，体验感会极大拉升

其次是字典，没有字段，针对一些专有名词、人名地名等一定没办法准确输出，公共/领域字典不展开，八仙过海属于。重要的是个人字典，这个是润物细无声的技术，关键流程：

1. 识别后得到文本后，用户发现有些地方识别错了，手动改了

2. 一定周期内会采集对应的改动和相关的上下文信息上报

3. 离线Pipeline会去做词语的提取流程，然后返哺到个人词典

4. 下次用户在语音输入时说到这个词就能自动匹配上

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844709_48.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

这就是非常典型的润物细无声，在用户使用的过程中持续的优化提取词典，在后续使用过程中无缝提升用户体验

到这里基本上可以达到一个不错的产品体验了，至于其他的，很看细节了，比如波形绘制看起来是否舒服，热键处理和稳定劫持，UIUX的打磨等

再往下推进到移动端后，反推的就是需要输入法了，没有输入法在手机端用起来就没那么丝滑了，关于输入法部分的暂不展开，回头再专门聊

# 写在最后

通过技术的角度去聊一个产品的诞生过程，表述简单，但是实际的过程中还是充满了很多的探索、尝试、使用和反馈修正的过程，没有一个好产品是预先规划出来的，一切好的产品都是要经历不断Dogfooding反复打磨后才能达到的

现在有了AI的赋能，很多问题已经不再是问题了，不管是coding、design，还是学习研究，甚至是bench、eval等，快速的时代更应该反其道而行之，沉下心来去沉淀出一些能长期复利的东西
