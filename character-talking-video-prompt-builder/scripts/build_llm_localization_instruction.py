#!/usr/bin/env python3
"""Build an LLM instruction for regional spoken-dialogue localization."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "assets" / "dialect_line_database.json"
RULES_PATH = ROOT / "assets" / "language_generation_rules.json"


def find_profile(database: dict, requested: str) -> dict:
    for profile in database["dialects"]:
        if requested == profile["dialect"] or requested in profile["aliases"]:
            return profile
    raise ValueError(f"Unknown language profile: {requested}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--accent", required=True)
    parser.add_argument("--dialect-mode", choices=["light", "strong"], default="light")
    parser.add_argument("--source-line", required=True)
    parser.add_argument("--character-persona", default="都市短剧角色")
    parser.add_argument("--scene", default="单人中近景说话镜头")
    parser.add_argument("--emotion", default="克制")
    args = parser.parse_args()

    database = json.loads(DB_PATH.read_text(encoding="utf-8"))
    rules = json.loads(RULES_PATH.read_text(encoding="utf-8"))
    profile = find_profile(database, args.accent)
    examples = "\n".join(
        f"- 普通话原意：{line['mandarin']} -> {args.dialect_mode}版本：{line[args.dialect_mode]}"
        for line in profile["lines"][:4]
    )
    english_rule = ""
    if profile["dialect"] == "香港粤语中英夹杂":
        hk = rules["hong_kong_code_switching"]
        english_rule = (
            f"\n香港口语额外约束：{hk[f'{args.dialect_mode}_rule']}"
            " 粤语句法必须是主体，不要为了中英夹杂而硬塞英文。"
        )
    print(
        f"""请将一句都市短剧台词本地化为“{profile['prompt_label']}”。
角色：{args.character_persona}
场景：{args.scene}
情绪：{args.emotion}
模式：{args.dialect_mode}
普通话原意：{args.source_line}

要求：
1. 保留原始剧情含义和情绪压力，不得新增剧情信息。
2. 输出一句自然、可朗读、适合 10 秒视频的口语台词。
3. 优先控制在 4-24 个汉字或等量口语单位。
4. 不要机械逐词替换；参考该语言习惯重新组织句子。
5. 严肃角色不要自动写成喜剧腔。
6. 只输出 JSON：localized_line、accent_label、dialect_mode、acting_note、assumptions。{english_rule}

风格参考：
{examples}"""
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
