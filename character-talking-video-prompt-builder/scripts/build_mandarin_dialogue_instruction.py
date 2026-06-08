#!/usr/bin/env python3
"""Build an LLM instruction for generating a fresh Mandarin short-drama line."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


DB_PATH = Path(__file__).resolve().parents[1] / "assets" / "mandarin_urban_dialogue_database.json"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", required=True)
    parser.add_argument("--character-persona", required=True)
    parser.add_argument("--relationship", default="未指定")
    parser.add_argument("--scene", default="单人中近景说话镜头")
    parser.add_argument("--emotion", default="克制")
    args = parser.parse_args()
    rows = json.loads(DB_PATH.read_text(encoding="utf-8"))["dialogues"]
    matched = [row for row in rows if args.category in {row["category_id"], row["category_name"]}]
    if not matched:
        raise ValueError("Unknown Mandarin dialogue category")
    examples = "\n".join(f"- {row['line_text']} | {row['acting_note']}" for row in matched[:5])
    print(
        f"""请为都市短剧角色生成一句新的普通话台词。
角色：{args.character_persona}
人物关系：{args.relationship}
场景：{args.scene}
剧情功能：{matched[0]['category_name']}
情绪：{args.emotion}

要求：
1. 生成一句自然口语，不要照抄参考台词。
2. 保持都市短剧节奏，适合 10 秒内清晰说完。
3. 优先控制在 4-24 个汉字，最长不超过 32 个汉字。
4. 不要写成旁白，不要增加对方台词，不要使用书面说明。
5. 严肃台词保持克制，不要自动写成喊叫或网络段子。
6. 只输出 JSON：line_text、category、emotion、acting_note、assumptions。

同类参考：
{examples}"""
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
