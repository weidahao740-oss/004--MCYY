# LEARNING_SYSTEM_DESIGN — 双轨学习系统设计（阶段 3.5.4）

> 版本：1.0.0
> 状态：阶段 3.5.4 设计稿，供内容/工程对齐，不写代码、不画图、不生成图片
> 上游依据：
> - `FIXED_CONTENT_CONTRACT.md` v1.0.0（固定内容、人工译文、确定性意图匹配、查看中文不影响学习反馈）
> - `MORROW_LIFE_STORY_BIBLE.md` v1.0.0（七章主线、mainline/daily/recall 三类事件、用户身份=朋友）
> - `FIRST_DAY_FLOW.md` v1.0（首日 FD00–FD07 状态机）
> - `DATA_MODEL.md` v1.0.0、`DATA_MODEL_MIGRATION.md` v1.0.0（现有 23 表 + 拟新增 5 表）
> 配套文档：`FIRST_ASSESSMENT_FLOW.md`（首次轻量校准流程）

---

## 0. 本文件冻结术语（逐字使用，不得另造）

| 类别 | 取值（逐字） |
|---|---|
| 掌握状态六阶 | 初次接触 `encountered` / 能识别 `recognized` / 提示下会用 `prompted` / 独立会用 `independent` / 迁移中 `transferring` / 稳定掌握 `mastered` |
| 用户难度三档 | 基础 `basic` / 中等 `intermediate` / 进阶 `advanced` |
| 六类学习能力 | 认识事物 `recognizing`、执行动作 `doing`、描述世界 `describing`、表达自己 `expressing`、解决问题 `problem-solving`、社会沟通 `social` |
| 12 种交互结构 | 指向命名、听词找物、图片/声音选择、描述特征、纠正误认、执行指令、排列顺序、表达偏好、解释原因、比较方案、协作完成、记忆回访 |

> 本文件所有表格与文案只使用上表术语。Morrow 用 `they/them` 中性指代，不喊 "Great job/Perfect"，不做打卡/金币/考试羞耻/宠物惩罚。

---

## 1. 双轨模型总览

系统只有两条互相独立、互不改写的轨道。任何用户都同时活在两条轨道上：一条决定 Morrow 能说什么，一条决定系统给用户多少帮助。

### 1.1 两轨对照

| 维度 | Morrow 成长章轨 | 用户难度轨 |
|---|---|---|
| 决定什么 | Morrow 的可说词库、可用句型、台词长度上限、剧情所处人生阶段 | 同一事件内的提示量、用户被要求表达的长度、任务挑战度 |
| 取值 | `chapter_01_birth` … `chapter_07_independent_life`（共 7 章） | `basic` / `intermediate` / `advanced`（三档） |
| 新用户起点 | 固定从 `chapter_01_birth` 开始 | 由 `FIRST_ASSESSMENT_FLOW.md` 产出初始档，默认 `basic` |
| 推进方式 | 只由"上一章全部主线事件完成 + 完成条件达成"推进（圣经 §2 硬规则） | 由首次校准、用户随时自选、持续校准三者共同决定 |
| 能否因对方改变 | **永不**因用户水平高而跳章、压缩剧情、让 Morrow 提前说难句 | **永不**改变 Morrow 当前章的词库/句型/台词长度上限 |
| 用户缺席 | 不生病、不离开、不责备（圣经 §1） | 不惩罚、不掉档、不锁内容 |
| 数据落点 | `user_chapter_progress`（拟新增表） | `user_settings.difficulty_tier`（拟新增列，见 §10） |

### 1.2 互不改写的边界（硬规则）

1. **章轨不迁就用户水平**：哪怕用户是 `advanced`，第一章里 Morrow 仍然只说第一章词库内的短句子；高级用户只是在同一事件里少看提示、多说两句，不是让 Morrow 把台词换成第七章水平。
2. **难度轨不迁就剧情**：哪怕用户在第七章，若是 `basic`，系统仍给更多图片/中文/选项/参考句帮助；Morrow 不因用户是 `basic` 而把第七章本该说的话改简单。
3. **任一单次选择不能改章轨**：日常事件、记忆回访、用户表达偏好、跳过任务，都只写支线世界状态，不直接改 `chapter_id`（沿用圣经"单次选择不能跳章"）。
4. **难度轨可随时由用户覆盖**：用户说"简单一点"或"更有挑战"立即生效，不等剧情、不考试、不解释为什么。
5. **两轨正交合成**：某一次互动的实际难度 = 当前章语言上限（章轨定天花板）× 当前难度档（难度轨定提示与任务）。天花板由章轨独占，难度轨只能在天花板内调亮度。

> 一张图的话：横轴是 Morrow 七章人生（从出生到独立生活），纵轴是用户三档脚手架（basic→advanced）。所有新用户都从横轴最左、纵轴中间偏下起步；横轴只能由剧情主线向右推进，纵轴可由用户意愿和学习证据上下浮动，二者没有连线。

---

## 2. 六阶掌握状态定义

掌握状态只挂在"学习对象"（一个词、一个词组或一个句型）上，不挂在"用户英语水平"这个笼统分数上。每阶都有明确的进入、升级与降级条件。

| 阶段 | 中文名 | 进入条件 | 升级/退出条件 | 降级（遗忘回退）条件 |
|---|---|---|---|---|
| `encountered` | 初次接触 | 该学习对象首次出现在用户进入过的事件中（无论用户做了什么） | 用户对该对象做出任意一次可记录的正确反应（选对、听懂、正确产出） | 不降级（最低阶） |
| `recognized` | 能识别 | 在"不产出句子"的前提下，从选项/图片/声音中认出该对象（图片/声音选择、听词找物、指向命名命中） | 在提示下正确说出或写出目标词/短句 | 隔多个合理事件再次出现时，连选项也选错/找不到物 → 退回 `encountered`，重新认识 |
| `prompted` | 提示下会用 | 借助图片/中文/选项/参考句/关键词提示，正确说出或写出目标词或短句 | 在**无任何帮助手段**下独立产出正确目标句 | 一段时间未复现后，再次出现时即使重新给提示也产出错误 → 退回 `recognized` |
| `independent` | 独立会用 | 无图片、无中文译文依赖、不点选项、不照抄参考句、不用关键词提示，自由输入或确认后的语音正确产出目标句，并被确定性意图匹配接受 | 间隔后在一个**新场景**无提示正确复用 → `transferring` | 间隔复现失败（重新给提示仍错）→ 退回 `prompted` |
| `transferring` | 迁移中 | 距首次独立成功至少经过一个合理间隔，且在与首次不同的事件中无提示正确复用 | 跨**第二个不同场景**再次无提示正确复用 → `mastered` | 复现失败且跨场景遗忘 → 退回 `independent` |
| `mastered` | 稳定掌握 | 在 ≥2 个不同语义场景中无提示复现成功，且最近一次复现仍正确 | 已掌握，不再安排密集复现；转为低频自然回采 | 长时间未用后跨场景再次使用错误 → 退回 `transferring` 重新巩固 |

### 2.1 辅助完成不得升入 independent 及以上

以下行为只算"辅助完成"，最高停在 `recognized` 或 `prompted`，**永不**单独构成 `independent` 及以上证据：

- 仅看"查看中文"译文后点选项；
- 点击中文选项直接提交意图（`input_mode = choice`）；
- 把可编辑参考句原样未改地提交（`input_mode = reference_reply` 且文本与参考句逐字一致）；
- 照抄屏幕上 Morrow 刚说过的原句；
- 凭图片/中文提示猜出答案但未自己造句。

> 边界（对齐契约 §8）：查看中文译文、用选项、照抄参考句、慢速播放、改用文字、"稍后再来"**都不受惩罚**——不降级、不扣分、不阻断剧情、不显示任何负面反馈。它们只是"这次没有额外挣到 independent 进度"，而不是"这次做错了"。两者必须严格区分：帮助手段永远可用，且用了帮助也不会让已获得的掌握状态倒退。

### 2.2 降级不是惩罚

降级只发生在"隔了足够久、复现时确实想不起来"的自然遗忘时刻，且降级时不弹窗、不显示"你退步了"，只是下次再遇到时系统自动把提示量调回上一阶。剧情永不因掌握状态低而阻塞。

---

## 3. 掌握证据白名单

系统只承认以下白名单内的行为作为升级证据。名单外的行为不计分，也不扣分。

### 3.1 计入 `independent`（独立会用）的证据

必须同时满足：

1. 输入来自用户自己组织的句子：`messages.input_mode ∈ {text, confirmed_asr_text}`，且不是从参考句框原样未改提交；
2. 本轮未使用关键词提示（系统没有把待填词直接喂到输入框）；
3. 确定性意图匹配命中目标意图（`intent_resolution_records.resolved_intent_id` 等于该学习对象对应意图）；
4. 句子意思正确传达目标（小语法错误不影响理解即可，沿用首日"意思清楚就继续"原则）。

> 注：用户在同一时间点开过"查看中文"不构成本条的否决条件——查看中文是用户对自己内容的权利，系统不因看了译文就撤回一次用户自己写出的正确句子（契约 §8 禁止把查看译文当"使用提示"降结果）。本白名单否定的是"仅靠识别/照抄/选项"，不是"用户看过译文"。

### 3.2 计入 `transferring`（迁移中）的证据

在 `independent` 证据基础上，额外满足：

1. 发生在与首次掌握**不同的** `event_key`；
2. 距首次独立成功间隔 ≥ 该学习对象的最小事件间隔（见 §5）；
3. 自然复现记录 `resurfacing_attempts.result ∈ {used, paraphrased}`（用户真的用上了，或用同义表达改写用上了）。

### 3.3 计入 `mastered`（稳定掌握）的证据

在 `transferring` 证据基础上，额外满足：

1. 在 ≥2 个**不同** `target_event_key` / 不同语义场景中复现成功；
2. 最近一次复现仍正确，无明显遗忘；
3. `resurfacing_tasks.success_count` 达到该对象的掌握阈值（内容配置给定，建议 3 次以上成功复现，分布在不同事件）。

### 3.4 明确不计入任何升级的行为

- 未确认 ASR 转写、草稿、编辑到一半的输入；
- 被用户点"不是这个意思"否认的理解（契约 §5.4）；
- 同一事件内重复提交同一答案；
- 任何 `input_mode = system` 的系统消息；
- 用户只是"看完了"但没有任何产出或选择。

---

## 4. 提示逐渐退出策略

脚手架按四级逐级退出。用户随时可以重新打开任意一级，无惩罚、无记录污点。

| 级别 | 系统提供的帮助 | 适用对象 | 用户重新打开帮助后 |
|---|---|---|---|
| L0 全量脚手架 | 图片 + 人工中文译文 + 3 个中文选项 + 最多 2 条可编辑参考句 | `basic` 用户、刚进入 `encountered`/`recognized` 的新对象 | 立即回到 L0，不提示、不扣分 |
| L1 部分提示 | 图片 + 中文关键词提示（不整句翻译）+ 参考句可手动展开 | `intermediate` 用户、`prompted` 阶段对象 | 同上 |
| L2 关键词提示 | 只给一个句型骨架（如 `I'd like to ___`），无图无译文 | `advanced` 用户、接近 `independent` 的对象 | 同上 |
| L3 独立表达 | 无任何帮助，直接自由输入 | 已稳定在 `independent` 的对象 | 同上 |

规则：

1. **只升不降提示频率的判断依据是证据，不是用户态度**：系统在用户连续独立产出成功后，才把下次遇到该对象的默认脚手架调低一级；用户一旦表现出吃力（主动开帮助、求助、无匹配），下次自动调回上一级。
2. **用户随时可用"简单一点 / 更有挑战"覆盖当前事件的脚手架级别**，覆盖立即生效，只影响当前和接下来几次该类任务，不改难度轨全局档。
3. **帮助手段与剧情解耦**：开帮助不影响 Morrow 的回复、不影响世界状态写入、不影响记忆提案、不影响章节进度（对齐契约 §8、首日 §2.2）。
4. **慢速播放、文字输入、参考句永远平权**：首日 §2.2 的"三种输入平权"贯穿全部学习事件，用哪种输入都不改变掌握证据的判定——判定只看"句子是不是用户自己组织的、是否正确"，不看输入方式。

---

## 5. 间隔复现调度与剧情结合

复习必须像生活的一部分，不能像弹窗题库。

### 5.1 调度原则

1. **自然嵌入，不弹窗**：复现只发生在 `daily`（日常事件）或 `recall`（记忆回访）事件里，作为事件剧情的一个自然环节出现；不为复习单独开页面、不弹"今日复习 X 个"。
2. **不打断叙事**：一次事件最多自然带入 1 条待复现表达（沿用圣经"一次最多调用 1 条个人记忆"）；没有语义合适的事件就不复习，宁可推迟。
3. **间隔**：参考节奏如下（具体间隔由内容配置按对象频率给定，这里给默认值）：
   - 首次 `independent` 成功后：2–3 个事件后第一次自然回采；
   - 再成功：5–7 个事件后第二次；
   - 再成功：约 2 周或更长后第三次；
   - 达到 `mastered`：转为低频回采（每章最多自然遇到 1–2 次）。
4. **冷却与去重**：同一学习对象在相邻事件中不重复出现；复用现有 `resurfacing_tasks.min_event_gap`（默认 ≥1）与 `cooldown_until`；日常事件轮换池本身已做相邻去重（圣经 §3）。
5. **未采用不算失败**：用户在复现时没用上、绕开了、说"换个说法"，都记 `resurfacing_attempts.result = ignored/declined/not_applicable`，不降级、不催、不红叉。

### 5.2 与现有 resurfacing 机制的关系

直接复用，不另起调度表：

- **`resurfacing_tasks`**：只为"用户已确认愿意保留的 language 记忆"建任务。沿用其字段 `status(pending/eligible/served/mastered/snoozed/cancelled)`、`target_event_key`、`semantic_contexts`、`min_event_gap`、`cooldown_until`、`next_eligible_at`、`serve_count/success_count`。
  - 本设计的新增映射：`mastery_stage = transferring/mastered` 与任务 `status = served/mastered` 联动；掌握阈值由 `success_count` 达阈触发。
- **`resurfacing_attempts`**：沿用其 `mode(optional_prompt/natural_modeling)` 与 `result(used/paraphrased/ignored/declined/not_applicable)`。`used/paraphrased` 是 `transferring/mastered` 的正证据；其余结果中性。
- 记忆暂停/删除/过期时，关联任务立即 `cancelled`（沿用 DATA_MODEL §9.1），不沿用删除前任务。

### 5.3 复现场景的选取

只在 `semantic_contexts` 与当前事件话题匹配时才服务候选任务（如"问候/感受"类表达只在 `topic_feelings`、`topic_today` 类事件里自然带回）。匹配不到就这次不复习，绝不把表达硬塞进不相干剧情。

---

## 6. 三档用户任务模板

三档任务模板都在"当前章语言上限"之内设计：`advanced` 档只是更少提示、更长用户输出、更开放的任务，**绝不让 Morrow 说出超出本章词库/句型上限的句子**。

| 难度档 | 典型任务 | 用户期望表达长度 | 脚手架默认 | 对应学习能力 / 交互结构 |
|---|---|---|---|---|
| `basic` 基础 | 认词、图片/声音选择、跟着参考句说短句、执行简单指令 | 1 个词或 ≤5 个词的短句 | L0 全量脚手架 | recognizing 认识事物、doing 执行动作；指向命名、听词找物、图片/声音选择、执行指令 |
| `intermediate` 中等 | 用一个完整句子描述特征、表达偏好、按顺序说一件小事、描述今天 | 1 个完整句（约 5–12 词） | L1 部分提示 | describing 描述世界、expressing 表达自己；描述特征、表达偏好、排列顺序、协作完成 |
| `advanced` 进阶 | 解释一个选择的原因、比较两个方案、把 Morrow 的话换个说法、给朋友一条建议 | 1–3 句，但仍受本章句型上限 | L2 关键词提示 | expressing 表达自己、problem-solving 解决问题、social 社会沟通；解释原因、比较方案、记忆回访 |

示例（均在第一章 `chapter_01_birth` 语言上限内）：

| 档 | 任务中文文案 | 英文 Morrow 台词 / 题目 | 人工中文译文 |
|---|---|---|---|
| basic | 听 Morrow 说，选出它指的是哪样东西 | "Do you see the lamp by the window?" | 你看见窗边那盏灯了吗？ |
| intermediate | 用一句英语说说你现在的感觉 | "Tell me one small thing about how you feel now." | 用一件小事说说你现在的感觉。 |
| advanced | Morrow 在灯和铃铛之间犹豫，你作为朋友给个理由 | "Which should we bring back first, and why?" | 我们先把哪一个带回来呢，为什么？ |

> 即便是 `advanced` 在第一章，Morrow 也不会说出第七章才有的复杂从句；进阶感来自"让用户多说一层理由"，而不是抬高 Morrow 的台词天花板。

---

## 7. 持续校准规则

首次测试只决定**初始档**，不定终身级。

### 7.1 调整来源

| 来源 | 触发 | 效果 |
|---|---|---|
| 用户主动 | 任何时候点"简单一点" / "更有挑战" | 立即改 `difficulty_tier`，锁定 ≥7 天，期间自动校准不动作 |
| 自动升档 | 用户在当前档连续 ≥3 个事件都无提示独立产出成功 | 提示下次遇到新对象时默认脚手架降一级 |
| 自动降档 | 用户连续 ≥3 个事件都需要 L0 全量脚手架，或连续求助/无匹配 | 下次默认脚手架升回一级 |
| 用户重测 | 在设置里重新跑首次轻量校准（见 `FIRST_ASSESSMENT_FLOW.md`） | 重新产出初始档，用户可接受或改选 |

### 7.2 防抖动

1. 单次成功或单次受挫都不调档，必须连续 ≥3 个事件一致才触发自动校准；
2. 两次自动调档之间至少隔 7 天，避免来回横跳；
3. 用户手动选择永远优先于自动判断，且 7 天内不被自动校准覆盖；
4. 校准只改难度档，**永不**改章轨、不改已确认记忆、不显示"你升级了/退步了"；
5. 用户觉得当前档不对，随时一句话改，无需理由。

---

## 8. 学习覆盖目标与边界声明

### 8.1 承诺覆盖

- 成人日常生活与社交的核心高频词；
- 常用搭配（collocations）与主要句型（问候、表达感受、表达偏好、简单计划、请求帮助、比较与建议）；
- 听懂 Morrow 在七章里说的话的能力；
- 借助上下文和已知词自主理解生词大意的能力。

### 8.2 明确不承诺

- **不承诺"学完所有英语单词"**；
- 不做考试题库、不做语法课、不做四六级/雅思/托福导向；
- 不做打卡、连续登录、金币、经验值、排行榜、PK；
- 不承诺"跟着 Morrow 就能流利说英语"，只承诺在生活场景里一步步能被理解、能自己组织句子。

### 8.3 内容边界

- 所有学习内容来自版本化固定内容（`learning_contents`），不在运行时由 LLM 生成新学习材料（对齐契约 §11）；
- 不做开放式剧情生成、不做运行时机器翻译；
- 每章只练该章词库内的对象，不提前出现后续章才学的词。

---

## 9. 隐私与用户控制

1. **水平档与掌握记录只用于适配学习**：决定给多少提示、什么时候自然回采，不用于给用户打分、排名、画像或推荐。
2. **不展示羞辱性分数**：界面不出现百分制、"正确率 X%"、"击败了 Y% 用户"、红叉/黑榜；`language_feedback` 沿用现有 `successful/more_natural/affects_understanding`，不用百分制。
3. **用户可见、可改、可删**：
   - 可在设置里看到当前难度档，并一键换成另外两档；
   - 可随时重跑首次轻量校准；
   - 可纠正系统对某条表达的掌握判断（"这个我其实还不会"/"这个我会了"）；
   - 可删除自己的语言记忆，删除后关联复现任务立即 `cancelled`（沿用 DATA_MODEL §11.2）。
4. **不暴露原始录音**：掌握判断基于用户确认后的文本与结构化匹配结果，不存原始音频（对齐迁移 §4）。
5. **账号注销**：难度档、掌握记录、复现任务随账号级联删除（沿用 DATA_MODEL §10.3），不可凭旧日志恢复。

---

## 10. 数据落点（逻辑字段清单，不写 SQL）

> 与 `DATA_MODEL_MIGRATION.md` §2 的拟新增 5 表对齐命名；本节只给逻辑字段，不写建表语句，不改既有 23 表既有列语义。

| 学习系统概念 | 落到哪 | 逻辑字段（新增，【拟新增】） | 说明 |
|---|---|---|---|
| 学习对象（词/词组/句型） | `learning_contents`（拟新增表，已登记） | 沿用迁移 §2.2：`content_id`、`text_version`、`english_text`、`translation_text_zh`、`translation_version`、`manual_reviewed`、`content_kind`、`status` | 全局素材库，不按用户存储 |
| 当前章轨进度 | `user_chapter_progress`（拟新增表，已登记） | 沿用迁移 §2.4：`chapter_id`、`status(locked/in_progress/completed)`、`sequence_position`、`completion_checks` | 章轨唯一权威；任何结果不得直接改 `chapter_id` |
| 用户难度档 | `user_settings`（既有表，加列） | 【拟新增】`difficulty_tier`（`basic/intermediate/advanced`）、`tier_source`（`first_assessment/user_choice/calibrated`）、`tier_updated_at` | **不复用**既有 `language_level`（L1–L4 是旧 LLM 适配器时代枚举，保留不动）；新三档是独立语义 |
| 六阶掌握状态 | `memories`（既有表，仅 `kind=language` 行） | 【拟新增】`mastery_stage`（`encountered/recognized/prompted/independent/transferring/mastered`）、`stage_entered_at`、`independent_success_count`、`transfer_scene_count` | 六阶当前值以 `LEARNING_DATA_MIGRATION.md` §3 的新表 `mastery_records`（用户×学习对象，存六阶当前值）为权威；本字段仅作语言记忆侧冗余快照。encountered/recognized/prompted 可由"进入事件 + `intent_resolution_records`"实时推导；independent 及以上落 `mastery_records` |
| 提示使用 / 匹配证据 | `intent_resolution_records`（拟新增表，已登记） | 沿用迁移 §2.6：`match_kind(choice/exact_phrase/keyword/no_match/ambiguous/denied)`、`resolved_intent_id`、`candidate_intents`；配合 `messages.input_mode(text/voice/reference_reply/choice)` 判断是否独立产出 | 只存 `input_hash` 与结构化候选，不存原文/录音 |
| 间隔复现计划 | `resurfacing_tasks` / `resurfacing_attempts`（既有表，不改结构） | 沿用现有 `status/min_event_gap/cooldown_until/serve_count/success_count` 与 `mode/result` | `success_count` 达阈即把对应 memory 的 `mastery_stage` 推到 `mastered`，任务 `status=mastered` |
| 首次校准结果 | `user_settings`（同上加列） | 复用 `difficulty_tier` 三字段；**不写** `user_world_state`、**不写** `memories`、**不写** `journal_entries`、**不写** `user_chapter_progress` | 校准只影响难度档，绝不写世界状态/记忆/章节进度（见 `FIRST_ASSESSMENT_FLOW.md`） |

### 10.1 为什么掌握状态挂在 language 记忆上，而不是新造一张表

- 现有契约要求所有长期记忆必须 `requiresUserConfirmation = true`（用户确认才进入 ACTIVE_MEMORIES）。掌握状态中真正需要长期跟踪的 `independent/transferring/mastered`，本质就是"用户愿意保留并复现的表达"，天然就是 `memories(kind=language)`。
- 在达到 `independent` 之前的 `encountered/recognized/prompted` 不需要逐对象持久化：它们由"用户进入过的事件 + `intent_resolution_records` 匹配记录"实时推导即可，避免为每个见过的词都建一行用户数据。
- 当证据表明一个对象已达到 `independent`，系统按既有记忆提案流程生成一条 `proposed` language 记忆，请用户确认；用户确认后，掌握状态字段才落到这条记忆上。用户拒绝，则不留掌握记录。

### 10.2 与既有表的一致性自查

- 不改既有 23 表任何既有列语义；`language_level`(L1–L4) 保留给旧 LLM 适配器，新三档另列；
- 不与拟新增 5 表重名、不改其字段；
- 记忆仍走 `proposed → confirmed/paused/rejected/deleted/expired` 状态机，仍需用户确认；
- 复现仍走 `resurfacing_tasks/attempts`，未采用不算失败；
- 查看中文是 UI 行为，按契约 §8 不落库、不影响掌握判定（只影响"是不是独立产出"的证据归属，不构成惩罚记录）。

---

## 11. 自查清单

- [x] 六阶术语逐字：encountered / recognized / prompted / independent / transferring / mastered；
- [x] 三档术语逐字：basic / intermediate / advanced；
- [x] 双轨边界：章轨永不因用户水平跳章，难度轨永不抬高 Morrow 台词天花板；
- [x] 照抄/看译文/选项命中只算辅助完成，不升入 independent 及以上；
- [x] 轻松无惩罚：看中文、选项、照抄、慢速、文字、稍后再来均不降级不扣分；
- [x] 复现嵌入剧情、不弹窗、不打断；
- [x] 数据落点与 23 表 + 拟新增 5 表对齐，不另起冲突命名；
- [x] 不写代码、不画图、不生成图片。
