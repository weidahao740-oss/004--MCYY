# LEARNING_DATA_MIGRATION — 阶段 3.5.4 学习系统数据迁移清单（2026-10-07 修订）

> 版本：1.1.0（纯设计稿，不改任何工程代码）
> 阶段：3.5.4（掌握状态、提示退出、间隔复现落到现有工程；**用户难度三档已取消**）
> 上游已冻结/已对齐契约：
> - `FIXED_CONTENT_CONTRACT.md` v1.0.0（`FixedEvent` 结构、确定性意图匹配、人工译文、预制音频、记忆确认白名单）
> - `DATA_MODEL.md` v1.0.0 / `DATA_MODEL_MIGRATION.md` v1.0.0（23 张表现状 + 3.5.3 已规划 5 张新表）
> - `english-pet/packages/database/src/schema.ts`（逐表逐枚举核对）
> - `API_MIGRATION.md` v1.0.0（既有 27 端点 + N1/N2/N3，本清单不动其既定结论）
> - `FIRST_DAY_FLOW.md`、`MORROW_LIFE_STORY_BIBLE.md`、`CHAPTER_01_BIRTH_CONTENT.md`、`CHAPTER_02_CHILDHOOD_CONTENT.md`
> 命名约定：表/字段蛇形英文；【拟新增】= 本次新增、尚未落地；既有字段照实引用，不重命名、不改义。
> 2026-10-07 修订：**取消用户难度三档 basic/intermediate/advanced 及其字段、端点与首次分级测试**；帮助量按逐学习对象六阶证据动态展开；第一条表达保底教学，后续按预设规则与证据分流，不调用实时大模型判断。

---

## 0. 口径说明（必读）

1. **事件数量口径**：计划口头称首两章"24 个事件"，实际内容文件为 **25 个**。本迁移**按 25 个计**：
   - 第一章 13 个：`birth_first_voice_v1`、`birth_restore_object_v1`、`b1_remember_name_v1`、`b1_first_feeling_v1`、`b1_window_light_v1`、`b1_first_letter_v1`、`b1_bell_sound_v1`、`b1_ask_about_you_v1`、`b1_what_i_like_v1`、`b1_tomorrow_plan_v1`、`b1_return_first_words_v1`、`b1_ready_for_outside_v1`、`b1_not_sure_v1`。
   - 第二章 12 个：`b2_room_tour_v1`、`b2_name_objects_v1`、`b2_colors_v1`、`b2_outside_road_v1`、`b2_today_you_v1`、`b2_my_likes_v1`、`b2_mistake_v1`、`b2_small_task_v1`、`b2_feeling_check_v1`、`b2_sound_comes_back_v1`、`b2_recall_room_v1`、`b2_ready_for_school_v1`。
2. **术语对齐（全项目唯一口径）**：
   - 掌握六阶：`encountered / recognized / prompted / independent / transferring / mastered`。
   - **不再有难度三档**：`basic / intermediate / advanced` 用户分档已取消，不建枚举、不加列、不开端点。
3. **与既有等级并存、不重命名**：现有 `user_settings.language_level` 是枚举 `languageLevelEnum('L1','L2','L3','L4')`（默认 `L2`）。本次**不改该列、不新建平行档位列**；帮助量完全由 `mastery_records.stage` 逐对象推出，不再有"难度拨盘"。
4. **增量原则**：所有学习元数据以**新增可选字段**挂到既有 `FixedEvent`；所有新表/新端点向前追加，不推翻 3.5.3 已规划的 5 张表与 N1–N3。

---

## 1. 总表：现有资产 × 是否需要改 × 改什么 × 理由

| 现有资产 | 是否需要改 | 改什么（字段/事件/表/API） | 理由 |
|---|---|---|---|
| `FixedEvent`（zod，`contracts/src/fixed-content.ts`） | **改（加可选字段）** | 新增可选 `learning?` 对象（见 §4）；不改既有 13 个字段 | 学习元数据需挂到事件上；可选字段保证旧规则集仍可被旧客户端解析，向后兼容 |
| `lines[].learningContent.contentId` | 不改 | — | 已有"学习内容 ID"概念；新 `learning.objectives[].objectKey` 与其引用关系见 §4，不重复造 |
| `user_settings.language_level`（L1–L4） | **不改列，也不加并列档位列** | 不新增 `difficulty_tier` 类字段；帮助量由 `mastery_records.stage` 逐对象推出 | 2026-10-07 取消三档后，不再有用户级"难度拨盘"需要持久化 |
| `user_settings` 表 | **不加档位列** | ~~不再新增 `difficulty_tier/tier_source/tier_updated_at`~~（已取消）；仅保留既有设置项 | 没有用户级档位，就没有"当前档/是谁设的"需要持久化 |
| `MORROW_LIFE_STORY_BIBLE` 七章进入/完成条件 | **补内容领域字段，不改 DB 表** | 每章配置新增可选 `life_domain_ids: D1…D12[]`（本章承载的成人生活领域，对齐课程大纲 §0.4）；挂在规则集章节配置，不新建 DB 列 | 内容地图前置：每章明确要练哪些成人沟通任务；原 `languageCeiling: basic\|intermediate\|advanced` 取消（章轨语言上限由课程大纲 §1 大表承载，不另设档位上限） |
| `resurfacing_tasks` / `resurfacing_attempts` | **不改，明确分工** | 间隔复现走**新表** `review_schedule`；既有两表仍只服务"已确认语言记忆的自然带回" | 既有表语义是"记忆召回"（per confirmed memory）；新需求是"学习对象掌握后的间隔复现"（per learning_object），粒度不同，避免复用导致双重排期 |
| `language_feedback` | 不改 | — | 已是"每事件最多一条成功/自然/发音反馈"；掌握证据不写这里，写 `mastery_records` |
| `intent_resolution_records`（3.5.3 拟新增） | **加列（可选）** | 【拟新增】`hint_kind`（可空，枚举）、`hint_was_used`（可空 boolean） | "提示退出"需要知道本次匹配是否用过提示、用后是否独立答对；这是匹配尝试的天然补充，不另起一表 |
| `memories`（kind=language） | 不改 | — | 间隔复现不依赖把"掌握对象"塞进记忆；记忆确认/软删除策略照旧 |
| `user_chapter_progress`（3.5.3 拟新增） | 不改结构 | `completion_checks` 里可读取 `life_domain_ids` 作为内容覆盖检查输入 | 生活领域是配置，不是进度 |
| 既有 27 端点 + N1/N2/N3 | **不改** | 学习系统从 **N4 起**新增（N4/N5/N6 难度档端点已取消，见 §5） | 遵守既定结论，不改动已冻结端点 |
| `FIRST_DAY_FLOW` 主状态机 FD00–FD07 | **不并联插入任何分级测试** | 2026-10-07 取消三档后，首日**不插**"轻量水平测试"步骤；首日核心闭环 FD00–FD07 保持原样 | 首日 §11 明确"不做完整分级测试"；既没有档位，也就不需要首测定档 |

---

## 2. 首次分级测试（2026-10-07 取消）

首日铁律：不在第一次交流前要求分级测试（`FIRST_DAY_FLOW.md` §2.1、§11）。2026-10-07 进一步决定：**彻底取消用户难度三档**，因此：

- **不再有 `FD08_PLACEMENT_OPTIONAL`**：首日 FD00–FD07 主状态机不并联任何"轻量水平测试"步骤；
- **不再写 `difficulty_tier`**：没有档位需要首测产出，也不向 `user_settings` 写回任何建议档；
- **帮助量从零证据起步**：新用户所有学习对象初始为 `encountered`，第一条表达走保底教学（§7 教学规则），之后完全由 `mastery_records` 逐对象证据驱动；
- **`GET /v1/first-day`（#15）响应不加** `placementAvailable/placementSkippable` 字段；
- 原 `assessment_results` 表不再建（见 §3.3）。

> 这与"不实时大模型判断"一致：系统不靠一次首测或运行时推断给用户定档，只认逐对象上的确定性证据。

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
| `life_domain_id` | varchar(16) | 所属成人生活领域 D1…D12（对齐课程大纲 §0.4） |
| `chapter_id` | varchar(96) | 首次出现章 |
| `source_content_id` | varchar(96) 可空 | 关联既有 `learning_contents.content_id`（3.5.3 表） |
| `target_zh` | varchar(200) | 中文教学点说明（UI/提示用） |
| `status` | enum `draft/active/retired`（沿用 `event_definition_status` 同款） | |
| `created_at` / `updated_at` | timestamptz | |

> ~~原 `tier` 字段（basic/intermediate/advanced）已取消~~：学习对象不再标"基准难度档"；其难度由 `chapter_id` 章轨上限与 `kind` 决定，帮助量由用户侧 `mastery_records.stage` 推出。

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

### 3.3 ~~`assessment_results`~~（2026-10-07 取消，不建表）

原拟建的水平测试结果表（placement/retest/self_check、recommended_tier、recommended_language_level）**不再创建**。原因：用户难度三档已取消，没有档位需要"建议/写回"；新用户所有对象从 `encountered` 起步，帮助量由 `mastery_records` 逐对象证据推出，不需要任何首测或重测结果表。既有 `user_settings.language_level`(L1–L4) 保留不动，也不再有"建议等级"写回。

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
  // 本事件所属成人生活领域 D1…D12（对齐课程大纲 §0.4）
  lifeDomainId: string
  // 本事件的真实沟通任务（一句话，中文）
  communicationTask: string
  // 本事件要练的学习对象（指向 learning_objects.object_key）
  objectives: {
    objectKey: string
    isFirstCoreExpression: boolean   // 本事件第一条核心表达=保底教学
    isNewComponent: boolean          // true=新成分，本事件要挖空练习；false=已会/刚认出，直接给出
  }[]
  // 三段式：理解练习 / 句子搭建 / 最终真实输出（通常各一段）
  eventSegments: {
    comprehension?: {                 // 一个理解练习（听音选图/指向命名等）
      interactionStructure: string
      choiceOptions?: { text: string; targetIntentId: string }[]  // 选项层：3 个候选
    }
    build?: {                         // 一个句子搭建（语块组合/预设填词）
      fillInSkeleton?: string        // 预设填词：句子骨架
      blankSlots?: { objectKey: string; isNewComponent: boolean }[]
    }
    finalOutput: {                    // 一个最终真实输出
      signalIntentIds: string[]
    }
  }
  // 本事件复现的一个旧表达（旧表达复现钩子）
  reviewEntry?: { objectKey: string; recallContextTopicId?: string }
  // 最终剧情行动：本事件结算后推进的 world state / outcome
  finalPlotAction: string
}
```

- **为什么这样挂**：`objectives` 引用稳定 `objectKey`，事件内容迭代不改 ID；`isNewComponent` 直接实现"填空只练新成分、刚认出的直接带入"；`eventSegments` 把"理解→搭建→输出"三段结构化，填空与排序不叠加由内容侧保证。
- **选项层 / 预设填词数据需求（现行口径）**：选项层 = `comprehension.choiceOptions[]`（3 个候选 + 对应 targetIntentId）；预设填词 = `build.fillInSkeleton` + `build.blankSlots[]`（每个空标 `objectKey` 与 `isNewComponent`）。这些都是**事件内容配置**，按事件版本化存 `FixedEvent.config_json`，不新建用户表、不按用户存储。
- **建议字段名与类型**（汇总，供 zod 落地）：

| 字段 | 类型 | 必填 |
|---|---|---|
| `learning` | object? | 否（可选） |
| `learning.lifeDomainId` | string | 是（有 learning 时） |
| `learning.communicationTask` | string | 是 |
| `learning.objectives[]` | array | 是（有 learning 时） |
| `learning.eventSegments` | object | 是 |
| `learning.reviewEntry` | object? | 否 |
| `learning.finalPlotAction` | string | 是 |

### 4.2 映射表指向

- 25 个事件的"学习目标 ↔ `objectKey` ↔ 生活领域 ↔ 掌握证据意图"逐条映射，统一登记到 **`LEARNING_SCENARIO_LIBRARY.md`**（25 事件不逐个在本文展开，只在该映射表中维护一行一事件）。
- 本文件只规定字段规范；**批量补录 25 事件元数据**时，以 `objectKey` 已冻结的 `learning_objects` 为输入，逐事件填 `objectives / eventSegments / reviewEntry / finalPlotAction`。

### 4.3 25 事件的统一要求（不区分主次）

1. 每个事件至少 1 条 `objectives`；`birth_*` 种子事件也要补。
2. 每条 `eventSegments.finalOutput.signalIntentIds` 只能引用本事件已存在的 `intents[].id`。
3. `recall` 类型事件（`b1_return_first_words_v1`、`b2_recall_room_v1`）的 `reviewEntry` 必须非空。
4. 所有 `objectKey` 必须先在 `learning_objects` 冻结后再被引用（见 §7 顺序）。

---

## 5. 新增 API 清单（不改动既有 27 个与 N1–N3）

> 统一错误结构沿用 `{ error: { code, message, requestId, details? } }`，`message` 一律中文。学习类端点不返回百分制/排名。
> 2026-10-07：原 N4（水平测试）、N5/N6（难度档读/改）**已取消**，不再提供；只保留掌握查询、复现计划与提示记录三个端点，重新编号为 N4–N6。

| # | 方法+路径 | 用途 | 请求字段 | 响应字段 | 中文错误码建议 |
|---|---|---|---|---|---|
| **N4** | `GET /v1/learning/mastery` | 查询掌握状态（可按章/对象过滤） | query: `chapterId?`, `objectKey?` | `{ items: [{ objectKey, kind, lifeDomainId, stage, lastSeenAt }] }` | `mastery_not_found`→"还没有可展示的学习记录。" |
| **N5** | `GET /v1/learning/review-schedule` | 查询复现计划（到期项） | query: `dueOnly?: boolean` | `{ items: [{ objectKey, dueAt, status }] }` | 无（读接口） |
| **N6** | `POST /v1/learning/hint-usage` | 记录一次提示展示/使用（提示退出证据） | `{ eventInstanceId, stateId, learningObjectId?, hintKind, wasUsed, idempotencyKey }` | `{ recorded: true, promotedStage? }` | `hint_not_available`→"这里暂时没有提示，你可以直接试着说说看。"；`event_not_found`（沿用既有） |

- 说明：
  - N6 要求 `idempotencyKey`，对接既有 `idempotency_records`（`scope=learning_hint_usage`）。
  - N4/N5 是纯读，不触发任何状态推进；返回**不含**原始句子、不含分数、不含档位，只回对象 ID、生活领域、阶段、时间。
  - 帮助量的运行时生效（脚手架级别选择）由服务端在事件启动时按 `mastery_records.stage` 逐对象计算，不下发到客户端做判断，也不读任何用户档位。

---

## 6. 隐私落点（对齐 user_settings / memories 软删除）

1. **不展示羞辱性分数**：`mastery_records` 的 `*_count`、`review_schedule` 一律不渲染成"得分/正确率/排行"；UI 只说"这个说法你已经能独立用出来了 / 还在慢慢练"。本产品无用户档位，也不存在"档/等级"数值可暴露。
2. **无首测/重测**：不建 `assessment_results`，没有"重测建议档"流程；用户对某个对象的掌握判断可手动纠正（"这个我其实还不会"/"这个我会了"），直接改该对象 `mastery_records.stage`，不涉及全局档。
3. **支持即时帮助**：用户随时可对当前对象要求多给/少给提示（`hint_usage` 记录），系统不强制、不羞辱、不弹"你确定吗"负向确认；不留全局档。
4. **支持删除**：`mastery_records / hint_usage / review_schedule` 全部随 `users` 外键 `ON DELETE CASCADE`，纳入既有 §10.3 注销六步顺序；`learning_objects` 是全局内容，不随个人注销删除。
5. **不存原文/录音**：选项层与预设填词都是事件内容配置，不存用户作答原文；`hint_usage` 不存用户原句；与既有"未确认 ASR 不入库、原始录音只走临时桶"一致。
6. **与 memories 一致**：学习数据不设"默认训练同意"；首版不把用户学习数据用于模型训练。

---

## 7. 风险与实施顺序（避免预制语音返工）

> 关键约束：千问 `qwen-audio-3.0-tts-flash` 预制语音绑定到**具体文本版本**（契约 §9）。一旦学习元数据导致新增/改写台词，就要重新生成。所以顺序必须是"先冻结元数据定义，再补事件，最后才制作音频"。

1. **第 1 步：冻结 `learning_objects` 定义**（`objectKey`、`kind`、`life_domain_id`）。
   - 风险：objectKey 一旦被 25 事件引用后再改名，全部元数据与映射表返工。
2. **第 2 步：在 `FixedEvent` zod 加可选 `learning` 字段**（向后兼容，旧规则集可解析）；同步维护 `LEARNING_SCENARIO_LIBRARY.md` 映射表。
3. **第 3 步：批量补录 25 个事件的 `learning` 元数据**（按 §4 规范），并补每章 `life_domain_ids`。
   - 同时处理既有 3.5.4 待办：`birth_restore_object_v1` 仍缺 `bro_intent_pause` 暂停意图与暂停台词——**与本次元数据补录同批完成**，避免后面单独开一次内容版本。
4. **第 4 步：DB migration**（只向前追加）：新增 `learning_objects / mastery_records / hint_usage / review_schedule` 4 张用户/全局表与必要枚举；**不向 `user_settings` 加任何档位列**；`intent_resolution_records` 加 `hint_kind/hint_was_used` 可空列。
5. **第 5 步：实现 N4–N6**（掌握查询 / 复现计划 / 提示记录），接通 `idempotency_records` 与读取链路。
6. **第 6 步：运行时接线**——事件启动按 `mastery_records.stage` 逐对象决定脚手架、按 `eventSegments` 结算掌握、按 `review_schedule` 到期排复现；不读任何用户档位。
7. **第 7 步（最后）：`qwen-audio-3.0-tts-flash` 预制语音**。
   - 只有在第 3 步台词/学习元数据全部定稿后才生成一份正常语速音频；否则文本版本一变就要重录，造成 `audio_bindings` 返工。

**必须先做**：第 1 步（冻结对象定义）→ 第 3 步（25 事件元数据）。这两步未完成前，不得开始任何台词音频预制。

---

## 8. 本清单不做（边界）

- 不改 `english-pet` 任何工程代码（本文件纯设计）；
- 不重命名/不改义既有 23 张表既有列、既有 27 端点与 N1–N3；
- 不新建平行于 `language_level`(L1–L4) 的等级枚举，**也不新建 basic/intermediate/advanced 用户档位列或端点**；
- 不安排首次分级测试，不建 `assessment_results` 表；
- 不把掌握做成分数、排行、打卡；
- 不提前决定向量检索或推荐画像（沿用 DATA_MODEL §16）。
