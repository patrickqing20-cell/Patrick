# 🛍️ 商品详情图 & 轮播图生成 Skill

> **AI 自动生成电商平台商品图，14 张图一键搞定**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.1-blue.svg)](https://github.com/patrickqing20-cell/Patrick/tree/main/goods-images)

---

## 📌 简介

这是一个为 AI Agent 设计的电商图片生成 Skill，可以根据用户提供的**商品图片 + 简单描述**，自动生成完整的电商平台商品图：

- **5 张轮播图**（800×800px）：模特/场景图 + 品牌 Logo + 卖点标签 + 促销活动条
- **9 张详情图**（790×1100px）：主图封面、核心卖点、细节标注、使用场景、规格参数、尺码表、售后保障

**核心优势**：
- ✅ **商品保真**：AI 生成的底图传入用户原图作为参考，商品外观零偏差
- ✅ **中文完美**：所有文字用 PIL（Python Imaging Library）程序化渲染，不变形不缺笔画
- ✅ **自动化**：从商品分析到图片生成全流程自动，用户零操作
- ✅ **多品类**：支持服饰/鞋类/3C 数码/家居/食品等全品类

---

## 🎯 适用场景

- 淘宝/天猫/京东商品上架
- 电商运营批量制图
- 商品详情页设计
- 营销活动策划图

---

## 🚀 快速开始

### 1. 安装 Skill

```bash
# 使用 LobeHub Market CLI
npx -y @lobehub/market-cli skills install openclaw-skills-goods-images --agent claude-code
```

或手动复制：
```bash
cp SKILL.md /你的agent目录/skills/goods-images/
```

### 2. 触发使用

向 AI Agent 说：
```
"帮我生成商品详情图"
"生成淘宝轮播图"
"做一套电商商品图"
```

然后：
1. 上传商品图片（1 张或多张）
2. 提供简单描述（如"男士卫衣，加绒保暖，秋冬款"）
3. Agent 自动生成 14 张图片并返回

---

## 📊 生成效果

### 轮播图（5 张）

| 序号 | 内容 | 示例 |
|------|------|------|
| 1-3 | 模特/场景图（不同角度+背景） | 正面/侧面/背面，城市/户外/室内 |
| 4 | 商品原图场景化 | 原图 + Logo + 卖点 + 活动条 |
| 5 | 白底商品特写 | 纯白背景 + Logo（无活动条） |

**每张图叠加**：
- 🏷️ 左上角：品牌 Logo（白色文字 + 阴影）
- 📌 左侧：卖点关键词竖排标签（如"加绒""保暖"）
- 🎯 底部：红色渐变活动条（如"1 件 9 折  3 件 85 折"）

### 详情图（9 张）

| 序号 | 类型 | 说明 |
|------|------|------|
| 1 | 主图封面 | 大标题 + 副标题 + 商品主图 |
| 2-4 | 核心卖点图 ×3 | 每个卖点一张（左右分栏布局） |
| 5 | 细节标注图 | 4 个标注点 + 连接线指向细节 |
| 6 | 使用场景 | 模特穿着/产品使用场景 |
| 7 | 规格参数表 | 表格布局（品名/材质/颜色等） |
| 8 | 尺码对照表 | 根据品类自动调整尺码范围 |
| 9 | 售后保障 | 4 个保障图标（正品/退换/退款/运费险） |

---

## 🛠️ 技术架构

### 生图方式（三层降级）

| 优先级 | 方案 | 做什么 | 中文文字效果 |
|--------|------|--------|------------|
| **1️⃣ 首选** | `generate_image` + **PIL 后处理** | AI 生成底图 → Python PIL 精确渲染中文 | ✅ 完美 |
| **2️⃣ 降级** | 纯 `generate_image` | AI 直接生成含文字的完整图 | ⚠️ 中文可能变形 |
| **3️⃣ 兜底** | HTML/CSS 渲染 + 截图 | 用代码排版后截图 | ✅ 完美（但慢） |

### PIL 叠加中文文字原理

```python
# 1. 创建透明叠加层（RGBA）
overlay = Image.new('RGBA', (800, 800), (0, 0, 0, 0))
draw = ImageDraw.Draw(overlay)

# 2. 画半透明黑底标签
draw.rounded_rectangle([16, 100, 120, 142], radius=6, fill=(0, 0, 0, 100))
#                                                      R  G  B  Alpha (100/255≈39%透明)

# 3. 画白色文字
font = ImageFont.truetype('/usr/share/fonts/.../NotoSansCJK.ttc', size=36)
draw.text((28, 105), "加绒保暖", fill=(255, 255, 255, 250), font=font)

# 4. Alpha 合成到底图
result = Image.alpha_composite(base_image, overlay)
```

**为什么不用 AI 生图写中文？**
- ❌ AI 生成的中文经常变形、缺笔画、乱码
- ✅ PIL 渲染 100% 正确，像素级精确控制

### 风格配色方案

| 风格 | 适用品类 | 配色 |
|------|---------|------|
| **简约高端** | 数码 3C、护肤品 | 背景 `#fafafa`, 文字 `#1a1a1a`, 点缀 `#c9a96e` |
| **营销促销** | 食品零食、百货 | 背景 `#fff`, 强调 `#e63946`, 点缀 `#ff6b35` |
| **种草生活** | 时尚服饰、美妆 | 背景 `#fdf8f3`, 文字 `#3d3024`, 点缀 `#c17a50` |
| **科技未来** | 电子产品 | 背景 `#0a0a0a`, 文字 `#fff`, 点缀 `#00d4ff` |

---

## 📁 文件结构

```
goods-images/
├── README.md          # 本文件
└── SKILL.md           # Skill 完整定义（496 行）
```

### SKILL.md 核心内容

| 章节 | 说明 |
|------|------|
| **Part 1: 商品分析** | 从图片/描述提取品类、卖点、风格、人群 |
| **Part 2: 风格判断** | 根据品类选择 4 种配色方案 |
| **Part 3: 轮播图生成** | 5 张图的 Prompt 模板 + PIL 后处理代码 |
| **Part 4: 详情图生成** | 9 张图的 Prompt 模板（主图/卖点/细节/场景/参数/尺码/售后） |
| **输出规范** | 文件命名、保存路径、展示方式 |

---

## 💡 使用示例

### 示例 1：男士卫衣

**输入**：
```
商品：男士连帽卫衣，加绒保暖，秋冬款
图片：[上传卫衣正面图]
品牌：YOUR BRAND
活动：1 件 9 折，3 件 85 折
```

**Agent 自动分析**：
- 品类：上衣（卫衣）
- 核心卖点：加绒、保暖
- 风格：种草生活（秋冬暖色调）
- 目标人群：成年男性
- 季节标签：秋冬上新（10-12 月自动判断）

**输出**：
- 5 张轮播图：3 张模特图（城市街头/户外/室内）+ 1 张原图场景化 + 1 张白底图
- 9 张详情图：封面 + 3 张卖点（加绒/保暖/连帽设计）+ 细节标注 + 穿着场景 + 规格表 + 尺码表（S-3XL）+ 售后保障

### 示例 2：儿童运动鞋

**输入**：
```
商品：儿童运动鞋，透气网面，轻便减震
图片：[上传鞋子图]
品牌：KIDS RUN
活动：满 199 减 30
```

**Agent 自动分析**：
- 品类：鞋子（儿童运动鞋）
- 核心卖点：透气、轻便、减震
- 风格：营销促销（红色强调）
- 目标人群：儿童
- 尺码范围：28-39 码（自动调整为儿童鞋码）

---

## 🔧 依赖环境

| 依赖 | 说明 | 必需 |
|------|------|------|
| `generate_image` 工具 | AI 生图能力 | ✅ 核心依赖 |
| Python PIL/Pillow | 后处理叠加中文文字 | ✅ 首选方案 |
| 中文字体文件 | Noto CJK / PingFang / 文泉驿 | ✅ 渲染中文必需 |
| `run_command` 工具 | 执行 Python 脚本 | ⚠️ 首选方案需要 |

**沙箱环境**：PIL 和中文字体通常已预装，`generate_image` 需要 Agent 平台支持。

---

## 📐 尺寸规范

| 图片类型 | 尺寸 | 用途 |
|---------|------|------|
| 轮播图 | 800×800px（正方形） | 商品主图/轮播展示 |
| 详情图 | 790×1100px（竖版） | 商品详情页长图 |

---

## 🎨 Prompt 模板示例

### 模特图（服饰类）
```
A 25-year-old Asian man model wearing men's hooded sweatshirt with fleece lining,
standing pose with hands in pockets, urban street background with brick wall,
upper body shot focusing on the hoodie,
e-commerce fashion photography,
soft natural lighting, professional catalog style, high resolution
```

### 细节标注图
```
Product detail annotation page, 790x1100px.
Center: full product photo of men's hooded sweatshirt.
4 annotation callouts with connecting lines:
  - "加绒内里" pointing to inner lining
  - "连帽设计" pointing to hood
  - "罗纹袖口" pointing to cuffs
  - " kangaroo pocket" pointing to front pocket
Clean background, professional annotation style.
```

### PIL 后处理（中文文字）
```python
# Logo（左上角 + 阴影）
overlay.text('YOUR BRAND', 24, 20, size=32, color='white', shadow=True)

# 卖点标签（左侧竖排）
overlay.tag('加绒', 16, 200, size=36)
overlay.tag('保暖', 16, 260, size=36)

# 底部活动条（红色渐变 + 大数字）
overlay.gradient_rect(0, 700, 800, 100, '#e63946', '#ff6b35')
overlay.text('1 件 9 折  3 件 85 折', 220, 720, size=36, bold=True)
```

---

## ❓ 常见问题

### Q: AI 生成的模特图商品外观和原图不一样怎么办？
**A**: 每次调用 `generate_image` 都**必须传入用户原图作为 ImagePaths**，AI 会在原图基础上做场景化，不会重新生成商品。

### Q: 中文文字为什么不用 AI 生图直接写？
**A**: AI 生成的中文经常变形、缺笔画、乱码。PIL 程序化渲染 100% 正确，像素级精确控制位置、大小、颜色、透明度。

### Q: 如果环境不支持 PIL 怎么办？
**A**: 自动降级到纯 `generate_image` 方案（中文可能不完美但可接受），或兜底到 HTML/CSS 渲染截图。

### Q: 尺码表怎么自动调整？
**A**: 根据品类自动判断：
- 童装：110-160cm
- 成人男装：S/M/L/XL/2XL/3XL
- 成人女装：XS/S/M/L/XL/2XL
- 鞋类：36-45 码（或对应码）

### Q: 季节标签怎么自动生成？
**A**: 根据当前月份自动判断：
- 1 月：年货节
- 2-4 月：春季上新
- 5-7 月：夏季上新
- 8-10 月：秋季上新
- 11-12 月：秋冬上新/年终大促

---

## 🔄 工作流程

```
用户输入（商品图 + 描述）
  ↓
商品分析（品类/卖点/风格/人群）
  ↓
风格判断（4 种配色方案）
  ↓
并行生成 ─┬─ 轮播图（5 张 800×800）
          └─ 详情图（9 张 790×1100）
  ↓
输出 14 张图
```

---

## 📝 触发词

以下关键词会触发此 Skill：
- 商品图
- 详情图
- 产品图
- 电商图
- 淘宝图
- 轮播图
- 主图

或上传商品照片并要求生成营销图片。

---

## 📄 License

MIT License © Patrick

---

## 🔗 相关项目

| Skill | 说明 |
|-------|------|
| [character-library-generator](https://github.com/patrickqing20-cell/character-library-generator) | 千人千面角色库 — 366 原型 × 14 维 Face DNA |
| [character-talking-video-prompt-builder](https://github.com/patrickqing20-cell/character-talking-video-prompt-builder) | 视频台词 Prompt — Voice DNA + 情绪 + 方言 |
| [realistic-cast-generator](https://github.com/patrickqing20-cell/realistic-cast-generator) | 真实感角色选角 — 三段式×双链路，210+ 组验证 |
| [lookbook-fx](https://github.com/patrickqing20-cell/lookbook-fx) | 监控追踪风时尚效果图生成器 |

---

<div align="center">

**Powered by PIL + AI Image Generation**

Made by **Patrick**

*14 张电商图，一键搞定。*

</div>
