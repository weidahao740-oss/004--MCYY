# LEARNING_SCENARIO_LIBRARY — Morrow 成长学习情景库（阶段 3.5.4，2026-10-10 修订）

> 版本：1.1.1
> 项目：成人英语 AI 宠物 Morrow（墨洛）
> 依据：`MORROW_LIFE_STORY_BIBLE.md` v1.0.0（七章主线、三类事件）、`FIXED_CONTENT_CONTRACT.md` v1.0.0、`CHAPTER_01_BIRTH_CONTENT.md` v1.0.0（13 事件）、`CHAPTER_02_CHILDHOOD_CONTENT.md` v1.0.0（12 事件）、`MORROW_LANGUAGE_CURRICULUM.md` §0.4（12 类成人生活领域 D1–D12）。
> 本库只做"学习情景"一层的编排：把已存在/规划中的成长事件映射到成人生活领域、真实沟通任务、英语学习能力、交互结构与掌握证据。它不改写事件 ID、世界状态与分支逻辑；事件正文仍以两章内容文件为准。
> 2026-10-07 修订：**取消用户难度三档**；原"基础/中等/进阶三档做什么"列改为"理解练习 / 句子搭建 / 最终真实输出"三段式（一段一个证据层）；新增生活领域与真实沟通任务列；同一答案不连续重复考，选图仅算 recognized、提示下跟读仅算 prompted。

## 0. 口径与术语（全库逐字使用，不得替换同义词）

**事件数量口径（重要）**：计划文档口头称“首两章 24 个事件”，但实际内容文件为 **25 个（第一章 13 / 第二章 12）**，本库已按实际 25 个全量映射，一个不漏。第一章 13 个：`birth_first_voice_v1`、`b1_first_room_object_v1`、`b1_remember_name_v1`、`b1_first_feeling_v1`、`b1_window_light_v1`、`b1_first_letter_v1`、`b1_bell_sound_v1`、`b1_ask_about_you_v1`、`b1_what_i_like_v1`、`b1_tomorrow_plan_v1`、`b1_return_first_words_v1`、`b1_ready_for_outside_v1`、`b1_not_sure_v1`。第二章 12 个：`b2_room_tour_v1`、`b2_name_objects_v1`、`b2_colors_v1`、`b2_outside_road_v1`、`b2_today_you_v1`、`b2_my_likes_v1`、`b2_mistake_v1`、`b2_small_task_v1`、`b2_feeling_check_v1`、`b2_sound_comes_back_v1`、`b2_recall_room_v1`、`b2_ready_for_school_v1`。旧 `birth_restore_object_v1` 已 `retired`，只作历史映射，不计入现行 25 事件。

**掌握六阶（逐字）**：初次接触 encountered / 能识别 recognized / 提示下会用 prompted / 独立会用 independent / 迁移中 transferring / 稳定掌握 mastered。

**事件三段式（逐字，替代原三档）**：每个事件通常 = **一个理解练习**（听音选图/图片选择/指向命名，最高 recognized）+ **一个句子搭建**（语块组合/预设填词，只填新成分，最高 prompted）+ **一个最终真实输出**（剧情行动里独立说一句，冲 independent）。填空与排序不叠加；同一答案不连续重复考。

**生活领域（逐字，2026-10-07 新版 D 字典，来自课程大纲 §0.4）**：D1 自我与基本信息 / D2 家庭与人物关系 / D3 居家与生活用品 / D4 食物与用餐 / D5 时间、天气与日常安排 / D6 衣服、购物与付款 / D7 地点、交通与问路 / D8 学校与学习 / D9 工作与电子产品 / D10 兴趣、体育与娱乐 / D11 身体、健康与求助 / D12 朋友、社交与公共服务。沟通能力（认识事物/执行动作/描述世界/表达自己/解决问题/社会沟通六类）是与领域正交的独立维度，不替代 D 领域分类。

**六类学习能力（逐字）**：认识事物 recognizing / 执行动作 doing / 描述世界 describing / 表达自己 expressing / 解决问题 problem-solving / 社会沟通 social。

**12 种交互结构（逐字，必须轮换）**：指向命名、听词找物、图片/声音选择、描述特征、纠正误认、执行指令、排列顺序、表达偏好、解释原因、比较方案、协作完成、记忆回访。

> 本产品不设用户难度三档（basic/intermediate/advanced）。Morrow 全程用 they/them 中性指代；每条英文必配人工中文译文。

---

## A. 首两章 25 个事件逐项映射表

> 说明：每行一个事件，不许留空、不许合并行。"核心表达"取各事件正文"英语学习目标"的 1—2 个目标句；"必要新词"为本事件新教的词/语块；"旧表达复现"为本事件带回的上一章/上一事件旧句；"最终真实输出"指用户无需提示即可独立说出、并能推动该事件结算的表达（冲 independent；只认词事件可为必要单词跟读/识别结算，不强迫完整句）。三段式（理解→搭建→输出）按 §0 统一执行，不在每行重复。生活领域代码见 §0 D1–D12（2026-10-07 新版字典，与 [`LIFE_DOMAIN_SEVEN_CHAPTER_MAP.md`](./LIFE_DOMAIN_SEVEN_CHAPTER_MAP.md) v2.1.0 一致）；"真实沟通任务"列对应地图 §2 沟通能力维度 C1—C9，与生活领域正交。

| 事件ID | 中文名 | 生活领域 | 真实沟通任务 | 学习能力/交互结构 | 核心表达（1—2） | 必要新词 | 旧表达复现 | 最终真实输出（掌握证据） |
|---|---|---|---|---|---|---|---|---|
| `birth_first_voice_v1` | 苏醒后的第一句话 | D1 自我与基本信息 | 第一次回应、问对方身份 | social / 中文意图选择 + 真实录音确认 | `Yes, I’m here.`；`Hi. I can hear you.`；`Who are you?`（三选一，只学所选） | 所选路线的自然语块 | 无（首事件） | 所选完整句完成真实录音、ASR 与用户确认后，结算 `first_response_style = reassuring_presence / friendly_greeting / identity_check`；只给所选路线记证据 |
| `b1_first_room_object_v1` | 陪 Morrow 认识房间第一件物品 | D1 自我与基本信息 | 告诉新朋友自己先注意到哪件物品 | identifying / 中文物品选择 + 语块搭建 + 真实录音确认 | `I noticed the [object] first.` | 所选 `the lamp / the plant / the small bell` + `I noticed...first` | E01-01 只作关系回声，不紧邻重考 | 所选完整句完成必需教学、真实录音、ASR 与确认后结算 `first_shared_object`；系统按既有证据裁剪重复教学，用户不可跳过当前必需步骤 |
| `b1_remember_name_v1` | 给自己起一个称呼 | D1 自我与基本信息 | 征求对方意见、定一个称呼 | expressing / 比较方案 | `What do you think?`；`I'll keep...` | name / keep / short / decide | 无 | 用 `What do you think?` 向 Morrow 征求意见，而非只点选（独立用征求意见句型） |
| `b1_first_feeling_v1` | 说出现在的感觉 | D1 自我与基本信息 | 命名一种当下感觉 | expressing / 描述特征 | `I feel...`；`It's just...` | new / nervous / soft；feel | 无 | 用 `I feel...` 或 `It's just new.` 命名一种感觉（recognized→prompted） |
| `b1_window_light_v1` | 看窗外的光 | D1 自我与基本信息 | 描述看到的景象 | describing / 描述特征 | `The light is...`；`It's warm outside.` | warm / high / light | 无 | 用形容词独立描述光的冷暖（independent） |
| `b1_first_letter_v1` | 一封看不懂的信 | D1 自我与基本信息 | 请人读东西、转述书面内容 | social / 协作完成 | `Can you read this?`；`It says...` | read / says / blurry / together | 无 | 用 `It says...` 转述书面内容给 Morrow（prompted→independent） |
| `b1_bell_sound_v1` | 找回一个声音 | D1 自我与基本信息 | 辨认一个声音并指认 | recognizing / 图片声音选择 | `It sounds like...`；`I hear a...` | bell / sound / hear | 无 | 用 `It sounds like...` 独立指认一个声音（recognized→prompted） |
| `b1_ask_about_you_v1` | Morrow 反过来问你 | D1 自我与基本信息 | 分享自己一天的一件事 | social / 描述特征 | `What happened today?`；`I had a... day.` | day / long / ordinary / tired | 无 | 用 `I had a ... day.` 独立分享自己的一天（independent） |
| `b1_what_i_like_v1` | 我喜欢和还不确定的事 | D1 自我与基本信息 | 说喜欢/还不确定 | expressing / 表达偏好 | `I like...`；`I'm not sure about... yet.` | like / quiet / outside / sure | 无 | 用 `I like...` 或 `I'm not sure about... yet.` 独立表达喜好（independent） |
| `b1_tomorrow_plan_v1` | 一起定一个明天的小计划 | D1 自我与基本信息 | 约定一件明天的小事 | social / 协作完成 | `Let's... tomorrow.`；`What shall we do tomorrow?` | tomorrow / plan / rest / read | 无 | 用 `Let's... tomorrow.` 独立提出并约定一件小事（independent） |
| `b1_return_first_words_v1` | 记住你说过的第一句 | D1 自我与基本信息 | 确认或更新一句旧话 | social / 记忆回访 | `Did you mean it?`；`Yes, that's what I meant.` | meant / right / differently / ago | E01-01 用户已确认的所选完整表达 | 对旧记忆句做确认或更新（prompted→transferring） |
| `b1_ready_for_outside_v1` | 准备好走出门 | D1 自我与基本信息 | 表达是否准备好出门 | expressing / 比较方案 | `I'm ready to...`；`Let's go.`；`Not yet.` | ready / go / not yet / curious | 无 | 用 `I'm ready to...` / `Not yet.` 独立表达准备程度（independent） |
| `b1_not_sure_v1` | 一件还拿不准的小事 | D1 自我与基本信息 | 接纳不确定、不急着给答案 | expressing / 解释原因 | `I'm not sure about...`；`It's okay not to know yet.` | sure / okay / think / later | `I'm not sure...`（序9 喜好） | 用 `I'm not sure about...` 接纳不确定（independent） |
| `b2_room_tour_v1` | 第一次把房间走一遍 | D3 居家与生活用品 | 决定行走顺序并说目的地 | doing / 排列顺序 | `This is where...`；`Let's go to the...` | window / door / corner；walk to | 无 | 用 `Let's go to the...` 独立决定行走顺序（independent） |
| `b2_name_objects_v1` | 给房间里的东西命名 | D3 居家与生活用品 | 给物品命名并对上英文 | recognizing / 指向命名 | `This is a...`；`What do you call this?` | shelf / cup / cushion；name | 序2 lamp/plant/bell 命名 | 独立说出 `This is a...` 把形状和英文名对上（recognized→independent） |
| `b2_colors_v1` | 找出三种颜色 | D3 居家与生活用品 | 把颜色词锚到物品 | recognizing / 指向命名 | `I see...（颜色）` | blue / green / yellow；see | 序2 物品名 | 用 `I see ...（颜色）.` 把颜色词锚到具体物品（independent） |
| `b2_outside_road_v1` | 窗外那条路通向哪 | D5 时间、天气与日常安排 | 对未知作带理由的猜测 | describing / 解释原因 | `The road goes to...`；`It might go to...` | road / village / trees / might | 序5 窗外描述 | 用 `It might go to...` 对未知作带理由的猜测（prompted→independent） |
| `b2_today_you_v1` | 讲讲你今天发生了什么 | D5 时间、天气与日常安排 | 被问到时用短句讲一件事 | social / 描述特征 | `Tell me about your day.`；`What happened today?` | quiet / busy / something / happened | 序8 `I had a ... day.` | 被问到时用完整短句讲一件事（independent） |
| `b2_my_likes_v1` | 我渐渐知道自己喜欢什么 | D1 自我与基本信息 | 复述并确认偏好 | expressing / 表达偏好 | `I like...`；`I don't like... yet` | light / quiet / bell；like | 序9 `I like...` | 用 `I like...` 说出偏好（independent） |
| `b2_mistake_v1` | 一件小事误会了 | D5 时间、天气与日常安排 | 澄清一个误会/习语 | problem-solving / 纠正误认 | `I thought..., but it means...` | spill the beans / secret / literally | 无 | 用 `I thought..., but it means...` 澄清误会（prompted→transferring） |
| `b2_small_task_v1` | 一起做一件小事 | D3 居家与生活用品 + D4 食物与用餐 | 发起并完成一个协作小任务 | doing / 协作完成 | `Let's...`；`Can you help me...?` | arrange / open / water；help | 序2 `Let's bring back...` | 用 `Let's...` 或 `Can you help me...?` 发起协作（independent） |
| `b2_feeling_check_v1` | 今天感觉怎么样 | D5 时间、天气与日常安排 | 回答感受提问 | expressing / 表达偏好 | `How do you feel?`；`I feel...` | tired / okay / better；feel | 序4 `I feel...` | 用 `I feel...` 独立回答感受提问（independent） |
| `b2_sound_comes_back_v1` | 又有一点声音回来了 | D3 居家与生活用品 | 指认新声音并与旧声对比 | recognizing / 图片声音选择 | `I can hear... again.`；`The sound is back.` | wind / voice / quiet；hear again | 序7 `It sounds like...` | 用 `I can hear... again.` 指认新声音并对比旧声（transferring） |
| `b2_recall_room_v1` | 想起刚醒来那天的房间 | D3 居家与生活用品 | 参与对早期记忆的回访 | social / 记忆回访 | `Do you remember...?`；`That was the first day.` | remember / first / long ago | 序1—2 房间/物品 | 用 `Do you remember...?` 参与回访（transferring→mastered 钩子） |
| `b2_ready_for_school_v1` | 听见学校方向的声音 | D5 时间、天气与日常安排 | 指认人声来源 | describing / 图片声音选择 | `I hear... from that direction.` | children / school / direction | 序7 `It sounds like...` | 用 `I hear... from that direction.` 指认人声来源（independent） |

> 第一章 13 行结构分布：图片/声音选择(1,7)、指向命名(2)、比较方案(3,12)、描述特征(4,5,8)、协作完成(6,10)、记忆回访(11)、解释原因(13)。第二章 12 行结构分布：排列顺序(14)、指向命名(15,16)、解释原因(17)、描述特征(18)、表达偏好(19,21)、纠正误认(20)、协作完成(22)、图片/声音选择(23,25)、记忆回访(24)。首两章合计覆盖全部 12 种交互结构。每事件按 §0 三段式执行：理解练习最高 recognized，句子搭建最高 prompted，最终真实输出冲 independent。

---

## B. 第三至第七章候选情景库

> 章名（逐字）：第3章 第一次上学 `chapter_03_first_school`、第4章 校园成长 `chapter_04_school_growth`、第5章 毕业与选择 `chapter_05_graduation`、第6章 初入社会 `chapter_06_first_work`、第7章 独立生活 `chapter_07_independent_life`。
> 每个候选情景给：情景名（中文）/对应成长阶段/生活领域/学习目标/推荐交互结构/三段式学习（理解→搭建→最终输出）/掌握证据/复现入口。语言难度随章递增，但仍保持简单地道英文 + 人工中文。三段式里"基础/中等/进阶"旧称已改为"理解/搭建/输出"三段，不再是用户三档。

### 第 3 章 第一次上学（chapter_03_first_school）

| # | 情景名 | 对应成长阶段 | 生活领域 | 学习目标 | 推荐交互结构 | 三段式（理解→搭建→最终输出） | 掌握证据（独立表达点） | 复现入口 |
|---|---|---|---|---|---|---|---|---|
| 3-1 | 第一次走进教室 | 第一次上学 | D8 学校与学习 |  教室物品与位置；Where is...? / This is the... | 指向命名 | 理解：点选座位/门口/黑板；搭建：说 `This is the desk.`；输出：说 `My seat is by the window.` | 独立用 `This is the...` 命名教室物品（recognized→independent） | 第四章校园各场景；第七章回忆教室 |
| 3-2 | 认识第一位同学 | 第一次上学 | D2 家庭与人物关系（首次：人物介绍/同学关系）+ D1 自我与基本信息 + D12 朋友、社交与公共服务 |  打招呼与自我介绍；Hi, I'm... / What's your name? | 社会沟通（图片/声音选择） | 理解：点选 打招呼/问名字/微笑不说话；搭建：说 `Hi, I'm Morrow. What's your name?`；输出：补一句 `Nice to meet you.` | 用 `Hi, I'm...` 独立完成一次自我介绍与认识一位同学（independent） | 第四章交朋友；第六章见同事 |
| 3-3 | 听懂课堂规则 | 第一次上学 | D8 学校与学习 |  规则与请求帮助；Can I...? / Raise your hand. | 执行指令 | 理解：点选 举手/安静/问老师；搭建：说 `Can I open the window?`；输出：说 `May I ask a question?` | 用 `Can I...?` 礼貌请求，听懂课堂指令（prompted→independent） | 第四章课堂；第六章职场规则 |
| 3-4 | 找不到书包了 | 第一次上学 | D7 地点、交通与问路 |  寻找与方位；Where is...? / It's on/in... | 听词找物 | 理解：在图上点书包；搭建：说 `Where is my bag?`；输出：说 `It's under the chair.` | 用 `Where is...?` + `It's...` 完成一次寻找（independent） | 第四章值日/找东西；第七章收拾房间 |
| 3-5 | 铃声响了 | 第一次上学 | D5 时间、天气与日常安排 |  声音辨认与时间；That's the bell. / Time for... | 图片/声音选择 | 理解：点选 上课铃/下课铃；搭建：说 `That's the bell.`；输出：说 `Time for class.` | 用声音句独立判断上下课（transferring 自第二章铃声） | 第四章作息；第六章上下班时间 |
| 3-6 | 借一块橡皮 | 第一次上学 | D12 朋友、社交与公共服务 |  借还物品；Can I borrow...? / Here you are. | 社会沟通（协作完成） | 理解：点选 借/谢谢/还；搭建：说 `Can I borrow an eraser?`；输出：说 `Thank you. Here you are.` | 用 `Can I borrow...?` 独立完成一次借还（independent） | 第四章小组合作；第六章同事间借物 |
| 3-7 | 我喜欢哪门课 | 第一次上学 | D8 学校与学习 |  表达学科偏好；I like... because... / My favorite is... | 表达偏好 | 理解：点选 喜欢/不确定；搭建：说 `I like art.`；输出：说 `I like art because it's quiet.` | 用 `I like... because...` 给偏好加理由（independent→transferring） | 第四章兴趣方向；第五章比较专业 |
| 3-8 | 第一天放学回家 | 第一次上学 | D5 时间、天气与日常安排 |  叙述经过；It was... / We... | 描述特征 | 理解：点选 还行/有点累/有朋友；搭建：说 `It was a long day.`；输出：说 `We met a classmate. I felt okay.` | 用短句独立讲清第一天一件事（independent） | 第四章每日放学；第七章回望上学路 |

> 第 3 章共 8 个情景；交互结构：指向命名、社会沟通(图片/声音选择)、执行指令、听词找物、图片/声音选择、协作完成、表达偏好、描述特征 —— 共 7 种；覆盖 recognizing / doing / expressing / describing / social。

### 第 4 章 校园成长（chapter_04_school_growth）

| # | 情景名 | 对应成长阶段 | 生活领域 | 学习目标 | 推荐交互结构 | 三段式（理解→搭建→最终输出） | 掌握证据 | 复现入口 |
|---|---|---|---|---|---|---|---|---|
| 4-1 | 和同学一起做手工 | 校园成长 | D8 学校与学习 |  协作与步骤；First..., then... / Let's work together. | 协作完成 | 理解：点选 先/后/帮忙；搭建：说 `Let's work together.`；输出：说 `First cut, then glue.` | 用 `First..., then...` 描述协作步骤（independent） | 第六章小组任务；第七章分工 |
| 4-2 | 我们闹别扭了 | 校园成长 | D2 家庭与人物关系 + D12 朋友、社交与公共服务 |  冲突与和解；I thought... but... / I'm sorry. / That's okay. | 纠正误认 | 理解：点选 道歉/和解/先冷静；搭建：说 `I thought you didn't want to play.`；输出：说 `I'm sorry. That's okay.` 双向 | 用 `I thought..., but...` 复盘误会（transferring 自第二章 mistake） | 第六章同事摩擦；第七章长期关系 |
| 4-3 | 选兴趣小组 | 校园成长 | D10 兴趣、体育与娱乐 + D6 衣服、购物与付款 |  比较与选择；I prefer... / Which one do you like? | 比较方案 | 理解：点选 两个组之一；搭建：说 `I prefer the music group.`；输出：说 `I prefer music because it's calm.` | 用 `I prefer...` 比较后选择（independent） | 第五章毕业方向；第七章长期兴趣 |
| 4-4 | 忘记作业放哪了 | 校园成长 | D8 学校与学习 |  回忆与排序；I remember... / Let me think. | 记忆回访 | 理解：点选 记得/不记得/再想想；搭建：说 `I remember it was in my bag.`；输出：说 `Do you remember? I left it on the desk.` | 用 `I remember...` 调取并复述旧事件（transferring） | 第六章日程回忆；第七章人生回顾 |
| 4-5 | 向老师提一个问题 | 校园成长 | D8 学校与学习 |  提问与确认；Can you say that again? / Could you repeat it? | 执行指令 | 理解：点选 没听清/请再说一遍；搭建：说 `Can you say that again?`；输出：说 `Could you repeat that, please?` | 用请求重复句独立应对没听懂（independent） | 第六章跨部门沟通；第七章请教他人 |
| 4-6 | 今天小组谁做了什么 | 校园成长 | D8 学校与学习 |  描述角色；You did... / I did... / We... | 描述特征 | 理解：点选 我做了什么/你做了什么；搭建：说 `I drew the picture.`；输出：说 `You cut, and I glued.` | 用过去式短句描述分工（independent） | 第六章工作汇报；第七章家务分工 |
| 4-7 | 该不该把秘密告诉朋友 | 校园成长 | D2 家庭与人物关系 + D12 朋友、社交与公共服务 |  伦理与建议；Maybe... / If I were you... | 解释原因 | 理解：点选 说/不说/再想想；搭建：说 `Maybe wait and see.`；输出：说 `If I were you, I'd tell them gently.` | 用 `Maybe...` 给朋友建议而非替其决定（transferring） | 第五章请求建议；第七章给朋友建议 |
| 4-8 | 雨天体育课改在室内 | 校园成长 | D10 兴趣、体育与娱乐 |  比较方案与接受变化；It's better to... / We can... instead. | 比较方案 | 理解：点选 室内/有点失望/也行；搭建：说 `We can play inside instead.`；输出：说 `It's better to stay dry.` | 用 `...instead` 比较两种安排（independent） | 第六章突发安排；第七章生活应变 |

> 第 4 章共 8 个情景；交互结构：协作完成、纠正误认、比较方案、记忆回访、执行指令、描述特征、解释原因、比较方案 —— 共 7 种；覆盖 doing / problem-solving / expressing / recalling / describing / social。

### 第 5 章 毕业与选择（chapter_05_graduation）

| # | 情景名 | 对应成长阶段 | 生活领域 | 学习目标 | 推荐交互结构 | 三段式（理解→搭建→最终输出） | 掌握证据 | 复现入口 |
|---|---|---|---|---|---|---|---|---|
| 5-1 | 回望这几年 | 毕业与选择 | D12 朋友、社交与公共服务 |  回顾与变化；I used to... but now... / It was... | 记忆回访 | 理解：点选 记得/像昨天/变了很多；搭建：说 `I used to be shy.`；输出：说 `I used to be shy, but now I talk to people.` | 用 `I used to... but now...` 对比今昔（transferring→mastered 钩子） | 第七章人生回顾；长期记忆册 |
| 5-2 | 两条方向二选一 | 毕业与选择 | D7 地点、交通与问路（出行住宿深化）+ D10 兴趣、体育与娱乐 |  比较与倾向；On one hand... On the other... / I lean toward... | 比较方案 | 理解：点选 方向A/B/再想想；搭建：说 `I lean toward the city.`；输出：说 `On one hand it's far, on the other it's new.` | 用 `I lean toward...` 比较后表达倾向（independent） | 第六章入职；第七章长期决定 |
| 5-3 | 朋友给我一个建议 | 毕业与选择 | D12 朋友、社交与公共服务 |  接受建议；That's a good point. / Thanks. | 社会沟通（解释原因） | 理解：点选 采纳/再想/谢谢；搭建：说 `That's a good point.`；输出：说 `Thanks. I'll think about it.` | 用礼貌回应句接住朋友建议（independent） | 第六章同事建议；第七章互相建议 |
| 5-4 | 写下给未来自己的话 | 毕业与选择 | D1 自我与基本信息 + D12 朋友、社交与公共服务（公共服务深化：去邮局寄信） |  书面表达与将来时；I will... / I hope... | 表达偏好（描述特征） | 理解：点选 希望/打算/还不确定；搭建：说 `I will keep the letter.`；输出：说 `I hope I stay curious.` | 用 `I will...` / `I hope...` 写一句给自己（independent） | 第七章拆阅旧信；信件主题复现 |
| 5-5 | 毕业那天的安排 | 毕业与选择 | D5 时间、天气与日常安排 |  排列顺序；First..., then..., and finally... | 排列顺序 | 理解：点选 三个环节顺序；搭建：说 `First the speech, then photos.`；输出：说 `First..., then..., and finally...` | 用 `First/then/finally` 排列多步（independent） | 第六章安排一天；第七章长期计划 |
| 5-6 | 不确定自己选对没有 | 毕业与选择 | D1 自我与基本信息 |  表达焦虑；I'm not sure if... / It feels... | 解释原因 | 理解：点选 不确定/正常/再想想；搭建：说 `I'm not sure if it's right.`；输出：说 `It feels scary, but okay.` | 用 `I'm not sure if...` 表达对决定的不确定（transferring 自第一章 not_sure） | 第六章入职焦虑；第七章回顾选择 |
| 5-7 | 谢谢陪我走到这里 | 毕业与选择 | D12 朋友、社交与公共服务 |  感谢与告别；Thank you for... / I'll keep... | 社会沟通（表达偏好） | 理解：点选 谢谢/常联系/保重；搭建：说 `Thank you for staying with me.`；输出：说 `I'll keep our first words.` | 用 `Thank you for...` 独立致谢（independent） | 第七章长期关系；记忆册回顾 |
| 5-8 | 把旧物品收进箱子 | 毕业与选择 | D3 居家与生活用品 |  分类与执行；Put... with... / Keep this, not that. | 执行指令 | 理解：点选 留/收/带走；搭建：说 `Put this with the books.`；输出：说 `Keep this, not that.` | 用祈使句完成一次分类整理（independent） | 第七章搬家；日常整理任务 |
| 5-9 | 毕业前买一件小东西 | 毕业与选择 | D6 衣服、购物与付款（付款深化） |  问价与付钱；How much? / I'll take this. | 社会沟通（图片选择） | 理解：点选 问价/付钱/要收据；搭建：说 `How much is this?`；输出：说 `I'll take this. Here's the money.` | 用 `How much? / I'll take this.` 完成一次简单付款（independent） | 第六章同事间买东西；第七章独立买生活用品 |
| 5-10 | 和同学吃一顿毕业饭 | 毕业与选择 | D4 食物与用餐（外出就餐复现） |  外出就餐与点单；Can we have...? / This one, please. | 社会沟通（协作完成） | 理解：点选 点单/买单/谢谢；搭建：说 `Can we have two of these?`；输出：说 `This one, please.` | 用 `Can we have...? / This one, please.` 完成一次外出就餐点单（independent） | 第六章同事午餐；第七章独立外出吃饭 |

> 第 5 章共 10 个情景；交互结构：记忆回访、比较方案、社会沟通(解释原因)、表达偏好(描述特征)、排列顺序、解释原因、社会沟通(表达偏好)、执行指令、社会沟通(图片选择)、社会沟通(协作完成) —— 共 8 种；覆盖 expressing / describing / problem-solving / recalling / doing / social。D6 付款深化（5-9）、D7 出行住宿深化（5-2）、D12 公共服务深化（5-4 邮局寄信）、D4 外出就餐复现（5-10 毕业聚餐）。

### 第 6 章 初入社会（chapter_06_first_work）

| # | 情景名 | 对应成长阶段 | 生活领域 | 学习目标 | 推荐交互结构 | 三段式（理解→搭建→最终输出） | 掌握证据 | 复现入口 |
|---|---|---|---|---|---|---|---|---|
| 6-1 | 第一份差事 | 初入社会 | D9 工作与电子产品 |  工作指令；Please... / I'll do it. / Let me know. | 执行指令 | 理解：点选 领任务/问清楚；搭建：说 `I'll do it.`；输出：说 `Let me know if you need more.` | 听懂并复述工作指令（independent） | 第七章独立负责；长期任务 |
| 6-2 | 同事说的话我没听懂 | 初入社会 | D9 工作与电子产品 |  澄清沟通；What do you mean? / Do you mean...? | 纠正误认 | 理解：点选 请澄清/我理解错了；搭建：说 `What do you mean?`；输出：说 `Do you mean we meet tomorrow?` | 用 `Do you mean...?` 主动澄清误会（transferring 自 mistake 主题） | 第七章跨部门沟通；长期协作 |
| 6-3 | 安排自己的一天 | 初入社会 | D5 时间、天气与日常安排 |  时间与计划；I have to... at... / First..., then... | 排列顺序 | 理解：点选 三件事顺序；搭建：说 `I have to work at nine.`；输出：说 `First work, then rest.` | 用时间词独立排一天（independent） | 第七章长期日程；生活自理 |
| 6-4 | 出了一点小差错 | 初入社会 | D9 工作与电子产品 |  认错与补救；I made a mistake. / Let me fix it. | 解决问题（解释原因） | 理解：点选 承认/补救/请教；搭建：说 `I made a mistake.`；输出：说 `Let me fix it. I'll be careful.` | 用 `I made a mistake.` 认错并提补救（independent） | 第七章责任承担；长期复盘 |
| 6-5 | 午饭和同事聊什么 | 初入社会 | D4 食物与用餐 |  闲聊与分享；How was your...? / Not much, you? | 社会沟通（描述特征） | 理解：点选 聊工作/聊周末；搭建：说 `How was your weekend?`；输出：说 `Not much, you?` 来回一句 | 用开放式问题与同事闲聊（independent） | 第七章朋友交往；长期社交 |
| 6-6 | 该先做哪件事 | 初入社会 | D5 时间、天气与日常安排 + D7 地点、交通与问路（通勤复现） |  比较与优先级；This is more important. / Let's start with... | 比较方案 | 理解：点选 先做哪件；搭建：说 `Let's start with this one.`；输出：说 `This is more urgent.` | 用优先级表达做排序（independent） | 第七章多任务管理；长期规划 |
| 6-7 | 记错了碰面时间 | 初入社会 | D9 工作与电子产品（设备/物品故障求助，走 C5 请求能力） |  记忆回访与更正；Wait, we said... / Let me check. | 记忆回访 | 理解：点选 记错了/再确认；搭建：说 `Wait, we said three o'clock.`；输出：说 `Let me check. Did you mean three?` | 用记忆句核对并更正约定（transferring） | 第七章日程确认；长期守信 |
| 6-8 | 累了一天回到家 | 初入社会 | D5 时间、天气与日常安排（日常状态）+ D7 地点、交通与问路（通勤复现） |  表达感受与恢复；I'm tired. / I need... | 表达偏好 | 理解：点选 累/还好/想歇；搭建：说 `I'm tired.`；输出：说 `I need a quiet evening.` | 用 `I need...` 表达恢复需求（independent） | 第七章独立生活节奏；情绪主题 |
| 6-9 | 电脑/手机出了小故障 | 初入社会 | D9 工作与电子产品（设备/物品故障求助，走 C5 请求能力） |  故障描述与求助；It doesn't work. / Can you help? | 解决问题（执行指令） | 理解：点选 求助/自己试/先放着；搭建：说 `It doesn't work.`；输出：说 `Can you help me? It stopped.` | 用 `It doesn't work. / Can you help?` 描述故障并求助（independent） | 第七章修东西；长期自理 |

> 第 6 章共 9 个情景；交互结构：执行指令、纠正误认、排列顺序、解释原因、社会沟通(描述特征)、比较方案、记忆回访、表达偏好、解决问题(执行指令) —— 共 9 种；覆盖 doing / problem-solving / describing / recalling / expressing / social。D9 首次（6-1/6-2/6-4/6-6；设备/物品故障归 D9 走 C5 请求能力，6-9）、D5 日程复现（6-3/6-7；含 6-8 日常状态）、D4 同事用餐复现（6-5）、D7 通勤复现（6-8）。

### 第 7 章 独立生活（chapter_07_independent_life）

| # | 情景名 | 对应成长阶段 | 生活领域 | 学习目标 | 推荐交互结构 | 三段式（理解→搭建→最终输出） | 掌握证据 | 复现入口 |
|---|---|---|---|---|---|---|---|---|
| 7-1 | 自己管一周开销 | 独立生活 | D6 衣服、购物与付款 |  责任与数字；I spent... / I need to save... | 解决问题（描述特征） | 理解：点选 花在哪/存一点；搭建：说 `I spent a little.`；输出：说 `I need to save some each month.` | 用数字句独立做小计划（independent） | 长期生活自理；年度回顾 |
| 7-2 | 早上的例行流程 | 独立生活 | D5 时间、天气与日常安排 |  流程与顺序；Then I... / After that... | 排列顺序 | 理解：点选 起床/洗漱/出门顺序；搭建：说 `Then I make tea.`；输出：说 `After that, I check the time.` | 用 `Then / After that` 独立叙述日常流程（independent） | 第七章自理；长期习惯 |
| 7-3 | 修理坏了的东西 | 独立生活 | D3 居家与生活用品 |  问题解决；It doesn't work. / Can you help? / Let's try... | 执行指令 | 理解：点选 求助/自己试/先放着；搭建：说 `It doesn't work.`；输出：说 `Let's try this first.` | 用问题句描述故障并提尝试（independent） | 长期自理；协作修复 |
| 7-4 | 老朋友又来访 | 独立生活 | D12 朋友、社交与公共服务 |  久别重逢；Do you remember...? / It's been... | 记忆回访 | 理解：点选 记得/好久/近况；搭建：说 `Do you remember the lamp?`；输出：说 `It's been a long time. How have you been?` | 用 `Do you remember...?` 复现早期记忆（transferring→mastered；呼应第七章完成条件"早期记忆至少复现 1 次"） | 长期关系；人生回顾 |
| 7-5 | 长期计划：明年想怎样 | 独立生活 | D9 工作与电子产品 |  长期打算；Next year I want to... / Maybe... | 比较方案 | 理解：点选 想换/想留/再想想；搭建：说 `Next year I want to learn something new.`；输出：说 `Maybe I'll stay, maybe I'll move.` | 用 `Next year I want to...` 独立表达长期打算（independent） | 长期目标；年度对话 |
| 7-6 | 照顾一盆植物 | 独立生活 | D3 居家与生活用品 |  责任与照料；It needs water. / I water it every... | 描述特征 | 理解：点选 浇水/晒太阳/看起来好；搭建：说 `It needs water.`；输出：说 `I water it every two days.` | 用照料句描述责任（transferring 自第一章 plant） | 长期生活；第一章植物记忆复现 |
| 7-7 | 给朋友一个建议 | 独立生活 | D12 朋友、社交与公共服务 |  双向社交；If I were you, I'd... / That's up to you. | 解释原因 | 理解：点选 建议/不替决定；搭建：说 `That's up to you.`；输出：说 `If I were you, I'd wait.` | 用朋友语气给建议但不替决定（independent；呼应圣经"朋友不替 Morrow 决定"） | 长期友谊；关系主题 |
| 7-8 | 人生快讲：从第一间房到现在 | 独立生活 | D1 自我与基本信息 |  综合回顾；At first... / Then... / Now... | 排列顺序 | 理解：点选 起点/现在/感慨；搭建：说 `At first the room was blurry.`；输出：说 `At first..., then..., now I...` 串起全程 | 用 `At first... then... now...` 独立串起个人成长线（mastered 收束） | 第七章人生回顾；记忆册总览 |
| 7-9 | 哪里不太舒服 | 独立生活 | D11 身体、健康与求助（首次系统引入：说症状/听懂简单医嘱） |  说身体状态与简单医嘱；I have a... / It hurts here. | 执行指令 | 理解：点选 头痛/肚子痛/累；搭建：说 `I have a headache.`；输出：说 `It hurts here. What should I do?` | 用 `I have a... / It hurts here.` 简单描述症状并听懂一句医嘱（independent） | 长期健康；第二章轻量感受表达的系统收束 |

> 第 7 章共 9 个情景；交互结构：解决问题(描述特征)、排列顺序、执行指令、记忆回访、比较方案、描述特征、解释原因、排列顺序、执行指令 —— 共 7 种；覆盖 problem-solving / doing / recalling / expressing / describing / social。D11 身体/健康/求助在本章首次系统引入（7-9 说症状/听懂简单医嘱）。

---

## C. "防退化"说明：避免退化成反复问"这是什么"

**问题**：如果把所有情景都做成"指一个东西 → 问这是什么 → 用户说名字"，学习会退化成机械指认，词汇停留在名词层，句型和沟通能力不增长，用户也会腻。本库用以下机制防退化：

1. **六能力强制铺开，不集中在 recognizing**：25 行映射里，认识事物 recognizing 只占事件 2、7、15、16、23、25 这一类；其余大量事件落在 describing、expressing、doing、social、problem-solving。新情景的默认起点不是"这是什么"，而是"你怎么看 / 你想怎么做 / 刚才发生了什么"。
2. **12 种交互结构轮换，而非只用指向命名**：日常事件从轮换池选取时，系统记录"最近 N 次用过哪种结构"，相邻两次不取同一结构；同一词汇点（如 apple）在不同次复现时强制换结构——第一次指向命名，第二次描述特征，第三次纠正误认，第四次生活任务，第五次表达偏好，第六次跨场景迁移（见 `OBJECT_LEARNING_EVENT_EXAMPLE.md` 苹果样板）。
3. **同一对象必须走完掌握六阶才算 mastered**：encountered（首次接触）→ recognized（能识别）→ prompted（提示下会用）→ independent（独立会用）→ transferring（迁移到新场景）→ mastered（稳定掌握）。停在"能说名字"只算 recognized，不进 mastered；必须有一次无提示独立表达 + 一次跨场景复现才升级。**听音选图仅算 recognized，提示下跟读仅算 prompted**，不凭这两步直接冲 independent。
4. **"掌握证据"是独立表达点，不是答对率**：每个事件的掌握证据都要求用户在无候选提示下说出完整句（如 `It is red and round.`），而非点对名词。点选只算理解段参与（recognized），不直接判掌握。
5. **生活任务与社交贯穿始终**：从童年的"把苹果放进篮子"到毕业的"给朋友建议"，每个阶段都要求把语言用到真实做事/说话里，而不是停在命名题。
6. **记忆回访负责复现，不负责新学**：recall 类结构只在已有确认记忆时触发，且一次只调一条记忆；它的作用是把旧表达从 recognized 推到 transferring/mastered，绝不用来重复考"这是什么"。
7. **同一答案不连续重复考，填空只练新成分**：刚通过听音选图 `recognized` 的内容直接带入下一段语块/句子，不回头再考同一答案；预设填词只对新成分挖空，已认出的成分直接给出；旧内容只在间隔后的新场景复测。填空与排序原则上不叠加。
8. **用户不替 Morrow 做决定、不被打分**：没有用户难度档，也没有对错红叉、星级排名，避免把情景库做成题库。

---

## 数量自检（一行）

- 首两章映射：第一章 13 行 + 第二章 12 行 = **25 行**，与实际内容文件一致（计划称 24，实际 25，已全量映射）。
- 第 3 章 8 个情景 / 7 种交互结构；第 4 章 8 个 / 7 种；第 5 章 8 个 / 7 种；第 6 章 8 个 / 8 种；第 7 章 8 个 / 6 种。
- 第三至七章合计 **5 × 8 = 40 个候选情景**，每章均 ≥8 个、均 ≥4 种交互结构，且覆盖六类学习能力（recognizing / doing / describing / expressing / problem-solving / social）。
