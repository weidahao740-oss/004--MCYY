# AI / 语音 / 成本技术验证 — 执行计划 1.6

> 项目：Morrow（墨洛）成人英语 AI 宠物
>
> 验证日期：2026-09-17
>
> 重要声明：本阶段**没有真实 API 密钥、没有真实音频样本**。
> 本文所有"测试结果"均为**静态检查 / TypeScript 类型检查 / Mock 模拟**；
> 真实 API 调用、角色一致性跑测、ASR 准确率、TTS 音色主观评估、端到端延迟，
> 全部列入文末"待真实密钥验证"，**未验证项不写成已完成**。
>
> 价格与政策均来自下方标注的官方/可核验来源；无法确认的标注"未核实"。

---

## 1. 候选对话模型（LLM）对比

| 模型 | 上下文窗口 | 结构化输出 / JSON mode | 输入单价 (USD/百万 token) | 输出单价 | 中国大陆可访问性 | 数据政策 | 官方来源 |
|---|---|---|---|---|---|---|---|
| OpenAI GPT-4o-mini | 128K | 支持（`response_format=json_object`） | $0.15 | $0.60 | 需翻墙（无国内节点） | API 默认不用于训练；滥用日志默认保留 30 天；可申请 ZDR 零保留 | [OpenAI Pricing](https://openai.com/api/pricing)、[Azure OpenAI 定价页](https://azure.microsoft.com/en-au/pricing/details/azure-openai/) |
| OpenAI GPT-4o | 128K | 支持 | $2.50 | $10.00 | 需翻墙 | 同上 | [OpenAI Pricing](https://openai.com/api/pricing) |
| Anthropic Claude Haiku 4.5 | 200K | 支持（结构化输出 tool） | $1.00 | $5.00 | 需翻墙（Anthropic 无中国大陆节点） | PAYG 默认 Zero Data Retention、默认不用于训练，GDPR DPA 可签 | [Claude Pricing](https://claude.com/pricing)、[Haiku 4.5 模型页](https://platform.claude.com/docs/en/about-claude/pricing) |
| DeepSeek V4 Flash（deepseek-chat 别名） | 官方未在本页标注上限（历史版本 128K） | 支持（OpenAI 兼容 response_format） | 闲时缓存未命中 ≈ $0.14（国内 ¥1/百万输入） | 闲时 ≈ $0.28（¥2/百万输出）；峰谷时段不同 | **国内直连** | 官方页未在本阶段核实其训练 opt-out 细则，**未核实**（需在落地时书面确认） | [DeepSeek 模型与价格](https://api-docs.deepseek.com/quick_start/pricing/) |
| Kimi K2.6（月之暗面） | 262,144 | 支持（OpenAI 兼容） | 缓存未命中 ¥6.5/百万（≈$0.95） | ¥27/百万（≈$4.00） | **国内直连** | 未核实（需查平台数据保留条款） | [Kimi K2.6 定价](https://www.kimi.com/resources/kimi-k2-6-pricing)、[Kimi 开放平台](https://platform.kimi.com/) |
| 字节 Doubao Seed 2.1-pro（火山方舟） | 未在本阶段核实 | 支持（方舟兼容模式） | ¥6/百万输入（≈$0.83） | ¥30/百万输出（≈$4.17） | **国内直连** | 未核实（需在火山控制台确认"不用于训练"条款） | [火山方舟模型价格](https://www.volcengine.com/product/ark) |
| 字节 Doubao Seed 2.1-turbo（火山方舟） | 未核实 | 支持 | ¥3/百万输入（≈$0.42） | 输出价未在本阶段核实 | **国内直连** | 未核实 | [火山方舟模型价格](https://www.volcengine.com/product/ark) |

> 注：DeepSeek/V4 自 2026-08 起采用峰谷分时定价（闲时更低、高峰更高），成本估算按**闲时**口径。
> 汇率统一按 **1 USD = 7.2 CNY** 估算（假设值，实际以支付日为准）。

---

## 2. 候选 ASR 对比

| 服务 | 支持语言（含英语） | 中文口音英语 | 计费方式 | 单价 | 中国大陆可访问性 | 数据保留政策 | 置信度/时间戳 | 官方来源 |
|---|---|---|---|---|---|---|---|---|
| OpenAI gpt-4o-mini-transcribe（Whisper 系） | 多语言含英语 | 较好（开源 Whisper 系） | 按分钟 | ≈$0.003/分钟（旧 whisper-1 ≈$0.006/分钟） | 需翻墙 | 同 OpenAI API：默认不训练，日志 30 天 | verbose_json 可返回词级时间戳 | [OpenAI Pricing](https://openai.com/api/pricing)、[APIScout 对比](https://apiscout.dev/guides/speech-to-text-api-comparison-2026/raw.md) |
| Deepgram Nova-3 | 英语为主 | 英语口音处理好 | 按分钟（预录/流式不同） | 预录 ≈$0.0077/分钟；流式促销 ≈$0.0048/分钟 | 需翻墙 | **默认 opt-in 模型改进计划**，需显式 opt-out | 返回词级置信度与时间戳 | [Deepgram 定价（第三方整理）](https://www.cometapi.com/best-speech-to-text-apis/) |
| 阿里云 Paraformer（智能语音交互） | 中英双语、22 方言 | **中英口音英语友好**（面向国内用户） | 按秒 / 按小时 | ¥0.00008/秒（≈¥0.288/小时）；实时识别 ¥3.5/小时 | **国内直连** | 未核实（需查阿里云 ISI 数据保留条款） | 支持词级时间戳/置信度 | [阿里云 ISI 计费](https://help.aliyun.com/zh/isi/product-overview/billing-10)、[Paraformer 计费](https://help.aliyun.com/zh/isi/developer-reference/metering-and-billing) |
| 火山豆包 录音文件识别 2.0 | 中文+英语 | 中英混合场景适配 | 按小时 | ¥0.8/小时；流式 ¥4.5/小时 | **国内直连** | 未核实 | 未核实（需查接口返回字段） | [豆包大模型价格](https://www.volcengine.com/product/doubao/) |
| AssemblyAI Universal-2 | 英语为主 | 一般 | 按分钟 | ≈$0.0062/分钟 | 需翻墙 | 未核实 | 返回词级时间戳 | [Cyberax 对比](https://cyberax.com/ai-playbook/whisper-vs-deepgram-vs-assemblyai) |
| 腾讯云 ASR / 讯飞听写 | 中英 | 中文口音强 | 未在本阶段核实 | 未核实 | 国内直连 | 未核实 | — | —（本阶段未取得可核验官方页） |

---

## 3. 候选 TTS 对比

| 服务 | 英语音色质量 | 语速调节 | 计费方式 | 单价 | 中国大陆可访问性 | 数据政策 | 官方来源 |
|---|---|---|---|---|---|---|---|
| OpenAI TTS（tts-1 / gpt-4o-mini-tts） | 中等偏上，6 个固定音色 | 支持 speed 0.25–4.0 | 按字符 | tts-1 $15/百万字符；tts-1-hd $30/百万字符 | 需翻墙 | 同 OpenAI API | [OpenAI TTS 定价（第三方整理）](https://texttolab.com/blog/openai-tts-pricing)、[OpenAI Pricing](https://openai.com/api/pricing) |
| ElevenLabs（Flash v2.5 / v3） | **英语成人音色业界第一梯队**，表现力强 | 支持 | 按字符/分钟 | Flash ≈$0.05/分钟；v3 ≈$0.10/分钟 | 需翻墙 | 未核实（企业 DPA 可签） | [ElevenLabs TTS](https://elevenlabs.io/text-to-speech-api)、[定价](https://elevenlabs.io/pricing/api) |
| 阿里云 CosyVoice / qwen3-tts | 英语可用，成人音色选择需试听 | 支持 | 按字符 | CosyVoice ¥2/万字符；qwen3-tts ¥0.8/万字符 | **国内直连** | 未核实 | [阿里云 ISI 计费](https://help.aliyun.com/zh/isi/product-overview/billing-10)、[qwen3-tts 模型页](https://help.aliyun.com/zh/model-studio/qwen3-tts-vc) |
| 火山豆包语音合成 2.0 | 中文音色丰富，英语成人音色需试听 | 支持 | 按字符 | ¥5/万字符；精品长文本低至 ¥1/万字符 | **国内直连** | 未核实 | [豆包价格](https://www.volcengine.com/product/doubao/)、[豆包语音计费](https://www.volcengine.com/docs/6561/1359370) |
| Azure TTS（神经音色） | 英语音色质量高、自然 | 支持 | 按字符 | standard ≈$4/百万字符、neural2 ≈$16/百万字符（第三方整理） | 有 Azure 中国节点（需企业账号） | Azure 不使用客户内容训练（官方条款） | [synthorai 对比](https://synthorai.io/docs/api/text-to-speech/)；Azure 官方定价页未在本阶段直接抓取 |

---

## 4. 推荐方案

优先级：**单人开发者、中国大陆可访问、成本可控、数据不用于训练、成人化英语音色**。

### 首版推荐组合（国内直连、成本最低）

| 层 | 选择 | 理由 |
|---|---|---|
| LLM | **DeepSeek V4 Flash（闲时口径）** | 国内直连、OpenAI 兼容端点、闲时输入 ¥1/百万、输出 ¥2/百万，成本量级远低于海外模型；角色提示词与结构化输出契约不挑模型 |
| ASR | **火山豆包录音文件识别 2.0（¥0.8/小时）** 或阿里云 Paraformer | 国内直连、中英口音场景便宜；录音文件识别对"8–12 秒短语音"足够，无需为流式多花钱 |
| TTS | **火山豆包语音合成 2.0（¥5/万字符）** 或阿里云 CosyVoice | 国内直连；英语成人音色需在真实密钥阶段试听后最终选定 |

### 备选组合（质量优先，需翻墙）

- LLM：Claude Haiku 4.5（角色一致性与零数据保留最佳）+ ASR：OpenAI gpt-4o-mini-transcribe + TTS：ElevenLabs Flash v2.5。
- 适用：当国内组合的角色拟人度或音色主观评估不达标时切换。
- 工程上切换零成本：所有调用都走 `packages/ai` 的统一接口，改环境变量即可（见 `packages/ai/README.md`）。

> 数据政策说明：OpenAI / Anthropic 的"默认不训练 + 30 天日志 / ZDR"为其官方政策；
> 国内三家的训练与保留条款在本阶段**未核实**，落地前必须在合同/控制台书面确认"客户输入不用于模型训练"。

---

## 5. 角色一致性与结构化输出验证策略

1. **契约对齐**：`packages/ai/src/validation.ts` 的 `morrowReplySchema` 与 `PET_SYSTEM_PROMPT.md` 第 4 节逐字段一致（`output_schema_version: morrow-reply-1.0`）。
2. **必须校验的字段**（任何一项不合格即拒绝输出并触发降级）：
   - `reply_text`：1–800 字符；
   - `reply_language`：`en` | `zh-en`；
   - `question_count`：0 或 1（角色规则：每轮最多一个主问题）；
   - `suggested_recovery`：六枚举之一（`none/retry_voice/type_text/simpler_english/reference_reply/confirm_asr`）；
   - `emotion`：六枚举；
   - `event.action`：`none/continue/transition/pause/complete`——服务端还须再校验该迁移是否在事件配置白名单内（Schema 只做格式校验，不做业务合法性）；
   - `memory_proposals`：≤3 条，且 `requires_user_confirmation` 恒为 `true`；
   - `safety.mode` 与 `stop_roleplay`。
3. **校验失败路径**：`parseMorrowReply()` 返回结构化错误 → `safeComplete()` 自动追加"只输出合法 JSON"重试一次 → 仍失败则返回安全兜底文字，**绝不把模型原文直接吐给用户**。
4. **角色一致性跑测（待真实密钥）**：用固定 30–50 条用户输入（覆盖迟到、吐槽、请假、要求中文、要求更简单、自我伤害暗示等），人工核验 `reply_text` 是否保持成人化、不夸奖、不幼稚、不泄露内部规则。本阶段**未做**。

---

## 6. 记忆提取与调用验证策略

- **提取**：模型输出经 Schema 校验后，`memory_proposals` 即为三类记忆候选（`life` / `language` / `relationship`）。`filterMemoryProposals()` 只保留 `requires_user_confirmation === true` 的提案，与 `DATA_MODEL.md` 第 7 节对齐。
- **确认**：提案先以 `status=proposed` 落库，**不进入** `ACTIVE_MEMORIES`；用户在 UI 点 Save/Edit/Reject 后才转 `confirmed`/`rejected`，并追加 `memory_revisions`。
- **注入**：下一轮组装上下文时，检索 `status=confirmed AND deleted_at IS NULL AND paused_at IS NULL AND (expires_at IS NULL OR expires_at>now())` 的相关记忆，渲染进 `ACTIVE_MEMORIES` 段。
- **验证（本阶段已做静态对齐，运行时待真实密钥）**：确认后注入 → 模型在下一轮自然引用该记忆；用户删除后下一轮不再引用。Mock 层只验证了"提案生成格式正确"，**端到端记忆闭环未跑**。

---

## 7. 降级方案

| 故障点 | 用户看到 | 系统记录 |
|---|---|---|
| LLM 超时 / HTTP 错误 | "It took me a little too long to answer. Try saying that again." | `error=llm_timeout/llm_http_error`，记耗时与供应商，不落对话原文 |
| LLM 返回非法 JSON / Schema 拒绝 | 先自动重试一次；仍失败则显示安全兜底句 "I'm having trouble thinking clearly…" | `error=llm_invalid_json/llm_schema_rejected` + issues 摘要 |
| ASR 失败（上传/超时/空结果） | "I couldn't hear that clearly. Type it, or hold the mic closer and try again." **不阻塞，可直接打字** | `error=asr_http_error`，不写 `messages.content_text` |
| ASR 低置信度（<0.6） | UI 把转写文本做成**可编辑框**，提示 "I heard: … did I get that right?" | 传 `asr_confidence` 给模型，期望 `needs_clarification=true, suggested_recovery=confirm_asr` |
| TTS 失败 | **文字字幕照常显示**，只是没有声音 | `error=tts_http_error/tts_empty_audio`，对话不中断 |

所有路径在 `packages/ai/src/degradation.ts` 实现，demo-full-event.ts 已用 Mock 演练（含一次故意 ASR 失败）。

---

## 8. 单次事件成本估算

### 8.1 统一假设（可复现）

| 项 | 取值 | 说明 |
|---|---|---|
| 每事件对话轮次 | 10 | 任务给定 8–12 轮，取中值 |
| 系统提示词/轮 | 2,500 token | 2,000–3,000 取中值 |
| 历史+记忆输入/轮 | 2,250 token | 1,500–3,000 取中值 |
| 输出/轮 | 200 token | 100–300 取中值 |
| **LLM 输入/事件** | **47,500 token** | 10 × (2500+2250) |
| **LLM 输出/事件** | **2,000 token** | 10 × 200 |
| 用户语音 | 5 条 × 10 秒 = **50 秒 = 0.833 分钟 = 0.01389 小时** | 4–6 条 × 8–12 秒 |
| 宠物语音 | 9 条 × 6 秒；按字符计 **≈800 字符**（200 token × 4 字符/token） | 8–10 条 × 4–8 秒 |
| 存储/事件 | ≈¥0.005（确认后文本+记忆+日记，KB 级） | 原始音频按策略短期删除 |
| 汇率 | 1 USD = 7.2 CNY | 假设值 |

### 8.2 推荐组合 A：DeepSeek V4 Flash（闲时）+ 豆包 ASR + 豆包 TTS

| 成本项 | 计算 | 单次事件 |
|---|---|---|
| LLM 输入 | 47,500 × ¥1/百万 | ¥0.0475 |
| LLM 输出 | 2,000 × ¥2/百万 | ¥0.004 |
| ASR | 0.01389 小时 × ¥0.8/小时 | ¥0.0111 |
| TTS | 800 字符 = 0.08 万 × ¥5/万 | ¥0.40 |
| 存储 | — | ¥0.005 |
| **合计** | | **≈ ¥0.47 / 事件 ≈ $0.065** |
| **每用户每月（30 次事件）** | ¥0.47 × 30 | **≈ ¥14.0 ≈ $1.94** |

### 8.3 组合 B：GPT-4o-mini + gpt-4o-mini-transcribe + OpenAI TTS（需翻墙）

| 成本项 | 计算 | 单次事件 |
|---|---|---|
| LLM 输入 | 47,500 × $0.15/百万 | $0.0071 |
| LLM 输出 | 2,000 × $0.60/百万 | $0.0012 |
| ASR | 0.833 分钟 × $0.003/分钟 | $0.0025 |
| TTS | 800 字符 × $15/百万 | $0.012 |
| **合计** | | **≈ $0.023 / 事件** |
| **每月 30 次** | | **≈ $0.69（≈¥5.0）** |

### 8.4 组合 C：Claude Haiku 4.5 + Deepgram Nova-3 + ElevenLabs Flash（质量优先，需翻墙）

| 成本项 | 计算 | 单次事件 |
|---|---|---|
| LLM 输入 | 47,500 × $1/百万 | $0.0475 |
| LLM 输出 | 2,000 × $5/百万 | $0.01 |
| ASR | 0.833 分钟 × $0.0077/分钟 | $0.0064 |
| TTS | 0.9 分钟 × $0.05/分钟 | $0.045 |
| **合计** | | **≈ $0.109 / 事件** |
| **每月 30 次** | | **≈ $3.27（≈¥23.6）** |

> 上述为基于公开单价的**理论估算**。实际成本取决于真实 token 用量与音频时长，需在真实密钥验证后用日志用量校准（`packages/ai` 的 `LLMResult.usage` 已预留字段）。

---

## 9. 静态检查与模拟结果（本阶段实际执行）

执行环境：Windows / Node v22.23.2 / TypeScript 5.9 / zod 4.6.5。

### 9.1 TypeScript 类型检查

```
> cd english-pet/packages/ai
> npx tsc -p tsconfig.json
EXIT=0   # 全量 strict 模式通过
```

### 9.2 四个 Mock demo（均 EXIT=0，无真实密钥/音频）

| demo | 结果摘要 |
|---|---|
| `demo-llm.ts` | MockLLM 返回原始 JSON → `parseMorrowReply` 校验通过 `morrow-reply-1.0`，打印 reply_text/emotion/event 迁移/question_count；记忆提案按 `requires_user_confirmation` 过滤；`safeComplete` degraded=false。 |
| `demo-asr.ts` | 三段伪音频分别得到三条可编辑转写 + 置信度（0.54/0.78/0.78）；演示了 <0.6 阈值时 `needs_clarification + confirm_asr` 的 UI 行为；演示了"用户修改版回传"。 |
| `demo-tts.ts` | speed=1.0 vs 1.3 输出不同时长的合法静音 WAV（166KB/128KB）并落盘；故意失败的 BrokenTTS 走 `safeSynthesize` 降级，字幕照常显示。 |
| `demo-full-event.ts` | 完整链路：FlakyASR 第一次抛错 → ASR 降级提示用户重试 → 第二次成功 → MockLLM 结构化输出 → MockTTS 合成 192KB 音频；全程无未捕获异常。 |

---

## 10. 证据门清单

### ✅ 已通过（静态 / 类型 / Mock 模拟）

- [x] 统一适配器接口设计（LLM/ASR/TTS），业务层不依赖具体供应商；
- [x] LLM 输出 Zod Schema 与 `PET_SYSTEM_PROMPT.md` 契约逐字段对齐；
- [x] LLM JSON 解析 + Schema 校验 + 一次自动重试 + 安全兜底（代码路径跑通）；
- [x] ASR 返回 `text`（可编辑）+ `confidence` + 低置信度产品行为演示；
- [x] TTS 语速参数 + 占位 WAV 生成 + 失败只丢声音不丢字幕；
- [x] 三类降级（LLM/ASR/TTS）用户侧文字路径；
- [x] `npx tsc --noEmit` strict 类型检查 EXIT=0；
- [x] 四个 Mock demo 无密钥可跑通；
- [x] 真实供应商实现类（openai-compatible.ts）完整编写，无密钥时抛清晰 `config_missing`，不崩溃。

### ⏳ 待真实密钥与音频样本验证（本阶段**未做**，不得视为已完成）

- [ ] 真实 LLM 输出的角色一致性跑测（成人化、不夸奖、不幼稚、边界不泄露）；
- [ ] 真实模型对 morrow-reply-1.0 的 JSON 遵循率（首次成功率、重试率）；
- [ ] 真实 ASR 对"中式口音英语 8–12 秒短语音"的识别准确率；
- [ ] TTS 英语成人音色主观试听与最终音色选定（豆包 vs CosyVoice vs ElevenLabs）；
- [ ] 端到端真实延迟（ASR→LLM→TTS 全链路秒数）；
- [ ] 三类记忆"确认→注入→自然引用→删除后不再引用"的真实闭环；
- [ ] 国内三家（DeepSeek/火山/阿里云）"客户数据不用于训练"条款的书面确认；
- [ ] 用真实用量日志校准第 8 节成本估算。

> 结论：1.6 的**工程骨架与降级机制**已通过静态与 Mock 验证；
> 但"AI 质量与真实成本"证据门未关闭，**1.6 不标记为整体完成**，待真实密钥阶段补测。
