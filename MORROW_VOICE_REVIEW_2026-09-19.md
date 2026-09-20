# Morrow 音色定稿记录

> 日期：2026-09-19
> 状态：唯一音色已定稿
> 资产目录：`voice-test/morrow-growth-voice/`

## 1. 最终结论

用户确认 Morrow 在全部年龄和章节中使用同一个固定音色，不再按成长阶段切换声线。

| 字段 | 内容 |
|---|---|
| 正式 `voiceProfileId` | `morrow_voice_v1` |
| 原始选定文件 | `morrow_age_05_seed_audio_t2a_v1.wav` |
| 发布基准文件 | `morrow_voice_standard_v1.wav` |
| 生成方式 | Seed Audio 1.0 T2A |
| 原始音频 SHA-256 | `b025ec2afc1ff4bd65c78073b7fbd4446ce991950ab05babe11dd407ca8c1a27` |
| 发布基准 SHA-256 | `8a7d95145f7ff841d2934e2530b3df3f7cf761023fddc4ef43ad52887b23cc5f` |
| 发布基准格式 | WAV / PCM / 16 kHz / 单声道 / 16-bit；RIFF 与 data 长度字段正确 |
| 发布基准音量 | 有效语音 RMS `-19.91 dBFS`；峰值 `-6.41 dBFS` |
| 适用范围 | 第 1—7 章、全部年龄阶段、normal / slow |

发布基准将原始文件转换为 WAV / PCM / 16 kHz / 单声道 / 16-bit，修正 RIFF 与 data 长度字段，并应用约 `-1.62 dB` 电平校准；不改变音高、语速、措辞或角色声线。

## 2. 音量差异诊断

生成模型不会保证每次输出相同增益、动态范围、停顿比例和峰值余量，所以使用同一参考音色仍可能出现音量不同。这是响度问题，不等同于角色音色发生变化。

本轮测得：

- 原始选定音色有效语音 RMS：`-18.39 dBFS`；
- 其余样音有效语音 RMS：约 `-25.17～-30.89 dBFS`；
- 最大差异约 `12.50 dB`，足以产生明显的主观音量差。

完整测量结果：`voice-test/morrow-growth-voice/level_analysis.json`。

## 3. 后续发布规范

- 每条台词首先使用 `morrow_voice_standard_v1.wav` 作为唯一参考音频生成；
- 生成后统一转换为 WAV / PCM / 16 kHz / 单声道 / 16-bit，并修正 RIFF 与 data 长度字段；
- 统一处理到有效语音 RMS `-20 dBFS`，允许误差 `±1 dB`；
- 峰值不得高于 `-3 dBFS`；
- 后处理不得改变音高、音色、语速和措辞；
- normal / slow 只允许语速和自然停顿不同，不能改变声线；
- 只有通过文本、声线、响度和听感检查的文件才能标记为 `ready`。

处理脚本：`english-pet/scripts/normalize_morrow_audio.py`。

## 4. 淘汰的成长音色实验

旧少年锚点、幼年/成年候选及 18/25/50 岁实验音频均标记为 `retired_experiment`，只保留用于追溯，不进入产品播放资产。
