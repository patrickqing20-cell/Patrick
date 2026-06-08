#!/usr/bin/env python3
"""Select reproducible Mandarin urban short-drama dialogue lines."""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path


DB_PATH = Path(__file__).resolve().parents[1] / "assets" / "mandarin_urban_dialogue_database.json"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--category")
    parser.add_argument("--count", type=int, default=1)
    parser.add_argument("--seed", type=int, default=20260531)
    args = parser.parse_args()
    rows = json.loads(DB_PATH.read_text(encoding="utf-8"))["dialogues"]
    if args.category:
        rows = [row for row in rows if args.category in {row["category_id"], row["category_name"]}]
    if not rows:
        raise ValueError("No Mandarin dialogue rows matched the requested category")
    rng = random.Random(args.seed)
    chosen = rng.sample(rows, min(args.count, len(rows)))
    print(json.dumps(chosen, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
