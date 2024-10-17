---
layout: post
title: "Resolving Option-Key Hotkey Issues in macOS Sequoia(15.0.1)"
date: 2024-10-17T22:00:27+08:00
tags: MacOS
categories: Tricks
giscus_comments: true
tabs: true
toc:
  sidebar: left
---

# Background

The MacOS Sequoia(15.0.1) will let the `Option+*` or `Option+Shift+*` no longer work. I believe a lot of guys like me use this to custom hotkeys or shortcuts.

Apple's official answer is that [this was an intentional change](https://developer.apple.com/forums/thread/763878?answerId=804374022#804374022) for security purposes. We can see the discussion on [Reddit](https://www.reddit.com/r/macapps/comments/1fjpiiw/psa_macos_15_breaks_optionkey_hotkeys/). I don’t want to judge it here, just to provide a solution(or maybe a band-aid solution for someone or some situation.) to mitigate the issue.

# Solution: Hammerspoon and retrigger hotkey

In the beginning, Thanks for [danrnx](https://www.reddit.com/r/macapps/comments/1fjpiiw/comment/lolslnm/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button)’s reply, which enlightened me.

My solution is using the [Hammerspoon](https://www.hammerspoon.org/), which is an alternative to the Keyboard Maestro to some extent.

## Installation

Here is a step-by-step tutorial:

1. Install the Hammerspoon from release or brew. You can reference it [here](https://github.com/Hammerspoon/hammerspoon?tab=readme-ov-file#how-do-i-install-it).
2. Write the lua(a programming language) for `~/.hammerspoon/init.lua`. You can reference the official guidance [here](https://www.hammerspoon.org/go/). I’ll give some examples below.

## Configuration

Remember to Reload Config after you change the `~/.hammerspoon/init.lua` .

### Demo 1: Open or gain focus on an App

It works well if you just need to define a hotkey to open or focus on an app.

```lua
-- Define the hotkey for Option+C to gain an app's focus.
hs.hotkey.bind({"alt"}, "C", function()
  local currentApp = hs.application.frontmostApplication()

  if currentApp:name() == "Google Chrome" then
    -- Don't alert if already gained the focus.
    return
  else
    hs.alert.show("Chrome")
    hs.application.launchOrFocus("Google Chrome")
  end
end)
```

The following is an improved and more practical version of the above:

```lua
function getBundleID(appName)
  local app = hs.application.find(appName)

  if app then
    return app:bundleID()
  else
    -- If the application is not running, get it through the application path
    local appPath = hs.application.pathForBundleID(appName)
    if appPath then
      return hs.application.infoForBundlePath(appPath).CFBundleIdentifier
    else
      hs.alert.show("Application not found: " .. appName)
      return nil
    end
  end
end
-- A generic function to bind hotkeys and handle application launches or focus
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

      -- Create a canvas to display the icon
      local iconCanvas = hs.canvas.new{ x = 0, y = 0, h = 100, w = 100 }:appendElements({
        type = "image",
        image = appIcon,
        imageAlignment = "center",
        imageScaling = "scaleToFit"
      })

      -- Get the screen center position to display the canvas
      local screenFrame = hs.screen.mainScreen():frame()
      iconCanvas:frame({
        x = screenFrame.w / 2 - 50,
        y = screenFrame.h / 2 - 50,
        h = 100,
        w = 100
      })

      -- Show the icon and automatically delete it after 1 second
      iconCanvas:show()
      hs.timer.doAfter(1, function() iconCanvas:delete() end)

      -- Launch or focus the application
      hs.application.launchOrFocus(appName)
    end
  end)
end

-- Use the generic function to set hotkeys for different applications
bindAppHotkey({"alt"}, "C", "Google Chrome")
bindAppHotkey({"alt"}, "S", "Sublime Text")
bindAppHotkey({"alt"}, "space", "iTerm")
```

I’d like to show the app icon rather than the app name :)

### Demo 2: Retrigger

Sometimes we'd like to use functions such as screenshots, OCR, or translation. They’re different from opening an app. So we can use a hotkey to trigger another hotkey.

```lua
hs.hotkey.bind({"alt"}, "A", function()
  hs.eventtap.keyStroke({"alt", "cmd"}, "A")
end)
```

I define the screenshot hotkey as `Option+Command+A`, and then bind the `Option+A` in Hammerspoon. Now, I can take a screenshot by `Option+A` .

# References

- https://www.reddit.com/r/macapps/comments/1fjpiiw/psa_macos_15_breaks_optionkey_hotkeys/
- https://developer.apple.com/forums/thread/763878?answerId=804374022#804374022
- https://www.hammerspoon.org/