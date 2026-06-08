<div align="center">

# 🎬 Patrick's AI Creation Skills

> *"一个人 + 一套 Skill = 一条短剧生产线"*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Prompt Only](https://img.shields.io/badge/Prompt_Only-No_API_Cost-brightgreen?style=flat-square)](#)
[![Skills](https://img.shields.io/badge/Skills-2-blueviolet?style=flat-square)](#技能列表)

<br>

**AIGC 短剧 / 视频创作的开源 Skill 集合。**<br>
**从造角色到让角色开口说话，用 prompt 解决「最后一公里」。**

<br>

[技能列表](#技能列表) · [安装](#安装) · [链路全景](#链路全景)

</div>

---

## 技能列表

| # | Skill | 一句话 | 详情 |
|---|-------|--------|------|
| 1 | [character-library-generator](#-千人千面随机角色库生成器) | 366 个原型 × 14 维 Face DNA，批量生成独一无二的角色 | [→ 跳转](#-千人千面随机角色库生成器) |
| 2 | [character-talking-video-prompt-builder](#-视频台词-prompt-生成器) | 让 AI 生成的角色说话像真人 | [→ 跳转](#-视频台词-prompt-生成器) |

---

## 链路全景

两个 Skill 构成「造角色 → 角色开口说话」的完整链路：

```
Step 1                          Step 2                          Step 3
千人千面角色库生成器              角色定妆照                      视频台词 Prompt
┌──────────────────┐            ┌──────────────┐               ┌──────────────────┐
│ 366 原型          │  prompt   │              │  image        │ Voice DNA 8 维    │
│ × 14 维 Face DNA  │ ───────→ │  生图模型     │ ───────────→ │ + 情绪 + 方言     │
│ × 批内查重        │           │  (可灵/QCreate)│              │ = 说话视频 Prompt  │
└──────────────────┘            └──────────────┘               └──────────────────┘
character-library-generator                              character-talking-video-
                                                          prompt-builder
```

---

# 🎭 千人千面随机角色库生成器

> `character-library-generator/`

[![Face DNA](https://img.shields.io/badge/Face_DNA-14_Dimensions-blueviolet?style=flat-square)](#face-dna-14-维)
[![Archetypes](https://img.shields.io/badge/Archetypes-366-blue?style=flat-square)](#18-个题材-366-个原型)
[![Combinations](https://img.shields.io/badge/Combinations-29.7_Billion-orange?style=flat-square)](#face-dna-14-维)

**批量生成面部特征独一无二的短剧角色四视图定妆照 prompt。**

市面上没有同类工具。

---

### 它解决什么问题

| 😐 痛点 | 🎯 解法 |
|---------|---------|
| 批量生图角色全长一个样 | Face DNA 14 维随机组合，**29.7 亿种**面孔 |
| 同一批角色五官撞脸 | 批内查重：任意两角色 DNA 相同维度不超过 6 个 |
| 角色类型重复，缺乏多样性 | **366 个原型**覆盖 18 个短剧题材 |
| 换个种子结果就不可控 | 固定 seed → 结果 100% 可复现 |
| 角色和服装风格不搭 | 兼容规则自动适配年龄/性别/时代 |

---

### 效果示例

**输入：**
```bash
python3 scripts/generate_character_prompts.py \
  --category "穿越千禧年" --count 3 --seed 20260608 --output demo.csv
```

**输出（3 个角色，每个面部特征完全不同）：**

```
角色 1: 千禧辣妹, 22岁女性, 163cm
  Face DNA: 心形脸 / 柔和弧形眉 / 圆润外双眼 / 眼距略宽 /
           鼻梁中高挺直 / 饱满唇型 / 中等贴面耳廓 / 暖白自然肤色 /
           鼻梁浅雀斑 / 双马尾 / 亮棕色 / 发际线自然圆润 / 虎牙

角色 2: 网吧老板, 28岁男性, 178cm
  Face DNA: 偏长椭圆脸 / 略浓上挑眉 / 细长单眼皮 / 眼距适中 /
           鼻梁偏低鼻头较宽 / 横向偏宽唇型 / 较大外扩耳廓 / 健康小麦色 /
           保留自然毛孔 / 短寸头 / 自然乌黑色 / 额角有少量碎发 / 左侧鼻翼浅色小痣

角色 3: 重生千禧女主, 25岁女性, 166cm
  Face DNA: 宽颧骨菱形脸 / 自然平直眉 / 中等大小内双眼 / 眼距略近 /
           鼻梁中等高度鼻头圆润 / 小巧唇型 / 偏小狭长耳廓 / 冷白调肤色 /
           眼下轻微细纹 / 齐肩波波头 / 深棕黑色 / 中分遮额 / 笑起来右侧嘴角略高
```

每个角色都是独一无二的面孔，**不是换个发型换个衣服就完事**。

---

### Face DNA 14 维

| 维度 | 选项数 | 示例 |
|------|:------:|------|
| 脸型 | 10 | 偏短圆脸 / 心形脸 / 宽颧骨菱形脸 / 偏长椭圆脸 |
| 额头颧骨 | 8 | 额头中等宽度，颧骨平缓 / 额头较宽，颧骨柔和 |
| 眉 | 8 | 自然平直眉 / 柔和弧形眉 / 略浓上挑眉 |
| 眼 | 8 | 细长单眼皮 / 中等大小内双眼 / 圆润外双眼 |
| 眼距 | 5 | 适中 / 略宽 / 略近 |
| 鼻 | 8 | 鼻梁中高挺直 / 鼻梁偏低鼻头较宽 |
| 唇 | 8 | 饱满唇型 / 小巧唇型 / 横向偏宽 |
| 耳 | 8 | 中等贴面 / 偏小狭长 / 较大外扩 |
| 肤色 | 8 | 暖白自然 / 健康小麦色 / 冷白调 |
| 肤质 | 9 | 自然毛孔 / 鼻梁浅雀斑 / 眼下细纹 |
| 发型 | 14 | 齐肩波波头 / 锁骨层次发 / 短寸头 |
| 发色 | 10 | 自然乌黑 / 深棕黑 / 茶棕色 / 亮棕色 |
| 发际线 | 9 | 自然圆润 / 额角碎发 / 额角轻微后移 |
| 独特特征 | 12 | 左侧鼻翼浅色小痣 / 虎牙 / 笑起来嘴角不对称 |

**理论组合数 ≈ 29.7 亿种面孔。**

---

### 18 个题材 366 个原型

| 题材 | 原型数 | 示例角色 |
|------|:------:|---------|
| 都市爱情 | 26 | 霸道总裁、职场精英女、契约丈夫 |
| 男频逆袭 | 22 | 上门女婿、退伍特种兵、快递员 |
| 甜宠 | 24 | 小奶狗男友、温柔竹马、暗恋备胎 |
| 宫斗宅斗 | 22 | 嫡女、侧妃、通房丫头、正妻主母 |
| 古风权谋 | 20 | 大将军、权臣、傀儡太子、锦衣卫 |
| 古风爱情 | 21 | 联姻公主、落难世子、穿越者 |
| 穿越千禧年 | 12 | 重生千禧女主、千禧辣妹、网吧老板 |
| 玄幻仙侠 | 20 | — |
| 悬疑推理 | 20 | — |
| 校园青春 | 20 | — |
| 女性成长 | 23 | — |
| 家庭伦理 | 20 | — |
| 年代/种田 | 21 | — |
| 民国/谍战 | 20 | — |
| 都市玄幻 | 21 | — |
| 都市脑洞 | 19 | — |
| 奇幻脑洞 | 20 | — |
| 萌宝/亲子 | 15 | — |

---

### 输出格式

每条输出包含：

- ✅ **四视图定妆照 prompt**（16:9，可直接粘贴到生图模型）
- ✅ **视频锚点 prompt**（9:16 竖屏胸上图，交给说话视频 Skill）
- ✅ **完整元数据**（Face DNA JSON、角色属性、种子号）

支持 CSV（Excel 友好）和 JSON 两种格式。

---

### 使用方式

```bash
# 指定题材 + 数量 + 种子
python3 scripts/generate_character_prompts.py \
  --category "都市爱情" --count 30 --seed 20260608 --output prompts.csv

# 穿越千禧年，简化输出
python3 scripts/generate_character_prompts.py \
  --category "穿越千禧年" --count 20 --seed 12345 --simple --output prompts.csv

# 全题材随机 50 个角色
python3 scripts/generate_character_prompts.py \
  --count 50 --seed 99999 --output all.json
```

或者在 Agent 里直接说：

```
给我生成 20 个都市爱情角色，要千人千面不能撞脸
```

```
穿越千禧年题材，30 个角色，导出 CSV
```

---

### 仓库结构

```
character-library-generator/
├── SKILL.md                              # 核心文档
├── assets/
│   ├── role_archetypes.json              # 366 个角色原型
│   ├── face_dna_pools.json               # 14 维 Face DNA 特征池
│   └── compatibility_rules.json          # 年龄/性别兼容规则
├── references/
│   ├── archetype_guide.md                # 原型使用指南
│   ├── face_dna_spec.md                  # Face DNA 规范
│   └── prompt_template_spec.md           # Prompt 模板规范
└── scripts/
    ├── generate_character_prompts.py     # 批量生成脚本
    └── validate_character_prompts.py     # 质量校验脚本
```

---

# 🎙️ 视频台词 Prompt 生成器

> `character-talking-video-prompt-builder/`

[![Voice DNA](https://img.shields.io/badge/Voice_DNA-8_Dimensions-blueviolet?style=flat-square)](#voice-dna-8-维)
[![Emotions](https://img.shields.io/badge/Emotions-12_Scenes-red?style=flat-square)](#12-种情绪场景)
[![Dialects](https://img.shields.io/badge/Dialects-8_Supported-orange?style=flat-square)](#方言本地化)

**把一张角色图 + 一句台词，变成带情绪、语气、停顿、气口的 speaking-video prompt。**

适用于可灵、Wan、Seedance 等视频模型的「人物开口」场景。<br>
不生成视频，只负责把「人物说话这一刻」写对、写真、写活。

---

### 效果示例

#### 示例一：都市情感 — 质问

**普通 prompt：**

```
一个年轻女生看着镜头说：你为什么不告诉我？
```

**强化后：**

```
【主体】都市青年女性，28岁，五官精致但此刻眉头微蹙，眼眶泛红但没有流泪
【镜头】9:16竖屏，中近景，固定机位极缓慢推进，人物居中直视镜头
【表演】开口前停顿半秒，先压住一口气，眼神从回避到直视。前半句语速偏慢，
       像在确认自己没有听错；后半句咬字明显变重，尾音轻微发颤。
       不喊叫、不崩溃，保持体面中的受伤感。下巴微微收紧，嘴角向下绷住
【对白】你为什么不告诉我？
【声音】中高音域清亮但此刻压低了半个调，咬字克制精准，气声偏重，
       尾音有不自觉的颤抖。语速偏慢，每个字之间有明显的犹豫间隙
【音频限制】仅人声对白，无BGM，无环境音，无音效
【禁止】无字幕，无多余台词，无第二人出现
```

差别不在「说了什么」，在**怎么说**。

---

#### 示例二：古装权谋 — 压迫

**普通 prompt：**

```
一个古装男人冷冷地说：急什么，棋还没下完呢。
```

**强化后：**

```
【主体】中年男性，45岁，身着暗色官袍，面容沉稳不怒自威
【镜头】9:16竖屏，中近景，固定机位，人物微偏三分面
【表演】嘴角挂着一丝若有若无的笑意，但眼底没有任何温度。
       「急什么」语速极慢，每个字像棋子落盘；
       「棋还没下完呢」尾音微微上扬，带一丝看透一切的不屑
【对白】急什么，棋还没下完呢。
【声音】中低音域浑厚沉稳，声线有砂砾质感。字正腔圆的古装配音腔，
       语速极慢，气息绵长，每个字之间有刻意的停顿
【音频限制】仅人声对白，无BGM，无环境音，无音效
【禁止】无字幕，无多余台词，无第二人出现
```

---

#### 示例三：港式中英夹杂

**普通 prompt：**

```
一个女生用港式腔调说：你回来以后给我打电话。
```

**强化后（方言本地化 · light）：**

```
【对白】你返嚟之后call我。
【声音】港式粤语节奏快而清晰，「返嚟」自然连读，「call」轻咬不强调
```

---

### Voice DNA 8 维

| 维度 | 示例值 | 作用 |
|------|--------|------|
| `age_feel` | 青年感 / 成熟感 / 年长感 | 声线基底 |
| `gender` | 女性 / 男性 / 中性 | 音域范围 |
| `pitch` | 偏低 / 中等 / 偏高 | 音高 |
| `timbre` | 温润 / 冷淡 / 沙哑 / 清亮 / 厚重 | 声音质感 |
| `speed` | 偏慢 / 中等 / 略快 | 语速节奏 |
| `articulation` | 清晰 / 松弛 / 克制 / 强势 | 咬字风格 |
| `emotion` | 平静 / 坚定 / 委屈 / 犹豫 / 压迫 | 情绪基调 |
| `breath_pause` | 开口前停顿半秒 | 气口设计 |

---

### 12 种情绪场景

内置 **120 条** 都市短剧台词库：

```
冷淡疏离 · 压迫掌控 · 隐忍委屈 · 决绝分手
复仇反击 · 身份揭晓 · 试探怀疑 · 温柔安慰
家庭冲突 · 职场交锋 · 危机催促 · 轻喜日常
```

---

### 方言本地化

| 方言 | 验证度 | 示例 |
|------|:------:|------|
| 普通话 | 🟢 高 | 你为什么不告诉我？ |
| 粤语 | 🟢 高 | 你点解唔话我知？ |
| 港式中英夹杂 | 🟢 高 | 你返嚟之后 call 我 |
| 四川话 | 🟢 高 | 你啷个不跟我说嘛？ |
| 东北话 | 🟢 高 | 你咋不告诉我呢？ |
| 河南话 | 🟡 中 | 你咋不给我说嘞？ |
| 陕西话 | 🟡 中 | 你咋不给我说呢么？ |
| 湖南话 | 🟡 中 | 你哪门子不跟我讲？ |

---

### 输出格式

7 段结构，可直接粘贴到视频模型 prompt 框：

```
【主体】【镜头】【表演】【对白】【声音】【音频限制】【禁止】
```

也支持批量 CSV 输出。

---

### 仓库结构

```
character-talking-video-prompt-builder/
├── SKILL.md                          # 核心文档
├── agents/openai.yaml
├── assets/
│   ├── dialect_line_database.json    # 方言台词库
│   ├── mandarin_urban_dialogue_database.json  # 120 条都市台词库
│   └── language_generation_rules.json
├── references/
│   ├── prompt-patterns.md
│   ├── mandarin-dialogue-guidelines.md
│   └── dialect-guidelines.md
└── scripts/
    ├── build_talking_video_prompt.py
    ├── build_mandarin_dialogue_instruction.py
    ├── build_llm_localization_instruction.py
    └── select_mandarin_dialogue.py
```

---

## 安装

### 方式一：告诉你的 Agent

```
帮我安装这个 skill：https://github.com/patrickqing20-cell/Patrick
```

### 方式二：手动 clone

```bash
git clone https://github.com/patrickqing20-cell/Patrick.git
```

每个 Skill 在独立目录下，按需使用。

---

## 它们不做什么

- ❌ **不生成图片 / 视频** — 只输出 prompt
- ❌ **不调用付费 API** — 零成本
- ❌ **不替你写剧本** — 只管视觉资产和说话表演
- ❌ **不保证 100% 还原** — 但显著提升生成质量

---

## 关于

**Patrick / 青山** — AI 创作工具链构建者

专注 AIGC 视频生产链路中的「最后一公里」：让 AI 生成的角色不只是动起来，而是**活过来**。

---

<div align="center">

角色不能长一个样。台词不能念一个调。<br><br>
**千人千面造角色，有血有肉说台词。**

<br>

MIT License © Patrick

</div>
