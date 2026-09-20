# DATA_MODEL — 成人英语 AI 宠物数据模型

> 版本：1.0.0  
> 状态：数据库 Schema 初稿已落地，可进入 AI/语音验证与隐私策略  
> 数据库：CloudBase PostgreSQL  
> ORM / 迁移：Drizzle ORM + Drizzle Kit  
> 关联文件：`EVENTS_V1.md`、`FIRST_DAY_FLOW.md`、`PET_SYSTEM_PROMPT.md`、`english-pet/packages/database/src/schema.ts`、`english-pet/packages/database/migrations/0000_initial.sql`

## 1. 设计目标

数据模型必须支持一条可恢复、可解释、可删除的核心链路：

```text
业务用户
  → 与 Morrow 的对话
  → 事件实例及确定性状态迁移
  → 用户确认后的世界结果
  → 三类记忆提案与审核
  → 共同记忆册和英语反馈
  → 合适时机的旧表达自然复现
```

首版数据层优先保证：

1. 登录身份和业务用户分离；
2. 访客可完成首日并在同一设备续接，后续可绑定正式身份；
3. 对话、事件、记忆和日记都归属同一个内部 `user_id`；
4. 事件中断后可恢复到最近确认状态；
5. 重复请求不会重复推进事件、写入世界状态或生成记忆；
6. 三类长期记忆在用户确认前不能进入模型上下文；
7. 已暂停、删除、过期或拒绝的记忆不能被检索；
8. 个人数据可软删除，并能按注销请求执行彻底删除；
9. 配置版本、提示词版本和输出 Schema 版本可追溯与回滚。

## 2. 模型边界与权威来源

| 内容 | 权威来源 | 数据库责任 |
|---|---|---|
| 角色人格与安全边界 | `PET_SYSTEM_PROMPT.md` 对应版本 | 记录实例使用的版本号，不复制整份提示词 |
| 事件状态、迁移与结果 | `events-v1.ts` 对应规则集 | 登记版本、保存实例快照、拒绝配置外迁移 |
| 用户身份 | `users` + `user_identities` | 使用内部 UUID 作为所有业务外键 |
| 当前事件进度 | `event_instances` | 保存最近确认状态；模型不能直接改库 |
| 状态迁移历史 | `event_transition_logs` | 追加写，记录 from/to、触发和幂等键 |
| 世界状态 | `user_world_state` | 只接受事件配置声明的键和值 |
| 长期记忆 | `memories` | 只将 `confirmed` 且有效记录送入上下文 |
| 用户修改历史 | `memory_revisions` | 保存每次确认、编辑、暂停、恢复、删除的审计摘要 |
| 共同记忆册 | `journal_entries` | 保存用户可见、可编辑的事件摘要 |
| 英语反馈 | `language_feedback` | 最多一条成功表达、一条自然表达、一条必要发音提示 |
| 自然复现 | `resurfacing_tasks` / `resurfacing_attempts` | 按相关性、冷却和事件间隔调度并记录结果 |

原则：**模型只能提出建议；状态推进、世界状态写入、记忆确认和删除均由确定性服务端逻辑执行。**

## 3. 实体关系总览

```text
users ──1:1── pets
  │
  ├──1:N── user_identities
  ├──1:N── guest_sessions
  ├──1:1── user_settings
  ├──1:N── privacy_consents
  ├──1:N── conversations ──1:N── messages
  │                              │
  │                              └──N:M── memories（通过 memory_sources）
  │
  ├──1:N── event_instances ──1:N── event_transition_logs
  │          │       │
  │          │       ├──0:1── event_outcomes
  │          │       ├──1:N── idempotency_records
  │          │       └──1:N── user_world_state（来源关联）
  │          │
  │          ├──1:N── memories
  │          ├──0:1── journal_entries
  │          └──1:N── language_feedback
  │
  ├──1:N── memories ──1:N── memory_revisions
  │          │
  │          └──1:N── resurfacing_tasks ──1:N── resurfacing_attempts
  │
  └──1:N── account_deletion_requests

event_definitions ──1:N── event_instances
```

`event_definitions` 是配置版本登记表；运行时业务不能通过后台直接编辑它。发布新规则集时由部署脚本把已经通过 Zod 校验的配置同步进表。

## 4. 身份、用户与宠物

### 4.1 `users`

业务用户根实体。访客进入时就创建内部用户记录，绑定账号不更换 `user_id`。

| 字段 | 类型 | 规则 |
|---|---|---|
| `id` | UUID | 主键，服务端生成 |
| `account_kind` | enum | `guest` / `registered` |
| `status` | enum | `active` / `suspended` / `deletion_pending` / `deleted` |
| `locale` | varchar(16) | 默认 `zh-CN`；只用于界面与必要解释 |
| `time_zone` | varchar(64) | 默认 `Asia/Shanghai`；用于每日事件和冷却 |
| `created_at` / `updated_at` | timestamptz | 服务端时间 |
| `deleted_at` | timestamptz nullable | 软删除时间 |
| `purge_after` | timestamptz nullable | 注销后允许彻底清除的时间点 |

删除用户时，不把邮箱、手机号、微信 ID 等复制到本表。

### 4.2 `user_identities`

外部认证身份，与业务用户分离。

| 字段 | 类型 | 规则 |
|---|---|---|
| `id` | UUID | 主键 |
| `user_id` | UUID FK | 指向 `users`，级联删除 |
| `provider` | enum | `email` / `phone` / `wechat` / `apple` |
| `provider_subject` | varchar(255) | 保存认证提供方稳定主体标识；不保存明文密码 |
| `email_normalized` | varchar(320) nullable | 仅邮箱身份需要 |
| `phone_e164` | varchar(32) nullable | 仅手机号身份需要 |
| `verified_at` | timestamptz nullable | 完成验证时间 |
| `last_used_at` | timestamptz nullable | 最近登录时间 |
| `deleted_at` | timestamptz nullable | 解绑后的软删除 |

唯一约束：`provider + provider_subject`。一个外部身份只能绑定一个业务用户。

### 4.3 `guest_sessions`

同一浏览器访客续接凭证。

- 数据库只保存随机令牌哈希 `token_hash`，不保存原始令牌；
- 一个访客业务用户可拥有多条轮换记录，但同一时刻仅未撤销、未过期的令牌有效；
- 绑定正式身份后可以撤销全部访客令牌，但保留同一 `user_id` 下的业务数据。

### 4.4 `pets`

首版每个用户只有一只 Morrow。

| 字段 | 含义 |
|---|---|
| `user_id` | 唯一外键，保证一用户一宠物 |
| `character_key` | 固定为 `morrow` |
| `persona_version` | 当前角色版本，如 `morrow-1.0` |
| `relationship_stage` | `NEW` / `FAMILIAR` / `TRUSTED` / `CLOSE` |
| `meaningful_interaction_count` | 有意义共同事件次数，不等于登录天数 |
| `communication_success_count` | 成功被理解的累计次数 |

关系阶段只能由服务端规则推进，不允许模型单句修改，不因缺席倒退。

### 4.5 `user_settings`

每个用户一行：

- 内部语言级别 `L1`—`L4`；
- 回复长度、语速、字幕、纠错偏好；
- 时区和界面语言；
- `memory_enabled`：全局暂停长期记忆调用；
- `voice_input_enabled` / `voice_output_enabled`；
- 设置更新时间。

关闭 `memory_enabled` 后，已有记忆不删除，但检索层必须排除所有个人记忆，直到用户恢复。

## 5. 对话与消息

### 5.1 `conversations`

一段可恢复对话会话，可关联一个事件实例，也可为普通主页对话。

关键字段：

- `kind = first_day | event | free_chat`；
- `event_instance_id` 可空；
- `status = active | paused | completed | abandoned`；
- `summary` 只保存必要的服务端摘要，不用来替代原始用户确认；
- `last_message_at` 用于会话恢复排序；
- `deleted_at` 支持软删除。

### 5.2 `messages`

| 字段 | 规则 |
|---|---|
| `role` | `user` / `assistant` / `system` / `tool` |
| `content_text` | 用户确认后才保存的文本；未确认 ASR 不写这里 |
| `input_mode` | `text` / `voice` / `reference_reply` / `choice` / `system` |
| `asr_confidence` | 可空；仅保存数值，不保存原始音频 |
| `event_state_id` | 消息发生时的事件状态 ID，例如 `lt02_gist` |
| `client_message_id` | 客户端生成，用于用户侧重发去重 |
| `model_output_json` | 仅助手消息保存通过 Schema 校验后的结构化结果 |
| `status` | `pending` / `accepted` / `failed` / `cancelled` |
| `deleted_at` | 用户删除会话时软删除 |

唯一约束：同一会话内 `client_message_id` 唯一。日志系统不得默认复制 `content_text`。

## 6. 事件定义与事件实例

### 6.1 `event_definitions`

发布时同步的不可变配置登记：

- `event_key`：`first_day_v1`、`morrow_letter_v1` 等；
- `version`：独立事件版本；
- `ruleset_id`：如 `events-v1.0.0`；
- `persona_version`：notNull，当前人格版本（如 `morrow-1.0`）；
- `prompt_version`：notNull，旧 LLM 系统提示词版本，历史保留列；
- `output_schema_version`：notNull，旧 LLM 输出 Schema 版本，历史保留列；
- `config_json`：通过 `eventDefinitionSchema` 校验的完整配置；
- `config_hash`：规范化 JSON 的 SHA-256，用于部署一致性检查；
- `status = draft | active | retired`；
- `activated_at` / `retired_at`。

唯一约束：`event_key + version`。已经被实例引用的定义不得原位修改，只能增加新版本。

### 6.2 `event_instances`

用户真正运行的一次事件。

| 字段 | 规则 |
|---|---|
| `event_definition_id` | 锁定具体配置版本 |
| `event_key` / `event_version` / `ruleset_id` | 冗余快照，便于审计和回放 |
| `status` | `available` / `active` / `paused` / `completed` / `abandoned` |
| `current_state_id` | 最近一次确认状态，如 `ro04_place` |
| `state_payload` | 当前事件的非敏感结构化临时值 |
| `definition_snapshot` | 启动时的完整配置快照，保证旧实例可恢复 |
| `attempt_count` | 当前实例的提交尝试数 |
| `started_at` / `paused_at` / `completed_at` | 生命周期时间 |
| `last_idempotency_key` | 最近成功推进键，方便快速诊断 |

数据库创建部分唯一索引，保证每个用户只有一个 `active` 或 `paused` 的事件实例。重复事件 `today_story_v1` 每次创建新实例，不能重置旧实例。

### 6.3 `event_transition_logs`

状态迁移追加日志：

- `from_state_id` 可空（首次进入）；
- `to_state_id` 可以是具体状态或 `completed`；
- `trigger` 与配置中的 transition `on` 一致；
- `guard_result` 记录确定性守卫结果；
- `idempotency_key` 在用户范围内唯一；
- `message_id` 可关联引起迁移的已确认消息；
- `payload` 只保存必要的结构值，不复制全部对话。

恢复时以 `event_instances.current_state_id` 为当前权威状态，以 transition logs 做审计，不反向重放模型文本来推算状态。

### 6.4 `event_outcomes`

每个已完成实例至多一行：

- `outcome_id` 必须存在于实例快照的 `outcomes`；
- `world_state_writes` 必须是配置中该结果声明的键值子集；
- `effect_summary` 为用户可见结果摘要；
- `committed_at` 写入成功时间；
- `event_instance_id` 唯一，阻止重复结算。

### 6.5 `user_world_state`

按 `user_id + pet_id + state_key` 保存当前世界状态，例如：

| 键 | 合法值来源 |
|---|---|
| `first_restored_object` | `lamp` / `plant` / `small_bell` |
| `first_day_status` | `completed` |
| `letter_response` | `reply_now` / `observe_first` |
| `room_added_object` | `low_chair` / `narrow_shelf` / `small_kettle` |
| `room_added_object_location` | `window` / `door` |
| `last_communication_result` | `confirmed_first_try` / `repaired` / `neutral_example` |
| `first_outing_status` | `completed_now` / `waiting_condition` / `postponed` |
| `last_today_story_result` | `story_shared` / `quick_story_shared` / `room_detail_shared` / `closed_without_sharing` |

值使用 `jsonb`，但写入服务必须从 event outcome 配置白名单验证。其中 `room_added_object_location` 不取硬编码默认值，而由 outcome 通过受白名单约束的槽位 `room_placement` 引用用户在 `ro04_place` 实际确认的 `window | door`；未确认不写入，完成时按白名单校验后幂等写一次。删除个人记忆不会自动撤销世界状态；删除整个账号时一起删除。

### 6.6 `idempotency_records`

用于所有关键写请求，而不只事件：

- `scope`：如 `event_transition`、`memory_decision`、`journal_create`；
- `idempotency_key`：客户端或服务端生成；
- `request_hash`：同一键请求内容不同则拒绝；
- `status = processing | completed | failed`；
- `response_code` / `response_body`：有限大小的确定性响应；
- `expires_at`：清理时间。

唯一约束：`user_id + scope + idempotency_key`。

## 7. 三类长期记忆

### 7.1 `memories`

三类记忆统一主表，使用 `kind` 区分：

| 类型 | 示例 | 专用字段 |
|---|---|---|
| `life` | 用户确认的近期计划、兴趣或经历 | `valid_from`、`valid_until`、语义标签 |
| `language` | 用户愿意再次使用的表达 | `expression`、`natural_expression`、掌握状态 |
| `relationship` | 与 Morrow 共同完成的事件 | `event_instance_id`、共享引用标签 |

共同字段：

- `status = proposed | confirmed | paused | rejected | deleted | expired`；
- `content`：用户可见且可编辑；
- `confidence = high | medium | low`；
- `requires_user_confirmation` 首版固定为 `true`；
- `confirmed_at`：只有用户保存后填写；
- `paused_at` / `deleted_at` / `expires_at`；
- `source_event_instance_id`、`source_conversation_id`；
- `version`：每次编辑递增；
- `sensitivity = normal | restricted`；首版 `restricted` 不进入长期记忆，只用于拒绝原因记录时也不保存敏感正文。

进入 `ACTIVE_MEMORIES` 的必要条件：

```text
status = confirmed
AND deleted_at IS NULL
AND paused_at IS NULL
AND (expires_at IS NULL OR expires_at > now())
AND user_settings.memory_enabled = true
AND 当前事件语义相关
```

### 7.2 `memory_sources`

记忆与来源消息是多对多关系：

- 只关联用户确认后的消息；
- 最多保留必要来源，产品输出契约建议不超过 5 条；
- 消息删除后，关联行级联删除；记忆是否保留由删除事务决定，不能成为无来源但继续活跃的事实。

### 7.3 `memory_revisions`

每次用户操作追加一行：

- `action = propose | confirm | edit | pause | resume | reject | delete | expire`；
- `previous_content` / `new_content`；
- `previous_status` / `new_status`；
- `actor = user | system`；
- `reason_code`；
- 不保存模型内部推理。

当前态以 `memories` 为准，revision 只用于用户可解释操作与排错。

### 7.4 新增、更新、合并、过期规则

**新增**

- 模型输出 `memory_proposals` 后先写 `proposed`；
- 用户明确 `Save` 后转 `confirmed`；
- `Don’t save` 转 `rejected` 或立即清理提案正文；
- 未处理提案 24 小时后过期并清理正文。

**更新**

- 用户编辑产生 revision，`version += 1`；
- 被纠正的旧内容不能继续进入检索；
- 生活事实发生变化时更新原记忆，不并存两个互相矛盾的 active 事实。

**合并**

- 仅当同一用户、同一 kind、语义对象相同且内容不冲突时，由服务端建议合并；
- 合并后的正文必须重新让用户确认；
- 原记忆状态改为 `deleted`，并在 revision 中记录 `merged_into_memory_id`；
- 语言表达不同语气或适用场景时不强行合并。

**过期**

- 临时生活计划可以设置 `expires_at`；
- 语言和关系记忆默认不过期，但可由用户删除或暂停；
- 到期任务把状态改为 `expired`，检索立即排除。

## 8. 共同记忆册与英语反馈

### 8.1 `journal_entries`

一篇共同记忆绑定用户、宠物和事件实例：

- 标题；
- `what_happened`；
- `what_user_said`；
- `natural_expression`；
- `what_morrow_remembers`；
- `world_change`；
- 用户编辑后的 `user_edited_content`；
- `visibility = visible | hidden | deleted`；
- `event_instance_id` 唯一，避免重复生成。

日记可以描述本次已发生的事件事实，即使用户拒绝保存个人长期记忆；但不得在“保存的记忆”栏目显示未确认内容。用户删除日记不会自动删除长期记忆，界面必须分别说明；账号注销时一起彻底删除。

### 8.2 `journal_memory_links`

记录一篇日记实际展示了哪些已确认记忆。记忆删除后级联删除链接，日记渲染时不再显示该条“保存的记忆”。

### 8.3 `language_feedback`

一条记录对应一次事件或会话结束反馈：

- `result = successful | more_natural | affects_understanding`：不使用百分制；
- `focus_items`：1—3 个集中反馈点，保留中英标题与说明；
- `success_expression`：可空；
- `original_expression`：可空；
- `natural_expression`：可空；
- `pronunciation_note`：仅确实影响理解时填写；
- `source_message_id`：反馈所依据的确认消息；
- `user_saved_as_memory`：用户是否选择形成语言记忆；
- 每个事件实例最多一条主反馈记录。

禁止百分制、排名和为了填满栏目而制造错误。

## 9. 自然复现

### 9.1 `resurfacing_tasks`

只为 `confirmed` 的语言记忆建立任务：

| 字段 | 作用 |
|---|---|
| `memory_id` | 必须指向 language memory |
| `target_event_key` | 配置声明的目标事件 |
| `semantic_contexts` | 适用语义标签 |
| `status` | `pending` / `eligible` / `served` / `mastered` / `snoozed` / `cancelled` |
| `min_event_gap` | 最小事件间隔 |
| `cooldown_until` | 时间冷却 |
| `serve_count` / `success_count` | 控制频率，不作为公开分数 |
| `last_served_at` / `next_eligible_at` | 调度时间 |

记忆暂停、删除或过期时，关联任务立即改为 `cancelled`；恢复记忆时新建任务或显式恢复，不能沿用删除前任务。

### 9.2 `resurfacing_attempts`

记录一次自然出现：

- 目标事件实例；
- 使用方式 `optional_prompt | natural_modeling`；
- 用户结果 `used | paraphrased | ignored | declined | not_applicable`；
- 不采用不算失败，不触发惩罚；
- 同一事件实例与任务最多一次。

## 10. 用户设置、授权与删除

### 10.1 `privacy_consents`

采用追加式授权记录：

- `consent_type = terms | privacy | memory_storage | voice_processing | analytics`；
- `document_version`；
- `decision = granted | denied | withdrawn`；
- `decided_at`；
- `source = onboarding | settings | memory_review`；
- 不以一列布尔值覆盖历史。

实际是否可用由每种 consent 的最新决定计算。首版默认不把用户内容用于模型训练，因此不设置默认训练同意项。

### 10.2 `account_deletion_requests`

注销流程状态：

- `requested` → `cooling_off` → `processing` → `completed`；
- 用户撤销时为 `cancelled`；
- `scheduled_purge_at` 控制彻底删除；
- `completed_at` 仅在主库、对象存储和派生索引都完成清理后填写；
- 失败保存错误码，不保存被删除正文。

### 10.3 软删除与彻底删除

**软删除立即效果**

1. 用户状态改为 `deletion_pending`；
2. 撤销所有会话和访客令牌；
3. 停止新的模型、ASR、TTS 和复现任务；
4. 所有记忆立即从检索过滤；
5. 记录 `purge_after`。

**彻底删除顺序**

1. 删除对象存储中的临时语音和用户资源；
2. 删除派生索引、缓存与向量；
3. 在单个数据库事务内删除用户根记录；
4. 外键 `ON DELETE CASCADE` 清除身份、对话、消息、事件、记忆、日记、反馈、复现和授权；
5. 将注销请求写入不含个人标识和正文的运营审计汇总，或直接删除；
6. 完成后不能仅凭旧日志恢复用户内容。

业务日志只记录内部请求 ID、错误码、耗时和成本，不记录完整对话、邮箱、手机号、令牌或原始音频地址。

## 11. 事务与并发规则

### 11.1 推进一次事件

一个数据库事务内：

1. 锁定 `event_instances` 当前行；
2. 查 `idempotency_records`；已完成则返回旧结果；
3. 校验请求中的 `expected_state_id` 等于数据库当前状态；
4. 用实例快照校验 transition、guard 和 outcome；
5. 写已确认消息；
6. 追加 transition log；
7. 更新 `current_state_id` / `status`；
8. 若完成，唯一写入 outcome 和声明的 world state；
9. 创建 `proposed` 记忆、反馈和日记；
10. 标记幂等记录完成并提交。

任一步失败整笔回滚；外部模型调用在事务外完成，只有通过输出 Schema 校验后才进入事务。

### 11.2 审核一条记忆

- 请求携带 memory `version`；
- 使用乐观锁：`WHERE id = ? AND version = ?`；
- 成功时更新当前态并追加 revision；
- 版本不一致返回冲突和最新内容，不能覆盖用户在另一端的修改；
- 删除/暂停后同一事务取消未完成复现任务。

### 11.3 查询当前上下文

服务端按以下顺序组装：

1. 当前配置版本与事件实例快照；
2. 当前事件状态和确定性世界状态；
3. `confirmed` 且相关、未暂停、未删除、未过期的记忆；
4. 最近必要消息；
5. 用户本轮确认输入。

查询必须显式带 `user_id`，禁止只按 memory/message ID 查跨用户数据。

## 12. 索引与约束

首版关键索引：

- `user_identities(provider, provider_subject)` 唯一；
- `guest_sessions(token_hash)` 唯一；
- `pets(user_id)` 唯一；
- `messages(conversation_id, client_message_id)` 唯一；
- `event_definitions(event_key, version)` 唯一；
- 每个用户只有一个 `active/paused` 事件实例的部分唯一索引；
- `event_transition_logs(user_id, idempotency_key)` 唯一；
- `event_outcomes(event_instance_id)` 唯一；
- `user_world_state(user_id, pet_id, state_key)` 唯一；
- `idempotency_records(user_id, scope, idempotency_key)` 唯一；
- 记忆检索索引 `(user_id, kind, status, deleted_at, expires_at)`；
- `journal_entries(event_instance_id)` 唯一；
- `language_feedback(event_instance_id)` 部分唯一；
- `resurfacing_attempts(task_id, event_instance_id)` 唯一。

正文搜索和语义向量不在初始 migration 中建立。1.6 验证真实记忆检索方案后再决定 PostgreSQL `pgvector` 或外部向量服务，避免提前锁定。

## 13. 迁移与版本策略

### 13.1 文件规则

```text
packages/database/
├─ src/schema.ts
├─ src/index.ts
├─ drizzle.config.ts
└─ migrations/
   └─ 0000_initial.sql
```

- migration 只向前追加，不修改已经应用的文件；
- 文件名使用四位序号和简短描述；
- Schema 代码和 SQL migration 在同一提交中变化；
- 正式环境先备份，再 migrate，再做只读校验；
- 破坏性变更采用 expand → backfill → switch → contract，不在一次发布中直接删列；
- 事件配置版本与数据库 migration 版本独立记录。

### 13.2 配置同步

发布 `events-v1.0.0` 时：

1. 用 `eventRulesetSchema` 校验配置；
2. 规范化 JSON 并计算 `config_hash`；
3. 插入缺失的 `event_definitions`；
4. 若相同 `event_key + version` 已存在但 hash 不同，部署失败；
5. 新实例只使用 active 版本；
6. 旧实例继续使用自己的 `definition_snapshot`；
7. retired 定义不再创建新实例，但不影响恢复旧实例。

### 13.3 回滚

- 代码回滚不删除已经写入的新列；
- 事件配置回滚通过把旧 definition 重新标记 active；
- 已启动实例继续使用快照，不在进行中切版本；
- migration 执行失败时恢复数据库备份或使用已审核的逆向迁移，不自动 `drop` 用户数据。

## 14. 与现有事件配置的一致性

> 以下为 events-v1.0.0 历史事件，新主链路见固定内容契约（`birth_*` / `b1_` / `b2_`）。

首批事件必须使用以下 ID：

| 事件 | 初始状态 | 结果 ID |
|---|---|---|
| `morrow_letter_v1` | `lt01_open` | `reply_now` / `observe_first` |
| `room_object_v1` | `ro01_open` | `chair_added` / `shelf_added` / `kettle_added` |
| `literal_misunderstanding_v1` | `mm01_open` | `meaning_confirmed_first_try` / `meaning_repaired` / `neutral_example_completed` |
| `first_outing_v1` | `ou01_open` | `went_to_mailbox` / `waited_for_quiet` / `postponed_without_penalty` |
| `today_story_v1` | `td01_open` | `story_shared` / `quick_story_shared` / `room_detail_shared` / `closed_without_sharing` |

数据库允许字符串承载未来版本的新 ID，但服务端写入前必须用实例快照进行精确校验，不能把数据库“能存字符串”误解成业务允许任意值。

## 15. 验收场景

### A. 保存并恢复完整对话

- 创建用户、Morrow、conversation、messages 和 event instance；
- 中途暂停后读取 `current_state_id` 和最近 accepted messages；
- 恢复到相同配置快照和状态，不重复回复或推进。

### B. 保存三类记忆

- 三条模型提案均以 `proposed` 创建；
- 用户分别保存、编辑后保存、拒绝；
- 只有前两条进入确认状态，拒绝项不可检索；
- 每次操作都有 revision。

### C. 查询当前事件相关旧表达

- 只从 confirmed language memories 中选择；
- 匹配 `target_event_key`、semantic context、event gap 和 cooldown；
- paused/deleted/expired memory 对应任务不可服务。

### D. 删除后不再调用

- 删除 memory 与取消 resurfacing task 在同一事务；
- 上下文查询过滤 deleted_at 和 status；
- 日记链接被移除；
- 下一轮请求即使缓存未刷新也通过数据库状态二次校验。

### E. 事件中断恢复

- 网络失败前没有成功事务：状态不变；
- 事务成功但客户端未收到响应：同一 idempotency key 返回旧响应；
- 页面刷新：读取 `current_state_id`；
- 完成结果唯一，不能重复写 world state、journal 或 memory proposals。

## 16. 首版明确不做

- 不把原始录音作为长期数据对象；
- 不保存模型思维过程；
- 不为推荐系统建立用户画像宽表；
- 不保存未经确认的敏感推断；
- 不把事件配置做成可由用户或模型直接编辑的数据库内容；
- 不提前引入向量数据库、数据仓库、排行榜和付费表；
- 不因用户未登录而建立另一套业务数据结构。

## 迁移到固定内容方案（3.5.3）

> 本节仅为摘要，完整迁移设计见同目录 [`DATA_MODEL_MIGRATION.md`](./DATA_MODEL_MIGRATION.md)。

阶段 3.5.3 把现有“LLM 适配器 + 事件配置”骨架迁移为“版本化固定内容 + 确定性意图匹配 + 白名单状态迁移”。本次迁移**只向前追加**，不重写本节及以上既有内容：

- 现有 23 张表中 19 张保留不动，4 张仅追加可空列：`user_settings.llm_assist_enabled`（默认 false）、`event_definitions`/`event_instances` 各加 `chapter_id` 与 `event_type`、`memories` 加 `memory_rule_id` 与 `proposal_source`；
- 拟新增 5 张表：规则集登记 `fixed_rulesets`、学习内容与译文版本 `learning_contents`、预制音频绑定 `audio_bindings`（单一正常语速音频，planned/ready/retired）、章节成长进度 `user_chapter_progress`、意图解析留痕 `intent_resolution_records`（只存 `rulesetVersion+eventVersion+stateId+inputHash+resolvedIntentId` 哈希，不存原始录音）；
- 记忆确认状态机整体沿用现有 `memories.status`（`proposed→confirmed/paused/rejected/deleted/expired`）与既有 `requires_user_confirmation=true` 约束，仅补充白名单来源字段；
- 世界状态继续由 `user_world_state` key-value 承载，章节门控另立专用表；未确认 ASR 不入库、原始录音不落库只存临时文件标识、敏感记忆 restricted、账号删除级联均沿用 PRIVACY_DESIGN 约束。

迁移分 5 步执行：规则集与版本字段 → 学习内容/译文/音频绑定 → 成长与世界状态落库 → 事件实例迁移与意图留痕 → 开关与隐私收尾，每步可独立验证。
