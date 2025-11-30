---
layout: post
title: "大模型采样策略"
date: 2025-11-30T08:00:00+08:00
tags:
  - AI
  - Tech
categories: AI
giscus_comments: true
tabs: true
pretty_table: true
toc:
  sidebar: left
---

在调用大模型的时候，你可以会看到过temperature，top-k甚至是top-p，min-p这些参数，它们的含义是什么呢？

这些其实都涉及到了大模型的采样（Sampling）策略，这些内容可以影响模型的输出，甚至是输出风格，比如模型输出更具创造力还是，更加更倾向准确确定的方向。我们最多的应该是使用了Temperature来控制，我们知道大一点（比如1）可以输出更加创造性的内容，小一点（比如0.1）的可以输出更加准确的内容。这些其实都跟一个叫做Softmax有关

# Temperature

在Transformer的Encoder环节，简化流程大概是这样：

1. 输入`我是Leo`
2. 经过分词、向量、变换和计算，最终得到logit，如：`[4.8, 3.0, 2.9]` ，此时还没经过归一化
3. 我们计算softmax，`softmax([4.8, 3.0, 2.9])=~ [0.65, 0.13, 0.11]`（可以简单理解成做归一化+重点放大，就让概率变成0-1之间的数值，同时放大差异，也就是重要的概率更大点，不重要的概率更小点）

temperature为什么能影响到结果呢，因为softmax的公式是：

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-11-30-llm-sampling/1764495648_15.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
其中T就是temperature，T的大小是可以控制sofmax的分布是否尖锐的。基本上看到这个解释直接晕倒，我们看这张图：
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-11-30-llm-sampling/1764495648_16.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
可以看到4种不同的T下表现差异不同，其中：
- 横轴表示不同候选词
- 纵轴表示这个词的概率（简化的说法）

可以看到T越大，结果之间的的差异小了，表现为所有候选词的概率分布被拉平了，大家彼此更加接近，这种情况下模型更难分别出哪个词是合适的。

而T变小后，差异会明显凸显，高概率的词会显得概率更大，有区分度

实际例子看一下：

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-11-30-llm-sampling/1764495648_17.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-11-30-llm-sampling/1764495648_18.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-11-30-llm-sampling/1764495649_19.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
可以看到候选词的概率分布差异。所以我们用Temperature来改变模型输出风格就是这个原理。

## Top-K

接下去是TOP K，这个就很好理解，在产生的多个候选词中，只筛选出概率最高的那K个，比如这里的：

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-11-30-llm-sampling/1764495649_20.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
最终只筛选了前3个。这种策略有个问题，就是适应性差，本质上就是完全不在乎候选词的情况，硬性选择前K个，比如K=10，在某些情况下可能太大（包含很多无关紧要的候选词进来），在另一个情况下可能有太小（把一些好的候选词都去掉了）

因此我们会有一些进一步的策略来解决这些问题

# Top-P

Top-P也叫Nucleus Sampling 核采样，原理是保留累积概率超过P的候选词，比如：

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-11-30-llm-sampling/1764495649_21.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-11-30-llm-sampling/1764495649_22.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

P=0.2的时候，命中了2个候选词：了解13.35%+咨询7.63%=20.98%大于20%（0.2）
P=0.25的时候，前面的2个候选词加起来就不够了，再加一个问6.98%=27.96%就大于25%了

这个策略的好处是能自适应，比如在面临特别多候选词的时候，可以通过概率限定去干掉太多不相关的，在候选词不足的情况下也能补充到满足要求

# Min-P

我们来看个情况

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-11-30-llm-sampling/1764495650_23.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
可以看到这个情况下，如果是top-p，P=0.1的情况下，只会得到`一个11.18%`，哪怕`了解9.47%` 也同样适合甚至更适合的情况下，这种时候Min-P可以通过设置最小的概率P=0.09来降这两个都高概率的结果捞出来，总体而言带来的好处是：
- 保留“亚军词”，也就是前面说的这个情况
- 解决长尾问题，比如累积P不足，大量捞到一些小概率的候选词，实际上不一定有什么帮助
- 适应性更好，如果出现绝对领先，那不会有更多干扰进来，如果出现不确定性较强的候选词，可以让跟多接近的候选词进来

# 总结

通常来说我们也不只是单独使用一个策略，而是将多个策略一起使用。除了前面介绍的这些采样策略以外，还有一些其他的，比如Exclude Top-K，也就是去掉Top K的结果，比如去掉Top1，这样有助于模型输出根据创造力的结果，减少模板化输出

文中用到例子我开源放在了[这里](https://github.com/iFurySt/llm-sampling)，可以本地直接通过python运行起来，默认会去HuggingFace上拉Qwen/Qwen3-0.6B模型，可以很方便的测试和查看
