---
layout: post
title: "MCP自定义传输协议"
date: 2025-04-01T23:59:59+08:00
tags: AI
categories: AI
giscus_comments: true
tabs: true
pretty_table: true
---

去年出的MCP，最近开始火起来，大体可以理解是Anthropic制定的一个Function Call的统一开放协议，各方都可以根据这个协议去实现MCP Server，根据协议实现的MCP Client可以任意去调用对应的MCP Server。这个目的旨在解决各个厂商之间实现的细节差异导致无法复用成果的问题。

## 规范

https://spec.modelcontextprotocol.io/specification/2025-03-26/

> [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) is an open protocol that enables seamless integration between LLM applications and external data sources and tools. Whether you’re building an AI-powered IDE, enhancing a chat interface, or creating custom AI workflows, MCP provides a standardized way to connect LLMs with the context they need.

看下这段官方的介绍，本质上MCP就是连接LLMs应用和外部数据工具等，从虚拟世界到现实世界都是可以集成进来的。

## 技术细节

[https://modelcontextprotocol.io/docs/concepts/architecture](https://modelcontextprotocol.io/docs/concepts/architecture)

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-04-01-mcp-custom-transport-protocol/mcp1.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

先看架构图，其实我们只需要关注2个东西，Client和Server即可

### 通信协议

目前有2种：

1. STDIO: 客户端会直接通过配置里的命令拉起服务端，然后后续通过STDIO输入输出去交互，重Client
2. HTTP with SSE: 客户端通过HTTP与服务端进行交互

### STDIO

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-04-01-mcp-custom-transport-protocol/mcp2.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

这个很好理解，就是MCP Client会通过配置去拉起对应的MCP Server，然后拿到STDIN, STDOUT, STDERR，后续通过STDIN传递命令，另外两个获取结果和错误信息，通过这样的方式进行调用

### HTTP + SSE（Deprecated）

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-04-01-mcp-custom-transport-protocol/mcp3.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

通过HTTP结合SSE进行通信，大体流程如下图所示

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-04-01-mcp-custom-transport-protocol/mcp4.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-04-01-mcp-custom-transport-protocol/mcp5.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

如图所示，这几个步骤就共同组成了Client通过HTTP调用Server的过程，首先会通过/sse接口建立一个SSE连接，也就是Client会一直等待Server异步返回信息（单方面接受），此时客户端怎么和服务端交互呢？通过HTTP请求，也就是下面4个POST依次请求。每次请求的响应都会通过前面的SSE接口响应，这样是解耦了，并且让服务端可以异步处理和通知。期间是通过sessionId来认会话的

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-04-01-mcp-custom-transport-protocol/mcp6.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-04-01-mcp-custom-transport-protocol/mcp7.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-04-01-mcp-custom-transport-protocol/mcp8.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-04-01-mcp-custom-transport-protocol/mcp9.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

### Streamable HTTP

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-04-01-mcp-custom-transport-protocol/mcp10.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

03-26的版本已经用这个取代原来的HTTP+SSE的方案了，往通用无状态、可选支持流的HTTP方向走了，更加通用化，原来Client和Server需要建立长连，对双方都是负担

流程上其实差不多，只不过第一次不是请求/sse建立长连接进行持续监听，而是通过/mcp去初始化会话，得到sessionId即可，后续同样是通过/message去做工具调用，调用过程中是可以提升成SSE去持续等待服务端返回结果的

### 自定义传输协议

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-04-01-mcp-custom-transport-protocol/mcp11.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

适合做一些内部的传输协议，比如目前主要有这么几个场景：

1. 客户端内部函数调用/IPC调用
2. 不通应用（同设备不同设备）之间非官方定义（HTTP）的通信方式，如TCP/UDP/RPC等

下面是一个应用内部的函数调用的粗略代码示意，大致是：

1. 开始会话，确认sessionId，这个通常维护在被调用方比较好
2. 通过对应的函数句柄持续调用和获取结果

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2025-04-01-mcp-custom-transport-protocol/mcp12.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>

这边其实更多是在Client做In-house的定制，MCP我觉得也是比较重Client的，这边其实就能识别内部协议，里面有些功能可以直接空跑，比如start可以只new一个session不做任何事情，通过send和onmessage配合着就能完成函数调用了

## 总结

值得一提的是，MCP还在不断发展中，刚好我写这篇的那天（03/26），官方又修订了一版出来，就是增加Streamable HTTP这版，我觉得势必会有一些Breaking Changes，包括一些诸如MCP应用市场或者说注册和发现机制，我觉得如果要进入到生产环境的各个环节，MCP还有一些需要推进的。企业级别中，很多东西不可能全部落在客户端，并且很多服务也不见得能保障成MCP Server，所以有个MCP网关统一在服务端做代理和调度是有意义的。
