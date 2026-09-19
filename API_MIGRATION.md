# API_MIGRATION — 旧 Web 原型 API → 新固定内容方案 迁移清单

> 版本：1.0.0（纯设计稿，不改工程代码）
> 配套主文档：`MIGRATION_PLAN_WEB_TO_FIXED_CONTENT.md`
> 依据：`FIXED_CONTENT_CONTRACT.md` v1.0.0、`packages/contracts/src/fixed-content.ts`
> 端点来源：逐行读取 `english-pet/apps/api/src/index.ts`（迁移前真实路由）。
> 判定取值：**保留** / **改字段** / **弃用** / **新增**。

---

## 1. 现状端点全量迁移表（27 个）

> 错误与版本边界统一规则见第 3 节；下表"错误/版本边界"列只写该端点特有的部分。

| # | 方法+路径 | 现状用途（index.ts） | 判定 | 请求/响应字段变化 | 错误与版本边界 | 对应文件 |
|---|---|---|---|---|---|---|
| 1 | `GET /health` | 存活探针，返回 ok/service/environment | 保留 | 无；建议补 `rulesetVersion`、`schemaVersion` 便于调试 | 无鉴权；不暴露密钥 | `apps/api/src/index.ts:71`、`contracts/src/index.ts`（`healthResponseSchema`） |
| 2 | `POST /v1/auth/guest` | 创建访客会话并返回 token | 保留 | 无 | 无 | `index.ts:79`、`memory-account-store.ts` |
| 3 | `POST /v1/auth/register` | 邮箱注册，可选 Bearer 绑定 | 保留 | 无 | `email_exists`→中文"该邮箱已被注册" | `index.ts:83`、`contracts/src/auth.ts` |
| 4 | `POST /v1/auth/session` | 邮箱密码登录 | 保留 | 无 | `invalid_credentials`→中文"邮箱或密码不正确" | `index.ts:101`、`auth.ts` |
| 5 | `DELETE /v1/auth/session` | 登出当前 token | 保留 | 无 | 无 token→中文"需要登录" | `index.ts:118` |
| 6 | `DELETE /v1/me/account` | 注销账号并级联清空全部 store | 保留 | 无；级联顺序不变（firstDay/event/conversation/journal/resurfacing/memory） | 204 无体；删除后旧 token 立即失效 | `index.ts:125`、`account-deletion.smoke.ts` |
| 7 | `GET /v1/me` | 返回当前用户/设置/宠物摘要 | 改字段 | `settings.interfaceLocale` 固定 `zh-CN`、不再接受 `en`；`meResponseSchema` 其余不变 | 未登录→中文"需要登录" | `index.ts:138`、`auth.ts`（`meResponseSchema`） |
| 8 | `PATCH /v1/me/settings` | 部分更新设置 | 改字段 | 移除"界面语言"可写项（`interfaceLocale` 只读）；`correctionPreference` 等保留 | 空 patch→中文"至少提供一项设置" | `index.ts:144`、`auth.ts`（`updateSettingsRequestSchema`） |
| 9 | `GET /v1/pet/home` | 宠物主页：情绪/活动/今日事件/欢迎语 | 改字段 | 删 `statusTextEn/returnMessageEn`、`dailyEventSummary.titleEn`，只留 `*Zh`；今日事件改指向固定内容章节/事件 | 未登录→中文 | `index.ts:158`、`contracts/src/pet-home.ts` |
| 10 | `POST /v1/pet/actions` | 主页动作 greet/listen/rest | 改字段 | 动作保留；返回中文文案；不再由 LLM 生成 | `petActionSchema` 枚举不变 | `index.ts:164`、`pet-home.ts` |
| 11 | `GET /v1/journals` | 共同记忆册列表 | 改字段 | 列表条目补 `textVersion`、`translationVersion` 快照字段（回看用生成时版本） | 无鉴权→中文 | `index.ts:176`、`contracts/src/journal.ts` |
| 12 | `POST /v1/journals/:id/actions` | edit/hide/restore/delete，乐观锁 | 改字段 | 动作与 `expectedVersion` 乐观锁保留；`edit` patch 字段补译文版本 | `journal_not_found/version_conflict/action_not_allowed/memory_not_confirmed`→中文；409 语义不变 | `index.ts:182`、`journal.ts` |
| 13 | `GET /v1/memories` | 长期记忆 proposed/saved/restricted 计数 | 保留 | 字段不变；记忆来源仅事件声明规则/显式确认请求 | `memoryEnabled=false` 时返回空 | `index.ts:203`、`contracts/src/memory.ts` |
| 14 | `POST /v1/memories/:id/actions` | confirm/edit/pause/resume/reject/delete | 改字段（兼作记忆提案确认） | 动作保留；`confirm/edit` 仍要求可编辑文本；这是契约"记忆需确认"的落点 | `memory_not_found/version_conflict/action_not_allowed/restricted`→中文；`restricted`→中文"敏感内容不能存入长期记忆" | `index.ts:209`、`memory.ts` |
| 15 | `GET /v1/first-day` | 首日状态机当前视图 | 改字段 | `morrowLines` 改固定台词+译文；`restoredObject` 枚举扩 `small_bell`；`userTaskEn` 移除只留 `userTaskZh` | 未完成复核不可跳过→中文 | `index.ts:228`、`contracts/src/first-day.ts`、`memory-first-day-store.ts` |
| 16 | `POST /v1/first-day/actions` | 首日动作 start/continue/submit_name/select_object/finish 等 | 改字段 | `select_object` 增 `small_bell`；语义对齐 `birth_restore_object_v1` | `first_day_action_not_allowed/memory_review_incomplete`→中文 | `index.ts:234`、`first-day.ts` |
| 17 | `GET /v1/events` | 事件目录（现返回 `events-v1.0.0` 5 事件） | 改字段 | 改返回 `fixed-content-v1.0.0` 章节/事件目录，带 `rulesetId/schemaVersion/personaVersion`；事件为固定内容事件 | 客户端 `schemaVersion` 不匹配→停止并中文升级提示（见第 3 节） | `index.ts:249`、`memory-event-engine.ts`（`catalog()`） |
| 18 | `GET /v1/events/current` | 当前进行中的事件实例 | 改字段 | 实例视图改由固定内容状态结构返回（当前状态、中文选项、可编辑参考句、可恢复点） | 无进行中实例返回 `instance:null` | `index.ts:255`、`contracts/src/event-runtime.ts` |
| 19 | `POST /v1/events/start` | 按 eventKey+幂等键启动事件 | 改字段 | `eventKey` 改固定内容事件 ID；仍需 `idempotencyKey`；未解锁返回锁定 | `event_locked`→中文"该事件暂不可用"；幂等重复返回同实例 | `index.ts:261`、`event-runtime.ts`（`startEventRequestSchema`） |
| 20 | `POST /v1/events/:id/resurfacing` | 记录复现提示结果 used/paraphrased/ignored… | 保留（收窄） | 字段不变；触发与记录限定为"已确认且未暂停记忆"，一次最多 1 条 | `resurfacing_not_available`→中文 | `index.ts:276`、`contracts/src/resurfacing.ts`、`memory-resurfacing-store.ts` |
| 21 | `POST /v1/events/:id/actions` | 事件状态推进（核心） | 改字段 | 由"启发式猜分支"改为确定性意图匹配：输入仅经标准化后在当前状态 `eligibleStateIds` 打分；未达阈值返回保持状态+最多 3 候选；`worldStateWrites` 白名单写入 | `event_not_found`→中文；`transition_not_allowed` 语义保留但改由"无唯一可达意图"触发；新增意图类错误码（见第 3 节） | `index.ts:291`、`memory-event-engine.ts`（`act()`）、`contracts/src/event-runtime.ts` |
| 22 | `POST /v1/audio/transcriptions` | 上传音频得可编辑转写+置信度 | 保留（测试端） | 字段不变；转写必须经用户确认/编辑后才作为 `confirmed_asr_text` 进匹配 | 低置信→中文"请先检查并修改转写再发送"；失败不阻塞，可打字 | `index.ts:307`、`contracts/src/voice.ts`、`packages/ai/src/asr/*` |
| 23 | `POST /v1/audio/speech` | 按需把任意文本合成语音 | 弃用 | 正式端不再运行时合成任意文本；改用预制 normal/slow 音频（见新增端点 26） | 测试端可临时保留；正式端下线后返回中文"请使用预置音频" | `index.ts:332`、`contracts/src/voice.ts`、`packages/ai/src/tts/*` |
| 24 | `POST /v1/conversations` | 创建/取当前自由对话 | 弃用（正式端） | 自由对话由固定内容事件取代；此端点及 SSE 不再是主链路 | 保留为 LLM 实验，默认不挂载；缺密钥不报错 | `index.ts:361`、`memory-conversation-store.ts` |
| 25 | `GET /v1/conversations/current` | 取当前对话 | 弃用（正式端） | 同上 | 同上 | `index.ts:367` |
| 26 | `POST /v1/conversations/:id/complete` | 结束对话并出语言反馈 | 弃用（正式端） | 对话结束反馈停用；语言反馈改由事件结果产出（见 #21/#14） | 同上 | `index.ts:373`、`contracts/src/feedback.ts` |
| 27 | `POST /v1/conversations/:id/messages` | SSE 流式发消息，MockLLM 生成回复 | 弃用（正式端） | 这是 MockLLM 主链路；事件推进不再经此 | 不依赖 LLM 密钥；该流保留仅供联调 | `index.ts:393`、`memory-conversation-store.ts`、`packages/ai/src/llm/mock.ts` |

---

## 2. 新增端点（3 个）

| # | 方法+路径 | 用途 | 请求/响应字段 | 错误与版本边界 | 对应文件（计划落点） |
|---|---|---|---|---|---|
| N1 | `GET /v1/fixed-content/ruleset` | 下发当前权威规则集（章节/事件/台词/意图/状态/迁移/结果/记忆规则/音频绑定/llmPolicy） | 响应即 `FixedContentRuleset`（`fixed-content-v1.0.0`）：含 `id/version/schemaVersion/personaVersion/defaultUiLocale/learningLocale/supportedPlatforms/matchingPolicy/fallbacks/translationToggle/audioBindings/events/llmPolicy` | 响应必带 `schemaVersion`；客户端不识别则停止事件并中文提示升级 | 读 `packages/domain/src/fixed-content-v1.ts` + `contracts/src/fixed-content.ts`；在 `apps/api/src/index.ts` 新增路由 |
| N2 | `POST /v1/events/:id/intents` | 对当前状态做确定性意图匹配/预览，**不推进状态**；用于"无匹配时返回最多 3 个中文候选意图 + 可编辑英文参考句" | 请求：`{ text, inputMode: 'text'|'confirmed_asr_text'|'reference_reply'|'choice', choiceId?, idempotencyKey }`；响应：`{ resolvedIntentId?: string, candidates: { intentId, labelZh }[] (≤3), fallbackKind?: 'no_match'|'low_confidence'|'user_denial'|'repeated_input', messageZh }` | 同分/分差不足/否定冲突→按无匹配返回候选，不推进；所有文案中文 | 复用契约第 5 节匹配器；与 #21 同一套标准化逻辑 |
| N3 | `GET /v1/audio/bindings/:audioId` | 解析预制音频绑定，返回播放地址与版本绑定 | 响应：`{ audioId, lineId, contentId, textVersion, translationVersion, variant:'normal'|'slow', voiceProfileId, fileRef, status:'ready'|'planned'|'retired', checksumSha256 }` | `status='planned'` 或 `retired`→不返回可播地址，前端降级纯文本+译文；`textVersion/translationVersion` 与客户端缓存不一致→拒绝用缓存 | 读 `FixedContentRuleset.audioBindings` |

> 说明：**记忆提案确认**不新增端点，复用现有 `POST /v1/memories/:id/actions`（#14，confirm/edit）。

### 新增/弃用统计

- **新增端点：3 个**（N1 规则集下发、N2 意图匹配预览、N3 预制音频绑定解析）。
- **弃用端点：5 个**——`POST /v1/audio/speech`（#23，按需 TTS）、`POST /v1/conversations`（#24）、`GET /v1/conversations/current`（#25）、`POST /v1/conversations/:id/complete`（#26）、`POST /v1/conversations/:id/messages`（#27，MockLLM 流式主链路）。

---

## 3. 错误与版本边界（统一）

### 3.1 错误结构

沿用 `apps/api/src/http.ts` 的 `{ error: { code, message, requestId, details? } }` 结构；**所有 `message` 改为中文**（当前 `messages` 表为英文，需整体中文化）。

### 3.2 版本不匹配如何返回中文错误

- 规则集/事件版本字段：`rulesetId`（如 `fixed-content-v1.0.0`）、`schemaVersion`（如 `1.0.0`）、事件自带 `version`。
- 客户端启动时先调 N1，校验 `schemaVersion`。**不识别时停止事件**，返回（或本地判定）中文：
  - 新增错误码 `ruleset_schema_version_unsupported` → "当前客户端版本过旧，请升级后再继续。"
  - 新增错误码 `ruleset_version_mismatch` → "内容规则已更新，正在为你重新加载最新版本。"
- 服务端在 #17/#18/#19/#21 响应中始终回带 `rulesetId + schemaVersion + eventVersion`，客户端据此比对；不一致即停止，不自行补造状态/意图/译文。

### 3.3 新增错误码（并入 `http.ts` 的 `ApiErrorCode`）

| 错误码 | HTTP | 中文 message | 触发场景 |
|---|---|---|---|
| `ruleset_schema_version_unsupported` | 409 | 当前客户端版本过旧，请升级后再继续。 | 客户端 `schemaVersion` 服务端不识别 |
| `ruleset_version_mismatch` | 409 | 内容规则已更新，请刷新后重试。 | 客户端请求的规则集版本与服务端不一致 |
| `intent_no_match` | 422（或沿用 409） | 我还不能可靠判断你的意思。你可以换一种说法，或选择下面的参考意图。 | 匹配未达阈值/分差不足/冲突（保持状态） |
| `intent_low_confidence` | 422 | 我不确定是否听对了。请先检查并修改转写文字，再确认发送。 | ASR 低置信 |
| `input_already_processed` | 409 | 这条内容已经处理过，不会重复推进。 | 重复幂等键 |
| `audio_not_ready` | 404 | 这条语音尚未准备好，你可以先看文字和译文继续。 | N3 取到 `planned/retired` 音频 |

> 既有错误码（`event_locked / transition_not_allowed / memory_* / journal_* / resurfacing_not_available / first_day_* / conversation_*` 等）语义保留，仅 `message` 中文化；`conversation_*` 随对话链路在正式端不再使用。

---

## 4. 字段与版本联动要点（与契约 2.2 对齐）

- 每条英文学习内容必须带 `content_id + text_version + english + translation.text_zh + translation.version + manual_reviewed`（`learningContentPairSchema`）。
- 音频绑定同时记录 `textVersion` 与 `translationVersion`；任一不一致，客户端拒绝用缓存音频（N3 返回 `audio_not_ready`）。
- 改意图阈值/优先级/关键词→升规则集版本；改状态迁移/结果写入→至少升事件版本；不兼容→换事件主版本或事件 ID。
- 本清单只规定 HTTP 契约与错误边界，不规定数据库表结构（数据模型线负责）。
