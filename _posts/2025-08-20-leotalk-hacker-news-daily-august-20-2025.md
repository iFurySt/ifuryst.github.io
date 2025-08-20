---
layout: post
title: "LeoTalk · Hacker News Daily · 2025.08.20"
date: 2025-08-20T08:00:00+08:00
tags: HNDailyReport
categories: HNDailyReport
giscus_comments: true
tabs: true
pretty_table: true
toc:
  sidebar: left
---

## 🔥 今日重点（Top Picks）

- **CodeRabbit漏洞：从PR到100万个Repo的RCE**：披露了一个严重漏洞，允许通过简单PR获取CodeRabbit的RCE权限并访问100万个GitHub仓库。[Kudelski Security](https://research.kudelskisecurity.com/2025/08/19/how-we-exploited-coderabbit-from-a-simple-pr-to-rce-and-write-access-on-1m-repositories/)
- **XZ Utils后门仍在Docker镜像中潜伏**：Binarly 研究人员发现，尽管已曝光，但许多Docker镜像中仍存在XZ Utils后门风险。[Binarly](https://www.binarly.io/blog/persistent-risk-xz-utils-backdoor-still-lurking-in-docker-images)
- **Uplift（YC S25）发布：为服务不足语言提供语音模型**：一个新项目旨在为小语种开发语音模型，弥补AI在语言多样性上的不足。[Hacker News](https://news.ycombinator.com/item?id=44950661)
- **英国放弃要求苹果提供加密后门**：此前英国曾要求苹果为其加密服务提供后门，现已撤回这一需求。[The Verge](https://www.theverge.com/news/761240/uk-apple-us-encryption-back-door-demands-dropped)

## 📦 AI & 开发工具

- **D2 图形工具现支持ASCII渲染**：文本生成图工具D2现在能够渲染ASCII格式的图表。[d2lang.com](https://d2lang.com/blog/ascii/)
- **Positron：新的数据科学IDE**：Posit推出了一款专为数据科学设计的新集成开发环境。[Posit Blog](https://posit.co/blog/positron-product-announcement-aug-2025/)
- **Dnsmasq缓存中毒漏洞**：Dnsmasq被曝存在一个关键的缓存中毒漏洞，影响其DNS解析服务。[dnsmasq-discuss邮件列表](https://lists.thekelleys.org.uk/pipermail/dnsmasq-discuss/2025q3/018288.html)
- **PyPI防止域名复活攻击**：Python包索引PyPI采取措施，以阻止潜在的域名复活攻击来劫持包。[PyPI Blog](https://blog.pypi.org/posts/2025-08-18-preventing-domain-resurrections/)
- **Perfect Freehand：绘制完美压感手绘线**：一个用于绘制完美压感手绘线的库或工具。[perfectfreehand.com](https://www.perfectfreehand.com/)

## 🧠 思维激荡（Mind Food）

- **特德·姜（Ted Chiang）：秘密的第三件事**：对著名科幻作家特德·姜作品的评论和思考。[linch.substack.com](https://linch.substack.com/p/ted-chiang-review)

## 🌐 科技与社会趋势

- **Google正在扼杀开放网络**：一篇观点文章，讨论Google对开放网络的潜在负面影响和控制。[wok.oblomov.eu](https://wok.oblomov.eu/tecnologia/google-killing-open-web/)
- **厂商将单点登录视为奢侈功能**：对将SSO作为额外收费功能的SaaS厂商的批判。[sso.tax](https://sso.tax/)
- **德国法院推翻“广告拦截非盗版”裁决**：德国最高法院推翻了此前“广告拦截不算盗版”的裁决，可能影响广告拦截器的合法性。[TorrentFreak](https://torrentfreak.com/ad-blocking-is-not-piracy-decision-overturned-by-top-german-court-250819/)
- **BBC目睹定居者袭击巴勒斯坦农场**：BBC记者在约旦河西岸亲身目睹以色列定居者袭击巴勒斯坦农场的事件。[BBC](https://www.bbc.com/news/articles/cewy88jle0eo)
- **Notion 发布离线模式**：用户现在可以在没有网络连接的情况下使用Notion，大幅提升便利性。[Notion Help](https://www.notion.com/help/guides/working-offline-in-notion-everything-you-need-to-know)

## 📱 新奇项目 / Show HN

- **OpenMower：开源割草机器人**：一个基于树莓派和GPS的开源智能割草机项目。[GitHub](https://github.com/ClemensElflein/OpenMower)
- **素数网格**：一个展示素数分布的交互式网格可视化工具。[susam.net](https://susam.net/primegrid.html)
- **自定义天文望远镜支架**：使用谐波传动和ESP32自制的高精度天文望远镜支架项目。[svendewaerhert.com](https://www.svendewaerhert.com/blog/telescope-mount/)
- **Zen Browser：一个值得all-in的浏览器**：一篇推荐Zen Browser的文章，分享其优势和使用体验。[werd.io](https://werd.io/why-im-all-in-on-zen-browser/)

## 🔬 科学与健康

- **克罗地亚自由潜水员憋气29分钟**：一位克罗地亚自由潜水员创造了惊人的29分钟憋气纪录。[Divernet](https://divernet.com/scuba-news/freediving/how-croatian-freediver-held-breath-for-29-minutes/)

## 🎯 快速浏览

- **如何建造一座中世纪城堡**：一篇介绍中世纪城堡建造过程和技术的文章。[Archaeology.org](https://archaeology.org/issues/september-october-2025/features/how-to-build-a-medieval-castle/)

## 🧰 Dev Tricks

- **从HTML规范中移除XSLT提及**：一项GitHub Pull Request，提议从HTML规范中删除XSLT的相关内容。[GitHub](https://github.com/whatwg/html/pull/11563)
- **没有futex，一切都将徒劳**：一篇深入探讨Linux内核futex机制的文章，解释其在并发编程中的重要性。[h4x0r.org](https://h4x0r.org/futex/)
- **Emacs作为视频剪辑工具**：分享如何使用Emacs进行视频剪辑的技巧和工作流。[xenodium.com](https://xenodium.com/emacs-as-your-video-trimming-tool)
