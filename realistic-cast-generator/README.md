# 🎬 Realistic Cast Generator

> **真实感角色选角 Prompt 生成器**
>
> 让你的短剧创作再也不缺真实的角色。像选角导演一样，为每个角色生成写实影视级人像 Prompt——有真实的毛孔、雀斑和皱纹，而不是千篇一律的 AI 磨皮美颜脸。

## ✨ 核心能力

- 🎯 **三段式 × 双链路** Prompt 模板（现代装链路A + 古装防CG链路B）
- 🧬 **14 维英文五官词池**（10 亿+ 种独特面孔组合）
- 👘 **96 套英文服装词池**（古装 52 套 + 千禧年代 44 套，从实拍参考图逐张视觉分析提炼）
- 🚫 **CG 触发词替换表**（9 条核心替换规则，防止古装华服触发 3D 渲染风格）
- 📊 **年龄适配瑕疵查表**（15-22/23-35/36-50/50+ 四档，自动匹配皱纹/斑点/胡茬）
- 📦 **批量生成脚本**（输入 JSON → 自动判链路 → 查瑕疵表 → 输出 xlsx）

## 🔬 验证规模

- ✅ 验证模型：Gemini 3 Pro
- ✅ 实战验证：**210+ 组**角色资产图
- ✅ 覆盖 **13 个短剧题材**（都市商战/宫斗宅斗/古风权谋/穿越千禧年/年代种田/悬疑推理/民国谍战...）
- ✅ 多人协作评审通过率分析

## 📁 文件结构

```
realistic-cast-generator/
├── README.md                    ← 本文件
├── SKILL.md                     ← 完整方法论（398行）
├── assets/
│   ├── face_dna_en.json         ← 14维英文五官词池
│   ├── outfit_ancient.json      ← 古装服装词池（52套）
│   ├── outfit_millennium.json   ← 千禧年代服装词池（44套）
│   └── cg_replace.json          ← CG触发词替换表
├── scripts/
│   └── assemble_prompts.py      ← 批量生成脚本（JSON → xlsx）
└── examples/
    └── sample_10.json           ← 10组示例角色
```

## 🚀 Quick Start

### 方式一：给我一句话角色设定

直接描述你要的角色，输出完整可粘贴的 Prompt：

```
用户：帮我生成一个 28 岁退伍特种兵的角色资产图 prompt
```

### 方式二：批量生成

```bash
python3 scripts/assemble_prompts.py input.json output.xlsx
```

输入 JSON 格式：
```json
[
  {
    "idx": 1,
    "genre": "都市商战",
    "name": "霸道总裁",
    "gender": "male",
    "age": 36,
    "height": 183,
    "body_type": "tall lean",
    "route": "A",
    "character": "angular square jaw, thick straight eyebrows...",
    "outfit": "charcoal double-breasted suit jacket..."
  }
]
```

## 🧪 核心发现

| 维度 | 结论 |
|------|------|
| 语言 | **英文 > 中文**（细节响应更好） |
| 格式 | **自然语言 > JSON**（模型理解更直接） |
| 肤质 | **哑光 > 油光**（油光暴露 AI 感） |
| 质感词 | **`raw` > `realistic`**（raw = 未修图原始质感） |
| 反向锚定 | **`anti-sweet, anti-influencer` 有效** |
| 古装 CG | **brocade + gold embroidery 触发 CG**，需用链路 B 抑制 |

## 📐 三段式模板结构

```
[第一段：画面结构（固定模板）]
A 16:9 character asset sheet. Left 1/3 is a face close-up...

[第二段：角色 + 服装（变量）]
Character: {age}-year-old {gender}, {五官8-10个特征词}...
Outfit: {服装4-6个核心视觉词}...

[第三段：质感模块（固定骨架 + 年龄瑕疵）]
Hyper-realistic raw skin texture. Bare skin, no makeup...
{age_specific_imperfections}
Anti-sweet, anti-influencer aesthetic...
```

### 双链路选择

| 链路 | 适用场景 | 差异 |
|------|---------|------|
| **A** | 现代装/简洁古装/年代装 | 标准三段式 |
| **B** | 古装权贵/华丽礼服 | 质感前置 + 影视剧定妆照锚定 + CG 触发词替换 |

**判断规则**：服装含华丽元素（织锦/金绣/龙纹/凤冠）→ 链路 B，否则 → 链路 A

## 📊 评审数据洞察（210+ 组实战）

| 发现 | 数据 |
|------|------|
| 男性 OK率 60%，女性 44% | 女性角色容易"千篇一律"美颜脸 |
| 36-50岁 OK率 68%，15-22岁 40% | 越老越好画，皱纹辨识度高 |
| 链路B 不OK率仅 11% | 古装防CG链路效果显著 |
| "有特征的脸" > "好看的脸" | 外卖骑手全票OK，职场女强人全票不OK |

## 📜 License

MIT
