# Character Talking Video Prompt Builder

> 「一张角色图，一句话，生成 10 秒真人说话视频 Prompt。」

把角色立绘 + 一句台词，变成可直接粘贴到视频模型的完整 Prompt。支持普通话、粤语、四川话、东北话等多方言本地化，内置 120 条都市短剧台词库。

基于开放的 Agent Skills 协议，可在 Claude Code、Codex、Cursor、OpenClaw、Qoder 等 50+ 兼容 runtime 中运行。

[效果示例](#效果示例) · [安装](#安装) · [使用方法](#使用方法) · [核心能力](#核心能力) · [工作原理](#工作原理)

---


## 效果示例

```
输入图片：9:16 竖屏半身人像
输入台词：「你终于来了。」

输出 Prompt ↓

【主体】一位成熟男性，面部清晰可见，表情从平静转为微微皱眉
【镜头】固定机位中近景，极缓慢推进，人物占画面 60-70%
【表演】角色微微抬起头，嘴唇自然开合说出对白，眼神从期待变为失望
【对白】"你终于来了。"——普通话，成熟男性嗓音，偏低音高，语速偏慢，
       语气冷淡而克制，开口前停顿半秒
【声音】仅人声对白，无背景音乐，无音效，无环境音
【音频限制】不添加字幕、文字覆盖或水印
【禁止】不做夸张肢体动作，不转头，不添加其他角色

推荐设置：
  Generate audio: true
  Aspect ratio: 9:16
  Duration: 10 seconds
  Resolution: 720p
```

方言本地化示例——同一句台词，四川话版本：

```
输入台词：「你为什么不告诉我？」
方言模式：四川话 · light

输出台词：「你咋个不给我说嘛？」
——保留原意，替换为四川话常用表达，语气自然不生硬
```


---


## 安装

### 方式一：一行命令（推荐）

打开你正在用的 Agent（Claude Code、Codex、Cursor、Qoder 等），告诉它：

```
帮我安装这个 skill：https://github.com/patrickqing20-cell/Patrick
```

或者用通用 CLI 安装器：

```bash
npx skills add patrickqing20-cell/Patrick
```

### 方式二：手动安装

```bash
git clone https://github.com/patrickqing20-cell/Patrick.git
```

将 `character-talking-video-prompt-builder` 目录复制到你使用的 runtime 的 skills 目录：

| Runtime | 安装路径 |
| --- | --- |
| Claude Code | `~/.claude/skills/character-talking-video-prompt-builder/` |
| Codex CLI | `~/.codex/skills/character-talking-video-prompt-builder/` |
| Cursor | `~/.cursor/skills/character-talking-video-prompt-builder/` |
| OpenClaw | `~/.openclaw/workspace/skills/character-talking-video-prompt-builder/` |
| Qoder | `.qoder/skills/character-talking-video-prompt-builder/` |


---


## 使用方法

装好后，告诉 Agent：

```
> 把这张角色图做成说话视频，台词是「我等了你三年」
> 帮我批量生成 5 个角色的说话视频 Prompt
> 用粤语版本重新生成这段对白
> 帮我写一段四川话的短剧台词
```


---


## 核心能力

### 七大模块 Prompt 构建

每个输出严格遵循固定结构，确保视频模型理解一致：

| 模块 | 说明 |
| --- | --- |
| 【主体】 | 角色外貌、表情变化 |
| 【镜头】 | 固定机位中近景 + 极缓慢推进 |
| 【表演】 | 动作幅度克制，嘴唇自然开合 |
| 【对白】 | Voice DNA 完整描述（音色/音高/语速/情绪） |
| 【声音】 | 仅人声，无 BGM / 音效 / 环境音 |
| 【音频限制】 | 无字幕、无文字覆盖 |
| 【禁止】 | 不做夸张动作、不添加角色 |

### 方言本地化

不是简单加口音标签，而是真正改写台词表达：

| 验证等级 | 方言 |
| --- | --- |
| 高可靠 | 普通话、粤语、香港粤语中英夹杂、四川话、东北话 |
| 中可靠 | 河南话风格、陕西话风格、湖南话风格、山东话风格 |
| 实验性 | 上海话风格 |

两种模式：
- **light**（默认）：保留普通话骨架，点缀方言词汇
- **strong**：深度方言改写，适合地域特色强烈的场景

### 120 条都市短剧台词库

覆盖 12 种经典短剧情绪场景：

```
冷淡疏离 · 压迫掌控 · 隐忍委屈 · 决绝分手
复仇反击 · 身份揭晓 · 试探怀疑 · 温柔安慰
家庭冲突 · 职场交锋 · 危机催促 · 轻喜日常
```

可选择已有台词保证批量稳定性，也可以台词库为风格参考让 LLM 生成新台词。

### 批量 CSV 输出

一次处理整个角色库，输出可直接导入视频平台的 CSV：

```bash
python scripts/build_talking_video_prompt.py \
  --input-csv characters.csv \
  --output-csv talking-video-prompts.csv
```

输出字段：`character_id, image_path, source_line_text, line_text, accent, dialect_mode, prompt, Generate audio, Aspect ratio, Duration, Resolution, Seed`


---


## 工作原理

这个 Skill 不调用任何付费 API，纯 Prompt 工程。工作流程：

1. **图片校验** —— 检查是否为 9:16 单人中近景，嘴部无遮挡，背景简洁
2. **Voice DNA 推断** —— 从角色形象推断音色、音高、语速等缺失字段
3. **Prompt 构建** —— 按七大模块严格组装，确保视频模型可理解
4. **方言本地化** —— 匹配方言数据库，生成自然地道的本地化台词
5. **输出格式化** —— 单条 Prompt 或批量 CSV，可直接复制使用

默认参数锁定：

```
时长：10 秒
画面比例：9:16
镜头：单人中近景 + 固定机位极缓推进
音频：仅人声对白
音乐/音效/环境音：无
字幕/文字：无
```


---


## 仓库结构

```
character-talking-video-prompt-builder/
├── SKILL.md                              # Skill 主文件（Prompt 工程核心）
├── agents/
│   └── openai.yaml                       # OpenAI Agent 配置
├── assets/
│   ├── dialect_line_database.json        # 方言台词数据库
│   ├── dialect_line_database.csv         # 方言台词数据库（CSV 版）
│   ├── language_generation_rules.json    # 语言生成规则
│   ├── mandarin_urban_dialogue_database.json  # 普通话都市台词库（120条）
│   └── mandarin_urban_dialogue_database.csv   # 普通话都市台词库（CSV 版）
├── references/
│   ├── prompt-patterns.md               # Prompt 模板与模式
│   ├── dialect-guidelines.md            # 方言本地化指南
│   └── mandarin-dialogue-guidelines.md  # 普通话台词创作指南
└── scripts/
    ├── build_talking_video_prompt.py     # 核心：生成说话视频 Prompt
    ├── build_llm_localization_instruction.py  # 生成方言本地化指令
    ├── build_mandarin_dialogue_database.py    # 构建普通话台词库
    ├── build_mandarin_dialogue_instruction.py # 生成普通话台词创作指令
    ├── export_dialect_database.py             # 导出方言数据库
    └── select_mandarin_dialogue.py            # 从台词库采样
```


---


## 关于作者

**Patrick 青山** — AI 效果运营 @ 阿里巴巴夸克，专注于 AI 生图生视频的创作工具与 Prompt 工程。

| 平台 | 链接 |
| --- | --- |
| 🐙 GitHub | [patrickqing20-cell](https://github.com/patrickqing20-cell) |


---


## 许可证

MIT — 随便用，随便改，随便造。
