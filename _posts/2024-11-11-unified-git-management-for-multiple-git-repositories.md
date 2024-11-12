---
layout: post
title: "Unified Git Management for Multiple Git Repositories"
date: 2024-11-11T23:08:27+08:00
tags: Git
categories: DevOps
giscus_comments: true
tabs: true
toc:
  sidebar: left
pretty_table: true
---

I usually deal with many projects, during this time I will encounter Git-related configuration management issues. In the past, I manually managed them, and sometimes I missed them.
Now I have too many projects to handle, including the open-source projects. It is very troublesome to manage them manually. I looked at Git and found that it supports configuration based on the path.

## Git Configuration Source

In general, Git reads configuration from these sources (from low to high priority):

1. System-level (system) configuration: `/etc/gitconfig`
2. User-level (global) configuration: `~/.gitconfig`
3. Repository-level (local) configuration: `.git/config` in the project

## Configuration Commands

In general, we will use 2 and 3 more, that is, user-level global configuration and single repository-level configuration, which correspond to the following commands

```bash
# Global configuration
git config --global --list
# Configure username
git config --global user.name 'fake-name'
# Configure email
git config --global user.email 'fake@email.com'
# Configure GPG key ID
git config --global user.signingkey ABC123PGPKEYID

# Repository-level configuration
git config --list
# Configure username
git config user.name 'fake-name'
# Configure email
git config user.email 'fake@email.com'
# Configure GPG key ID
git config user.signingkey ABC123PGPKEYID
```

## Unified Configuration

The above commands can be used to temporarily deal with temporary or separate settings for some repositories, but for the global level, we do not want to repeat the configuration every time we pull or start a new repository, which is very annoying, and the key point is that we often forget. Therefore, a one-time method is to configure according to the hierarchical configuration, and make the configuration in the global level, my personal habit is to divide different organizational projects according to the directory, and do not interfere with each other

For example, we have two different directories that contain various projects:

1. `/path/to/github/` contains some projects in the open-source community
2. `/path/to/fake-org/` contains projects in an organization

At this time, we can configure it in `~/.gitconfig` like this

```bash
[includeIf "gitdir:/path/to/github/"]
    path = /path/to/.gitconfig.github

[includeIf "gitdir:/path/to/fake-org/"]
    path = /path/to/.gitconfig.fake-org
```

In this way, we can use two different git configurations for projects in these two directories

For example, the configuration of `.gitconfig.github` is

```bash
[user]
    name = "leo"
    email = "my@email.com"
    signingkey = "ABC123"
```

And the configuration of `.gitconfig.fake-org` is

```bash
[user]
    name = "fake-name"
    email = "fake@email.com"
    signingkey = "ABC456"
```

In this way, we can solve the problem of different Git configurations for multiple projects once and for all

## References

- [https://git-scm.com/docs/git-config#Documentation/git-config.txt---global](https://git-scm.com/docs/git-config#Documentation/git-config.txt---global)
