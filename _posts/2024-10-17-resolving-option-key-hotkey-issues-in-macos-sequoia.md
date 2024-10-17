---
layout: post
title: "MacOS Sequoia 15.0.1 Option热键绑定失效问题"
date: 2024-10-17T22:00:27+08:00
tags: MacOS
categories: tricks
giscus_comments: true
tabs: true
toc:
  sidebar: left
---

# 背景

问题是15.0.1禁用`Option+*`或者`Option+Shift+*`热键绑定，相关讨论看这里

https://www.reddit.com/r/macapps/comments/1fjpiiw/psa_macos_15_breaks_optionkey_hotkeys/

官方对此的说法是：[这是一个有意为之的改变](https://developer.apple.com/forums/thread/763878?answerId=804374022#804374022)

# 方案: Hammerspoon

相信很多人都会用`Option`来绑定自定义的热键，因为`Command`和`Control`键已经被大量场景占用了。我也是以前经常会使用`Option+*` 来快速切换应用的焦点，比如C代表Chrome，S代表Sublime Text，现在不能用了略难受，发现了一个方式可以实现，就是用`Hammerspoon` （Reddit里[danrnx](https://www.reddit.com/r/macapps/comments/1fjpiiw/comment/lolslnm/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button)的回复给了我灵感）

https://github.com/Hammerspoon/hammerspoon

## 安装

具体方式如下

1.  安装应用，Release里下载或者brew安装
2. 配置，写lua，保存到`~/.hammerspoon/init.lua`

可以参考官方的[指导](https://www.hammerspoon.org/go/)

## 示例

### 示例1: 不是焦点时获取应用焦点并打印文字

```bash
hs.hotkey.bind({"alt"}, "C", function()
  local currentApp = hs.application.frontmostApplication()

  if currentApp:name() == "Google Chrome" then
    -- 焦点已经在 Chrome，不显示 alert
    return
  else
    hs.alert.show("Chrome")
    hs.application.launchOrFocus("Google Chrome")
  end
end)
```

### 示例2: 不是焦点时获取应用焦点并打印图标

```bash
hs.hotkey.bind({"alt"}, "C", function()
  local currentApp = hs.application.frontmostApplication()

  if currentApp:name() == "Google Chrome" then
    -- 焦点已经在 Chrome，不显示 alert
    return
  else
    local chromeIcon = hs.image.imageFromAppBundle("com.google.Chrome")

    -- 创建一个 canvas 显示图标
    local iconCanvas = hs.canvas.new{ x = 0, y = 0, h = 100, w = 100 }:appendElements({
      type = "image",
      image = chromeIcon,
      imageAlignment = "center",
      imageScaling = "scaleToFit"
    })

    -- 获取屏幕中心位置，显示 canvas
    local screenFrame = hs.screen.mainScreen():frame()
    iconCanvas:frame({
      x = screenFrame.w / 2 - 50,
      y = screenFrame.h / 2 - 50,
      h = 100,
      w = 100
    })

    -- 显示图标，并在1秒后自动删除
    iconCanvas:show()
    hs.timer.doAfter(1, function() iconCanvas:delete() end)

    hs.application.launchOrFocus("Google Chrome")
  end
end)
```

bundle id可以通过命令查看(下面的示例里封装了自动获取bundle id)

```bash
osascript -e 'id of app "iTerm"'
osascript -e 'id of app "Google Chrome"'
```

### 示例3: 打开应用

跟2类似，封装了一下，可以复用

```lua
-- 1. Open Application --
function getBundleID(appName)
  local app = hs.application.find(appName)

  if app then
    return app:bundleID()
  else
    -- 如果应用未运行，通过应用路径获取
    local appPath = hs.application.pathForBundleID(appName)
    if appPath then
      return hs.application.infoForBundlePath(appPath).CFBundleIdentifier
    else
      hs.alert.show("Application not found: " .. appName)
      return nil
    end
  end
end
-- 通用函数，用于绑定热键并处理应用程序启动或聚焦
function bindAppHotkey(modifiers, key, appName)
  local bundleID = getBundleID(appName)

  if not bundleID then
    return
  end

  hs.hotkey.bind(modifiers, key, function()
    local currentApp = hs.application.frontmostApplication()

    if currentApp:bundleID() == bundleID then
      return
    else
      local appIcon = hs.image.imageFromAppBundle(bundleID)

      -- 创建一个 canvas 显示图标
      local iconCanvas = hs.canvas.new{ x = 0, y = 0, h = 100, w = 100 }:appendElements({
        type = "image",
        image = appIcon,
        imageAlignment = "center",
        imageScaling = "scaleToFit"
      })

      -- 获取屏幕中心位置，显示 canvas
      local screenFrame = hs.screen.mainScreen():frame()
      iconCanvas:frame({
        x = screenFrame.w / 2 - 50,
        y = screenFrame.h / 2 - 50,
        h = 100,
        w = 100
      })

      -- 显示图标，并在1秒后自动删除
      iconCanvas:show()
      hs.timer.doAfter(1, function() iconCanvas:delete() end)

      -- 启动或聚焦应用程序
      hs.application.launchOrFocus(appName)
    end
  end)
end

-- 使用通用函数为不同的应用程序设置热键
bindAppHotkey({"alt"}, "C", "Google Chrome")
bindAppHotkey({"alt"}, "S", "Sublime Text")
bindAppHotkey({"alt"}, "space", "iTerm")
```

### 示例4: 热键转移，再触发

抛开应用开启，某些情况下需要其他功能，比如截图，这个时候本身截图是在应用里设置的热键，这种情况就需要通过一下小技巧转移热键，等于代理了

```lua
-- 2. retrigger --
hs.hotkey.bind({"alt"}, "A", function()
  hs.eventtap.keyStroke({"alt", "cmd"}, "A")
end)
```

这里就是在按`Option+A`的时候再触发按`Option+Cmd+A`

# 参考

- https://www.reddit.com/r/macapps/comments/1fjpiiw/psa_macos_15_breaks_optionkey_hotkeys/
- https://developer.apple.com/forums/thread/763878?answerId=804374022#804374022
- https://www.hammerspoon.org/