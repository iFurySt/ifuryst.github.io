---
layout: post
title: "How We Are Speedrunning the AI Era"
date: 2026-04-02T08:00:00+08:00
lang: en
translation_key: speedrunning-the-ai-era
tags:
  - Thoughts
  - AI
  - Insights
categories: Thoughts
giscus_comments: true
tabs: true
pretty_table: true
toc:
  sidebar: left
---

# Before We Start

It has been a long time since I properly sat down and wrote something worth sharing. Recently we have been fighting continuously for more than three weeks, so it is also time to loosen the throttle a little and talk about what we are doing. From the perspectives of the individual, the team, and the organization, I want to talk about how we respond to and embrace change in an era where AI is running wild.

We are the **AgentSphere** team under Volcano Engine, mainly delivering SuperApp to the B-side market. My current view is that we can boldly benchmark against what OpenAI is pushing with Frontier and SuperApp, namely the logic of ChatGPT + Codex (Coding Agent) + B-side market. The second-largest startup at $840B, partly because of the third-place Anthropic, is now also betting on the coding market and the B-side market. This is very certain revenue, good for financial statements and IPO, so we are also anchoring in this direction and pushing hard. I believe that in the future large B-side market, Applied AI will center on application-layer Agents, supported by various AI-facing services that keep improving. This is also where B-side logic differs from C-side logic.

Since the beginning of this year, starting with OpenClaw becoming popular around the world, the entire market suddenly became hot. From individuals to enterprises, education was completed smoothly. Now even \*Claw products can be sold easily. Everyone's mindset has suddenly opened. Behind this carnival are the carnival of self-media, the carnival of geeks, the carnival of MaaS and cloud services, and the FOMO of individuals and companies. The market has been educated. Opportunities increased. Competition increased too. It is a bizarre and wild growth field, while also full of opportunities.

What did we do during this period? First, we revolutionized ourselves. Before expanding on that, let me first say one thing: concepts like OpenClaw are old. There is nothing new or magical there. They are just that. They already existed two years ago. Many people would say this, and many people would think this, including me. I like to first try slapping myself in the face: then why do we not have it? Can we hand over this thing immediately?

This is why I like slapping myself in the face. If you are not used to doing it yourself, someone else definitely will. If you do not eliminate yesterday's self, someone in the market will eliminate you. Indeed, none of OpenClaw's ideas are new. After Devin came out two years ago, in March 2024, when we were working on OpenHands, many things were already there, and some ideas continued developing afterward. OpenClaw going out of the circle felt like the Singularity had arrived: model capability arrived, all capabilities were integrated, it worked out of the box, simple and direct, easy to spread, and aligned with the interests of all sides. This was not accidental. It was inevitable.

Seeing the essence through the phenomenon, having the courage to descend one mountain is the beginning of climbing the next one. We also thought and discussed a lot. Even during the Lunar New Year holiday, on the plane to Switzerland, I was almost sleepless, read a lot of information, thought about many things, and wrote many things down. After returning to my desk, we started trying to make changes.

# Vibe Coding, Everything Waiting to Be Rebuilt

The meeting on the morning of March 4 was an important turning point. Our three-person Momentum squad appeared. Maybe only the unlimited-speed highways in Germany can describe our state during this period: that was the limit of the car, not the limit of speed.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-02-speedrunning-the-ai-era/1775142780_8.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
This is the limit of humans, not the limit of AI.
Desensitized version: roughly an average of 30 commits per day.
I have followed Peter for a long time, even before he started working on OpenClaw, because he built and open-sourced many things. In my eyes, that is very cool, and it is also the idea I have always practiced.
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-02-speedrunning-the-ai-era/1775142781_9.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
One very important trait we have now is benchmarking against his speed, although we are still not at the same order of magnitude, and this is not an objective measurement standard anyway.
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-02-speedrunning-the-ai-era/1775142784_10.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
Like an image we circulate internally:
<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-02-speedrunning-the-ai-era/1775142784_11.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
We made speed the highest priority, started exploring a new agile iteration and collaboration method, and started the exploration in an AI Native way. We are not only building a product. We are exploring a method for AI, because this method can support us in iterating out N products.

Everyone is talking about AI Native. Then let us see how we do it:

- Tone-setting: serve AI > serve humans. If this principle is not established, there is no follow-up. Everything in modern infrastructure is oriented toward humans and serves humans. The future is not.
- Organization: I insist on using Monorepo to organize and manage. Why? Because we are AI-oriented. Not process-oriented, not object-oriented, but AI-oriented. If your services are scattered across various repos, then you need to keep feeding AI context and coordinate across different repos. I have personally felt the pain and know how much speed is lost there.
- Architecture: keep services as few as possible, and do not make chains complicated if they do not need to be. Less is more has already been proven by countless great products. C-side folks, do not hit me. There is a balance point here, and each team needs to make its own tradeoff. The principle remains: serve AI.

Turns out summarizing this is not easy. Just follow me and listen to my muttering all the way.

# Mindset Opens the Third Eye

When you first visit our repo, you will see some rather unusual things:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-02-speedrunning-the-ai-era/1775142785_12.jpg" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
These are the principles we give to everyone who comes in to contribute. I hand-wrote them in 10 minutes, mainly hoping that new people can align at the level of consciousness first. Let me add a disclaimer: we support the development of our code models and products like Trae. We also use coco (trae-cli) to do some things, and we hope our code models and coding plan can develop better. That way, when facing B-side customers, we can have strong Coding capability to complete this Coding piece and, in some sense, realize a kind of "AGI."

One thing worth mentioning here is `./docs/histories`. First look at our AGENTS.md and CLAUDE.md. At the very beginning of the project, these two files were among the first added. Because everything in this repo, infinitely close to 100%, should be brought by AI, we kept writing and improving these files from the start.

What can this do? After desensitization and denoising, it preserves the user's query, the reason for the change, the files changed, which AI Agent was used, and which model. This is far more useful than the information in git commits or PR/MR descriptions. It is traceable. Context comes from here and stays here. In the future, whether for newcomer onboarding or tracing the evolution of a feature, there will be a path to follow.

The user query here is also worth mentioning. The origin of Codex was also somewhat like this. Now when newcomers join, half of the morning is shadow time.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-02-speedrunning-the-ai-era/1775142785_13.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
You can understand it as a newcomer finding an old hand and sitting next to them for half a day watching them work. Why do this? Because learning. What we are doing is exactly this. It is hard to use one or two sharing sessions to tell people how we should do things, how to be as fast as me. The best method is to let them see how I do it, how I prompt, how I do end-to-end acceptance, and how I handle problems when I encounter them. This is the selfless contribution of each person walking ahead. We are willing to give part of what we have gained to benefit the newcomers behind us. Normally, this is part of a person's competitive advantage, but our confidence comes from strong learning and adaptation ability. We also hope our peers, our comrades-in-arms, can become stronger. We look at this from the overall perspective. So we choose to leave our queries behind.

There is more controversy around reading code. In the long term, not reading it is the better choice. The context shifts from business logic + code details + architecture design to product definition + business logic + architecture design. AI produces, AI reads, AI modifies. From a probabilistic perspective, it may be better than adding the entropy brought by the human variable. Our time is now spent more on dogfooding, end-to-end acceptance, product discussion and design, thinking, and constantly overthrowing some previous assumptions. Our solution is execution. We use results to validate the solution.

What I learned from early-stage creation and from a long time doing side projects as an IndieDev is that Idea is cheap. This is amplified even more now. Knowing is easy; doing is hard. It is very easy to talk, very hard to make. So we do not like producing a long-winded proposal. Who cares? What we care about is your actual idea and fast action. We can quickly spend 10 minutes in a meeting listening to your plan, challenge it from different angles, share thoughts, and then start doing. We care about the final effect. We care that you delivered a new feature in one hour. If it does not work or does not fit, kill it directly, leaving only two `histories/*.md` files behind and not one line of compromised code.

Also, every few days during fast iteration, we do a refactor. When managers hear "refactor," their faces change. Is it worth the investment? How many person-days? It seems this thing also should not be put on Meego. Shouldn't you have thought this through before? What reason is there to refactor now? I believe many people have had similar feelings and experiences.

What is the situation now? We can spend one or two hours directly refactoring a large chunk away, leaving no dust behind. While pursuing speed, debt is naturally created. Even Codex often carries debt. That is not what we worry about. But we need to be responsible for the product, so we need to repay debt from time to time. This is also a point of constantly questioning and challenging the self from a few days ago. Was the design back then right? Are these two features okay when combined? Is the latest solution implemented this way now? Does new evidence show that this might need adjustment? This is agile iteration in the traditional sense.

Let me talk about another counterintuitive thing, the second landmine after refactoring: reuse. I believe it has already been fully discussed in Allhands, and I appreciate the attitude of some speakers. Makes sense. But advocating reuse without context is hooliganism. A simple example: we found that langsmith is not open source, and we were used to it, so we spent two days building a dedicated in-house version. If we sought reuse, perhaps we could find something, but would it only cost two days? Because the cost of reinventing wheels is now too low. The discussion that open source is slowly moving toward death comes from this. If you already know how something works, and you know that in the past you needed to spend one month of human resources to build it, but now you only need one or two days, what would you choose? Reuse always involves compromise. It depends on which side has more voice. Users complain, not necessarily because the product is bad. Service providers become arrogant. Disclaimer: I have served others before, I have also been arrogant, and I have learned lessons. Forcing things together creates huge communication cost and slows speed further. Of course, adding people can solve these things too. That is also one of the "big-company management games' unspeakable secrets."

I admit my view must be biased. I am only arguing for our scenario. I do not think this should be one-size-fits-all. Reuse when it should be reused. But we should return to first principles: first talk clearly about what we are pursuing, then talk about this problem. Just like what I wrote the year before last:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-02-speedrunning-the-ai-era/1775142785_14.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
Should we pursue generality or specialization? Perhaps the market has given some answers.

At this point, we have already lifted the first layer of the veil. Let us continue forward. How do we code?

# Let Me ~~Rap~~ Code

Using myself as an example, I usually run 3 to 6 sessions at the same time. I do not use worktrees, though I think some people will need them. I like using CLI. Since Claude Code came out, I have been switching back and forth between it and Codex. One advantage of CLI is that you can have multiple sessions at the same time. All IDEs, including Codex App, have a hard time offering this kind of global control: one glance tells you what has finished, and you can immediately continue querying or commit the related changes. That's where the magic happens.

Second, everything can be CLI. For example, apart from local services, some services like MinIO are in k8s. CLI tools like kubectl, ssh, and mysql can solve everything. When a session has a problem, directly give it the session id, and it will automatically connect to local mysql and the development environment to inspect the corresponding issue. **Every problem that can be verified can be solved.** If AI cannot solve a problem after trying for a long time, it is probably because it cannot verify it. What we need to do is give it the ability to verify. Does this feel familiar? Like a leader who does not blame brothers for being dumb, but instead clears every roadblock so everyone can fight and grow more comfortably.

For frontend implementation, we usually take figma + screenshots + human language and directly ascend on the spot, then use some detail control to correct things. During the process, sometimes we use chrome-devtools-mcp or Playwright to connect to the browser, directly retrieve DOM/styles or screenshots, and even go further into the Console to get logs. In essence, these all close the verification loop for AI.

Coding here is broad coding. Besides coding, a large amount of work is completed through this, including the troubleshooting and testing mentioned earlier. Expanding this would give a lot to say.

From simple unit tests, end-to-end tests, smoke tests, performance tests, security tests, to evaluation tests, we let AI complete all of them. We orchestrate this series of actions, launch a wave when we leave work, and the next morning reports are waiting for us. It is like driving fast while fastening the seat belt, holding the steering wheel, and keeping the eyes sharp. At the same time, we are also exploring forms like Ralph Loop, using endless loops to continuously achieve certain goals. We are actively exploring how to integrate this into our products.

That is roughly enough rap. Next, let us take a small look at the product.

# Product

Because of sensitivity, I will not show the product. Friends who are interested can come talk to me.

I will briefly talk about some ideas. I think many things can be built by everyone now. Harnesses are everywhere. The claude code that was forced open-source yesterday is one of them, along with codex, gemini-cli, pi, opencode, deepagents, deerflow 2.0, and so on. From a technical perspective, there is already no shortage of any technology. From a product perspective, the most important thing is still model as product. This is also why these people have such top-tier compensation now, and that is undeniable.

Beyond that, when building products, we repeatedly emphasize two lines: explicit knowledge and hidden knowledge.

Explicit knowledge is always what attracts attention. For example, we may look down on some content posted by self-media, but that does not prevent it from bringing huge influence. The same logic applies. A product must constantly have explicit knowledge: MCP, Skills, Mem, Self-Improving, IM channels. These are examples. There are also more things like UI/UX expressions: card effects that look great, Gen-UI usage, tool-call rendering, multi-Agent visualization, and so on. Without explicit knowledge, no matter how strong a product is, it is like throwing a small stone into the sea: no waves at all. Explicit knowledge is not necessarily the product itself. Some external influence and volume can also be part of explicit knowledge.

Hidden knowledge is the foundation for standing after the first-impression kill. The effect must be good, and the chassis must be stable. All kinds of fancy technical methods are not enough compared with these two points. How do we achieve them? By using various technologies to architect this system. People do not need to know what technologies are used inside. They only need to know it is awesome and easy to use. Many technical people often die while chasing hidden knowledge, but we also cannot stop pursuing it. Otherwise, it looks like a big pig but sounds like a small pig when hit. Throw in a meme:

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-02-speedrunning-the-ai-era/1775142786_15.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
What supports the product, supports reputation, supports selling, and supports continuous forward motion is this. Broadly speaking, hidden knowledge also includes the people and the team behind it: constantly improving ourselves, adapting to new environments, pursuing completion and continuing to pursue perfection.

Finally, the product must dogfood. We are not making electronic trash. Start from the customer. Try using it yourself and see whether it is painful. If you do not even want to use it yourself, but still dream of fooling others into buying it, then it is basically a pig-butchering scheme.

# About Organization

I do not have much authority to speak on how organizational forms should change. I will casually share some thoughts.

More transparent information flow may be the most important thing, especially during a great transformation. Often it is bottom-up and outside-in. How to let all kinds of information flow up, down, left, and right is something managers should think about and act on. AI can bring more efficient information flow. At the market level, this creates higher requirements for all kinds of actors, but also increases many opportunities. When external information flow increases, if you keep the speed of internal information flow unchanged, relatively speaking that is regression. Losing competitiveness or being eliminated is only a matter of time.

Allow some people to become fast first. Or from another angle: allow some people to slow down. I believe not everyone gets onto the fast lane. Some people can immediately, some need a period of time, and some need a lifetime. Of course, not everyone needs to become fast. Let me first throw in an image I saw the day before yesterday. Treat it as a meme.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-02-speedrunning-the-ai-era/1775142786_16.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>
One sentence: capital never sleeps. The original intention of technological progress, and the way leaders describe it, is mostly positive. But reality will tell us the answer. So do not force everyone to become fast. A fast-and-slow blade is the finishing touch.

I have drifted off topic. It is like when a new wave comes, some people need to enter the water first and play with the tide. This group explores the new collaboration form for each team or department, feeds it back, and eventually drives the whole base. This would be a plan less likely to pull something important. Easy to say, hard to realize. Finding suitable people, trying in suitable ways, having reasonable mechanisms to protect it, and so on are all difficult parts.

Provide suitable soil. How to say this? Even the cleverest cook cannot cook without rice. If what we pursue is a market-valuable product, a SOTA product, then everyone should be able to easily access SOTA tools and products. This is also one of those things easy to know and hard to do. A simple example: perhaps because we ourselves are a model factory, we have our own models and supply them internally without limit for incubation. But beyond that, many external APIs are extremely hard for most departments and teams to obtain. Complex processes and tedious procedures put all possibilities high up on a shelf. Of course, conversely, dogfooding is needed to support the progress of our own models and products. Compliance and security also need consideration, and cost needs attention. But if these become layer after layer of resistance, many people will lose their sense for top-tier products and the chance to create the next excellent product. Do not underestimate access difficulty. In security offense and defense, there is a saying: there is no absolute security, everything is relative. The defender infinitely raises the cost of intrusion to resist the attacker. For obtaining SOTA tools, once the difficulty reaches a certain threshold, it will greatly suppress people's initiative and the potential innovation that follows. There are too many complex and sensitive things inside, so I will not expand further. But at the organizational level, perhaps this problem should be taken seriously.

Let me write this much for now.

# Epilogue

On the night of April Fools' Day, the caffeine from 10 a.m. still seemed to have some aftertaste, or perhaps the excited nerves simply never relaxed. I wrote these things hoping they can change more people's mindset a little. I am not advocating anything. What you can understand and learn from it is entirely up to yourself.

At the very end, I have always been an optimist, though occasionally with a little pessimism. Perhaps what we are striving for will one day completely lift us away. I hope we can still always keep the ability to be happy.

<div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        <div class="row mt-3">
    <div class="col-sm mt-0 mb-0">
        {% include figure.liquid loading="eager" path="/assets/img/2026-04-02-speedrunning-the-ai-era/1775142789_17.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
    </div>
</div>

_PS: Because of desensitization, multiple images and text passages have been removed from this article._
