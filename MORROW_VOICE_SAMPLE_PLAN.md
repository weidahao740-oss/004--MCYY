# Morrow 固定音色与千问预制语音计划

> 版本：5.0.0
> 日期：2026-09-20
> 状态：已完成——第一、二章 145 条正式预制语音按单音频方案批量制作，客观校验全部通过，17 条代表样本主观试听经用户确认通过（2026-09-20），语音证据门关闭

## 1. 最终方案

Morrow 在第 1—7 章及全部年龄阶段使用同一个固定音色，所有正式音频统一由千问 `qwen-audio-3.0-tts-flash` 制作。

- 正式 `voiceProfileId`：`morrow_voice_v1`
- 正式制作模型：`qwen-audio-3.0-tts-flash`
- 唯一参考音频：`voice-test/morrow-growth-voice/morrow_voice_standard_v1.wav`
- 千问专属复刻音色：基于唯一参考音频创建并与正式模型绑定；音色 ID 仅记录在生成清单或服务端配置中
- 参考音频 SHA-256：`8a7d95145f7ff841d2934e2530b3df3f7cf761023fddc4ef43ad52887b23cc5f`

发布基准只做电平校准，不改变音高、音色、语速或措辞。

## 2. 固定声音特征

- 中性略偏女性；
- 稚嫩、轻盈、清澈、柔软，音高偏高，共鸣轻且靠前；
- 好奇、真诚、亲近，像初次认识世界；
- 英语自然清楚，情绪克制；
- 避免卡通、尖叫、哭闹、甜腻撒娇、婴儿咿呀、舞台腔、播音腔和客服腔。

成长只通过台词内容、词汇复杂度、语句长度、停顿、情绪和剧情经历表达，不改变角色声线。

## 3. 千问生成规则

1. 所有正式台词固定使用 `qwen-audio-3.0-tts-flash`。
2. 复用基于 `morrow_voice_standard_v1.wav` 创建的同一专属复刻音色，不为每条台词重复创建音色。
3. 每条台词只生成一份正常语速音频，`rate=1.0`、`pitch=1.0`、`language_hints=["en"]`。
4. 用户播放时可选择 `1.0×`、`0.8×`、`0.6×`，客户端实时变速并保持音高；不生成独立慢速文件。
5. 模型根据文本、标点、语速和表达指令自然决定朗读时长，不传固定总时长。
6. 原始候选直接采用模型返回结果，不额外处理首尾时长。
7. 指令保持清楚自然、克制、亲近，禁止播音腔、客服腔、舞台表演、夸张兴奋和甜腻撒娇。
8. 每条固定台词生成一份音频并逐条试听；不合格项单独重新生成。
9. API Key 只放服务端环境变量，不写入源码、文档、结果 JSON 或仓库。

## 4. 当前试产资产

- 原始目录：`voice-test/morrow-preproduction/qwen-raw/`
- 发布目录：`voice-test/morrow-preproduction/ready/`
- 原始清单：`voice-test/morrow-preproduction/qwen-raw/qwen_generation_manifest.json`
- 发布清单：`voice-test/morrow-preproduction/ready/release_manifest.json`
- 范围：短/中/长 3 条正常语速音频
- 当前状态：人工试听通过，发布格式与响度处理完成

## 5. 响度统一规范

生成模型的原始振幅、动态范围、停顿长度和余量具有随机性，因此发布流程必须包含确定性后处理。

- 容器与编码：WAV / PCM；
- 采样率：`16 kHz`；
- 声道：单声道；
- 位深：`16-bit`；
- WAV 的 RIFF 与 data 长度字段必须与实际文件长度一致；
- 目标有效语音 RMS：`-20 dBFS`；
- 允许误差：`±1 dB`；
- 峰值上限：`-3 dBFS`；
- 不改变音高、语速、音色或措辞；
- 不以模型原始输出音量作为发布音量。

处理脚本：`english-pet/scripts/normalize_morrow_audio.py`

```text
python english-pet/scripts/normalize_morrow_audio.py <input.wav> <output.wav> --sample-rate 16000 --target-active-rms-dbfs -20 --peak-ceiling-dbfs -3 --report <report.json>
```

## 6. 质量门槛

每条 `ready` 音频必须同时满足：

- 模型为 `qwen-audio-3.0-tts-flash`；
- 使用正式 Morrow 专属复刻音色；
- 文本逐字准确；
- 听感仍是同一个 Morrow，没有明显换人；
- 唯一音频在 `1.0×`、`0.8×`、`0.6×` 播放时保持音高，变速听感自然；
- 文件为 WAV / PCM / 16 kHz / 单声道 / 16-bit；
- RIFF 与 data 长度字段正确；
- 有效语音 RMS 在 `-21～-19 dBFS`；
- 峰值不高于 `-3 dBFS`；
- 无削波、爆音、底噪突变、音乐或环境声；
- 文件路径、模型、音色标识、生成参数、时长、SHA-256、处理报告和人工审核结论已登记。

## 7. 下一步

已完成第一、二章 145 条批量制作与验收（见 `voice-test/morrow-production/manifest.json`）。下一步进入阶段 4：首个正式客户端顺序与云厂商/基础设施选型。
