#!/usr/bin/env python3
"""Parse copied GA4 report text into compact article analytics summaries."""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict


ARTICLE_RE = re.compile(r"^/(en/)?blog/\d{4}/")
EXCLUDE_RE = re.compile(r"^/(en/)?blog/(page|tag|category)(/|$)|^/(en/)?blog/?$|favicon|Page not found", re.I)


def parse_num(value: str) -> int:
    match = re.search(r"[\d,]+", value or "")
    return int(match.group(0).replace(",", "")) if match else 0


def parse_time(value: str) -> int:
    value = value or ""
    minutes = re.search(r"(\d+)m", value)
    seconds = re.search(r"(\d+)s", value)
    return (int(minutes.group(1)) * 60 if minutes else 0) + (int(seconds.group(1)) if seconds else 0)


def clean_percent(value: str) -> float:
    match = re.search(r"[\d.]+", value or "")
    return float(match.group(0)) if match else 0.0


def is_article_path(path: str) -> bool:
    return bool(ARTICLE_RE.search(path or "")) and not EXCLUDE_RE.search(path or "")


def topic_for(path: str) -> str:
    p = path.lower()
    if re.search(r"open-browser-use|browser-use|daily-harness|claude-code|mcp|context-engineering|ce101|llm|openai|responses-api|tokenizer|agent|sampling|gomaxprocs|kafka|raft|rate-limiter|queries|ingress|benchstat|git", p):
        return "tech_ai_engineering"
    if re.search(r"speedrunning|urge|prelude|peaks|10-yrs|fast-pace|lets-rock|recap|journey|nobody|secret|uncertainty|drinking|spirit|culture|history|check", p):
        return "personal_reflection"
    if re.search(r"leotalk|trends|google-io|rednote|cursor|weekly|qwen|browser-wars|deep-agent", p):
        return "ai_news_trends"
    return "other"


def parse_rows(text: str, kind: str) -> list[dict]:
    rows = []
    for raw in text.splitlines():
        line = raw.strip()
        if not re.match(r"^\d+\t", line):
            continue
        cols = line.split("\t")
        if len(cols) < 4:
            continue
        item = {"idx": int(cols[0]), "dimension": cols[1]}
        if kind in {"pages", "landing"}:
            # Pages: idx, path, views/sessions, users, views per user/new users, engagement time...
            item.update(
                metric=parse_num(cols[2]),
                users=parse_num(cols[3]),
                avg_sec=parse_time(cols[5] if len(cols) > 5 else ""),
                events=parse_num(cols[6] if len(cols) > 6 else ""),
                lang="en" if cols[1].startswith("/en/") else "zh",
                is_article=is_article_path(cols[1]),
                topic=topic_for(cols[1]),
            )
        elif kind == "source":
            item.update(
                sessions=parse_num(cols[2]),
                engaged_sessions=parse_num(cols[3]),
                engagement_rate=clean_percent(cols[4] if len(cols) > 4 else ""),
                avg_sec=parse_time(cols[5] if len(cols) > 5 else ""),
                events=parse_num(cols[7] if len(cols) > 7 else ""),
            )
        elif kind == "country":
            item.update(
                users=parse_num(cols[2]),
                new_users=parse_num(cols[3]),
                engaged_sessions=parse_num(cols[4]),
                engagement_rate=clean_percent(cols[5] if len(cols) > 5 else ""),
                avg_sec=parse_time(cols[7] if len(cols) > 7 else ""),
                events=parse_num(cols[8] if len(cols) > 8 else ""),
            )
        rows.append(item)
    return rows


def summarize(rows: list[dict], kind: str) -> dict:
    if kind in {"pages", "landing"}:
        articles = [row for row in rows if row.get("is_article")]
        by_lang = defaultdict(lambda: {"count": 0, "metric": 0, "users": 0, "weighted_sec": 0})
        by_topic = defaultdict(lambda: {"count": 0, "metric": 0, "users": 0, "weighted_sec": 0})
        for row in articles:
            for bucket, key in ((by_lang, row["lang"]), (by_topic, row["topic"])):
                bucket[key]["count"] += 1
                bucket[key]["metric"] += row["metric"]
                bucket[key]["users"] += row["users"]
                bucket[key]["weighted_sec"] += row["avg_sec"] * row["users"]
        return {
            "kind": kind,
            "row_count": len(rows),
            "article_count": len(articles),
            "article_metric_total": sum(row["metric"] for row in articles),
            "article_user_total": sum(row["users"] for row in articles),
            "by_lang": by_lang,
            "by_topic": by_topic,
            "top_articles": articles[:30],
        }
    return {"kind": kind, "row_count": len(rows), "top": rows[:30]}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--kind", choices=["pages", "landing", "source", "country"], required=True)
    parser.add_argument("file", nargs="?", help="Text file copied from GA. Reads stdin when omitted.")
    parser.add_argument("--json", action="store_true", help="Emit JSON only.")
    args = parser.parse_args()

    text = open(args.file, encoding="utf-8").read() if args.file else sys.stdin.read()
    rows = parse_rows(text, args.kind)
    summary = summarize(rows, args.kind)

    if args.json:
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return 0

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
