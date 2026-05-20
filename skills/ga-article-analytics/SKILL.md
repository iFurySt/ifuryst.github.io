---
name: ga-article-analytics
description: Analyze this Jekyll blog's Google Analytics article performance, GA4 tracking health, English translation coverage, traffic sources, country quality, landing pages, page views, and content-direction recommendations. Use when asked to inspect GA, report article visits, compare Chinese and English post performance, decide future writing topics, or schedule recurring site analytics analysis.
---

# GA Article Analytics

## Overview

Use this skill to produce a repeatable GA4 content report for `ifuryst.github.io`. Prefer read-only collection from Google Analytics via Open Browser Use, then combine it with local repository checks for tracking and translation coverage.

## Core Workflow

1. Confirm local site tracking configuration:
   - Check `_config.yml` for `google_analytics`, `enable_google_analytics`, and site URL.
   - Check `_includes/scripts/analytics.liquid` and layouts that include it.
   - If needed, serve `_site` locally and verify exactly one `gtag.js` script and one `gtag('config', ...)` call on representative home, Chinese post, and English post pages.

2. Audit translation coverage:
   - Run `ruby skills/ga-article-analytics/scripts/audit_translations.rb`.
   - Treat posts without `translation_key` as outside the pairing system unless the user expects every recent post to be translated.
   - Report missing English pages separately from "not configured for translation".

3. Collect GA4 tables with OBU:
   - Read `references/ga4-obu-workflow.md` for exact report URLs and extraction snippets.
   - Capture at least:
     - Pages and screens by page path.
     - Landing page by landing page path.
     - Traffic acquisition by session source / medium.
     - Demographic details by country when source quality matters.
   - Keep the date range explicit, usually the current GA default or the range requested by the user.

4. Parse and classify rows:
   - Use `python3 skills/ga-article-analytics/scripts/parse_ga_table.py --kind pages < exported-text.txt>` when working from copied GA table text.
   - For in-browser extraction, use the JavaScript snippets in the reference and then classify article rows with the same path rules:
     - Article path: `^/(en/)?blog/\d{4}/`
     - English article: path starts with `/en/blog/`
     - Chinese article: path starts with `/blog/`
   - Exclude index pages, tag/category archives, pagination, favicon, 404, and empty paths from article rankings.

5. Produce a decision-oriented report:
   - Lead with the practical conclusion.
   - Include the reporting window and exact GA scope.
   - Separate "Views" from "Landing sessions"; views measure total reading, landing sessions measure acquisition.
   - Treat Direct as potentially self-traffic or unattributed traffic if the user says so, but still state its share.
   - Compare source quality by engagement rate and engagement time, not sessions alone.
   - Compare Chinese vs English pages, and call out whether low English numbers mean no tracking, no generation, or simply low demand.
   - Group articles by topic only as an analytical aid; label the grouping as inferred from URL/title.

## Report Shape

Use a concise structure:

- **Scope**: date range, property, filters, whether Direct is excluded or downweighted.
- **Tracking health**: GA script and live page status.
- **Translation coverage**: paired counts, missing recent translations.
- **Top articles**: views, active users, average engagement time.
- **Landing pages**: sessions and average engagement time for acquisition.
- **Sources**: direct, referral, organic search, social, notable domains.
- **Geography**: countries with high volume and countries with high engagement.
- **Content guidance**: what to write more, what to keep as long tail, what not to over-invest in.

## Local Commands

```bash
ruby skills/ga-article-analytics/scripts/audit_translations.rb
python3 skills/ga-article-analytics/scripts/parse_ga_table.py --kind pages ga-pages.txt
python3 skills/ga-article-analytics/scripts/parse_ga_table.py --kind landing ga-landing.txt
python3 skills/ga-article-analytics/scripts/parse_ga_table.py --kind source ga-sources.txt
```

If `_site` is stale, build the site before checking generated HTML. If local Jekyll cannot run because Bundler or gems are missing, inspect the existing `_site` output and say that generated output may be stale.
