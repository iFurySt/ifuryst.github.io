---
layout: post
title: "Agent vs Human: PR数据里的协作趋势"
date: 2025-07-12T08:00:00+08:00
tags:
  - Tech
  - AI
categories: Tech
giscus_comments: true
tabs: true
pretty_table: true
toc:
  sidebar: left
---

自 2025-05-15 起，一个叫 [**Agents in the Wild**](https://insights.logicstar.ai/) 的项目开始持续追踪 AI Agent 与人类开发者提交 PR 的情况。

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-07-12-agent-vs-human-collaboration-trends-in-pr-data/1752305884_1.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-07-12-agent-vs-human-collaboration-trends-in-pr-data/1752305885_2.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

📈 目前来看：

- Agent提交的PR数量仍远低于人类（大约相差一个数量级）
- 值得关注的点：**部分Agent的PR合并率已经超过人类开发者**
- 另外也有理由怀疑，人类提交的PR中，也许不少其实是AI辅助coding的成果

这是个有趣的观测角度，以小见大，我们可以想象公司和个人也在不断的集成Agent或者AI到日常和工作中，至少目前在虚拟世界我们已经在朝着Cyberpunk2077里演绎的方向前行了，更别说近年来脑机和机器人领域的高速发展

事实上，在开源社区，我们已经越来越频繁看到使用AI协作开发并提交的PR了。有时候质量会比人类的好，但是有时候一些Edge Cases没有考虑到，且个人测试的时候可能不如Maintainers了解的多，所以有时候反而会增加Maintainers的负担

我是乐观派的，每一轮技术跃迁都会经历适应期与阵痛期，只不过这次生成式为主的AI发展太快了，各种争论也一直持续。但我依然相信，**它值得我们投入观察、尝试与期待**
