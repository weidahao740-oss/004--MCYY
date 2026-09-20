# DATA_MODEL_MIGRATION — 固定内容方案数据模型迁移设计

> 版本：1.0.0（阶段 3.5.3）
> 状态：纯设计文档，不修改 `english-pet` 工程代码
> 上游依据：
> - `FIXED_CONTENT_CONTRACT.md` v1.0.0（固定内容、人工译文、预制音频、确定性意图匹配、记忆确认白名单、LLM 默认关闭）
> - `MORROW_LIFE_STORY_BIBLE.md` v1.0.0（七章主线、mainline/daily/recall 三类事件、世界状态 key）
> - `PRIVACY_DESIGN.md` v1.0.0-draft（ASR/录音/记忆/注销约束）
> 现有 Schema：`english-pet/packages/database/src/schema.ts` + `migrations/0000_initial.sql`（23 张表，已逐表逐字段核对）
> 标注约定：既有表/字段照实描述；凡属本次设计的新表、新列、新枚举一律标注【拟新增】，不视为已存在。

---

## 0. 迁移目标

把现有“LLM 适配器 + 事件配置”数据骨架，平移为“版本化固定内容 + 确定性意图匹配 + 白名单状态迁移”的落库方案：

1. 规则集、章节、事件、台词、学习内容、人工译文、预制音频都有独立版本与登记；
2. 确定性匹配的每次解析留痕（`rulesetVersion + eventVersion + stateId + inputHash + resolvedIntentId`），但不留原始录音；
3. 世界状态只由已提交结果写入；七章成长进度可查询、可门控；
4. 记忆提案沿用现有 `memories` 状态机，白名单来源 + 必须用户确认；
5. LLM 适配器数据上保留、默认关闭。

迁移原则沿用 `DATA_MODEL.md` §13.1：migration 只向前追加；破坏性变更走 expand → backfill → switch → contract；Schema 代码与 SQL migration 同提交。本文不规定具体 migration 序号，落地时按四位序号追加（如 `0001_fixed_content.sql`）。

---

## 1. 现有表盘点（逐表判定）

下表逐表列出 `schema.ts` 中真实存在的 23 张表。字段摘要只列关键列，完整定义以 schema.ts 为准。判定三档：【保留】结构不动；【加字段】仅追加可空列/可空枚举列；【不改】含义同上但明确说明不需要改。

| # | 表名 | 关键字段摘要（既有） | 判定 | 迁移说明 |
|---|---|---|---|---|
| 1 | `users` | `id`、`account_kind`、`status`、`locale`、`time_zone`、`deleted_at`、`purge_after` | 保留 | 业务用户根实体，固定内容方案不改身份模型 |
| 2 | `user_identities` | `user_id`、`provider`、`provider_subject`、邮箱/手机可空、`deleted_at` | 保留 | 外部身份与业务用户分离，与内容方案无关 |
| 3 | `guest_sessions` | `user_id`、`token_hash`、`expires_at`、`revoked_at` | 保留 | 只存令牌哈希，不动 |
| 4 | `pets` | `user_id` 唯一、`character_key=morrow`、`persona_version`、`relationship_stage`、两个计数 | 保留 | 既有 `persona_version` 直接承接契约 `personaVersion`（如 `morrow-1.0`），无需新增列 |
| 5 | `user_settings` | `user_id` 主键、`language_level`、`speech_rate`、`memory_enabled`、`voice_input/output_enabled` 等 | 加字段 | 【拟新增】`llm_assist_enabled boolean not null default false`：固定内容引擎为主，LLM 增强默认关（见 §2.7） |
| 6 | `event_definitions` | `event_key`、`version`、`ruleset_id`、`persona_version`、`prompt_version`、`output_schema_version`、`config_json`、`config_hash`、`status draft/active/retired` | 加字段 | 【拟新增】`chapter_id varchar(96)`、`event_type`（拟新增枚举 `mainline/daily/recall`）。既有 `ruleset_id/persona_version/config_hash/status` 已能登记事件级版本；`prompt_version/output_schema_version` 面向旧 LLM，保留为历史字段，固定内容事件不再要求填写新值 |
| 7 | `event_instances` | `user_id`、`pet_id`、`event_definition_id`、`event_key`、`event_version`、`ruleset_id`、`status`、`current_state_id`、`state_payload`、`definition_snapshot`、`attempt_count`、生命周期时间戳 | 加字段 | 【拟新增】`chapter_id varchar(96)`、`event_type`（拟新增枚举），与 §1.6 同义冗余，便于章节门/日常轮换池查询而不读 `definition_snapshot`；既有 `ruleset_id + event_version + current_state_id` 已承接契约的确定性快照要求 |
| 8 | `conversations` | `user_id`、`pet_id`、`event_instance_id`、`kind first_day/event/free_chat`、`status`、`summary` | 保留 | 固定事件仍走 `kind=event` 会话，不改 |
| 9 | `messages` | `conversation_id`、`role`、`content_text`、`input_mode text/voice/reference_reply/choice/system`、`asr_confidence`、`event_state_id`、`client_message_id`、`model_output_json` | 保留 | 既有 `input_mode` 枚举已覆盖契约五类可匹配输入（文字/确认后 ASR/参考句/选项/系统）；未确认 ASR 不写 `content_text` 的既有约束继续生效。确定性匹配结果不落本表，落 §2.6 新表 |
| 10 | `event_transition_logs` | `event_instance_id`、`from_state_id`、`to_state_id`、`trigger`、`guard_result`、`idempotency_key`、`payload` | 保留 | 状态迁移审计继续用；意图解析五元组另立新表，避免把迁移日志表语义撑大 |
| 11 | `event_outcomes` | `event_instance_id` 唯一、`outcome_id`、`world_state_writes jsonb`、`effect_summary`、`committed_at` | 保留 | 与契约“只有 outcomes 可写世界状态”完全一致，不改 |
| 12 | `user_world_state` | `user_id + pet_id + state_key` 唯一、`state_value jsonb`、`source_event_instance_id`、`version` | 保留 | 通用 key-value 世界状态继续承载 `first_restored_object`、`paused_once` 等；章节进度因有门控/完成条件，另立专用表（§2.4），不塞进通用 kv |
| 13 | `idempotency_records` | `user_id + scope + idempotency_key` 唯一、`request_hash`、`status`、`response_body`、`expires_at` | 保留 | 契约“重复提交只返回既有结算”继续靠它 |
| 14 | `memories` | `kind`、`status proposed/confirmed/paused/rejected/deleted/expired`、`content`、`confidence`、`sensitivity normal/restricted`、`requires_user_confirmation`（check 恒 true）、`source_event_instance_id`、`version` | 加字段 | 状态机整体沿用。【拟新增】`memory_rule_id varchar(96)`、`proposal_source`（拟新增枚举 `declared_event_rule/explicit_user_request`），对齐契约记忆来源白名单；既有 check（`requires_user_confirmation = true`、`confirmed` 必有 `confirmed_at`）继续强制 |
| 15 | `memory_sources` | `memory_id + message_id` 主键 | 保留 | 只关联已确认消息，不改 |
| 16 | `memory_revisions` | `memory_id`、`action`、`actor`、`previous/new_content`、`previous/new_status`、`reason_code`、`memory_version` | 保留 | 用户审核记忆的审计链，不改 |
| 17 | `journal_entries` | `event_instance_id` 唯一、`what_happened`、`what_user_said`、`natural_expression`、`what_morrow_remembers`、`visibility` | 保留 | 契约 §8.2“历史回看用生成当时的文本/译文版本”：日记在写入时固化当时文本，天然满足，无需新增版本列 |
| 18 | `journal_memory_links` | `journal_entry_id + memory_id` 主键 | 保留 | 不改 |
| 19 | `language_feedback` | `result`、`focus_items`、`success/original/natural_expression`、`user_saved_as_memory`、每事件最多一条 | 保留 | 固定内容反馈结构不变 |
| 20 | `resurfacing_tasks` | `memory_id`、`target_event_key`、`semantic_contexts`、`status`、冷却/间隔计数 | 保留 | 记忆回访（recall）触发仍走已确认语言记忆，不改调度模型 |
| 21 | `resurfacing_attempts` | `task_id + event_instance_id` 唯一、`mode`、`result` | 保留 | 不改 |
| 22 | `privacy_consents` | `consent_type`、`document_version`、`decision`、`source`、追加式 | 保留 | `voice_processing` 授权继续用于未来例外留存录音 |
| 23 | `account_deletion_requests` | `status`、`scheduled_purge_at`、`completed_at`、`failure_code` | 保留 | 注销状态机不改 |

盘点结论：现有 23 表中【保留/不改】19 张，【加字段】4 张（`user_settings`、`event_definitions`、`event_instances`、`memories`）。

---

## 2. 需新增字段与新表清单

### 2.1 规则集登记表 `fixed_rulesets`（【拟新增】表）

- 为什么需要：契约顶层对象 `FixedContentRuleset` 带 `id/version/schemaVersion/personaVersion/matchingPolicy/fallbacks/translationToggle/llmPolicy`。现有 `event_definitions` 是“逐事件”登记，缺一个规则集级版本头；客户端必须按服务端 `schemaVersion` 校验，不识别即停事件并显示中文升级提示。
- 挂法：新表，不并入 `event_definitions`。
- 拟议列：
  - `id uuid` 主键；
  - `ruleset_id varchar(96)` 唯一，如 `fixed-content-v1.0.0`；
  - `schema_version varchar(32)`，如 `1.0.0`；
  - `persona_version varchar(64)`，如 `morrow-1.0`（与 `pets.persona_version`、`event_definitions.persona_version` 对齐）；
  - `default_ui_locale varchar(16) not null default 'zh-CN'`；
  - `matching_policy jsonb`：阈值、分差、候选数等匹配策略；
  - `fallbacks jsonb`、`translation_toggle jsonb`、`llm_policy jsonb`；
  - `config_hash varchar(64)`：规范化规则集 JSON 的 SHA-256，部署一致性校验；
  - `status`（复用/沿用既有 `event_definition_status` 同款三态 `draft/active/retired`，落地时新建同名枚举或复用）；
  - `activated_at` / `retired_at` / `created_at`。
- 与现有字段关系：`event_definitions.ruleset_id` 关联到本表 `ruleset_id`；`pets.persona_version` 是实例侧当前人格版本，与规则集声明版本做一致性校验。

### 2.2 学习内容与译文版本表 `learning_contents`（【拟新增】表）

- 为什么需要：契约 §2.2 要求每条英文学习内容携带 `content_id + text_version + english + translation.text_zh + translation.version + manual_reviewed`；英文任一字符变化升 `text_version`，译文独立升 `translation_version`。现有 `event_definitions.config_json` 虽是配置快照，但无法独立追踪“文本版本 / 译文版本 / 人工审核态”，也无法被音频绑定按版本引用。
- 挂法：新表。
- 拟议列：
  - `id uuid` 主键；
  - `ruleset_id varchar(96)`（关联 §2.1）；
  - `content_id varchar(96)`，规则集内全局唯一，如 `bfv_prompt_line_content`；
  - `text_version varchar(32)`，如 `1.0.0`；
  - `english_text text not null`；
  - `translation_text_zh text`，人工译文；
  - `translation_version varchar(32)`；
  - `manual_reviewed boolean not null default false`；
  - `content_kind varchar(32)`：`line/reference/option/letter` 等，落地时定枚举；
  - `status`（`draft/active/retired`）；
  - `created_at`。
  - 唯一约束：`(ruleset_id, content_id, text_version)`。
- 与现有字段关系：`messages.content_text` 只存用户确认后原文，不存学习内容；本表是“权威学习素材库”，日记/反馈里引用的表达在写入时固化，历史回看不被新译文静默替换（契约 §8）。

### 2.3 音频绑定表 `audio_bindings`（【拟新增】表）

- 为什么需要：契约 §9 要求每条需语音台词绑定 `audioId/lineId/contentId/textVersion/translationVersion/variant normal|slow/voiceProfileId/fileRef/checksumSha256/status planned|ready|retired`，且 normal/slow 是两条独立音频 ID；`ready` 前必须人工试听并写 SHA-256。现有表无任何音频登记表。
- 挂法：新表。
- 拟议列：
  - `id uuid` 主键；
  - `audio_id varchar(96)` 唯一，如 `bfv_prompt_line_audio_normal`；
  - `ruleset_id varchar(96)`；
  - `line_id varchar(96)`，如 `bfv_prompt_line`；
  - `content_id varchar(96)` + `text_version varchar(32)` + `translation_version varchar(32)`：与 §2.2 三元组对齐，英文版本不一致时客户端拒绝缓存旧音频；
  - `variant speech_rateEnum`：直接复用既有 `speech_rateEnum('slow','normal')`，不新建枚举；
  - `voice_profile_id varchar(96)`，首版 `morrow_voice_v1`；
  - `file_ref varchar(512)`：对象存储路径键（如 `tts/<chapter_id>/<event_id>/<line_id>/1.0.0/normal.wav`），库内只存标识不存二进制；
  - `checksum_sha256 varchar(64)` 可空，`ready` 前必填；
  - `active_rms_dbfs numeric(5,2)` 与 `peak_dbfs numeric(5,2)` 可空，`ready` 前必须符合统一响度规范；
  - `loudness_report_ref varchar(512)` 可空，`ready` 前保存确定性后处理报告路径；
  - `status`（【拟新增】枚举 `planned/ready/retired`）；
  - `created_at`。
  - 唯一约束：`(line_id, variant, text_version)`。
- 与现有字段关系：与用户录音无关——本表登记的是发布态 TTS 素材；用户原始录音不落库、只走临时桶（见 §4）。

### 2.4 章节成长进度表 `user_chapter_progress`（【拟新增】表）

- 为什么需要：圣经规定七章主线、章节门（进入条件/完成条件）、“单次选择不能跳章、主线必达可恢复、暂停不惩罚”。现有 `user_world_state` 是自由 kv，无法表达“当前章、主线序列进度、完成条件核对”这类结构化门控；而章节门又不属于事件实例本身。
- 挂法：新表。
- 拟议列：
  - `id uuid` 主键；
  - `user_id uuid` 外键 → `users`，`ON DELETE CASCADE`；
  - `pet_id uuid` 外键 → `pets`，`ON DELETE CASCADE`；
  - `chapter_id varchar(96)`，如 `chapter_01_birth` … `chapter_07_independent_life`；
  - `status`（【拟新增】枚举 `locked/in_progress/completed`）；
  - `sequence_position integer not null default 0`：本章主线已推进到第几个主线事件；
  - `started_at` / `completed_at` 可空；
  - `last_event_instance_id uuid` 可空 → `event_instances`，`ON DELETE SET NULL`；
  - `completion_checks jsonb not null default '[]'`：如“至少 1 条已确认关系记忆”这类完成条件核对结果；
  - `created_at` / `updated_at`。
  - 唯一约束：`(user_id, pet_id, chapter_id)`。
- 与现有字段关系：世界状态 kv 仍由 `user_world_state` 承载（物品、喜好、`paused_once` 等）；章节切换只能由“上一章全部主线完成 + 完成条件达成”写本表，任何分支结果不得直接改 `chapter_id`。

### 2.5 事件实例/定义的章节与类型字段（【拟新增】列）

- 为什么需要：日常事件轮换池（`daily` 去重、冷却）与“未完成主线优先”都需要按章、按类型筛选；若每次都解析 `definition_snapshot` JSON 成本高且易漂移。
- 挂法：
  - `event_definitions` 加 `chapter_id varchar(96)`、`event_type`（【拟新增】枚举 `mainline/daily/recall`）；
  - `event_instances` 加同名两列，作为启动时快照冗余（与既有 `event_key/event_version/ruleset_id` 冗余风格一致）。
- 与现有字段关系：不替代 `definition_snapshot`，仅做索引/筛选投影；真值仍以实例快照为准。

### 2.6 意图解析记录表 `intent_resolution_records`（【拟新增】表）

- 为什么需要：契约 §5.3 硬要求每次匹配记录 `rulesetVersion + eventVersion + stateId + inputHash + resolvedIntentId`，且不记录原始录音。现有 `event_transition_logs` 只在发生迁移时写，无法记录“无匹配/低置信/冲突/被否认”这些不推进的尝试，也缺输入哈希与解析到的意图 ID。
- 挂法：新表，每次进入匹配（无论是否推进）追加一行。
- 拟议列：
  - `id uuid` 主键；
  - `user_id uuid` 外键 → `users`，`ON DELETE CASCADE`；
  - `event_instance_id uuid` 外键 → `event_instances`，`ON DELETE CASCADE`；
  - `message_id uuid` 可空 → `messages`，`ON DELETE SET NULL`（被否认/未确认输入没有已确认消息）；
  - `ruleset_version varchar(96)`、`event_version varchar(32)`、`state_id varchar(96)`；
  - `input_hash varchar(64)`：规范化后输入（NFKC/小写/去标点后）的 SHA-256，只存哈希不存原文；
  - `resolved_intent_id varchar(96)` 可空：无匹配/冲突时为 `null`；
  - `match_kind`（【拟新增】枚举 `choice/exact_phrase/keyword/no_match/ambiguous/denied`）；
  - `candidate_intents jsonb`：最多 3 个候选意图 ID 及其分数（结构化，不含对话原文）；
  - `created_at`。
  - 索引：`(user_id, event_instance_id, created_at)`；与 `idempotency_records` 配合去重（同一幂等键不重复结算）。
- 与现有字段关系：`event_transition_logs` 继续只记真实迁移；本表是“匹配尝试审计”，二者通过 `event_instance_id` 关联。

### 2.7 记忆提案来源与 LLM 开关（【拟新增】列）

- `memories` 加 `memory_rule_id varchar(96)` 可空：对应契约 `FixedMemoryRule.id`（如 `bfv_relationship_memory`）；
- `memories` 加 `proposal_source`（【拟新增】枚举 `declared_event_rule/explicit_user_request`）：记忆提案只能来自这两个白名单；
- `user_settings` 加 `llm_assist_enabled boolean not null default false`：LLM 适配器保留但默认关闭，且即使开启也只能落回白名单，不产生新内容 ID、不推进状态、不写记忆。
- 与现有字段关系：完全沿用 `memories.status` 状态机（`proposed → confirmed/paused/rejected/deleted/expired`）与既有两个 check（`requires_user_confirmation = true`、`confirmed` 必有 `confirmed_at`）；对齐点见 §3 步骤 4。

### 2.8 新增项汇总

| 类别 | 名称 |
|---|---|
| 新表（【拟新增】） | `fixed_rulesets`、`learning_contents`、`audio_bindings`、`user_chapter_progress`、`intent_resolution_records`（5 张） |
| 新列（【拟新增】） | `user_settings.llm_assist_enabled`；`event_definitions.chapter_id`、`event_definitions.event_type`；`event_instances.chapter_id`、`event_instances.event_type`；`memories.memory_rule_id`、`memories.proposal_source`（7 列） |
| 新枚举（【拟新增】） | `event_type(mainline/daily/recall)`、`proposal_source(declared_event_rule/explicit_user_request)`、`audio_binding_status(planned/ready/retired)`、`chapter_progress_status(locked/in_progress/completed)`、`intent_match_kind(choice/exact_phrase/keyword/no_match/ambiguous/denied)` |

---

## 3. 迁移顺序（每步可独立验证）

整体是“加列加表 → 回填种子内容 → 切写入路径”的 expand → backfill → switch。每步完成后旧读写路径不受影响。

### 步骤 1：规则集与版本字段先行

1. 新建枚举与 `fixed_rulesets` 表；
2. `event_definitions`、`event_instances` 追加可空列 `chapter_id`、`event_type`；`user_settings` 追加 `llm_assist_enabled default false`；
3. 部署脚本把 `packages/domain/src/fixed-content-v1.ts`（Zod 校验后）作为 `fixed-content-v1.0.0` 登记进 `fixed_rulesets`，并把两个种子事件 `birth_first_voice_v1`、`birth_restore_object_v1` 登记进 `event_definitions`（沿用既有 §13.2 同步流程：算 `config_hash`、同 `event_key+version` hash 不一致即失败）；
4. 衔接说明：此步只加元数据，运行时仍可用内存规则集；新列先为空，回填在步骤 2/4 完成。
   独立验证：`fixed_rulesets` 有且仅有一条 active 记录；`event_definitions` 两个种子事件 `chapter_id=chapter_01_birth`、`event_type=mainline`。

### 步骤 2：学习内容、译文与音频绑定

1. 新建 `learning_contents`、`audio_bindings`；
2. 从种子事件配置抽取全部台词/参考句/选项写入 `learning_contents`（`text_version=1.0.0`、`translation_version=1.0.0`、`manual_reviewed` 按人工审核结果填）；
3. 每条需语音台词生成 normal/slow 两条 `audio_bindings`，`file_ref` 按 `tts/<chapter_id>/<event_id>/<line_id>/1.0.0/<variant>.wav` 约定，未试听前 `status=planned`、`checksum_sha256=null`；
4. 衔接说明：此时客户端仍可从内存规则集渲染；数据库表是“登记副本”，供版本校验与音频缓存校验。
   独立验证：`audio_bindings` 每个 `line_id` 恰有 normal/slow 两行；`manual_reviewed=true` 的内容才能被正式端引用。

### 步骤 3：成长与世界状态落库

1. 新建 `user_chapter_progress`；
2. 为存量/新用户初始化 `chapter_01_birth = in_progress`，其余六章 `locked`；
3. 约定世界状态 key 白名单仍由结果声明：`user_world_state` 承接 `first_restored_object`、`paused_once` 等；章节完成条件（如“至少 1 条已确认关系记忆”）写入 `user_chapter_progress.completion_checks`；
4. 衔接说明：原内存中的“当前章/进度”改为读 `user_chapter_progress`；世界状态读写服务仍只接受 outcome 白名单 key。
   独立验证：新用户首次进入自动激活第一章；完成两个种子事件且确认 1 条关系记忆后，第一章可判定 completed 并解锁第二章。

### 步骤 4：事件实例迁移与意图解析留痕

1. 新建 `intent_resolution_records`；`memories` 追加 `memory_rule_id`、`proposal_source`；
2. 运行时把“每次输入匹配”从内存比对改为：先查幂等 → 规范化 → 在当前状态 `eligibleStateIds` 内匹配 → 无论是否推进都追加一行 `intent_resolution_records`；推进才写 `event_transition_logs`；
3. 记忆提案只允许由 `declared_event_rule`（来源意图已确认）或 `explicit_user_request`（用户明确要求并确认）生成，统一 `proposed` + `requires_user_confirmation=true`，用户确认才 `confirmed`；
4. 衔接说明：这是“内存存储 → PostgreSQL”的主切换点——此前匹配发生在内存，此后落库留痕；旧实例继续用自己的 `definition_snapshot` 恢复，不在线切换版本。
   独立验证：无匹配/低置信/冲突/否认均产生 `resolved_intent_id is null` 或 `match_kind in (no_match/ambiguous/denied)` 的记录，且不写 outcome、不推进状态；重复输入命中幂等返回旧结果。

### 步骤 5：开关、隐私对齐与收尾

1. 确认 `user_settings.llm_assist_enabled` 默认 false；无任何 LLM 密钥时完整事件仍可跑通；
2. 核对新表外键级联：`user_chapter_progress`、`intent_resolution_records` 随 `users` 删除级联；`fixed_rulesets`/`learning_contents`/`audio_bindings` 是全局内容登记，不属于用户数据，不随个人账号删除；
3. 跑 §4 隐私对齐清单与既有注销流程回归。
   独立验证：删除测试账号后，用户级新表行全部消失，全局内容登记保留；LLM 关闭状态下两章种子事件可完整走通。

---

## 4. 隐私对齐（承接 PRIVACY_DESIGN）

1. **未确认 ASR 不入库**：延续 `messages.content_text` 仅用户确认后写入；未确认转写只在客户端审核态，不进库、不进匹配、不进记忆。意图解析只存 `input_hash`（规范化文本的 SHA-256），不存原文，更不存音频。
2. **原始录音不落库，只存文件标识**：用户录音走临时桶，ASR 完成 + 用户确认后即删；`audio_bindings.file_ref` 登记的是发布态 TTS 素材（服务端生成、非用户录音），与用户录音严格隔离。
3. **敏感记忆 restricted**：沿用 `memories.sensitivity=normal/restricted`；`restricted` 提案服务端自动拒绝且不存正文；新增 `proposal_source` 不改变该约束。
4. **记忆必须用户确认**：既有 check 强制 `requires_user_confirmation=true`；新提案一律 `proposed`，保存前展示可编辑文本；未处理提案沿用 24h 过期清理。
5. **账号删除级联**：用户级新表（`user_chapter_progress`、`intent_resolution_records`）外键 `ON DELETE CASCADE`；彻底删除仍按 §10.3 六步顺序，先清对象存储临时语音、再单事务删 `users` 根记录；全局内容登记表不受个人注销影响。
6. **日志不扩面**：匹配审计只存结构化候选与哈希，业务日志仍只记请求 ID/错误码/耗时/成本，不记 `content_text` 与音频地址。

---

## 5. 明确不做（本迁移范围边界）

- 不改 `english-pet` 工程代码，本文仅设计；
- 不删除、不重命名既有 23 张表与既有列；
- 不引入向量库、推荐画像宽表、排行榜；
- 不把全局内容登记表（规则集/学习内容/音频绑定）设计成按用户存储；
- 不在本阶段接入真实 ASR/TTS 供应商，音频绑定先以 `planned` 占位。

---

## 6. 待办（文档侧登记，均未完成）

> 以下为后续落地待办，当前**均未完成**，不得标记为 done。与代码修复面 D/E 对应，本节仅登记文档侧待办，不修改工程代码。

1. `journal_entries` 增加 `version` 列（乐观锁）及 `title_zh` / `event_key` / `pronunciation_note` 列；
2. 固定内容 5 张持久化表（`fixed_rulesets` / `learning_contents` / `audio_bindings` / `user_chapter_progress` / `intent_resolution_records`）尚未建表，待后续 migration 落地；
3. 新端点 N1 / N2 / N3（`GET /v1/fixed-content/ruleset`、`POST /v1/events/:id/intents`、`GET /v1/audio/bindings/:audioId`，见 `API_MIGRATION.md`）待后端实现。
