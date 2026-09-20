# Morrow 千问固定音色试产

> 日期：2026-09-20  
> 状态：3 条 `qwen-audio-3.0-tts-flash` 正常语速试产候选已通过试听并完成发布处理

## 正式生成方案

1. 所有正式预制语音统一使用千问 `qwen-audio-3.0-tts-flash`。
2. 复用基于 `voice-test/morrow-growth-voice/morrow_voice_standard_v1.wav` 创建的同一专属复刻音色。
3. 每条台词只生成一份正常语速音频，生成参数为 `rate=1.0`、`pitch=1.0`、英语语言提示。
4. 不指定固定总时长，由模型根据文本和标点自然决定长度。
5. 保存模型直接返回的原始音频，不额外处理首尾时长。
6. 用户播放时可选择 `1.0×`、`0.8×`、`0.6×`；客户端对同一音频实时变速并保持音高。
7. 先由用户试听；通过后再执行发布响度和格式处理。

## 角色表达指令

- 保持同一角色的音高、共鸣位置、音色质感、性别表达、年龄和亲近感；
- 英语清楚自然、克制；
- 一次连续、完整朗读，只在标点处自然停顿；
- 不得漏词、重复、中断或截断；
- 避免播音腔、客服腔、舞台表演、夸张兴奋或甜腻撒娇；
- 无音乐、无环境声、无音效。

## 当前试产台词

| 组 | 台词 | 来源 |
|---|---|---|
| 短句 | `Which one should we bring back first?` | 第一章 E01-02 `bro_prompt_line` |
| 中句 | `The bell makes one low note. It sounds awake, not alarmed.` | 第一章 E01-02 `bro_bell_result` |
| 长句 | `The room remembers a lamp, a plant, and a small bell, but only one is clear.` | 第一章 E01-02 `bro_open_line` |

## 当前资产

- 原始音频：`voice-test/morrow-preproduction/qwen-raw/`
- 发布音频：`voice-test/morrow-preproduction/ready/`
- 原始生成清单：`voice-test/morrow-preproduction/qwen-raw/qwen_generation_manifest.json`
- 发布清单：`voice-test/morrow-preproduction/ready/release_manifest.json`
- 数量：短/中/长 3 条正常语速音频
- 当前状态：人工试听通过，发布处理完成
