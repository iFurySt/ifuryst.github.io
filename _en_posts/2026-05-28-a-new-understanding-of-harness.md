---
layout: post
title: "A New Understanding of Harness"
date: 2026-05-28T08:00:00+08:00
lang: en
translation_key: a-new-understanding-of-harness
tags: AI
categories: AI
giscus_comments: true
tabs: true
pretty_table: true
toc:
  sidebar: left
---

> **Note:** This article was translated for me by AI. I wrote the original in Chinese. I never use AI to write my articles, because that would cost me my own expression; my freedom to express myself is always the most valuable part of my work. So if you can read Chinese, I recommend reading the Chinese version, where you will get the most original and unfiltered version. That said, technological progress exists to give us more convenience, so I will continue using AI to translate my writing into multiple languages, allowing valuable content to reach more people.

This moment of clarity came from [episode 2 of Zhang Xiaojun and Dai Yusen's observations on startups and venture capital](https://www.xiaoyuzhoufm.com/episode/6a15a2cbff7b9a8c0a5b953f?s=eyJ1IjogIjY4Mzk3OTM0ZDFkMzUwNzI2OWRiOTQ4NCJ9).

I happened to be taking stock of and reassessing Harness recently, and listening to this podcast episode over the past couple of days gave me some good ideas!

Codex, Claude Code, and OpenClaw can all be described as harnesses. In essence, they use a set of supporting mechanisms, tools, and environments to help models perform at their best.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-28-harness的新理解/1779949798_3.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

This image I generated with ChatGPT gives a concise and straightforward introduction.

Building a baseline harness is easy. Codex, OpenClaw, OpenHands, and Hermes are open source, while Claude Code has leaked source code. Clone one of them, collaborate with AI for a bit, and you can get an in-house version of a harness. So where does the value of a harness lie?

I think it makes a lot of sense to compare a Harness to an Agent OS!

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-28-harness的新理解/1779949799_4.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

I quickly generated this image from my idea. Ignore the details—I only wanted to express the idea quickly, and for now I don't want to spend too much effort drawing the whole thing by hand.

We can think of an LLM as the CPU of the past. A Harness is like the OS: it provides drivers for different LLMs, which means the underlying LLM can essentially be swapped out at will, with only the results varying. Supporting components around it—such as sandboxes, memory, and tools—do not need to be tightly coupled to the model.

This is where the significance of a Harness becomes clear. Claude Code's open ecosystem, for example, is not sufficient right now. Codex has an App Server, and OpenAI has taken a clear position in support of openness—similar to the ecosystem strength of ETH in crypto. This has led to many products being built on top of a “harness,” including:

- Slock (built by the former Kimi CLI team), which runs a daemon directly on your machine and connects to its server through WebSocket, allowing Slock's server to issue commands to Codex or Claude Code.

- Codex.app, which can also be seen as a product built on top of the Codex Harness itself.

- Products like Guo Yu's Wanman are another interesting angle. In the past, you logged in to a website with Google OAuth 2.0; now you log in with Codex OAuth 2.0. Think about that for a moment.

- Managed Agents are a first-party Agent OS service, and they may go even deeper. You can think of them as operating at the syscall level of a traditional OS: there is no need to build anything else on top of the Harness, because the capability can be offered directly to the outside world. This is a zero-code, out-of-the-box capability.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-28-harness的新理解/1779949799_5.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

This one was generated too. Again, don't get hung up on the details; it is broadly correct. Codex.app is currently a shell built on top of Codex CLI.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-28-harness的新理解/1779949800_6.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

You can see that it packages Codex CLI itself. This is merely a first-party wrapper, but in theory anyone could use Codex CLI—the Harness itself—to build an open Codex.app or any other product.

This is the opportunity for Harnesses, or Agent OSes. If treated as a product, it could be sold independently as an OS in the future, support the rapid growth of applications above it, or be offered directly as SaaS. Codex and Claude Code are both heavily oriented toward a single machine and local use, but Managed Agents must have an enterprise-grade Harness behind them. That is what we should be pursuing. Not many people are discussing or building this yet, but as the certainty of AI profitability in the enterprise continues to grow, it will inevitably become one of the main battlegrounds.

The Harness/Agent OS itself should therefore focus on doing this layer well:

- Hide these details from the outside world while demonstrating strong product quality, ease of use, flexibility, extensibility, stability, and so on.

- Build all the necessary internal mechanisms to ensure stability, latency, scale, distribution, high availability, and so on.

- Adapt well to the LLM layer below, which may even require some understanding of models and LLM infrastructure.

Once these concepts are clear, you have a clear picture to guide the direction of iteration. The only way to improve your understanding is to see more, hear more, and try more. Things are changing too quickly, creating a major challenge for decision-makers. It is crucial to remain sensitive at all times, take in a large amount of information, internalize it, and continuously reduce its entropy.
