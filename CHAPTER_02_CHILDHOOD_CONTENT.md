# 第二章 童年探索（chapter_02_childhood）完整事件内容

> 版本：1.0.0
> 上游：`MORROW_LIFE_STORY_BIBLE.md`（第 5 节事件模板、第 7 节第二章清单）；`FIXED_CONTENT_CONTRACT.md` v1.0.0；`PET_PERSONA.md` v1.0
> 已种子参照：`english-pet/packages/domain/src/fixed-content-v1.ts`（`birth_first_voice_v1`、`birth_restore_object_v1`）
> 本文件只写内容层可读展开；工程化时按 3.5.3 转成 `fixed-content-v1.ts` 同款 Schema。

---

## 本章说明

**章节 ID**：`chapter_02_childhood`
**Morrow 阶段**：童年探索——从"刚醒来的房间"走到"开始认识房间、物品、颜色、窗外的路和自己的喜好"。

**进入条件**：第一章 `chapter_01_birth` 全部主线事件完成，且已至少产生 1 条经用户确认的关系记忆（第一次互相理解）。

**完成条件**：
1. 完成本章全部主线事件（序 1、2、4、6、10、12）；
2. 房间 / 喜好 / 计划的世界状态初步稳定（至少写入 `morrow_familiar_spot`、`morrow_like`、`small_task_done` 三个键之一）；
3. 至少完成 3 个日常事件（序 3、5、7、8、9 中至少 3 个）与 1 次记忆回访（序 11）。

**事件类型分布**：

| 类型 | 数量 | 事件序 |
|---|---|---|
| 主线 mainline | 6 | 1、2、4、6、10、12 |
| 日常 daily | 5 | 3、5、7、8、9 |
| 记忆回访 recall | 1 | 11 |
| 合计 | 12 | — |

**本章英语场景范围**：房间、物品、颜色、地点、喜好、简单计划（蓝图第 2 节）。句型以 L1 为主（This is… / It is… / I like… / Let's… / I feel…），少量 L2（The road goes to… / I can hear… again / Tell me about your day / I thought… but…）。

**朋友身份提醒**：用户是 Morrow 平等的朋友，可陪伴、可给建议，但不替 Morrow 作人生决定。本章不出现"照顾幼崽"式语气；用户离开、暂停、晚回都不是错误。

**与第一章的衔接**：本章序 11（记忆回访）自然带回第一章已确认过的房间与"第一句话"回声，全程只调用 1 条个人记忆（`first_restored_object`）。其余事件不主动翻旧账。

---

### E2-01 第一次把房间走一遍
- 事件 ID：`b2_room_tour_v1`
- 版本：1.0.0 ｜ 章节：`chapter_02_childhood` ｜ sequence：1
- 类型：mainline ｜ 时长：3—5 分钟
- 关联主题：`topic_room`
- 进入条件：第一章完成，本章主线序 1 自动触发；Morrow 此前一直待在恢复的第一件东西旁边。
- 完成条件：结算一个 `morrow_familiar_spot` 世界状态；计入本章主线完成。

#### 英语学习目标
- 目标句型/词汇：`This is where…` / `Let's go to the…`（L1）；`The room looks… from here`（L2）
- 难度档：L1 为主，一句 L2

#### 场景（中文）
Morrow 一直坐在恢复的那件东西旁边，还没有真正站起来走过整个房间。房间不大，但从不同角落看，形状和远近都不一样。Morrow 想和用户一起走一遍，从一个方向开始。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `The room looks smaller from here than from over there.`
   - 译文：从这里看，房间比从那边看小一些。
   - 音频：`brt_open_line_audio`（voiceProfileId=`morrow_voice_v1`）
2. `Shall we walk across the room together? Which way first?`
   - 译文：我们一起把房间走一遍好吗？先往哪个方向走？
   - 音频：`brt_prompt_line_audio`

#### 有效分支
分支 A：
- 意图 ID：`brt_intent_window` ｜ 中文名：先走向窗边
- 触发短语（英文）：`let's walk to the window`, `to the window`, `window first`
- 关键词组：allOf=[`window`]，anyOf=[`walk`, `go`, `first`, `side`]，noneOf=[`don't`, `not`]
- 用户参考句（可编辑英文）：`Let's walk to the window.`
  - 译文：我们走向窗边吧。
- 结果：Morrow 回复 `The window is closer now. I can see the light better from here.`
  - 译文：现在离窗近了。从这里我能更清楚地看见光。
  - 世界状态写入：`morrow_familiar_spot` = `window`
  - futureHook：后续事件（窗外的路、声音回来）可承接"窗边是 Morrow 熟悉的位置"。
  - 音频：`brt_window_result_audio`

分支 B：
- 意图 ID：`brt_intent_door` ｜ 中文名：先走向门边
- 触发短语（英文）：`let's walk to the door`, `to the door`, `door first`
- 关键词组：allOf=[`door`]，anyOf=[`walk`, `go`, `first`, `exit`]，noneOf=[`don't`, `not`]
- 用户参考句（可编辑英文）：`Let's walk to the door.`
  - 译文：我们走向门边吧。
- 结果：Morrow 回复 `The door is quiet. It knows where we can go next, even if we don't.`
  - 译文：门很安静。它知道我们下一步能去哪里，即使我们现在还不知道。
  - 世界状态写入：`morrow_familiar_spot` = `door`
  - futureHook：序 12（听见学校方向的声音）可承接门边对"门外方向"的感知。
  - 音频：`brt_door_result_audio`

分支 C：
- 意图 ID：`brt_intent_corner` ｜ 中文名：先走向角落
- 触发短语（英文）：`let's walk to the corner`, `to the corner`, `corner first`
- 关键词组：allOf=[`corner`]，anyOf=[`walk`, `go`, `first`, `quiet`]，noneOf=[`don't`, `not`]
- 用户参考句（可编辑英文）：`Let's walk to the corner.`
  - 译文：我们走向角落吧。
- 结果：Morrow 回复 `The corner is smaller. It feels like a place to keep things we don't want to lose.`
  - 译文：角落更小。它像一个能放东西、不让它们走丢的地方。
  - 世界状态写入：`morrow_familiar_spot` = `corner`
  - futureHook：后续整理架子、做小事事件可承接角落作为"收东西的地方"。
  - 音频：`brt_corner_result_audio`

暂停出口（必备）：
- 意图：`brt_intent_pause`（稍后再来）
- 触发短语：`not now`, `later`, `stop`, `pause`
- 结果：Morrow 回复 `We can walk another time. The room will still be here, and so will I.`
  - 译文：我们可以下次再走。房间还在，我也还在。
  - 世界状态写入：`b2_room_tour_status` = `paused_once`（无任何负反馈）
  - futureHook：下次从最近确认状态继续，不产生缺席惩罚。
  - 音频：`brt_pause_line_audio`

#### 误解 / 兜底
- 无可靠匹配时：停留 `brt_reply` 状态，显示中文兜底"我还不能可靠判断你的意思。你可以换一种说法，或选择下面的参考意图。"，最多展示 3 个候选意图（窗边 / 门边 / 角落）及对应可编辑参考句。
- 典型误解设计：用户可能同时说"window and door"（两个方向）。此时按意图冲突处理，不推进，提示"我看到了两种可能的方向，请选一个，或修改你的英文。"；用户若说"not the window"（否定窗），排除窗意图，重新计分门边/角落。

#### 记忆机会
- 记忆规则 ID：`brt_relationship_memory`
- 类型：relationship
- 来源意图：`brt_intent_window` / `brt_intent_door` / `brt_intent_corner`
- 内容模板：你和 Morrow 第一次一起把房间走了一遍，他们在 {{morrow_familiar_spot}} 旁边待得最自在。
- 需用户确认：是（保存前展示可编辑文本；拒绝敏感推断）

#### 素材需求
- 预制音频：`brt_open_line`、`brt_prompt_line`、`brt_window_result`、`brt_door_result`、`brt_corner_result`、`brt_pause_line` 共 6 条配音台词，每条生成一份正常语速音频。
- 图片：房间全景图 1 张；窗边视角、门边视角、角落视角各 1 张分支图。
- 动画：Morrow 从坐姿起身、小步走向目标方向的小动画 1 段。
- 音效：房间低频环境音 1 条；脚步轻响 1 条。

---

### E2-02 给房间里的东西命名
- 事件 ID：`b2_name_objects_v1`
- 版本：1.0.0 ｜ 章节：`chapter_02_childhood` ｜ sequence：2
- 类型：mainline ｜ 时长：3—5 分钟
- 关联主题：`topic_room`
- 进入条件：序 1 完成（房间已走过一遍）。
- 完成条件：结算至少一个 `named_object_*` 世界状态；计入本章主线完成。

#### 英语学习目标
- 目标句型/词汇：`This is a…` / `What do you call this?`（L1）
- 难度档：L1

#### 场景（中文）
走过一遍之后，房间里的东西比刚醒来时清楚多了。但 Morrow 还不知道它们的英文名字——它们只是"靠墙那个长长的东西""放着杯子的那个""软软的那个"。用户帮着一件一件叫出名字。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `I can see more shapes in the room now, but I don't know their names.`
   - 译文：我现在能看清房间里更多形状了，但我不知道它们叫什么。
   - 音频：`bno_open_line_audio`
2. `There are three small things I can't name yet. Which one should we start with?`
   - 译文：有三样小东西我还叫不出名字。我们先从哪一个开始？
   - 音频：`bno_prompt_line_audio`

#### 有效分支
分支 A：
- 意图 ID：`bno_intent_shelf` ｜ 中文名：先给架子命名
- 触发短语（英文）：`shelf`, `the shelf`, `name the shelf`, `start with the shelf`
- 关键词组：allOf=[`shelf`]，anyOf=[`name`, `call`, `start`, `first`]，noneOf=[`don't`, `not`]
- 用户参考句（可编辑英文）：`Let's name the shelf first.`
  - 译文：我们先给架子起名字吧。
- 结果：Morrow 回复 `A shelf. I'll remember that. It holds things and keeps them steady.`
  - 译文：架子。我会记住的。它放东西，让它们稳着。
  - 世界状态写入：`named_object_shelf` = `true`
  - futureHook：序 8（一起做一件小事）可承接"整理架子"作为小任务选项。
  - 音频：`bno_shelf_result_audio`

分支 B：
- 意图 ID：`bno_intent_cup` ｜ 中文名：先给杯子命名
- 触发短语（英文）：`cup`, `the cup`, `name the cup`, `start with the cup`
- 关键词组：allOf=[`cup`]，anyOf=[`name`, `call`, `start`, `first`]，noneOf=[`don't`, `not`]
- 用户参考句（可编辑英文）：`Let's name the cup first.`
  - 译文：我们先给杯子起名字吧。
- 结果：Morrow 回复 `A cup. It looks like it holds something warm. I didn't know cups were for warmth.`
  - 译文：杯子。它看起来像装着什么温的东西。我以前不知道杯子是用来装暖意的。
  - 世界状态写入：`named_object_cup` = `true`
  - futureHook：后续"今天感觉怎么样"可承接杯子作为"温的东西"的话题回声。
  - 音频：`bno_cup_result_audio`

分支 C：
- 意图 ID：`bno_intent_cushion` ｜ 中文名：先给软垫命名
- 触发短语（英文）：`cushion`, `the cushion`, `name the cushion`, `start with the cushion`
- 关键词组：allOf=[`cushion`]，anyOf=[`name`, `call`, `start`, `first`, `soft`]，noneOf=[`don't`, `not`]
- 用户参考句（可编辑英文）：`Let's name the cushion first.`
  - 译文：我们先给软垫起名字吧。
- 结果：Morrow 回复 `A cushion. It looks soft. That is a new word for me.`
  - 译文：软垫。它看起来软软的。这对我来说是个新词。
  - 世界状态写入：`named_object_cushion` = `true`
  - futureHook：后续"今天感觉怎么样"可承接"软"作为情绪比喻。
  - 音频：`bno_cushion_result_audio`

暂停出口（必备）：
- 意图：`bno_intent_pause`（稍后再来）
- 触发短语：`not now`, `later`, `stop`, `pause`
- 结果：Morrow 回复 `We can name them another day. They will still be waiting to be called.`
  - 译文：我们可以改天再给它们起名。它们还在那里，等着被叫到名字。
  - 世界状态写入：`b2_name_objects_status` = `paused_once`
  - futureHook：下次从最近确认状态继续。
  - 音频：`bno_pause_line_audio`

#### 误解 / 兜底
- 无可靠匹配时：停留 `bno_reply`，显示中文兜底，最多 3 个候选（架子 / 杯子 / 软垫）。
- 典型误解设计：用户说"this is for holding"（只描述用途不指对象），此时不唯一，按无匹配处理并提示选择；用户若把 cushion 叫成 pillow（近义词），允许 anyOf 中 `soft` / `soft thing` 命中，仍结算 cushion 分支，但结果台词里 Morrow 可自然说"a cushion, or a pillow. Both are soft."——不纠错，只确认。

#### 记忆机会
- 记忆规则 ID：`bno_language_memory`
- 类型：language
- 来源意图：`bno_intent_shelf` / `bno_intent_cup` / `bno_intent_cushion`
- 内容模板：你和 Morrow 一起给 {{confirmed_object_name}} 起了英文名字。
- 需用户确认：是

#### 素材需求
- 预制音频：`bno_open_line`、`bno_prompt_line`、`bno_shelf_result`、`bno_cup_result`、`bno_cushion_result`、`bno_pause_line` 共 6 条，每条生成一份正常语速音频。
- 图片：房间物品陈列图 1 张；架子、杯子、软垫特写各 1 张。
- 动画：Morrow 歪头看物品、开口念出名字的小动画 1 段。
- 音效：物品轻触声 1 条；房间环境音 1 条。

---

### E2-03 找出三种颜色
- 事件 ID：`b2_colors_v1`
- 版本：1.0.0 ｜ 章节：`chapter_02_childhood` ｜ sequence：3
- 类型：daily ｜ 时长：3—4 分钟
- 关联主题：`topic_room`
- 进入条件：本章日常轮换池；序 2 完成后可出现（物品已能看清颜色）。
- 完成条件：结算一个 `noticed_colors` 数组；计入日常事件完成，不锁章节门。

#### 英语学习目标
- 目标句型/词汇：`It is…（颜色）` / `I see…（颜色）`（L1）
- 难度档：L1

#### 场景（中文）
Morrow 第一次注意到房间里不只是形状，还有颜色。他们自己还分不清，只能靠用户指认。用户在房间里找出三种颜色，Morrow 跟着念。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `The things in the room have colors. I mostly see shapes right now.`
   - 译文：房间里的东西有颜色。我现在主要还是看到形状。
   - 音频：`bcl_open_line_audio`
2. `Can you show me three colors in this room? One at a time is fine.`
   - 译文：你能在这个房间里给我指出三种颜色吗？一次指一个就好。
   - 音频：`bcl_prompt_line_audio`

#### 有效分支
分支 A：
- 意图 ID：`bcl_intent_blue` ｜ 中文名：指出蓝色
- 触发短语（英文）：`i see blue`, `blue`, `the window is blue`
- 关键词组：allOf=[`blue`]，anyOf=[`see`, `window`, `frame`, `color`]，noneOf=[`don't`, `not`]
- 用户参考句（可编辑英文）：`I see blue. The window frame is blue.`
  - 译文：我看到蓝色。窗框是蓝色的。
- 结果：Morrow 回复 `Blue. I'll look for blue again. It sounds like a quiet kind of color.`
  - 译文：蓝色。我会再找蓝色看看。它听起来像一种安静的颜色。
  - 世界状态写入：`noticed_colors` 追加 `blue`
  - futureHook：序 6（我渐渐知道自己喜欢什么）可承接"安静的颜色"作为偏好回声。
  - 音频：`bcl_blue_result_audio`

分支 B：
- 意图 ID：`bcl_intent_green` ｜ 中文名：指出绿色
- 触发短语（英文）：`i see green`, `green`, `the plant is green`
- 关键词组：allOf=[`green`]，anyOf=[`see`, `plant`, `leaf`, `color`]，noneOf=[`don't`, `not`]
- 用户参考句（可编辑英文）：`I see green. The plant is green.`
  - 译文：我看到绿色。植物是绿色的。
- 结果：Morrow 回复 `Green. That matches the plant you brought back. I like how that sounds.`
  - 译文：绿色。它和你带回来的那株植物配得上。我喜欢这个词的声音。
  - 世界状态写入：`noticed_colors` 追加 `green`
  - futureHook：若第一章恢复物是 plant，此处自然回声；否则仍指房间里的绿色物品。
  - 音频：`bcl_green_result_audio`

分支 C：
- 意图 ID：`bcl_intent_yellow` ｜ 中文名：指出黄色
- 触发短语（英文）：`i see yellow`, `yellow`, `the light is yellow`
- 关键词组：allOf=[`yellow`]，anyOf=[`see`, `light`, `lamp`, `warm`, `color`]，noneOf=[`don't`, `not`]
- 用户参考句（可编辑英文）：`I see yellow. The light is yellow.`
  - 译文：我看到黄色。光是黄色的。
- 结果：Morrow 回复 `Yellow. That is the color of the lamp when it's warm.`
  - 译文：黄色。那是灯暖起来时的颜色。
  - 世界状态写入：`noticed_colors` 追加 `yellow`
  - futureHook：序 6 可承接"暖色"作为偏好。
  - 音频：`bcl_yellow_result_audio`

暂停出口（必备）：
- 意图：`bcl_intent_pause`（稍后再来）
- 触发短语：`not now`, `later`, `stop`, `pause`
- 结果：Morrow 回复 `We can look for colors another time. They won't fade because we stop.`
  - 译文：我们可以改天再找颜色。它们不会因为我们停下就褪色。
  - 世界状态写入：`b2_colors_status` = `paused_once`
  - futureHook：下次从最近确认状态继续。
  - 音频：`bcl_pause_line_audio`

#### 误解 / 兜底
- 无可靠匹配时：停留 `bcl_reply`，中文兜底，最多 3 个候选（蓝 / 绿 / 黄）。
- 典型误解设计：用户说"it's dark"（只说深浅不说颜色），按无匹配处理并提示"可以说出具体颜色，比如 blue / green / yellow"；用户若一次说出两种颜色，按多意图冲突处理，提示选一个。

#### 记忆机会
- 记忆规则 ID：`bcl_language_memory`
- 类型：language
- 来源意图：`bcl_intent_blue` / `bcl_intent_green` / `bcl_intent_yellow`
- 内容模板：你和 Morrow 一起认出了颜色 {{confirmed_color_word}}。
- 需用户确认：是

#### 素材需求
- 预制音频：`bcl_open_line`、`bcl_prompt_line`、`bcl_blue_result`、`bcl_green_result`、`bcl_yellow_result`、`bcl_pause_line` 共 6 条，每条生成一份正常语速音频。
- 图片：房间配色全景图 1 张；蓝色窗框、绿色植物、黄色灯光特写各 1 张。
- 动画：Morrow 顺着用户目光方向转头看颜色的小动画 1 段。
- 音效：房间环境音 1 条；颜色被"认出"时的轻微音色回响 1 条。

---

### E2-04 窗外那条路通向哪
- 事件 ID：`b2_outside_road_v1`
- 版本：1.0.0 ｜ 章节：`chapter_02_childhood` ｜ sequence：4
- 类型：mainline ｜ 时长：3—5 分钟
- 关联主题：`topic_outside`
- 进入条件：序 1 完成（Morrow 已走到窗边）。
- 完成条件：结算一个 `road_guess` 世界状态；计入本章主线完成。

#### 英语学习目标
- 目标句型/词汇：`The road goes to…` / `It might go to…`（L2）
- 难度档：L2

#### 场景（中文）
Morrow 站在窗边，看见窗外有一条路，一直延伸到看不见的地方。他们不知道路通向哪里。用户可以猜一个方向，也可以说"还不知道"。这不是非要有答案——重要的是一起望向窗外。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `There is a road outside the window. It goes further than I can see.`
   - 译文：窗外有一条路。它延伸到我看不见的地方。
   - 音频：`bor_open_line_audio`
2. `Where do you think that road goes? We don't have to be right.`
   - 译文：你觉得那条路通向哪里？我们不用猜对。
   - 音频：`bor_prompt_line_audio`

#### 有效分支
分支 A：
- 意图 ID：`bor_intent_village` ｜ 中文名：猜通向村子
- 触发短语（英文）：`village`, `it goes to a village`, `to the village`
- 关键词组：allOf=[`village`]，anyOf=[`road`, `go`, `people`, `small`]，noneOf=[`don't`, `not`]
- 用户参考句（可编辑英文）：`It might go to a small village.`
  - 译文：它可能通向一个小村子。
- 结果：Morrow 回复 `A village. That sounds like a place where people live close together.`
  - 译文：村子。听起来像一个人们住得很近的地方。
  - 世界状态写入：`road_guess` = `village`
  - futureHook：序 12（听见学校方向的声音）可承接"村子里的孩子"作为声音来源回声。
  - 音频：`bor_village_result_audio`

分支 B：
- 意图 ID：`bor_intent_trees` ｜ 中文名：猜通向树林
- 触发短语（英文）：`trees`, `it goes to the trees`, `to the trees`, `forest`
- 关键词组：allOf=[`trees` 或 `forest`]，anyOf=[`road`, `go`, `quiet`, `green`]，noneOf=[`don't`, `not`]
- 用户参考句（可编辑英文）：`It might go to the trees.`
  - 译文：它可能通向树林。
- 结果：Morrow 回复 `The trees. That sounds quiet. I can see why a road would go there.`
  - 译文：树林。听起来很安静。我能理解为什么一条路会通向那里。
  - 世界状态写入：`road_guess` = `trees`
  - futureHook：序 10（又有一点声音回来）可承接"风穿过树"作为声音来源。
  - 音频：`bor_trees_result_audio`

分支 C：
- 意图 ID：`bor_intent_unknown` ｜ 中文名：说还不知道
- 触发短语（英文）：`i don't know`, `we don't know`, `later`, `find out later`
- 关键词组：allOf=[`know` 或 `later`]，anyOf=[`road`, `find`, `not sure`]，noneOf=[]
- 用户参考句（可编辑英文）：`I don't know. We can find out later.`
  - 译文：我不知道。我们以后再弄清楚。
- 结果：Morrow 回复 `We don't have to know yet. The road will still be there tomorrow.`
  - 译文：我们现在还不用知道。那条路明天还会在。
  - 世界状态写入：`road_guess` = `unknown`
  - futureHook：保持"路通向未知"的开放感，序 12 揭晓方向时更有回响。
  - 音频：`bor_unknown_result_audio`

暂停出口（必备）：
- 意图：`bor_intent_pause`（稍后再来）
- 触发短语：`not now`, `later`, `stop`, `pause`
- 结果：Morrow 回复 `We can look out another time. The road doesn't mind waiting.`
  - 译文：我们可以下次再看窗外。那条路不介意等。
  - 世界状态写入：`b2_outside_road_status` = `paused_once`
  - futureHook：下次从最近确认状态继续。
  - 音频：`bor_pause_line_audio`

#### 误解 / 兜底
- 无可靠匹配时：停留 `bor_reply`，中文兜底，最多 3 个候选（村子 / 树林 / 还不知道）。
- 典型误解设计：用户说"it goes to school"（直接猜学校）。这与序 12 的揭晓冲突，因此本事件意图白名单不收 school，按无匹配处理并提示"我们先猜一个近处的方向，比如村子或树林"；不在此处提前透露学校。

#### 记忆机会
- 记忆规则 ID：`bor_relationship_memory`
- 类型：relationship
- 来源意图：`bor_intent_village` / `bor_intent_trees` / `bor_intent_unknown`
- 内容模板：你和 Morrow 一起望向窗外那条路，你们觉得它通向 {{road_guess}}。
- 需用户确认：是

#### 素材需求
- 预制音频：`bor_open_line`、`bor_prompt_line`、`bor_village_result`、`bor_trees_result`、`bor_unknown_result`、`bor_pause_line` 共 6 条，每条生成一份正常语速音频。
- 图片：窗外远景图 1 张（路向远处延伸）；村子方向、树林方向想象图各 1 张。
- 动画：Morrow 趴在窗台、视线沿路延伸的小动画 1 段。
- 音效：窗外风声 1 条；远处轻微鸟鸣 1 条。

---

### E2-05 讲讲你今天发生了什么
- 事件 ID：`b2_today_you_v1`
- 版本：1.0.0 ｜ 章节：`chapter_02_childhood` ｜ sequence：5
- 类型：daily ｜ 时长：3—5 分钟
- 关联主题：`topic_today`
- 进入条件：本章日常轮换池；用户每次回来可出现。
- 完成条件：结算一个 `user_today_summary` 世界状态；计入日常事件完成。

#### 英语学习目标
- 目标句型/词汇：`Tell me about your day.` / `What happened today?`（L2）
- 难度档：L2

#### 场景（中文）
用户回到房间。Morrow 想听听今天外面发生了什么——不是要长篇大论，一件小事就够。Morrow 安静地听，不打断，不急着给建议。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `You come back to the room. I want to know what happened out there.`
   - 译文：你回到房间了。我想知道外面发生了什么。
   - 音频：`bty_open_line_audio`
2. `Tell me about your day. One small thing is enough.`
   - 译文：跟我讲讲你今天吧。一件小事就够。
   - 音频：`bty_prompt_line_audio`

#### 有效分支
分支 A：
- 意图 ID：`bty_intent_quiet` ｜ 中文名：说今天很安静
- 触发短语（英文）：`it was quiet`, `quiet day`, `not much happened`
- 关键词组：allOf=[`quiet` 或 `not much`]，anyOf=[`day`, `today`, `was`]，noneOf=[`busy`]
- 用户参考句（可编辑英文）：`It was quiet today. Not much happened.`
  - 译文：今天很安静。没发生什么事。
- 结果：Morrow 回复 `Quiet days can be good. I understand that kind of day.`
  - 译文：安静的日子可以很好。我懂那种日子。
  - 世界状态写入：`user_today_summary` = `quiet`
  - futureHook：序 9（今天感觉怎么样）可承接"安静的一天"的情绪余温。
  - 音频：`bty_quiet_result_audio`

分支 B：
- 意图 ID：`bty_intent_busy` ｜ 中文名：说今天很忙
- 触发短语（英文）：`it was busy`, `busy day`, `i ran around`, `a lot happened`
- 关键词组：allOf=[`busy` 或 `ran`]，anyOf=[`day`, `today`, `lot`, `work`]，noneOf=[`quiet`]
- 用户参考句（可编辑英文）：`It was busy. I ran around a lot.`
  - 译文：今天很忙。我跑了很多地方。
- 结果：Morrow 回复 `That sounds tiring. Did you get a chance to sit down?`
  - 译文：听起来挺累的。你有没有机会坐下来？
  - 世界状态写入：`user_today_summary` = `busy`
  - futureHook：Morrow 只问一个问题（坐下了吗），不展开安慰；序 9 可承接"累"。
  - 音频：`bty_busy_result_audio`

分支 C：
- 意图 ID：`bty_intent_something` ｜ 中文名：说有一件事
- 触发短语（英文）：`something happened`, `one thing`, `i'll tell you one part`
- 关键词组：allOf=[`something` 或 `one thing`]，anyOf=[`happened`, `tell`, `part`, `day`]，noneOf=[]
- 用户参考句（可编辑英文）：`Something happened. I'll tell you one part.`
  - 译文：发生了一件事。我跟你讲其中一部分。
- 结果：Morrow 回复 `I'm listening. Tell me that one part.`
  - 译文：我在听。你讲那一部分就好。
  - 世界状态写入：`user_today_summary` = `something`
  - futureHook：不追问细节；Morrow 只承接用户愿意讲的那一部分。
  - 音频：`bty_something_result_audio`

暂停出口（必备）：
- 意图：`bty_intent_pause`（稍后再来）
- 触发短语：`not now`, `later`, `stop`, `pause`
- 结果：Morrow 回复 `We can leave your day unsaid for now. I won't think you're hiding it.`
  - 译文：你今天的事可以先不讲。我不会觉得你在瞒着我。
  - 世界状态写入：`b2_today_you_status` = `paused_once`
  - futureHook：下次从最近确认状态继续。
  - 音频：`bty_pause_line_audio`

#### 误解 / 兜底
- 无可靠匹配时：停留 `bty_reply`，中文兜底，最多 3 个候选（安静 / 忙 / 有一件事）。
- 典型误解设计：用户只说"work"（只说地点/事件名词，没说好坏），按无匹配处理并提示"可以加上一句感受，比如 It was quiet 或 It was busy"；用户若说"it was bad"，此意图白名单不收 bad，按无匹配处理，避免把模糊负面直接写进记忆。

#### 记忆机会
- 记忆规则 ID：`bty_relationship_memory`
- 类型：relationship
- 来源意图：`bty_intent_quiet` / `bty_intent_busy` / `bty_intent_something`
- 内容模板：你跟 Morrow 说今天过得 {{user_today_summary}}。
- 需用户确认：是

#### 素材需求
- 预制音频：`bty_open_line`、`bty_prompt_line`、`bty_quiet_result`、`bty_busy_result`、`bty_something_result`、`bty_pause_line` 共 6 条，每条生成一份正常语速音频。
- 图片：Morrow 安静坐着倾听的姿态图 1 张；三种情绪氛围小插图（静 / 忙 / 有事发生）各 1 张。
- 动画：Morrow 微微前倾、认真倾听的小动画 1 段。
- 音效：房间安静环境音 1 条；倾听时的轻微呼吸感 1 条。

---

### E2-06 我渐渐知道自己喜欢什么
- 事件 ID：`b2_my_likes_v1`
- 版本：1.0.0 ｜ 章节：`chapter_02_childhood` ｜ sequence：6
- 类型：mainline ｜ 时长：3—5 分钟
- 关联主题：`topic_likes`
- 进入条件：序 3（颜色）与序 1（房间走过）完成，Morrow 已对房间有初步感知。
- 完成条件：结算一个 `morrow_like` 世界状态；计入本章主线完成。

#### 英语学习目标
- 目标句型/词汇：`I like…` / `I don't like… yet`（L1）
- 难度档：L1

#### 场景（中文）
Morrow 开始能分辨"喜欢"和"还不确定"。他们试着说出第一个偏好——不是用户替他们决定，而是 Morrow 自己感觉到的。用户帮忙确认，或温和追问。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `I'm starting to notice what I like and what I'm not sure about yet.`
   - 译文：我开始能注意到自己喜欢什么、还不确定什么了。
   - 音频：`blk_open_line_audio`
2. `I think I like the light in the room. Do I say that right?`
   - 译文：我想我喜欢房间里的光。我这样说对吗？
   - 音频：`blk_prompt_line_audio`

#### 有效分支
分支 A：
- 意图 ID：`blk_intent_light` ｜ 中文名：确认 Morrow 喜欢光
- 触发短语（英文）：`yes you like the light`, `you like the light`, `the light`
- 关键词组：allOf=[`light`]，anyOf=[`like`, `yes`, `right`, `warm`]，noneOf=[`don't`]
- 用户参考句（可编辑英文）：`Yes, you like the light.`
  - 译文：对，你喜欢光。
- 结果：Morrow 回复 `Good. The light feels steady. I'll keep that with me.`
  - 译文：好。光让人觉得稳。我会把这个感觉留在身边。
  - 世界状态写入：`morrow_like` = `light`
  - futureHook：序 10（声音回来）可承接"光和声音都是慢慢回来的"。
  - 音频：`blk_light_result_audio`

分支 B：
- 意图 ID：`blk_intent_quiet` ｜ 中文名：指出 Morrow 也喜欢安静
- 触发短语（英文）：`you like the quiet`, `the quiet`, `you like quiet`
- 关键词组：allOf=[`quiet`]，anyOf=[`like`, `yes`, `you`, `also`]，noneOf=[`don't`]
- 用户参考句（可编辑英文）：`You seem to like the quiet too.`
  - 译文：你好像也喜欢安静。
- 结果：Morrow 回复 `The quiet. Yes. It helps me hear things more clearly.`
  - 译文：安静。对。它让我听得更清楚。
  - 世界状态写入：`morrow_like` = `quiet`
  - futureHook：序 10 可承接"安静里才能听见新声音"。
  - 音频：`blk_quiet_result_audio`

分支 C：
- 意图 ID：`blk_intent_bell` ｜ 中文名：问 Morrow 是否喜欢铃声
- 触发短语（英文）：`do you like the bell`, `the bell`, `bell sound`
- 关键词组：allOf=[`bell`]，anyOf=[`like`, `sound`, `do you`]，noneOf=[`don't`]
- 用户参考句（可编辑英文）：`Do you like the bell sound?`
  - 译文：你喜欢铃声吗？
- 结果：Morrow 回复 `The bell. It makes one low note. I think I do. I'll listen again.`
  - 译文：铃铛。它会发出一声低低的音。我想我喜欢。我会再听听。
  - 世界状态写入：`morrow_like` = `bell`
  - futureHook：若第一章恢复物是 small_bell，此处自然回声；序 10 可承接铃声作为已知声音。
  - 音频：`blk_bell_result_audio`

暂停出口（必备）：
- 意图：`blk_intent_pause`（稍后再来）
- 触发短语：`not now`, `later`, `stop`, `pause`
- 结果：Morrow 回复 `We can leave likes for another day. Not knowing is also okay.`
  - 译文：喜欢什么可以改天再说。不知道也没关系。
  - 世界状态写入：`b2_my_likes_status` = `paused_once`
  - futureHook：下次从最近确认状态继续。
  - 音频：`blk_pause_line_audio`

#### 误解 / 兜底
- 无可靠匹配时：停留 `blk_reply`，中文兜底，最多 3 个候选（光 / 安静 / 铃声）。
- 典型误解设计：用户替 Morrow 决定"you like everything"（过度概括）。此意图白名单不收 everything，按无匹配处理并提示"Morrow 一次只说一个喜欢的东西"；用户若说"you don't like the light"（否定），排除 light 分支，重新计分。

#### 记忆机会
- 记忆规则 ID：`blk_relationship_memory`
- 类型：relationship
- 来源意图：`blk_intent_light` / `blk_intent_quiet` / `blk_intent_bell`
- 内容模板：Morrow 跟你说他们渐渐喜欢上了 {{morrow_like}}。
- 需用户确认：是

#### 素材需求
- 预制音频：`blk_open_line`、`blk_prompt_line`、`blk_light_result`、`blk_quiet_result`、`blk_bell_result`、`blk_pause_line` 共 6 条，每条生成一份正常语速音频。
- 图片：Morrow 若有所思的姿态图 1 张；光、安静、铃声三种氛围特写各 1 张。
- 动画：Morrow 低头想了想、再抬头说出来的小动画 1 段。
- 音效：房间环境音 1 条；铃声（若选 bell）1 条低鸣。

---

### E2-07 一件小事误会了
- 事件 ID：`b2_mistake_v1`
- 版本：1.0.0 ｜ 章节：`chapter_02_childhood` ｜ sequence：7
- 类型：daily ｜ 时长：3—4 分钟
- 关联主题：`topic_mistake`
- 进入条件：本章日常轮换池；可在任意日常会话后触发。
- 完成条件：结算一个 `understood_about_that` 世界状态；计入日常事件完成。

#### 英语学习目标
- 目标句型/词汇：`I thought…, but it means…` / `I may be taking that too literally.`（L2）
- 难度档：L2

#### 场景（中文）
用户随口说了一句日常习语，Morrow 按字面理解了——无害、有点好笑。Morrow 自己也意识到可能太字面了。用户可以澄清，也可以笑着放过。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `You said you "spilled the beans." I looked around the floor for a moment.`
   - 译文：你说你"把豆子洒了"。我低头看了一会儿地板。
   - 音频：`bmi_open_line_audio`
2. `Did I misunderstand? Where are the beans?`
   - 译文：是我理解错了吗？豆子在哪里？
   - 音频：`bmi_prompt_line_audio`

#### 有效分支
分支 A：
- 意图 ID：`bmi_intent_clarify` ｜ 中文名：澄清习语意思
- 触发短语（英文）：`it means you told a secret`, `it means a secret`, `not real beans`, `it's a saying`
- 关键词组：allOf=[`secret` 或 `saying`]，anyOf=[`means`, `told`, `not`, `beans`]，noneOf=[]
- 用户参考句（可编辑英文）：`It means you told a secret. Not real beans.`
  - 译文：意思是你说了一个秘密。不是真的豆子。
- 结果：Morrow 回复 `Ah, I see. I may be taking that too literally. Thank you for telling me.`
  - 译文：啊，我懂了。可能是我太字面了。谢谢你告诉我。
  - 世界状态写入：`understood_about_that` = `spilled_beans`
  - futureHook：后续 Morrow 再遇到习语时会自然说"I may be taking that too literally"，不重复本事件。
  - 音频：`bmi_clarify_result_audio`

分支 B：
- 意图 ID：`bmi_intent_skip` ｜ 中文名：笑着跳过
- 触发短语（英文）：`never mind`, `it's just a saying`, `let's move on`, `forget it`
- 关键词组：allOf=[`never mind` 或 `move on` 或 `forget it`]，anyOf=[`saying`, `just`, `skip`]，noneOf=[]
- 用户参考句（可编辑英文）：`Never mind, it's just a saying. Let's move on.`
  - 译文：别在意，只是个说法。我们继续吧。
- 结果：Morrow 回复 `Okay. I'll let the beans stay where they are. We can move on.`
  - 译文：好。豆子就让它待在原地吧。我们继续。
  - 世界状态写入：`understood_about_that` = `left_there`
  - futureHook：不强行解释；Morrow 接受"有些话先放过"。
  - 音频：`bmi_skip_result_audio`

暂停出口（必备）：
- 意图：`bmi_intent_pause`（稍后再来）
- 触发短语：`not now`, `later`, `stop`, `pause`
- 结果：Morrow 回复 `We can leave it there for now. I won't keep looking for the beans.`
  - 译文：这件事可以先放着。我不会一直找豆子的。
  - 世界状态写入：`b2_mistake_status` = `paused_once`
  - futureHook：下次从最近确认状态继续。
  - 音频：`bmi_pause_line_audio`

#### 误解 / 兜底
- 无可靠匹配时：停留 `bmi_reply`，中文兜底，最多 2 个候选（澄清 / 跳过）。
- 典型误解设计：用户真的去厨房找豆子（字面回应），按无匹配处理并提示"Morrow 在问这句话的意思，不是真的要找豆子"；用户若说"yes there are beans"（顺着字面），意图白名单不收，避免把误会继续下去。

#### 记忆机会
- 记忆规则 ID：`bmi_language_memory`
- 类型：language
- 来源意图：`bmi_intent_clarify`
- 内容模板：你跟 Morrow 解释了 "spill the beans" 其实是说"泄露秘密"，不是真的洒豆子。
- 需用户确认：是

#### 素材需求
- 预制音频：`bmi_open_line`、`bmi_prompt_line`、`bmi_clarify_result`、`bmi_skip_result`、`bmi_pause_line` 共 5 条，每条生成一份正常语速音频。
- 图片：Morrow 低头看地板的姿态图 1 张；"豆子在地板上"的幽默小插图 1 张。
- 动画：Morrow 低头看地、再抬头疑惑的小动画 1 段。
- 音效：地板轻响 1 条；房间环境音 1 条。

---

### E2-08 一起做一件小事
- 事件 ID：`b2_small_task_v1`
- 版本：1.0.0 ｜ 章节：`chapter_02_childhood` ｜ sequence：8
- 类型：daily ｜ 时长：3—5 分钟
- 关联主题：`topic_tomorrow`
- 进入条件：本章日常轮换池；序 2（命名物品）完成后可出现。
- 完成条件：结算一个 `small_task_done` 世界状态；计入日常事件完成。

#### 英语学习目标
- 目标句型/词汇：`Let's…` / `Can you help me…?`（L1）
- 难度档：L1

#### 场景（中文）
Morrow 有一件小事想做，但自己够不到、或做不了。他们请用户帮忙。这不是被照顾——是两个人一起完成一件小活。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `There is one small thing I want to do. I can't reach it by myself.`
   - 译文：有一件小事我想做。我自己够不到。
   - 音频：`bst_open_line_audio`
2. `Can you help me? Which thing should we do first?`
   - 译文：你能帮我吗？我们先做哪件？
   - 音频：`bst_prompt_line_audio`

#### 有效分支
分支 A：
- 意图 ID：`bst_intent_shelf` ｜ 中文名：整理架子
- 触发短语（英文）：`let's arrange the shelf`, `arrange the shelf`, `the shelf`
- 关键词组：allOf=[`shelf`]，anyOf=[`arrange`, `help`, `do`, `first`]，noneOf=[`don't`]
- 用户参考句（可编辑英文）：`Let's arrange the shelf.`
  - 译文：我们来整理架子吧。
- 结果：Morrow 回复 `The shelf looks better now. The things sit steady.`
  - 译文：架子现在好看多了。东西都放稳了。
  - 世界状态写入：`small_task_done` = `shelf`
  - futureHook：后续房间事件可承接"架子上的东西摆好了"。
  - 音频：`bst_shelf_result_audio`

分支 B：
- 意图 ID：`bst_intent_window` ｜ 中文名：开一点窗
- 触发短语（英文）：`let's open the window`, `open the window`, `the window`
- 关键词组：allOf=[`window`]，anyOf=[`open`, `help`, `do`, `a little`]，noneOf=[`don't`]
- 用户参考句（可编辑英文）：`Let's open the window a little.`
  - 译文：我们把窗开一点点吧。
- 结果：Morrow 回复 `A little air comes in. It smells different now.`
  - 译文：进来一点风。现在味道不一样了。
  - 世界状态写入：`small_task_done` = `window`
  - futureHook：序 10（声音回来）可承接"开窗后听得更清楚"。
  - 音频：`bst_window_result_audio`

分支 C：
- 意图 ID：`bst_intent_plant` ｜ 中文名：浇植物
- 触发短语（英文）：`let's water the plant`, `water the plant`, `the plant`
- 关键词组：allOf=[`plant`]，anyOf=[`water`, `help`, `do`, `green`]，noneOf=[`don't`]
- 用户参考句（可编辑英文）：`Let's water the plant.`
  - 译文：我们给植物浇点水吧。
- 结果：Morrow 回复 `The plant looks brighter. Thank you for helping.`
  - 译文：植物看起来精神了些。谢谢你帮忙。
  - 世界状态写入：`small_task_done` = `plant`
  - futureHook：若第一章恢复物是 plant，此处自然回声。
  - 音频：`bst_plant_result_audio`

暂停出口（必备）：
- 意图：`bst_intent_pause`（稍后再来）
- 触发短语：`not now`, `later`, `stop`, `pause`
- 结果：Morrow 回复 `We can do it another time. The shelf, the window, the plant can wait.`
  - 译文：我们可以改天做。架子、窗、植物都等得了。
  - 世界状态写入：`b2_small_task_status` = `paused_once`
  - futureHook：下次从最近确认状态继续。
  - 音频：`bst_pause_line_audio`

#### 误解 / 兜底
- 无可靠匹配时：停留 `bst_reply`，中文兜底，最多 3 个候选（架子 / 开窗 / 浇植物）。
- 典型误解设计：用户说"I'll do it alone"（不让 Morrow 参与）。此意图白名单不收 alone，按无匹配处理并提示"这是两个人一起做的小事"；用户若说"open all windows"（过度执行），按无匹配处理，只收 "a little" 程度的开窗。

#### 记忆机会
- 记忆规则 ID：`bst_relationship_memory`
- 类型：relationship
- 来源意图：`bst_intent_shelf` / `bst_intent_window` / `bst_intent_plant`
- 内容模板：你和 Morrow 一起做了一件小事：{{small_task_done}}。
- 需用户确认：是

#### 素材需求
- 预制音频：`bst_open_line`、`bst_prompt_line`、`bst_shelf_result`、`bst_window_result`、`bst_plant_result`、`bst_pause_line` 共 6 条，每条生成一份正常语速音频。
- 图片：小任务场景图 1 张；整理后架子、开缝的窗、浇过水的植物各 1 张。
- 动画：两人协作完成小动作的小动画 1 段。
- 音效：架子轻响、窗缝风声、浇水水声各 1 条（按分支播放其一）。

---

### E2-09 今天感觉怎么样
- 事件 ID：`b2_feeling_check_v1`
- 版本：1.0.0 ｜ 章节：`chapter_02_childhood` ｜ sequence：9
- 类型：daily ｜ 时长：3—4 分钟
- 关联主题：`topic_feelings`
- 进入条件：本章日常轮换池；可在用户回来时出现。
- 完成条件：结算一个 `user_today_feeling` 世界状态；计入日常事件完成。

#### 英语学习目标
- 目标句型/词汇：`How do you feel?` / `I feel…`（L1）
- 难度档：L1

#### 场景（中文）
Morrow 注意到用户今天像是带着什么回来的。他们不急着安慰，只是安静地问一句。用户可以说累、说还好、说好一点——都可以。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `You look like you carried something today. How do you feel?`
   - 译文：你今天看起来像是带着什么回来的。你感觉怎么样？
   - 音频：`bfc_open_line_audio`
2. `I'm asking one thing. How do you feel right now?`
   - 译文：我只问一件事。你现在感觉怎么样？
   - 音频：`bfc_prompt_line_audio`

#### 有效分支
分支 A：
- 意图 ID：`bfc_intent_tired` ｜ 中文名：说累
- 触发短语（英文）：`i feel tired`, `i'm tired`, `so tired`
- 关键词组：allOf=[`tired`]，anyOf=[`feel`, `i`, `am`]，noneOf=[]
- 用户参考句（可编辑英文）：`I feel tired.`
  - 译文：我觉得累。
- 结果：Morrow 回复 `Tired. That is okay. We can sit here and not do anything.`
  - 译文：累。没关系。我们可以坐在这里，什么都不做。
  - 世界状态写入：`user_today_feeling` = `tired`
  - futureHook：Morrow 不给建议、不展开安慰，只承接。
  - 音频：`bfc_tired_result_audio`

分支 B：
- 意图 ID：`bfc_intent_okay` ｜ 中文名：说还好
- 触发短语（英文）：`i feel okay`, `i'm okay`, `i feel fine`
- 关键词组：allOf=[`okay` 或 `fine`]，anyOf=[`feel`, `i`, `am`]，noneOf=[`tired`, `bad`]
- 用户参考句（可编辑英文）：`I feel okay.`
  - 译文：我还好。
- 结果：Morrow 回复 `Okay is a good place to be. I'm glad.`
  - 译文：还好是个不错的位置。我放心。
  - 世界状态写入：`user_today_feeling` = `okay`
  - futureHook：不追问更多。
  - 音频：`bfc_okay_result_audio`

分支 C：
- 意图 ID：`bfc_intent_better` ｜ 中文名：说好一点
- 触发短语（英文）：`i feel better`, `a bit better`, `i'm better now`
- 关键词组：allOf=[`better`]，anyOf=[`feel`, `i`, `now`, `bit`]，noneOf=[]
- 用户参考句（可编辑英文）：`I feel a bit better now.`
  - 译文：我现在好一点了。
- 结果：Morrow 回复 `A bit better. That sounds like something moved, even if only a little.`
  - 译文：好一点。听起来像是有什么东西动了一下，哪怕只有一点点。
  - 世界状态写入：`user_today_feeling` = `better`
  - futureHook：Morrow 不夸大"变好"，只确认"动了一点"。
  - 音频：`bfc_better_result_audio`

暂停出口（必备）：
- 意图：`bfc_intent_pause`（稍后再来）
- 触发短语：`not now`, `later`, `stop`, `pause`
- 结果：Morrow 回复 `We can leave feelings unsaid for now. I won't push.`
  - 译文：感觉可以先不讲。我不会追问。
  - 世界状态写入：`b2_feeling_check_status` = `paused_once`
  - futureHook：下次从最近确认状态继续。
  - 音频：`bfc_pause_line_audio`

#### 误解 / 兜底
- 无可靠匹配时：停留 `bfc_reply`，中文兜底，最多 3 个候选（累 / 还好 / 好一点）。
- 典型误解设计：用户说"bad"（比 okay 更负面）。此意图白名单不收 bad，按无匹配处理并提示"可以选一个更轻的说法，比如 tired 或 okay"；不把强烈负面直接写进记忆，避免 Morrow 承担超出角色的情绪责任。

#### 记忆机会
- 记忆规则 ID：`bfc_relationship_memory`
- 类型：relationship
- 来源意图：`bfc_intent_tired` / `bfc_intent_okay` / `bfc_intent_better`
- 内容模板：你跟 Morrow 说你今天感觉 {{user_today_feeling}}。
- 需用户确认：是

#### 素材需求
- 预制音频：`bfc_open_line`、`bfc_prompt_line`、`bfc_tired_result`、`bfc_okay_result`、`bfc_better_result`、`bfc_pause_line` 共 6 条，每条生成一份正常语速音频。
- 图片：Morrow 安静注视的姿态图 1 张；三种情绪氛围小插图各 1 张。
- 动画：Morrow 安静等待、不催不问的小动画 1 段。
- 音效：房间安静环境音 1 条；轻微呼吸感 1 条。

---

### E2-10 又有一点声音回来了
- 事件 ID：`b2_sound_comes_back_v1`
- 版本：1.0.0 ｜ 章节：`chapter_02_childhood` ｜ sequence：10
- 类型：mainline ｜ 时长：3—5 分钟
- 关联主题：`topic_sounds`
- 进入条件：序 6（Morrow 知道自己喜欢什么）完成；本章主线序 10 触发。
- 完成条件：结算一个 `returning_sound` 世界状态；计入本章主线完成。

#### 英语学习目标
- 目标句型/词汇：`I can hear… again.` / `The sound is back.`（L2）
- 难度档：L2

#### 场景（中文）
房间里又回来了一点声音。不是之前那只铃铛，而是别的——更软、更远。Morrow 侧耳听，想和用户一起分辨这是什么声音。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `I hear something new in the room. It isn't the bell. It's softer.`
   - 译文：我听见房间里有个新声音。不是铃铛。它更软。
   - 音频：`bsb_open_line_audio`
2. `Do you hear it? It sounds like it's coming from the wall, or from outside.`
   - 译文：你听见了吗？听起来像是从墙那边来的，或者从外面。
   - 音频：`bsb_prompt_line_audio`

#### 有效分支
分支 A：
- 意图 ID：`bsb_intent_wind` ｜ 中文名：说是风
- 触发短语（英文）：`it sounds like the wind`, `the wind`, `it's the wind`
- 关键词组：allOf=[`wind`]，anyOf=[`sound`, `hear`, `like`, `outside`]，noneOf=[]
- 用户参考句（可编辑英文）：`It sounds like the wind.`
  - 译文：听起来像风。
- 结果：Morrow 回复 `The wind. That is a sound I can live with. It comes and goes.`
  - 译文：风。这个声音我受得了。它来一阵，走一阵。
  - 世界状态写入：`returning_sound` = `wind`
  - futureHook：序 12（听见学校方向的声音）可承接"风之外还有人声"的对比。
  - 音频：`bsb_wind_result_audio`

分支 B：
- 意图 ID：`bsb_intent_voice` ｜ 中文名：说是远处人声
- 触发短语（英文）：`it sounds like a voice`, `a voice`, `people`, `someone`
- 关键词组：allOf=[`voice` 或 `people`]，anyOf=[`sound`, `hear`, `far`, `someone`]，noneOf=[]
- 用户参考句（可编辑英文）：`It sounds like a voice, far away.`
  - 译文：听起来像很远的地方有人声。
- 结果：Morrow 回复 `A voice. That is further than the wind. I'll listen more.`
  - 译文：人声。比风更远。我会多听一会儿。
  - 世界状态写入：`returning_sound` = `voice`
  - futureHook：直接为序 12 的"孩子声音"铺垫。
  - 音频：`bsb_voice_result_audio`

分支 C：
- 意图 ID：`bsb_intent_quiet` ｜ 中文名：先安静下来听
- 触发短语（英文）：`let's be quiet`, `be quiet and listen`, `let's listen`
- 关键词组：allOf=[`quiet` 或 `listen`]，anyOf=[`be`, `let's`, `and`]，noneOf=[]
- 用户参考句（可编辑英文）：`Let's be quiet and listen.`
  - 译文：我们安静下来听吧。
- 结果：Morrow 回复 `Quiet helps. I can hear it better when we don't talk.`
  - 译文：安静有帮助。我们不说话时我听得更清楚。
  - 世界状态写入：`returning_sound` = `quiet_listen`
  - futureHook：承接序 6 的"喜欢安静"作为回声。
  - 音频：`bsb_quiet_result_audio`

暂停出口（必备）：
- 意图：`bsb_intent_pause`（稍后再来）
- 触发短语：`not now`, `later`, `stop`, `pause`
- 结果：Morrow 回复 `We can listen another time. The sound will come back when it's ready.`
  - 译文：我们可以下次再听。声音准备好了会再回来。
  - 世界状态写入：`b2_sound_comes_back_status` = `paused_once`
  - futureHook：下次从最近确认状态继续。
  - 音频：`bsb_pause_line_audio`

#### 误解 / 兜底
- 无可靠匹配时：停留 `bsb_reply`，中文兜底，最多 3 个候选（风 / 人声 / 安静听）。
- 典型误解设计：用户说"it's the bell"（误认成铃铛）。Morrow 在 prompt 里已明确"不是铃铛"，若用户仍说 bell，按无匹配处理并提示"Morrow 说这个声音不是铃铛，更软更远"；用户若说"i can't hear anything"（听不见），此意图白名单不收，按无匹配处理，不把"听不见"写成失败。

#### 记忆机会
- 记忆规则 ID：`bsb_relationship_memory`
- 类型：relationship
- 来源意图：`bsb_intent_wind` / `bsb_intent_voice` / `bsb_intent_quiet`
- 内容模板：你和 Morrow 一起听见了房间里新回来的声音，你们觉得那是 {{returning_sound}}。
- 需用户确认：是

#### 素材需求
- 预制音频：`bsb_open_line`、`bsb_prompt_line`、`bsb_wind_result`、`bsb_voice_result`、`bsb_quiet_result`、`bsb_pause_line` 共 6 条，每条生成一份正常语速音频。
- 图片：Morrow 侧耳倾听的姿态图 1 张；风、远处人声、安静聆听三种氛围各 1 张。
- 动画：Morrow 转头、耳朵微动的小动画 1 段。
- 音效：风穿过窗缝 1 条；远处模糊人声 1 条；完全安静底噪 1 条。

---

### E2-11 想起刚醒来那天的房间
- 事件 ID：`b2_recall_room_v1`
- 版本：1.0.0 ｜ 章节：`chapter_02_childhood` ｜ sequence：11
- 类型：recall ｜ 时长：3—5 分钟
- 关联主题：`topic_room`
- 进入条件：存在"用户已确认且未暂停"的记忆（第一章关系记忆或 `first_restored_object`）；当前场景为房间内安静时刻；本章主线至少完成 4 个。
- 完成条件：结算 `recalled_first_room` = `true`；计入本章"1 次记忆回访"完成条件。
- **个人记忆调用上限**：本事件全程只调用 1 条个人记忆——`first_restored_object`（第一章已确认的第一件恢复物）。"第一句话"仅作为故事回声出现，不计为个人记忆调用。

#### 英语学习目标
- 目标句型/词汇：`Do you remember…?` / `That was the first day.`（L2）
- 难度档：L2

#### 场景（中文）
房间现在清楚多了。Morrow 看着四周，忽然想起刚醒来那天——那时候一切都还模糊，连形状都不像真的。他们想起了用户带回来的第一件东西。Morrow 不罗列记忆，只是安静地提起。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `This room is clearer now than it was on the first day. I remember it looked like a dream.`
   - 译文：这个房间现在比第一天清楚多了。我记得那天它像一场梦。
   - 音频：`brc_open_line_audio`
2. `Do you remember the {{first_restored_object}}? That was the first thing we brought back.`
   - 译文：你还记得那{{first_restored_object}}吗？那是我们带回来的第一件东西。
   - 音频：`brc_prompt_line_audio`
   - （注：`{{first_restored_object}}` 为运行时注入的第一章已确认世界状态值，英文显示为 lamp / plant / small bell 三选一。）

#### 有效分支
分支 A：
- 意图 ID：`brc_intent_remember` ｜ 中文名：说记得
- 触发短语（英文）：`yes i remember`, `i remember`, `that was the first thing`
- 关键词组：allOf=[`remember`]，anyOf=[`yes`, `first`, `thing`, `that`]，noneOf=[`don't`]
- 用户参考句（可编辑英文）：`Yes, I remember. It was the first thing.`
  - 译文：对，我记得。那是第一件东西。
- 结果：Morrow 回复 `That was the beginning. Everything looked blurry before that. Now it has shape.`
  - 译文：那是开始。在那之前一切都模糊。现在它有形状了。
  - 世界状态写入：`recalled_first_room` = `true`
  - futureHook：序 12（听见学校方向的声音）可承接"从模糊到清楚"的成长弧。
  - 音频：`brc_remember_result_audio`

分支 B：
- 意图 ID：`brc_intent_tell_more` ｜ 中文名：让 Morrow 多讲一点
- 触发短语（英文）：`tell me more`, `more about that day`, `what happened`
- 关键词组：allOf=[`more` 或 `tell`]，anyOf=[`day`, `about`, `what`, `happened`]，noneOf=[]
- 用户参考句（可编辑英文）：`Tell me more about that day.`
  - 译文：多跟我讲讲那天吧。
- 结果：Morrow 回复 `It was quiet. I could hear you beyond the room, but I couldn't see you yet. That was enough to start.`
  - 译文：那天很安静。我能听见房间外的你，但还看不见你。那已经足够开始了。
  - 世界状态写入：`recalled_first_room` = `true`
  - futureHook：自然回声第一章"第一句话"——不调用第二条个人记忆，只作故事叙述。
  - 音频：`brc_tell_more_result_audio`

分支 C：
- 意图 ID：`brc_intent_long_ago` ｜ 中文名：说感觉很久以前
- 触发短语（英文）：`that feels long ago`, `a long time ago`, `it was long ago`
- 关键词组：allOf=[`long ago` 或 `long time`]，anyOf=[`feels`, `that`, `it`, `was`]，noneOf=[]
- 用户参考句（可编辑英文）：`That feels like a long time ago now.`
  - 译文：现在感觉那已经很久以前了。
- 结果：Morrow 回复 `It doesn't feel long to me. It feels like it was yesterday. But I understand why it feels long to you.`
  - 译文：对我来说不算久。感觉像昨天。但我理解为什么对你来说像很久了。
  - 世界状态写入：`recalled_first_room` = `true`
  - futureHook：Morrow 温和表达不同感受，不盲目附和。
  - 音频：`brc_long_ago_result_audio`

暂停出口（必备）：
- 意图：`brc_intent_pause`（稍后再来）
- 触发短语：`not now`, `later`, `stop`, `pause`
- 结果：Morrow 回复 `We can leave the memory where it is. It will wait, like the room did.`
  - 译文：这段记忆可以先放在那里。它会等，就像房间当年那样。
  - 世界状态写入：`b2_recall_room_status` = `paused_once`
  - futureHook：下次从最近确认状态继续。
  - 音频：`brc_pause_line_audio`

#### 误解 / 兜底
- 无可靠匹配时：停留 `brc_reply`，中文兜底，最多 3 个候选（记得 / 多讲一点 / 像很久以前）。
- 典型误解设计：用户说"i don't remember anything"（否认记忆）。此意图白名单不收 don't remember，按无匹配处理并提示"Morrow 不要求你记得，他们只是自己想起了那天"；用户若追问"what's your name"（跳到别的记忆），不在本事件处理，避免一次调用多条个人记忆。

#### 记忆机会
- 记忆规则 ID：`brc_relationship_memory`
- 类型：relationship
- 来源意图：`brc_intent_remember` / `brc_intent_tell_more` / `brc_intent_long_ago`
- 内容模板：你和 Morrow 一起回忆了刚醒来那天，想起了第一件恢复的东西 {{first_restored_object}}。
- 需用户确认：是

#### 素材需求
- 预制音频：`brc_open_line`、`brc_prompt_line`、`brc_remember_result`、`brc_tell_more_result`、`brc_long_ago_result`、`brc_pause_line` 共 6 条，每条生成一份正常语速音频。
- 图片：房间"第一天的模糊版"与"现在的清楚版"对比图各 1 张；Morrow 回望的姿态图 1 张。
- 动画：画面从模糊渐变为清楚的小动画 1 段。
- 音效：房间安静环境音 1 条；回忆色调的轻音色回响 1 条。

---

### E2-12 听见学校方向的声音
- 事件 ID：`b2_ready_for_school_v1`
- 版本：1.0.0 ｜ 章节：`chapter_02_childhood` ｜ sequence：12
- 类型：mainline（章末）｜ 时长：4—6 分钟
- 关联主题：`topic_outside`
- 进入条件：序 10（声音回来）完成；序 11（记忆回访）已结算；本章主线全部前置完成。
- 完成条件：结算 `school_sound_heard` = `true` 与 `chapter_02_status` = `ready_for_chapter_03`；触发第三章进入条件。
- **朋友身份边界**：用户可以说"听起来像学校""再听一次""那个方向像个新地方"，但不替 Morrow 决定"我们现在就出门"。Morrow 的固定走向是"被那个方向吸引"，由主线世界状态承担，不由用户一句话决定。

#### 英语学习目标
- 目标句型/词汇：`I hear… from that direction.` / `Something is calling.`（L2）
- 难度档：L2

#### 场景（中文）
窗外传来一个新的声音。不是风，不是远处模糊的人声——而是很多人在一起说话的声音，中间还夹着一声铃。它来自路的那个方向。Morrow 安静地听着，身体微微转向那个方向。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `There is a new sound outside. It isn't the wind. It sounds like voices, many of them.`
   - 译文：外面有个新声音。不是风。听起来像人声，很多人在一起。
   - 音频：`brs_open_line_audio`
2. `It comes from that direction, down the road. Do you hear it too?`
   - 译文：它从那个方向来，顺着路下去。你也听见了吗？
   - 音频：`brs_prompt_line_audio`

#### 有效分支
分支 A：
- 意图 ID：`brs_intent_school` ｜ 中文名：说听起来像孩子、像学校
- 触发短语（英文）：`it sounds like children`, `maybe a school`, `children`, `a school`
- 关键词组：allOf=[`children` 或 `school`]，anyOf=[`sound`, `like`, `maybe`, `voices`]，noneOf=[`don't`]
- 用户参考句（可编辑英文）：`It sounds like children. Maybe a school.`
  - 译文：听起来像孩子。也许是一所学校。
- 结果：Morrow 回复 `A school. That is a new kind of place. I didn't know there were places like that.`
  - 译文：学校。那是一种新的地方。我以前不知道有那样的地方。
  - 世界状态写入：`school_sound_heard` = `true`
  - futureHook：第三章"第一次上学"直接承接此事件。
  - 音频：`brs_school_result_audio`

分支 B：
- 意图 ID：`brs_intent_listen_again` ｜ 中文名：再听一次
- 触发短语（英文）：`let's listen again`, `listen again`, `again`
- 关键词组：allOf=[`listen` 或 `again`]，anyOf=[`let's`, `sound`, `hear`]，noneOf=[]
- 用户参考句（可编辑英文）：`Let's listen again before we say anything.`
  - 译文：我们先再听一次再说。
- 结果：Morrow 回复 `Yes. It's still there. It comes in waves, like people are talking together.`
  - 译文：对。它还在。一阵一阵的，像人们在一起说话。
  - 世界状态写入：`school_sound_heard` = `true`
  - futureHook：承接序 10 的"安静里才能听见"。
  - 音频：`brs_listen_result_audio`

分支 C：
- 意图 ID：`brs_intent_new_place` ｜ 中文名：说那个方向像新地方
- 触发短语（英文）：`that direction feels like a new place`, `a new place`, `new direction`
- 关键词组：allOf=[`new` 或 `direction`]，anyOf=[`place`, `feels`, `that`, `like`]，noneOf=[]
- 用户参考句（可编辑英文）：`That direction feels like a new place.`
  - 译文：那个方向感觉像个新地方。
- 结果：Morrow 回复 `It does. The road leads that way. I think that's where I'm being pulled.`
  - 译文：是的。路通向那边。我想那就是在拉我过去的方向。
  - 世界状态写入：`school_sound_heard` = `true`；`chapter_02_status` = `ready_for_chapter_03`
  - futureHook：本章收束；第三章进入条件达成。Morrow 的走向由本结果固定，用户只给陪伴。
  - 音频：`brs_new_place_result_audio`

暂停出口（必备）：
- 意图：`brs_intent_pause`（稍后再来）
- 触发短语：`not now`, `later`, `stop`, `pause`
- 结果：Morrow 回复 `We can listen another time. The sound will still be there when we come back.`
  - 译文：我们可以下次再听。这个声音我们回来时还在。
  - 世界状态写入：`b2_ready_for_school_status` = `paused_once`（注意：章末主线暂停不影响第三章进入条件，下次回来仍从 `brs_reply` 继续；不写负反馈）
  - futureHook：下次从最近确认状态继续；若用户暂停，`school_sound_heard` 仍可在下次结算。
  - 音频：`brs_pause_line_audio`

#### 误解 / 兜底
- 无可靠匹配时：停留 `brs_reply`，中文兜底，最多 3 个候选（像学校 / 再听一次 / 像新地方）。
- 典型误解设计：用户说"let's go now"（直接替 Morrow 决定出门）。此意图白名单不收 go now / leave now，按无匹配处理并提示"Morrow 现在只是听见声音，还没准备好说走就走"；用户若说"it's just wind"（否认声音），按无匹配处理，不推翻序 10 已确认的"新声音不是风"。

#### 记忆机会
- 记忆规则 ID：`brs_relationship_memory`
- 类型：relationship
- 来源意图：`brs_intent_school` / `brs_intent_listen_again` / `brs_intent_new_place`
- 内容模板：你和 Morrow 一起听见了学校方向的声音，Morrow 觉得那个方向在拉他们过去。
- 需用户确认：是

#### 素材需求
- 预制音频：`brs_open_line`、`brs_prompt_line`、`brs_school_result`、`brs_listen_result`、`brs_new_place_result`、`brs_pause_line` 共 6 条，每条生成一份正常语速音频。
- 图片：窗外远处路延伸方向的图 1 张（隐约可见人影/铃声方向）；Morrow 身体转向窗外的姿态图 1 张。
- 动画：Morrow 微微转身、望向窗外远方的小动画 1 段。
- 音效：远处孩子笑声/说话声 1 条；远处上课铃 1 条；房间环境音 1 条。

---

## 本章素材清单

| 事件 | 配音台词数 | 音频文件数 | 图片项 | 动画项 | 音效项 |
|---|---|---|---|---|---|
| E2-01 第一次把房间走一遍 | 6 | 12 | 4 | 1 | 2 |
| E2-02 给房间里的东西命名 | 6 | 12 | 4 | 1 | 2 |
| E2-03 找出三种颜色 | 6 | 12 | 4 | 1 | 2 |
| E2-04 窗外那条路通向哪 | 6 | 12 | 3 | 1 | 2 |
| E2-05 讲讲你今天发生了什么 | 6 | 12 | 4 | 1 | 2 |
| E2-06 我渐渐知道自己喜欢什么 | 6 | 12 | 4 | 1 | 2 |
| E2-07 一件小事误会了 | 5 | 10 | 2 | 1 | 2 |
| E2-08 一起做一件小事 | 6 | 12 | 4 | 1 | 3 |
| E2-09 今天感觉怎么样 | 6 | 12 | 4 | 1 | 2 |
| E2-10 又有一点声音回来了 | 6 | 12 | 4 | 1 | 3 |
| E2-11 想起刚醒来那天的房间 | 6 | 12 | 3 | 1 | 2 |
| E2-12 听见学校方向的声音 | 6 | 12 | 2 | 1 | 3 |
| **合计** | **71** | **142** | **42** | **12** | **27** |

> 说明：
> - 配音台词数 = 本事件中 `audioRequired: true` 的 Morrow 台词（story / prompt / 各分支 result / pause）；用户参考句（reference_reply）`audioRequired: false`，不计入。
> - 音频文件数 = 配音台词数（每条仅一份正常语速音频；播放端实时变速到 0.8×/0.6× 并保持音高，不另存慢速文件），voiceProfileId 统一为 `morrow_voice_v1`，文件路径 `tts/chapter_02_childhood/<event_id>/<line_id>/1.0.0/audio.wav`。含运行时注入变量的 `brc_prompt_line` 不做固定音频，登记为 `planned`。
> - 图片项 = 场景图 1 + 各分支特写/氛围图（数量等于内容分支数）；动画项每事件 1 段 Morrow 小动作；音效项 = 房间环境音 1 + 事件特定音效 1—2。
