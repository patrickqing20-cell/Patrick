#!/usr/bin/env python3
"""Export the bundled dialect line database to UTF-8 BOM CSV."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path


DB_PATH = Path(__file__).resolve().parents[1] / "assets" / "dialect_line_database.json"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    database = json.loads(DB_PATH.read_text(encoding="utf-8"))
    rows = []
    for dialect in database["dialects"]:
        for line in dialect["lines"]:
            rows.append(
                {
                    "方言": dialect["dialect"],
                    "可靠性层级": dialect["tier"],
                    "Prompt标签": dialect["prompt_label"],
                    "模型提示": dialect["model_note"],
                    "意图": line["intent"],
                    "普通话原意": line["mandarin"],
                    "轻方言版本": line["light"],
                    "强方言版本": line["strong"],
                    "表演提示": line["acting_note"],
                }
            )
    with args.output.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} dialect lines to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
