---
layout: post
title: "Git多项目配置管理"
date: 2024-11-11T23:08:27+08:00
tags: Git
categories: DevOps
giscus_comments: true
tabs: true
toc:
  sidebar: left
pretty_table: true
---

平时会处理很多项目，这期间就会遇到Git相关的配置管理问题，以前都是手动管理，会遇到遗漏的情况，现在处理的项目太多了，开源社区也会参与一些项目的贡献，再手动管理很麻烦，看了一下Git是支持根据路劲来走配置的

## Git配置来源

总体而言，Git读取配置主要有这么几个来源（优先级从低到高）：

1. 系统级（system）配置：`/etc/gitconfig`
2. 用户级（global）配置：`~/.gitconfig`
3. 仓库级（local）配置：项目下的`.git/config`

## 配置命令

通常情况下我们会比较多使用2和3，也就是用户级别的全局配置和单仓库级别的配置，也就是对应了以下的命令

```bash
# 全局配置
git config --global --list
# 配置用户名
git config --global user.name 'fake-name'
# 配置邮箱
git config --global user.email 'fake@email.com'
# 配置GPG密钥ID
git config --global user.signingkey ABC123PGPKEYID

# 仓库级配置
git config --list
# 配置用户名
git config user.name 'fake-name'
# 配置邮箱
git config user.email 'fake@email.com'
# 配置GPG密钥ID
git config user.signingkey ABC123PGPKEYID
```

## 统一配置

上面的命令我们可以临时应对某些仓库临时或者单独设置，但是对于全局来说，我们不希望每次我们拉取或者起新的仓库的时候要重复配置，这会很烦人，并且重点是很多时候会忘记，因此一劳永逸的方法是根据分级配置，在全局做好配置，我个人的习惯是会根据目录来划分不同的组织项目，互不干扰

比如此时我们有两组不同的目录里会包含各种项目：

1. `/path/to/github/` 包含了在开源社区的一些项目
2. `/path/to/fake-org/` 包含了在某个组织的项目

此时在`~/.gitconfig`里可以这样配置

```bash
[includeIf "gitdir:/path/to/github/"]
    path = /path/to/.gitconfig.github

[includeIf "gitdir:/path/to/fake-org/"]
    path = /path/to/.gitconfig.fake-org
```

这样我们就可以针对这两个目录下的项目分别走两份不同的git配置

比如`.gitconfig.github`的配置

```bash
[user]
    name = "leo"
    email = "my@email.com"
    signingkey = "ABC123"
```

而`.gitconfig.fake-org`的配置

```bash
[user]
    name = "fake-name"
    email = "fake@email.com"
    signingkey = "ABC456"
```

这样就可以一劳永逸的解决多项目不同Git配置问题

## 参考

- [https://git-scm.com/docs/git-config#Documentation/git-config.txt---global](https://git-scm.com/docs/git-config#Documentation/git-config.txt---global)
