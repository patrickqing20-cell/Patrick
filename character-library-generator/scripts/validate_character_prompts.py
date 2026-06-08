#!/usr/bin/env python3
"""Validate generated random character prompt CSV or JSON files."""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path
from typing import Any


REQUIRED_PROMPT_MARKERS = [
    "纯白背景",
    "固定四栏式排版",
    "左侧32%",
    "右侧68%",
    "严格90度",
    "严格180度",
    "相同脚底基准线",
    "不裁切",
    "文字标签",
]

REQUIRED_VIDEO_ANCHOR_MARKERS = [
    "单人胸部以上说话视频锚点图",
    "9:16竖屏",
    "只出现一个人物",
    "只展示一个角度",
    "完整展示头发、脸部、颈部、肩膀和上胸",
    "嘴部无遮挡",
    "不要四视图",
    "不要多视角",
    "用于后续单人说话视频",
]


def load_rows(path: Path) -> list[dict[str, Any]]:
    if path.suffix.lower() == ".json":
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            raise ValueError("JSON input must be an array")
        return data
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def validate(path: Path) -> int:
    rows = load_rows(path)
    errors: list[str] = []
    for index, row in enumerate(rows, start=1):
        prompt = str(row.get("prompt", "")).strip()
        resolution = str(row.get("分辨率", "")).strip()
        video_anchor_prompt = str(row.get("video_anchor_prompt", "")).strip()
        video_anchor_resolution = str(row.get("视频锚点分辨率", "")).strip()
        if not prompt:
            errors.append(f"row {index}: prompt is empty")
            continue
        if resolution != "2560:1440":
            errors.append(f"row {index}: unexpected resolution {resolution!r}")
        for marker in REQUIRED_PROMPT_MARKERS:
            if marker not in prompt:
                errors.append(f"row {index}: missing prompt marker {marker!r}")
        if not video_anchor_prompt:
            errors.append(f"row {index}: video_anchor_prompt is empty")
        if video_anchor_resolution != "1440:2560":
            errors.append(f"row {index}: unexpected video anchor resolution {video_anchor_resolution!r}")
        for marker in REQUIRED_VIDEO_ANCHOR_MARKERS:
            if marker not in video_anchor_prompt:
                errors.append(f"row {index}: missing video anchor prompt marker {marker!r}")

    if errors:
        print("Validation failed")
        for error in errors:
            print(f"ERROR: {error}")
        return 1

    print("Validation passed")
    print(f"Checked prompts: {len(rows)}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", type=Path)
    args = parser.parse_args()
    try:
        return validate(args.path)
    except Exception as exc:
        print(f"Validation error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
