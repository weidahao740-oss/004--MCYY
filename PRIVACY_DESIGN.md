# PRIVACY_DESIGN — Morrow（墨洛）隐私设计

> 版本：1.0.0-draft
> 状态：执行计划 1.7 交付物；面向开发者与产品
> 事实依据：`DATA_MODEL.md` v1.0.0（23 张表）、`TECH_STACK.md` v1.0、`PET_PERSONA.md` v1.0、`PET_SYSTEM_PROMPT.md` v1.0
> 配套用户文本：`PRIVACY_POLICY_DRAFT.md`
> 原则：**本文每一条声明都必须能回溯到 DATA_MODEL.md 的表、字段或规则。** 凡 DATA_MODEL.md 未覆盖的隐私场景，均在第 10 节映射表中标注「待数据模型补充」，不自行编造表结构。

---

## 1. 数据收集范围与最小化原则

### 1.1 保存哪些对话文本

- **`messages.content_text` 仅在用户确认后保存。** 语音输入的流程是：ASR 转写 → 把转写文本交用户确认/修改 → 用户确认后才以 `content_text` 写入 `messages`（DATA_MODEL §5.2：「用户确认后才保存的文本；未确认 ASR 不写这里」）。
- **未确认的 ASR 转写不写入数据库。** `messages.input_mode` 记录输入来源（`text` / `voice` / `reference_reply` / `choice` / `system`），`asr_confidence` 只保存置信数值，不保存原始音频（§5.2）。
- **`messages.model_output_json` 仅保存通过 Schema 校验后的结构化结果。** 外部模型调用在数据库事务之外完成，只有通过输出 Schema 校验后才进入事务落库（§11.1）；模型思维过程（chain-of-thought）不保存（§16、PET_SYSTEM_PROMPT §OUTPUT）。

### 1.2 明确不保存什么

- **原始录音不作为长期数据对象**（§16 首版明确不做；`asr_confidence` 仅数值，§5.2）。详见第 2 节。
- **不保存模型思维过程**（§16；`memory_revisions` 明确「不保存模型内部推理」，§7.3）。
- **不保存未经确认的敏感推断**（§16）。
- **不为推荐系统建立用户画像宽表**（§16）。
- `conversations.summary` 只保存必要的服务端摘要，不用来替代用户确认（§5.1）；`event_transition_logs.payload` 只保存必要结构值，不复制全部对话（§6.3）。

### 1.3 身份数据最小化

- **`users` 表不存邮箱、手机号、微信 ID**；删除用户时也不把这些外部标识复制进 `users`（§4.1）。`users` 只保留：内部 UUID、`account_kind`、`status`、`locale`、`time_zone`、时间戳、`deleted_at`、`purge_after`。
- **外部认证身份与业务用户分离**：邮箱/手机号/微信/Apple 主体标识存于 `user_identities`（§4.2），与业务 `user_id` 通过外键关联；`provider_subject` 不保存明文密码。
- **`guest_sessions` 只存随机令牌哈希 `token_hash`，不存原始令牌**（§4.3）；一个访客用户可有轮换记录，同一时刻仅未撤销、未过期令牌有效。
- 跨用户查询禁止：上下文查询必须显式带 `user_id`，禁止只按 memory/message ID 查跨用户数据（§11.3）。

---

## 2. 原始录音策略

### 2.1 首版默认立场

首版**默认不长期保存原始录音**（§16「不把原始录音作为长期数据对象」；TECH_STACK §8「首版默认不长期保存原始录音」）。

### 2.2 ASR 流程

```text
客户端录音
  → 上传服务端临时存储（CloudBase Storage 临时桶）
  → 服务端调用 ASR 供应商（密钥仅服务端持有，TECH_STACK §6/§12）
  → 返回转写文本与置信度
  → 用户确认 / 修改转写文本
  → 仅把确认后的文本写入 messages.content_text
  → 删除临时录音文件
```

`messages.asr_confidence` 只落数值（§5.2）；低置信度时由模型向用户请求确认（PET_SYSTEM_PROMPT §7）。

### 2.3 临时录音生命周期（设计参数）

| 项目 | 设计值 | 依据 |
|---|---|---|
| 存储位置 | CloudBase Storage **临时桶**，与长期资源桶隔离 | TECH_STACK §1/§8「对象存储只保存确有必要的音频和资源」 |
| 最大保留时长 | **24 小时或更短**，由服务端定时任务清理孤儿临时文件 | 运营设计参数；DATA_MODEL §10.3 硬删除第 1 步「删除对象存储中的临时语音」 |
| 删除触发条件 | ① ASR 完成且用户已确认文本；② 用户取消本次转写；③ 超时未处理（≤24h） | TECH_STACK §8「ASR 完成后优先删除临时录音」 |
| 临时文件元数据 | 见第 10 节「待数据模型补充」——DATA_MODEL 未建临时录音注册表 | — |

> 说明：24 小时是本设计采纳的默认上限；DATA_MODEL.md 未定义临时录音元数据表，因此清理任务的记账方式（如对象存储生命周期规则 vs. 临时文件注册表）**待数据模型补充**。无论采用哪种方式，业务承诺不变：临时录音不进入长期数据对象、不进入业务日志。

### 2.4 例外：未来需要保存原始录音

若未来为支持用户主动反馈问题、发音复核等场景需要保留原始录音：
- 必须**单独授权**，在 `privacy_consents` 追加 `voice_processing` 类决定（§10.1 采用追加式授权，`decision = granted/denied/withdrawn`，并记录 `document_version` 与 `source`）；
- 未经授权不启用；授权撤回后按既有删除流程处理已存文件。

---

## 3. 模型训练使用政策

- **首版默认不将用户内容（对话文本、语音转写、记忆、日记）用于模型训练。**
- **不在 `privacy_consents` 中设置默认训练同意项**（§10.1 明确：「首版默认不把用户内容用于模型训练，因此不设置默认训练同意项」）。当前 `consent_type` 枚举为 `terms | privacy | memory_storage | voice_processing | analytics`，不含训练同意类型。
- **外部 AI 供应商选择**：优先选择数据不用于训练、或可通过合同/开关 opt-out 的 LLM/ASR/TTS 供应商（与执行计划 1.6 的供应商评估联动；具体供应商与数据政策链接见隐私政策附录，待 1.6 确认后填入）。
- **政策变更**：如未来改变训练使用政策，属于对既有承诺的变更，必须通过 `privacy_consents` 重新获取用户授权（追加新决定并记录新 `document_version`），旧授权不因政策变更自动延续。

---

## 4. 长期记忆的用户控制

### 4.1 数据基础

三类记忆（`life` / `language` / `relationship`）统一存于 `memories` 表，`kind` 区分（§7.1）。状态机：

```text
proposed ──Save──► confirmed
   │                  │
   ├─Don't save────► rejected（或立即清理提案正文）
   │                  ├─► paused（暂停，不删除，检索排除）
   │                  ├─► deleted（删除，级联取消复现任务）
   └─24h未处理────► expired（清理正文）
```

### 4.2 用户控制能力

| 能力 | 实现 | 依据 |
|---|---|---|
| 查看 | 记忆管理页面展示所有 `confirmed` 记忆正文（`content` 用户可见可编辑） | §7.1、§11.3（上下文只组装 confirmed 且相关、未暂停、未删除、未过期记忆） |
| 修改 | 用户编辑产生 `memory_revisions` 记录，`version += 1`；旧内容不再进入检索；用乐观锁 `WHERE id=? AND version=?` 防并发覆盖 | §7.4 更新规则、§7.3、§11.2 |
| 删除 | 用户删除后**同一事务**取消 `resurfacing_tasks`；上下文查询过滤 `deleted_at`；`journal_memory_links` 级联删除；下一轮请求即使缓存未刷新也通过数据库状态二次校验 | §11.2、§9.1、§8.2、§15.D |
| 暂停 | `paused` 记忆不删除但检索层排除；`user_settings.memory_enabled` 为全局开关，关闭后已有记忆不删除但检索层排除所有个人记忆直到恢复 | §7.1、§4.5、§9.1 |
| 确认机制 | `requires_user_confirmation` 首版固定为 `true`；模型只输出 `memory_proposals`（proposed），用户明确 Save 后才 `confirmed`；Don't save 转 rejected 或清理正文 | §7.1、§7.4、PET_SYSTEM_PROMPT §4 Schema（`requires_user_confirmation: z.literal(true)`） |
| 提案过期 | 未处理提案 24 小时后状态改 `expired` 并清理正文，检索立即排除 | §7.4、§9.1 |

> 记忆与来源消息的多对多关系 `memory_sources` **只关联用户确认后的消息**；消息删除后关联行级联删除，且记忆不能成为「无来源但继续活跃的事实」（§7.2）。

---

## 5. 账号注销与数据删除

### 5.1 软删除（立即效果）

用户发起注销后，立即执行（§10.3）：
1. `users.status` → `deletion_pending`；
2. 撤销所有会话和访客令牌；
3. 停止新的模型、ASR、TTS 和复现任务；
4. 所有记忆立即从检索过滤；
5. 记录 `purge_after`。

### 5.2 冷静期

`account_deletion_requests` 支持撤销：用户在冷静期内可取消注销，状态流转为 `requested → cooling_off → cancelled`（§10.2）。冷静期时长由 `scheduled_purge_at` 控制，具体天数属运营配置参数，DATA_MODEL 未写死天数（**待数据模型补充/产品配置**）。

### 5.3 彻底删除顺序

按 `scheduled_purge_at` 到期后执行（§10.3）：
1. 删除对象存储中的临时语音和用户资源；
2. 删除派生索引、缓存与向量；
3. 在**单个数据库事务内**删除 `users` 根记录；
4. 外键 `ON DELETE CASCADE` 清除身份、对话、消息、事件、记忆、日记、反馈、复现和授权；
5. 注销请求写入**不含个人标识和正文**的运营审计汇总，或直接删除；
6. 完成后不能仅凭旧日志恢复用户内容。

### 5.4 状态机与失败处理

- `account_deletion_requests`：`requested → cooling_off → processing → completed`；撤销为 `cancelled`；`completed_at` 仅在主库、对象存储和派生索引全部清理完成后填写（§10.2）。
- 失败时**保存错误码，不保存被删除正文**（§10.2）。

---

## 6. 敏感信息识别与存储限制

### 6.1 字段级控制

`memories.sensitivity` 取值 `normal | restricted`（§7.1）：
- **首版 `restricted` 不进入长期记忆。**
- 拒绝原因记录时**也不保存敏感正文**（§7.1：「只用于拒绝原因记录时也不保存敏感正文」）。

### 6.2 敏感信息类型

产品层面界定的敏感类型（与 PET_PERSONA §10、PET_SYSTEM_PROMPT §MEMORY 一致）：
- 身份证件号、银行卡号/精确财务信息、精确住址、电话号码；
- 医疗信息、心理/精神状态推断；
- 性取向、宗教、政治立场等敏感推断；
- 账号密码、凭证；
- 他人隐私。

> 说明：DATA_MODEL 只提供 `sensitivity` 二值字段与「restricted 不入库」规则；**上述类型清单由产品定义，字段枚举值本身待数据模型补充**（当前为 `normal/restricted` 二值，不区分敏感类型）。

### 6.3 识别策略

- 模型输出记忆提案时标注 `sensitivity`（服务端 Schema 校验，PET_SYSTEM_PROMPT §8.3/§MEMORY 明确不提议长期保存密码、凭证、精确财务、精确住址、证件数据、原始音频或推断敏感特质）；
- 服务端对 `restricted` 提案**自动拒绝且不保存正文**；
- 用户可在设置中查看被拒绝记忆的**类型统计**（不查看内容）——该统计页所需的「拒绝原因码计数」由 `memory_revisions.reason_code` 支撑（§7.3），具体统计接口属实现层。

### 6.4 日志脱敏

- 业务日志只记录**内部请求 ID、错误码、耗时和成本**，不记录完整对话、邮箱、手机号、令牌或原始音频地址（§10.3 末尾；TECH_STACK §1 Pino「禁止记录不必要的对话原文」、§8）。
- **`messages.content_text` 不被日志系统默认复制**（§5.2 唯一约束段明确「日志系统不得默认复制 content_text」）。

---

## 7. AI 身份披露

- 产品明确：**Morrow 是 AI，不是真人，不是心理医生，不是用户唯一的朋友**（PET_PERSONA §1/§11；PET_SYSTEM_PROMPT §IDENTITY：「You are an AI character, not a human … teacher, therapist, doctor, lawyer, financial adviser, emergency service, or romantic partner」）。
- **披露位置**：首次启动/注册流程、设置页面、用户协议、隐私政策。
- **角色系统提示词**内置边界：不自称有真实身体、真实经历或真实情感；不说用户是自己唯一的朋友；不诱导依赖、恋爱承诺或排他关系；不诊断疾病（PET_PERSONA §11、PET_SYSTEM_PROMPT §RELATIONSHIP/§BOUNDARIES）。
- 角色设定范围内的虚构人格表达（小岛世界、性格）允许，但必须保持用户始终知道这是 AI；Morrow 不承诺绝对保密，只说明产品实际的数据控制方式（PET_PERSONA §11）。
- 紧急安全场景（自伤/他伤/医疗急症）下停止角色扮演，使用清楚直接的安全回应并提示联系紧急服务（PET_SYSTEM_PROMPT §SAFETY_OVERRIDE）。

---

## 8. 数据跨境与第三方共享

### 8.1 第三方处理类别（与 1.6 供应商评估联动）

首版外部依赖按 TECH_STACK §1/§3/§12：

| 类别 | 处理内容 | 密钥位置 |
|---|---|---|
| LLM 提供商 | 用户确认后的对话文本、记忆与事件上下文，用于生成 Morrow 回复与记忆提案 | 仅服务端（`LLM_API_KEY`） |
| ASR 提供商 | 客户端上传的临时语音，转写为文本后即删 | 仅服务端（`ASR_API_KEY`） |
| TTS 提供商 | 待合成的回复文本，合成宠物语音 | 仅服务端（`TTS_API_KEY`） |
| 云基础设施（CloudBase / 腾讯云） | PostgreSQL、对象存储（临时语音桶）、云托管、认证 | 环境变量注入（`CLOUDBASE_*`） |

- **若 LLM/ASR/TTS 使用境外服务**（如境外 OpenAI 类服务），用户对话文本与语音会传输到境外服务器处理——必须在隐私政策中明确披露（TECH_STACK §12 以 `LLM_API_BASE_URL` 等环境变量形式支持可配置端点）。
- **不向其他第三方出售或共享用户个人数据。**
- 具体供应商名称、数据政策链接、是否留存/是否用于训练，待 1.6 评估完成后填入隐私政策附录；当前先按类别披露。

### 8.2 数据存储地点

- 业务数据库与对象存储在 CloudBase（腾讯云）；默认区域待部署环境确定（**待 1.6/部署环境确认**）。
- 跨境传输仅发生在调用境外 AI/语音 API 时；传输链路为服务端到供应商的 HTTPS/TLS。

---

## 9. 儿童与成人定位

- 产品定位为**成人英语学习**，不面向 13 岁以下儿童（PET_PERSONA §1「English-learning product for adults」）。
- 注册时需确认年龄；若发现 13 岁以下儿童使用，按适用法规处理（删除数据/停止服务）。
- **待数据模型补充**：`users` 表无年龄字段，`privacy_consents` 的 `consent_type` 枚举当前为 `terms | privacy | memory_storage | voice_processing | analytics`，无年龄/儿童确认同意类型——注册年龄确认流程所需的字段与同意记录方式待数据模型补充。

---

## 10. 与 DATA_MODEL.md 的映射表

> 表中「依据」列给出 DATA_MODEL.md 的章节/表/字段；标记「待数据模型补充」的项表示该隐私承诺当前无表结构支撑，需后续数据模型迭代补齐，不得在代码中擅自新增未登记的表。

| # | 隐私设计声明 | 依据（DATA_MODEL / 其他权威文件） | 备注 |
|---|---|---|---|
| 1 | `messages.content_text` 仅用户确认后保存 | §5.2 `content_text` 规则 | — |
| 2 | 未确认 ASR 转写不写入消息表 | §5.2 | — |
| 3 | `model_output_json` 仅存 Schema 校验后的结构化结果 | §5.2、§11.1 | — |
| 4 | 不保存原始录音为长期数据 | §16、§5.2（`asr_confidence` 仅数值）、TECH_STACK §8 | — |
| 5 | 不保存模型思维过程 | §16、§7.3（revisions 不存推理）、PET_SYSTEM_PROMPT §OUTPUT | — |
| 6 | 不保存未经确认的敏感推断 | §16 | — |
| 7 | `users` 不存邮箱/手机号/微信 ID | §4.1 | — |
| 8 | 外部身份与业务用户分离 | §4.2 `user_identities` | — |
| 9 | 访客只存 token_hash | §4.3 `guest_sessions` | — |
| 10 | 日志/摘要不复制完整对话 | §5.1 `conversations.summary`、§6.3 `payload` | — |
| 11 | 跨用户查询必须带 user_id | §11.3 | — |
| 12 | 首版默认不长期保存原始录音 | §16、TECH_STACK §8 | — |
| 13 | ASR 完成+用户确认后删临时录音 | TECH_STACK §8 | 流程见 §2.2 |
| 14 | 临时录音最大保留 ≤24h，存临时桶 | §10.3 硬删除第 1 步；TECH_STACK §1/§8 | **临时文件注册表/清理定时器待数据模型补充**；24h 为设计参数 |
| 15 | 例外保存录音需单独授权 | §10.1 `voice_processing` consent | — |
| 16 | 首版不将用户内容用于模型训练 | §10.1 | — |
| 17 | 不设默认训练同意项 | §10.1 | — |
| 18 | 供应商优先 opt-out / 不用于训练 | 与 1.6 评估联动；TECH_STACK §12 | 无表结构，属采购/合同决策 |
| 19 | 训练政策变更需重新授权 | §10.1（追加式、document_version） | — |
| 20 | 三类记忆统一 memories，状态机六态 | §7.1 `status` | — |
| 21 | 用户可查看 confirmed 记忆 | §7.1、§11.3 | — |
| 22 | 编辑产生 revision、version 递增、旧内容不再检索 | §7.3、§7.4、§11.2 | — |
| 23 | 删除记忆同事务取消复现任务、过滤 deleted_at、级联删链接 | §11.2、§9.1、§8.2、§15.D | — |
| 24 | 暂停记忆检索排除；全局 memory_enabled 开关 | §4.5、§7.1、§9.1 | — |
| 25 | 记忆必须用户明确 Save 后才 confirmed | §7.1、§7.4、PET_SYSTEM_PROMPT §4 | — |
| 26 | 未处理提案 24h 过期并清理正文 | §7.4 | — |
| 27 | memory_sources 只关联已确认消息 | §7.2 | — |
| 28 | 注销软删除立即五项效果 | §10.3 | — |
| 29 | 冷静期可撤销注销 | §10.2（cancelled） | 冷静期天数为运营配置参数 |
| 30 | 彻底删除六步顺序 | §10.3 | — |
| 31 | 删除请求状态机与失败只存错误码 | §10.2 | — |
| 32 | memories.sensitivity = normal/restricted，restricted 不入库不存正文 | §7.1 | — |
| 33 | 敏感类型清单（证件/银行卡/住址/电话/医疗/财务/他人隐私） | PET_PERSONA §10、PET_SYSTEM_PROMPT §MEMORY | **类型枚举细分待数据模型补充**（当前二值） |
| 34 | 服务端自动拒绝 restricted 提案且不留正文 | §7.1、PET_SYSTEM_PROMPT §8.3 | — |
| 35 | 日志只存请求 ID/错误码/耗时/成本 | §10.3、TECH_STACK §1/§8 | — |
| 36 | `content_text` 不被日志默认复制 | §5.2 | — |
| 37 | 披露 Morrow 是 AI、非真人/非心理医生/非唯一朋友 | PET_PERSONA §1/§11、PET_SYSTEM_PROMPT §IDENTITY | 披露位置属产品流程 |
| 38 | 系统提示词含不得自称真人的边界 | PET_SYSTEM_PROMPT §IDENTITY/§RELATIONSHIP/§BOUNDARIES | — |
| 39 | 境外 AI/语音传输需披露 | TECH_STACK §12（可配置 API 端点） | **具体供应商与跨境披露待 1.6/部署环境确认** |
| 40 | 不向第三方出售个人数据 | 产品政策 | 无表结构，属合同/合规声明 |
| 41 | CloudBase 作为云基础设施的数据处理说明 | TECH_STACK §1/§12 | 协议细节待补充 |
| 42 | 成人定位，不面向 13 岁以下儿童 | PET_PERSONA §1 | — |
| 43 | 注册年龄确认 | — | **待数据模型补充**（users 无年龄字段、consent 无年龄类型） |
| 44 | 用户数据导出（下载副本） | — | **待数据模型补充**（无导出表/接口定义） |
| 45 | 运营日志保留期限 | §10.3 仅规定日志不含敏感内容 | **待数据模型补充**（未规定保留时长） |

### 覆盖统计

- 映射条目共 **45 条**。
- 其中「待数据模型补充」项：**5 条**（#14 临时录音注册表/清理定时器、#33 敏感类型细分枚举、#43 注册年龄确认、#44 数据导出、#45 日志保留期限）；另有 #18/#39/#41 标注「待 1.6 或部署环境确认」，属外部依赖而非数据模型缺口。
- 其余声明均能在 DATA_MODEL.md 找到直接表/字段/章节依据。
