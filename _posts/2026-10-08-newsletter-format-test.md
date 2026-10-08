---
layout: post
title: "【临时测试】邮箱订阅格式检查"
date: 2026-10-08T08:00:00+08:00
lang: zh
categories: test
description: "用于验证博客邮件投递与排版的临时测试，验证后删除。"
giscus_comments: false
---

> 这是一篇由 AI 生成的临时技术测试样本，不是作者的正式文章。用于检查邮件渲染，验证后会从博客删除。

## 中文、English 与强调

普通段落：你好，世界！Hello, newsletter 👋。这一段检查中文标点、English、数字 123，以及 emoji 的显示。

这是 **粗体**、_斜体_、~~删除线~~ 和 `行内代码`。链接应可以点击：[博客首页](/)、[RSS](/feed.xml)。

### 引用与换行

> 第一行引用：文字应该有清晰的左侧边线。
>
> 第二段引用：包含 **强调** 和 [原站链接](https://www.ifuryst.com/)。

这一行后有显式换行。  
这里是下一行。

## 列表

- 无序列表第一项
- 无序列表第二项，包含 **粗体**
  - 嵌套列表子项

1. 输入邮箱并选择语言
2. 收到确认邮件后确认
3. 收到新文章的邮件

## 代码块

```javascript
const greeting = "你好，newsletter 👋";
const formats = ["paragraph", "list", "table", "image"];
console.log(greeting, formats.join(" / "));
// HTML 特殊字符应显示为文本：<div> & "quoted"
```

```text
这一行用来测试较长的代码行：abcdefghijklmnopqrstuvwxyz-0123456789-abcdefghijklmnopqrstuvwxyz-0123456789-abcdefghijklmnopqrstuvwxyz
```

## 表格

| 格式           | 预期表现             | 状态   |
| -------------- | -------------------- | ------ |
| 中文与 English | 文字完整可读         | 待检查 |
| 代码           | 等宽字体、浅色背景   | 待检查 |
| 图片与链接     | 图片加载、链接可点击 | 待检查 |

## 图片与说明

{% include figure.liquid path="assets/img/prof_pic.jpg" alt="博客头像，用于邮件图片加载测试" caption="图片说明：验证相对路径转换为博客的绝对地址，以及邮件中的图片宽度。" %}

---

## 脚注与结尾

这句话带有一条脚注[^format]。

[^format]: 这是脚注内容，用于检查邮件中的脚注文本与回链。

邮件底部应该包含原文链接和退订链接。**本测试结束后，这篇文章会删除，已收到的测试邮件会保留。**
