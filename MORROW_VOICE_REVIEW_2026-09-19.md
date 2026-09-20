# Morrow 音色定稿记录

> 日期：2026-09-19
> 状态：唯一音色与单音频播放方案已定稿
> 资产目录：`voice-test/morrow-growth-voice/`

## 1. 最终结论

用户确认 Morrow 在全部年龄和章节中使用同一个固定音色，不再按成长阶段切换声线。

| 字段 | 内容 |
|---|---|
| 正式 `voiceProfileId` | `morrow_voice_v1` |
| 唯一参考文件 | `morrow_voice_standard_v1.wav` |
| 正式台词制作方式 | 千问 `qwen-audio-3.0-tts-flash` + Morrow 专属复刻音色 |
| 参考音频 SHA-256 | `8a7d95145f7ff841d2934e2530b3df3f7cf761023fddc4ef43ad52887b23cc5f` |
| 发布基准格式 | WAV / PCM / 16 kHz / 单声道 / 16-bit；RIFF 与 data 长度字段正确 |
| 发布基准音量 | 有效语音 RMS `-19.91 dBFS`；峰值 `-6.41 dBFS` |
| 适用范围 | 第 1—7 章、全部年龄阶段、每条台词一份正常语速音频 |

用户播放时可选择 `1.0×`、`0.8×`、`0.6×`，客户端实时变速并保持音高。

发布基准将原始文件转换为 WAV / PCM / 16 kHz / 单声道 / 16-bit，修正 RIFF 与 data 长度字段，并应用约 `-1.62 dB` 电平校准；不改变音高、语速、措辞或角色声线。

## 2. 后续发布规范

- 每条正式台词统一使用千问 `qwen-audio-3.0-tts-flash` 和基于 `morrow_voice_standard_v1.wav` 创建的同一专属复刻音色生成；
- 每条台词只生成一份正常语速音频，生成参数为 `rate=1.0`、`pitch=1.0`；
- 生成后统一转换为 WAV / PCM / 16 kHz / 单声道 / 16-bit，并修正 RIFF 与 data 长度字段；
- 统一处理到有效语音 RMS `-20 dBFS`，允许误差 `±1 dB`；
- 峰值不得高于 `-3 dBFS`；
- 后处理不得改变音高、音色、语速和措辞；
- 同一音频在 `1.0×`、`0.8×`、`0.6×` 播放时保持音高，变速听感自然；
- 只有通过文本、声线、响度和听感检查的文件才能标记为 `ready`。

处理脚本：`english-pet/scripts/normalize_morrow_audio.py`。
