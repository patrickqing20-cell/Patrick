# Mandarin Urban Short-Drama Dialogue Guidelines

## Database

Read `assets/mandarin_urban_dialogue_database.json`.

The bundled database contains `120` Mandarin dialogue lines across `12`
high-frequency urban short-drama categories:

```text
冷淡疏离
压迫掌控
隐忍委屈
决绝分手
复仇反击
身份揭晓
试探怀疑
温柔安慰
家庭冲突
职场交锋
危机催促
轻喜日常
```

Each row includes:

```text
dialogue_id
category_id
category_name
role_tags
emotion
intensity
line_text
acting_note
duration_hint
```

## Selection Rules

1. Choose the category from the current dramatic purpose.
2. Match the line to the character persona and relationship.
3. Prefer medium intensity unless the plot explicitly requires escalation.
4. Use one line per 10-second clip.
5. Keep the acting note restrained and compatible with a medium close-up.
6. Avoid repeated lines inside the same character batch.

## Stable Sampling

```bash
python scripts/select_mandarin_dialogue.py \
  --category "职场交锋" \
  --count 3 \
  --seed 20260531
```

## LLM Expansion

Use database lines as few-shot style references when generating fresh
dialogue. Do not copy them verbatim.

```bash
python scripts/build_mandarin_dialogue_instruction.py \
  --category "隐忍委屈" \
  --character-persona "都市女律师，外冷内伤" \
  --relationship "面对隐瞒真相的前男友" \
  --emotion "失望但克制"
```
