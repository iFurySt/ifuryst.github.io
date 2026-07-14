---
layout: post
title: "One Trend the GPT-5.6 Launch Made Me Realize"
date: 2026-07-13T08:00:00+08:00
lang: en
translation_key: one-trend-the-gpt-5-6-launch-made-me-realize
tags:
  - AI
  - Product
categories: AI
giscus_comments: true
tabs: true
pretty_table: true
toc:
  sidebar: left
---

> **Note:** This article was translated for me by AI. I wrote the original in Chinese. I never use AI to write my articles, because that would cost me my own expression; my freedom to express myself is always the most valuable part of my work. So if you can read Chinese, I recommend reading the Chinese version, where you will get the most original and unfiltered version. That said, technological progress exists to give us more convenience, so I will continue using AI to translate my writing into multiple languages, allowing valuable content to reach more people.

[https://www.youtube.com/watch?v=Wq45rvPGNHs](https://www.youtube.com/watch?v=Wq45rvPGNHs)

[https://www.youtube.com/watch?v=GphgJjaKKhw](https://www.youtube.com/watch?v=GphgJjaKKhw)

At OpenAI's launch event on Thursday, it released GPT-5.6, the long-rumored SuperApp—which brings Codex and ChatGPT together under ChatGPT—and ChatGPT Work. OAI is still OAI. But none of those were what caught my attention. I noticed another, very important trend!

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844704_35.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844705_36.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844705_37.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844706_38.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

In the demos, input had shifted completely from text to voice. I believe this may be one of the biggest changes we have seen this year. Where did it begin? It is a trend driven by the popularity of Typeless, and it has nearly transformed how many companies and individuals now think about and practice input.

The technology behind [Typeless](https://www.typeless.com/) is not new. [Wispr Flow](https://wisprflow.ai/) existed before it. But through a simple, fluid product experience and strong marketing, Typeless pushed the idea beyond Silicon Valley circles. It is now causing companies everywhere to rethink voice input.

Against this backdrop, I have also heard a lot of feedback from friends about their everyday experiences:

- Friend A uses it heavily in daily life and feels that combining voice input with Vibe Coding is an exceptionally smooth and efficient way to work.

- Friend B's CEO returned from a trip to Silicon Valley, paid for a Typeless subscription for everyone in the company, and made its use mandatory, with usage tracked on a regular basis. It feels a little ruthless, but for a startup, it is one way to force everyone to Push themselves into accepting something new.

I have used it myself for a while, and it genuinely can improve our ability to input information by a huge margin. Wispr Flow makes a similar claim on its onboarding page: typing on a keyboard is dozens of times less efficient than voice input. Most people would scoff when they first see that, but the page immediately gives you an interactive test: if you do not believe it, try it yourself. I did, and the result really was faster than text input—not once or twice as fast, but dozens of times faster. It is quantifiable.

As I believed at first, building something like this seems very simple. But after making one, I still found myself marveling at how even such a seemingly simple, single-purpose product can crush you under countless details when you try to polish it into a seamless experience. It also made me think of the countless grimaces hidden behind the saying that “it is hard to build a good product at a big company.”

# HeyYo

Next, I want to talk about the story behind building [HeyYo](https://hey-yo.app/).

It began with analysis and learning. Before this, I only had a basic understanding of speech recognition. I knew that products like these relied on STT, or Speech-to-Text, and that was about it.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844706_39.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

This is the barest possible form. If we wrap it one layer further, it looks like this:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844706_40.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

That is enough for a first version. The work involved is basically client-side and server-side development, and at this point we have a v1.

The first thing we face here is language processing. Based on that, I did a brief analysis of the relevant knowledge in modern speech processing. Audio processing follows this flow:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844706_41.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

That is why we often see parameters such as `16kHz 16bit mono`. They mean:

- The sample rate is 16 kHz, meaning the sound is sampled 16,000 times per second.

- The bit depth is 16-bit, meaning a 16-bit integer is used for storage.

- Mono is one channel and Stereo is two channels. Most models are trained on mono audio.

*Why is 16 kHz generally used in this scenario? According to the Nyquist-Shannon Sampling Theorem, the sample rate must be at least twice the highest frequency. A 16 kHz sample rate can therefore cover frequencies up to 8 kHz, and most of the useful information in human speech—vowels, most consonants, formants, and so on—is concentrated below 8 kHz. So it is enough.*

_The same reasoning applies to 16-bit depth. Using the quantization noise formula, 16-bit audio has a theoretical signal-to-noise ratio of 98 dB. Normal human speech is around 60–70 dB, while shouting is roughly 80–90 dB, so 98 dB fully covers everyday speech scenarios._

Two important things to focus on here are the **encoding format** and the **file format, or container**:

| Encoding Format | File Format | File Size | Notes                                      |
| --------------- | ----------- | --------- | ------------------------------------------ |
| PCM             | WAV         | Large     | Raw sampled data; no decoding required     |
| Opus            | Ogg         | Small     | Lossy compression; decoding required (CPU) |

Why does this matter? Because it directly affects network transmission and storage costs. Look at this:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844707_42.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844707_43.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844707_44.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

Here is a table for comparison:

| Audio Duration | Sample Rate | Encoding/File Format | File Size |
| -------------- | ----------- | -------------------- | --------- |
| 4s       | 48kHz  | PCM/WAV           | 416KB    |
| 9min5s   | 48kHz  | PCM/WAV           | 52.3MB   |
| 4s       | 16kHz  | PCM/WAV           | 141KB    |
| 9min5s   | 16kHz  | PCM/WAV           | 17.4MB   |
| 4s       | 16kHz  | Opus/Ogg          | 10KB     |
| 9min5s   | 16kHz  | Opus/Ogg          | 1.1MB    |

The difference is obvious. Opus/Ogg brings enormous benefits: much less data to transmit, which improves latency, and a dramatic reduction in storage costs. The human ear cannot hear the difference at all, and decoding overhead is negligible. This is also the mainstream approach today.

That settles the audio-related issues. Now we need to look at recognition models. There are many options. The earliest obvious choice is OpenAI's well-known [whisper-large-v3-turbo](https://huggingface.co/openai/whisper-large-v3-turbo). People still use it today. Although it is already several years old, its foundation remains solid; its weaknesses are poor long-tail performance and unstable latency.

Another option is to use today's multimodal large language models. Many multimodal models support mixed image, audio, and text input and produce text, which fits this scenario well. So I compared possible STT models using three Cases I recorded myself:

- English

- Chinese

- Mixed Chinese and English

I ran a simple benchmark, with each model running each Case five times. This summary gives us a feel for the results:

| Provider/Model                      | Avg Latency | Median Latency | Avg Score |
| ----------------------------------- | ----------- | -------------- | --------- |
| Gemini / 2.5 Flash                  | 3.11s   | 2.86s    | 0.829   |
| Soniox / stt-rt-v4                  | 19.09s  | 17.99s   | 0.974   |
| Deepgram / nova-3                   | 18.16s  | 17.52s   | 0.553   |
| Cloudflare / Whisper large v3 turbo | 3.15s   | 2.44s    | 0.888   |
| SiliconFlow / SenseVoiceSmall       | 0.76s   | 0.66s    | 0.558   |

This is not a completely rigorous test; it only provides a basic sense of the landscape. There is still room for tuning, including adjustments to the Prompt and Reasoning Effort for multimodal large models, which I will discuss later. Here are a few rows from the raw data:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844707_45.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

The speed and recognition quality are immediately visible. Deepgram and Soniox still have plenty of users, but I can say with confidence that they are not suitable for this scenario. They lose so completely that there is nothing more to say.

From this first encounter, the direction is at least relatively clear: our candidates are the models with the shortest latency. (_FYI, these are only examples. There are also some particularly strong SOTA models whose benchmark results I have not included here, and their performance varies. I am not listing the full results for now. Later, I may publish a complete leaderboard of speech-related data._)

Can we use it at this point? Yes, but we can still go further. If we choose something like Whisper or SenseVoice, for example, instability is an obvious problem: both output quality and latency are inconsistent.

A better option is therefore to choose a large model. But a **large** model increases latency, especially now that the entire industry ships models with built-in thinking. Thinking is not particularly useful for STT—or rather, its benefit is far smaller than the speed sacrificed for it. So regardless of which multimodal large model we use, we eventually end up disabling thinking or minimizing Reasoning Effort.

This marks the end of the first stage of exploration and implementation. At this point, we can basically build a usable product. But as we push further, we discover that the architecture may need another adjustment: splitting one stage into two, which is probably the route taken by many mature products. The architecture—or pipeline—then evolves into this:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844709_46.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

Everything is a double-edged sword. The benefits of two stages are:

1. Multiple recognition paths can run in parallel. During the Refine stage, they can supplement and cross-check one another, avoiding the weaknesses of any single model.

2. The feature set can expand further, from text recognition into translation, search, and more. This is difficult to achieve with a single stage.

The obvious corresponding problem is increased latency. Here is a comparison from a few simple benchmarks I ran:

| Metric         | 2 Stages | 1 Stage |
| -------------- | -------- | ------- |
| Median Latency | 2608ms   | 1537ms  |

Again, this is not a rigorous test, but it reflects the overall situation. An extra Roundtrip naturally adds another leg of latency; it is a tradeoff. After this architectural adjustment, the overall product experience became relatively comfortable, but this was still only a Baseline version. Along the way, several things that helped improve speed left a strong impression on me:

- Disable or minimize thinking. As mentioned earlier, this matters greatly in a scenario where every second counts.

- Use WebSocket by default, with HTTP as the Fallback. This allows audio to be transmitted while it is still being recorded, eliminating most transmission latency. The server can also be optimized to stream data progressively to the model over WebSocket.

- Transcode on the device. I also tried sending PCM to the cloud, but transcoding became a bottleneck. The usual approach is to encode Opus on the client and upload it as a stream of chunks.

- Tune the System Prompt. This also makes a difference, as does prompt length. The requirements are fundamentally different from something like a Coding Agent!

Next, we need to build supporting mechanisms. The important ones are:

1. Environmental context collection

2. Dictionaries: public/domain dictionaries + personal dictionaries

Environmental context collection means gathering relevant context from wherever the input field appears. For example:

- The current App: the expected style differs between Notion and WeChat, so this information can be used for customization.

- Surrounding text, whether any text is selected, and similar information: selected text is usually replaced by the result. Nearby text before and after the cursor can also help us produce a better output.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844709_47.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

These are collectively called environmental context. This is also why software of this kind usually requires Accessibility permissions. With this information, the experience can be optimized for each App and improved dramatically.

Next are dictionaries. Without one, proper nouns, names, place names, and similar terms cannot be output accurately. I will not expand on public or domain dictionaries; every team has its own tricks. What matters is the personal dictionary, a technology that quietly improves everything behind the scenes. The key flow is:

1. After recognition produces text, the user notices an error and corrects it manually.

2. Over a certain period, the corresponding edits and contextual information are collected and reported.

3. An offline Pipeline extracts terms and feeds them back into the personal dictionary.

4. The next time the user says that term during voice input, it can be matched automatically.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-07-13-one-trend-the-gpt-5-6-launch-made-me-realize/1783844709_48.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

This is a classic example of quietly improving things behind the scenes: the dictionary is continuously refined and expanded as the user works, seamlessly improving the experience over time.

At this point, we can basically achieve a good product experience. Everything else comes down to detail: whether the waveform looks pleasant, hotkey handling and reliable interception, UI/UX polish, and so on.

Pushing further to mobile leads us to the need for a keyboard. Without an input method, the experience on a phone is not nearly as smooth. I will not expand on that part for now; I will discuss it separately another time.

# Closing Thoughts

This article described the birth of a product from a technical perspective. The telling sounds simple, but the actual process was full of exploration, experimentation, use, feedback, and correction. No good product is fully planned in advance. Every good product is achieved through constant Dogfooding and repeated refinement.

Now that AI empowers us, many problems are no longer problems—whether in coding, design, learning and research, or even benchmarking and evaluation. In a fast-moving era, we should do the opposite of what speed seems to demand: settle down and build things that can compound over the long term.
