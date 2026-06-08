#!/usr/bin/env python3
"""Generate diverse short-drama character asset prompts from bundled data.

Usage:
  python scripts/generate_character_prompts.py --category 都市爱情 --count 20 \
    --seed 20260530 --resolution 2560:1440 --output prompts.csv
"""

from __future__ import annotations

import argparse
import csv
import json
import random
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parents[1]
DNA_KEYS = [
    "face_shape",
    "forehead_cheekbones",
    "brows",
    "eyes",
    "eye_spacing",
    "nose",
    "lips",
    "ears",
    "skin_tone",
    "skin_detail",
    "hair_style",
    "hair_color",
    "hairline",
    "distinctive_feature",
]

SKIN_TEXTURE = """明亮且有方向性的自然光影质感，光线层次分明，明暗过渡丰富，画面带有真实的光影颗粒、细腻胶片噪点和空气中漂浮的微尘质感，画面绝不干净平光、绝不扁平无层次。核心凸显真实皮肤肌理：人物面部及一切裸露皮肤清晰可见毛孔、细纹、皮肤起伏、自然瑕疵与色斑，皮肤表面有真实油光、汗珠微光、绒毛和细腻的高光到暗部过渡，呈现摄影级次表面散射（SSS）效果。整体超高清超写实，是真实人类皮肤质感，绝非塑料感、磨皮感、AI 平滑感或 CG 渲染感。"""

# ===== 用户指定的固定模板段落 =====
TONE_BLOCK = "画面基调：真实人像摄影质感，索尼摄影机拍摄，无多余元素，突出人物主体。直视镜头。人物正面面向镜头，明亮光影质感，人物可见毛孔细纹，自然皮肤纹理，有光影颗粒，灰尘噪点，不要干净无层次"

STRUCTURE_BLOCK = "画面结构：16：9角色资产图 左侧1/3区域为超大高清面部特写，露出完整头顶和衣领位置，头顶上方留白。右侧2/3区域整齐排布角色三张全身三视图，包含角色的正面、侧面及背面三个维度的全身站姿视图。背景为纯白色背景。视觉对齐：所有角度的比例必须严格一致，确保角色身高、五官位置、服装褶皱在不同视角下完美契合。超高清，超写实8K。无多余元素，突出人物主体。直视镜头。人物正面面向镜头，明亮光影质感，人物可见毛孔细纹，自然皮肤纹理，有光影颗粒，灰尘噪点，不要干净无层次"

# ===== 保留旧常量供兼容 =====
LAYOUT = """单张横向画布，纯白背景，固定四栏式排版。左侧32%区域仅展示一张角色正面超高清脸部特写，从头顶到锁骨，脸部居中，不裁切头发，不出现手部。右侧68%区域严格等宽排列同一角色的三张全身站姿视图：第一张身体与脸部完全朝向镜头；第二张身体和头部严格90度朝向画面右侧，不得转头看镜头；第三张身体和头部严格180度背向镜头，不得露出脸部。三张全身图必须保持相同身高、相同头身比、相同脚底基准线、相同画面缩放比例。每张全身图必须从头顶完整展示到鞋底，人物之间留有均匀空白间距，不重叠，不裁切。"""

CONSISTENCY = """四个视图必须展示同一个角色。严格保持脸型、五官比例、肤色、发际线、发型轮廓、发色、身高体态、服装结构、服装颜色、材质、鞋款和配饰位置一致。人物自然直立，手臂自然垂落，不拿道具。不要标准网红脸，不要统一大眼、高鼻梁、尖下巴、冷白皮，不要过度磨皮，不要多余人物，不要分隔线，不要 Front、Profile、Back 文字标签，不要乱码，不要水印，不要 logo。"""

VIDEO_ANCHOR = """使用四视图档案图中的同一角色，生成单人胸部以上说话视频锚点图。9:16竖屏，单张图片，只出现一个人物，只展示一个角度。人物正面朝向镜头，允许脸部和身体轻微侧转但不得超过10度；完整展示头发、脸部、颈部、肩膀和上胸，嘴部无遮挡，双手不进入画面。背景为简洁浅灰白色摄影棚背景，均匀柔和影视灯光。严格复刻角色脸型、眉形、眼型、鼻型、唇型、耳型、肤色、雀斑、痣、发际线、发型轮廓、发色、年龄感和服装上半身。不要重新设计人物，不要美化成网红脸，不要改变年龄。不要四视图，不要多视角，不要拼图，不要分栏，不要多个姿势，不要额外人物，不要文字，不要标签，不要水印，不要logo。此图用于后续单人说话视频，只能包含一个胸部以上角色。"""

# ===== 人物属性随机池 =====
FEMALE_HEIGHTS = list(range(155, 173))  # 155-172cm
MALE_HEIGHTS = list(range(170, 190))    # 170-189cm
OLDER_MALE_HEIGHTS = list(range(165, 183))
OLDER_FEMALE_HEIGHTS = list(range(152, 168))

BODY_TYPES_FEMALE = ["纤细体型", "匀称体型", "偏瘦体型", "微丰腴体型", "标准体型", "清瘦体型"]
BODY_TYPES_MALE = ["匀称体型", "偏瘦体型", "健壮体型", "精壮体型", "标准体型", "高大体型", "魁梧体型"]
BODY_TYPES_OLDER = ["微发福体型", "匀称体型", "偏瘦体型", "标准体型", "富态体型"]

AGE_YOUNG = list(range(18, 30))
AGE_MIDDLE = list(range(28, 42))
AGE_OLDER = list(range(40, 60))


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def contains_any(text: str, words: list[str]) -> bool:
    return any(word in text for word in words)


def infer_profile(archetype: dict[str, str], rules: dict[str, Any]) -> dict[str, bool]:
    text = " ".join(
        str(archetype.get(key, ""))
        for key in ("role_name", "visual_traits", "outfit")
    )
    male = contains_any(text, rules["male_keywords"])
    female = contains_any(text, rules["female_keywords"])
    return {
        "older": contains_any(text, rules["age_hints"]["older_keywords"]),
        "younger": contains_any(text, rules["age_hints"]["younger_keywords"]),
        "male": male and not female,
        "female": female and not male,
    }


def choose(rng: random.Random, values: list[str]) -> str:
    return values[rng.randrange(len(values))]


def sample_dna(
    rng: random.Random,
    pools: dict[str, list[str]],
    rules: dict[str, Any],
    profile: dict[str, bool],
) -> dict[str, str]:
    dna = {key: choose(rng, pools[key]) for key in DNA_KEYS}

    if profile["older"]:
        dna["hair_color"] = choose(rng, rules["older_preferred_hair_colors"])
        dna["skin_detail"] = choose(rng, rules["older_preferred_skin_details"])
    elif profile["younger"] and dna["skin_detail"] in rules["younger_avoid_skin_details"]:
        dna["skin_detail"] = choose(rng, [value for value in pools["skin_detail"] if value not in rules["younger_avoid_skin_details"]])

    if profile["male"]:
        dna["hair_style"] = choose(rng, rules["male_preferred_hair_styles"])
    elif profile["female"]:
        dna["hair_style"] = choose(rng, rules["female_preferred_hair_styles"])

    return dna


def similarity(first: dict[str, str], second: dict[str, str]) -> int:
    return sum(first.get(key) == second.get(key) for key in DNA_KEYS)


def unique_dna(
    rng: random.Random,
    pools: dict[str, list[str]],
    rules: dict[str, Any],
    profile: dict[str, bool],
    existing: list[dict[str, str]],
    max_same_fields: int,
) -> dict[str, str]:
    for _ in range(200):
        candidate = sample_dna(rng, pools, rules, profile)
        if all(similarity(candidate, previous) <= max_same_fields for previous in existing):
            return candidate
    raise RuntimeError("Unable to create a sufficiently distinct Face DNA combination. Reduce --count or increase --max-same-fields.")


def gen_char_attrs(rng: random.Random, profile: dict[str, bool]) -> dict[str, str]:
    """Generate age, gender label, height, body_type based on role profile."""
    if profile["older"]:
        age = choose(rng, AGE_OLDER)
        if profile["male"]:
            gender = "男性"
            height = choose(rng, OLDER_MALE_HEIGHTS)
            body = choose(rng, BODY_TYPES_OLDER)
        elif profile["female"]:
            gender = "女性"
            height = choose(rng, OLDER_FEMALE_HEIGHTS)
            body = choose(rng, BODY_TYPES_OLDER)
        else:
            gender = rng.choice(["男性", "女性"])
            height = choose(rng, OLDER_MALE_HEIGHTS if gender == "男性" else OLDER_FEMALE_HEIGHTS)
            body = choose(rng, BODY_TYPES_OLDER)
    else:
        age = choose(rng, AGE_YOUNG if profile.get("younger") else AGE_MIDDLE)
        if profile["male"]:
            gender = "男性"
            height = choose(rng, MALE_HEIGHTS)
            body = choose(rng, BODY_TYPES_MALE)
        elif profile["female"]:
            gender = "女性"
            height = choose(rng, FEMALE_HEIGHTS)
            body = choose(rng, BODY_TYPES_FEMALE)
        else:
            gender = rng.choice(["男性", "女性"])
            height = choose(rng, MALE_HEIGHTS if gender == "男性" else FEMALE_HEIGHTS)
            body = choose(rng, BODY_TYPES_MALE if gender == "男性" else BODY_TYPES_FEMALE)
    return {"age": str(age), "gender": gender, "height": str(height), "body_type": body}


def format_face_dna_natural(dna: dict[str, str]) -> str:
    """Format Face DNA into natural language grouped by feature area."""
    parts = []
    # 脸型
    parts.append(dna["face_shape"])
    # 额头颧骨（合并到脸型描述后）
    parts[-1] += "，" + dna["forehead_cheekbones"]
    # 眉
    parts.append(dna["brows"])
    # 眼 + 眼距
    parts.append(dna["eyes"] + "，" + dna["eye_spacing"])
    # 鼻
    parts.append(dna["nose"])
    # 唇
    parts.append(dna["lips"])
    # 耳
    parts.append(dna["ears"])
    # 肤色 + 肤质
    parts.append(dna["skin_tone"] + "，" + dna["skin_detail"])
    # 发色 + 发型 + 发际线 (分号后独立)
    hair = dna["hair_color"] + dna["hair_style"] + "，" + dna["hairline"]
    # 独特特征
    distinctive = dna["distinctive_feature"]
    face_text = "；".join(parts)
    return face_text + "。" + hair + "。" + distinctive


def get_theme_label(category: str) -> str:
    """Map category to theme label for prompt header."""
    if any(kw in category for kw in ["都市", "甜宠", "男频"]):
        return "都市"
    elif any(kw in category for kw in ["宫斗", "宅斗", "古风", "玄幻", "仙侠"]):
        return "古装"
    elif "穿越千禧年" in category:
        return "穿越千禧年"
    elif "年代" in category:
        return "年代"
    elif "民国" in category:
        return "民国"
    elif "校园" in category:
        return "校园"
    else:
        return category.split("/")[0] if "/" in category else category


def assemble_prompt(archetype: dict[str, str], dna: dict[str, str],
                    char_attrs: dict[str, str] | None = None,
                    theme_label: str | None = None) -> str:
    face_text = format_face_dna_natural(dna)
    tl = theme_label or get_theme_label(archetype["category"])
    if char_attrs:
        char_line = (
            f"角色：{char_attrs['age']}岁{char_attrs['gender']}，"
            f"{archetype['role_name']}，"
            f"身高{char_attrs['height']}厘米，{char_attrs['body_type']}"
        )
    else:
        char_line = f"角色：{archetype['role_name']}"
    return (
        f"{tl}题材短剧人物角色资产设定图，\n"
        f"{TONE_BLOCK}\n"
        f"人物设定：\n"
        f"写实影视剧演员选角质感，真实皮肤纹理，均匀棚拍光线，超高清，超写实，细节清晰。"
        f"东亚面孔，{char_line}。"
        f"{face_text}。"
        f"穿{archetype['outfit']}。"
        f"单张横向画布，纯白背景，\n"
        f"{STRUCTURE_BLOCK}"
    )


def assemble_video_anchor_prompt(archetype: dict[str, str], dna: dict[str, str],
                                  char_attrs: dict[str, str] | None = None,
                                  theme_label: str | None = None) -> str:
    face_text = format_face_dna_natural(dna)
    tl = theme_label or get_theme_label(archetype["category"])
    if char_attrs:
        char_line = (
            f"角色：{char_attrs['age']}岁{char_attrs['gender']}，"
            f"{archetype['role_name']}，"
            f"身高{char_attrs['height']}厘米，{char_attrs['body_type']}"
        )
    else:
        char_line = f"角色：{archetype['role_name']}"
    return (
        f"短剧人物视频锚点图，写实影视剧演员选角质感，真实皮肤纹理，均匀棚拍光线，超高清，超写实，细节清晰。"
        f"东亚面孔，{char_line}。"
        f"{face_text}。"
        f"穿{archetype['outfit']}。"
        f"{VIDEO_ANCHOR}"
    )


# Legacy wrapper kept for backward compatibility
def _assemble_prompt_legacy(archetype: dict[str, str], dna: dict[str, str]) -> str:
    dna_text = "；".join(dna[key] for key in DNA_KEYS)
    return (
        "短剧人物角色资产设定图，写实影视剧演员选角质感。"
        f"{SKIN_TEXTURE}"
        f"角色原型：{archetype['role_name']}。"
        f"题材：{archetype['category']}。"
        f"原型辅助信息：{archetype['visual_traits']}。"
        f"装扮：{archetype['outfit']}。"
        f"随机 Face DNA：{dna_text}。"
        f"{VIDEO_ANCHOR}"
    )


def select_archetypes(
    rng: random.Random,
    archetypes: list[dict[str, str]],
    category: str,
    count: int,
) -> list[dict[str, str]]:
    # Flexible matching: category substring in archetype["category"] OR archetype["category"] contains category
    # This allows "古装" to match "古风权谋", "古风爱情", "宫斗宅斗" via THEME_ALIASES
    THEME_ALIASES = {
        "古装": ["宫斗宅斗", "古风权谋", "古风爱情", "玄幻仙侠"],
        "都市": ["都市爱情", "男频逆袭/都市日常", "甜宠题材", "都市玄幻", "都市脑洞/系统流"],
    }
    if category in THEME_ALIASES:
        match_cats = THEME_ALIASES[category]
        candidates = [a for a in archetypes if a["category"] in match_cats]
    else:
        candidates = [
            archetype
            for archetype in archetypes
            if not category or category in archetype["category"]
        ]
    if not candidates:
        available = sorted({archetype["category"] for archetype in archetypes})
        raise ValueError(f"No role archetypes matched category {category!r}. Available categories: {available}")
    if count <= len(candidates):
        return rng.sample(candidates, count)
    return [rng.choice(candidates) for _ in range(count)]


def build_rows(
    category: str,
    count: int,
    seed: int,
    resolution: str,
    max_same_fields: int,
) -> list[dict[str, Any]]:
    archetypes = load_json(BASE_DIR / "assets" / "role_archetypes.json")
    pools = load_json(BASE_DIR / "assets" / "face_dna_pools.json")
    rules = load_json(BASE_DIR / "assets" / "compatibility_rules.json")
    rng = random.Random(seed)
    selected = select_archetypes(rng, archetypes, category, count)

    rows: list[dict[str, Any]] = []
    generated_dna: list[dict[str, str]] = []
    for index, archetype in enumerate(selected, start=1):
        profile = infer_profile(archetype, rules)
        dna = unique_dna(rng, pools, rules, profile, generated_dna, max_same_fields)
        generated_dna.append(dna)
        char_attrs = gen_char_attrs(rng, profile)
        rows.append(
            {
                "asset_id": f"CHAR-{index:03d}",
                "role_archetype_id": archetype["archetype_id"],
                "category": archetype["category"],
                "role_name": archetype["role_name"],
                "seed": seed,
                "face_dna": dna,
                "char_attrs": char_attrs,
                "prompt_version": "random-character-v05-fourview-only",
                "prompt": assemble_prompt(archetype, dna, char_attrs),
                "分辨率": resolution,
            }
        )
    return rows


def write_rows(rows: list[dict[str, Any]], output: Path, simple: bool) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    if output.suffix.lower() == ".json":
        output.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
        return

    fieldnames = ["prompt", "分辨率"] if simple else [
        "asset_id",
        "role_archetype_id",
        "category",
        "role_name",
        "seed",
        "face_dna",
        "char_attrs",
        "prompt_version",
        "prompt",
        "分辨率",
    ]
    with output.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writable = dict(row)
            writable["face_dna"] = json.dumps(row["face_dna"], ensure_ascii=False)
            if "char_attrs" in writable:
                writable["char_attrs"] = json.dumps(row["char_attrs"], ensure_ascii=False)
            writer.writerow({key: writable.get(key, "") for key in fieldnames})


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", default="", help="Substring filter, e.g. 都市 or 都市爱情")
    parser.add_argument("--count", type=int, default=20)
    parser.add_argument("--seed", type=int, default=20260530)
    parser.add_argument("--resolution", default="2560:1440")
    parser.add_argument("--max-same-fields", type=int, default=6)
    parser.add_argument("--simple", action="store_true", help="CSV output contains only prompt and resolution")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    rows = build_rows(
        args.category,
        args.count,
        args.seed,
        args.resolution,
        args.max_same_fields,
    )
    write_rows(rows, args.output, args.simple)
    print(f"Wrote {len(rows)} character prompts to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
