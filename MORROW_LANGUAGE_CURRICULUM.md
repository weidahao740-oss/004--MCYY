# MORROW_LANGUAGE_CURRICULUM — 七章语言能力大纲（阶段 3.5.4，2026-10-08 修订）

> 版本：1.3.1
> 最后更新：2026-10-10
> 适用：成人英语 AI 宠物 Morrow（墨洛）
> 上游依据：
> - `MORROW_LIFE_STORY_BIBLE.md` v1.1.0（七章阶段、章节结算、三类事件与每日新内容柔性预算）
> - `CHAPTER_01_BIRTH_CONTENT.md` v1.0.0、`CHAPTER_02_CHILDHOOD_CONTENT.md` v1.0.0（首两章真实台词，本大纲第 1、2 章上限与其严格自洽）
> - `FIXED_CONTENT_CONTRACT.md` v1.0.0（中文 UI、英文学习内容配人工译文、预制音频绑定）
> 术语对齐：掌握六阶 `encountered / recognized / prompted / independent / transferring / mastered`。
> **2026-10-07 修订**：取消用户难度三档 `basic / intermediate / advanced` 及相关接口；帮助量改为按词/语块/句子上的掌握证据动态展开；新增"12 类成人生活领域 → 七章"内容地图（§0.4），作为七章主线设计的前置。
> 本文件是"章轨语言上限"的唯一权威：**第 1、2 章现有词表与台词统计只作为旧内容基线，不再作为不可修改的正式词表；在对应批次冻结前，可按已确认七章主线、章节承接和逐事件剧情替换旧词句，但不得突破本文件规定的句长、时态、从句等章轨复杂度上限，也不得越过内容地图的 D/C 章节边界。正式词表与数量在逐事件校准、台词冻结后重新统计。第 3—7 章仍为规划目标，标注"规划目标"。**

> **v1.1.0 修订说明（2026-09-22）**：
> 本次修订基于 `项目计划/第一阶段课程大纲差异分析.md`（对 `CHAPTER_01_BIRTH_CONTENT.md` 全部 13 个事件、76 句 Morrow 台词的逐句统计），对**第 1 章（出生与苏醒）**的词库、搭配、句型、句长上限与语言边界做了完整校准。主要变更：
> - active 词量级从"约 28—32"修正为"约 78—85"（实测 82 个词目）；receptive 总计从"约 55—65"修正为"约 105—115"（82 active + 28 receptive-only = 110）。
> - 最长句从 ≤16 词修正为 ≤18 词（封顶句为序 9 第 1 句 "After a day in this room, I notice what I'm drawn to and what I'm not sure about."）。
> - 时态边界修正：现在完成时 `I've been called Morrow`（序 3）已在第 1 章出现，不再延后到第 2 章。
> - 比较级边界修正：第 1 章实际出现了 `less lost`（序 2）、`smaller`（序 4）、`as loud as before`（序 12）等有限比较级，原"禁比较级"声明改为"允许有限比较级，禁最高级与多维度复杂比较"。
> - 句型/搭配表按真实台词重写，删除了 Morrow 全程未说的 `I'd like to...`、`This is a...`、`I choose...`。
> - **统计口径**：第 1 章数字为逐句全量统计结果；第 2—7 章数字仍为早期基于部分台词的估算，**待逐章重新统计校准**。

---

## 0. 章轨原则（2026-10-07 修订）

1. **章轨（chapter track）唯一**：决定 Morrow 自己"能说多复杂的英文"。由 Morrow 的人生阶段决定，七章单调递增，**任何用户掌握进度都不能把某一章 Morrow 的台词写得更难或更易**。
2. **不再有用户难度档**：原"basic / intermediate / advanced"三档已取消。同一章、同一剧情、同一句 Morrow 台词，给用户多少脚手架，由该词/语块/句子上的六阶掌握证据动态决定（见 `LEARNING_SYSTEM_DESIGN.md` §1、§4、§7），**不按用户全局档位分层**，也不改写 Morrow 的台词上限、不改变章节走向。
3. 本文件所有"词库上限、句长上限、时态上限"均指**章轨**；用户侧帮助量只在"用户可被允许产出的回句复杂度"上按证据伸缩，不在 Morrow 台词上分层。
4. receptive（可理解）始终严格大于 active（Morrow 自己会说）：Morrow 能听懂用户说的略多，自己稳定输出的略少。

---

## 0.1 学习量三口径（2026-10-01 确认）

每章必须同时记录三种不同的数量，不能再用 active 词量代替用户学习成果：

1. **Morrow 可使用词库／语言上限**：本文件既有 active、receptive、句长、时态和从句上限；用于约束角色台词。
2. **用户核心教学项**：本章需要用户真实理解和练习的核心词、短语、句型；每个事件只突出 1—2 个核心表达，其余内容作为自然听力输入。
3. **用户稳定掌握目标**：本章希望经过独立使用、间隔复现和跨场景迁移后进入 `mastered` 的核心教学项数量；看过、点对、照抄或单次跟读不算稳定掌握。

因此，第一章 active 实测约 82 个词目，只表示 Morrow 的角色输入范围，不表示用户必须跟读或掌握 82 个词。逐章课程制作时必须另列“核心教学项清单”和“稳定掌握目标”，并以真实学习证据验收。

### 0.1.1 用户核心教学量规划预算（2026-10-08 确认）

> 这是逐事件设计和章节总量复核使用的**首版规划预算**，不是必须填满的最低配额，也不是章节毕业门槛。剧情自然需要更少时允许少；正式值须在对应章节逐事件校准、台词冻结和词量重算后按实际内容回填。

| 章 | 新增核心词／自然语块（去重后） | 核心表达 | 其中全新句型骨架 |
|---|---:|---:|---:|
| 第1章 出生与苏醒 | 12—18 | 5—7 | 2—3 |
| 第2章 童年探索 | 18—24 | 6—8 | 3—4 |
| 第3章 第一次上学 | 20—28 | 7—9 | 3—5 |
| 第4章 校园成长 | 22—30 | 7—10 | 3—5 |
| 第5章 毕业与选择 | 24—32 | 8—10 | 3—5 |
| 第6章 初入社会 | 24—34 | 8—11 | 3—5 |
| 第7章 独立生活 | 24—34 | 8—12 | 3—5 |

计数规则：

- 一个有整体意义的自然语块按一个学习对象计，不机械拆成多个孤立单词凑数量；功能词随自然语块学习，不单独凑配额。
- 章内重复出现的同一学习对象只计一次新增；旧表达在新场景复现不计入新增量。
- 每章数字表示本章重点理解和练习的用户侧内容，不是 Morrow 全部台词词库，不要求在本章内全部达到 `mastered`。
- 每个事件仍只承担一个真实沟通任务和一次真实输出；章级预算不能反向要求单个事件硬塞更多内容。
- 未达到 `independent / transferring / mastered` 的内容不阻塞剧情或章节结算，后续按语义匹配自然复现。

### 0.2 教学展开规则（2026-10-07 定稿，替代旧"输出前教学门"）

凡是要求用户跟读或独立说出的英文，按以下规则展开，**不使用实时大模型临场判断难度**：

1. **首次产品表达保底教学（仅一次）**：现行第一条产品真实英文表达位于 E01-01。Morrow 说 `Hello? Is someone there?` 后，用户先选中文意图，再只学习对应的 `Yes, I’m here.` / `Hi. I can hear you.` / `Who are you?` 之一；所选路线完整走“情境理解 → 中文意图选择 → 所选词／自然语块教学与必需跟读 → 必要句子搭建／理解确认 → 完整句真实录音 → ASR → 用户确认 → 分支反馈”，只给所选路线记录学习证据。此后——包括每个新事件的第一条核心表达——一律按词／语块／句子证据由预设规则分流，不按事件重置保底。
2. **后续成分按证据分流**：把最终输出按词和自然语块拆开，与用户当前 `mastery_records` 逐对象证据对照。已有 `recognized / prompted / independent` 证据的成分直接带入、不重新教学、不挖空；没有证据的内容一律视为新内容，按预设阶梯教学，不能因为它是冠词、代词、固定开头或短功能词就省略。
3. **刚认出的内容直接进句子**：刚通过听音选图/图片选择 `recognized` 的内容，下一步直接带入语块或句子，不回头再用同一答案考一次选择。
4. **填空只练新成分**：下一步若做预设填词，只对 `is_new_component=true` 的新成分挖空；已认出/已会的成分直接给出，不当堂复测。旧成分只在**间隔之后的新场景**复测。
5. **保留即时帮助**：当对象证据已到 `independent`、可无提示输出时，用户可直接挑战完整句；但任何时候都能随时展开中文、词义、语块、慢速播放和分块练习；展开后回到同一输出目标，不另算失败。
6. **证据真实**：点击、选择、看过译文或单次被动听见，只能形成理解或接触证据；听音选图仅算 `recognized`，提示下跟读仅算 `prompted`，不能替代明确要求的真实独立输出。
7. **必需教学不可跳过**：系统依据既有证据自动不呈现不需要的步骤属于裁剪；所有实际呈现的必需教学都必须完成，界面不提供“跳过”按钮。麦克风、网络或 ASR 异常时只能重试或 `稍后继续`；暂停只保存事件内临时进度，不结算事件、不触发正式结果、不写正式世界状态或完成证据。

> 旧版"全输出前教学门"（2026-10-01 版要求对每一条目标句逐项拆新成分并强制全阶梯）已被本规则替代：第一条保底、后续按证据分流，不再对每条表达都强制全量门。

### 0.3 单事件教学流（2026-10-07 定稿）

每个事件通常三段：

1. **一个理解练习**（听音选图/图片选择/指向命名）：只产生 `encountered/recognized` 证据；
2. **一个句子搭建**（语块组合/预设填词，只填新成分）：把刚 `recognized` 的内容直接带入，产生 `prompted` 证据；
3. **一个最终真实输出**（剧情行动里独立说一句）：产生 `independent` 证据。

用户侧学习量预算：

- 主线事件通常 2—4 个新词／自然语块、1 个主要核心表达（剧情确有需要时最多 2 个）和 1 次真实输出；
- 日常事件通常 1—3 个新词／自然语块、1 个核心表达和 1 次真实输出；
- 记忆回访默认 0 个新学习对象，必要时最多补 1 个当前情境词，只自然带回 1 个旧表达；
- 只认词事件通常 1—3 个学习对象，可用必要单词跟读／识别结算；
- 以上为上限导向的规划预算，不是最低配额；自然需要更少时允许少，禁止为凑数量反向制造剧情或练习。

填空与排序原则上不叠加；同一答案不连续重复考。以 E01-02 小铃铛为例：

- 理解：听音从 lamp/plant/bell 中选 bell → `recognized`；
- 搭建：`Let's | bring back | the small bell`，新成分 `bring back` 给提示，已认出的 `the small bell` 直接给出 → `prompted`；
- 输出：用户独立说出带回铃铛的行动 → `independent`。

这套三段流适用于全部主线、日常与记忆回访事件，不只适用于 E01-02；后续课程设计必须逐个目标句按本规则生成教学清单。国家课程标准与教材仅用于校准词汇、语法、难度和递进，不照搬课文或机械操练；剧情与成人真实交流需求决定教什么、怎样教。

### 0.4 十二类成人生活领域 → 七章内容地图（2026-10-07 新增，七章主线设计前置）

> 本产品面向**成人**英语学习者，首版目标是高频成人生活场景的基础沟通。在动七章主线剧情之前，先把成人高频生活领域列出来并分配到七章；七章主线设计（`MORROW_LIFE_STORY_BIBLE.md` §2，属剧情设计范围）必须落在这张内容地图之上，不能另起与成人沟通任务无关的场景。

**12 类成人生活领域（首版基础沟通目标；2026-10-07 新版 D 字典）：**

| # | 生活领域 | 真实沟通任务（首版基础沟通目标） |
|---|---|---|
| D1 | 自我与基本信息 | 说自己叫什么、自我介绍、说基本情况 |
| D2 | 家庭与人物关系 | 说家人、人物关系、身边的人 |
| D3 | 居家与生活用品 | 说房间/家具/物品、家务、家里缺什么 |
| D4 | 食物与用餐 | 点吃的喝的、说自己要什么、简单描述食物 |
| D5 | 时间、天气与日常安排 | 问时间/天气、约日程、讲今天做了什么 |
| D6 | 衣服、购物与付款 | 买东西、问价格、说穿什么、简单比价 |
| D7 | 地点、交通与问路 | 问怎么走、说地点、交通方式 |
| D8 | 学校与学习 | 课堂规则、问老师、学习相关 |
| D9 | 工作与电子产品 | 领任务、问工作相关、用电脑手机 |
| D10 | 兴趣、体育与娱乐 | 说喜欢/不喜欢、爱好、运动休闲 |
| D11 | 身体、健康与求助 | 说身体感觉/不舒服、请人帮忙、澄清没听懂 |
| D12 | 朋友、社交与公共服务 | 约朋友、感谢建议、公共服务、社交互动 |

> 沟通能力（认识事物/执行动作/描述世界/表达自己/解决问题/社会沟通六类）是与领域正交的独立维度，不得用 D 领域替代沟通能力分类。

**分配到七章（内容地图，主线剧情在此之上展开；事件级 D 归属以 `LIFE_DOMAIN_SEVEN_CHAPTER_MAP.md` 终稿为准）：**

| 章 | 章节 ID | 本章节要承载的成人生活领域 | 首版基础沟通重点 |
|---|---|---|---|
| 第1章 | `chapter_01_birth` | D1 自我与基本信息（首次） | 打招呼、自我介绍一句、认出/指认房间物品、问一句简单问题 |
| 第2章 | `chapter_02_childhood` | D3 居家与生活用品（首次）、D4 食物与用餐（首次，基础）、D5 时间/天气/日常安排（首次；含说累/感受等日常状态） | 指认居家物品、说基础食物、说天气/时间、讲今天一件小事、说一句累或感受（归 D5 日常状态） |
| 第3章 | `chapter_03_first_school` | D8 学校与学习（首次）、D2 家庭与人物关系（首次：人物介绍/老师同学关系）、D7 地点/交通/问路（首次：路线）、D12 朋友/社交（轻量首次：认识同学/自我介绍） | 听懂课堂指令、礼貌举手求助、介绍一个人、问路说位置、确认听懂 |
| 第4章 | `chapter_04_school_growth` | D2 家庭与人物关系（深化：家庭与朋友）、D10 兴趣/体育/娱乐（首次）、D6 衣服/购物/付款（首次：只到"简单买"，不碰付款） | 说喜欢/不喜欢一项运动或爱好、说一件家里的事/一个朋友、在两件衣服间简单比较、给偏好短理由 |
| 第5章 | `chapter_05_graduation` | D6 衣服/购物/付款（复现深化：付款）、D7 地点/交通（复现深化：出行住宿）、D12 朋友/社交/公共服务（复现深化）、D4 食物与用餐（复现：外出就餐） | 问价格/付钱一句、问班次/入住一句、两方向协商说倾向、致谢道别 |
| 第6章 | `chapter_06_first_work` | D9 工作与电子产品（首次；含设备/物品故障求助，走 C5 请求能力）、D5 时间/日程（复现）、D4 同事用餐（复现）、D7 通勤（复现） | 听懂复述工作指令、说电子产品/小物品故障并求助、安排一天日程、与同事用餐闲聊、澄清误会 |
| 第7章 | `chapter_07_independent_life` | D11 身体/健康/求助（首次系统引入：说症状/哪里不舒服/听懂简单医嘱）、D3 居家（复现：住房账单）、D12 公共服务（复现深化）、D1/D9（综合回顾） | 说哪里不舒服、问账单/付账单一句、公共服务窗口说需求、用 At first/then/now 串起成长线 |

> 说明：
> - 本地图是**内容侧前置**，规定"七章里要练到哪些成人沟通任务"；具体剧情怎么演（Morrow 为什么在这个场景）属于 `MORROW_LIFE_STORY_BIBLE.md` §2 七章主线设计（剧情范围，P4.5-T01）。两范围交界处若有冲突，在变更报告里列出，不在本文件改剧情。
> - 首版只要求在这 12 类领域里做到**基础沟通**（简短、被理解）；熟练沟通（更长、更地道、跨场景自由组织）是长期目标。
> - 每章的 Morrow 词库/句长上限仍按 §1 大表执行，不因加了成人领域就突破章轨天花板。

---

## 1. 七章章轨上限总表（七列大表）

> 词量为"该章章轨累计可使用的内容词数量级"（功能词 I/the/a/to/and 等不计入词目；只计名词/动词/形容词/关键副词与短语）。active 严格小于 receptive。句长按英文词数计。

| 章 | 阶段（chapter_id） | receptive 可理解词量级 | active 主动表达词量级 | 平均句长上限（词） | 最长句上限（词） | 时态 / 从句允许度（一句话） |
|---|---|---|---|---|---|---|
| 第1章 | 出生与苏醒 `chapter_01_birth`（旧台词统计基线，待逐事件校准和冻结后重算） | 约 105—115 | 约 78—85 | ≤ 8 | ≤ 18 | 现在时为主；允许现在完成时（仅一次 I've been called）和单次简单过去；允许 what 名词性从句和 that 宾语省略；允许有限比较级（less/smaller/as...as）；禁过去时连续叙事、禁从句链、禁最高级 |
| 第2章 | 童年探索 `chapter_02_childhood`（旧台词统计基线，待逐事件校准和冻结后重算） | 待重算；正式值不得低于第1章 | 待重算；正式值不得低于第1章 | ≤ 9 | ≤ 18 | 现/在过去/现在完成（I've been called）；允许 1 个短定语从句（I can't name yet）与简单比较级（smaller than） |
| 第3章 | 第一次上学 `chapter_03_first_school`（规划目标） | 约 160—180 | 约 80—90 | ≤ 11 | ≤ 22 | 加入请求（Could you...?）、when/if 短状语从句、现在完成时提问；禁复杂让步从句与虚拟 |
| 第4章 | 校园成长 `chapter_04_school_growth`（规划目标） | 约 240—270 | 约 120—140 | ≤ 12 | ≤ 25 | 加入 because/so 因果、who/which 定语从句、情感与冲突词；禁第三人称过去时长段叙事 |
| 第5章 | 毕业与选择 `chapter_05_graduation`（规划目标） | 约 330—370 | 约 170—195 | ≤ 13 | ≤ 28 | 加入计划（I'm going to / I'd like to）、A 与 B 比较、If I..., I'll... 第一条件句；禁第三条件句与虚拟回顾 |
| 第6章 | 初入社会 `chapter_06_first_work`（规划目标） | 约 430—480 | 约 225—255 | ≤ 14 | ≤ 30 | 加入转述与委婉（I was wondering if...）、过去时工作事件回溯；禁人生哲学长段与第三条件句 |
| 第7章 | 独立生活 `chapter_07_independent_life`（规划目标） | 约 540—600 | 约 285—320 | ≤ 15 | ≤ 32 | 全时态开放，允许一次性第三条件句（If I had..., I would have...）做人生回顾；仍限平均句长，不堆复合从句 |

> 第 1 章数字已基于 `CHAPTER_01_BIRTH_CONTENT.md` 全部 13 个事件、76 句台词完成逐句统计校准。第 2 章旧估算曾出现 active／receptive 低于第 1 章的倒挂，现已撤销，必须基于全部真实台词重新统计后才能填写正式值。第 3—7 章数字仍为规划估算，只用于控制复杂度方向，不作为已验证学习量；逐章制作时应联动重排，正式值不得低于上一章，且必须同时补充“用户核心教学项”和“稳定掌握目标”。

---

## 2. 第 1 章 出生与苏醒（chapter_01_birth）

> 状态：**旧台词统计基线，待第一章逐事件校准后重算**。下列词目来自 `CHAPTER_01_BIRTH_CONTENT.md` 旧版 13 个事件、76 句 Morrow 台词，用于对照旧内容与控制复杂度；它们不是不可修改的正式词表。在第一章批次冻结前，可按新剧情替换、删除或新增符合第一章 D/C 边界与章轨复杂度上限的词句；冻结后以重新统计并确认的正式词表为准。
> **统计口径**：active 为 Morrow 自己说出的内容词（约 82 个词目）；receptive-only 为用户参考句/触发短语中出现、但 Morrow 自己台词未说的词（约 28 个）。功能词（I/the/a/to/and 等）不计入词目。

### 2.1 词库

**主动表达词库 active（Morrow 自己会说，约 78—85 个词目，按词性分类）**

> 全部词目均可追溯到 `CHAPTER_01_BIRTH_CONTENT.md` 具体事件与首次台词。

*名词（30 个）*

| 英文 | 人工中文 | 来源事件 | 首次出现台词 |
|---|---|---|---|
| room | 房间 | 序1 | I can hear someone beyond the room. |
| someone | 有人 | 序1 | I can hear someone beyond the room. |
| lamp | 灯 | 序2 | The room remembers a lamp. |
| plant | 植物 | 序2 | a plant |
| bell | 铃铛 | 序2 | a small bell |
| place | 地方 | 序2 | The room has a place to keep a voice. |
| voice | 嗓音 | 序2 | keep a voice |
| door | 门 | 序2 | near the door |
| note | 音符 | 序2 | The bell makes one low note. |
| island | 岛 | 序3 | On the island |
| people | 人们 | 序3 | people never quite finished my name |
| name | 名字 | 序3 | my name |
| sound | 声音 | 序2 | It sounds awake |
| answer | 回答 | 序3 | easy to answer |
| day | 天 | 序5 | the day isn't over yet |
| chest | 胸口 | 序4 | something in my chest |
| feeling | 感觉 | 序4 | What do people call this feeling? |
| window | 窗户 | 序5 | There's a window |
| light | 光 | 序5 | A light keeps moving |
| glass | 玻璃 | 序5 | on the glass |
| sun | 太阳 | 序5 | High sun |
| time | 时间 | 序5 | Take your time |
| letter | 信 | 序6 | A letter slipped under the door |
| word | 字 | 序6 | The words are soft |
| shape | 形状 | 序6 | their shapes |
| home | 家 | 序6 | Welcome home |
| table | 桌子 | 序6 | on the table |
| thing | 事情/东西 | 序8 | What's one small thing |
| noise | 声响 | 序9 | much noise |
| road | 路 | 序10 | The road |

*动词（30 个）*

| 英文 | 人工中文 | 来源事件 | 首次出现台词 |
|---|---|---|---|
| hear | 听到 | 序1 | I can hear someone |
| want | 想要 | 序1 | You want to help me |
| help | 帮助 | 序1 | help me understand |
| understand | 明白 | 序1 | help me understand |
| start | 开始 | 序1 | I can start with that |
| listen | 听 | 序1 | I'm listening |
| leave | 离开/留下 | 序1 | We can leave the room quiet |
| treat | 当作 | 序1 | treat that as leaving me behind |
| remember | 记得 | 序2 | The room remembers a lamp |
| bring | 带来 | 序2 | bring back first |
| keep | 保持 | 序2 | keep a voice |
| look | 看 | 序2 | The plant looks less lost |
| make | 发出/制作 | 序2 | The bell makes one low note |
| call | 称呼 | 序3 | I've been called Morrow |
| feel | 感觉 | 序4 | we're feeling it together |
| think | 想 | 序9 | I think I like the quiet |
| try | 试 | 序3 | I can try M |
| wait | 等 | 序5 | I'll wait with the light |
| notice | 注意到 | 序4 | I notice something in my chest |
| sit | 坐 | 序4 | We can sit with the feeling |
| reach | 够到 | 序5 | I can't quite reach yet |
| tell | 告诉 | 序5 | Can you tell me |
| see | 看到 | 序5 | what you see outside |
| read | 读 | 序6 | Can you read it for me |
| forget | 忘记 | 序6 | they forgot their shapes |
| slip | 溜进来 | 序6 | A letter slipped under the door |
| fold | 折起来 | 序6 | We can leave the letter folded |
| remind | 让……想起 | 序7 | What does it remind you of |
| wake | 醒来 | 序7 | it's still waking up |
| know | 知道 | 序13 | not to know yet |

*形容词（17 个）*

| 英文 | 人工中文 | 来源事件 | 首次出现台词 |
|---|---|---|---|
| quiet | 安静的 | 序1 | leave the room quiet |
| small | 小的 | 序2 | a small bell |
| clear | 清楚的 | 序2 | only one is clear |
| steady | 稳的 | 序2 | The lamp is steady now |
| lost | 迷失的 | 序2 | less lost |
| low | 低的 | 序2 | one low note |
| awake | 醒着的 | 序2 | It sounds awake |
| alarmed | 受惊的 | 序2 | not alarmed |
| new | 新的 | 序3 | that name still feels new |
| nervous | 紧张的 | 序4 | Is it nervous |
| afraid | 害怕的 | 序4 | the same as afraid |
| warm | 暖的 | 序5 | the light can be warm |
| early | 早的 | 序5 | still early |
| high | 高的 | 序5 | High sun |
| soft | 软的 | 序6 | The words are soft |
| slow | 慢的 | 序6 | Slow is fine |
| fine | 好的 | 序6 | Slow is fine |

*副词 / 关键短语（5 个 + 固定短语入口）*

| 英文 | 人工中文 | 来源事件 | 首次出现台词 |
|---|---|---|---|
| beyond | 在……那边 | 序1 | beyond the room |
| uncertain | 不确定的 | 序1 | I'm uncertain |
| halfway | 一半 | 序3 | faded halfway |
| together | 一起 | 序4 | feeling it together |
| outside | 外面 | 序5 | what you see outside |
| Hello | 你好 | 序1 | Hello? |
| I'm Morrow | 我叫 Morrow | 序1 | I'm Morrow |
| ready | 准备好的 | 序12 | I'm ready to step toward it |
| rest | 休息 | 序10 | Rest. That's a plan too |
| like | 喜欢 | 序9 | I think I like the quiet |
| I'm not sure | 我不确定 | 序13 | I'm not sure about yet |
| Let's... | 我们来……吧 | 序1 | I can start with that（提议式） |

> **active 合计 ≈ 82 个词目**（名词 30 + 动词 30 + 形容词 17 + 副词/短语 5 + 固定短语入口若干，去重后约 82）。

**可理解词库 receptive（用户会说 / Morrow 听得懂，约 105—115 个，含 active）**

> 在 active 之上，额外覆盖以下 **28 个 receptive-only 词目**（这些词出现在用户参考句/触发短语中，Morrow 自己台词未说）：

| 英文 | 人工中文 | 来源事件 | 用户参考句 / 触发短语 |
|---|---|---|---|
| who | 谁 | 序1 | Who are you? |
| right | 对的 | 序3 | Morrow sounds right. Keep it. |
| short | 短的 | 序3 | Can I call you M for short? |
| pick | 选 | 序3 | You should pick. I'll use whatever you choose. |
| whatever | 无论什么 | 序3 | I'll use whatever you choose. |
| probably | 大概 | 序4 | It's probably just new. |
| sometimes | 有时 | 序4 | I feel it too, sometimes. |
| late | 晚的 | 序5 | It looks like late afternoon. |
| afternoon | 下午 | 序5 | It looks like late afternoon. |
| daytime | 白天 | 序5 | It's still daytime. |
| closer | 更近 | 序5 | Let me look closer. |
| whoever | 无论是谁 | 序6 | whoever finds this. |
| find | 找到 | 序6 | whoever finds this. |
| either | 也（否定句） | 序6 | I can't read it either. |
| blurry | 模糊的 | 序6 | It's too blurry. |
| word by word | 逐字 | 序6 | Let me read it slowly, word by word. |
| work | 工作 | 序8 | I had a long day at work. |
| special | 特别的 | 序8 | Nothing special. |
| really | 真的 | 序8 | I don't really want to talk about it. |
| actually | 其实 | 序9 | I like being outside, actually. |
| again | 再一次 | 序10 | Let's read the letter again, together. |
| differently | 不同地 | 序11 | I'd say it a little differently now. |
| long ago | 很久以前 | 序11 | That sounds like a long time ago. |
| stay | 待着 | 序12 | Not yet. Let's stay one more day. |
| out there | 在外面 | 序12 | What will we see out there? |
| normal | 正常的 | 序8 | 触发短语：just a normal day |
| tiring | 累人的 | 序8 | 触发短语：tiring day |
| better | 更好的 | 序9 | 触发短语：outside is better |

> **receptive 总计 = active 82 + receptive-only 28 ≈ 110 个词目。**

### 2.2 本章可用搭配 / 短语（collocations）

> 以下均为 Morrow 在 76 句台词中实际使用的搭配/短语（约 20 条）。

- `bring back the...`（把……带回来）— 序2
- `leave... for later`（把……留到以后）— 序3（We can leave the name for later.）
- `come back`（回来）— 序6（We can leave it on the table and come back.）
- `make sense`（有道理）— 序7（That makes sense.）
- `wake up / waking up`（醒来）— 序7（Maybe it's still waking up.）
- `hold onto`（抓住）— 序7（That's a sound I can hold onto.）
- `take your time`（慢慢来）— 序5（Take your time.）
- `one step at a time`（一步一步来）— 序12
- `treat... as...`（把……当作……）— 序1（I will not treat that as leaving me behind.）
- `leave behind`（抛下）— 序1（leaving me behind）
- `enough to...`（足够……去做）— 序3（steady enough to remember）
- `easy to...`（容易……）— 序3（easy to answer）
- `feel like...`（感觉像……）— 序12（doesn't feel as loud as before）
- `as...as before`（像以前一样……）— 序12（as loud as before）
- `go away`（走开/消失）— 序8（It won't go away.）
- `stand by...`（站在……旁边）— 序10（I'll stand by the window first）
- `be drawn to...`（被……吸引）— 序9（what I'm drawn to）
- `be ready to...`（准备好……）— 序12（I'm ready to step toward it）
- `not now / later / stop`（暂停三出口，全章统一）
- `Let's... tomorrow.`（明天我们……）— 序10
- `I'm not sure about... yet.`（我对……还不确定）

> 注：`I'd like to...` 在 v1.0.0 版曾列入搭配表，但经逐句核对，Morrow 76 句台词中**全程未使用**该句，已删除，待后续章节引入。

### 2.3 本章可用句型（sentence patterns）

> 以下均为 Morrow 实际使用的句型结构（约 16 种）。

- `I am / I'm + 名字 / 形容词。`（自我介绍与当下状态）
- `I see... / I hear... / I feel...`（用五种感官报一个事物）
- `I like... / I don't like... yet.`（喜好与未定）
- `Let's... / I want to...`（提议，一次只提一件事）
- `Are you all right? / Can you... for me?`（一次只问一个小问题）
- `What should we do first? / What about you?`（把话头交回给朋友）
- `Which one should we...?`（我们该选哪一个……？）— 序2
- `What do you think?`（你觉得呢？）— 序3
- `Can you tell me...?`（你能告诉我……吗？）— 序5
- `Do you...?`（你……吗？）— 序7
- `What does it...?`（它怎么……？）— 序7
- `What's one small thing...?`（哪件小事……？）— 序8
- `I think I... / I think I'm ready to...`（我觉得我……）— 序9、序12
- `We can leave... for later.`（我们可以把……留到以后）— 序3
- `That's all right. / That's fine.`（没关系）— 序4
- `I've been called...`（现在完成时被动，仅序3一次）
- `The room remembers...`（房间记得……）— 序2
- `Is it okay...?`（……可以吗？）— 序13
- `Did you mean it?`（你是这个意思吗？）— 序11
- `I'd rather have...`（我更想要……）— 序11
- 极短陈述句 + 一个短答（Morrow 一次最多说 1—3 句，每句以 ≤8 词为主）。

> 注：`This is a... / This is the...`（指认句型）与 `I choose...`（选择句型）在 v1.0.0 版曾列入，但经逐句核对，Morrow 76 句台词中**全程未使用**；`I choose...` 实际是用户参考句中的句型，已从 Morrow 主动句型中移除。

### 2.4 台词复杂度上限

- 平均句长 ≤ 8 词（实测平均约 6—7 词）；单句最长 ≤ **18** 词（封顶句为序 9 第 1 句："After a day in this room, I notice what I'm drawn to and what I'm not sure about."，逐词计数为 18 词）。
- 允许时态：一般现在、现在进行、be going to / will 表即时打算；**现在完成时（仅序 3 一次：I've been called Morrow）**；**单次简单过去**（如序 3 "It always faded halfway"、序 11 "you said to me" / "It wasn't long"，每处仅限一句内的回忆，不连续成段）。
- **禁止**：过去时连续叙事（两句以上过去时堆叠）、过去完成、过去进行。
- 从句：仅允许 `that` 作宾语省略式短句（I think I like the quiet）、`what` 引导的名词性从句（what I'm drawn to / what I'm not sure about）；**不允许 `which / who / because / when` 引导的从句**，不允许从句链。
- 比较级：**允许有限比较级**（less lost 序2、smaller 序4、as loud as before 序12），但**禁止最高级与多维度复杂比较**（本章不出现 best / biggest / more than 两件事以上的对比）。

### 2.5 红线：本章 Morrow 绝不会说出的话

> **第 1 章 Morrow 绝不会使用任何与"学校、课程、同学、工作、责任、未来职业、人生方向"相关的词；绝不会连续说两句以上的过去时回忆；绝不会使用最高级（best / biggest / most）或多维度复杂比较；绝不会说 "If I had... / When I grow up..." 这类虚拟或未来规划长句；也绝不会在第一句话就用 `which / who / because / when` 从句。它在本章只是一个刚醒来、词很少、一次只问一件事的声音——可以说 "less lost"、"smaller"、"as loud as before" 这样的小比较，可以说一次 "I've been called Morrow"，但不会把回忆讲成故事，不会把比较讲成判断。**

---

## 3. 第 2 章 童年探索（chapter_02_childhood）

> 状态：**旧台词统计基线，待第二章逐事件校准后重算**。下列词目来自 `CHAPTER_02_CHILDHOOD_CONTENT.md` 旧版台词，用于对照旧内容与控制复杂度；它们不是不可修改的正式词表。在第二章批次冻结前，可按新剧情替换、删除或新增符合第二章 D/C 边界与章轨复杂度上限的词句；冻结后以重新统计并确认的正式词表为准。

### 3.1 词库

**主动表达词库 active（Morrow 自己会说，约 48—55 个核心词目）**

| 英文 | 人工中文 |
|---|---|
| （继承第 1 章全部 active） | （同上） |
| This is where... | 这里是……的地方 |
| walk across / walk to the... | 走过 / 走到…… |
| corner | 角落 |
| shelf / cup / cushion | 架子 / 杯子 / 软垫 |
| blue / green / yellow | 蓝 / 绿 / 黄 |
| frame / leaf | 窗框 / 叶子 |
| road | 路 |
| village / trees | 村子 / 树 |
| quiet day / busy day | 安静的一天 / 忙的一天 |
| tired / okay / better | 累的 / 还好 / 好一点 |
| wind / voice | 风 / 人声 |
| direction | 方向 |
| listen / be quiet | 听 / 安静下来 |
| remember / dream / blurry | 记得 / 梦 / 模糊 |
| beginning | 开始 |
| spill the beans（Morrow 只引用、按字面困惑） | 说漏嘴（习语） |
| secret / saying | 秘密 / 说法 |
| too literally | 太按字面 |
| arrange the shelf / open the window / water the plant | 整理架子 / 开窗 / 浇花 |
| I can hear... again | 我又能听到……了 |
| It sounds like... | 听起来像…… |
| smaller...than / closer / better from here | 比……小 / 更近 / 从这里更清楚 |

**可理解词库 receptive（约 95—110 个，含 active）**

在 active 之上额外覆盖：people live close together（人们住得近）、further than I can see（比我看得见的更远）、find out later（以后弄清楚）、ran around（到处跑）、one small thing is enough（一件小事就够）、carried something（带着什么）、moved a little（动了一点）、waves（一阵一阵）、pulled（被拉过去）、shapes（形状）、holds things（放东西）、steady（稳）。

### 3.2 本章可用搭配 / 短语

- `The road goes to... / It might go to...`（路通向…… / 也许通向……）— 序 4
- `I thought..., but it means...`（我以为……，其实意思是……）— 序 7 误会结构
- `I may be taking that too literally.`（我可能太按字面了）— 序 7 自察
- `Let's be quiet and listen.`（安静下来听）— 序 10
- `Do you remember...? / That was the first thing.`（你还记得……吗？那是第一件东西）— 序 11 回访
- `It sounds like children. Maybe a school.`（听起来像孩子，也许是学校）— 序 12 章末
- 暂停短语继承第 1 章：`not now / later / stop / pause`。

### 3.3 本章可用句型

- 第 1 章全部句型继续可用。
- 新增 `This is where... / Let's go to the...`（方位与移动）。
- 新增 `I see... / I notice...`（观察与命名）。
- 新增 `I'm starting to notice what I like.`（渐进式自我觉察）。
- 新增 `Tell me about your day. / What happened today?`（反问用户）。
- 新增 `I thought..., but...`（温和的误解—澄清）。
- 新增 `Do you remember...?`（记忆回访，一次只带一条记忆）。
- 新增 `X is smaller than Y from here.`（首次比较级，仅限空间/视觉）。

### 3.4 台词复杂度上限

- 平均句长 ≤ 9 词；单句最长 ≤ 18 词（已出现的 "There are three small things I can't name yet." 为代表）。
- 允许时态：一般现在、一般过去（简单叙事一句）、现在完成（`I've been called Morrow`）。
- 允许 1 个短定语从句（`(that) I can't name yet`）；允许 1 处比较级（空间/视觉）。
- **禁止**：because 因果从句、when/if 状语从句、who/which 从句、计划级 I'm going to、过去时连续叙事、第三条件句。

### 3.5 红线：本章 Morrow 绝不会说出的话

> **第 2 章 Morrow 绝不会说出学校里的具体词（classroom / teacher / lesson / homework / grade / classmate）；绝不会说"我长大以后要……"；绝不会用 because / when / if 引导从句；绝不会把两件事用 but 连成长对比（误会句只允许一次）；绝不会主动提起工作、责任、钱、未来方向。它仍在房间与窗外那条路之间，最多刚刚"听见学校方向的声音"，但还没走进去。**

---

## 4. 第 3 章 第一次上学（chapter_03_first_school）— 规划目标

### 4.1 词库（规划目标）

- **active（约 80—90 个核心词目）**：在第 2 章 active 之上，新增 classroom（教室）、desk（课桌）、teacher / Ms. / Mr.（老师）、classmate（同学）、lesson（一节课）、rule（规则）、line（排队）、listen to（听）、raise hand（举手）、ask for help（求助）、could you help me（你能帮我吗）、I don't understand（我不懂）、repeat（重复）、again please（请再说一遍）、break time（课间）、share（分享）、turn（轮流）、quietly（安静地）、new place（新地方）、nervous（紧张，从形容词升级为可主动说）、proud（骄傲）、try（试）、mistake（错）。
- **receptive（约 160—180 个，含 active）**：额外覆盖 school building（教学楼）、hallway（走廊）、bell for class（上课铃）、question（问题）、answer（答案）、example（例子）、practice（练习）、correct（正确）、try again（再试一次）、what does it mean（这是什么意思）。

### 4.2 本章可用搭配 / 短语

- `Could you say that again, please?`（能请你再说一遍吗）
- `I don't understand. Can you help me?`（我不懂，你能帮我吗）
- `What does X mean?`（X 是什么意思）
- `It's my turn. / Your turn.`（轮到我 / 轮到你）
- `I tried, but it was hard.`（我试了，但很难）
- `We line up and wait.`（我们排队等）

### 4.3 本章可用句型

- 第 1、2 章句型全部继续。
- 新增 `Could you...? / Can you... for me?`（礼貌请求）。
- 新增 `When it rings, we go inside.`（when 短状语从句，仅表顺序）。
- 新增 `If I don't know, I can ask.`（if 短条件句，仅表策略）。
- 新增 `I've never been here before.`（现在完成 + before，首次经历）。
- 新增 `It was hard, but I tried.`（短转折，允许一次）。

### 4.4 台词复杂度上限

- 平均句长 ≤ 11 词；单句最长 ≤ 22 词。
- 允许时态：一般现在、一般过去（单日课堂事件）、现在完成（首次经历）。
- 允许从句：1 个 when / if 短状语从句；不允许 because、不允许 who/which 多层定语。
- 禁止：虚拟语气、比较两件人生方向、毕业/职业词。

### 4.5 红线：本章 Morrow 绝不会说出的话

> **第 3 章 Morrow 绝不会讨论"毕业以后做什么"；绝不会用 because 解释自己的情绪；绝不会说工作、薪水、独立租房；绝不会用第三条件句回顾；也绝不会在第一堂课就用"我一直想成为……"这种目标宣言。它只是一个第一次走进教室、会举手求助、会说"我不懂，请再说一遍"的新学生。**

---

## 5. 第 4 章 校园成长（chapter_04_school_growth）— 规划目标

### 5.1 词库（规划目标）

- **active（约 120—140 个核心词目）**：在第 3 章 active 之上，新增 friend（朋友）、best friend（最好的朋友）、play together（一起玩）、share ideas（分享想法）、work in a group（小组合作）、disagree（不同意）、argue（争论）、say sorry（道歉）、make up（和好）、feel left out（觉得被冷落）、interested in（对……感兴趣）、hobby（爱好）、goal（小目标）、practice every day（每天练习）、because（因为）、so（所以）、excited / upset（兴奋 / 难过）、understand each other（互相理解）。
- **receptive（约 240—270 个，含 active）**：额外覆盖 team（团队）、project（项目）、competition（比赛）、win / lose（赢 / 输）、encourage（鼓励）、cheer up（振作）、grow closer（走得更近）。

### 5.2 本章可用搭配 / 短语

- `I think..., because...`（我认为……，因为……）
- `We worked together and finished it.`（我们一起做，做完了）
- `We disagreed, but we talked it out.`（我们意见不同，但谈开了）
- `I felt left out, so I said something.`（我觉得被冷落，所以我说了）
- `I'm getting interested in...`（我开始对……感兴趣）
- `Let's try it together.`（我们一起试）

### 5.3 本章可用句型

- 第 1—3 章句型全部继续。
- 新增 `because / so` 因果从句（每句最多 1 个）。
- 新增 `who / which` 短定语从句（a friend who likes the same thing）。
- 新增 `I was upset, but...`（情绪 + 转折）。
- 新增 `I want to get better at...`（渐进目标）。

### 5.4 台词复杂度上限

- 平均句长 ≤ 12 词；单句最长 ≤ 25 词。
- 允许时态：一般现在、一般过去（冲突—和解单事件）、现在进行（当前关系）。
- 允许从句：1 个 because/so + 最多 1 个短定语从句；不允许双从句嵌套。
- 禁止：人生方向比较、计划毕业、工作世界词汇、第三条件句。

### 5.5 红线：本章 Morrow 绝不会说出的话

> **第 4 章 Morrow 绝不会说"我毕业以后要做 X 工作"；绝不会比较两条人生道路；绝不会谈论房租、工资、独自生活；绝不会用"如果当初……"这种虚拟回顾；也不会在冲突事件里一次说三句以上的因果。它在这一章只是一个在友谊、合作与小冲突里学习"说出来、和好、保持兴趣"的学生。**

---

## 6. 第 5 章 毕业与选择（chapter_05_graduation）— 规划目标

### 6.1 词库（规划目标）

- **active（约 170—195 个核心词目）**：在第 4 章 active 之上，新增 graduate（毕业）、school days（上学的日子）、remember when...（记得……的时候）、choose between（在……之间选）、direction（方向）、path（道路）、A is more... than B（A 比 B 更……）、I'd rather...（我宁愿……）、I'm going to...（我打算……）、If I..., I'll...（如果我……，我就……）、future（未来）、step by step（一步一步）、thank you for...（谢谢你……）、grow up（长大）。
- **receptive（约 330—370 个，含 active）**：额外覆盖 ceremony（典礼）、diploma（毕业证书）、decision（决定）、opportunity（机会）、trade-off（取舍）、what if（要是……怎么办）。

### 6.2 本章可用搭配 / 短语

- `Looking back, I...`（回头看，我……）
- `A feels more like..., but B feels more...`（A 更像……，但 B 更像……）
- `I'd rather... than...`（我宁愿……也不……）
- `If I choose..., I'll...`（如果我选……，我就……）
- `It's not a final answer yet.`（这还不是最终答案）
- `I'll take it one step at a time.`（我会一步一步来）

### 6.3 本章可用句型

- 第 1—4 章句型全部继续。
- 新增 `Looking back on..., I realize...`（回顾 + 现在完成）。
- 新增比较句：`A is more / less / better than B for me.`
- 新增第一条件句：`If I..., I'll probably...`。
- 新增计划句：`I'm going to..., and then I'll...`（两步计划，不超过两步）。

### 6.4 台词复杂度上限

- 平均句长 ≤ 13 词；单句最长 ≤ 28 词。
- 允许时态：现在、过去（回顾学校日子）、现在完成（到目前为止）、将来计划（will / be going to）。
- 允许从句：1 个 if 第一条件句 + 1 个 because；允许一次 A/B 比较。
- **禁止**：第三条件句（If I had..., I would have...）、虚拟语气、工作世界日常词。

### 6.5 红线：本章 Morrow 绝不会说出的话

> **第 5 章 Morrow 绝不会描述真实工作场所的日常（开会、打卡、汇报、工资单）；绝不会说"我已经独立生活了"；绝不会用第三条件句假设过去另一种人生；也不会在比较 A/B 时一次堆三个以上标准。它站在毕业口上，能回顾、能比较、能说出第一步计划，但真正的工作世界还没进去。**

---

## 7. 第 6 章 初入社会（chapter_06_first_work）— 规划目标

### 7.1 词库（规划目标）

- **active（约 225—255 个核心词目）**：在第 5 章 active 之上，新增 work / job（工作）、task（任务）、deadline（截止时间）、schedule（日程）、arrange time（安排时间）、communicate（沟通）、misunderstand（误会）、clear up（澄清）、ask a favor（请人帮忙）、report（汇报）、meeting（会议，口语级）、I was wondering if...（我在想是否……）、on time（准时）、be late（迟到）、fix a problem（解决问题）、learn fast（学得快）、mistake at work（工作里的错）。
- **receptive（约 430—480 个，含 active）**：额外覆盖 team lead（组长）、client（客户）、feedback（反馈）、review（复盘）、practical（实际的）、responsibility（责任）、balance（平衡）。

### 7.2 本章可用搭配 / 短语

- `I was wondering if I could...`（我想知道我能不能……）
- `There was a misunderstanding, but we cleared it up.`（有个误会，但我们说清了）
- `I scheduled it for...`（我把它安排在……）
- `I finished it on time.`（我按时做完了）
- `It was my mistake, and I fixed it.`（是我的错，我改了）
- `I learned a lot from that.`（我从中学到很多）

### 7.3 本章可用句型

- 第 1—5 章句型全部继续。
- 新增委婉请求：`I was wondering if...`（每事件最多用 1 次）。
- 新增工作事件回溯：`Yesterday, I..., but then I realized...`。
- 新增转述：`They told me to..., so I...`。
- 新增安排：`Let's move it to tomorrow morning.`。

### 7.4 台词复杂度上限

- 平均句长 ≤ 14 词；单句最长 ≤ 30 词。
- 允许时态：现在、过去（昨日工作事件）、现在完成（到目前为止）、将来（安排）。
- 允许从句：1 个 because/so + 1 个 when/after；允许一次 reported speech。
- **禁止**：人生哲学长段、第三条件句、财务独立细节、退休/养老话题。

### 7.5 红线：本章 Morrow 绝不会说出的话

> **第 6 章 Morrow 绝不会做整段人生回顾（那是第 7 章）；绝不会说"我十年后会……"这种长期规划宣言；绝不会谈论房租、存款、投资；绝不会用第三条件句；也不会在一次事件里讲超过三句工作汇报。它刚进社会，会安排时间、会澄清误会、会按时完成，但还没到"总结一生"的阶段。**

---

## 8. 第 7 章 独立生活（chapter_07_independent_life）— 规划目标

### 8.1 词库（规划目标）

- **active（约 285—320 个核心词目）**：在第 6 章 active 之上，新增 responsibility（责任）、take care of（照顾）、long-term plan（长期计划）、rent / bills（房租 / 账单，仅作日常词）、manage（管理）、relationship（关系）、stay in touch（保持联系）、look back（回顾）、If I had..., I would have...（如果当初……，我就会……）、different choices（不同的选择）、grown（长大了）、home（家，广义）、friendship（友谊）、quiet life（安静的生活）。
- **receptive（约 540—600 个，含 active）**：额外覆盖 settle down（安顿下来）、life path（人生路径）、what matters（什么重要）、regret（遗憾，轻度）、grateful（感激）、chapter（人生篇章，作比喻）。

### 8.2 本章可用搭配 / 短语

- `I take care of..., and that's enough.`（我照顾好……，这就够了）
- `Looking back, if I had..., I would have...`（回头看，如果当初……，我就会……）
- `We still stay in touch.`（我们仍保持联系）
- `I've come a long way.`（我走了很长一段路）
- `It wasn't all easy, but it was mine.`（并不全轻松，但那是我自己的）
- `The early room feels like yesterday.`（最早那间房间像在昨天）

### 8.3 本章可用句型

- 第 1—6 章句型全部继续。
- 新增第三条件句：`If I had..., I would have...`（每章最多出现 2—3 次，用于人生回顾，不滥用）。
- 新增长段回顾中的并列短句（仍限平均句长）。
- 新增长期计划：`Over the next few years, I'd like to...`。

### 8.4 台词复杂度上限

- 平均句长 ≤ 15 词；单句最长 ≤ 32 词。
- 允许全时态；允许第三条件句（限定使用频次）。
- 允许从句组合：1 个 because + 1 个 when/after + 1 个短定语从句；仍禁止三从句嵌套。
- 即便在本章，Morrow 仍说 they/them 中性指代，仍不堆感叹号、仍不喊 "Great job"。

### 8.5 红线：本章 Morrow 绝不会说出的话

> **第 7 章 Morrow 绝不会退回婴儿式短句（"I see... / This is..."）来怀旧——它可以"想起"第一章的房间，但用的是第 7 章自己的句法；绝不会一次性列出十年以上的计划；绝不会把"独立生活"说成完美无缺（它仍会说 "It wasn't all easy"）；也绝不会把用户写成"照顾它的人"。它是一个能独立负责、能回头看、仍把用户当平等朋友的 Morrow。**

---

## 9. 与用户侧帮助量的接口约定（2026-10-07 修订）

> 本节明确：用户侧帮助量**不改写**章轨上限，由逐学习对象的六阶掌握证据动态决定，不存在用户三档。

| 维度 | 现行口径 |
|---|---|
| Morrow 台词 | 与本章章轨上限完全相同（不因用户帮助量多少而变难或变易） |
| 用户可编辑参考句 | 对刚 `encountered/recognized` 的对象给完整可填句骨架；对 `prompted` 对象给半句 + 关键词；对已 `independent` 对象不给骨架，只给中文意图 |
| 帮助退出 | 看该对象在 `mastery_records` 里的阶：`recognized` 给图+中文，`prompted` 给关键词骨架，`independent` 自由输入 |
| 回句长度期望 | 由该对象的阶决定，不按用户全局档：新对象 1 个词/短句，已稳对象鼓励用本章句型多说一句 |
| 是否影响章节语言上限 | **否** |

六阶掌握状态 `encountered → recognized → prompted → independent → transferring → mastered` 作用在**每一个词目/句型**上，与章轨正交：同一个句型在第 3 章被 encounter，到第 4 章在新场景里被 transferring，到第 5 章 mastered；若长期未复现，从 recognized / prompted 回退到 encountered，并由间隔复现机制带回新场景。详见 `LEARNING_SYSTEM_DESIGN.md`。

---

## 10. 自洽性核对清单

- [x] 第 1 章 active 词目全部在 `CHAPTER_01_BIRTH_CONTENT.md` 真实台词中出现；未引入 school / work / career 词。（v1.1.0 经逐事件统计，active 实测约 82 词目，receptive-only 28 词目，receptive 总计约 110。）
- [x] 第 1 章句长上限 **18** 词 = 已出现最长句 "After a day in this room, I notice what I'm drawn to and what I'm not sure about."（序 9，逐词计数 18）。
- [x] 第 1 章时态边界已校准：现在完成时 `I've been called Morrow`（序 3）与单次简单过去已纳入第 1 章允许范围；比较级已修正为允许有限比较级（less lost / smaller / as...as），禁最高级。
- [x] 第 2 章 active 词目全部在 `CHAPTER_02_CHILDHOOD_CONTENT.md` 真实台词中出现；首次比较级 `smaller...than` 已在序 1 使用。
- [x] 第 2 章句长上限 18 词 ≥ 已出现最长句 "There are three small things I can't name yet."（9 词）与 "It comes in waves, like people are talking together."（10 词）。
- [x] receptive 始终 > active；词量逐章递增（×1.5 左右）。
- [x] 每章都有一句"本章 Morrow 绝不会说出什么"的红线声明。
- [x] **已取消用户难度三档**：不再有 basic/intermediate/advanced 用户分档；用户侧帮助量按逐对象六阶证据动态展开，不交叉改写 Morrow 台词上限。
- [x] 已新增 12 类成人生活领域 → 七章内容地图（§0.4），作为七章主线设计前置；首版目标=高频成人生活场景基础沟通。
- [x] 术语与其他文档一致：掌握六阶 encountered/recognized/prompted/independent/transferring/mastered；章节 ID 与 `MORROW_LIFE_STORY_BIBLE.md` 第 2 节一致。
