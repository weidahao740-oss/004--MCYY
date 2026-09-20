# MIGRATION_PLAN_WEB_TO_FIXED_CONTENT — 旧 Web 原型 → 新固定内容方案迁移设计（主文档）

> 版本：1.0.0（纯设计稿，不改工程代码）
> 上游契约：`FIXED_CONTENT_CONTRACT.md` v1.0.0、`MORROW_LIFE_STORY_BIBLE.md` v1.0.0
> 现状参考：`TECH_STACK.md`（本文只做与之衔接的迁移设计，不改动它）
> 配套文档：`API_MIGRATION.md`（逐端点迁移清单）
> 范围声明：本文只新建本文件与 `API_MIGRATION.md`；不修改 `english-pet/` 工程代码，不修改 `TECH_STACK.md` / `DATA_MODEL.md`（数据模型线由另一代理负责）。

---

## 1. 迁移目标与硬边界

### 1.1 迁移目标

把当前"MockLLM 主链路 + 启发式事件引擎"的 Web 原型，迁移为"**版本化固定内容规则集 + 确定性意图匹配 + 白名单状态迁移**"的运行时。迁移后：

1. 正式产品形态为**微信小程序 + App**；**Web 仅作为开发/测试端**（契约 `supportedPlatforms` 中的 `web_test`）。
2. 主链路回复**不再由 LLM 实时生成**，改为读取 `packages/domain/src/fixed-content-v1.ts`（`fixed-content-v1.0.0` 规则集），经确定性意图匹配后命中白名单状态迁移。
3. LLM 适配器**保留但默认关闭**，不能成为状态推进依赖；无任何 LLM 密钥也必须能跑通完整事件。
4. 全部功能界面中文化；英文只作为学习内容出现，并配人工中文译文。

### 1.2 硬边界（不可让步）

- **Web 降级为测试端**：`apps/web` 不再承载正式产品定位，只用于内容调试、状态机与接口自动化；其浏览器录音/播放实现不作为小程序/App 的正式实现依据。
- **固定内容引擎替代 MockLLM 主链路**：事件推进只认 `fixed-content-v1` 规则集里声明的 `intents / transitions / outcomes`；禁止再用 `memory-event-engine.ts` 中 `chooseTransition` / `inferOutcome` 这类自由文本别名猜分支的做法。
- **LLM 不是核心依赖**：契约 `llmPolicy`（见 `packages/contracts/src/fixed-content.ts`）写死 `adapterRetained=true / enabledByDefault=false / coreDependency=false / mayAdvanceState=false / mayWriteMemory=false / mayCreateContentIds=false`。
- **无密钥可跑通**：不配置 `LLM_API_BASE_URL / LLM_API_KEY` 时，两个出生示例事件（`birth_first_voice_v1`、`birth_restore_object_v1`）必须能完整走完。
- **记忆必须确认**：长期记忆只来自 `declared_event_rule` 或 `explicit_user_request`，且 `requiresUserConfirmation: true`（契约第 10.2 节）。
- **本设计不做**：不开发小程序/App 工程、不采购云资源、不接真实 ASR/TTS、不迁移数据库（当前全为进程内 `Memory*Store`）。

---

## 2. 能力逐项盘点表

> 判定取值：**保留**（沿用现状）/ **修改**（改实现或字段后沿用）/ **弃用**（正式端不再使用，或被新机制取代）。
> 现状文件路径均为迁移前真实存在的文件。

| # | 能力 | 现状文件路径 | 判定 | 理由 | 迁移动作 |
|---|---|---|---|---|---|
| 1 | 事件引擎运行时（状态机、目录、start/act、幂等缓存） | `apps/api/src/memory-event-engine.ts` | 修改 | 现有引擎读 `eventsV1`（`events-v1.0.0`），且用 `chooseTransition()`/`inferOutcome()` 自由文本别名猜分支，违背"只由唯一意图推进" | 改为读取 `fixedContentV1`；删除 `chooseTransition/inferOutcome` 启发式，替换为契约第 5 节确定性匹配器；保留实例化、幂等 `responseByIdempotencyKey`、`worldState` 写入与暂停/恢复骨架 |
| 2 | 旧事件规则集（5 个事件、误解分支、`understanding` 相位） | `packages/domain/src/events-v1.ts`、`packages/contracts/src/events.ts`（`eventDefinitionSchema`/`eventRulesetSchema`） | 弃用（正式端） | 其 `eventRulesetSchema` 要求 `events.length(5)`、含自由 `misunderstanding` 结构，与固定内容契约的 `fixedContentRulesetSchema` 不兼容 | 作为历史 Web 原型保留在仓库；新端点不再下发；`GET /v1/events` 改下发固定内容目录 |
| 3 | 新固定内容规则集与两个出生事件 | `packages/domain/src/fixed-content-v1.ts`、`packages/contracts/src/fixed-content.ts` | 保留（升格为主链路） | 已是 Zod 机器权威、模块加载即校验、含 normal/slow 音频绑定与 `llmPolicy` | 直接成为服务端权威；新增"规则集下发 + 意图匹配"读路径；内容按 `MORROW_LIFE_STORY_BIBLE.md` 第 7 章扩充 |
| 4 | 长期记忆（proposed/confirmed/paused/rejected、敏感拦截、搜索入上下文） | `apps/api/src/memory-memory-store.ts`、`packages/contracts/src/memory.ts` | 修改 | 能力骨架符合"提案需确认"，但 `proposeFromConversation()` 由 LLM 对话触发，属契约禁止的关键词/对话推断 | 保留 `list/act/search/clearUser` 与敏感拦截、版本冲突；记忆来源收窄到 `proposeFromEvent()`（事件声明规则）与显式请求确认；停用对话触发的自动提案 |
| 5 | 共同记忆册（日记条目：edit/hide/restore/delete、版本冲突、关联记忆） | `apps/api/src/memory-journal-store.ts`、`packages/contracts/src/journal.ts` | 修改 | 结构可用，但条目为自由文本，缺"按当时文本/译文版本回看" | 保留 CRUD 与乐观锁；新增/补 `textVersion`+`translationVersion` 快照，回看时用生成当时版本，不静默替换含义（契约第 8 节） |
| 6 | 首日流程（FD00→FD07 状态机、取名/说今天/选物/记忆复核/日记） | `apps/api/src/memory-first-day-store.ts`、`packages/contracts/src/first-day.ts` | 修改 | 现有首日与 `events-v1` 耦合（`markFirstDayCompleted` 写 `first_day_v1`），且 `restoredObject` 只有 lamp/plant，无 small_bell | 首日改为固定内容前导：FD01/FD05 用固定台词+人工译文；选物对齐 `birth_restore_object_v1` 三选；FD06 记忆复核改走固定内容 `memoryRules` 提案 |
| 7 | 轻量语言反馈（成功/更自然/影响理解、焦点项） | `apps/api/src/memory-feedback-store.ts`、`packages/contracts/src/feedback.ts` | 修改 | 反馈聚合依赖 LLM 对话结束；事件反馈可用 | 保留 `languageFeedbackSchema` 结构；事件结束反馈改由固定内容 `outcomes`+确认表达生成；对话侧反馈随对话链路降级 |
| 8 | 自然复现（resurfacing 提示、used/paraphrased/ignored 记录） | `apps/api/src/memory-resurfacing-store.ts`、`packages/contracts/src/resurfacing.ts` | 修改 | 依赖已确认语言记忆 + 语义上下文，方向正确，但当前挂在事件实例上由启发式触发 | 保留提示与结果记录；触发改为"已确认且未暂停记忆 + 当前事件场景命中"，一次最多 1 条；不做语义猜测 |
| 9 | 账号删除（级联清空全部 store、吊销会话、登录失效） | `apps/api/src/index.ts`（`DELETE /v1/me/account`）、`apps/api/src/memory-account-store.ts`、`apps/api/src/account-deletion.smoke.ts` | 保留 | 删除语义与"删除记忆不再进入上下文"要求一致，与 LLM 无关 | 端点名与级联顺序保留；错误文案中文化；冒烟用例随固定内容事件名同步 |
| 10 | 异常恢复/降级（超时、非法 JSON 重试一次、ASR/TTS 失败降级、幂等刷新恢复） | `packages/ai/src/degradation.ts`（`safeComplete/safeTranscribe/safeSynthesize`）、`apps/api/src/exception-self-test.smoke.ts` | 修改 | `safeComplete` 是围绕 LLM 的降级；新主链路不调 LLM，但其"不抛未捕获异常、给中文安全兜底"原则要继承 | 保留 `safeTranscribe/safeSynthesize` 降级语义（文案改中文）；`safeComplete` 退为"LLM 可选增强"路径专用；新增固定内容侧的无匹配/低置信/否认/重复中文兜底（契约第 6 节） |
| 11 | 自由对话主链路（SSE 流式、MockLLM 生成回复、对话级记忆提案） | `apps/api/src/memory-conversation-store.ts`、`apps/api/src/morrow-system-prompt.ts`、`packages/contracts/src/conversation.ts` | 弃用（正式端主链路） | `MemoryConversationStore.send()` 直接 `new MockLLM()` 并 `safeComplete` 生成开放式回复，是被契约取代的对象 | 正式端不再以"自由聊天"为核心；该链路由固定内容事件驱动。保留代码作为 LLM 实验资产，默认不挂载 |
| 12 | Web 对话页（流式气泡、VoiceComposer、VoiceControls） | `apps/web/src/pages/ChatPage/ChatPage.tsx`、`VoiceComposer.tsx`、`VoiceControls.tsx`、`apps/web/src/api/conversation-api.ts` | 弃用（正式端 UI） | 它是 LLM 流式对话的壳 | 测试端可临时保留联调；正式端事件 UI 改由事件页渲染固定台词+译文按钮+中文选项 |
| 13 | Mock ASR（返回可编辑转写 + 置信度） | `packages/ai/src/asr/mock.ts`、`asr/adapter.ts`、`packages/contracts/src/voice.ts` | 保留（测试端） | 契约要求"确认后 ASR 文本才进匹配器"，Mock 正好演示该流程 | 保留为 Web 测试端实现；输出必须经用户确认/编辑后才作为 `confirmed_asr_text` 进入意图匹配；正式端 ASR 由小程序/App 适配层另接 |
| 14 | Mock TTS（静音 WAV）与按需合成端点 | `packages/ai/src/tts/mock.ts`、`tts/adapter.ts`、`tts/openai-compatible.ts` | 修改 | 契约要求预制 normal/slow 音频与台词/文本版本绑定，反对运行时按需合成任意文本 | 测试端保留静音 WAV 用于走通链路；正式端播放改为按 `audioBindings[].fileRef` 取预制文件；`POST /v1/audio/speech` 按需合成弃用（见 API 清单） |
| 15 | LLM 适配器（接口 + Mock + OpenAI 兼容） | `packages/ai/src/llm/adapter.ts`、`llm/mock.ts`、`llm/openai-compatible.ts` | 保留（默认关闭） | 契约明确保留为历史/未来实验资产 | 不删；新主链路不 import `MockLLM`；仅在显式开启且输出落回白名单时作为非权威增强；无密钥不报错 |
| 16 | 结构化输出校验（morrowReply-1.0 Schema）与系统提示词 | `packages/ai/src/validation.ts`、`apps/api/src/morrow-system-prompt.ts` | 弃用（主链路） | 它约束的是"LLM 自由生成回复"，固定内容无需 LLM 输出 Schema | 保留文件仅供 LLM 实验；事件主链路改用 `fixedContentRulesetSchema` 校验 |
| 17 | i18n 英文 UI 切换 | `apps/web/src/i18n/copy.ts`（`zh-CN`/`en` 双表 + `getCopy/currentLocale`）、`packages/contracts/src/auth.ts`（`interfaceLocaleSchema = zh-CN|en`） | 修改 | 契约第 7.1 节：正式产品不提供整套英文 UI 切换 | 移除正式入口：`copy.ts` 只保留 `zh-CN` 一套；设置页删除"界面语言"切换；`interfaceLocale` 字段保留兼容但固定为 `zh-CN` |
| 18 | Web 录音适配器（MediaRecorder 封装） | `apps/web/src/audio/web-recorder-adapter.ts` | 保留（仅测试端） | 是浏览器 `MediaRecorder` 测试实现，依赖 `navigator.mediaDevices` | 明确不作为小程序/App 正式实现；正式端各自实现 `IRecorderAdapter` 等价物（见第 6 节） |
| 19 | Web 音频播放适配器（HTMLAudioElement） | `apps/web/src/audio/web-audio-player-adapter.ts` | 保留（仅测试端） | 浏览器 `Audio` + ObjectURL 实现 | 同上，仅 Web 测试端；正式端用原生/小程序播放与缓存 |
| 20 | 错误文案与结构化日志 | `apps/api/src/http.ts`（英文 `messages` 表）、`apps/api/src/logger.ts` | 修改 | `http.ts` 全部错误信息为英文，违背全中文 UI | 错误 `message` 全部中文化；新增版本/意图类错误码（见 API 清单）；`logger.ts` 的 pino redact 保留，新增不落原始录音/转写 |
| 21 | 宠物主页（情绪/活动/今日事件/打招呼动作） | `apps/api/src/memory-account-store.ts`（`getPetHome/performPetAction`）、`packages/contracts/src/pet-home.ts` | 修改 | `pet-home.ts` 同时下发 `statusTextEn/returnMessageEn/titleEn` 英文字段 | 保留主页结构；英文字段迁出，改由固定内容章节/事件目录提供；情绪活动文案中文化 |
| 22 | 账号/会话/设置（访客、注册、登录、登出、设置补丁） | `apps/api/src/memory-account-store.ts`、`packages/contracts/src/auth.ts`、`apps/web/src/api/account-api.ts` | 保留 | 与 LLM 无关，是基础能力 | 全部保留；`userSettingsSchema.interfaceLocale` 收敛为只读 `zh-CN`；其余设置（语速/字幕/记忆开关）保留 |

> 盘点条目数：**22 项**（见上表 #1–#22）。

---

## 3. MockLLM 主链路 → 固定内容引擎替换方案

### 3.1 现状：两条与"生成式"纠缠的链路

- **对话链路**：`POST /v1/conversations/:id/messages`（SSE）→ `MemoryConversationStore.send()` → `new MockLLM()` + `safeComplete()` → 流式拼字 → 完成时 `memoryStore.proposeFromConversation()` 自动提记忆。这条链路的回复文本、意图判断、记忆提案全部来自 LLM/正则。
- **事件链路**：`POST /v1/events/:id/actions` → `MemoryEventEngine.act()` → 读 `eventsV1`，用 `chooseTransition()`（正则猜 `leave/self/can/maybe`）和 `inferOutcome()`（`aliases` 关键词表）决定走哪个结果。它不直接调 LLM，但本质仍是"自由文本猜分支"。

### 3.2 替换原则

按契约第 3–5 节，一次互动 = `读取 fixed-content-v1 规则集 → 标准化输入 → 确定性意图匹配 → 白名单状态迁移`：

1. **规则集来源**：事件目录、当前事件、台词、选项、意图、状态、迁移、结果、记忆规则、音频绑定，全部只从 `fixedContentV1`（`packages/domain/src/fixed-content-v1.ts`）取；客户端不复制业务判断。
2. **输入标准化**（契约 5.2）：`unicode_nfkc → lowercase → trim → collapse_whitespace → strip_terminal_punctuation`；不纠正否定词，不机翻中文输入。
3. **匹配优先级**（契约 5.3）：显式中文选项（直接提交意图 ID）→ 完整短语精确 → 当前状态关键词组计分 → 排除/否定/冲突检查 → 兜底保持状态。必须过 `confidenceThreshold=70` 且第一候选领先第二候选 `minimumWinnerMargin=15`。
4. **白名单迁移**：只有 `transition.onIntentIds` 命中且 `guard` 满足才迁移；`outcomes[].worldStateWrites` 是唯一改世界的地方；用事件实例幂等键去重。
5. **不推进即停**：无匹配 / 低置信 / 用户否认 / 重复 / 冲突，一律保持当前状态，展示契约第 6 节中文兜底与最多 3 个候选意图。

### 3.3 具体改挂点

| 现有挂点 | 现状 | 改后 |
|---|---|---|
| `MemoryEventEngine.act()` 内 `chooseTransition()` | 正则猜分支 | 改为调用确定性匹配器，输入只在当前 `eligibleStateIds` 内打分；未达阈值返回 `fallback` 视图（保持状态 + 候选） |
| `MemoryEventEngine.act()` 内 `inferOutcome()` | 别名表猜结果 | 删除；结果只由命中的 `transition.outcomeId` 确定；`choiceId` 必须命中声明 `intentId` |
| `MemoryEventEngine.catalog()` 读 `eventsV1` | 下发 `events-v1.0.0` 5 事件目录 | 改下发 `fixedContentV1` 的章节/事件目录（`rulesetId=fixed-content-v1.0.0`、`schemaVersion`、`personaVersion`） |
| `MemoryConversationStore.send()` 用 `MockLLM` | 生成开放式回复 | 正式端不再以对话为主链路；该发生器不被事件/状态调用；如需试验 LLM，其输出不得离开白名单 |
| 事件结束 `proposeFromEvent()` | 按 outcome 提记忆 | 保留提记忆动作，但提案来源限定为该事件 `memoryRules[]`（`declared_event_rule`），且仍 `requiresUserConfirmation: true` |

### 3.4 LLM 保留位置与关闭策略

- **保留文件**：`packages/ai/src/llm/{adapter,mock,openai-compatible}.ts`、`validation.ts`、`degradation.ts`。
- **默认关闭**：服务端组装时不 `new MockLLM()` 注入事件引擎；`MemoryConversationStore` 不再默认实例化；环境缺 `LLM_API_KEY` 时启动不报错。
- **能力边界**：未来即便开启，`permittedFutureRole = optional_non_authoritative_enhancement`，`mayAdvanceState / mayWriteMemory / mayCreateContentIds` 均为 `false`——LLM 输出必须落回已声明的意图/台词/结果白名单，不能造剧情、译文、记忆或世界状态。
- **可验证性**：无密钥冷启动后，两个出生事件可走完 `open → reply/choose → result → completed`，并触发一条待确认记忆提案。

---

## 4. 全中文 UI 改造范围

### 4.1 移除整套英文 UI 切换

- `apps/web/src/i18n/copy.ts`：当前导出 `zh-CN` 与 `en` 两张表、`getCopy(locale)`、`currentLocale()`。正式端**只保留 `zh-CN` 一套文案**；`en` 表删除或仅留测试用途；`currentLocale()` 恒返回 `'zh-CN'`。
- `packages/contracts/src/auth.ts`：`interfaceLocaleSchema = z.enum(['zh-CN','en'])`。迁移后 `interfaceLocale` 固定为 `zh-CN`，不再接受 `en`；为兼容旧客户端可暂保留字段但服务端忽略。
- 设置页（`apps/web/src/pages/SettingsPage/SettingsPage.tsx`）：删除"界面语言 / 中文 / English"切换项；`copy.ts` 中 `interfaceLanguage/chinese/english` 键随之移除。
- 引用 `getCopy/currentLocale/interfaceLocale` 的页面（Layout、HomePage、RoomPage、EventPage、ChatPage、MemoryPage、JournalPage、FirstDayPage、SettingsPage）统一切到中文单语文案。

### 4.2 哪些页面改全中文

- 导航/标题/按钮/状态/错误/空态/帮助：RoomPage、HomePage、EventPage、MemoryPage、JournalPage、FirstDayPage、SettingsPage、NotFoundPage、Layout —— 全部功能文案用中文（契约 7.1 全清单）。
- 首日状态机 `memory-first-day-store.ts` 的 `screenCopy`：目前每屏同时给 `zh`/`en`，改后只下发 `userTaskZh`，`morrowLines` 保留英文学习台词并配人工译文。
- `http.ts` 的 `messages`：现有 21 个 + 新增 6 个 = 27 个错误码全部需中文化（含新增的版本/意图类错误码）。
- `pet-home.ts` 的 `statusTextEn / returnMessageEn / dailyEventSummary.titleEn` 字段移除，只留 `*Zh`。

### 4.3 英文学习内容保留英文 + 人工译文

- Morrow 台词、事件内来信/物品说明、可编辑参考句、用户已确认英文表达、"更自然的表达"和复现短语，**保持英文显示**（契约 7.2）。
- 每条英文来自 `FixedContentLine.learningContent`，必带 `translation.textZh / version / manual_reviewed`（`packages/contracts/src/fixed-content.ts` 的 `manualTranslationSchema`）。
- 技术诊断（如 `requestId`、版本号）不直接作为普通用户文案暴露。

---

## 5. 译文按钮与字段迁移（契约第 8 节落点）

### 5.1 组件行为

按 `translationToggleSchema`（`fixed-content.ts`）：`defaultExpanded=false`、`placement=learning_content_bottom_right`、收起态"查看中文"、展开态"收起中文"、`persistScope=current_content_block`、不影响音频/进度/埋点、无学习内容时不显示。

### 5.2 落点

- **事件台词**：事件页渲染 `FixedContentLine` 时，每个 `learningContent` 块右下角挂译文按钮，展开显示 `learningContent.translation.textZh`。
- **对话/参考句**：`reference_reply`（`speaker=system_example`）同样带译文；用户已确认的英文原表达回看时也按其 `textVersion` 显示译文。
- **共同记忆回看**：日记条目 `journalEntrySchema` 现仅自由文本，迁移时补"该英文表达 + 当时 `translation.version`"快照；回看用生成时版本，不静默替换含义（契约第 8 节最后一条）。
- **字段落点**：译文不进 TTS、不参与意图匹配、不写 `worldState`；仅展示。音频绑定同时记录 `textVersion` 与 `translationVersion`，二者任一不匹配时客户端拒绝用缓存音频。

---

## 6. Web 仅测试端与录音适配边界

### 6.1 现状两个适配器

- `apps/web/src/audio/web-recorder-adapter.ts`：`WebRecorderAdapter` 基于 `navigator.mediaDevices.getUserMedia` + `MediaRecorder`，产出 `Blob`+`mimeType`。
- `apps/web/src/audio/web-audio-player-adapter.ts`：`WebAudioPlayerAdapter` 基于 `HTMLAudioElement` + `URL.createObjectURL`，支持 `playbackRate`。

二者都是**浏览器实现**，依赖 DOM/MediaRecorder/ObjectURL。

### 6.2 边界定义

- 上述两个适配器**仅用于 Web 测试端**（内容调试、状态机与接口自动化），不是小程序/App 的正式实现。
- 客户端只依赖"抽象接口"（对齐 `TECH_STACK.md` 第 5 节的 `RecorderAdapter / AudioPlayerAdapter` 形态）：
  - 录音：`requestPermission / start / stop(→ { audio, mimeType }) / cancel`；
  - 播放：`play(source, rate) / stop`，另加按 `audioId` 取预制文件与本地缓存命中；
  - 缓存：按 `audioId + textVersion + translationVersion + variant` 做 key，版本不一致即失效。
- 正式端由微信小程序（`wx.*` 录音/InnerAudioContext）与 App（原生录音/AVPlayer 或 RN 原生模块）各自新增实现，不改事件引擎、记忆、意图匹配等平台无关逻辑。
- 未确认 ASR 只用于转写审核，不进事件消息/匹配/记忆（契约 5.1）。

---

## 7. 迁移阶段顺序与风险

> 每一步都可独立验证，**全程不需要真实 LLM 密钥**。

| 阶段 | 内容 | 可独立验证的出口 | 主要风险与缓解 |
|---|---|---|---|
| P1 规则集接通 | 新增固定内容规则集下发读路径；`GET /v1/fixed-content/ruleset` 可拉到 `fixed-content-v1.0.0` 并通过 Zod 校验 | 无密钥启动 API，`GET /health` + 规则集校验通过 | 与旧 `events-v1` 并存：用新路由隔离，不影响旧端点 |
| P2 确定性匹配器 | 按契约 5.x 实现标准化+计分+阈值+分差+冲突检查；返回"候选意图"或"保持状态" | 用两个出生事件的样本输入（help/check/pause/lamp/plant/bell）断言：命中→迁移，无匹配/冲突→停留 | 否定词误伤：标准化明确保留 `not/don't/can't`；用 `excludedPhrases` 覆盖 |
| P3 事件引擎改挂 | `MemoryEventEngine` 改读固定内容规则集，删 `chooseTransition/inferOutcome`；幂等键保留 | 走完 `birth_first_voice_v1` 全部分支，结果写 `worldStateWrites`，重复提交返回同一实例 | 旧 `events-v1` 用例失配：冒烟测试参数换成固定内容事件 ID |
| P4 记忆/日记/反馈收窄 | 记忆提案只来自事件 `memoryRules`；日记补文本/译文版本快照；反馈挂事件结果 | 事件完成后出现一条待确认提案；确认/拒绝/暂停均符合契约 | 对话自动提案停用影响回归：`memory-conversation-store.smoke.ts` 相应标记为实验性 |
| P5 全中文与译文按钮 | `copy.ts` 收单语、错误表中文化、`translationToggle` 组件落地 | 无英文 UI 残留；按钮收起/展开/作用域符合契约第 8 节 | 漏改：grep `en` 文案与 `interfaceLocale` 引用逐一清零 |
| P6 音频绑定与播放 | 预制 `fileRef` 下发；播放适配器按版本 key 缓存；`planned` 音频不播 | 任一 `audioRequired` 台词能取到 normal/slow 绑定；版本错配拒绝缓存 | 预制音频尚未就绪：`planned` 时降级为纯文本+译文，事件仍可完成 |
| P7 首日流程对齐 | 首日三选对齐 `birth_restore_object_v1`；FD06 复核固定内容记忆规则 | 首日走完并自动 `markFirstDayCompleted`，三选世界状态正确 | `restoredObject` 枚举扩 `small_bell`：同步 contract 与 store |
| P8 LLM 默认关闭核验 | 服务端不再默认实例化 `MockLLM`；缺密钥启动不报错；对话实验路径隔离 | 不设 `LLM_*` 环境变量跑通 P1–P7 全部冒烟 | 残留隐式依赖：grep 服务端是否仍 import `MockLLM` |

### 通用风险

- **双规则集并存期**：P2–P3 期间新旧事件目录可能同时可读，必须用独立路由/开关隔离，避免客户端拿到混合事件。
- **版本漂移**：`schemaVersion` 不匹配时客户端必须停止事件并显示中文升级提示（契约 2.2），这一点在 API 清单中固化为错误码。
- **内存存储**：当前全部 `Memory*Store` 为进程内态，重启即丢；本文不负责数据库迁移，但阶段出口验证均在单进程内完成。

---

## 8. 与既有文档的边界

- 本设计不修改 `TECH_STACK.md`：其"Web/PWA 首发"表述与"正式端为小程序+App、Web 仅测试端"是产品定位调整，由本设计承接，技术栈选型本身不变。
- 不修改 `DATA_MODEL.md`：三类记忆/日记的数据模型字段演进（版本快照、译文版本）只在本文与 `API_MIGRATION.md` 给出方向，具体表结构由数据模型线落地。
- 不修改 `english-pet/` 任何源码；所有"迁移动作"是后续工程实施的输入。
