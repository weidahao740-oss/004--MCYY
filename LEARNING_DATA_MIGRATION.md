# LEARNING_DATA_MIGRATION — 阶段 3.5.4 学习系统数据迁移清单

> 版本：1.0.0（纯设计稿，不改任何工程代码）
> 阶段：3.5.4（双轨难度、掌握状态、水平测试、提示退出、间隔复现落到现有工程）
> 上游已冻结/已对齐契约：
> - `FIXED_CONTENT_CONTRACT.md` v1.0.0（`FixedEvent` 结构、确定性意图匹配、人工译文、预制音频、记忆确认白名单）
> - `DATA_MODEL.md` v1.0.0 / `DATA_MODEL_MIGRATION.md` v1.0.0（23 张表现状 + 3.5.3 已规划 5 张新表）
> - `english-pet/packages/database/src/schema.ts`（逐表逐枚举核对）
> - `API_MIGRATION.md` v1.0.0（既有 27 端点 + N1/N2/N3，本清单不动其既定结论）
> - `FIRST_DAY_FLOW.md`、`MORROW_LIFE_STORY_BIBLE.md`、`CHAPTER_01_BIRTH_CONTENT.md`、`CHAPTER_02_CHILDHOOD_CONTENT.md`
> 命名约定：表/字段蛇形英文；【拟新增】= 本次新增、尚未落地；既有字段照实引用，不重命名、不改义。

---

## 0. 口径说明（必读）

1. **事件数量口径**：计划口头称首两章"24 个事件"，实际内容文件为 **25 个**。本迁移**按 25 个计**：
   - 第一章 13 个：`birth_first_voice_v1`、`birth_restore_object_v1`、`b1_remember_name_v1`、`b1_first_feeling_v1`、`b1_window_light_v1`、`b1_first_letter_v1`、`b1_bell_sound_v1`、`b1_ask_about_you_v1`、`b1_what_i_like_v1`、`b1_tomorrow_plan_v1`、`b1_return_first_words_v1`、`b1_ready_for_outside_v1`、`b1_not_sure_v1`。
   - 第二章 12 个：`b2_room_tour_v1`、`b2_name_objects_v1`、`b2_colors_v1`、`b2_outside_road_v1`、`b2_today_you_v1`、`b2_my_likes_v1`、`b2_mistake_v1`、`b2_small_task_v1`、`b2_feeling_check_v1`、`b2_sound_comes_back_v1`、`b2_recall_room_v1`、`b2_ready_for_school_v1`。
2. **术语对齐（全项目唯一口径）**：
   - 掌握六阶：`encountered / recognized / prompted / independent / transferring / mastered`。
   - 难度三档：`basic / intermediate / advanced`。
3. **与既有等级并存、不重命名**：现有 `user_settings.language_level` 是枚举 `languageLevelEnum('L1','L2','L3','L4')`（默认 `L2`）。本次**不新建平行 L1–L4 枚举、不改该列**；难度三档 `basic/intermediate/advanced` 是运行时"难度拨盘"，与等级粗对齐：`basic≈L1–L2`、`intermediate≈L2–L3`、`advanced≈L3–L4`，作为新枚举独立存在。
4. **增量原则**：所有学习元数据以**新增可选字段**挂到既有 `FixedEvent`；所有新表/新端点向前追加，不推翻 3.5.3 已规划的 5 张表与 N1–N3。

---

## 1. 总表：现有资产 × 是否需要改 × 改什么 × 理由

| 现有资产 | 是否需要改 | 改什么（字段/事件/表/API） | 理由 |
|---|---|---|---|
| `FixedEvent`（zod，`contracts/src/fixed-content.ts`） | **改（加可选字段）** | 新增可选 `learning?` 对象（见 §4）；不改既有 13 个字段 | 学习元数据需挂到事件上；可选字段保证旧规则集仍可被旧客户端解析，向后兼容 |
| `lines[].learningContent.contentId` | 不改 | — | 已有"学习内容 ID"概念；新 `learning.objectives[].objectKey` 与其引用关系见 §4，不重复造 |
| `user_settings.language_level`（L1–L4） | **不改列，新增并列拨盘** | 难度三档不落此列；由新表 `mastery`/新端点 N5/N6 承载，仅在水平测试结果里**写回建议值** | 避免破坏既有等级语义；等级是粗结论，难度档是运行时即时拨盘 |
| `user_settings` 表 | **加字段** | 【拟新增】`difficulty_tier`（枚举 `basic/intermediate/advanced`，默认 `basic`）、`tier_source`（枚举 `placement/override/auto`）、`tier_updated_at` | 需要持久化"当前难度档"与"是谁设的"（自动测评/用户手动纠正），供每次事件启动读取 |
| `MORROW_LIFE_STORY_BIBLE` 七章进入/完成条件 | **补内容字段，不改 DB 表** | 每章配置新增可选 `languageCeiling: basic\|intermediate\|advanced`（章语言上限）；挂在规则集章节配置，不新建 DB 列 | 难度档不能无限向上飘：每章有语言上限，超过即不再推更难分支；完成条件不变，上限只约束分支/参考句难度 |
| `resurfacing_tasks` / `resurfacing_attempts` | **不改，明确分工** | 间隔复现走**新表** `review_schedule`；既有两表仍只服务"已确认语言记忆的自然带回" | 既有表语义是"记忆召回"（per confirmed memory）；新需求是"学习对象掌握后的间隔复现"（per learning_object），粒度不同，避免复用导致双重排期 |
| `language_feedback` | 不改 | — | 已是"每事件最多一条成功/自然/发音反馈"；掌握证据不写这里，写 `mastery_records` |
| `intent_resolution_records`（3.5.3 拟新增） | **加列（可选）** | 【拟新增】`hint_kind`（可空，枚举）、`hint_was_used`（可空 boolean） | "提示退出"需要知道本次匹配是否用过提示、用后是否独立答对；这是匹配尝试的天然补充，不另起一表 |
| `memories`（kind=language） | 不改 | — | 间隔复现不依赖把"掌握对象"塞进记忆；记忆确认/软删除策略照旧 |
| `user_chapter_progress`（3.5.3 拟新增） | 不改结构 | `completion_checks` 里可读取 `languageCeiling` 作为门控输入 | 章上限是配置，不是进度 |
| 既有 27 端点 + N1/N2/N3 | **不改** | 学习系统从 **N4 起**新增 | 遵守既定结论，不改动已冻结端点 |
| `FIRST_DAY_FLOW` 主状态机 FD00–FD07 | **并联插入，不改主序** | 在 FD07 之后/并联插入"轻量水平测试"轻步骤（见 §2）；首日核心闭环仍不被它阻塞 | 首日 §11 明确"不做完整分级测试"，故测评只能是**轻量、可选、事后并联**，不能前置到 FD03 |

---

## 2. "首次轻量水平测试"插入/并联方案（对齐 FIRST_DAY_FLOW）

首日铁律：不在第一次交流前要求分级测试（`FIRST_DAY_FLOW.md` §2.1、§11）。因此轻量水平测试**不能**插在 FD02/FD03，只能在核心闭环完成后并联：

- **插入位置**：`FD07_JOURNAL` 结束后，作为**可选轻步骤**（不进 FD00–FD07 主状态机序号，避免污染既有可恢复点与幂等键）。标记为新状态 `FD08_PLACEMENT_OPTIONAL`。
- **形态**：3–5 道极轻的"给 Morrow 选一句更自然的说法 / 补一个小词"式选择，全部走确定性意图匹配（复用 N2 匹配器），**不考听力、不打分、不计时**。
- **可跳过**：用户选"先不做"直接回房间；不写负向世界状态，不影响首日完成。
- **落点字段**：
  - 结果写入新表 `assessment_results`（见 §3），`kind=placement`；
  - 服务端据结果**建议** `difficulty_tier` 写回 `user_settings.difficulty_tier`（`tier_source=placement`），同时**建议**值（不强制覆盖）`language_level` 仅作为记录写入 `assessment_results.recommended_language_level`，不在首日直接改 `user_settings.language_level`，避免一次轻测推翻用户认知。
- **触发字段/流程改动**：
  - `GET /v1/first-day`（#15）响应新增可选字段 `placementAvailable: boolean`、`placementSkippable: true`。
  - 不新增首日动作枚举里的强制项；测评提交走新端点 **N4**，不复用 `first-day/actions`（#16）的动作表，保持首日动作白名单干净。

---

## 3. 新表逻辑字段清单（5 张，全部【拟新增】）

> 与 3.5.3 已规划的 5 张（`fixed_rulesets / learning_contents / audio_bindings / user_chapter_progress / intent_resolution_records`）并列，不重名、不复用。命名蛇形英文，外键级联沿用既有模式（用户级表 `ON DELETE CASCADE`，全局内容表不随个人注销删除）。

### 3.1 `learning_objects`（全局学习对象，非用户级）

- 为什么：掌握六阶与间隔复现都需要一个"可被掌握的最小教学单元"的稳定 ID；25 个事件的学习目标最终收敛到这些对象上。
- 逻辑字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | uuid PK | 服务端生成 |
| `object_key` | varchar(96) unique | 如 `pattern_let_me_help`、`vocab_lamp`、`expression_i_feel`；规则集内全局唯一，发布后不改义 |
| `kind` | enum【拟新增】`learning_object_kind(pattern/vocab/expression/function)` | 句型 / 词汇 / 表达 / 语言功能 |
| `tier` | enum【拟新增】`difficulty_tier(basic/intermediate/advanced)` | 该对象的基准难度档 |
| `chapter_id` | varchar(96) | 首次出现章 |
| `source_content_id` | varchar(96) 可空 | 关联既有 `learning_contents.content_id`（3.5.3 表） |
| `target_zh` | varchar(200) | 中文教学点说明（UI/提示用） |
| `status` | enum `draft/active/retired`（沿用 `event_definition_status` 同款） | |
| `created_at` / `updated_at` | timestamptz | |

- 外键关系：全局内容登记，**不挂 user_id**；账号注销不清。

### 3.2 `mastery_records`（用户 × 学习对象掌握状态，用户级）

- 为什么：六阶掌握需要逐用户逐对象追踪；既有 `memories` 不承载"未确认也可能接触过"的 encountered/recognized 阶段。
- 逻辑字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK→users CASCADE | |
| `pet_id` | uuid FK→pets CASCADE | |
| `learning_object_id` | uuid FK→learning_objects | |
| `stage` | enum【拟新增】`mastery_stage(encountered/recognized/prompted/independent/transferring/mastered)` | 当前掌握阶 |
| `last_event_instance_id` | uuid 可空 FK→event_instances SET NULL | 最近一次推动阶段的事件实例 |
| `encounter_count` / `prompted_count` / `independent_count` / `transferring_count` | int ≥0 | 计数，仅内部调度用，**不对外展示为分数** |
| `last_seen_at` / `last_promoted_at` | timestamptz 可空 | |
| `created_at` / `updated_at` | timestamptz | |

- 唯一约束：`(user_id, pet_id, learning_object_id)`。
- 外键关系：`users 1:N mastery_records`；每对象一行。
- 隐私：不存原始句子；与 `messages` 的关系通过 `last_event_instance_id` 间接可得，不冗余存文本。

### 3.3 `assessment_results`（水平测试结果，用户级）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | uuid PK | |
| `user_id` / `pet_id` | uuid FK CASCADE | |
| `kind` | enum【拟新增】`assessment_kind(placement/retest/self_check)` | 首测 / 重测 / 自测 |
| `source` | varchar(96) | 如 `first_day_placement` |
| `answers_summary` | jsonb | 仅结构化对错与选择，**不存原始转写/录音** |
| `recommended_tier` | enum `difficulty_tier` 可空 | 建议难度档 |
| `recommended_language_level` | enum **复用 `language_level`(L1–L4)** 可空 | 建议等级，不新建枚举 |
| `confidence` | enum `memory_confidence` 同款 `high/medium/low` | 复用既有枚举 |
| `taken_at` / `expires_at` | timestamptz | 重测可覆盖旧结论 |
| `request_ref` | varchar(160) | 幂等引用（对接 `idempotency_records`） |

- 外键关系：`users 1:N assessment_results`；最新一条决定建议。

### 3.4 `hint_usage`（提示使用记录，用户级）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | uuid PK | |
| `user_id` / `event_instance_id` | uuid FK CASCADE | |
| `state_id` | varchar(96) | 提示出现时所在状态 |
| `learning_object_id` | uuid 可空 FK→learning_objects | 本次提示服务的对象 |
| `hint_kind` | enum【拟新增】`hint_kind(reference_slow/simplified_zh/candidate_intent/phrase_hint)` | 慢速 / 中文释义 / 候选意图 / 短语提示 |
| `was_used` | boolean | 用户是否真的靠提示说出（false = 看了提示后仍独立答出，即"提示退出"成功） |
| `shown_at` / `used_at` | timestamptz 可空 | |

- 与"提示退出"：`was_used=false` 即"看了提示但未依赖它完成"，是把掌握从 `prompted` 推向 `independent` 的证据之一。
- 注：与 3.5.3 `intent_resolution_records` 的新列（§1）互补——`intent_resolution_records` 记"本次匹配尝试"，`hint_usage` 记"提示被展示/使用"，按事件实例关联。

### 3.5 `review_schedule`（间隔复现计划，用户级）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | uuid PK | |
| `user_id` / `pet_id` | uuid FK CASCADE | |
| `mastery_record_id` | uuid FK→mastery_records CASCADE | 每掌握记录一条计划 |
| `learning_object_id` | uuid FK→learning_objects | |
| `due_at` | timestamptz | 下次复现到期时间 |
| `interval_days` | int ≥1 | 当前间隔 |
| `status` | enum【拟新增】`review_status(due/active/snoozed/mastered/cancelled)` | **不复用** `resurfacing_status`（那是记忆召回专用），避免语义串台 |
| `last_reviewed_at` | timestamptz 可空 | |

- 唯一约束：`(mastery_record_id)`。
- 与既有 `resurfacing_tasks` 的边界：`resurfacing_tasks` 仍只服务"已确认语言记忆的自然带回"；`review_schedule` 只服务"学习对象掌握后的间隔复现"。两者不互相派生，防止同一表达被双重排期。对象达到 `mastered` 后其 `review_schedule.status` 转 `mastered`，不再主动排期。

---

## 4. 25 个事件需补的学习元数据（统一字段规范，不逐事件写长文）

### 4.1 在 `FixedEvent` 上新增可选字段 `learning`（zod，向后兼容）

```ts
// 新增可选字段，挂到既有 fixedEventSchema；既有 13 个字段不动
learning?: {
  // 本事件要练的学习对象（指向 learning_objects.object_key）
  objectives: {
    objectKey: string          // 对应 learning_objects.object_key
    tier: 'basic' | 'intermediate' | 'advanced'
  }[]
  // 交互结构：选择 / 开放表达 / 复述旧话 / 问答
  interactionStructure: 'choice' | 'open_expression' | 'recall_restate' | 'question_answer'
  // 掌握证据：哪些意图的成功结算，把对应对象从哪一阶推向哪一阶
  masteryEvidence: {
    objectKey: string
    signalIntentIds: string[]          // 如 bfv_intent_help
    evidenceKind: 'independent_production' | 'with_hint' | 'recognition'
  }[]
  // 复现入口：哪些对象后续可被间隔复现带出
  reviewEntry: {
    objectKey: string
    recallContextTopicId?: string      // 对齐圣经 11 个 topic_id，如 topic_today
  }[]
  // 可选：本事件整体难度上限（缺省取对象 tier 最大值）
  difficultyTierCeiling?: 'basic' | 'intermediate' | 'advanced'
}
```

- **为什么这样挂**：`objectives` 引用稳定 `objectKey`，事件内容迭代不改 ID；`masteryEvidence` 直接绑定既有 `intents[].id`，无需新增匹配逻辑即可落掌握；`reviewEntry` 与圣经 `topic_id` 对齐，喂给 §3.5 `review_schedule`。
- **建议字段名与类型**（汇总，供 zod 落地）：

| 字段 | 类型 | 必填 |
|---|---|---|
| `learning` | object? | 否（可选） |
| `learning.objectives[]` | array | 是（有 learning 时） |
| `learning.interactionStructure` | enum 四值 | 是 |
| `learning.masteryEvidence[]` | array | 否 |
| `learning.reviewEntry[]` | array | 否 |
| `learning.difficultyTierCeiling` | enum 三值 | 否 |

### 4.2 映射表指向

- 25 个事件的"学习目标 ↔ `objectKey` ↔ `topic_id` ↔ 掌握证据意图"逐条映射，统一登记到 **`LEARNING_SCENARIO_LIBRARY.md`**（本仓库目前**尚不存在该文件**，是本次的前置产出物；25 事件不逐个在本文展开，只在该映射表中维护一行一事件）。
- 本文件只规定字段规范；**批量补录 25 事件元数据**时，以 `objectKey` 已冻结的 `learning_objects` 为输入，逐事件填 `objectives / masteryEvidence / reviewEntry`。

### 4.3 25 事件的统一要求（不区分主次）

1. 每个事件至少 1 条 `objectives`；`birth_*` 种子事件也要补。
2. 每条 `masteryEvidence.signalIntentIds` 只能引用本事件已存在的 `intents[].id`。
3. `recall` 类型事件（`b1_return_first_words_v1`、`b2_recall_room_v1`）的 `interactionStructure=recall_restate`，其 `reviewEntry` 必须非空。
4. 所有 `objectKey` 必须先在 `learning_objects` 冻结后再被引用（见 §6 顺序）。

---

## 5. 新增 API 清单（N4 起，不改动既有 27 个与 N1–N3）

> 统一错误结构沿用 `{ error: { code, message, requestId, details? } }`，`message` 一律中文。学习类端点不返回百分制/排名。

| # | 方法+路径 | 用途 | 请求字段 | 响应字段 | 中文错误码建议 |
|---|---|---|---|---|---|
| **N4** | `POST /v1/learning/assessment` | 提交轻量水平测试（首测/重测/自测） | `{ kind: 'placement'\|'retest'\|'self_check', answers: [{itemRef, choice}], idempotencyKey }` | `{ assessmentId, recommendedTier, recommendedLanguageLevel, confidence, tierSource }` | `assessment_invalid`→"这次作答不完整，我们先看看你已经会说的。"；`assessment_already_submitted`→"这组作答已经记录过了。" |
| **N5** | `GET /v1/learning/difficulty-tier` | 读取当前难度档 | — | `{ tier, tierSource, updatedAt, languageLevel }` | 无（读接口） |
| **N6** | `PATCH /v1/learning/difficulty-tier` | 手动调整难度档（用户纠正/重测） | `{ tier: 'basic'\|'intermediate'\|'advanced', reason?: string, idempotencyKey }` | `{ tier, tierSource:'override', updatedAt }` | `tier_not_allowed`→"这个档暂不适合你现在的进度，我们先稳在当前档。"；`tier_invalid`→"难度档只能选基础、日常或进阶。" |
| **N7** | `GET /v1/learning/mastery` | 查询掌握状态（可按章/对象过滤） | query: `chapterId?`, `objectKey?` | `{ items: [{ objectKey, kind, tier, stage, lastSeenAt }] }` | `mastery_not_found`→"还没有可展示的学习记录。" |
| **N8** | `GET /v1/learning/review-schedule` | 查询复现计划（到期项） | query: `dueOnly?: boolean` | `{ items: [{ objectKey, tier, dueAt, status }] }` | 无（读接口） |
| **N9** | `POST /v1/learning/hint-usage` | 记录一次提示展示/使用（提示退出证据） | `{ eventInstanceId, stateId, learningObjectId?, hintKind, wasUsed, idempotencyKey }` | `{ recorded: true, promotedStage? }` | `hint_not_available`→"这里暂时没有提示，你可以直接试着说说看。"；`event_not_found`（沿用既有） |

- 说明：
  - N4/N6 均要求 `idempotencyKey`，对接既有 `idempotency_records`（`scope=learning_assessment / difficulty_tier`）。
  - N7/N8 是纯读，不触发任何状态推进；返回**不含**原始句子、不含分数，只回对象 ID、档位、阶段、时间。
  - 难度档的运行时生效（分支/参考句选择）由服务端在事件启动时读 `user_settings.difficulty_tier`，不下发到客户端做判断。

---

## 6. 隐私落点（对齐 user_settings / memories 软删除）

1. **不展示羞辱性分数**：`mastery_records` 的 `*_count`、`review_schedule` 一律不渲染成"得分/正确率/排行"；UI 只说"这个说法你已经能独立用出来了 / 还在慢慢练"。`assessment_results.confidence` 只用于调度，不对用户暴露数值。
2. **支持重测**：N4 允许 `kind=retest`；新结果可刷新建议，不删除历史（保留审计）。
3. **支持纠正**：N6 允许用户手动把难度档调到任意合法值（`tier_source=override`），系统不强制、不羞辱、不弹"你确定吗"负向确认。
4. **支持删除**：`mastery_records / assessment_results / hint_usage / review_schedule` 全部随 `users` 外键 `ON DELETE CASCADE`，纳入既有 §10.3 注销六步顺序；`learning_objects` 是全局内容，不随个人注销删除。
5. **不存原文/录音**：`assessment_results.answers_summary` 只存结构化选择；`hint_usage` 不存用户原句；与既有"未确认 ASR 不入库、原始录音只走临时桶"一致。
6. **与 memories 一致**：学习数据不设"默认训练同意"；首版不把用户学习数据用于模型训练。

---

## 7. 风险与实施顺序（避免预制语音返工）

> 关键约束：千问 `qwen-audio-3.0-tts-flash` 预制语音绑定到**具体文本版本**（契约 §9）。一旦学习元数据导致新增/改写台词，就要重新生成。所以顺序必须是“先冻结元数据定义，再补事件，最后才制作音频”。

1. **第 1 步：冻结 `learning_objects` 定义**（`objectKey`、`kind`、`tier` 枚举）。
   - 风险：objectKey 一旦被 25 事件引用后再改名，全部元数据与映射表返工。
2. **第 2 步：在 `FixedEvent` zod 加可选 `learning` 字段**（向后兼容，旧规则集可解析）；同步新建 `LEARNING_SCENARIO_LIBRARY.md` 映射表骨架。
3. **第 3 步：批量补录 25 个事件的 `learning` 元数据**（按 §4 规范），并补 `MORROW_LIFE_STORY_BIBLE` 每章 `languageCeiling`。
   - 同时处理既有 3.5.4 待办：`birth_restore_object_v1` 仍缺 `bro_intent_pause` 暂停意图与暂停台词——**与本次元数据补录同批完成**，避免后面单独开一次内容版本。
4. **第 4 步：DB migration**（只向前追加）：新增 5 张用户/全局表与 4 个新枚举；`user_settings` 加 `difficulty_tier/tier_source/tier_updated_at`；`intent_resolution_records` 加 `hint_kind/hint_was_used` 可空列。
5. **第 5 步：实现 N4–N9**，接通 `idempotency_records` 与读取链路。
6. **第 6 步：运行时接线**——事件启动读难度档、按 `masteryEvidence` 结算掌握、按 `review_schedule` 到期排复现。
7. **第 7 步（最后）：`qwen-audio-3.0-tts-flash` 预制语音**。
   - 只有在第 3 步台词/学习元数据全部定稿后才生成一份正常语速音频；否则文本版本一变就要重录，造成 `audio_bindings` 返工。

**必须先做**：第 1 步（冻结对象定义）→ 第 3 步（25 事件元数据）。这两步未完成前，不得开始任何台词音频预制。

---

## 8. 本清单不做（边界）

- 不改 `english-pet` 任何工程代码（本文件纯设计）；
- 不重命名/不改义既有 23 张表既有列、既有 27 端点与 N1–N3；
- 不新建平行于 `language_level`(L1–L4) 的等级枚举；
- 不把掌握/测评做成分数、排行、打卡；
- 不提前决定向量检索或推荐画像（沿用 DATA_MODEL §16）。
