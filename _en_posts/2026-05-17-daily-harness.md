---
layout: post
title: "Daily Harness"
date: 2026-05-17T08:00:00+08:00
lang: en
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

> **Note:** This article was translated for me by AI. I wrote the original in Chinese. I never use AI to write my articles, because that would cost me my own expression; my freedom to express myself is always the most valuable part of my work. So if you can read Chinese, I recommend reading the Chinese version, where you will get the most original and unfiltered version. That said, technological progress exists to give us more convenience, so I will continue using AI to translate my writing into multiple languages, allowing valuable content to reach more people.

It is time to write something about Harness. Previously I had only scattered thoughts across different places, all very fragmented. After making it public, the feedback I received was all positive, so I think this thing is valuable for many people. I am sacrificing two hours of my own time and giving this to whoever is meant to find it.

# Free Your Mind

What I have is not new, and it may not even fit your workflow or product, but my thinking will definitely give you something. That is also what I want to convey through this article.

I believe many people still do not believe that large models' capabilities have already seriously overflowed. One possible reason is insufficient understanding, and another is insufficient experimentation. The latter is driven by the former, so when looking at the root cause, or in the fancy wording, the first principles, cognition is the first thing that needs to be solved.

Recently I have repeatedly told people around me to dare to imagine, dare to challenge the boundaries of AI's capabilities, and try hard to touch the ceiling. After reading this article, perhaps you will have a better understanding of that sentence.

# Harness Template

Let us start from this open-source repo. There are three related repos:

- [https://github.com/iFurySt/harness-template](https://github.com/iFurySt/harness-template)
- [https://github.com/iFurySt/harness-template-cn](https://github.com/iFurySt/harness-template-cn)
- [https://github.com/iFurySt/harness-cli](https://github.com/iFurySt/harness-cli)

The first two are the same, with only English and Chinese differences. Personally, I mostly prefer using the Chinese one, while a small number of open-source projects use the English one. The third is a CLI used to quickly create a new project. In essence, it also uses the first two. Usage is as follows:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989811_1.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
You can directly use the Template on GitHub to create a repo. For me, when I want to start a new project overall, this approach is a roundabout extra step, so I usually just run the CLI directly:
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989811_2.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
Then I can happily begin dancing with AI.

Before going deeper, let us first talk about Harness itself. The development of AI Agents has gone through several important stages:

1. Prompt Engineering
2. Context Engineering
3. Harness

Thinking back, last year I was still writing the CE101 book. The past is unbearable to look back on. To put it bluntly, when I look at those things now, I feel they should be thrown straight into the trash. But I still think the time I spent writing it was worthwhile, even though now I have to slap myself in the face.

Over the past half year, Harness has become popular everywhere. I do not know where the word came from, and I am not interested, but I think the word is incredibly precise.

We know models are nondeterministic. We keep writing Prompts and Skills to constrain model behavior and guide it toward the direction we expect. It is like riding a horse. Saddles, bridles, reins, stirrups, and so on are all used to constrain the horse so it walks, runs, or stops in the direction we want. But a horse is only an animal. It cannot understand human language, and can only be constrained through training and external tools. Large models are the same. A model cannot produce deterministic results. We cannot control it; we can only constrain it. That is why we use the word Harness instead of words like Control.

For Harness, depending on the context, I think it can be divided into two types:

1. Harness for products/services: supporting tools, memory mechanisms, sandboxes, and so on, all serving the model so it can perform better.
2. Harness for production processes such as R&D and creation: supporting scaffolds, environments, contexts, and so on, all for better creation.

There is not much to say about the first type of Harness. Clone the source code of Codex, Claude Code, OpenClaw, or Hermes, analyze it with AI, and the truth becomes clear. There is not much magic. People who claim their harness is amazing are usually one of these:

1. Limited capability and vision.
2. Bullshit scammers.
3. The system is overly complex, letting them build something above a SOTA baseline after all kinds of effort, and then feel very happy about it.

These existing harness technologies have existed for a long time. So why did things not look like this two years ago? Look back at large model capabilities from two years ago. Therefore, at this stage, returning to "the model is the product" is a more objective and accurate understanding. So I will not expand on type 1 Harness. Every company knows clearly whether its product is good or bad, and should also know how to integrate these things.

Now let us return to type 2 Harness. This is also the main battlefield of my Harness Template, and the point where I believe it can bring real improvement to individuals, teams, and organizations. Before expanding on it, there are a few earlier articles that I think are also worth reading when you have time:

- [**How We Speedrun in the AI Era**](https://www.ifuryst.com/blog/2026/speedrunning-the-ai-era/)
- [**The Primitive Urge to Solve Problems**](https://www.ifuryst.com/blog/2026/the-urge-to-solve/)
- [**Browser Use Deep Dive**](https://www.ifuryst.com/blog/2026/open-browser-use/)

They all more or less discuss some of my thoughts and actual practices while exploring and practicing Harness.

The core of this methodology is actually to let everything begin with AI and end with AI: AI produces for AI to use, and all information stays inside the repo. That sounds a bit abstract, so let us go step by step. First, look at this diagram:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989811_3.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
I wrote this myself, and I think these points express my ideas fairly well.

## AGENTS.md

Next, look at the project directory:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989813_4.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
It is very simple. When entering the project, the first things are `AGENTS.md` and `CLAUDE.md`, which basically cover mainstream Agents. Here, `AGENTS.md` is usually used as a table of contents. It breaks things apart into `docs`, so content can be loaded on demand and context loss can be reduced.
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989813_5.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
Usually we divide things by key stages or domains, such as:
- Read before starting: usually collaboration norms, a brief repo overview, and some guiding material.
- Read after finishing work: usually closing tasks, such as writing history records, test coverage, acceptance checks, and so on.
- Read before submitting: usually actions such as full local tests or branch operations.
- Domain-specific reading: most commonly frontend and backend. It can also be further refined by module, DDD, or similar approaches for selective reading.

These are basically a large natural-language Harness in action. In today's popular terms, it means writing many nonstandard Skills and loading them on demand.

## docs

Next is `docs`, and this is very important. Using today's language, this can be understood as the idea behind Karpathy's LLM Wiki. The only thing I can say is that influential people, or top AI influencers, have much stronger distribution.

There is nothing special about how the directories are divided here. I just came up with a structure myself. In practice, you can adjust it according to your own project's situation and needs. Roughly, the ideas are:

- Independent files split out from `AGENTS.md` can live here. They can be single Markdown files, or directories with more detailed content inside.
- `histories`: this is my own genius invention. With this, every query and change in the entire repo from Day 1 is recorded. The benefit is that you no longer need to write documentation. During onboarding, new people can use AI to understand everything that happened before. When a feature has a problem, you can also quickly trace back what was changed, where it happened, and where the regression came from. You can also let slower-running people learn how experts vibe. In a sense, this can serve as the repo's memory.
- Milestone/feature planning: generally tracked through the file system as TODOs. Even now that `/goal` exists, as in the Ralph Loop, this is still very useful. Tracking TODOs inside context is asking for trouble, let alone large features. Tracking them in files supports long-running tasks, and also lets you dynamically modify milestones and goals by adjusting files while the work is underway. I will mention this again later.
- Everything else includes product definitions, design specs, reference files, release docs, and so on.

## Others

There is not much more. Let me mention a few important ones:

- `scripts`: usually reusable scripts. AI can also accumulate things here, so they can continue to be reused later.
- `skills`: I did not include this in the template, but in practice there will be many skills here, such as operating a browser, logging into a bastion host or development machine, deployment guidance, and so on.
- Sensitive files: I generally use directories such as `.harness` or `.agents` to store sensitive files. This directory is added to `.gitignore`. Files inside can also use environment variables for encryption, avoiding plaintext keys sitting around. When AI needs to use them, it can execute a script to read the key from env in real time, decrypt, and get the content.

# Usage

That is the explanation. Maybe it sounds ordinary, but just like the famous line in my earlier screenshot, `**Less is more**`, once we start using it, the magic appears. Let me explain with real examples.

## Open Computer Use

First, look at [Open Computer Use](https://github.com/iFurySt/open-codex-computer-use). Before starting this project, I needed to analyze the existing mechanism. If I had used raw Codex directly, much of the content could not have been accumulated, and many analysis details would eventually be lost through repeated context compaction. So I used the harness template mechanism to continuously deposit the information I obtained during analysis into `docs`.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989814_6.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
Also, because reverse analysis is a continuous process and requires many different tools working together to analyze things, sometimes the latest information collected later will overwrite earlier wrong conclusions. Therefore, this persistent and compounding system becomes very necessary.

With this information, later implementation can continuously refer back to it. Even after the official version upgrades, new content can continue to be incrementally updated. That is where continuity comes from.

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

Next, look at the [AIFi](https://github.com/iFurySt/aifi) project. This is a financial analysis project. The project name is inspired by DeFi for decentralized finance, and AIFi for AI finance. This project has zero code requirements. It is itself a product composed of many Skills. The directory is the product.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989814_8.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
Open source in the new era means open-sourcing Skills. Here, experts from the traditional investing and wealth-management domain are modeled as individual Skills, so AI can play different roles on demand and do different work. Here comes the classic part: this time I did not use `docs`. I directly asked AI to persist the results of each research and analysis session under `research` in the repo root, so research can compound.
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989815_9.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
Here, architecture is no longer software architecture, but the architecture of the entire system.
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989815_10.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
Look at some analysis results:
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989815_11.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
Overall, it is similar to the old deep research. But now, do we still need to separately build a deep research tool? Open Codex or Claude Code, put such a harness on top, and no matter the domain, you can accumulate very good content.
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-17-daily-harness/1778989816_12.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
Add a [Gen UI Skill](https://github.com/iFurySt/visual-html-gen-ui), and you can produce visualized content.

# Free Your Cognition

Everything mentioned above is meant to open your cognition through small examples. When encountering any problem, try to challenge AI, continuously widen its boundaries, and see where its ceiling is. This will determine where your ceiling is in this era.

Let me give another simple example. Recently I have been practicing on a project called [Nano LLM Serve](https://github.com/iFurySt/nanoLLMServe). The main idea is to build from scratch and use practice to pry open my own understanding of models and infra. During this time, I have been continuously co-learning and co-working with ChatGPT/Codex. I am just an unknown, mediocre undergraduate who used to look at formulas like they were heavenly scripture. Now I can discuss Speculative Decoding, Steering Vectors, and KV Cache Network with others. I can also explore the latest Interaction Model and Diffusion Language Model on my own. Starting from applications, reverse-driving theory, and working with AI, I keep breaking the boundaries I had set for myself in my old cognition. This is not only the survival rule of this era, but a survival rule that should exist in any era.

Talking about survival rules sounds a bit stiff. It may be better to explain it from the perspective of Just For Fun. Yesterday I sent a message to a friend:

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
Perhaps for people who like building playful things, the capability amplified by AI is infinite. The only limits are the fragility of the carbon-based body and the 24-hour limit of a day.

# Epilogue

I believe that if you can start using this harness template, you will definitely begin to slowly perceive things that were previously impossible to perceive. I do not think this thing will necessarily fit you, but you can gradually adjust it into a harness that suits you.

Recently, what I still feel most strongly is learning to dance with AI. Just like the younger generation growing up in the AI era will naturally treat AI as a tool, just as we once used PCs, the internet, mobile phones, and so on. Only because we became used to them, and because experience grows with age, we slowly started losing the ability to keep trying, keep making mistakes, keep failing, and finally gain something. The era has always been changing. It is just that people, from the moment they begin to change, slowly start seeking what does not change. A short life cannot embrace too many changes.
