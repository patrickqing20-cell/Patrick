# Dialect Dialogue Guidelines

## Goal

Localize dialogue instead of applying an accent label to standard Mandarin.
Keep lines natural, short, understandable, and suitable for a 10-second
single-person speaking clip.

## Modes

| Mode | Use |
|---|---|
| `light` | Default. Leads, emotional scenes, broad audiences. |
| `strong` | Regionally distinctive supporting roles, family scenes, comedy. |

Prefer `light`. Use `strong` only when the user wants a stronger local flavor.

## Reliability Tiers

| Tier | Dialects |
|---|---|
| `high` | 普通话、粤语、香港粤语中英夹杂、四川话、东北话 |
| `medium` | 河南话风格、陕西话风格、湖南话风格、山东话风格 |
| `experimental` | 上海话风格 |

`medium` and `experimental` indicate video-model pronunciation uncertainty,
not a linguistic judgment. Recommend small-sample validation.

## Rewriting Rules

1. Preserve the original dramatic intent.
2. Add only one or two recognizable regional markers in `light` mode.
3. Avoid dense, obscure dialect writing except for explicit strong-mode tests.
4. Avoid turning serious regional characters into automatic comedy.
5. Keep one line approximately `4-24` Chinese characters where possible.
6. Do not claim exact linguistic coverage. Regional variation exists within
   each province and city.
7. For arbitrary source dialogue, use the database as style patterns. Rewrite
   manually rather than forcing mechanical word replacement.

## LLM Generation Contract

When the requested source dialogue does not exactly match a stored line, read
`assets/language_generation_rules.json` and ask the LLM to:

1. Identify the dramatic intent, relationship, emotional pressure, and scene
   formality.
2. Choose the requested language profile and `light` or `strong` mode.
3. Rewrite the line using the profile patterns. Do not mechanically replace
   individual words.
4. Preserve the plot meaning and keep only one speakable line.
5. Return the localized line, accent label, mode, and one restrained acting
   note before building the final video prompt.

For a 10-second clip, keep the localized line concise. If localization makes it
too long, split the content into multiple clips instead of speeding up speech.

Build a copy-ready instruction for arbitrary new dialogue:

```bash
python scripts/build_llm_localization_instruction.py \
  --accent "香港粤语中英夹杂" \
  --dialect-mode strong \
  --source-line "你回来以后给我打电话。" \
  --character-persona "香港投行女经理，强势但克制" \
  --emotion "急切"
```

## Hong Kong Cantonese With English Code-Switching

Use the `香港粤语中英夹杂` profile for contemporary Hong Kong workplace,
professional, urban, and casual characters.

Rules:

1. Keep Cantonese grammar as the base.
2. In `light` mode, use zero or one natural English insertion.
3. In `strong` mode, use at most two English insertions.
4. Prefer common spoken terms such as `OK`, `sorry`, `check`, `confirm`,
   `call`, `message`, `deadline`, `meeting`, `plan`, and `problem`.
5. Do not insert English merely to sound fashionable.
6. Do not turn intimate or serious dialogue into office jargon unless it fits
   the character and scene.

Example:

```text
普通话原意：你为什么不告诉我？
轻度香港粤语：你做咩唔同我讲？
较强中英夹杂：你做咩连个message都唔俾我？
```

## Database

Read `assets/dialect_line_database.json`.
For generative rewriting rules, also read
`assets/language_generation_rules.json`.

Each dialect entry includes:

```text
dialect
aliases
tier
prompt_label
model_note
lexical_patterns
lines[].intent
lines[].mandarin
lines[].light
lines[].strong
lines[].acting_note
```

## Script Usage

Pick a stored intent:

```bash
python scripts/build_talking_video_prompt.py \
  --accent "四川话" \
  --dialect-mode light \
  --intent question_hide
```

Localize a matching standard-Mandarin line:

```bash
python scripts/build_talking_video_prompt.py \
  --accent "粤语" \
  --dialect-mode light \
  --line-text "你为什么不告诉我？" \
  --localize-line
```

Export the full database as a Mac Excel-compatible CSV:

```bash
python scripts/export_dialect_database.py --output dialect-line-database.csv
```
