<div align="center">

# 🎬 Patrick's AI Creation Skills

> *"一个人 + 一套 Skill = 一条内容生产线"*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Skills](https://img.shields.io/badge/Skills-4-00ff00)](.)
[![Platform](https://img.shields.io/badge/Platform-Qwen%20Agent-6366f1)](.)

<br>

**AIGC 短剧 / 视频 / 视觉创作的开源 Skill 集合。**<br>
**从造角色、让角色开口说话，到给照片加追踪框特效 — 全链路 prompt 驱动。**

</div>

---

## 🗂️ 技能矩阵

<table>
<tr>
<td width="50%" valign="top">

### 🎭 character-library-generator
**千人千面角色库生成器**

366 原型 × 14 维 Face DNA = **29.7 亿种面孔**

- 18 个题材（都市/古装/穿越/玄幻...）
- 批内查重保证每人不一样
- 输出可直接用于 Gemini / QCreate 生图

```
传入 → 题材 + 数量
产出 → N 条四视图定妆照 prompt
```

[📖 SKILL.md](character-library-generator/SKILL.md)

</td>
<td width="50%" valign="top">

### 🗣️ character-talking-video-prompt-builder
**角色说话视频 Prompt 构建器**

Voice DNA 8 维 + 12 种情绪 + 8 种方言

- 传一张角色图 → 生成 10 秒说话视频 prompt
- 原生语音，无 BGM/音效/字幕
- 支持单条和批量 CSV

```
传入 → 角色图 + 台词
产出 → 可直接投喂视频模型的 prompt
```

[📖 SKILL.md](character-talking-video-prompt-builder/SKILL.md)

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 📸 lookbook-fx
**监控追踪风时尚效果图生成器**

传照片 → AI 识别服装 → 自动出追踪框效果图

- 人脸检测自动定位框框
- 视觉识别自动填充服装标签
- 可自定义：名字/颜色/品牌/关键词
- 含 setup.sh 一键部署

```
传入 → 人物照片（+ 可选自定义参数）
产出 → 1400×1900 高清追踪框效果图
```

<img src="lookbook-fx/preview.jpg" width="260" />

[📖 SKILL.md](lookbook-fx/SKILL.md)

</td>
<td width="50%" valign="top">

### 📸 realistic-cast-generator
**真实感角色选角生成器**

三段式 × 双链路，14 维五官词池，96 套服装

- 210+ 组验证，真人质感方法论
- 支持古装/都市/奇幻/IP角色
- 134 条预置角色库

```
传入 → 题材 + 角色数量
产出 → 高质感真实人像 prompt
```

[→ 独立仓库](https://github.com/patrickqing20-cell/realistic-cast-generator)

</td>
</tr>
</table>

---

## 🔗 创作链路

```
Step 1                    Step 2                    Step 3
造角色                     开口说话                   视觉包装
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  character-      │     │  character-      │     │                  │
│  library-        │────→│  talking-video-  │     │  lookbook-fx     │
│  generator       │     │  prompt-builder  │     │                  │
│                  │     │                  │     │  传照片→追踪框   │
│  366原型×14维DNA │     │  Voice DNA+情绪  │     │  效果图          │
└──────────────────┘     └──────────────────┘     └──────────────────┘
         │
         ↓
┌──────────────────┐
│  realistic-cast- │
│  generator       │
│                  │
│  真人质感角色    │
└──────────────────┘
```

---

## 🚀 快速开始

每个 Skill 都是 **prompt-type**，装进任何支持 Skill 的 Agent 即可使用：

```bash
# 1. Clone
git clone https://github.com/patrickqing20-cell/Patrick.git

# 2. 选一个 Skill 安装
#    以 lookbook-fx 为例：
cd Patrick/lookbook-fx
bash setup.sh          # 自动检查 + 安装依赖

# 3. 对 Agent 说触发词
#    "lookbook" + 传图  → 出追踪框效果图
#    "千人千面 都市爱情 生成5个角色"  → 出角色 prompt
```

### 环境要求

| 要求 | 说明 |
|------|------|
| Agent 平台 | 千问宝子 / 任何支持 SKILL.md 的 Agent |
| 模型能力 | 需要 LLM（文本生成）；lookbook-fx 额外需要多模态（视觉） |
| 运行环境 | 宝子沙箱（lookbook-fx 需要 Chromium + Node.js） |

---

## 📁 仓库结构

```
Patrick/
├── README.md
├── LICENSE
├── character-library-generator/        # 🎭 千人千面角色库
│   ├── SKILL.md
│   ├── assets/                         # 角色原型 + Face DNA 词池
│   ├── references/                     # 参考文档
│   └── scripts/                        # 批量生成脚本
├── character-talking-video-prompt-builder/  # 🗣️ 说话视频 Prompt
│   ├── SKILL.md
│   ├── agents/                         # Agent 配置
│   ├── assets/                         # Voice DNA 词池
│   ├── references/                     # 参考文档
│   └── scripts/                        # 批量生成脚本
└── lookbook-fx/                        # 📸 追踪框效果图
    ├── SKILL.md
    ├── render.js                       # Puppeteer 渲染脚本
    ├── setup.sh                        # 一键部署
    ├── preview.jpg                     # 效果预览
    └── public/
        ├── lookbook-fx.html            # 前端页面
        └── face-models/               # face-api.js + 人脸模型
```

---

## 关于

**Patrick / 青山** — AI 创作工具链构建者

每个 Skill 都从实际生产需求中长出来，经过真实任务验证。

<div align="center">

*角色不能长一个样。台词不能念一个调。效果图不能没有追踪框。*

MIT License © Patrick

</div>
