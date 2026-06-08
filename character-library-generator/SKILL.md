---
name: character-library-generator
description: 千人千面随机角色库生成器。基于 Face DNA 随机化 + 批内查重，批量生成短剧角色四视图定妆照 prompt，每个角色面部特征唯一。支持都市、古装、穿越千禧年等 18 个题材，366 个角色原型，14 维面部特征池。输出可直接用于 Gemini / QCreate 等生图模型。触发词：千人千面、随机角色、角色库、批量角色、四视图、角色资产、character library。
---

# 千人千面随机角色库生成器

## 核心能力

从内置的 **366 个角色原型** × **14 维 Face DNA 池**中随机采样组合，批量生成短剧角色四视图定妆照 prompt。

**千人千面保证**：
- 每个角色独立随机 Face DNA（脸型/眉/眼/鼻/唇/耳/肤色/发型等 14 个维度）
- 批内查重：同批次中任意两个角色的 DNA 相同维度不超过 6 个（可配置）
- 固定 seed → 结果可复现

## Prompt 模板结构（v5 最终版）

每条 prompt 严格遵循以下固定结构，**画面基调和画面结构段落一字不动**，仅替换题材名和人物设定：

```
{题材}题材短剧人物角色资产设定图，
画面基调：真实人像摄影质感，索尼摄影机拍摄，无多余元素，突出人物主体。直视镜头。人物正面面向镜头，明亮光影质感，人物可见毛孔细纹，自然皮肤纹理，有光影颗粒，灰尘噪点，不要干净无层次
人物设定：
写实影视剧演员选角质感，真实皮肤纹理，均匀棚拍光线，超高清，超写实，细节清晰。角色：{age}岁{gender}，{role_name}，身高{height}厘米，{body_type}。{五官自然语言描述}。穿{outfit}。单张横向画布，纯白背景，
画面结构：16：9角色资产图 左侧1/3区域为超大高清面部特写，露出完整头顶和衣领位置，头顶上方留白。右侧2/3区域整齐排布角色三张全身三视图，包含角色的正面、侧面及背面三个维度的全身站姿视图。背景为纯白色背景。视觉对齐：所有角度的比例必须严格一致，确保角色身高、五官位置、服装褶皱在不同视角下完美契合。超高清，超写实8K。无多余元素，突出人物主体。直视镜头。人物正面面向镜头，明亮光影质感，人物可见毛孔细纹，自然皮肤纹理，有光影颗粒，灰尘噪点，不要干净无层次
```

### 变量说明

| 变量 | 来源 | 说明 |
|------|------|------|
| `{题材}` | 用户指定或从 category 推断 | 都市/古装/穿越千禧年/年代/校园等 |
| `{age}` | 随机生成 | 根据角色年龄段：青年18-29/中年28-41/长辈40-59 |
| `{gender}` | 从角色原型推断 | 男性/女性 |
| `{height}` | 随机生成 | 女性155-172cm/男性170-189cm/长辈适当调整 |
| `{body_type}` | 随机生成 | 纤细/匀称/偏瘦/标准/健壮等，按性别分池 |
| `{role_name}` | 角色原型库 | 如霸道总裁、穿越主母、千禧辣妹 |
| `{五官自然语言}` | Face DNA 随机组合 | 14 维面部特征的自然语言描述 |
| `{outfit}` | 角色原型库 | 与角色身份匹配的服装描述 |

### 固定不动的段落

- **画面基调**：真实人像摄影质感，索尼摄影机拍摄…（一字不改）
- **画面结构**：16:9 角色资产图 左侧1/3…（一字不改）

## 使用方式

### 命令行生成

```bash
cd /workspace/.skills/character-library-generator

# 基本用法：指定题材 + 数量 + 种子
python3 scripts/generate_character_prompts.py \
  --category "都市爱情" \
  --count 30 \
  --seed 20260608 \
  --output prompts.csv

# 简化输出（仅 prompt + 分辨率列）
python3 scripts/generate_character_prompts.py \
  --category "宫斗宅斗" \
  --count 20 \
  --seed 12345 \
  --simple \
  --output prompts.csv

# 输出 JSON 格式
python3 scripts/generate_character_prompts.py \
  --category "穿越千禧年" \
  --count 30 \
  --seed 99999 \
  --output prompts.json

# 不指定 category = 从全部 366 个原型中随机
python3 scripts/generate_character_prompts.py \
  --count 50 \
  --seed 20260608 \
  --output all_themes.csv
```

### 参数说明

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--category` | 空（全部） | 题材子串过滤，如 `都市`、`宫斗宅斗`、`穿越千禧年` |
| `--count` | 20 | 生成角色数量 |
| `--seed` | 20260530 | 随机种子，固定 seed = 可复现结果 |
| `--resolution` | 2560:1440 | 四视图分辨率 |
| `--video-anchor-resolution` | 1440:2560 | 视频锚点分辨率（9:16竖屏） |
| `--max-same-fields` | 6 | 批内查重阈值：任意两角色 DNA 相同维度不超过此数 |
| `--simple` | false | 简化 CSV 输出（仅 prompt/分辨率/video_anchor_prompt/锚点分辨率） |
| `--output` | 必填 | 输出路径，支持 .csv 和 .json |

### 多题材批量生成

用户说「给我都市+古装+穿越千禧年各30组」时，用 Python 脚本批量调用：

```python
import sys, csv, json, random
sys.path.insert(0, 'scripts')
from generate_character_prompts import (
    load_json, infer_profile, unique_dna, assemble_prompt,
    assemble_video_anchor_prompt, gen_char_attrs, BASE_DIR
)

THEMES = {
    "都市题材": (["都市爱情", "男频逆袭/都市日常", "甜宠题材"], "都市"),
    "古装题材": (["宫斗宅斗", "古风权谋", "古风爱情"], "古装"),
    "穿越千禧年": (["穿越千禧年"], "穿越千禧年"),
}
# ... 每个题材独立 seed、独立批内查重
```

## 知识库

### 角色原型库 (`assets/role_archetypes.json`)

**366 个角色原型**，覆盖 18 个短剧题材：

| 题材 | 原型数 | 示例角色 |
|------|:------:|---------|
| 都市爱情 | 26 | 霸道总裁、职场精英女、独立女主、契约丈夫 |
| 男频逆袭/都市日常 | 22 | 上门女婿、退伍特种兵、快递员、保安 |
| 甜宠题材 | 24 | 小奶狗男友、温柔竹马、暗恋备胎 |
| 宫斗宅斗 | 22 | 嫡女/庶女、侧妃/妾室、通房丫头、正妻/主母 |
| 古风权谋 | 20 | 大将军、权臣、傀儡太子、锦衣卫/刺客 |
| 古风爱情 | 21 | 联姻公主、落难世子、穿越者 |
| 穿越千禧年 | 12 | 重生千禧女主、千禧辣妹、非主流杀马特、网吧老板 |
| 玄幻仙侠 | 20 | — |
| 悬疑推理 | 20 | — |
| 校园青春 | 20 | — |
| 女性成长 | 23 | — |
| 家庭伦理 | 20 | — |
| 年代/种田 | 21 | — |
| 民国爱情/谍战 | 20 | — |
| 都市玄幻 | 21 | — |
| 都市脑洞/系统流 | 19 | — |
| 奇幻脑洞 | 20 | — |
| 萌宝/亲子 | 15 | — |

每个原型包含：`archetype_id`、`category`、`role_name`、`visual_traits`、`outfit`、`common_scenes`。

### Face DNA 池 (`assets/face_dna_pools.json`)

**14 个维度**，每个维度 5-14 个选项，组合空间极大：

| 维度 | 选项数 | 示例值 |
|------|:------:|--------|
| face_shape（脸型） | 10 | 偏短圆脸/偏长椭圆脸/宽颧骨菱形脸/心形脸… |
| forehead_cheekbones（额头颧骨） | 8 | 额头中等宽度，颧骨平缓/额头较宽，颧骨柔和… |
| brows（眉） | 8 | 自然平直眉/柔和弧形眉/略浓上挑眉… |
| eyes（眼） | 8 | 细长单眼皮/中等大小内双眼/圆润外双眼… |
| eye_spacing（眼距） | 5 | 眼距适中/眼距略宽/眼距略近… |
| nose（鼻） | 8 | 鼻梁中等高度，鼻头圆润/鼻梁偏低，鼻头较宽… |
| lips（唇） | 8 | 横向偏宽唇型/小巧唇型/偏窄唇型… |
| ears（耳） | 8 | 中等贴面耳廓/偏小狭长耳廓/较大外扩耳廓… |
| skin_tone（肤色） | 8 | 自然暖调中等肤色/健康小麦色/暖白自然肤色… |
| skin_detail（肤质） | 9 | 保留自然毛孔/鼻梁浅雀斑/眼下轻微细纹… |
| hair_style（发型） | 14 | 齐肩波波头/锁骨长度层次发/短寸头… |
| hair_color（发色） | 10 | 自然乌黑色/深棕黑色/冷深棕色/茶棕色… |
| hairline（发际线） | 9 | 发际线自然圆润/额角有少量碎发/额角轻微后移… |
| distinctive_feature（独特特征） | 12 | 左侧鼻翼浅色小痣/笑起来右侧嘴角略高/虎牙… |

理论组合数：10×8×8×8×5×8×8×8×8×9×14×10×9×12 ≈ **29.7 亿种**面孔。

### 兼容规则 (`assets/compatibility_rules.json`)

- 年龄适配：老年角色优先使用灰白发色、法令纹等肤质；年轻角色回避这些
- 性别适配：男性角色优先短发系列；女性角色优先长发/波波头系列
- 关键词检测：从原型的 `visual_traits` 和 `outfit` 推断性别和年龄段

## 输出格式

### CSV 列（完整模式）

| 列名 | 说明 |
|------|------|
| asset_id | 编号如 CHAR-001 |
| role_archetype_id | 原型ID如 ROLE-001 |
| category | 细分题材如 都市爱情 |
| role_name | 角色名如 霸道总裁 |
| age | 随机年龄 |
| gender | 男性/女性 |
| height | 随机身高(cm) |
| body_type | 体型 |
| seed | 随机种子 |
| face_dna | Face DNA JSON |
| char_attrs | 角色属性 JSON |
| prompt_version | 版本标识 |
| prompt | **四视图定妆照完整 prompt**（可直接粘贴到生图模型） |
| 分辨率 | 默认 2560:1440 |
| video_anchor_prompt | 视频锚点 prompt（9:16 胸上说话图） |
| 视频锚点分辨率 | 默认 1440:2560 |

### CSV 列（--simple 模式）

仅输出：`prompt`、`分辨率`、`video_anchor_prompt`、`视频锚点分辨率`

### 编码

- UTF-8 BOM（Mac Excel 打开不乱码）
- JSON 输出不加 BOM

## 扩展知识库

### 新增角色原型

编辑 `assets/role_archetypes.json`，追加条目：

```json
{
  "archetype_id": "ROLE-367",
  "category": "穿越千禧年",
  "role_name": "新角色名",
  "visual_traits": "面部特征描述",
  "outfit": "服装描述",
  "common_scenes": "常见场景"
}
```

### 新增 Face DNA 维度值

编辑 `assets/face_dna_pools.json`，在对应维度数组中追加。

### 新增题材

1. 在 `role_archetypes.json` 中用新的 `category` 值添加原型（建议至少 12 个）
2. 在脚本的 `get_theme_label()` 中添加映射规则

## 视频锚点交接

四视图是定妆参考图，**不能直接丢给视频模型**。流程：

1. 用四视图 prompt 生成定妆参考图
2. 用同一角色的 `video_anchor_prompt` 生成 9:16 胸上说话锚点图
3. 把说话锚点图交给 `character-talking-video-prompt-builder` Skill 生成视频 prompt

## 质量检查

生成后可运行校验脚本：

```bash
python3 scripts/validate_character_prompts.py prompts.json
```

检查项：批内 Face DNA 唯一性、prompt 必含关键段落、分辨率格式。
