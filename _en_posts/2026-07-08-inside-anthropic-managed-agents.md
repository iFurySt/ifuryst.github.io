---
layout: post
title: "A Glimpse Inside Anthropic Managed Agents"
date: 2026-07-08T08:00:00+08:00
lang: en
translation_key: inside-anthropic-managed-agents
tags: AI
categories: AI
giscus_comments: true
tabs: true
pretty_table: true
toc:
  sidebar: left
---

> **Note:** This article was translated for me by AI. I wrote the original in Chinese. I never use AI to write my articles, because that would cost me my own expression; my freedom to express myself is always the most valuable part of my work. So if you can read Chinese, I recommend reading the Chinese version, where you will get the most original and unfiltered version. That said, technological progress exists to give us more convenience, so I will continue using AI to translate my writing into multiple languages, allowing valuable content to reach more people.

Anthropic's Managed Agents have been out for a few months now, so this is a good time to analyze them. Starting from the technology, I want to look at Anthropic's future positioning. Personally, I think this is a direction every AI-related company should watch closely—and think deeply about.

# Just try it yourself!

The best way to learn something is always to taste it yourself: use it, try it, and dig into it. That gives you far more depth than asking AI to do deep research for you!

(As an aside, I have to say that many people who could not write documents before have become even worse at it after using AI. But seeing AI turn a few sentences into a full article in a few—or a dozen—minutes must give them quite a rush of self-importance, right? Then they gather everyone else and read through the AI-written document line by line. The irony is hilarious. Maybe it would be better to hand an AI-generated document to someone else's AI to summarize and extract. Or, put another way, everyone else has AI too, and nobody wants to read Document Slop. I happened to see something Wang Junyu wrote in a magazine today. Screenshot below:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517110_1.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

）

That was a tangent. Back to the point: for something like this, once you have read the official docs, you can usually just go and try it yourself.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517111_2.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

These are basically the core concepts:

| **Concept**           | **Purpose**                                                                                                      | Notes                                                                                                                                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Agents**            | The core definition: the Agent itself, including `name`, `desc`, `sys prompt`, `tools`, `mcp_servers`, `skills`, and `metadata` | A very standard Agent definition, built on top of Claude Code                                                                                                                            |
| **Sessions**          | The actual unit of scheduled execution and the item used for `billing`                                           | A Session can be triggered by sending a message through the API/SDK; it only runs after a message is actively sent                                                                                       |
| **Deployments**       | A periodic scheduler responsible for triggering Sessions on a schedule                                           | Essentially a scheduled job. A Deployment runs on a schedule, with each run becoming a Session                                                                                                          |
| **Environments**      | The sandbox runtime environment, roughly the Sandbox definition; preinstalled third-party libraries, software, and egress policies can be configured | Covers both predefined cloud scenarios and self-hosted scenarios, serving both cloud and enterprise needs                                                                                |
| **Credential Vaults** | Management and injection of auth credentials/API keys                                                            | Injects environment variables into the sandbox, or automatically attaches/replaces the appropriate Secret for HTTP or MCP calls at the egress boundary                                                  |
| **Memory Stores**     | Agent memory storage                                                                                              | Think of it as an LLM wiki. A memory store is mounted to a directory such as `/mnt/mem/test1`; underneath, it and the filestore use rclone + object storage to support read-only or read-write access       |
| **Files**             | File inputs attached when a Session starts                                                                       | The Files section under Build lets you associate specific files with the Session's Agent at startup. They are mounted read-only at a path such as `/mnt/session/uploads`                                  |
| **Skills**            | Skills management                                                                                                 | Both built-in and uploaded skills live here, mounted read-only into the sandbox at `/mnt/skills`                                                                                                         |

## Agents

Here is a standard definition for creating an Agent. Both YAML and JSON are supported.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517111_3.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

You can also create one through chat in Quickstart—a very AI-native approach.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517112_4.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517113_5.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

Here is the result:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517114_6.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

You can edit it or start a Session from this Agent.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517114_7.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

There are three kinds of uploads: GitHub Repo, File, and Memory Store.

## Sessions

Starting a session opens a chat interface. At this point, the Session is Idle and not being billed.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517114_8.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

Here is one after an actual run:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517115_9.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517115_10.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

You can see that it is split into Transcript and Debug. The former can be understood as Events, although Anthropic now calls them Transcripts throughout Claude Code. Debug contains more detail and feels closer to a Trace. The interface does not do much beyond showing events and letting you continue the chat.

## **Environments**

You can create two kinds of environments, or sandboxes: Cloud is the default, and the other is Self-hosted.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517116_11.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

For the cloud environment, you can preconfigure egress policies, preinstalled software, third-party libraries, and so on.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517116_12.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517116_13.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

Self-hosted lets you run a worker on your own machine.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517117_14.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

```python
ant beta:worker poll \
  --environment-id "env_01AzQWp3SXQEATgdCFUNwteR" \
  --workdir "/path/to/workspace"
```

This is how it runs. The code for `ant` is [here](https://github.com/anthropics/anthropic-cli); it is Anthropic's official CLI. In practice, it is merely a tool executor. You can basically think of it as receiving events from above, executing them locally—running a command, for example—and reporting the result. It is still relatively rudimentary, and custom tools are difficult as well: essentially Skill + Shell. This is not Anthropic's real enterprise play, though; I will get to the key part later.

The software and dependencies preinstalled in a Cloud sandbox vary by template. The environment used for direct chat on claude.ai differs from the Managed Agents environment, for example. I am recording the differences between them here.

### Chat

Anthropic's sandbox comes with these runtimes preinstalled:

| Language       | Version |
| -------------- | ------- |
| Python         | 3.12.3  |
| Node.js        | 22.22.2 |
| npm            | 10.9.7  |
| Java (OpenJDK) | 21.0.10 |

Additional packages can be installed through apt, cargo, gem, go, npm, and pip.

Build tools:

| Tool      | Version |
| --------- | ------ |
| gcc / g++ | 13.3.0 |
| GNU Make  | 4.3    |
| git       | 2.43.0 |
| curl      | 8.5.0  |
| wget      | 1.21.4 |

Preinstalled Python packages:

| Category         | Package                       | Version |
| ----------- | ----------------------------- | ------- |
| Numerical Computing | numpy                  | 2.4.4   |
| Data Processing     | pandas                 | 3.0.2   |
| Scientific Computing | scipy                 | 1.17.1  |
| Machine Learning    | scikit-learn           | 1.8.0   |
| Visualization       | matplotlib             | 3.10.8  |
| Visualization       | seaborn                | 0.13.2  |
| Image Processing    | Pillow                 | 12.1.1  |
| Image Processing    | opencv                 | 4.13.0  |
| Image Processing    | ImageMagick (Wand)     | 0.7.0   |
| Video/Audio         | imageio                | 2.37.3  |
| Video/Audio         | imageio-ffmpeg         | 0.6.0   |
| Video/Audio         | sounddevice            | 0.5.5   |
| AI/ML       | mediapipe                     | 0.10.33 |
| AI/ML       | onnxruntime                   | 1.24.4  |
| AI/ML       | magika                        | 0.6.3   |
| PDF         | pypdf                         | 5.9.0   |
| PDF         | pdfplumber                    | 0.11.9  |
| PDF         | camelot-py                    | 1.0.9   |
| PDF         | pikepdf                       | 10.5.1  |
| PDF         | img2pdf                       | 0.6.3   |
| PDF         | reportlab                     | 4.4.10  |
| Office Documents | python-docx                | 1.2.0   |
| Office Documents | python-pptx                | 1.0.2   |
| Office Documents | openpyxl                   | 3.1.5   |
| Office Documents | xlsxwriter                 | 3.2.9   |
| Web         | requests                      | 2.33.1  |
| Web         | Flask                         | 3.1.3   |
| Web         | BeautifulSoup4                | 4.14.3  |
| Web         | playwright                    | 1.56.0  |
| Mathematics     | sympy                       | 1.14.0  |
| Mathematics     | mpmath                      | 1.3.0   |
| Mathematics     | networkx                    | 3.6.1   |
| OCR             | pytesseract (calls tesseract) | 5.3.4 |
| Document Conversion | markdownify             | 1.2.2   |
| Document Conversion | pandoc (system install) | 3.1.3   |

Global Node.js packages

| Package                        | Version |
| ------------------------------ | ------- |
| @mermaid-js/mermaid-cli        | 11.12.0 |
| docx                           | 9.6.1   |
| graphviz                       | 0.0.9   |
| markdown-pdf                   | 11.0.0  |
| markdown-toc                   | 1.2.0   |
| markdownlint-cli               | 0.48.0  |
| markdownlint-cli2              | 0.22.0  |
| marked                         | 18.0.2  |
| pdf-lib                        | 1.17.1  |
| pdfjs-dist                     | 5.6.205 |
| playwright                     | 1.56.0  |
| pptxgenjs                      | 4.0.1   |
| react                          | 19.2.5  |
| react-dom                      | 19.2.5  |
| react-icons                    | 5.6.0   |
| remark-cli                     | 12.0.1  |
| remark-preset-lint-recommended | 7.0.1   |
| sharp                          | 0.34.5  |
| ts-node                        | 10.9.2  |
| tsx                            | 4.21.0  |
| typescript                     | 6.0.3   |

System tools

| Tool                | Version  | Purpose                    |
| ------------------- | -------- | ------------------ |
| ffmpeg              | 6.1.1    | Audio/video processing     |
| ImageMagick         | 6.9.12   | Image processing           |
| tesseract           | 5.3.4    | OCR                |
| pandoc              | 3.1.3    | Document format conversion |
| LibreOffice         | 24.2.7.2 | Office document processing |
| unoserver           | 3.6      | LibreOffice as a service   |
| Playwright Chromium | 1194     | Headless browser            |

### Managed Agents

Languages and runtimes:

| Runtime   | Observed value  | Notes                                                           |
| --------- | --------------- | --------------------------------------------------------------- |
| Python    | 3.11.15         | `/usr/local/bin/python3`, `/usr/bin/python3`, `/usr/bin/python` |
| pip       | 24.0            | Python 3.11                                                     |
| Node.js   | v20.20.2        | `/usr/local/bin/node`                                           |
| npm / npx | 10.8.2          | `/usr/local/bin/npm`, `/usr/local/bin/npx`                      |
| Java      | OpenJDK 21.0.10 | `java` and `javac` present                                      |
| Ruby      | 3.3.6           | `gem` 3.5.22                                                    |
| PHP       | 8.4.20          | Composer 2.8.12                                                 |

Commands and tools

| Tool                          | Observed value                                              |
| ----------------------------- | ----------------------------------------------------------- |
| gcc / g++                     | 13.3.0                                                      |
| GNU Make                      | 4.3                                                         |
| cmake                         | 3.28.3                                                      |
| git                           | 2.43.0                                                      |
| curl                          | 8.5.0                                                       |
| wget                          | 1.21.4                                                      |
| jq                            | 1.7                                                         |
| ripgrep                       | 14.1.0                                                      |
| tmux                          | 3.4 (3.4-1ubuntu0.1)                                        |
| psql                          | 16.13 client                                                |
| redis-cli                     | 7.0.15                                                      |
| ffmpeg                        | 6.1.1 system package                                        |
| ImageMagick                   | 6.9.12-98 (`convert`, `identify`)                           |
| tesseract                     | 5.3.4                                                       |
| pandoc                        | 3.1.3                                                       |
| LibreOffice / soffice         | 24.2.7.2                                                    |
| unoserver                     | 3.6                                                         |
| Playwright Python package/CLI | 1.56.0                                                      |
| Playwright Chromium           | build 1194, Chromium 141.0.7390.37                          |
| Playwright headless shell     | build 1194, Chromium 141.0.7390.37                          |
| Google Chrome path            | `/opt/google/chrome/chrome`, reports Chromium 141.0.7390.37 |
| Playwright ffmpeg             | build 1011, ffmpeg `n7.0.1-playwright-build-1011`           |

Python libraries

| Package        | Observed value                                                       |
| -------------- | -------------------------------------------------------------------- |
| numpy          | 2.4.4                                                                |
| pandas         | 3.0.2                                                                |
| scipy          | 1.17.1                                                               |
| scikit-learn   | 1.8.0                                                                |
| matplotlib     | 3.10.8                                                               |
| seaborn        | 0.13.2                                                               |
| Pillow         | 12.2.0                                                               |
| opencv-python  | 4.13.0.92                                                            |
| Wand           | 0.7.0                                                                |
| imageio        | 2.37.3                                                               |
| imageio-ffmpeg | 0.6.0                                                                |
| sounddevice    | 0.5.5 installed, import failed because PortAudio library was missing |
| mediapipe      | 0.10.32                                                              |
| onnxruntime    | 1.24.4                                                               |
| magika         | 0.6.3                                                                |
| pypdf          | 3.17.4                                                               |
| pdfplumber     | 0.11.9                                                               |
| camelot-py     | 1.0.9                                                                |
| pikepdf        | 10.5.1                                                               |
| img2pdf        | 0.6.3                                                                |
| reportlab      | 4.4.10                                                               |
| python-docx    | 1.2.0                                                                |
| python-pptx    | 1.0.2                                                                |
| openpyxl       | 3.1.5                                                                |
| XlsxWriter     | 3.2.9                                                                |
| requests       | 2.33.1                                                               |
| Flask          | 3.1.3                                                                |
| beautifulsoup4 | 4.14.3                                                               |
| playwright     | 1.56.0                                                               |
| sympy          | 1.14.0                                                               |
| mpmath         | 1.3.0                                                                |
| networkx       | 3.6.1                                                                |
| pytesseract    | 0.3.13                                                               |
| markdownify    | 1.2.2                                                                |

Global Node.js packages

| Package  | Observed value |
| -------- | -------------- |
| corepack | 0.34.6         |
| npm      | 10.8.2         |

## **Deployments**

Scheduled jobs—nothing magical. You define the associated resources and mounts.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517117_15.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

When it executes, you get Runs, with each Run mapping directly to a Session.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517117_16.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517118_17.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

## **Credential Vaults**

Credentials can be injected in three ways:

1. Configure OAuth for MCP. You log in through the web interface during setup, grant authorization directly to Anthropic, and the credential is automatically injected into subsequent MCP requests.

2. Configure a Bearer Token for MCP, which is automatically injected into subsequent MCP requests.

3. Inject a credential directly into a request—for example, adding an API key to the HTTP Header of an outbound request.

With all three methods, the sandbox cannot see the secret itself. This differs from injecting an environment variable directly into the sandbox, where its value can be retrieved from the environment.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517118_18.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517118_19.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517118_20.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

Here, for example, I asked it to send a request to my `api.ifuryst.com`.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517119_21.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

It executed:

```python
curl -s --http1.1 -X POST https://api.ifuryst.com
  -H "Authorization: Bearer $TEST"
  -H "Content-Type: application/json"
  -d '{"status":"completed","email_success":true,"email_id":"629d4d14-399e-43dd-b77a-bb2caa913dc6"}'
```

What my server actually received was `123`. In other words, an egress gateway service replaced `$TEST` at the network boundary.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517119_22.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

## **Memory Stores**

This is straightforward: it is an LLM wiki, or a filesystem-based approach to memory management like OpenClaw and Hermes.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517119_23.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517119_24.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517120_25.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517120_26.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

## **Files**

There is not much to say here.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517120_27.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

## **Skills**

There is not much to say here.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517120_28.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517121_29.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517121_30.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

# RE

After trying it for myself, I think Managed Agents can be compared to AWS in the cloud era. At first, we had to buy physical machines and put them in a server room or IDC. Later, we only needed to provision an ECS instance from AWS, GCP, Alibaba Cloud, or another provider, along with services such as databases and S3. We stopped caring about the physical hardware underneath; we only cared about the configuration we provisioned and paid for it by time.

Managed Agents are the AWS of the Agent era. We do not need to care what the underlying Harness is written in, how to implement sandbox security and isolation properly, or keep a machine running around the clock solely for an Agent. We just pay and use it. The charges include:

- LLMs: model API calls, or token fees. Straightforward.

- Tools such as `web_search`: $10 per 1,000 requests.

- Session time: $0.80 per session-hour, billed only while running. This essentially bundles and abstracts away the underlying hardware, network, and other costs, making the pricing easier for users to understand.

Does the picture feel clearer now? This is PaaS for the Agent era—or what some call Harness as a Service.

In the past, we benefited from AWS handling the hardware and networking for us. Now, we benefit from Anthropic building the Harness for us.

With all that said, it is time to begin the analysis. I wanted to use the sandbox as an entry point for exploring the possibilities of the overall architecture. Naturally, the first step was to collect everything inside the MicroVM. I tried a number of approaches along the way. I did not record every idea and action as they occurred, so I will briefly recount what I remember:

- My first instinct in situations like this is usually to establish a tunnel, SSH in, and rummage around. This time was no different. With the `ant` CLI, it was even easier: I gave Codex a public machine and had it do the grunt work.

- I discovered that the sandbox's outbound network was restricted by policy. Ports such as 80 and 443 worked, but other ports could not get out, so I tunneled SSH over HTTP with Chisel.

- After SSHing in and playing around for a while, the connection dropped. It looked like the environment stopped after becoming idle. So I had Codex work both sides itself: pick up a task, then go in and collect everything.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517121_31.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

- In the end, I identified several key binaries and packaged them all for analysis.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517122_32.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

- This involved reverse engineering the binaries. I was able to confirm the roles of several of them:

- **process_api**: A Rust service running as PID 1 and acting as the root process. It is effectively the process control plane inside the sandbox, responsible for init, system-level mounts, networking, the WebSocket API, cgroups/OOM, and other internal process management. It also receives external exec commands such as `CreateProcess`, along with related stdin/stdout/stderr and signals.

- **environment-manager**: The runner at the Managed Agents product layer. It handles initialization work including Git, snapshots, Claude Code configuration, MCP configuration, leases, observability, and more. Its behavior differs depending on whether Claude Code runs inside the sandbox.

- **rclone-filestore**: Mounts data actually used by the Agent, including uploaded files, memory, and skills. It uses FUSE, with a backend that talks to Anthropic's HTTP API (`api.anthropic.com`) rather than directly to object storage.

At this point, I had a basic picture of the whole system. I also happened to find some related articles:

- [https://johnsonlee.io/2026/03/28/when-claude-starts-to-awaken.en/?lang=en](https://johnsonlee.io/2026/03/28/when-claude-starts-to-awaken.en/?lang=en)

- [https://aprilnea.me/zh/blog/reverse-engineering-claude-code-antspace](https://aprilnea.me/zh/blog/reverse-engineering-claude-code-antspace)

- [https://github.com/AprilNEA/reverse-engineering-claude-code-antspace](https://github.com/AprilNEA/reverse-engineering-claude-code-antspace)

Johnson Lee's article shows that in March, the sandbox was still running inside gVisor—and Claude Code itself broke out of it! This also demonstrates the differences in isolation. Even gVisor's virtualized kernel does not provide sufficient isolation, let alone Docker/runc based on namespaces and cgroups. It also explains why so many systems now use Firecracker.

Today, it no longer uses gVisor. It launches MicroVMs with Firecracker, which has become a mainstream industry choice and is also used by E2B. This approach has prerequisites, the most important being **KVM**. That generally means going down to bare metal to get KVM easily, although nested KVM can work too. For example, I successfully used an `n2-standard-4` VM on GCloud with `--min-cpu-platform="Intel Cascade Lake" --enable-nested-virtualization`.

AprilNEA's article uncovered the March Firecracker version. The key difference is that it contains an unstripped `environment-runner`, making it easy to reverse engineer back into source code. I am sure other “inspired” products at home and abroad have been more than happy to analyze it and build from the blueprint 🤡.

Here is the structure listed in that article:

```python
internal/
├── api/                  # API client (session routing, task polling, retries)
├── auth/                 # GitHub App Token provider
├── claude/               # Claude Code installation, upgrades, execution
├── config/               # Session modes (new/resume/resume-cached/setup-only)
├── envtype/
│   ├── anthropic/        # Anthropic-hosted environment
│   └── byoc/             # Bring Your Own Cloud
├── gitproxy/             # Git credential proxy server
├── input/                # Standard input parsing + secret handling
├── manager/              # Session manager, MCP configuration, skill extraction
├── mcp/
│   └── servers/
│       ├── codesign/     # Code-signing MCP server
│       └── supabase/     # Supabase integration MCP server
├── orchestrator/         # Polling loop, Hooks, identity discovery
├── podmonitor/           # Kubernetes lease management
├── process/              # Process execution + script runner
├── sandbox/              # Sandbox runtime configuration
├── session/              # Activity recorder
├── sources/              # Git clone + source classification
├── tunnel/               # WebSocket tunnel + action handling
│   └── actions/
│       ├── deploy/       # ← The key part is here
│       ├── snapshot/     # File snapshots
│       └── status/       # Status reporting
└── util/                 # Git utilities, lock files, retries, streaming logs
```

There is quite a lot of information here:

- Anthropic's internal code appears to live in a private GitHub repository at [github.com/anthropics/anthropic](http://github.com/anthropics/anthropic). It is a monorepo, mostly written in Go.

- One hilarious detail: `**github.com/mark3labs/mcp-go v0.37.0**`\*\* \*\*. Instead of the official MCP Go SDK, they use a third-party one.

- AntSpace, its PaaS competitor to Vercel, is also interesting. It is unclear whether it will be opened to the public later, which gives us something to ponder. Here is a passage from the article:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517122_33.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

- BYOC clearly looks like something built for enterprise customers.

You can also see that Claude Code can run inside the sandbox at `/opt/claude-code`, but in production it runs outside the sandbox by default. This is the optimal architecture for enterprise use at scale, because the sandbox is what consumes resources. Keeping Claude Code outside has several benefits:

- LLM calls happen outside the sandbox, eliminating the risk of leakage.

- The Agent runtime stays outside the sandbox, reducing security issues.

- Large-scale scenarios can be optimized more deliberately.

- It could even move away from the standalone Claude Code version and replace it with a specialized cloud version.

# DIY

I covered a lot in the RE section, but the ideas are still fairly scattered because much of the information was lost during exploration and I did not record every detail immediately. I have shared related things from time to time before. Once again, what I want to share here is a hacker mindset. Now that we have AI, we can use it as leverage to move far more than before; often, our thinking is the real bottleneck. These days, a tiny bit of guidance is often enough for AI to produce a great deal. This is also one of the abilities that lets you break through when everyone has access to the same AI.

With this information, the natural next step was to build one. AI drives the cost of building something toward zero. I learned a lot during the analysis, and I could continue learning through the act of making it. That is the delight of learning by doing.

I made a one-to-one replica of the Anthropic Managed Agents web interface, extracting its menus.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517122_34.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

The API server acts as the control plane and writes data to the database. Scheduling is handled through the orchestrator, which asks `sandboxd` to provision sandboxes with Firecracker or Docker. `process-api` corresponds to `process_api`; `env-runner` accepts tasks inside the sandbox; and `fs-bridge` handles the relevant synchronization work.

One design difference is that this is intended to support Codex, Claude Code, OpenCode, Pi, and custom-built Agents. In practice, each Agent can determine whether it runs inside or outside the sandbox. Something highly configurable like Pi can run outside, while something less open like Codex can run inside the container.

I have had a lot going on recently, so this project is still a work in progress. I will keep moving it forward and finish it. If you are interested, follow along for future updates. When the time comes, I will also write a more detailed article about building a Managed Agents-like foundation for enterprise scenarios: the pitfalls, the technologies involved, how the architecture should be planned, and all the related insights, ideas, and solutions.

# Closing Thoughts

This article should have been published last month, but I genuinely had too much going on and kept postponing it. Then I remembered a line I have believed in for the past year or two: “Done is more important than perfect.” So I decided I needed to finish this article. I believe the value of letting the people who need it see it matters far more than the perfection I imagine in my head. I did my best to bring it to a close instead of letting it rot in my notebook like so many of my Drafts.

Once again, this is an article about how I made something happen. As I said earlier, AI may make us dumber and lazier, but it can also let us stand on the shoulders of giants and do more of what was once difficult to achieve. What matters is how you think and what you **do**. Once your ideas are set free, the next step is to Push and execute; everything else comes down to external opportunities. Is love, career, or life really any different?
