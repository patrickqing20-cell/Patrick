#!/usr/bin/env python3
"""Build the bundled Mandarin urban short-drama dialogue database."""

from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / "assets" / "mandarin_urban_dialogue_database.json"
CSV_PATH = ROOT / "assets" / "mandarin_urban_dialogue_database.csv"


CATEGORIES = [
    ("cold_distance", "冷淡疏离", ["冷感主角", "前任", "职场上位者"], "失望克制", [
        "我们已经没关系了。", "你不用再解释。", "以后别再来找我。", "这不是你该问的事。",
        "我没有义务等你。", "你迟到了太久。", "我不想再听第二遍。", "你可以走了。",
        "有些事，错过了就是错过了。", "从今天开始，我们各走各的。"
    ]),
    ("pressure_control", "压迫掌控", ["霸总", "强势上司", "掌权者"], "低压强势", [
        "我不喜欢别人替我做决定。", "这件事，我说了算。", "不要挑战我的耐心。", "你没有拒绝的余地。",
        "我给你的时间不多。", "先回答我的问题。", "别让我再问第二次。", "你最好想清楚再开口。",
        "我可以给你机会，也可以收回来。", "我的底线，不是谁都能碰。"
    ]),
    ("restrained_grievance", "隐忍委屈", ["受伤主角", "隐忍伴侣", "被误解者"], "委屈克制", [
        "你有没有哪怕一次，相信过我？", "原来你一直是这么想我的。", "我解释过，是你不愿意听。", "我等了你整整一夜。",
        "你明明知道，我最怕什么。", "我没有你想得那么坚强。", "我只是想听你说一句实话。", "我以为你会站在我这边。",
        "你可以不爱我，但别骗我。", "我已经没有力气再解释了。"
    ]),
    ("breakup_decision", "决绝分手", ["清醒主角", "离婚妻子", "失望恋人"], "决绝平静", [
        "这次，我不会再回头了。", "我们到此为止。", "我不要你的补偿。", "以后，各自珍重。",
        "我已经决定了。", "你不用再挽留我。", "迟来的道歉，我不需要。", "我不是在赌气。",
        "我终于学会放过自己了。", "这段关系，我退出。"
    ]),
    ("revenge_counterattack", "复仇反击", ["复仇主角", "归来者", "隐藏身份者"], "冷静锋利", [
        "你欠我的，我会一点一点拿回来。", "现在，该轮到你害怕了。", "这只是开始。", "我回来，不是为了原谅你。",
        "你做过的事，我一件都没忘。", "别急，我们慢慢算。", "你以为我还是从前的我吗？", "这一次，我不会再输。",
        "你最在意的，我会亲手拿走。", "好戏才刚刚开始。"
    ]),
    ("identity_reveal", "身份揭晓", ["隐藏大佬", "失踪继承人", "归来强者"], "沉稳揭晓", [
        "你一直想找的人，就是我。", "重新认识一下，我才是这里的负责人。", "这家公司，是我的。", "你手里的那份合同，是我签的。",
        "不用猜了，是我安排的。", "我从来没有离开过。", "你口中的那个人，就站在你面前。", "现在，你知道我是谁了吗？",
        "这个位置，本来就属于我。", "我没有隐瞒，只是你从没问过。"
    ]),
    ("suspicion_probe", "试探怀疑", ["警惕主角", "调查者", "敏锐伴侣"], "怀疑试探", [
        "你是不是还有事情瞒着我？", "你刚才为什么躲开我的眼睛？", "这句话，你自己信吗？", "你到底在害怕什么？",
        "你认识他，对不对？", "你今天很不对劲。", "你为什么突然改口？", "你确定，这就是全部真相？",
        "你先告诉我，昨晚你在哪里。", "我再给你一次说实话的机会。"
    ]),
    ("gentle_comfort", "温柔安慰", ["温柔恋人", "医生", "可靠朋友"], "温柔安抚", [
        "没关系，你已经做得很好了。", "别怕，我在这里。", "慢一点，不着急。", "你可以不用一直逞强。",
        "累了就休息一下。", "这次换我陪着你。", "你不用一个人扛。", "想哭就哭吧。",
        "我不会走。", "先照顾好自己，好吗？"
    ]),
    ("family_conflict", "家庭冲突", ["女儿", "母亲", "妻子", "儿子"], "压抑爆发", [
        "在你眼里，我到底算什么？", "你们从来没有问过我愿不愿意。", "我不是你们安排的人生。", "为什么每次妥协的人都是我？",
        "这个家，不是只有你会累。", "你只看见他的难处，那我呢？", "我已经忍了很多年。", "你别再替我做决定。",
        "我不是来听你指责我的。", "这一次，我想为自己活。"
    ]),
    ("workplace_confrontation", "职场交锋", ["女高管", "律师", "创业者", "项目负责人"], "专业克制", [
        "方案可以改，底线不能退。", "我只看结果。", "这不是理由。", "数据不会替你说谎。",
        "请你先回答核心问题。", "风险我会承担，决定也由我来做。", "这份报告，你重新做。", "合作可以继续，但条件要重谈。",
        "我需要的是解决方案，不是借口。", "今天下班前，我要看到结果。"
    ]),
    ("crisis_urgency", "危机催促", ["保护者", "调查者", "逃亡者", "医生"], "急切克制", [
        "别问了，先离开这里。", "马上关掉手机。", "你现在就走。", "不要回头。",
        "听我的，先上车。", "来不及解释了。", "他们已经发现你了。", "记住，千万别开门。",
        "你先保证自己的安全。", "到安全的地方再联系我。"
    ]),
    ("light_daily", "轻喜日常", ["欢喜冤家", "室友", "年轻情侣", "同事"], "轻松自然", [
        "你紧张什么，我又不会吃了你。", "你今天怎么这么奇怪？", "行了，别装了。", "你是不是又忘了？",
        "我就知道你靠不住。", "少来这套。", "你先把嘴角压下去再说。", "我可什么都没答应。",
        "你这人怎么这么会找借口？", "好吧，这次算你赢。"
    ])
]


def acting_note(category_id: str, index: int) -> str:
    notes = {
        "cold_distance": ["开口前轻停顿，声音偏低，结尾收声。", "表情克制，不要提高音量。"],
        "pressure_control": ["语速偏慢，咬字清晰，压低声音。", "直视镜头，句尾明确落下。"],
        "restrained_grievance": ["眼神略有动摇，声音轻，不要哭喊。", "开口前短暂停顿，委屈压在声音里。"],
        "breakup_decision": ["声音平静，结尾不要拖长。", "保持冷静，不要激烈表演。"],
        "revenge_counterattack": ["轻微冷笑后开口，声音稳定。", "压低声音，重点词略微加重。"],
        "identity_reveal": ["沉稳开口，留出短暂停顿。", "语气自然，不要刻意炫耀。"],
        "suspicion_probe": ["轻微皱眉，语速中等。", "尾音略沉，等待对方回答。"],
        "gentle_comfort": ["声音放柔，语速稍慢。", "轻微呼吸，表情温和。"],
        "family_conflict": ["压住情绪，逐渐加重语气。", "有情绪但不要喊叫。"],
        "workplace_confrontation": ["专业、简洁，咬字清楚。", "表情冷静，语速稳定。"],
        "crisis_urgency": ["语速略快但清楚，不要喊。", "急切压低声音，动作保持克制。"],
        "light_daily": ["语气自然，带一点轻松调侃。", "嘴角轻微变化，不要夸张。"]
    }
    return notes[category_id][index % 2]


def build_rows() -> list[dict[str, object]]:
    rows = []
    for category_id, category_name, role_tags, emotion, lines in CATEGORIES:
        for index, line in enumerate(lines, start=1):
            rows.append(
                {
                    "dialogue_id": f"MANDARIN-{len(rows) + 1:03d}",
                    "category_id": category_id,
                    "category_name": category_name,
                    "role_tags": role_tags,
                    "emotion": emotion,
                    "intensity": "中" if index <= 6 else "偏强",
                    "line_text": line,
                    "acting_note": acting_note(category_id, index),
                    "duration_hint": "10秒内单句",
                }
            )
    return rows


def main() -> int:
    rows = build_rows()
    JSON_PATH.write_text(
        json.dumps({"version": "1.0.0", "count": len(rows), "dialogues": rows}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    with CSV_PATH.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        for row in rows:
            writer.writerow({**row, "role_tags": " / ".join(row["role_tags"])})
    print(f"Wrote {len(rows)} Mandarin dialogue rows")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
