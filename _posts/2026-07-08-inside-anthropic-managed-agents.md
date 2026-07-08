---
layout: post
title: "Anthropic Managed Agents管中窥豹"
date: 2026-07-08T08:00:00+08:00
tags: AI
categories: AI
giscus_comments: true
tabs: true
pretty_table: true
toc:
  sidebar: left
---

Anthropic的Managed Agents出来了几个月了，这波刚好分析一下，从技术触发，分析Anthropic在未来的布局，我个人是觉得很值得AI相关的公司留意这个方向的，很值得深思

# Just try it yourself!

学习一个东西最好的方式永远是亲自吃一下，自己使用试用一下，自己挖掘一下，远比叫AI给你deep research来得更加有深度！

（题外话，不得不说很多原来不会写文档的人，用了AI更加不会写，但是看到几句话几分钟十几分钟AI就能给出一篇满满的文章，那种膨胀的感觉应该很享受？然后拉其他人对着AI写的文档照念一通。非常讽刺了，笑死了。或许丢ai gen的文档给别人的ai去汇总提取阅读更好。或者说别人也有自己的AI，没人愿意看Document Slop。刚好今天看杂志看到王俊煜写的，截图如下：

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

扯远了，回到正题，一般这种看看官方文档后就可以直接自己去试试了

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517111_2.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

基本上就这几个核心的东西：

| **概念**              | **作用**                                                                                                | 备注                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agents**            | 核心定义，Agent定义本身。包含`name`、`desc`、`sys prompt`、`tools`、`mcp_servers`、`skills`、`metadata` | 很标准的一个Agent定义，底层坐落在Claude Code上的                                                                                               |
| **Sessions**          | 实际的调度运行的单元和`计费`项目                                                                        | Session通过API/SDK能发消息触发，需要主动发送才能触发一个Session运作                                                                            |
| **Deployments**       | 周期调度器，负责按时间触发 Session                                                                      | 可以理解就是定时任务，Deploy可以定时执行（落到一个一个Session）                                                                                |
| **Environments**      | 沙盒运行环境，~=Sandbox定义，可定义预装的三方库、软件、出网策略                                         | 预定的云场景+self host场景，兼顾云+B端                                                                                                         |
| **Credential Vaults** | auth/api key管理注入                                                                                    | 注入沙盒的环境变量，或者在Egress出网的时候针对HTTP或者MCP调用去自动attach/replace对应的Secret                                                  |
| **Memory Stores**     | Agent记忆存储                                                                                           | 理解为llm-wiki就好了。一个mem store会挂载到一个目录，比如/mnt/mem/test1，底层和filestore都是基于rclone+OSS支撑只读或者读写                     |
| **Files**             | Session启动时附带的文件输入                                                                             | 顶上Build下的Files，这里是可以在Session开始的时候关联具体的文件给到这个会话的Agent，也是挂载进去到对应路径的，比如`/mnt/session/uploads`，只读 |
| **Skills**            | Skills管理                                                                                              | 有预置的和自己上传的skil都在这里，也是只读挂载到沙盒`/mnt/skills`                                                                              |

## Agents

看下这个是一个标准的创建Agents的定义，YAML或JSON都可以

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517111_3.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

也可以Quickstart里通过chat去完成创建，很AI Native的方式。

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

看看生成后的：

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517114_6.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

可以编辑，也可以从这个Agent开始一个Session

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517114_7.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

上传的文件有三种：Github Repo，File，Memory Store三种。

## Sessions

开始会话后就是一个chat界面，此时Sesion是Idle的（不计费）

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517114_8.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

看一个实际跑之后的：

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

能看到分了Transcript和Debug，前者就可以理解是Events，但是现在Anthropic在Claude Code里都叫Transcript了。Debug里更加详细，看着更接近Trace的感觉了。这个界面没有太多功能，就是看事件，继续chat这种。

## **Environments**

可以创建2种环境（沙盒），默认Cloud云端的，另一种Self-hosted

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517116_11.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

云端的可以预先配置出网策略，预装的软件和三方库等

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

Self-hosted就是可以在自己的机器上跑worker

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

这种方式跑，ant的代码在[这里](https://github.com/anthropics/anthropic-cli)，就是官方的anthropic-cli，实际上这个只是一个tool的执行器而已，基本上可以理解上面下发events下来，本地执行（比如执行一个命令），结果回报而已，相对还是简陋了一些，更何况自定义工具还是比较困难了，基本就是skill+shell（这也不是Anthropic toB的手段，后续会说关键的）

Cloud沙盒里预置的软件和依赖包根据template不同会有差异的，比如claude.ai里直接chat的环境和Managed Agents的环境是有差异的，这里记录一下两侧的差异

### Chat

Anthropic的沙盒里预置了这些运行时：

| 语言           | 版本    |
| -------------- | ------- |
| Python         | 3.12.3  |
| Node.js        | 22.22.2 |
| npm            | 10.9.7  |
| Java (OpenJDK) | 21.0.10 |

可通过apt，cargo，gem，go，npm，pip去装

构建工具：

| 工具      | 版本   |
| --------- | ------ |
| gcc / g++ | 13.3.0 |
| GNU Make  | 4.3    |
| git       | 2.43.0 |
| curl      | 8.5.0  |
| wget      | 1.21.4 |

Python内置包：

| 类别        | 包                            | 版本    |
| ----------- | ----------------------------- | ------- |
| 数值计算    | numpy                         | 2.4.4   |
| 数据处理    | pandas                        | 3.0.2   |
| 科学计算    | scipy                         | 1.17.1  |
| 机器学习    | scikit-learn                  | 1.8.0   |
| 可视化      | matplotlib                    | 3.10.8  |
| 可视化      | seaborn                       | 0.13.2  |
| 图像处理    | Pillow                        | 12.1.1  |
| 图像处理    | opencv                        | 4.13.0  |
| 图像处理    | ImageMagick（Wand）           | 0.7.0   |
| 视频/音频   | imageio                       | 2.37.3  |
| 视频/音频   | imageio-ffmpeg                | 0.6.0   |
| 视频/音频   | sounddevice                   | 0.5.5   |
| AI/ML       | mediapipe                     | 0.10.33 |
| AI/ML       | onnxruntime                   | 1.24.4  |
| AI/ML       | magika                        | 0.6.3   |
| PDF         | pypdf                         | 5.9.0   |
| PDF         | pdfplumber                    | 0.11.9  |
| PDF         | camelot-py                    | 1.0.9   |
| PDF         | pikepdf                       | 10.5.1  |
| PDF         | img2pdf                       | 0.6.3   |
| PDF         | reportlab                     | 4.4.10  |
| Office 文档 | python-docx                   | 1.2.0   |
| Office 文档 | python-pptx                   | 1.0.2   |
| Office 文档 | openpyxl                      | 3.1.5   |
| Office 文档 | xlsxwriter                    | 3.2.9   |
| Web         | requests                      | 2.33.1  |
| Web         | Flask                         | 3.1.3   |
| Web         | BeautifulSoup4                | 4.14.3  |
| Web         | playwright                    | 1.56.0  |
| 数学        | sympy                         | 1.14.0  |
| 数学        | mpmath                        | 1.3.0   |
| 数学        | networkx                      | 3.6.1   |
| OCR         | pytesseract（调用 tesseract） | 5.3.4   |
| 文档转换    | markdownify                   | 1.2.2   |
| 文档转换    | pandoc（系统安装）            | 3.1.3   |

Node.js 全局包

| 包                             | 版本    |
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

系统工具

| 工具                | 版本     | 用途               |
| ------------------- | -------- | ------------------ |
| ffmpeg              | 6.1.1    | 音视频处理         |
| ImageMagick         | 6.9.12   | 图像处理           |
| tesseract           | 5.3.4    | OCR                |
| pandoc              | 3.1.3    | 文档格式转换       |
| LibreOffice         | 24.2.7.2 | Office 文档处理    |
| unoserver           | 3.6      | LibreOffice 服务化 |
| Playwright Chromium | 1194     | 无头浏览器         |

### Managed Agents

语言与形式：

| Runtime   | Observed value  | Notes                                                           |
| --------- | --------------- | --------------------------------------------------------------- |
| Python    | 3.11.15         | `/usr/local/bin/python3`, `/usr/bin/python3`, `/usr/bin/python` |
| pip       | 24.0            | Python 3.11                                                     |
| Node.js   | v20.20.2        | `/usr/local/bin/node`                                           |
| npm / npx | 10.8.2          | `/usr/local/bin/npm`, `/usr/local/bin/npx`                      |
| Java      | OpenJDK 21.0.10 | `java` and `javac` present                                      |
| Ruby      | 3.3.6           | `gem` 3.5.22                                                    |
| PHP       | 8.4.20          | Composer 2.8.12                                                 |

命令or工具

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

Python库

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

nodejs全局包

| Package  | Observed value |
| -------- | -------------- |
| corepack | 0.34.6         |
| npm      | 10.8.2         |

## **Deployments**

定时任务，没什么magic，定义一下关联和挂载的东西。

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517117_15.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

跑起来是Runs，每个Run直接对应于一个Session

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

三种方式注入：

1. 针对MCP做OAuth，配置的时候就会在web这边做好登陆，授权是直接给到Anthropic的，后续在请求MCP的时候自动注入

2. 针对MCP做Bearer Token的配置，后续MCP请求的时候自动注入

3. 针对请求直接注入，比如在对外的HTTP请求里注入api key到HTTP Header里

这三种方式在沙盒里都是无法感知到这些secret内容的，不像那种环境变量直接注入到沙盒的env里可以被获取到

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

比如这里我让其请求我的api.ifuryst.com

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517119_21.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

里面执行的是

```python
curl -s --http1.1 -X POST https://api.ifuryst.com
  -H "Authorization: Bearer $TEST"
  -H "Content-Type: application/json"
  -d '{"status":"completed","email_success":true,"email_id":"629d4d14-399e-43dd-b77a-bb2caa913dc6"}'
```

实际收到的是123，也就是$TEST在出口的时候有个出口网关服务做了这个替换动作

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

这个很简单，就是LLM Wiki，或者说类似OpenClaw，Hermes这种以文件系统存放记忆的方式来管理

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

这个没啥好说的

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

这个没啥好说的

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

实际自己体验了一波，这个Managed Agents这种东西，其实是可以类比成云时代的AWS的，就好像最早我们需要自己搞物理机器到机房/IDC，后来只需要到AWS，GCP，阿里云这些地方去开一个ECS，或者其他配套的如DB，S3等等，也就是不care底下到底是什么硬件机器了，只在乎开出什么配置，按时间付费。

那现在这个Managed Agents就是Agent时代的AWS，我们不需要关心底下是什么写的Harness，不需要关系沙盒的安全性隔离性需要怎么做才好，不需要有一台一直开着的机器只为了给你Agent跑，我们只需要付费就可以用了，顺带一起这边的付费项：

- LLMs，模型API调用，或者说Token费用，好理解

- web_search这种工具，$10可以请求1000次

- session时，$0.8/session时，running的时候才收费，这个基本上就是把底下各种硬件、网络等等费用都包进去抽象了一下，对于用户来说更好理解

这样是不是就有感觉了？这个就是Agent时代的PaaS了（或者有人说的Harness as a Service）

以前我们享受AWS给我们做好的各种硬件、网络，现在我们享受Anthropic给我们做好Harness

讲了这么多，接下去就开启一波分析操作，我们希望从沙盒这个切入口去分析整体的架构可能性。首先自然是收集整个MicroVM里有的东西，这期间我试了一些方式，有些自然而然的想法和动作我没记录下来，我就说一些记得的简要历程：

- 一般遇到这种我第一实际就是打个tunnel过去，ssh上去收刮一番，这次也是，因为有ant cli，更加方便，丢codex一台公网机器后就让它帮忙打黑工

- 期间发现沙盒出口网络被策略限制了，80/443之类的能通，但是其他端口出不去，就走了一波HTTP转SSH的操作（chisel）

- ssh上去后，玩了几下就断掉了，看着是idle后就会被停掉。然后就让codex自己去左右开工了，拉任务后上去收刮

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517121_31.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

- 最后确认了几个关键的二进制，都打包下来用于分析

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517122_32.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

- 这里面就涉及到对二进制的逆向分析，基本上能确认几个二进制的作用：

- **process_api**：PID=1，Rust写的一个充当根进程的服务，算是沙盒里进程的控制面，负责init、挂载（系统级的）、网络、websocket api、cgroup/oom等内部进程管控。同时也会扮演接收外部发来的exec命令（比如CreateProcess，还有相关的stdin/stdout/stderr, signal等）

- **environment-manager**：算是MA产品层的runner了，负责一些初始化工作，比如git、snapshot、claude code配置、MCP配置、lease、观测相关等等这些活，会根据claude code是否跑在沙盒里行为有差异

- **rclone-filestore**：负责挂载实际Agent会用到的数据，比如上传文件、记忆、skills等，通过FUSE挂载的，后端是到Anthropic的HTTP API（api.anthropic.com）的，不直接到对象存储

到这里基本上有个整体的认知了，刚好有搜到一些相关的文章：

- [https://johnsonlee.io/2026/03/28/when-claude-starts-to-awaken.en/?lang=en](https://johnsonlee.io/2026/03/28/when-claude-starts-to-awaken.en/?lang=en)

- [https://aprilnea.me/zh/blog/reverse-engineering-claude-code-antspace](https://aprilnea.me/zh/blog/reverse-engineering-claude-code-antspace)

- [https://github.com/AprilNEA/reverse-engineering-claude-code-antspace](https://github.com/AprilNEA/reverse-engineering-claude-code-antspace)

从Johnson Lee的文章可以i看出3月份的时候沙盒还是在gVisor里的，并且被claude code自己突破了！（这里也可以展示隔离性差异，gVisor这种虚拟的内核，隔离性依然不够，更别说基于namespace和cgroup的docker/runc了，也能反应为什么现在那么多采用firecracker的原因了）

到现在已经不再使用gVisor了，而是使用firecracker启动microVM，firecracker也是现在行业主流的方案了，E2B也是基于这个方案。但是这个方案有一些条件，最重要的就是**KVM**，这意味着基本上需要走到裸金属/裸机的层面才能轻松拿到KVM，当然有一些将KVM nest进去的也可以，比如我用gcloud拉了n2-standard-4机型的虚拟机是可以的（配套--min-cpu-platform="Intel Cascade Lake" --enable-nested-virtualization）

另外AprilNEA那篇文章则是挖到了3月份firecracker的版本，差异在于，里面有没有stripped的environment-runner版本，可以轻易的逆向出源代码，我相信国内外其他致敬的产品肯定毫不吝啬的分析拿这份去照着开发了🤡

看下那篇文章中列的

```python
internal/
├── api/                  # API 客户端（会话路由、任务轮询、重试）
├── auth/                 # GitHub App Token 提供者
├── claude/               # Claude Code 安装、升级、执行
├── config/               # 会话模式（new/resume/resume-cached/setup-only）
├── envtype/
│   ├── anthropic/        # Anthropic 托管环境
│   └── byoc/             # 自带云（Bring Your Own Cloud）
├── gitproxy/             # Git 凭证代理服务器
├── input/                # 标准输入解析 + 密钥处理
├── manager/              # 会话管理器、MCP 配置、技能提取
├── mcp/
│   └── servers/
│       ├── codesign/     # 代码签名 MCP 服务器
│       └── supabase/     # Supabase 集成 MCP 服务器
├── orchestrator/         # 轮询循环、Hook、身份发现
├── podmonitor/           # Kubernetes 租约管理
├── process/              # 进程执行 + 脚本运行器
├── sandbox/              # 沙箱运行时配置
├── session/              # 活动记录器
├── sources/              # Git 克隆 + 源码分类
├── tunnel/               # WebSocket 隧道 + 动作处理
│   └── actions/
│       ├── deploy/       # ← 重点在这里
│       ├── snapshot/     # 文件快照
│       └── status/       # 状态上报
└── util/                 # Git 工具、锁文件、重试、流式日志
```

信息量还不小：

- 可以看出Anthropic的内部代码在GitHub上[github.com/anthropics/anthropic](http://github.com/anthropics/anthropic)这个Private Repo里，是一个Monorepo，大部分Go写的

- 笑抽了一点是：`**github.com/mark3labs/mcp-go v0.37.0**`\*\* \*\* MCP Go SDK不是用官方的，而是用三方的

- 里面关于Vercel的PaaS竞品AntSpace还挺有意思的，不确定后续是否会对外开放，耐人寻味，引用下文章里的一段话

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517122_33.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

- byoc看着就是针对B端用户做的东西

另外其实可以发现，Claude Code可以运行在沙盒里`/opt/claude-code`，但是生产环境下默认是跑在了沙盒的外围，这也是企业场景下，规模化下的最优解，因为耗费资源的是沙盒，ClaudeCode外置也有几个好处：

- 让LLMs调用在沙盒外，杜绝泄漏风险

- Agent运行时在沙盒外，减少安全问题

- 可以进一步针对性做大规模场景下的优化

- 甚至可以切换成非Claude Code单体版本，用专门的云端版本取代

# DIY

RE里讲了不少，但是还是比较散点的想法，因为很多信息都丢失在探索的过程中了，没有第一时间一一记录下来。不过之前也三不五时的分享过一些相关的，这一次依然是想要分享一种hacker的思维，正是因为现在有了AI，我们可以借助AI能撬动更多的东西，很多时候思维才是瓶颈。现在很多时候只需要给AI一点点牵引，就可以得到很多东西，这也是如何在大家都拥有同样的AI之下杀出来的能力之一

有了这些信息，下一步就是顺其自然的Build一个了，AI让我们Build一个东西的成本无限低，分析的过程学到了很多，做的过程依然可以学到很多。这也是做中学的妙趣所在

直接1v1复刻Anthropic Managed Agents的Web，提取了那些菜单

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-08-inside-anthropic-managed-agents/1783517122_34.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

apiserver做控制面，会落数据到DB，实际上会通过orchestrator去调度，期间会通过sandboxd去拉沙盒（firecracker/docker），process-api对标了process_api，env-runner用来在沙盒里承接任务的，fs-bridge会负责同步相关的工作

这边有个不同的设计，就是预期是兼容codex/claude-code/opencode/pi/自研的Agent，因为实际上是可以根据不同的Agent来决定是运行在沙盒里还是沙盒外的，比如pi这种可以配置很多东西的可以放到外部跑，codex开放度不足的可以进到容器里跑

不过最近事情多，这个项目Working In Progress，后续会持续推进收尾掉，有兴趣的可以关注一下后续的进展，到时候我也会写一篇更加详细的文章来聊聊怎么在企业场景下建设一个类似Managed Agents这样的能力底座，里面会有什么坑，会用到什么技术，应该怎么规划架构等等这些见解、想法和解决方案

# 写在最后

这篇文章本来上个月就该发了，但是事情确实太多，一拖再拖，想想我这一两年来一直坚信的一句话”完成比完美更重要“，因此我觉得我应该让这篇文章完成，我相信让需要的人看到的价值远比我心中想要达到的那个完美更重要，因此就尽量收尾掉这篇文章，不希望像我的很多Drafts烂在笔记本里

依然是一篇讲述自己怎么整活的文章，跟前面说的一样，有了AI，可能变傻变懒，但也可以站在巨人的肩膀上去做更多以前很难轻易做到的事情，重要的在于自己是怎么想怎么**做**的，解放想法后，就是Push执行了，其他的就是外部机遇了，爱情、事业和人生，何尝不是如此？
