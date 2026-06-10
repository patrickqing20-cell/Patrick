---
name: realistic-cast-generator
version: 1.0.0
description: |
  真实感角色选角 Prompt 生成器。像选角导演一样，为你的短剧挑选每一个角色——
  从霸道总裁到街边小贩，从宫斗嫡女到千禧辣妹，每个人都有真实的毛孔、雀斑和皱纹，
  而不是千篇一律的 AI 美颜脸。输入角色设定，输出可直接粘贴到 Gemini/QCreate 的完整 Prompt。
  支持 150+ 题材角色原型，覆盖现代都市/古装宫斗/年代种田/千禧穿越等全部短剧场景。
tags:
  - 角色资产图
  - 短剧
  - prompt工程
  - 真实人像
  - 选角
  - Gemini
  - character-asset
  - casting
trigger_words:
  - 角色资产图
  - 角色选角
  - 人物形象
  - 真实感角色
  - 批量角色
  - 选角导演
  - cast generator
  - character prompt
  - 四视图
  - 定妆照
---

# 🎬 真实感角色选角 Prompt 生成器

> **让你的短剧创作再也不缺真实的角色。**
>
> 像选角导演一样，从 210+ 种角色原型中挑选——霸道总裁、退伍特种兵、宫斗嫡女、千禧辣妹、年代村花……每个角色都拥有真实的皮肤质感：毛孔、雀斑、法令纹、胡茬，而不是千篇一律的 AI 磨皮美颜脸。
>
> 输入一句话角色设定，输出一段**可直接粘贴到 Gemini 3 Pro / QCreate 的完整英文 Prompt**，生成 16:9 四视图角色资产定妆照。

---

## 它解决什么问题

AI 生图模型默认输出"完美无瑕"的人脸——光滑、油亮、无毛孔、大眼高鼻尖下巴。这在需要**写实影视角色**的场景下是致命的：

| 问题 | 表现 | 本 Skill 的解法 |
|------|------|----------------|
| AI 美颜感 | 皮肤像打了十层粉底 | `raw skin texture` + `anti-influencer` 强制素颜质感 |
| 千人一面 | 所有角色长得一样 | 14 维 Face DNA 英文词池，29.7 亿种面孔组合 |
| 古装 CG 感 | 华丽服装触发 3D 渲染风格 | 双链路：链路 B 用影视剧定妆照锚定 + CG 触发词替换 |
| 服装乱写 | 模型不理解服装描述 | 96 套实拍参考图提炼的英文 Outfit 词池 |
| 年龄不匹配 | 50 岁角色皮肤像 20 岁 | 年龄适配瑕疵查表，自动匹配皱纹/斑点/胡茬 |

---

## 核心方法论：三段式 × 双链路

每条 Prompt 由三段拼接，**第一段和第三段是固定模板**，只有第二段（角色+服装）随角色变化：

```
[第一段：画面结构（固定）]
[第二段：Character 五官 + Outfit 服装（变量）]
[第三段：质感模块（固定骨架 + 年龄瑕疵查表）]
```

### 链路选择

| 链路 | 适用场景 | 核心差异 |
|------|---------|---------|
| **链路 A** | 现代装、简洁古装、年代装、校园、千禧 | 标准三段式 |
| **链路 B** | 古装权贵、华丽礼服、宫廷华服 | 质感前置 + 影视剧定妆照锚定 + CG 触发词替换 |

**判断规则**：服装中包含华丽元素（织锦/金绣/龙纹/凤冠等）→ 链路 B，否则 → 链路 A。

---

## 链路 A — 标准三段式

适用于：现代装、韩系休闲、千禧年代、简洁古装（布衣/劲装/素服）

### 第一段 — 画面结构（固定不改）

```
A 16:9 character asset sheet. Left 1/3 is a face close-up showing full head to collar. Right 2/3 has three full-body standing views side by side: front, side, back.
```

### 第二段 — 角色描述（变量）

```
Character: {age}-year-old {gender}, {face_shape}, {eyebrows}, {eyes}, {nose}, {lips}, {hair}, {1 unique_mark}.

Outfit: {top}, {bottom}, {shoes}, {0-1 accessory}.
```

**五官精简规则（8-10 个核心点）**：
```
脸型 + 眉型 + 眼型/眼皮 + 瞳色 + 鼻型 + 唇型 + 发型发色长度 + 1个记忆点
```

**服装精简规则（4-6 个核心视觉词）**：
```
上衣(类型+颜色) + 下装(类型+颜色) + 鞋(类型+颜色) + 0-1个配饰
```

不要写的（会分散模型注意力）：
- ❌ 材质描述：纯棉、丝绸
- ❌ 纹理描述：无破洞、无水洗纹
- ❌ 尺寸描述：宽度2cm
- ❌ 否定描述：无图案、无文字

### 第三段 — 质感模块（固定骨架 + 年龄瑕疵）

```
Hyper-realistic raw skin texture. Bare skin, no makeup, no foundation, no retouching, no blush, no rouge on cheeks. Matte skin finish, no oil sheen, no shine, no glossy highlights on the face. {age_specific_imperfections}. Anti-sweet, anti-influencer aesthetic. Pure white background, facing camera, natural daylight, 58mm prime lens, f/1.4, Sony A7M4.
```

### 链路 A 完整示例

**28岁男性 · 地痞流氓：**

```
A 16:9 character asset sheet. Left 1/3 is a face close-up showing full head to collar. Right 2/3 has three full-body standing views side by side: front, side, back.

Character: 28-year-old male, broad square face with prominent cheekbones, thick unruly eyebrows, narrow single eyelids, dark brown eyes, flat wide nose with flared nostrils, thick lips with slight underbite, ears slightly protruding, short cropped black hair with shaved sides, chipped front tooth visible when mouth slightly open.

Outfit: wrinkled black tank top, oversized dark grey track pants with white stripe, scuffed white slip-on sneakers, fake gold chain necklace.

Hyper-realistic raw skin texture. Bare skin, no makeup, no foundation, no retouching, no blush, no rouge on cheeks. Matte skin finish, no oil sheen, no shine, no glossy highlights on the face. Scattered freckles across the nose bridge and cheeks. Visible pores on the nose and cheeks. Uneven skin tone with subtle redness around the nostrils and under the eyes. Fine stubble grain visible on jaw. Anti-sweet, anti-influencer aesthetic. Pure white background, facing camera, natural daylight, 58mm prime lens, f/1.4, Sony A7M4.
```

---

## 链路 B — 质感前置 + 影视剧定妆照锚定

适用于：古装权贵、宫廷华服、华丽礼服等容易触发 CG 渲染风格的场景。

### 与链路 A 的 3 个差异

| 位置 | 链路 A | 链路 B |
|------|--------|--------|
| 画面结构 | `character asset sheet` | `character wardrobe fitting photo for a Chinese period drama production` |
| 角色段开头 | 直接写五官 | 前置 `with hyper-realistic raw matte skin showing visible pores and {瑕疵}` |
| 服装词 | 按需使用 | **避免 CG 高频词**，用朴素描述替代（见替换表） |

### 第一段 — 画面结构（影视剧定妆照锚定）

```
A 16:9 character wardrobe fitting photo for a Chinese period drama production. Left 1/3 is a face close-up showing full head to collar. Right 2/3 has three full-body standing views side by side: front, side, back.
```

### 第二段 — 角色描述（质感前置）

```
Character: {age}-year-old {gender} with hyper-realistic raw matte skin showing visible pores and {核心瑕疵关键词}. {face_shape}, {eyebrows}, {eyes}, {nose}, {lips}, {hair}, {1 unique_mark}.

Outfit: {服装，避免 CG 高频词}.
```

### 第三段 — 质感模块（同链路 A，去掉开头的 Hyper-realistic raw skin texture）

```
Bare skin, no makeup, no foundation, no retouching, no blush, no rouge on cheeks. Matte skin finish, no oil sheen, no shine, no glossy highlights on the face. {age_specific_imperfections}. Anti-sweet, anti-influencer aesthetic. Pure white background, facing camera, natural daylight, 58mm prime lens, f/1.4, Sony A7M4.
```

### CG 触发词替换表

| ❌ CG 高频词 | ✅ 替代 | 原因 |
|-------------|---------|------|
| brocade | subtle woven pattern | 触发 3D 织锦材质渲染 |
| gold dragon embroidery | subtle woven dragon scale pattern | 触发金色 CG 光效 |
| gold embroidery throughout | subtle woven pattern along hem | 全身金绣直接变 CG |
| gold crown | simple dark metal hair crown | 金冠三合一最强触发 |
| phoenix embroidery | subtle woven phoenix pattern | 凤纹触发华丽渲染 |
| sequin / beaded | 删掉不写 | 亮片珠饰必触发 |
| iridescent / glossy silk | 删掉不写 | 光泽词触发 CG |

### 链路 B 完整示例

**26岁女性 · 贵妃：**

```
A 16:9 character wardrobe fitting photo for a Chinese period drama production. Left 1/3 is a face close-up showing full head to collar. Right 2/3 has three full-body standing views side by side: front, side, back.

Character: 26-year-old female with hyper-realistic raw matte skin showing visible pores and uneven tone. Oval face with soft rounded jaw, thin gently arched eyebrows, large almond-shaped double eyelids, dark brown eyes, small delicate nose with narrow bridge, full lips with defined cupid's bow, black hair in an elaborate high bun with side-swept bangs, small beauty mark above right lip.

Outfit: deep crimson cross-collar wide-sleeve robe with subtle woven floral pattern along the hem, white inner garment with high collar, wide cloth sash belt in muted gold tone, layered sheer outer cape draped over shoulders, simple dark metal hair crown with dangling pearl ornaments, jade drop earrings.

Bare skin, no makeup, no foundation, no retouching, no blush, no rouge on cheeks. Matte skin finish, no oil sheen, no shine, no glossy highlights on the face. Scattered freckles across the nose bridge and cheeks. Visible pores on the nose and cheeks. Uneven skin tone with subtle redness around the nostrils and under the eyes. Fine peach fuzz on the cheeks catching side light. Anti-sweet, anti-influencer aesthetic. Pure white background, facing camera, natural daylight, 58mm prime lens, f/1.4, Sony A7M4.
```

---

## 年龄适配瑕疵表

| 年龄段 | 瑕疵组合 | 链路 B 质感前置关键词 |
|--------|---------|---------------------|
| **15-22** | Light acne marks on forehead and chin. Visible pores on the nose. Uneven skin tone with subtle redness around the nostrils and under the eyes. Fine peach fuzz on the jawline catching side light. | `visible pores and subtle acne marks` |
| **23-35** | Scattered freckles across the nose bridge and cheeks. Visible pores on the nose and cheeks. Uneven skin tone with subtle redness around the nostrils and under the eyes. Fine peach fuzz on the cheeks catching side light. | `visible pores and uneven tone` |
| **36-50** | Crow's feet and nasolabial folds clearly visible. Visible pores across the nose and cheeks. Uneven skin tone with slight darkening under the eyes. | `visible pores, crow's feet and nasolabial folds` |
| **50+** | Deep wrinkles on forehead and around eyes. Age spots near the temples and cheeks. Visible pores and sagging skin along the jawline. Uneven skin tone with darkening under the eyes. | `deep wrinkles, age spots and sagging` |

**男性额外加**（任选一）：
- 23-50 岁：`Fine stubble grain visible on jaw.`
- 50+ 岁：`Fine facial hair on upper lip catching light.`

> ⚠️ **禁止使用** `pink flush on both cheeks`，模型会画成腮红妆面。统一用 `subtle redness around the nostrils and under the eyes`。

---

## 禁用词表

| ❌ 不要用 | ✅ 替代 | 原因 |
|----------|---------|------|
| oil sheen / glossy / shiny | matte skin finish | 油光暴露 AI 感 |
| realistic skin texture | **raw** skin texture | raw 暗示未修图，比 realistic 强 |
| beautiful / pretty / gorgeous | 删掉不写 | 触发美化滤镜 |
| smooth skin | 用瑕疵描述替代 | 与真实质感目标矛盾 |
| perfect / flawless | anti-sweet, anti-influencer | 触发完美化 |
| studio lighting | natural daylight | 棚灯容易打出 AI 感 |
| pink flush on cheeks | subtle redness around nostrils and under eyes | 被画成腮红 |

---

## 记忆点（独特特征）参考

每个角色需要 1 个让人一眼认出的独特特征：

| 类型 | 英文示例 |
|------|---------|
| 疤痕 | small scar across left eyebrow |
| 痣 | small dark mole on right cheekbone |
| 酒窝 | slight dimple on left cheek |
| 配饰 | round stud earring on left ear |
| 面部毛发 | visible stubble on chin and jawline |
| 痘印 | light acne marks on forehead |
| 牙齿 | slight gap between front teeth / chipped front tooth |
| 表情纹 | asymmetric smile, right corner higher |
| 泪痣 | tear mole below right eye |
| 虎牙 | visible canine tooth on upper left |

---

## 使用方式

### 方式一：给我一句话角色设定

直接告诉我角色信息，我帮你生成完整 Prompt：

```
用户：帮我生成一个 28 岁退伍特种兵的角色资产图 prompt
```

我会：
1. 判断链路（现代装 → 链路 A）
2. 查年龄瑕疵表（23-35 → 雀斑+毛孔+泛红）
3. 从词池中选取/创作五官和服装描述
4. 拼装完整 Prompt 输出

### 方式二：批量生成

使用内置脚本批量生成，需要准备一个 JSON 文件：

```bash
python3 /workspace/skills/realistic-cast-generator/scripts/assemble_prompts.py \
  /path/to/characters.json \
  /path/to/output.xlsx
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
    "character": "angular square jaw, thick straight eyebrows, deep-set single eyelids, dark brown narrow eyes, high nose bridge, thin pressed lips, short side-parted black hair, faint scar on right jawline",
    "outfit": "charcoal double-breasted suit jacket, black turtleneck, dark grey tailored trousers, black leather oxford shoes, silver watch"
  }
]
```

输出 xlsx 列：序号 / 题材 / 角色名 / 性别 / 年龄 / 身高 / 体型 / 链路 / 完整Prompt

### 方式三：从词池随机生成

参考 `assets/` 下的词池文件，手动组合或让我随机搭配：

- `face_dna_en.json` — 14 维英文五官词池
- `outfit_ancient.json` — 古装服装词池（52 套）
- `outfit_millennium.json` — 千禧年代服装词池（44 套）
- `cg_replace.json` — CG 触发词替换表

---

## 内置词池

### Face DNA 英文词池（14 维）

| 维度 | 选项数 | 示例 |
|------|:------:|------|
| face_shape | 10 | round face with soft jawline / angular square jaw / diamond-shaped face with prominent cheekbones |
| eyebrows | 8 | thick straight dark eyebrows / thin gently arched eyebrows / sparse thin grey eyebrows |
| eyes | 10 | large almond-shaped double eyelids / narrow single eyelids / deep-set hooded eyes |
| eye_color | 4 | dark brown eyes / light brown eyes / dark brown eyes behind black-framed glasses |
| nose | 8 | high straight nose bridge / small button nose / wide flat nose with flared nostrils |
| lips | 8 | thin pressed lips / full lips with defined cupid's bow / thick chapped lips |
| ears | 4 | ears slightly protruding / small flat ears / normal ears |
| hair_male | 10 | short buzz cut black hair / slicked-back black hair / messy black hair pushed back |
| hair_female | 10 | long black straight hair center-parted / black hair in sleek high bun / shoulder-length bob with side bangs |
| hair_color | 6 | black / dark brown / grey-streaked black / fully grey / bleached with dark roots |
| skin_tone | 4 | fair skin / naturally tanned skin / weathered dark skin / pale skin |
| body_type_male | 8 | tall lean / muscular athletic / stocky / thin weak / average / wiry / beer belly / elderly stooped |
| body_type_female | 8 | slim elegant / petite / curvy / athletic lean / plump / thin frail / tall model / sturdy |
| unique_mark | 12 | small scar across left eyebrow / beauty mark below left eye / dimple on left cheek / chipped front tooth |

理论组合数：**超过 10 亿种**独特面孔。

### Outfit 词池

**古装（52 套）**：明制女装 17 + 明制男装 17 + 唐制 5 + 宋制 5 + 其他 8

**千禧年代（44 套）**：碎花波点格纹 13 + 毛衣针织 10 + 大衣外套 10 + 中山装制服 6 + 工装 5

完整词池见 `assets/outfit_ancient.json` 和 `assets/outfit_millennium.json`。

---

## 覆盖题材

| 题材 | 典型角色 | 链路 |
|------|---------|:----:|
| 都市商战 | 霸道总裁、职场女强人、保安、程序员、HR总监 | A |
| 都市爱情 | 暖男医生、咖啡店女店主、外卖骑手、调酒师 | A |
| 甜宠校园 | 学霸校草、元气少女、篮球队长、图书馆阿姨 | A |
| 男频逆袭 | 退伍特种兵、龙王赘婿、快递小哥、天才黑客 | A |
| 宫斗宅斗 | 嫡女、正妻、庶女、太后、贵妃、王爷、皇帝 | B |
| 古风权谋 | 权臣、锦衣卫、女刺客、丞相、皇后、花魁 | B |
| 古风爱情 | 联姻公主、落难世子、山野村姑、温润书生 | A/B |
| 穿越千禧年 | 千禧辣妹、网吧少年、发廊小弟、杀马特 | A |
| 年代种田 | 村支书、知青、铁匠、赤脚医生、村花 | A |
| 家庭伦理 | 恶婆婆、窝囊老公、渣男前夫、叛逆女儿 | A |
| 悬疑推理 | 刑警队长、女法医、高智商罪犯、连环杀手 | A |
| 民国谍战 | 军统特工、舞厅歌女、地下党、上海滩大亨 | A |
| 萌宝亲子 | 全职奶爸、虎妈、慈祥爷爷、幼儿园老师 | A |

---

## 核心结论（实验验证）

| 维度 | 结论 | 证据 |
|------|------|------|
| 语言 | **英文 > 中文** | 中文出图偏平，英文细节响应更好 |
| 格式 | **自然语言 > JSON** | 模型对 JSON 理解差，自然语言直喂效果好 |
| 长度 | **短 prompt > 长 prompt** | 描述过多模型注意力分散，质感下降 |
| 肤质 | **哑光 > 油光** | 油光容易暴露 AI 感，哑光更安全真实 |
| 质感词 | **`raw` > `realistic`** | raw 暗示未修图原始质感 |
| 反向锚定 | **`anti-sweet, anti-influencer` 有效** | 屏蔽模型自带的网红美颜倾向 |
| macro 镜头 | **不必要** | 100mm macro 无显著提升，58mm 够用 |
| SSS 散射 | **不必要** | subsurface scattering 无显著提升 |
| 腮红词 | **禁用 `pink flush on cheeks`** | 模型画出腮红妆面 |
| 古装华丽词 | **触发 CG** | brocade + gold embroidery + gold crown 三合一必出 CG |
| 定妆照锚定 | **`wardrobe fitting photo` 有效** | 抑制 CG，锚定真人感 |

验证模型：Gemini 3 Pro | 验证规模：210+ 组实战出图

---

## 适用模型

| 模型 | 状态 |
|------|------|
| Gemini 3 Pro | ✅ 主力验证，效果最优 |
| QCreate / 万相 | ✅ 已验证可用 |
| Flux | ⏳ 待验证 |
| 可灵 | ⏳ 待验证 |

---

## 文件结构

```
realistic-cast-generator/
├── SKILL.md                    ← 本文件
├── assets/
│   ├── face_dna_en.json        ← 14维英文五官词池
│   ├── outfit_ancient.json     ← 古装服装词���（52套）
│   ├── outfit_millennium.json  ← 千禧年代服装词池（44套）
│   └── cg_replace.json         ← CG触发词替换表
├── scripts/
│   └── assemble_prompts.py     ← 批量生成脚本（输入JSON→输出xlsx）
└── examples/
    └── sample_10.json          ← 10组示例角色JSON
```
