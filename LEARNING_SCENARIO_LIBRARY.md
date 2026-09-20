# LEARNING_SCENARIO_LIBRARY — Morrow 成长学习情景库（阶段 3.5.4）

> 版本：1.0.0
> 项目：成人英语 AI 宠物 Morrow（墨洛）
> 依据：`MORROW_LIFE_STORY_BIBLE.md` v1.0.0（七章主线、三类事件、11 主题）、`FIXED_CONTENT_CONTRACT.md` v1.0.0（中文 UI + 英文学习内容 + 人工译文边界）、`CHAPTER_01_BIRTH_CONTENT.md` v1.0.0（13 事件）、`CHAPTER_02_CHILDHOOD_CONTENT.md` v1.0.0（12 事件）。
> 本库只做"学习情景"一层的编排：把已存在/规划中的成长事件映射到英语学习能力、交互结构、难度三档与掌握证据。它不改写事件 ID、世界状态与分支逻辑；事件正文仍以两章内容文件为准。

## 0. 口径与术语（全库逐字使用，不得替换同义词）

**事件数量口径（重要）**：计划文档口头称"首两章 24 个事件"，但实际内容文件为 **25 个（第一章 13 / 第二章 12）**，本库已按实际 25 个全量映射，一个不漏。第一章 13 个：`birth_first_voice_v1`、`birth_restore_object_v1`、`b1_remember_name_v1`、`b1_first_feeling_v1`、`b1_window_light_v1`、`b1_first_letter_v1`、`b1_bell_sound_v1`、`b1_ask_about_you_v1`、`b1_what_i_like_v1`、`b1_tomorrow_plan_v1`、`b1_return_first_words_v1`、`b1_ready_for_outside_v1`、`b1_not_sure_v1`。第二章 12 个：`b2_room_tour_v1`、`b2_name_objects_v1`、`b2_colors_v1`、`b2_outside_road_v1`、`b2_today_you_v1`、`b2_my_likes_v1`、`b2_mistake_v1`、`b2_small_task_v1`、`b2_feeling_check_v1`、`b2_sound_comes_back_v1`、`b2_recall_room_v1`、`b2_ready_for_school_v1`。

**掌握六阶（逐字）**：初次接触 encountered / 能识别 recognized / 提示下会用 prompted / 独立会用 independent / 迁移中 transferring / 稳定掌握 mastered。

**用户难度三档（逐字）**：基础 basic / 中等 intermediate / 进阶 advanced。三档只改"用户要自己说出多少"，不改剧情结果，不打分、不评判。

**六类学习能力（逐字）**：认识事物 recognizing / 执行动作 doing / 描述世界 describing / 表达自己 expressing / 解决问题 problem-solving / 社会沟通 social。

**12 种交互结构（逐字，必须轮换）**：指向命名、听词找物、图片/声音选择、描述特征、纠正误认、执行指令、排列顺序、表达偏好、解释原因、比较方案、协作完成、记忆回访。

**语言难度对照**：源文件 L1 句长 5—10 词高频词 ≈ 基础/中等；L2 句长 8—16 词 ≈ 中等/进阶。Morrow 全程用 they/them 中性指代；每条英文必配人工中文译文。

---

## A. 首两章 25 个事件逐项映射表

> 说明：每行一个事件，不许留空、不许合并行。"目标词汇-搭配"与"目标句型"取自各事件正文"英语学习目标"，不新增超纲内容。"三档分别做什么"描述用户在该事件里的最低参与方式；"掌握证据（独立表达点）"指用户无需提示即可独立说出、并能推动该事件结算的表达；"后续复现入口"指该语言点在后续章/场景里自然复现的钩子。

| 事件ID | 中文名 | 学习能力类型 | 交互结构 | 目标词汇-搭配 | 目标句型 | 基础·中等·进阶三档分别做什么 | 掌握证据（独立表达点） | 后续复现入口 |
|---|---|---|---|---|---|---|---|---|
| `birth_first_voice_v1` | 苏醒后的第一句话 | 社会沟通 social | 图片/声音选择 | help / all right / okay | `Let me help you...`；`Are you all right?` | 基础：点选中文候选（主动帮 / 先问你还好吗）；中等：用参考句 `Let me help you find out where you are.`；进阶：自己说出关心句并补一句为什么 | 无提示说出 `Are you all right?` 或 `Let me help you.` 并推动 first_response_style 结算（prompted→independent） | 序 2 帮助式交流；第二章"朋友平等"语气贯穿 |
| `birth_restore_object_v1` | 让第一件东西清晰起来 | 认识事物 recognizing | 指向命名 | lamp / plant / small bell；bring back | `Let's bring back the...`；`I choose...` | 基础：从三幅模糊轮廓点选一件；中等：说 `Let's bring back the lamp.`；进阶：说 `I choose the plant near the door.` 并加方位 | 无提示说出物品名 + bring back 搭配（独立说出 lamp/plant/bell 其一），结算 first_restored_object（encountered→recognized） | 第二章命名物品、颜色、小任务；recall 事件带回 first_restored_object |
| `b1_remember_name_v1` | 给自己起一个称呼 | 表达自己 expressing | 比较方案 | name / keep / short / decide | `What do you think?`；`I'll keep...` | 基础：三选一点选；中等：说 `Morrow sounds right. Keep it.`；进阶：说 `Can I call you M for short?` 并说明理由 | 用 `What do you think?` 向 Morrow 征求意见，而非只点选（独立用征求意见句型） | 后续 Morrow 自称/被称呼；第五章回顾时再提"名字" |
| `b1_first_feeling_v1` | 说出现在的感觉 | 表达自己 expressing | 描述特征 | new / nervous / soft；feel | `I feel...`；`It's just...` | 基础：点选 新鲜/紧张/我也有；中等：说 `It's probably just new.`；进阶：说 `It sounds like you're a little nervous.` | 用 `I feel...` 或 `It's just new.` 命名一种感觉，区分"新鲜≠害怕"（recognized→prompted） | 第二章 feeling_check、my_likes；第四/五章情绪词延展 |
| `b1_window_light_v1` | 看窗外的光 | 描述世界 describing | 描述特征 | warm / high / bright / light | `It's warm outside.`；`The light is...` | 基础：点选 暖的/太阳高/看不清；中等：说 `The light is warm.`；进阶：补时间 `It looks like late afternoon.` | 用形容词独立描述光的冷暖与时间感（independent） | 第二章 outside_road、sound_comes_back；第三章校园光线 |
| `b1_first_letter_v1` | 一封看不懂的信 | 社会沟通 social | 协作完成 | read / says / blurry / together | `Can you read this?`；`It says...` | 基础：点选 读出来/读不清/慢慢一起读；中等：说 `It says "welcome home."`；进阶：逐字慢读并转述大意 | 用 `It says...` 转述书面内容给 Morrow（prompted→independent） | 第一章 tomorrow_plan 再读信；后续来信/通知阅读 |
| `b1_bell_sound_v1` | 找回一个声音 | 认识事物 recognizing | 图片/声音选择 | bell / sound / hear；like | `It sounds like...`；`I hear a...` | 基础：点选 像铃铛/只是房间声/没听到；中等：说 `It sounds like a bell.`；进阶：说 `It's soft, not loud. Maybe it's the room.` | 用 `It sounds like...` 独立指认一个声音（recognized→prompted） | 第二章 sound_comes_back、ready_for_school 的声音递进 |
| `b1_ask_about_you_v1` | Morrow 反过来问你 | 社会沟通 social | 描述特征 | day / long / ordinary / tired | `What happened today?`；`I had a... day.` | 基础：点选 很久/普通/不想说；中等：说 `I had a long day at work.`；进阶：补一件小事 `Something happened. I'll tell you one part.` | 用 `I had a ... day.` 独立分享自己的一天（independent） | 第二章 today_you；每章日常"分享今天"轮换 |
| `b1_what_i_like_v1` | 我喜欢和还不确定的事 | 表达自己 expressing | 表达偏好 | like / quiet / outside / sure | `I like...`；`I'm not sure about... yet.` | 基础：点选 也喜欢安静/喜欢外面/还在想；中等：说 `I like quiet too.`；进阶：说 `I'm still figuring out what I like.` | 用 `I like...` 或 `I'm not sure about... yet.` 独立表达喜好与不确定（independent） | 第二章 my_likes；第四/五章兴趣与选择 |
| `b1_tomorrow_plan_v1` | 一起定一个明天的小计划 | 社会沟通 social | 协作完成 | tomorrow / plan / rest / read | `Let's... tomorrow.`；`What shall we do tomorrow?` | 基础：点选 看路/再读信/休息；中等：说 `Let's look outside and see the road.`；进阶：说 `What shall we do tomorrow?` 反问并定计划 | 用 `Let's... tomorrow.` 独立提出并约定一件小事（independent） | 第二章 room_tour/outside_road 承接；后续每日小计划 |
| `b1_return_first_words_v1` | 记住你说过的第一句 | 社会沟通 social | 记忆回访 | meant / right / differently / ago | `Did you mean it?`；`Yes, that's what I meant.` | 基础：点选 就是那个意思/现在会说不一样/像很久以前；中等：说 `Yes, that's what I meant.`；进阶：给旧句新版本 `I'd say it a little differently now.` | 对旧记忆句做确认或更新，用 `Yes, that's what I meant.`（prompted→transferring） | 第二章 recall_room；第七章人生回顾复现早期记忆 |
| `b1_ready_for_outside_v1` | 准备好走出门 | 表达自己 expressing | 比较方案 | ready / go / not yet / curious | `I'm ready to...`；`Let's go.`；`Not yet.` | 基础：点选 一起走/再待一天/外面有什么；中等：说 `I'm ready too. Let's go.`；进阶：说 `What will we see out there?` 表达好奇 | 用 `I'm ready to...` / `Not yet.` 独立表达准备程度（independent） | 第二章 room_tour 走出房门；第三章第一次出门 |
| `b1_not_sure_v1` | 一件还拿不准的小事 | 表达自己 expressing | 解释原因 | sure / okay / think / later | `I'm not sure about...`；`It's okay not to know yet.` | 基础：点选 不知道也没关系/一起想/先放着；中等：说 `It's okay not to know yet.`；进阶：说 `We can think about it together.` | 用 `I'm not sure about...` 接纳不确定，不急着给答案（independent） | 第二章 road 通向哪"还不知道"；第五/六章面对未知选择 |
| `b2_room_tour_v1` | 第一次把房间走一遍 | 执行动作 doing | 排列顺序 | window / door / corner；walk to | `This is where...`；`Let's go to the...` | 基础：点选 先去窗边/门边/角落；中等：说 `Let's walk to the window.`；进阶：比较两处 `The room looks smaller from here.` | 用 `Let's go to the...` 独立决定行走顺序并说出目的地（independent） | 第二章命名物品、小任务；后续"熟悉的角落" |
| `b2_name_objects_v1` | 给房间里的东西命名 | 认识事物 recognizing | 指向命名 | shelf / cup / cushion；name / call | `This is a...`；`What do you call this?` | 基础：点选 先给架子/杯子/软垫命名；中等：说 `This is a shelf.`；进阶：说 `It looks soft.` 并用近义词 cushion/pillow 互换 | 独立说出 `This is a...` 把形状和英文名对上（recognized→independent） | 颜色、小任务、整理架子；苹果样板等新物品命名 |
| `b2_colors_v1` | 找出三种颜色 | 认识事物 recognizing | 指向命名 | blue / green / yellow；see | `It is...（颜色）`；`I see...（颜色）` | 基础：点选 指蓝/绿/黄；中等：说 `I see blue. The window frame is blue.`；进阶：一次指三种并配物品 `The plant is green.` | 用 `I see ...（颜色）.` 把颜色词锚到具体物品（independent） | 偏好里"安静的颜色"；校园里颜色/标识识别 |
| `b2_outside_road_v1` | 窗外那条路通向哪 | 描述世界 describing | 解释原因 | road / village / trees / might | `The road goes to...`；`It might go to...` | 基础：点选 村子/树林/还不知道；中等：说 `It might go to a small village.`；进阶：说理由 `That sounds quiet.` | 用 `It might go to...` 对未知作带理由的猜测（prompted→independent） | 第二章 ready_for_school 揭晓方向；第三章上学路 |
| `b2_today_you_v1` | 讲讲你今天发生了什么 | 社会沟通 social | 描述特征 | quiet / busy / something / happened | `Tell me about your day.`；`What happened today?` | 基础：点选 安静/忙/有一件事；中等：说 `It was busy. I ran around a lot.`；进阶：讲一个片段 `Something happened. I'll tell you one part.` | 用 `Tell me about your day.` 之外，能被问到时用完整短句讲一件事（independent） | 每章日常话题轮换；第六/七章工作/生活分享 |
| `b2_my_likes_v1` | 我渐渐知道自己喜欢什么 | 表达自己 expressing | 表达偏好 | light / quiet / bell；like | `I like...`；`I don't like... yet` | 基础：点选 光/安静/铃声；中等：说 `Yes, you like the light.`；进阶：问回 `Do you like the bell sound?` | 帮 Morrow 用 `I like...` 说出其偏好，自己也能复述偏好句（independent） | 第三章选兴趣；第五章比较方向；第七章长期喜好 |
| `b2_mistake_v1` | 一件小事误会了 | 解决问题 problem-solving | 纠正误认 | spill the beans / secret / saying / literally | `I thought..., but it means...`；`I may be taking that too literally.` | 基础：点选 澄清/笑着跳过；中等：说 `It means you told a secret. Not real beans.`；进阶：说 `I thought you meant real beans.` 复盘误会 | 用 `I thought..., but it means...` 澄清一个习语/误会（prompted→transferring） | 第三章课堂误会；第六/七章沟通误会—解决主线 |
| `b2_small_task_v1` | 一起做一件小事 | 执行动作 doing | 协作完成 | arrange / open / water；help | `Let's...`；`Can you help me...?` | 基础：点选 整理架子/开窗/浇植物；中等：说 `Let's water the plant.`；进阶：说 `Can you help me reach it?` 请求协助 | 用 `Let's...` 或 `Can you help me...?` 发起并完成协作小任务（independent） | 第三章课堂小任务；第六章工作协作；第七章家务 |
| `b2_feeling_check_v1` | 今天感觉怎么样 | 表达自己 expressing | 表达偏好 | tired / okay / better / feel | `How do you feel?`；`I feel...` | 基础：点选 累/还好/好一点；中等：说 `I feel tired.`；进阶：说 `I feel a bit better now.` 并补一句原因 | 用 `I feel...` 独立回答感受提问（independent） | 每章情绪问候；第五/六章压力与恢复 |
| `b2_sound_comes_back_v1` | 又有一点声音回来了 | 认识事物 recognizing | 图片/声音选择 | wind / voice / quiet；hear again | `I can hear... again.`；`The sound is back.` | 基础：点选 风/远处人声/安静听；中等：说 `It sounds like the wind.`；进阶：说 `It sounds like a voice, far away.` 对比远近 | 用 `I can hear... again.` 指认新声音并与旧声音（铃铛）对比（transferring） | 第二章 ready_for_school 学校人声；第三章校园声景 |
| `b2_recall_room_v1` | 想起刚醒来那天的房间 | 社会沟通 social | 记忆回访 | remember / first / long ago / clearer | `Do you remember...?`；`That was the first day.` | 基础：点选 记得/多讲点/像很久以前；中等：说 `Yes, I remember. It was the first thing.`；进阶：说 `That feels like a long time ago now.` | 用 `Do you remember...?` 参与对早期记忆的回访（transferring→mastered 钩子） | 第四章要求复现一次早期房间记忆；第七章人生回顾 |
| `b2_ready_for_school_v1` | 听见学校方向的声音 | 描述世界 describing | 图片/声音选择 | children / school / direction / wave | `I hear... from that direction.`；`Something is calling.` | 基础：点选 像学校/再听一次/像新地方；中等：说 `It sounds like children. Maybe a school.`；进阶：说 `That direction feels like a new place.` | 用 `I hear... from that direction.` 指认人声来源（independent） | 第三章第一次上学整章入口；第五章回顾求学路 |

> 第一章 13 行结构分布：图片/声音选择(1,7)、指向命名(2)、比较方案(3,12)、描述特征(4,5,8)、协作完成(6,10)、记忆回访(11)、解释原因(13) —— 共 7 种结构。第二章 12 行结构分布：排列顺序(14)、指向命名(15,16)、解释原因(17)、描述特征(18)、表达偏好(19,21)、纠正误认(20)、协作完成(22)、图片/声音选择(23,25)、记忆回访(24) —— 共 9 种结构。首两章合计覆盖全部 12 种交互结构。

---

## B. 第三至第七章候选情景库

> 章名（逐字）：第3章 第一次上学 `chapter_03_first_school`、第4章 校园成长 `chapter_04_school_growth`、第5章 毕业与选择 `chapter_05_graduation`、第6章 初入社会 `chapter_06_first_work`、第7章 独立生活 `chapter_07_independent_life`。
> 每个候选情景给：情景名（中文）/对应成长阶段/学习目标/推荐交互结构/三档难度差异/掌握证据/复现入口。语言难度随章递增，但仍保持简单地道英文 + 人工中文。

### 第 3 章 第一次上学（chapter_03_first_school）

| # | 情景名 | 对应成长阶段 | 学习目标 | 推荐交互结构 | 三档难度差异（基础/中等/进阶） | 掌握证据（独立表达点） | 复现入口 |
|---|---|---|---|---|---|---|---|
| 3-1 | 第一次走进教室 | 第一次上学 | 教室物品与位置；Where is...? / This is the... | 指向命名 | 基础：点选座位/门口/黑板；中等：说 `This is the desk.`；进阶：说 `My seat is by the window.` | 独立用 `This is the...` 命名教室物品（recognized→independent） | 第四章校园各场景；第七章回忆教室 |
| 3-2 | 认识第一位同学 | 第一次上学 | 打招呼与自我介绍；Hi, I'm... / What's your name? | 社会沟通（图片/声音选择） | 基础：点选 打招呼/问名字/微笑不说话；中等：说 `Hi, I'm Morrow. What's your name?`；进阶：补一句 `Nice to meet you.` | 用 `Hi, I'm...` 独立完成一次自我介绍（independent） | 第四章交朋友；第六章见同事 |
| 3-3 | 听懂课堂规则 | 第一次上学 | 规则与请求帮助；Can I...? / Raise your hand. | 执行指令 | 基础：点选 举手/安静/问老师；中等：说 `Can I open the window?`；进阶：说 `May I ask a question?` | 用 `Can I...?` 礼貌请求，听懂课堂指令（prompted→independent） | 第四章课堂；第六章职场规则 |
| 3-4 | 找不到书包了 | 第一次上学 | 寻找与方位；Where is...? / It's on/in... | 听词找物 | 基础：在图上点书包；中等：说 `Where is my bag?`；进阶：说 `It's under the chair.` | 用 `Where is...?` + `It's...` 完成一次寻找（independent） | 第四章值日/找东西；第七章收拾房间 |
| 3-5 | 铃声响了 | 第一次上学 | 声音辨认与时间；That's the bell. / Time for... | 图片/声音选择 | 基础：点选 上课铃/下课铃；中等：说 `That's the bell.`；进阶：说 `Time for class.` | 用声音句独立判断上下课（transferring 自第二章铃声） | 第四章作息；第六章上下班时间 |
| 3-6 | 借一块橡皮 | 第一次上学 | 借还物品；Can I borrow...? / Here you are. | 社会沟通（协作完成） | 基础：点选 借/谢谢/还；中等：说 `Can I borrow an eraser?`；进阶：说 `Thank you. Here you are.` | 用 `Can I borrow...?` 独立完成一次借还（independent） | 第四章小组合作；第六章同事间借物 |
| 3-7 | 我喜欢哪门课 | 第一次上学 | 表达学科偏好；I like... because... / My favorite is... | 表达偏好 | 基础：点选 喜欢/不确定；中等：说 `I like art.`；进阶：说 `I like art because it's quiet.` | 用 `I like... because...` 给偏好加理由（independent→transferring） | 第四章兴趣方向；第五章比较专业 |
| 3-8 | 第一天放学回家 | 第一次上学 | 叙述经过；It was... / We... | 描述特征 | 基础：点选 还行/有点累/有朋友；中等：说 `It was a long day.`；进阶：说 `We met a classmate. I felt okay.` | 用短句独立讲清第一天一件事（independent） | 第四章每日放学；第七章回望上学路 |

> 第 3 章共 8 个情景；交互结构：指向命名、社会沟通(图片/声音选择)、执行指令、听词找物、图片/声音选择、协作完成、表达偏好、描述特征 —— 共 7 种；覆盖 recognizing / doing / expressing / describing / social。

### 第 4 章 校园成长（chapter_04_school_growth）

| # | 情景名 | 对应成长阶段 | 学习目标 | 推荐交互结构 | 三档难度差异 | 掌握证据 | 复现入口 |
|---|---|---|---|---|---|---|---|
| 4-1 | 和同学一起做手工 | 校园成长 | 协作与步骤；First..., then... / Let's work together. | 协作完成 | 基础：点选 先/后/帮忙；中等：说 `Let's work together.`；进阶：说 `First cut, then glue.` | 用 `First..., then...` 描述协作步骤（independent） | 第六章小组任务；第七章分工 |
| 4-2 | 我们闹别扭了 | 校园成长 | 冲突与和解；I thought... but... / I'm sorry. / That's okay. | 纠正误认 | 基础：点选 道歉/和解/先冷静；中等：说 `I thought you didn't want to play.`；进阶：说 `I'm sorry. That's okay.` 双向 | 用 `I thought..., but...` 复盘误会（transferring 自第二章 mistake） | 第六章同事摩擦；第七章长期关系 |
| 4-3 | 选兴趣小组 | 校园成长 | 比较与选择；I prefer... / Which one do you like? | 比较方案 | 基础：点选 两个组之一；中等：说 `I prefer the music group.`；进阶：说 `I prefer music because it's calm.` | 用 `I prefer...` 比较后选择（independent） | 第五章毕业方向；第七章长期兴趣 |
| 4-4 | 忘记作业放哪了 | 校园成长 | 回忆与排序；I remember... / Let me think. | 记忆回访 | 基础：点选 记得/不记得/再想想；中等：说 `I remember it was in my bag.`；进阶：说 `Do you remember? I left it on the desk.` | 用 `I remember...` 调取并复述旧事件（transferring） | 第六章日程回忆；第七章人生回顾 |
| 4-5 | 向老师提一个问题 | 校园成长 | 提问与确认；Can you say that again? / Could you repeat it? | 执行指令 | 基础：点选 没听清/请再说一遍；中等：说 `Can you say that again?`；进阶：说 `Could you repeat that, please?` | 用请求重复句独立应对没听懂（independent） | 第六章跨部门沟通；第七章请教他人 |
| 4-6 | 今天小组谁做了什么 | 校园成长 | 描述角色；You did... / I did... / We... | 描述特征 | 基础：点选 我做了什么/你做了什么；中等：说 `I drew the picture.`；进阶：说 `You cut, and I glued.` | 用过去式短句描述分工（independent） | 第六章工作汇报；第七章家务分工 |
| 4-7 | 该不该把秘密告诉朋友 | 校园成长 | 伦理与建议；Maybe... / If I were you... | 解释原因 | 基础：点选 说/不说/再想想；中等：说 `Maybe wait and see.`；进阶：说 `If I were you, I'd tell them gently.` | 用 `Maybe...` 给朋友建议而非替其决定（transferring） | 第五章请求建议；第七章给朋友建议 |
| 4-8 | 雨天体育课改在室内 | 校园成长 | 比较方案与接受变化；It's better to... / We can... instead. | 比较方案 | 基础：点选 室内/有点失望/也行；中等：说 `We can play inside instead.`；进阶：说 `It's better to stay dry.` | 用 `...instead` 比较两种安排（independent） | 第六章突发安排；第七章生活应变 |

> 第 4 章共 8 个情景；交互结构：协作完成、纠正误认、比较方案、记忆回访、执行指令、描述特征、解释原因、比较方案 —— 共 7 种；覆盖 doing / problem-solving / expressing / recalling / describing / social。

### 第 5 章 毕业与选择（chapter_05_graduation）

| # | 情景名 | 对应成长阶段 | 学习目标 | 推荐交互结构 | 三档难度差异 | 掌握证据 | 复现入口 |
|---|---|---|---|---|---|---|---|
| 5-1 | 回望这几年 | 毕业与选择 | 回顾与变化；I used to... but now... / It was... | 记忆回访 | 基础：点选 记得/像昨天/变了很多；中等：说 `I used to be shy.`；进阶：说 `I used to be shy, but now I talk to people.` | 用 `I used to... but now...` 对比今昔（transferring→mastered 钩子） | 第七章人生回顾；长期记忆册 |
| 5-2 | 两条方向二选一 | 毕业与选择 | 比较与倾向；On one hand... On the other... / I lean toward... | 比较方案 | 基础：点选 方向A/B/再想想；中等：说 `I lean toward the city.`；进阶：说 `On one hand it's far, on the other it's new.` | 用 `I lean toward...` 比较后表达倾向（independent） | 第六章入职；第七章长期决定 |
| 5-3 | 朋友给我一个建议 | 毕业与选择 | 接受建议；That's a good point. / Thanks. | 社会沟通（解释原因） | 基础：点选 采纳/再想/谢谢；中等：说 `That's a good point.`；进阶：说 `Thanks. I'll think about it.` | 用礼貌回应句接住朋友建议（independent） | 第六章同事建议；第七章互相建议 |
| 5-4 | 写下给未来自己的话 | 毕业与选择 | 书面表达与将来时；I will... / I hope... | 表达偏好（描述特征） | 基础：点选 希望/打算/还不确定；中等：说 `I will keep the letter.`；进阶：说 `I hope I stay curious.` | 用 `I will...` / `I hope...` 写一句给自己（independent） | 第七章拆阅旧信；信件主题复现 |
| 5-5 | 毕业那天的安排 | 毕业与选择 | 排列顺序；First..., then..., and finally... | 排列顺序 | 基础：点选 三个环节顺序；中等：说 `First the speech, then photos.`；进阶：说 `First..., then..., and finally...` | 用 `First/then/finally` 排列多步（independent） | 第六章安排一天；第七章长期计划 |
| 5-6 | 不确定自己选对没有 | 毕业与选择 | 表达焦虑；I'm not sure if... / It feels... | 解释原因 | 基础：点选 不确定/正常/再想想；中等：说 `I'm not sure if it's right.`；进阶：说 `It feels scary, but okay.` | 用 `I'm not sure if...` 表达对决定的不确定（transferring 自第一章 not_sure） | 第六章入职焦虑；第七章回顾选择 |
| 5-7 | 谢谢陪我走到这里 | 毕业与选择 | 感谢与告别；Thank you for... / I'll keep... | 社会沟通（表达偏好） | 基础：点选 谢谢/常联系/保重；中等：说 `Thank you for staying with me.`；进阶：说 `I'll keep our first words.` | 用 `Thank you for...` 独立致谢（independent） | 第七章长期关系；记忆册回顾 |
| 5-8 | 把旧物品收进箱子 | 毕业与选择 | 分类与执行；Put... with... / Keep this, not that. | 执行指令 | 基础：点选 留/收/带走；中等：说 `Put this with the books.`；进阶：说 `Keep this, not that.` | 用祈使句完成一次分类整理（independent） | 第七章搬家；日常整理任务 |

> 第 5 章共 8 个情景；交互结构：记忆回访、比较方案、解释原因、表达偏好(描述特征)、排列顺序、社会沟通(表达偏好)、执行指令 —— 共 7 种；覆盖 expressing / describing / problem-solving / recalling / doing / social。

### 第 6 章 初入社会（chapter_06_first_work）

| # | 情景名 | 对应成长阶段 | 学习目标 | 推荐交互结构 | 三档难度差异 | 掌握证据 | 复现入口 |
|---|---|---|---|---|---|---|---|
| 6-1 | 第一份差事 | 初入社会 | 工作指令；Please... / I'll do it. / Let me know. | 执行指令 | 基础：点选 领任务/问清楚；中等：说 `I'll do it.`；进阶：说 `Let me know if you need more.` | 听懂并复述工作指令（independent） | 第七章独立负责；长期任务 |
| 6-2 | 同事说的话我没听懂 | 初入社会 | 澄清沟通；What do you mean? / Do you mean...? | 纠正误认 | 基础：点选 请澄清/我理解错了；中等：说 `What do you mean?`；进阶：说 `Do you mean we meet tomorrow?` | 用 `Do you mean...?` 主动澄清误会（transferring 自 mistake 主题） | 第七章跨部门沟通；长期协作 |
| 6-3 | 安排自己的一天 | 初入社会 | 时间与计划；I have to... at... / First..., then... | 排列顺序 | 基础：点选 三件事顺序；中等：说 `I have to work at nine.`；进阶：说 `First work, then rest.` | 用时间词独立排一天（independent） | 第七章长期日程；生活自理 |
| 6-4 | 出了一点小差错 | 初入社会 | 认错与补救；I made a mistake. / Let me fix it. | 解决问题（解释原因） | 基础：点选 承认/补救/请教；中等：说 `I made a mistake.`；进阶：说 `Let me fix it. I'll be careful.` | 用 `I made a mistake.` 认错并提补救（independent） | 第七章责任承担；长期复盘 |
| 6-5 | 午饭和同事聊什么 | 初入社会 | 闲聊与分享；How was your...? / Not much, you? | 社会沟通（描述特征） | 基础：点选 聊工作/聊周末；中等：说 `How was your weekend?`；进阶：说 `Not much, you?` 来回一句 | 用开放式问题与同事闲聊（independent） | 第七章朋友交往；长期社交 |
| 6-6 | 该先做哪件事 | 初入社会 | 比较与优先级；This is more important. / Let's start with... | 比较方案 | 基础：点选 先做哪件；中等：说 `Let's start with this one.`；进阶：说 `This is more urgent.` | 用优先级表达做排序（independent） | 第七章多任务管理；长期规划 |
| 6-7 | 记错了碰面时间 | 初入社会 | 记忆回访与更正；Wait, we said... / Let me check. | 记忆回访 | 基础：点选 记错了/再确认；中等：说 `Wait, we said three o'clock.`；进阶：说 `Let me check. Did you mean three?` | 用记忆句核对并更正约定（transferring） | 第七章日程确认；长期守信 |
| 6-8 | 累了一天回到家 | 初入社会 | 表达感受与恢复；I'm tired. / I need... | 表达偏好 | 基础：点选 累/还好/想歇；中等：说 `I'm tired.`；进阶：说 `I need a quiet evening.` | 用 `I need...` 表达恢复需求（independent） | 第七章独立生活节奏；情绪主题 |

> 第 6 章共 8 个情景；交互结构：执行指令、纠正误认、排列顺序、解释原因、社会沟通(描述特征)、比较方案、记忆回访、表达偏好 —— 共 8 种；覆盖 doing / problem-solving / describing / recalling / expressing / social。

### 第 7 章 独立生活（chapter_07_independent_life）

| # | 情景名 | 对应成长阶段 | 学习目标 | 推荐交互结构 | 三档难度差异 | 掌握证据 | 复现入口 |
|---|---|---|---|---|---|---|---|
| 7-1 | 自己管一周开销 | 独立生活 | 责任与数字；I spent... / I need to save... | 解决问题（描述特征） | 基础：点选 花在哪/存一点；中等：说 `I spent a little.`；进阶：说 `I need to save some each month.` | 用数字句独立做小计划（independent） | 长期生活自理；年度回顾 |
| 7-2 | 早上的例行流程 | 独立生活 | 流程与顺序；Then I... / After that... | 排列顺序 | 基础：点选 起床/洗漱/出门顺序；中等：说 `Then I make tea.`；进阶：说 `After that, I check the time.` | 用 `Then / After that` 独立叙述日常流程（independent） | 第七章自理；长期习惯 |
| 7-3 | 修理坏了的东西 | 独立生活 | 问题解决；It doesn't work. / Can you help? / Let's try... | 执行指令 | 基础：点选 求助/自己试/先放着；中等：说 `It doesn't work.`；进阶：说 `Let's try this first.` | 用问题句描述故障并提尝试（independent） | 长期自理；协作修复 |
| 7-4 | 老朋友又来访 | 独立生活 | 久别重逢；Do you remember...? / It's been... | 记忆回访 | 基础：点选 记得/好久/近况；中等：说 `Do you remember the lamp?`；进阶：说 `It's been a long time. How have you been?` | 用 `Do you remember...?` 复现早期记忆（transferring→mastered；呼应第七章完成条件"早期记忆至少复现 1 次"） | 长期关系；人生回顾 |
| 7-5 | 长期计划：明年想怎样 | 独立生活 | 长期打算；Next year I want to... / Maybe... | 比较方案 | 基础：点选 想换/想留/再想想；中等：说 `Next year I want to learn something new.`；进阶：说 `Maybe I'll stay, maybe I'll move.` | 用 `Next year I want to...` 独立表达长期打算（independent） | 长期目标；年度对话 |
| 7-6 | 照顾一盆植物 | 独立生活 | 责任与照料；It needs water. / I water it every... | 描述特征 | 基础：点选 浇水/晒太阳/看起来好；中等：说 `It needs water.`；进阶：说 `I water it every two days.` | 用照料句描述责任（transferring 自第一章 plant） | 长期生活；第一章植物记忆复现 |
| 7-7 | 给朋友一个建议 | 独立生活 | 双向社交；If I were you, I'd... / That's up to you. | 解释原因 | 基础：点选 建议/不替决定；中等：说 `That's up to you.`；进阶：说 `If I were you, I'd wait.` | 用朋友语气给建议但不替决定（independent；呼应圣经"朋友不替 Morrow 决定"） | 长期友谊；关系主题 |
| 7-8 | 人生快讲：从第一间房到现在 | 独立生活 | 综合回顾；At first... / Then... / Now... | 排列顺序 | 基础：点选 起点/现在/感慨；中等：说 `At first the room was blurry.`；进阶：说 `At first..., then..., now I...` 串起全程 | 用 `At first... then... now...` 独立串起个人成长线（mastered 收束） | 第七章人生回顾；记忆册总览 |

> 第 7 章共 8 个情景；交互结构：解决问题(描述特征)、排列顺序、执行指令、记忆回访、比较方案、描述特征、解释原因、排列顺序 —— 共 6 种；覆盖 problem-solving / doing / recalling / expressing / describing / social。

---

## C. "防退化"说明：避免退化成反复问"这是什么"

**问题**：如果把所有情景都做成"指一个东西 → 问这是什么 → 用户说名字"，学习会退化成机械指认，词汇停留在名词层，句型和沟通能力不增长，用户也会腻。本库用以下机制防退化：

1. **六能力强制铺开，不集中在 recognizing**：25 行映射里，认识事物 recognizing 只占事件 2、7、15、16、23、25 这一类；其余大量事件落在 describing、expressing、doing、social、problem-solving。新情景的默认起点不是"这是什么"，而是"你怎么看 / 你想怎么做 / 刚才发生了什么"。
2. **12 种交互结构轮换，而非只用指向命名**：日常事件从轮换池选取时，系统记录"最近 N 次用过哪种结构"，相邻两次不取同一结构；同一词汇点（如 apple）在不同次复现时强制换结构——第一次指向命名，第二次描述特征，第三次纠正误认，第四次生活任务，第五次表达偏好，第六次跨场景迁移（见 `OBJECT_LEARNING_EVENT_EXAMPLE.md` 苹果样板）。
3. **同一对象必须走完掌握六阶才算 mastered**：encountered（首次接触）→ recognized（能识别）→ prompted（提示下会用）→ independent（独立会用）→ transferring（迁移到新场景）→ mastered（稳定掌握）。停在"能说名字"只算 recognized，不进 mastered；必须有一次无提示独立表达 + 一次跨场景复现才升级。
4. **"掌握证据"是独立表达点，不是答对率**：每个事件的掌握证据都要求用户在无候选提示下说出完整句（如 `It is red and round.`），而非点对名词。点选只算 basic 参与，不直接判掌握。
5. **生活任务与社交贯穿始终**：从童年的"把苹果放进篮子"到毕业的"给朋友建议"，每个阶段都要求把语言用到真实做事/说话里，而不是停在命名题。
6. **记忆回访负责复现，不负责新学**：recall 类结构只在已有确认记忆时触发，且一次只调一条记忆；它的作用是把旧表达从 recognized 推到 transferring/mastered，绝不用来重复考"这是什么"。
7. **用户不替 Morrow 做决定、不被打分**：所有三档难度都只是"用户这次多说一点还是少说一点"，没有对错红叉、没有星级排名，避免把情景库做成题库。

---

## 数量自检（一行）

- 首两章映射：第一章 13 行 + 第二章 12 行 = **25 行**，与实际内容文件一致（计划称 24，实际 25，已全量映射）。
- 第 3 章 8 个情景 / 7 种交互结构；第 4 章 8 个 / 7 种；第 5 章 8 个 / 7 种；第 6 章 8 个 / 8 种；第 7 章 8 个 / 6 种。
- 第三至七章合计 **5 × 8 = 40 个候选情景**，每章均 ≥8 个、均 ≥4 种交互结构，且覆盖六类学习能力（recognizing / doing / describing / expressing / problem-solving / social）。
