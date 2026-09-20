# Morrow 固定音色与标准样音计划

> 版本：4.1.0
> 日期：2026-09-19
> 状态：唯一标准音色已定稿，进入预制语音试生产

## 1. 最终音色决策

Morrow 在第 1—7 章及全部年龄阶段中使用同一个固定音色，不再随成长阶段更换声线。

- 正式 `voiceProfileId`：`morrow_voice_v1`
- 原始选定样音：`voice-test/morrow-growth-voice/morrow_age_05_seed_audio_t2a_v1.wav`
- 发布基准参考：`voice-test/morrow-growth-voice/morrow_voice_standard_v1.wav`
- 生成方式：Seed Audio 1.0 T2A
- 标准音色原始 SHA-256：`b025ec2afc1ff4bd65c78073b7fbd4446ce991950ab05babe11dd407ca8c1a27`
- 发布基准 SHA-256：`8a7d95145f7ff841d2934e2530b3df3f7cf761023fddc4ef43ad52887b23cc5f`

发布基准只做电平校准，不改变音高、音色、语速或措辞。

## 2. 固定声音特征

- 中性略偏女性；
- 稚嫩、轻盈、清澈、柔软，音高偏高，共鸣轻且靠前；
- 好奇、真诚、亲近，像初次认识世界；
- 英语自然清楚，情绪克制；
- 避免卡通、尖叫、哭闹、甜腻撒娇、婴儿咿呀、舞台腔、播音腔和客服腔。

成长只通过台词内容、词汇复杂度、语句长度、停顿、情绪和剧情经历表达，不改变角色声线。

## 3. 后续生成规则

1. 每条 Morrow 台词都使用 `morrow_voice_standard_v1.wav` 作为唯一参考音频。
2. Seed Audio 1.0 使用 A2A 模式，提示词用 `@音频1` 指代该参考音频。
3. 不再要求模型把声音变幼、变成年或变老，也不使用年龄变化提示词。
4. 可以调整语速、停顿和情绪强度，但不得改变音高、共鸣位置、性别表达和核心音色。
5. 千问模型只有在能够稳定复用同一正式音色时才可使用；否则不用于正式 Morrow 台词。
6. 每条固定台词生成 normal 与 slow 两个版本，并分别审核。
7. 生成结果必须经过统一响度处理，未经处理和审核不得标记为 `ready`。

### Seed Audio 1.0 A2A 通用提示模板

```text
使用 @音频1 的同一角色音色和声线说出以下英文。严格保持参考音频的音高、共鸣位置、音色质感、性别表达和亲近感，不改变年龄，不重新设计声音。只根据台词语义自然调整停顿和情绪；英语清楚自然、克制，不要播音腔、客服腔、舞台表演、夸张兴奋或甜腻撒娇。无音乐、无环境声、无音效。完整朗读：<英文台词>
```

慢速版只追加：

```text
语速比正常版慢约 15%—20%，保持自然短语节奏，不逐词机械拖长，不改变音高和音色。
```

## 4. 响度统一规范

生成模型的原始振幅、动态范围、停顿长度和余量具有随机性，即使参考音色相同，导出的音量也可能不同。因此发布流程必须包含确定性后处理。

### 当前发布基准

- 容器与编码：WAV / PCM；
- 采样率：`16 kHz`；
- 声道：单声道；
- 位深：`16-bit`；
- WAV 的 RIFF 与 data 长度字段必须与实际文件长度完全一致；
- 目标有效语音 RMS：`-20 dBFS`；
- 允许误差：`±1 dB`；
- 峰值上限：`-3 dBFS`；
- 不改变音高、语速和音色；
- 不以模型原始输出音量作为发布音量。

处理脚本：

```text
english-pet/scripts/normalize_morrow_audio.py
```

用法：

```text
python english-pet/scripts/normalize_morrow_audio.py <input.wav> <output.wav> --sample-rate 16000 --target-active-rms-dbfs -20 --peak-ceiling-dbfs -3 --report <report.json>
```

## 5. 质量门槛

每条 `ready` 音频必须同时满足：

- 使用 `morrow_voice_standard_v1.wav` 作为唯一声音参考；
- 文本逐字准确；
- 听感仍是同一个 Morrow，没有明显换人；
- normal / slow 只改变语速，不改变音色和音高；
- 文件为 WAV / PCM / 16 kHz / 单声道 / 16-bit；
- RIFF 与 data 长度字段正确；
- 有效语音 RMS 在 `-21～-19 dBFS`；
- 峰值不高于 `-3 dBFS`；
- 无削波、爆音、底噪突变、音乐或环境声；
- 文件路径、时长、SHA-256、处理报告和人工审核结论已登记。

## 6. 已淘汰探索资产

以下资产不进入正式内容，仅保留用于决策追溯：

- `morrow_teen_standard_v1.wav`；
- `morrow_child_candidate_seed_audio_01.wav`；
- `morrow_child_candidate_seed_audio_02.wav`；
- `morrow_adult_candidate_seed_audio_01.wav`；
- `morrow_adult_candidate_seed_audio_02.wav`；
- `morrow_age_18_seed_audio_a2a_v1.wav`；
- `morrow_age_25_seed_audio_a2a_v1.wav`；
- `morrow_age_50_seed_audio_a2a_v1.wav`。

淘汰原因：用户确认成长阶段不改变音色；此前候选与参考音色差异不足或不再符合单一声线方案。

## 7. 下一步

使用固定音色与响度流程制作少量 normal / slow 试产台词。试听确认“声线一致、音量一致、慢速自然”后，再批量制作首两章预制语音。
