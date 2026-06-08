# Prompt Patterns

## Copy-Ready Video Prompt

```text
【主体】使用上传图片中的唯一人物，严格保持面部身份、发型、发色和服装一致。
【镜头】9:16竖屏，10秒，单人中近景，头顶到腰部，固定机位轻微缓慢推进。
【表演】自然眨眼，轻微呼吸，先看向镜头，再克制地开口，嘴部动作自然。说完后保持自然安静状态。
【对白】人物使用{accent}只说一句：“{line_text}”不得增加、改写、重复或补充台词。
【声音】{age_feel}，{gender_presentation}，{pitch}，音色{timbre}，{speed}，{articulation}，情绪{emotion}。{breath_pause}。
【音频限制】只保留人物说话的人声。不要背景音乐，不要配乐，不要环境声，不要音效，不要提示音，不要混入其他人的声音。台词说完后保持安静。
【禁止】不要字幕，不要文字，不要水印，不要额外人物，不要额外台词，不要旁白，不要夸张动作，不要脸部漂移，不要畸形嘴部。
```

## First-Frame Prompt

Use this only when the source is a four-view sheet or unsuitable portrait:

```text
短剧角色说话视频首帧，9:16竖屏，单人中近景，从头顶完整展示到腰部。
人物正面朝向镜头或轻微侧转不超过15度，嘴部无遮挡，双手不进入画面。
背景简洁干净，均匀柔和影视灯光。严格保持参考角色的面部身份、发型、
发色、肤色和服装一致。不要四视图排版，不要多人，不要字幕，不要文字，
不要水印，不要logo，不要复杂动作。
```

## Adjustment Order

Change one block at a time:

1. Extra words or repeated speech: shorten `【对白】`.
2. BGM or sound effects: strengthen `【音频限制】`; remove scene descriptions.
3. Face drift: simplify `【表演】`; reuse the same first frame and seed.
4. Distorted mouth: use front-facing medium close-up; reduce head turn.
5. Voice mismatch: edit only `【声音】`.
6. Weak acting: add one restrained speaking-state note, such as a short pause,
   tightened lips before speaking, or a soft exhale after the line.
