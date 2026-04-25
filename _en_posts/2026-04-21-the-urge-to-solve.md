---
layout: post
title: "The Primitive Urge to Solve Problems"
date: 2026-04-21T08:00:00+08:00
lang: en
translation_key: the-urge-to-solve
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

What the AI era changes is only the method of solving problems. The Geek, or the person who solves problems, remains unchanged.

Today I will use the experience of building [Open Computer Use](https://github.com/iFurySt/open-codex-computer-use) over the past two days to talk about this.

The background is that on Friday OpenAI published an article, [https://openai.com/index/codex-for-almost-everything/](https://openai.com/index/codex-for-almost-everything/), and Codex App also updated. Among the updates, Background Computer Use truly shocked me and my friends. We were deeply impressed by the non-preemptive Computer Use it brought, and by that lively, natural mouse style. Before this, our understanding of Computer Use was all about Connectors, such as Gmail, plus GUI, meaning mouse and keyboard. But OAI still handed in an excellent assignment.

We spent one day analyzing and recreating it, successfully implemented and open-sourced this version, and exposed it externally through MCP so all AI Agents can directly gain non-preemptive Computer Use ability. I threw the screen recording onto YouTube:
{% include video.liquid path="https://www.youtube.com/embed/2s6aVpGiwaQ" class="img-fluid rounded z-depth-1" %}

In this version, we finished all functional parts. In other words, open-computer-use can seamlessly replace the official computer-use, except for that lively mouse style. Let us first talk about the process. I remember starting around 11 a.m. and officially releasing it at 2 a.m., roughly 12 hours. In that time, we completed something that once felt almost impossible. There is a story behind this, and I have something to say.

# The Primitive Urge to Solve Problems

Looking back to the era before ChatGPT was released, from my student days onward, tinkering had always been the main theme. It is also what I have always said: just for fun. Precisely because of this, even after turning my hobby into my profession, the core never changed: discover a problem, try to solve it, and finally gain satisfaction and joy. In essence, it is not very different from playing games or scrolling short videos. All of them are people satisfying their own biochemical needs.

But the process does have some differences. We analyze problems, collect information, solve problems, verify results, and deliver. The whole process can be orderly, or it can be full of strange and wonderful ideas.

Back in 2009, besides popular things like Huigezi and botnet machines, binary reversing was also very hot. Words like encryption, obfuscation, and unpacking can bring back many memories. I still remember studying all kinds of unpacking, assembly, OllyDbg, and so on just to reverse a binary, debugging with great interest in front of an interface that looked extremely dry and boring.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746581_18.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
A small wave of nostalgia. Later, doing security and offense-defense work gave me new perspectives on the ability to solve unknown problems. Although I was very weak, I learned a lot. Not tool usage tricks, but that way of thinking.

Thinking carefully now, it was not actually that period alone that cultivated all these habits and abilities. I can recall even older experiences. It seems that since childhood I have liked using my own wild-style kung fu to mess around and make things happen. I never liked taking the usual path. This core has followed me all the way until today.

Just like yesterday Logan reposted the article he wrote the year before last when Devin had just come out, along with that core point:

> It's been two years since I wrote this article, and the premise is still true: software engineers are paid to solve problems. Coding is just a tool to do so.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746581_19.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
If someone feels that AI's coding ability can carry them away, then perhaps they have only treated themselves as a Coder. There are two directions to talk about:

1. From the angle of everything AI owns, yes, it can carry you away, but not because of Coding.
2. If you treat yourself as a person who solves problems, or a person who proposes solutions, then AI's Coding ability is only a very small part of it.

This is also why we were so excited to get this thing done within one day. Because we all preserved the primitive urge to solve problems, and AI has provided us with a much stronger arsenal. The only thing that can block us is our thinking.

# Break Every Wall

First is execution. The method is the same. Before starting, we need enough information to support our, or AI's, next action. So we begin from the thing we want.

I still chose to start from the [harness-template](https://github.com/iFurySt/harness-template) we had accumulated, using it as a template to open a new repo. The benefit is that we do not need to write extra things. Pull it over and use it directly. During AI's analysis and execution, it continuously deposits content into the repo's docs. Is this not also the LLM Wiki Karpathy proposed?

Actually, I no longer know exactly how we discovered it at the beginning. It just happened naturally. We analyzed that Codex App relies on an independent MCP service to implement Computer Use, located at `~/.codex/plugins/cache/openai-bundled/computer-use/1.0.750/Codex Computer Use.app`.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746582_20.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
A tiny 26.5MB carries this awesome capability. I was honestly happy, because analyzing it would not be especially large in workload. Later we further analyzed that it contains a Client service called `SkyComputerUseClient`, and then we planned to start. I no longer remember the exact details, but fortunately we have the template.
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746582_21.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
Looking through the history, it is very clear that from the very beginning we asked Codex to help analyze these two, and the content kept landing in the repo. During this period, several parallel sessions were doing different work, and the full picture of Codex Computer Use slowly surfaced:

- It is written in Swift. After knowing this, we also directly implemented it in Swift. I still remember how hard it was to learn Swift before; now AI writes it in minutes.
- Externally, it is provided as MCP, with 9 tools. Once we knew that, we directly recreated them.
- The principle is to interact with the UI tree through Accessibility (AX), thereby enabling background interaction with apps, while returning screenshots for multimodal reasoning about the next action. When AX does not work, it falls back to osascript (AppleScript), or even mouse operations.

At the beginning, we did not plan to directly provide MCP. This is where the magic happened. Usoon came back from the restroom and told me we should directly make an MCP service. After hearing his explanation, I immediately agreed. This may be the hive intelligence of humans. No matter how strong one person is, they will always have bias.

At first, we asked Codex to output the descriptions and parameters of the 9 tools from its context. In reality, there were some mismatches; it was not 100% strictly aligned. Later, we directly equipped Codex with mitmdump, and let it call its own Codex to do packet capture and dump. There were many system prompts and tools inside, and suddenly we could strictly obtain descriptions and parameter definitions.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746584_22.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
This is the charm of CLI: nesting dolls to obtain things. Later, our comparative evaluation also used the same method. In the query, explicitly specify that it should use computer-use or open-computer-use to do a task, and we can compare while dumping process data. This is exactly what eval and improvement need most.

During the busy work, I even pulled up an independent session and asked it to design the LOGO directly. By generating several SVGs and going back and forth a few times, we got the LOGO we wanted. Looking at it now, I should go back and replace that mouse with one without a handle.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746585_23.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746587_24.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
It uses tools like ffmpeg and magick better than anyone, and has multimodal ability to accept its own result. This is very comfortable.

After that, we verified the tool execution results. At first, we asked Codex to make three sample calls for each of the 9 computer-use tools and iterate from that. Later we found this was still not strictly aligned enough. So we opened another independent session to analyze why we could not directly call Codex Computer Use through an MCP client. In essence, it is an MCP-compliant service, but earlier when we tried connecting, the process died as soon as it connected. This analysis found that `SkyComputerUseClient` only accepts calls from a parent process with the same signature. So we let Codex use Go to directly pull up a CLI, and through certain methods inherit the signature from Codex App. It executed smoothly. Now we had the ability to execute the official MCP through CLI.

With this capability, it became very convenient to let Codex validate both sides' inputs and outputs for alignment. This is also a problem often encountered in practice. When AI cannot solve a problem for a long time, telling it to try again or work harder is useless, because it lacks the relevant context for the thing you want. Therefore, providing context to AI is the responsibility and obligation of humans, and is also the key to how far AI can ultimately go. This runs through this article, or rather the whole process of this build.

At this point, we had solved the functional parts. The rest was product polish that added points to workflow and smoothness. Because it is an independent service (APP), it needs to separately obtain Accessibility and Screen & System Audio Recording permissions. For a good experience, OpenAI used the capabilities of Software.inc, which it acquired, to build an extremely smooth floating window. You only need to drag it. We spent some time debugging and adapting this thing too, and the effect is still great. See the YouTube recording for details.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746587_25.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
And publishing to npmjs, so `npm i -g open-computer-use` can install it in one command. All of this was done by AI. Give it a gh, help click a few things, and it is done.
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746590_26.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
It also includes one-click installation into Codex MCP or the Codex.app plugin, and the plugin was packaged too. It is easy to enable with one click, without copying JSON into the corresponding config. These are all part of smoothness.

In later iterations, we directly used our own open-computer-use for dogfooding. The result was very smooth and effective. Functionally, it is not much different from the official one anymore.

Finally came the traditional craft: screen recording and editing. I asked AI for audio websites, casually grabbed a piece of music, and at this point the open-source project could be released.

But the story did not end there. After functionality was satisfied, we still could not let go of that mouse. I went to X and saw what Ari from Software.inc posted:

They implemented this with three people. I downloaded the video, threw it to Codex for frame extraction and analysis, and started a separate project called StandaloneCursorLab. A few hours later, we had an initial version that was passable:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746591_27.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
This version had already been tuned. I also asked Codex to find some related papers and open-source projects for reference and borrowing. The most critical pieces inside were curve drawing and selection, plus controlling cursor movement speed.

Putting this version directly online would actually have been okay, but it still did not capture the lively feeling of the original. I then asked Grok to dig for information based on that tweet, to see whether any open-source solutions could be found.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746596_28.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746598_29.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
Overall, we could only infer some keywords from their tweets and other comments. Among them:
> calculates natural and aesthetic motion paths
was what I wanted most, but the ones calculated were not very ideal. Then I opened another independent session and began reverse engineering, because all the algorithms I wanted were inside the binary. Then I saw these scenes:
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746600_30.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746601_31.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746601_32.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-21-the-urge-to-solve/1776746602_33.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
I cannot imagine how long it would take one person to reverse-analyze these things. AI can autonomously complete it, then implement and verify.

{% include video.liquid path="https://www.youtube.com/embed/KRUq5GUHv1Q" class="img-fluid rounded z-depth-1" %}

At this point, the art was complete.

# Epilogue

A small journey, and also a fantastical adventure.

Imagination plus action is a very powerful combined ability. While imagining poetry and distant places, you can also hold the steering wheel steadily and step hard on the throttle.
