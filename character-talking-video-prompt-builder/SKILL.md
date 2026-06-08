---
name: character-talking-video-prompt-builder
description: Build copy-ready prompts for generating 10-second vertical talking-character videos from an uploaded character image. Use when the user wants a portrait, character card, or derived first-frame image to become a single-person speaking video with native generated voice, persona-matched delivery, stable identity, no BGM, no sound effects, no ambient audio, no subtitles, and restrained acting. Supports one-off prompts and batch CSV prompt sheets for short-drama character libraries. This skill is prompt-only and does not call paid image, audio, or video APIs.
---

# Character Talking Video Prompt Builder

## Purpose

Turn a character image and dialogue brief into a copy-ready prompt for a
native-audio video model. Prioritize the human voice and speaking state.

Do not call video APIs. Return prompts and recommended settings only.

## Required Inputs

Collect or infer:

```text
image: uploaded single-person image or image path
line_text: one spoken line
accent: 普通话 by default
age_feel: 青年感 / 成熟感 / 年长感
gender_presentation: 女性表达 / 男性表达 / 中性表达
pitch: 偏低 / 中等 / 偏高
timbre: 温润 / 冷淡 / 沙哑 / 清亮 / 厚重 / 疲惫
speed: 偏慢 / 中等 / 略快
articulation: 清晰 / 松弛 / 克制 / 强势
emotion: 平静 / 坚定 / 委屈 / 犹豫 / 压迫 / 亲切
breath_pause: opening pause and delivery note
dialect_mode: light by default; strong only when the user requests stronger local flavor
```

If a non-critical Voice DNA field is missing, infer a restrained value from
the character persona. State assumptions briefly.

## Image Gate

Accept only a single-person `9:16` medium-close-up video first frame:

```text
head to waist
front-facing or <= 15-degree turn
mouth unobstructed
simple background
no props near mouth
no text
no four-view layout
```

If the user provides a four-view asset sheet, generate a first-frame image
prompt before generating the video prompt. Do not animate the four-view sheet
directly. Read `references/prompt-patterns.md` for the first-frame template.

## Prompt Construction

Build the output in this exact order:

```text
【主体】
【镜头】
【表演】
【对白】
【声音】
【音频限制】
【禁止】
```

Non-negotiable defaults:

```text
duration: 10 seconds
aspect ratio: 9:16
shot: single-person medium close-up
camera: fixed camera with a very slow push-in
audio: human dialogue voice only
music: none
sound effects: none
ambient audio: none
subtitles and visible text: none
extra lines: none
```

Use one short spoken line. Keep the dialogue approximately `4-24` Chinese
characters where possible. For longer dialogue, recommend splitting it into
multiple 10-second clips.

## Output Format

Return:

1. Image suitability result.
2. Copy-ready video prompt.
3. Recommended generation settings.
4. Assumptions made for missing Voice DNA fields.

Use:

```text
Generate audio: true
Aspect ratio: 9:16
Duration: 10 seconds
Resolution: 720p for testing
Video reference: empty
Audio reference: empty
```

For a batch request, return UTF-8 BOM CSV with:

```text
character_id,image_path,source_line_text,line_text,accent,dialect_mode,prompt,Generate audio,Aspect ratio,Duration,Resolution,Seed
```

## Dialect Localization

When the user requests dialect dialogue, localize the line instead of merely
adding an accent label to standard Mandarin.

Read `references/dialect-guidelines.md`,
`assets/dialect_line_database.json`, and
`assets/language_generation_rules.json`.

Default to `light` mode. Preserve broad audience comprehension and the
original dramatic intent. Use `strong` mode only for explicit regional flavor,
supporting roles, family scenes, or comedy.

Prioritize model validation in this order:

```text
high: 普通话、粤语、香港粤语中英夹杂、四川话、东北话
medium: 河南话风格、陕西话风格、湖南话风格、山东话风格
experimental: 上海话风格
```

For arbitrary dialogue that does not match a stored line, generate a localized
line with the selected profile. Use profile examples as few-shot patterns,
preserve the original dramatic intent, and output one short speakable line.
Do not mechanically replace isolated words.

To create a copy-ready LLM localization instruction for arbitrary new dialogue,
run:

```bash
python scripts/build_llm_localization_instruction.py \
  --accent "香港粤语中英夹杂" \
  --dialect-mode strong \
  --source-line "你回来以后给我打电话。" \
  --character-persona "香港投行女经理，强势但克制" \
  --emotion "急切"
```

For `香港粤语中英夹杂`, keep Cantonese grammar as the base. Use zero or one
natural English insertion in `light` mode and at most two in `strong` mode.
Prefer commonly spoken terms such as `OK`, `sorry`, `check`, `confirm`,
`call`, `message`, `deadline`, `meeting`, `plan`, and `problem`.

## Mandarin Dialogue Library

For Mandarin urban short-drama prompts, read
`references/mandarin-dialogue-guidelines.md` and
`assets/mandarin_urban_dialogue_database.json`.

Use the bundled `120`-line Mandarin database for stable sampling across:

```text
冷淡疏离、压迫掌控、隐忍委屈、决绝分手、复仇反击、身份揭晓、
试探怀疑、温柔安慰、家庭冲突、职场交锋、危机催促、轻喜日常
```

Choose a stored line when stable batch production matters. For fresh dialogue,
use stored lines as few-shot style references and ask the LLM to write a new
line without copying.

Sample reproducibly:

```bash
python scripts/select_mandarin_dialogue.py \
  --category "职场交锋" \
  --count 3 \
  --seed 20260531
```

Build an LLM instruction for a fresh line:

```bash
python scripts/build_mandarin_dialogue_instruction.py \
  --category "隐忍委屈" \
  --character-persona "都市女律师，外冷内伤" \
  --relationship "面对隐瞒真相的前男友" \
  --emotion "失望但克制"
```

## Deterministic Script

For single prompts:

```bash
python scripts/build_talking_video_prompt.py \
  --line-text "你终于来了。" \
  --accent "普通话" \
  --age-feel "成熟感" \
  --gender-presentation "中性表达" \
  --pitch "偏高音高" \
  --timbre "冷淡" \
  --speed "偏慢语速" \
  --articulation "语气强势" \
  --emotion "坚定" \
  --breath-pause "开口前停顿半秒，语气稳定"
```

For batch CSV:

```bash
python scripts/build_talking_video_prompt.py \
  --input-csv characters.csv \
  --output-csv talking-video-prompts.csv
```

Read `references/prompt-patterns.md` when creating a first-frame prompt,
reviewing failed generations, or explaining field-level adjustments.

Use a stored dialect intent:

```bash
python scripts/build_talking_video_prompt.py \
  --accent "四川话" \
  --dialect-mode light \
  --intent question_hide
```

Localize an exact matching Mandarin line:

```bash
python scripts/build_talking_video_prompt.py \
  --accent "粤语" \
  --line-text "你为什么不告诉我？" \
  --localize-line
```
