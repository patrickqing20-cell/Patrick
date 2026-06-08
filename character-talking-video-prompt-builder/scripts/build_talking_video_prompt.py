#!/usr/bin/env python3
"""Build copy-ready native-audio talking-character video prompts."""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path


DEFAULTS = {
    "accent": "普通话",
    "age_feel": "成熟感",
    "gender_presentation": "中性表达",
    "pitch": "中等音高",
    "timbre": "自然温润",
    "speed": "中等语速",
    "articulation": "咬字清晰克制",
    "emotion": "平静",
    "breath_pause": "开口前自然停顿半秒，语气稳定",
}
DB_PATH = Path(__file__).resolve().parents[1] / "assets" / "dialect_line_database.json"


def normalize_accent(value: str) -> str:
    if value.startswith("普通话"):
        return "普通话"
    return value


def parse_bool(value: object) -> bool:
    return str(value).strip().lower() in {"1", "true", "yes", "y", "on"}


def load_database() -> dict:
    return json.loads(DB_PATH.read_text(encoding="utf-8"))


def find_dialect(database: dict, requested: str) -> dict | None:
    for dialect in database["dialects"]:
        if requested == dialect["dialect"] or requested in dialect["aliases"]:
            return dialect
    return None


def resolve_line(values: dict[str, str], merged: dict[str, str]) -> tuple[str, str]:
    line = (values.get("line_text") or "").strip()
    intent = (values.get("intent") or "").strip()
    mode = (values.get("dialect_mode") or "light").strip()
    localize = parse_bool(values.get("localize_line", False))
    if mode not in {"light", "strong"}:
        raise ValueError("dialect_mode must be light or strong")
    dialect = find_dialect(load_database(), merged["accent"])
    if not dialect:
        if not line:
            raise ValueError("line_text is required when the dialect is not in the bundled database")
        return line, ""
    candidates = dialect["lines"]
    selected = next((item for item in candidates if item["intent"] == intent), None) if intent else None
    if not selected and localize and line:
        selected = next((item for item in candidates if item["mandarin"] == line), None)
    if selected and (intent or localize or not line):
        return selected[mode], selected["acting_note"]
    if line:
        return line, ""
    raise ValueError("Use --line-text or choose a bundled --intent")


def merge_values(values: dict[str, str]) -> dict[str, str]:
    voice_dna = values.get("voice_dna", "")
    voice_values = json.loads(voice_dna) if voice_dna else {}
    merged = {**DEFAULTS, **voice_values, **{key: value for key, value in values.items() if value}}
    merged["accent"] = normalize_accent(values.get("accent") or values.get("dialect") or merged["accent"])
    return merged


def build_prompt(values: dict[str, str]) -> str:
    merged = merge_values(values)
    line, dialect_acting_note = resolve_line(values, merged)
    delivery = (dialect_acting_note or merged["breath_pause"]).rstrip("。！？!?")
    return (
        "【主体】使用上传图片中的唯一人物，严格保持面部身份、发型、发色和服装一致。"
        "【镜头】9:16竖屏，10秒，单人中近景，头顶到腰部，固定机位轻微缓慢推进。"
        "【表演】自然眨眼，轻微呼吸，先看向镜头，再克制地开口，嘴部动作自然。说完后保持自然安静状态。"
        f"【对白】人物使用{merged['accent']}只说一句：“{line}”不得增加、改写、重复或补充台词。"
        f"【声音】{merged['age_feel']}，{merged['gender_presentation']}，{merged['pitch']}，"
        f"音色{merged['timbre']}，{merged['speed']}，{merged['articulation']}，"
        f"情绪{merged['emotion']}。{delivery}。"
        "【音频限制】只保留人物说话的人声。不要背景音乐，不要配乐，不要环境声，不要音效，"
        "不要提示音，不要混入其他人的声音。台词说完后保持安静。"
        "【禁止】不要字幕，不要文字，不要水印，不要额外人物，不要额外台词，不要旁白，"
        "不要夸张动作，不要脸部漂移，不要畸形嘴部。"
    )


def write_batch(input_csv: Path, output_csv: Path) -> None:
    with input_csv.open("r", encoding="utf-8-sig", newline="") as handle:
        source_rows = list(csv.DictReader(handle))
    if not source_rows:
        raise ValueError("input CSV contains no rows")
    output_rows = []
    for index, row in enumerate(source_rows, start=1):
        localized_line, _ = resolve_line(row, merge_values(row))
        output_rows.append(
            {
                "character_id": row.get("character_id") or f"CHAR-{index:03d}",
                "image_path": row.get("image_path", ""),
                "source_line_text": row.get("line_text", ""),
                "line_text": localized_line,
                "accent": normalize_accent(row.get("accent") or row.get("dialect") or DEFAULTS["accent"]),
                "dialect_mode": row.get("dialect_mode") or "light",
                "prompt": build_prompt(row),
                "Generate audio": "true",
                "Aspect ratio": "9:16",
                "Duration": "10",
                "Resolution": row.get("Resolution") or "720p",
                "Seed": row.get("Seed", ""),
            }
        )
    with output_csv.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(output_rows[0]))
        writer.writeheader()
        writer.writerows(output_rows)
    print(f"Wrote {len(output_rows)} prompts to {output_csv}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-csv", type=Path)
    parser.add_argument("--output-csv", type=Path)
    parser.add_argument("--line-text")
    parser.add_argument("--accent", default=DEFAULTS["accent"])
    parser.add_argument("--dialect-mode", choices=["light", "strong"], default="light")
    parser.add_argument("--intent")
    parser.add_argument("--localize-line", action="store_true")
    parser.add_argument("--age-feel", default=DEFAULTS["age_feel"])
    parser.add_argument("--gender-presentation", default=DEFAULTS["gender_presentation"])
    parser.add_argument("--pitch", default=DEFAULTS["pitch"])
    parser.add_argument("--timbre", default=DEFAULTS["timbre"])
    parser.add_argument("--speed", default=DEFAULTS["speed"])
    parser.add_argument("--articulation", default=DEFAULTS["articulation"])
    parser.add_argument("--emotion", default=DEFAULTS["emotion"])
    parser.add_argument("--breath-pause", default=DEFAULTS["breath_pause"])
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.input_csv:
        if not args.output_csv:
            raise ValueError("--output-csv is required with --input-csv")
        write_batch(args.input_csv, args.output_csv)
        return 0
    if not args.line_text and not args.intent:
        print("Use --line-text or --intent for one prompt, or --input-csv with --output-csv for a batch.", file=sys.stderr)
        return 2
    print(build_prompt(vars(args)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
