---
layout: post
title: "Browser Use Explained"
date: 2026-05-09T08:00:00+08:00
lang: en
translation_key: open-browser-use
tags: AI
categories: AI
giscus_comments: true
tabs: true
pretty_table: true
toc:
  sidebar: left
---

# Origin

The starting point still comes from the [Open-Computer-Use](https://github.com/iFurySt/open-codex-computer-use) project we open-sourced earlier. The story behind it is in [**The Primitive Urge to Solve Problems**](https://www.ifuryst.com/blog/2026/the-urge-to-solve/).

This time, it started because OpenAI released Browser Use capabilities in Codex.app.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-09-open-browser-use/1778327226_1.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

After analyzing it, I gained a lot and filled in a few missing pieces that I had not actively looked into before. It was a substantial gain, and I think it is worth writing an article about. As usual, the writing focuses more on the process than the result. The methodology and the shift in thinking are what matter most.

# Exploration

The exploration process is still similar to what I analyzed in [**The Primitive Urge to Solve Problems**](https://www.ifuryst.com/blog/2026/the-urge-to-solve/). We first pulled the [Harness Template](https://github.com/iFurySt/harness-template). PS: now I use a more convenient tool, [`harness-cli`](https://github.com/iFurySt/harness-cli):

```shell
➜ harness-cli open-browser-use
Select template language:
  1. English
  2. Chinese
Choice [1]: 2
Using Chinese template from https://github.com/iFurySt/harness-template-cn.git
copy 53 file(s)
Initialized git repository
```

Then I began analyzing the official implementation. This lets the entire exploration process be preserved continuously, so it can be searched and traced back later when needed.

This time, the starting point was:

```shell
➜  cd ~/.codex/plugins/cache/openai-bundled/browser-use
➜  browser-use tree -I 'node_modules'
.
└── 0.1.0-alpha2
    ├── assets
    │   ├── browser.png
    │   └── composer-icon.png
    ├── docs
    │   └── capabilities
    │       ├── browser
    │       │   ├── viewport.md
    │       │   └── visibility.md
    │       └── tab
    ├── scripts
    │   └── browser-client.mjs
    └── skills
        └── browser
            ├── agents
            │   └── openai.yaml
            └── SKILL.md

11 directories, 7 files
```

You can see that the core is mainly a `skill` plus the `browser-client.mjs` client. So we can quickly start the analysis from here. Without further ado, here is the architecture diagram.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-09-open-browser-use/1778327227_2.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

Overall, IAB, or in-app browser, is a browser abstraction built by Codex.app itself. It uses `windowId` plus `sessionId` as the unique ID. In practice, it behaves as a single browser window for one app window and one session.

Before expanding on that, let us talk a little about browsers.

## Chrome

Looking from the bottom upward, we first have [Chromium](https://www.chromium.org/chromium-projects/), an open-source browser engine project. Chrome is the commercial browser built on top of it. Many browsers on the market today, including many AI browsers, are also built from it. In the rest of this article, I will treat them uniformly and refer to them as Chrome. Understanding Chrome well makes building Browser Use on top of it much easier, and it also makes the differences between current browser-operation methods much clearer.

First, here is a global architecture diagram:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-09-open-browser-use/1778327227_3.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

There are many details in it. If you are interested, you can skim through it. The main thing to focus on here is the large outer frame. With a rough mental model in place, let us walk through it.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-09-open-browser-use/1778327228_4.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

First, Chrome uses a multi-process architecture. Different types of work are carried by different processes. For example, when the browser opens a page, it involves processes like the following:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-09-open-browser-use/1778327229_5.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

We can see the corresponding processes in Chrome's built-in task manager.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-09-open-browser-use/1778327229_6.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

We can also directly count the current process situation from the command line.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-09-open-browser-use/1778327229_7.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

The benefit of doing this is isolation and security. For example, if one tab blows up and the corresponding process crashes, it will not affect other tabs.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-09-open-browser-use/1778327229_8.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

On the security side, Chrome uses processes to implement sandbox isolation. For example, the Renderer Process, which focuses on handling user input and page execution, has restricted access to system files. This helps improve security.

The two processes we care about most are the Browser Process and the Renderer Process. The Browser Process is the brain responsible for global process scheduling and managing all other processes. The Renderer Process is responsible for rendering. Usually, every tab or iframe is an independent process, which is the so-called [Site Isolation](https://developer.chrome.com/blog/inside-browser-part1#site-isolation). So the most important and most numerous processes in daily use are renderers. For example, if a tab has one main frame and two iframes, then there will be three Renderer Processes, though the actual behavior is affected by same-site rules.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-09-open-browser-use/1778327229_9.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

Beyond this, one thing we need to understand is Service Worker. Ordinary pages correspond to tabs, but Service Workers exist independently outside the page. Today's v3 browser extensions are built on top of the Service Worker mechanism. A simplified representation looks like this:

```shell
Browser Process
 ├── Renderer Process (web page)
 │     ├── DOM
 │     ├── JS
 │     └── page logic
 │
 └── Service Worker Process
       ├── fetch interception
       ├── cache
       ├── push
       ├── background sync
       └── extension background logic
```

We will focus on this later when talking about browser extensions.

At this point, we have a preliminary understanding of Chrome's overall mechanism. I do not plan to explain everything to the bottom. The amount of content is large, and it may not be valuable for most people. If you are interested, you can follow the links I list at the end and dig deeper on your own.

## Codex Browser Use

Back to the Browser Use capabilities in Codex App itself. They mainly consist of Browser Use, namely the IAB or in-app browser page, and Chrome, namely the browser extension. It is still this architecture diagram:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-09-open-browser-use/1778327227_2.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

Each has its own strengths and weaknesses. Codex calls them through the abstracted and encapsulated `browser-client.mjs`, which shields the caller from the differences. The distinction is controlled through different Skills.

One thing worth noting is that Codex has a built-in Node runtime. In actual use, it can orchestrate commands like this:

```shell
await tab.goto('https://github.com/iFurySt/open-codex-computer-use/issues');
await tab.playwright.waitForLoadState({ state: 'domcontentloaded', timeoutMs: 15000 });
const snap3 = await tab.playwright.domSnapshot();
const relevant3 = snap3.split('\n').filter(l => /Open|Closed|Issues|issue|No results|open-codex-computer-use|Pull requests|Starred/.test(l));
nodeRepl.write(relevant3.slice(0, 160).join('\n'));
```

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-09-open-browser-use/1778327230_11.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

This lets the caller enter a stateful context and keep operating continuously, without repeatedly fetching and locating things like tabs and elements.

Next, let us look at the two approaches separately.

### IAB(In-App Browser)

In Codex.app, this appears as the Browser Use plugin.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-09-open-browser-use/1778327230_12.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

It is the built-in webpage in the right sidebar.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-09-open-browser-use/1778327230_13.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

This approach exists because Codex.app itself is written with Electron, and Electron already has browser capabilities built in. Codex adds its own business-layer abstraction in the middle. A single Codex.app window plus session uniquely corresponds to one browser page, and that page maps to Electron's WebContents. The details are hidden from the upper layer.

One advantage of IAB is that it is relatively simple, and it feels smoother for users. They can preview the browser being operated directly inside the app.

But the downsides are also obvious:

- The current design can only open one page. Opening another page replaces the previous page.
- The built-in browser cannot install certain browser extensions, especially when some operations depend on specific extensions.
- It cannot seamlessly connect to the user's own browser.

### Chrome Extension

In Codex.app, this is placed under Google Chrome in Computer Use. I do not know why it is placed there.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-09-open-browser-use/1778327231_14.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-09-open-browser-use/1778327231_15.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

It is used together with the [Chrome extension](https://chromewebstore.google.com/detail/codex/hehggadaopoacecdllhhajmbjkdcmajg).

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-09-open-browser-use/1778327231_16.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

The browser-extension form is more general and more adaptable. Many Chromium-based browsers can use it, and it can simulate cursor operations inside the browser.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-09-open-browser-use/1778327232_17.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

Here I have to mention OpenAI's thoughtful design, or rather its product taste.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-09-open-browser-use/1778327232_18.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

Tasks are grouped by Group, which is a very clever touch. The tabs under a task are all collected inside that group. When the task finishes, the entire group can be closed directly, so it does not pollute the user's tabs.

During this period, those tabs are inactive. In other words, this browser extension has background operation capability, consistent with the Background capability in Computer Use. The product experience is extremely smooth.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-09-open-browser-use/1778327232_19.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

If you inspect the tabs during operation, you can also see mouse hover and movement similar to Computer Use, making it intuitive to see what is happening.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-09-open-browser-use/1778327232_20.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

After the task ends, besides closing the Group and its internal tabs, tabs may also be handed over to the general Codex group. These instructions are written in the Skill.

### CDP(Chrome DevTools Protocol)

This is the third approach. I will not expand on it in detail. In essence, it connects to Chrome through the CDP protocol. It is the most technical solution and requires Chrome to be started with Remote Debugging or CDP listening enabled. This is almost impossible for ordinary users, but developers encounter it more often.

Chrome now also officially provides an [MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp), along with the matching [chrome-devtool-cli](https://github.com/ChromeDevTools/chrome-devtools-mcp/tree/main/skills/chrome-devtools-cli). Tools like Playwright, Selenium, and Puppeteer are essentially based on CDP. It is also the most fundamental approach, including many cloud sandboxes that wrap Chrome and interact with it through CDP.

At this point, we have a global understanding of the browser-operation capabilities Codex has. Many technical details are not expanded further. If you are interested, you can ask AI to walk you through the parts you need.

# Open Browser Use

Why do we need an open-source alternative?

- Even Codex CLI cannot use the two Browser Use capabilities from Codex.app. We need a platform-neutral solution that all AI Agents can use easily and all AI applications can integrate easily.
- Technical implementation is not the same as product implementation. I will push this open-source project as much as possible from a product perspective. Several technical options were already mentioned in the CDP section, but their out-of-the-box capabilities for AI are too weak, or their natural positioning is simply not AI-oriented. Chrome MCP is slightly better, but it still has many pain points.

The implementation path of Open Browser Use is consistent with Codex.app's extension route. My intended positioning is to make it a superset: beyond satisfying all original capabilities, it should also provide extra abilities that empower upper-layer businesses out of the box.

[https://github.com/iFurySt/open-codex-browser-use](https://github.com/iFurySt/open-codex-browser-use)

At the moment, it exists as a browser extension. The extension-store version is still under review, so for now it can be installed directly through [zip/crx](https://github.com/iFurySt/open-codex-browser-use/releases).

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-09-open-browser-use/1778327233_21.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-05-09-open-browser-use/1778327233_22.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

For specific usage, see the GitHub repository. I will not repeat it here.

# Epilogue

Although OpenAI has lost many people, it still does not stop them from continuing to deliver impressive work. Perhaps the organization is strong enough, or perhaps the people still there are full of talent. Either way, they have been continuously delivering better products recently, which is good to see. Behind this, it also keeps inspiring my thinking about product power.

**Coding≠Engineering, Technology≠Product.**

AI brings us many things, but there are still many things it cannot bring us, at least for now. I still believe that sustained curiosity, the courage to try, and the execution power to act immediately are the primitive driving forces that support us in exploring the endless unknown.

# References

If you want to understand modern browsers, you can read these four Chrome posts. They are simple and easy to understand:

1. [Inside look at modern web browser (part 1)](https://developer.chrome.com/blog/inside-browser-part1)
2. [Inside look at modern web browser (part 2)](https://developer.chrome.com/blog/inside-browser-part2)
3. [Inside look at modern web browser (part 3)](https://developer.chrome.com/blog/inside-browser-part3)
4. [Inside look at modern web browser (part 4)](https://developer.chrome.com/blog/inside-browser-part4)
