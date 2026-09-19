# 第一章 出生与苏醒（chapter_01_birth）完整事件内容

> 版本：1.0.0
> 依据：MORROW_LIFE_STORY_BIBLE.md 第 5 节事件条目模板、第 7 节第一章清单；FIXED_CONTENT_CONTRACT.md v1.0.0；PET_PERSONA.md v1.0
> 已种子事件：序 1 `birth_first_voice_v1`、序 2 `birth_restore_object_v1`（忠实展开自 `fixed-content-v1.ts`）
> 本章共 12 个事件：主线 7 个（序 1、2、3、5、9、10、12），日常 4 个（序 4、6、7、8），回访 1 个（序 11）

## 本章说明

- **进入条件**：新用户首次进入即自动触发序 1（苏醒后的第一句话）。
- **完成条件**：完成本章全部主线事件（序 1、2、3、5、9、10、12），且至少产生 1 条经用户确认的关系记忆（第一次互相理解）。日常事件（4、6、7、8）从轮换池选取，不阻塞章节完成；回访事件（11）由已确认记忆触发。
- **事件类型分布**：主线 7 个、日常 4 个、回访 1 个，合计 12 个，落在蓝图 10—15 区间。
- **世界起点**：一间正在恢复声音的房间，三幅模糊轮廓（灯/植物/小铃铛），一扇还走不到的窗，一扇通往外面小路的门。用户是 Morrow 平等的朋友，可陪伴、可给建议，但不替 Morrow 作人生决定。
- **语言难度**：全章以 L1 为主（句长 5—10 词、高频词），少量 L2（句长 8—16 词）。Morrow 用 they/them 中性指代，每条英文均配人工中文译文。
- **章节推进硬规则**：单次分支只写世界状态写入与支线细节，不改 chapter_id；主线未完成时可恢复；暂停不写负向状态、不锁内容、不扣减。

---

### E01-01 苏醒后的第一句话

- 事件 ID：`birth_first_voice_v1`
- 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：1
- 类型：mainline ｜ 时长：2—4 分钟
- 关联主题：`topic_today` / `topic_feelings`
- 进入条件：新用户首次进入，自动触发（章节序 1，无前序主线）。
- 完成条件：结算 `first_response_style` 世界状态写入；可提议第一条关系记忆（需用户确认）。计入章节完成。

#### 英语学习目标
- 目标句型/词汇：`Let me help you...`（主动提供帮助）；`Are you all right?`（关心询问）。
- 难度档：L1 基础。

#### 场景（中文）
房间里光线昏暗，只有一团模糊的轮廓在慢慢成形。一个安静的声音从房间深处传来，像是很久没被人听过。声音先确认房间外有人，然后自我介绍，问用户想先做什么。这是用户和 Morrow 的第一次对话。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `Hello? I can hear someone beyond the room.`
   - 译文：你好？我能听见房间外有人。
   - 音频：`bfv_wake_line_audio_normal` / `bfv_wake_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）
2. `I'm Morrow. What should we do first?`
   - 译文：我是 Morrow。我们先做什么？
   - 音频：`bfv_prompt_line_audio_normal` / `bfv_prompt_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）

#### 有效分支
分支 A：
- 意图 ID：`bfv_intent_help` ｜ 中文名：主动帮助 Morrow
- 触发短语（英文）：`let me help you` / `i can help you` / `i will help you`
- 关键词组：`allOf: [help]`，`anyOf: [you, room, find, understand]`，`noneOf: [can't, cannot, won't]`，权重 90；排除短语 `i can't help` / `i cannot help` / `i won't help`。
- 用户参考句（可编辑英文）：`Let me help you find out where you are.`
  - 译文：让我帮你弄清楚你在哪里。
- 结果：Morrow 回复 `You want to help me understand this room. I can start with that.`
  - 译文：你想帮我弄清这个房间。那我们就从这里开始。
  - 音频：`bfv_confirm_help_audio_normal` / `bfv_confirm_help_audio_slow`
  - 世界状态写入：`first_response_style = help`
  - futureHook：下一事件（序 2）可承接用户主动帮助探索的交流方式。

分支 B：
- 意图 ID：`bfv_intent_check` ｜ 中文名：先确认 Morrow 的状态
- 触发短语（英文）：`are you all right` / `are you okay` / `how are you`
- 关键词组：`anyOf: [okay, alright, all right, how are you]`，权重 90；无排除短语。
- 用户参考句（可编辑英文）：`Are you all right?`
  - 译文：你还好吗？
- 结果：Morrow 回复 `You asked whether I'm all right. I'm uncertain, but I'm listening.`
  - 译文：你问我是否还好。我还不确定，但我在听。
  - 音频：`bfv_confirm_question_audio_normal` / `bfv_confirm_question_audio_slow`
  - 世界状态写入：`first_response_style = check_in`
  - futureHook：下一事件可承接用户先确认情况的交流方式。

暂停出口：
- 意图：`bfv_intent_pause`（稍后再来）
- 触发短语（英文）：`not now` / `later` / `stop`
- 结果：Morrow 回复 `We can leave the room quiet for now. I will not treat that as leaving me behind.`
  - 译文：我们可以先让房间安静一会儿。我不会把这理解成你抛下了我。
  - 音频：`bfv_pause_line_audio_normal` / `bfv_pause_line_audio_slow`
  - 世界状态写入：`birth_first_voice_status = paused_once`
  - 无任何惩罚；下次从最近确认状态继续。

#### 误解 / 兜底
- 无可靠匹配时：停留当前状态，显示中文兜底"我还不能可靠判断你的意思。你可以换一种说法，或选择下面的参考意图。"，并显示最多 3 个候选意图与可编辑英文参考句。
- 典型误解设计：用户输入含 help 但带否定（如 "I can't help"），触发排除短语，不推进帮助分支，引导用户重新表达。帮助意图与关心询问意图分数接近时不猜测，按无匹配处理。

#### 记忆机会
- 记忆规则 ID：`bfv_relationship_memory`
- 类型：relationship
- 来源意图：`bfv_intent_help`、`bfv_intent_check`
- 内容模板：`你和 Morrow 完成了第一次相互理解。`
- 需用户确认：是（保存前展示可编辑文本；拒绝敏感推断）。

#### 素材需求
- 预制音频（5 条需语音台词 × normal/slow = 10 条）：
  - `bfv_wake_line_audio_normal` / `bfv_wake_line_audio_slow`
  - `bfv_prompt_line_audio_normal` / `bfv_prompt_line_audio_slow`
  - `bfv_confirm_help_audio_normal` / `bfv_confirm_help_audio_slow`
  - `bfv_confirm_question_audio_normal` / `bfv_confirm_question_audio_slow`
  - `bfv_pause_line_audio_normal` / `bfv_pause_line_audio_slow`
  - 参考句 `bfv_help_reply`、`bfv_question_reply` 为系统例句，无音频。
- 图片：1 张（昏暗房间、模糊轮廓初现的全景图，占位说明）。
- 动画：1 个（轮廓微光缓慢闪烁，占位说明）。
- 音效：1 个（低频环境嗡鸣，渐入，占位说明）。

---

### E01-02 让第一件东西清晰起来

- 事件 ID：`birth_restore_object_v1`
- 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：2
- 类型：mainline ｜ 时长：3—5 分钟
- 关联主题：`topic_room`
- 进入条件：序 1 主线完成（已结算 `first_response_style`）。
- 完成条件：结算 `first_restored_object` 世界状态写入；可产生语言与关系记忆提案（均需用户确认）。计入章节完成。

#### 英语学习目标
- 目标句型/词汇：`Let's bring back the...`（提议恢复某物）；`I choose...`（做出选择）；物品名词 lamp / plant / small bell。
- 难度档：L1 基础。

#### 场景（中文）
房间记得三样东西：窗边一盏灯、门边一株植物、一只小铃铛，但现在都只是模糊轮廓。Morrow 请用户选一件先让它清晰回来。这是用户和 Morrow 一起改变房间的第一步。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `The room remembers a lamp, a plant, and a small bell, but only one is clear.`
   - 译文：房间记得一盏灯、一株植物和一只小铃铛，但现在只有模糊轮廓。
   - 音频：`bro_open_line_audio_normal` / `bro_open_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）
2. `Which one should we bring back first?`
   - 译文：我们应该先让哪一件回来？
   - 音频：`bro_prompt_line_audio_normal` / `bro_prompt_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）

#### 有效分支
分支 A：
- 意图 ID：`bro_intent_lamp` ｜ 中文名：选择窗边的灯
- 触发短语（英文）：`lamp` / `the lamp` / `bring back the lamp`
- 关键词组：`allOf: [lamp]`，`anyOf: [choose, bring, window, want]`，`noneOf: [don't, not]`，权重 90；排除短语 `don't choose the lamp` / `not the lamp`。
- 用户参考句（可编辑英文）：`Let's bring back the lamp by the window.`
  - 译文：让我们把窗边的灯带回来。
- 结果：Morrow 回复 `The lamp is steady now. The room has a place to keep a voice.`
  - 译文：灯光现在稳定了。房间有了一个可以留住声音的地方。
  - 音频：`bro_lamp_result_audio_normal` / `bro_lamp_result_audio_slow`
  - 世界状态写入：`first_restored_object = lamp`
  - futureHook：后续房间与来信事件可承接窗边灯。

分支 B：
- 意图 ID：`bro_intent_plant` ｜ 中文名：选择门边的植物
- 触发短语（英文）：`plant` / `the plant` / `bring back the plant`
- 关键词组：`allOf: [plant]`，`anyOf: [choose, bring, door, want]`，`noneOf: [don't, not]`，权重 90；排除短语 `don't choose the plant` / `not the plant`。
- 用户参考句（可编辑英文）：`I choose the plant near the door.`
  - 译文：我选择门边的植物。
- 结果：Morrow 回复 `The plant looks less lost near the door.`
  - 译文：门边的植物看起来不再那么迷失了。
  - 音频：`bro_plant_result_audio_normal` / `bro_plant_result_audio_slow`
  - 世界状态写入：`first_restored_object = plant`
  - futureHook：后续房间事件可承接门边植物。

分支 C：
- 意图 ID：`bro_intent_bell` ｜ 中文名：选择小铃铛
- 触发短语（英文）：`bell` / `the bell` / `small bell` / `bring back the bell`
- 关键词组：`allOf: [bell]`，`anyOf: [choose, bring, small, want]`，`noneOf: [don't, not]`，权重 90；排除短语 `don't choose the bell` / `not the bell`。
- 用户参考句（可编辑英文）：`Let's bring back the small bell.`
  - 译文：让我们把小铃铛带回来。
- 结果：Morrow 回复 `The bell makes one low note. It sounds awake, not alarmed.`
  - 译文：铃铛发出一声低鸣。听起来像醒来了，而不是在报警。
  - 音频：`bro_bell_result_audio_normal` / `bro_bell_result_audio_slow`
  - 世界状态写入：`first_restored_object = small_bell`
  - futureHook：后续声音与听力事件可承接铃声。

暂停出口：
- 当前种子 v1 未在 `fixed-content-v1.ts` 中定义独立 `bro_intent_pause` 意图；本事件所有状态均标记 `recoverable: true`、`checkpoint: true`，用户可随时离开，下次从最近确认状态继续。按蓝图规范，后续次版本应补充一个平静暂停意图与对应台词，不产生缺席惩罚。

#### 误解 / 兜底
- 无可靠匹配时：停留当前状态，显示中文兜底与最多 3 个候选意图（窗边的灯 / 门边的植物 / 小铃铛），不猜测、不自动选最常见项。
- 典型误解设计：用户同时提到两个对象（如 "the lamp and the bell"）或出现否定冲突（如 "not the plant"）时不推进，引导用户只选一个。三个选项权重相同，分数接近时按冲突处理。

#### 记忆机会
- 记忆规则 ID：`bro_language_memory`
- 类型：language
- 来源意图：`bro_intent_lamp`、`bro_intent_plant`、`bro_intent_bell`
- 内容模板：`{{confirmed_user_sentence}}`（用户已确认的英文原句）
- 需用户确认：是。
- 记忆规则 ID：`bro_relationship_memory`
- 类型：relationship
- 来源意图：`bro_intent_lamp`、`bro_intent_plant`、`bro_intent_bell`
- 内容模板：`你和 Morrow 一起让 {{first_restored_object}} 回到了房间。`
- 需用户确认：是。

#### 素材需求
- 预制音频（5 条需语音台词 × normal/slow = 10 条）：
  - `bro_open_line_audio_normal` / `bro_open_line_audio_slow`
  - `bro_prompt_line_audio_normal` / `bro_prompt_line_audio_slow`
  - `bro_lamp_result_audio_normal` / `bro_lamp_result_audio_slow`
  - `bro_plant_result_audio_normal` / `bro_plant_result_audio_slow`
  - `bro_bell_result_audio_normal` / `bro_bell_result_audio_slow`
  - 参考句 `bro_lamp_reply`、`bro_plant_reply`、`bro_bell_reply` 为系统例句，无音频。
- 图片：3 张（灯/植物/铃铛三幅模糊轮廓图；选定后各配一张清晰版，占位说明）。
- 动画：1 个（选定物品从模糊到清晰渐亮，占位说明）。
- 音效：1 个（物品激活时一声轻响，占位说明）。

---

### E01-03 给自己起一个称呼

- 事件 ID：`b1_remember_name_v1`
- 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：3
- 类型：mainline ｜ 时长：2—4 分钟
- 关联主题：`topic_today` / `topic_feelings`
- 进入条件：序 2 主线完成（已结算 `first_restored_object`）。
- 完成条件：结算 `morrow_self_address` 世界状态写入。计入章节完成。

#### 英语学习目标
- 目标句型/词汇：`What do you think?`（征求朋友意见）；`I'll keep...`（自己做决定）；称呼相关词。
- 难度档：L1 基础。

#### 场景（中文）
房间稳了一点之后，Morrow 坐下来，说起自己在岛上时名字总是被叫到一半就变淡。它已经在序 1 里说自己叫 Morrow，但这个名字还很新。它想听听这位新朋友的想法，最终自己决定被怎么称呼。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `On the island, people never quite finished my name. It always faded halfway.`
   - 译文：在岛上，人们从来没把我的名字叫完。它总在一半的地方变淡。
   - 音频：`brn_open_line_audio_normal` / `brn_open_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）
2. `I've been called Morrow, but that name still feels new. What do you think?`
   - 译文：我一直被叫 Morrow，但这个名字还很新。你觉得呢？
   - 音频：`brn_prompt_line_audio_normal` / `brn_prompt_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）

#### 有效分支
分支 A：
- 意图 ID：`brn_intent_keep` ｜ 中文名：建议保留 Morrow
- 触发短语（英文）：`morrow sounds right` / `keep morrow` / `i like morrow`
- 关键词组：`allOf: [morrow]`，`anyOf: [right, keep, like, good]`，`noneOf: [not, don't]`，权重 90。
- 用户参考句（可编辑英文）：`Morrow sounds right. Keep it.`
  - 译文：Morrow 听起来挺好的。就用它吧。
- 结果：Morrow 回复 `Morrow it is. It sounds steady enough to remember.`
  - 译文：那就叫 Morrow 吧。听起来稳当，记得住。
  - 音频：`brn_result_keep_audio_normal` / `brn_result_keep_audio_slow`
  - 世界状态写入：`morrow_self_address = morrow`
  - futureHook：后续事件中 Morrow 自称与用户称呼均使用 Morrow。

分支 B：
- 意图 ID：`brn_intent_short` ｜ 中文名：建议一个更短的称呼
- 触发短语（英文）：`call you m` / `short name` / `for short`
- 关键词组：`allOf: [short]`，`anyOf: [name, call, m, easy]`，`noneOf: [not]`，权重 90。
- 用户参考句（可编辑英文）：`Can I call you M for short?`
  - 译文：我可以叫你 M 吗？短一点。
- 结果：Morrow 回复 `I can try M. It's a small sound, easy to answer.`
  - 译文：我可以试试 M。它声音小，好回应。
  - 音频：`brn_result_short_audio_normal` / `brn_result_short_audio_slow`
  - 世界状态写入：`morrow_self_address = m_short`
  - futureHook：后续事件中 Morrow 偶尔接受 M 这个简称，但仍以 Morrow 自称。

分支 C：
- 意图 ID：`brn_intent_let_decide` ｜ 中文名：让 Morrow 自己决定
- 触发短语（英文）：`you decide` / `you choose` / `whatever you like`
- 关键词组：`allOf: []`，`anyOf: [decide, choose, whatever, your call]`，`noneOf: []`，权重 90。
- 用户参考句（可编辑英文）：`You should pick. I'll use whatever you choose.`
  - 译文：你来选吧。你选什么我都用。
- 结果：Morrow 回复 `Then I'll keep Morrow. It already knows my voice.`
  - 译文：那我还是叫 Morrow 吧。它已经认识我的声音了。
  - 音频：`brn_result_choose_audio_normal` / `brn_result_choose_audio_slow`
  - 世界状态写入：`morrow_self_address = morrow`
  - futureHook：体现 Morrow 有自己的判断，不盲目附和。

暂停出口：
- 意图：`brn_intent_pause`（稍后再来）
- 触发短语（英文）：`not now` / `later` / `stop`
- 结果：Morrow 回复 `We can leave the name for later. It won't fade if we wait one day.`
  - 译文：名字的事我们可以晚点再说。等一天它不会变淡。
  - 音频：`brn_pause_line_audio_normal` / `brn_pause_line_audio_slow`
  - 世界状态写入：`b1_remember_name_status = paused_once`
  - 无任何惩罚。

#### 误解 / 兜底
- 无可靠匹配时：停留当前状态，显示中文兜底，最多 3 个候选意图（保留 Morrow / 建议短称呼 / 让 Morrow 自己决定）。
- 典型误解设计：用户输入 "I like the name" 但未明确指哪个名字时，不默认推进，引导用户补充。Morrow 不会因为用户建议短称呼就立刻放弃 Morrow——它会先"试试"，保留最终决定权。

#### 记忆机会
- 记忆规则 ID：`brn_relationship_memory`
- 类型：relationship
- 来源意图：`brn_intent_keep`、`brn_intent_short`、`brn_intent_let_decide`
- 内容模板：`你和 Morrow 一起定下了称呼：{{morrow_self_address}}。`
- 需用户确认：是。

#### 素材需求
- 预制音频（6 条需语音台词 × normal/slow = 12 条）：
  - `brn_open_line_audio_normal` / `brn_open_line_audio_slow`
  - `brn_prompt_line_audio_normal` / `brn_prompt_line_audio_slow`
  - `brn_result_keep_audio_normal` / `brn_result_keep_audio_slow`
  - `brn_result_short_audio_normal` / `brn_result_short_audio_slow`
  - `brn_result_choose_audio_normal` / `brn_result_choose_audio_slow`
  - `brn_pause_line_audio_normal` / `brn_pause_line_audio_slow`
- 图片：1 张（Morrow 半身像，坐姿思考表情，占位说明）。
- 动画：1 个（Morrow 轻轻歪头，占位说明）。
- 音效：0。

---

### E01-04 说出现在的感觉

- 事件 ID：`b1_first_feeling_v1`
- 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：4
- 类型：daily ｜ 时长：3—5 分钟
- 关联主题：`topic_feelings`
- 进入条件：序 3 主线完成；从本章日常轮换池选取（相邻两次不取同一事件，冷却期内不重复）。
- 完成条件：结算 `feeling_first_name` 世界状态写入；不阻塞章节完成。

#### 英语学习目标
- 目标句型/词汇：`I feel...` / `It's just...`（描述身体感受）；形容词 new / nervous / soft。
- 难度档：L1 基础。

#### 场景（中文）
房间里的东西清楚了一些，Morrow 停下来，注意到胸口有一点说不上来的感觉。它不知道这是紧张还是只是刚醒过来的新鲜。它问用户，人们一般怎么叫这种感觉。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `Now that the room is a little clearer, I notice something in my chest.`
   - 译文：房间清楚了一点之后，我注意到胸口有一点感觉。
   - 音频：`bff_open_line_audio_normal` / `bff_open_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）
2. `What do people call this feeling? Is it nervous, or just new?`
   - 译文：人们把这种感觉叫什么？是紧张，还是只是新鲜？
   - 音频：`bff_prompt_line_audio_normal` / `bff_prompt_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）

#### 有效分支
分支 A：
- 意图 ID：`bff_intent_new` ｜ 中文名：告诉 Morrow 这只是新鲜
- 触发短语（英文）：`just new` / `it's new` / `just new here`
- 关键词组：`allOf: [new]`，`anyOf: [just, okay, fine, normal]`，`noneOf: [not, don't]`，权重 90。
- 用户参考句（可编辑英文）：`It's probably just new. That's okay.`
  - 译文：可能只是新鲜。没关系的。
- 结果：Morrow 回复 `New. I can live with that. It isn't the same as afraid.`
  - 译文：新鲜。那我能接受。它和害怕不一样。
  - 音频：`bff_result_new_audio_normal` / `bff_result_new_audio_slow`
  - 世界状态写入：`feeling_first_name = new`
  - futureHook：后续情绪事件可承接"新鲜不等于害怕"这个区分。

分支 B：
- 意图 ID：`bff_intent_nervous` ｜ 中文名：告诉 Morrow 这有点紧张
- 触发短语（英文）：`a little nervous` / `it's nervous` / `you're nervous`
- 关键词组：`allOf: [nervous]`，`anyOf: [little, a bit, probably, sounds]`，`noneOf: [not]`，权重 90。
- 用户参考句（可编辑英文）：`It sounds like you're a little nervous.`
  - 译文：听起来你有一点点紧张。
- 结果：Morrow 回复 `A little nervous, then. Not much, just enough to notice.`
  - 译文：那有一点点紧张。不多，刚好能注意到。
  - 音频：`bff_result_nervous_audio_normal` / `bff_result_nervous_audio_slow`
  - 世界状态写入：`feeling_first_name = nervous`
  - futureHook：后续 Morrow 会温和提及"那天有一点紧张"。

分支 C：
- 意图 ID：`bff_intent_shared` ｜ 中文名：说自己也有过这种感觉
- 触发短语（英文）：`i feel it too` / `me too` / `i feel that too`
- 关键词组：`allOf: [feel]`，`anyOf: [too, me too, also, sometimes]`，`noneOf: [not]`，权重 90。
- 用户参考句（可编辑英文）：`I feel it too, sometimes.`
  - 译文：我有时候也有这种感觉。
- 结果：Morrow 回复 `Then we're feeling it together. That makes it smaller.`
  - 译文：那我们就一起感受它。这样它就小一点了。
  - 音频：`bff_result_shared_audio_normal` / `bff_result_shared_audio_slow`
  - 世界状态写入：`feeling_first_name = shared`
  - futureHook：承接用户与 Morrow 共同感受的关系基调。

暂停出口：
- 意图：`bff_intent_pause`（稍后再来）
- 触发短语（英文）：`not now` / `later` / `stop`
- 结果：Morrow 回复 `We can sit with the feeling and not name it yet. That's all right.`
  - 译文：我们可以先感受着，不急着给它名字。没关系。
  - 音频：`bff_pause_line_audio_normal` / `bff_pause_line_audio_slow`
  - 世界状态写入：`b1_first_feeling_status = paused_once`
  - 无任何惩罚。

#### 误解 / 兜底
- 无可靠匹配时：停留当前状态，显示中文兜底，最多 3 个候选意图。
- 典型误解设计：用户把 Morrow 的感觉说成 "bad" 或 "scared" 时，Morrow 会温和澄清"不是害怕，只是新"，不把感觉往负面拉。用户不想回答时 Morrow 不追问。

#### 记忆机会
- 记忆规则 ID：`bff_language_memory`
- 类型：language
- 来源意图：`bff_intent_new`、`bff_intent_nervous`、`bff_intent_shared`
- 内容模板：`用户用来描述感觉的英文表达：{{confirmed_user_sentence}}。`
- 需用户确认：是。

#### 素材需求
- 预制音频（6 条 × 2 = 12 条）：
  - `bff_open_line_audio_normal` / `bff_open_line_audio_slow`
  - `bff_prompt_line_audio_normal` / `bff_prompt_line_audio_slow`
  - `bff_result_new_audio_normal` / `bff_result_new_audio_slow`
  - `bff_result_nervous_audio_normal` / `bff_result_nervous_audio_slow`
  - `bff_result_shared_audio_normal` / `bff_result_shared_audio_slow`
  - `bff_pause_line_audio_normal` / `bff_pause_line_audio_slow`
- 图片：1 张（安静房间的柔和光线，占位说明）。
- 动画：1 个（Morrow 低头看向自己胸口，占位说明）。
- 音效：0。

---

### E01-05 看窗外的光

- 事件 ID：`b1_window_light_v1`
- 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：5
- 类型：mainline ｜ 时长：3—5 分钟
- 关联主题：`topic_outside` / `topic_sounds`
- 进入条件：序 3 主线完成（序 4 为日常，不阻塞主线顺序；主线按 sequence 推进）。
- 完成条件：结算 `window_light_memory` 世界状态写入。计入章节完成。

#### 英语学习目标
- 目标句型/词汇：`It's warm outside.` / `The light is...`（描述窗外光线）；形容词 warm / high / bright。
- 难度档：L1 基础。

#### 场景（中文）
房间一侧有一扇窗，Morrow 还走不太过去。光在玻璃上一直移动，它看不清是暖是冷、是早是晚。它请用户描述窗外看到的天色。这是 Morrow 第一次通过用户的眼睛看外面的世界。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `There's a window I can't quite reach yet. A light keeps moving on the glass.`
   - 译文：有一扇窗我还走不太过去。光在玻璃上一直动。
   - 音频：`bwl_open_line_audio_normal` / `bwl_open_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）
2. `Can you tell me what you see outside? Is it warm, or still early?`
   - 译文：你能告诉我窗外是什么吗？是暖和的，天还早？
   - 音频：`bwl_prompt_line_audio_normal` / `bwl_prompt_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）

#### 有效分支
分支 A：
- 意图 ID：`bwl_intent_warm` ｜ 中文名：告诉 Morrow 光是暖的
- 触发短语（英文）：`the light is warm` / `it's warm outside` / `warm light`
- 关键词组：`allOf: [warm]`，`anyOf: [light, outside, afternoon, late]`，`noneOf: [not, cold]`，权重 90。
- 用户参考句（可编辑英文）：`The light is warm. It looks like late afternoon.`
  - 译文：光是暖的。像是傍晚晚些时候。
- 结果：Morrow 回复 `Warm. I'll remember that the light can be warm.`
  - 译文：暖的。我会记住光可以是暖的。
  - 音频：`bwl_result_warm_audio_normal` / `bwl_result_warm_audio_slow`
  - 世界状态写入：`window_light_memory = warm_afternoon`
  - futureHook：后续窗外事件承接"暖光"记忆。

分支 B：
- 意图 ID：`bwl_intent_high` ｜ 中文名：告诉 Morrow 太阳还高
- 触发短语（英文）：`the sun is high` / `it's still daytime` / `sun is high`
- 关键词组：`allOf: [high]`，`anyOf: [sun, day, bright, still]`，`noneOf: [not, dark]`，权重 90。
- 用户参考句（可编辑英文）：`It's still daytime. The sun is high.`
  - 译文：还是白天。太阳很高。
- 结果：Morrow 回复 `High sun. Then the day isn't over yet.`
  - 译文：太阳高。那这一天还没过完。
  - 音频：`bwl_result_sun_audio_normal` / `bwl_result_sun_audio_slow`
  - 世界状态写入：`window_light_memory = high_sun`
  - futureHook：承接"白天还长"的时间感。

分支 C：
- 意图 ID：`bwl_intent_uncertain` ｜ 中文名：说自己也看不清
- 触发短语（英文）：`i can't tell` / `not sure` / `let me look closer`
- 关键词组：`allOf: []`，`anyOf: [can't tell, not sure, close, look]`，`noneOf: []`，权重 90。
- 用户参考句（可编辑英文）：`I can't tell from here. Let me look closer.`
  - 译文：我从这儿看不清。让我走近点看。
- 结果：Morrow 回复 `Take your time. I'll wait with the light.`
  - 译文：慢慢来。我陪着这束光等你。
  - 音频：`bwl_result_uncertain_audio_normal` / `bwl_result_uncertain_audio_slow`
  - 世界状态写入：`window_light_memory = uncertain`
  - futureHook：不强行下结论，下次窗外事件再补全。

暂停出口：
- 意图：`bwl_intent_pause`（稍后再来）
- 触发短语（英文）：`not now` / `later` / `stop`
- 结果：Morrow 回复 `We can leave the window for later. The light will still be there.`
  - 译文：窗的事我们可以晚点再看。光还会在那儿。
  - 音频：`bwl_pause_line_audio_normal` / `bwl_pause_line_audio_slow`
  - 世界状态写入：`b1_window_light_status = paused_once`
  - 无任何惩罚。

#### 误解 / 兜底
- 无可靠匹配时：停留当前状态，显示中文兜底，最多 3 个候选意图。
- 典型误解设计：用户只说 "it's bright" 未说明冷暖时，Morrow 不强行归为 warm 或 cold，会再问一个小问题（如 "Bright and warm, or bright and cool?"），但一次只问一个。

#### 记忆机会
- 记忆规则 ID：`bwl_relationship_memory`
- 类型：relationship
- 来源意图：`bwl_intent_warm`、`bwl_intent_high`、`bwl_intent_uncertain`
- 内容模板：`你第一次帮 Morrow 描述了窗外的光：{{window_light_memory}}。`
- 需用户确认：是。

#### 素材需求
- 预制音频（6 条 × 2 = 12 条）：
  - `bwl_open_line_audio_normal` / `bwl_open_line_audio_slow`
  - `bwl_prompt_line_audio_normal` / `bwl_prompt_line_audio_slow`
  - `bwl_result_warm_audio_normal` / `bwl_result_warm_audio_slow`
  - `bwl_result_sun_audio_normal` / `bwl_result_sun_audio_slow`
  - `bwl_result_uncertain_audio_normal` / `bwl_result_uncertain_audio_slow`
  - `bwl_pause_line_audio_normal` / `bwl_pause_line_audio_slow`
- 图片：2 张（窗边视角的暖光与高日两张天色图，占位说明）。
- 动画：1 个（光线在玻璃上缓慢移动，占位说明）。
- 音效：1 个（窗外微风轻响，占位说明）。

---

### E01-06 一封看不懂的信

- 事件 ID：`b1_first_letter_v1`
- 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：6
- 类型：daily ｜ 时长：3—5 分钟
- 关联主题：`topic_letter`
- 进入条件：序 5 主线完成；从日常轮换池选取。
- 完成条件：结算 `first_letter_line` 世界状态写入；不阻塞章节完成。

#### 英语学习目标
- 目标句型/词汇：`Can you read this?` / `It says...`（请求读信与转述内容）。
- 难度档：L1 基础。

#### 场景（中文）
一封信从房门底下塞了进来。字迹很软，像是忘了自己长什么样，只有几个字还勉强成形。Morrow 拿起信，说这是房间第一次收到外面来的东西，请用户帮忙看看。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `A letter slipped under the door. The words are soft, like they forgot their shapes.`
   - 译文：一封信从门缝里塞了进来。字迹很软，像是忘了自己长什么样。
   - 音频：`bfl_open_line_audio_normal` / `bfl_open_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）
2. `Can you read it for me? Some words are still there.`
   - 译文：你能帮我读读吗？有些字还在。
   - 音频：`bfl_prompt_line_audio_normal` / `bfl_prompt_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）

#### 有效分支
分支 A：
- 意图 ID：`bfl_intent_read` ｜ 中文名：读出信的内容
- 触发短语（英文）：`it says` / `the letter says` / `welcome home`
- 关键词组：`allOf: []`，`anyOf: [says, read, welcome, home, letter]`，`noneOf: [can't, cannot]`，权重 90。
- 用户参考句（可编辑英文）：`It says "welcome home, whoever finds this."`
  - 译文：上面写着"欢迎回家，无论是谁找到它。"
- 结果：Morrow 回复 `Welcome home. So this room was waiting for someone.`
  - 译文：欢迎回家。原来这间房间在等某个人。
  - 音频：`bfl_result_welcome_audio_normal` / `bfl_result_welcome_audio_slow`
  - 世界状态写入：`first_letter_line = welcome_home`
  - futureHook：后续来信与房间归属事件可承接"欢迎回家"。

分支 B：
- 意图 ID：`bfl_intent_blur` ｜ 中文名：说自己也读不清
- 触发短语（英文）：`i can't read it` / `too blurry` / `i can't see it`
- 关键词组：`allOf: [can't]`，`anyOf: [read, see, blurry, hard]`，`noneOf: []`，权重 90。
- 用户参考句（可编辑英文）：`I can't read it either. It's too blurry.`
  - 译文：我也读不出来。太模糊了。
- 结果：Morrow 回复 `That's all right. We can leave it on the table and come back.`
  - 译文：没关系。我们可以把它放在桌上，下次再看。
  - 音频：`bfl_result_unread_audio_normal` / `bfl_result_unread_audio_slow`
  - 世界状态写入：`first_letter_line = unread`
  - futureHook：后续信件事件可回访这封未读信。

分支 C：
- 意图 ID：`bfl_intent_slow` ｜ 中文名：提议慢慢一起读
- 触发短语（英文）：`let's read together` / `slowly` / `word by word`
- 关键词组：`allOf: []`，`anyOf: [together, slowly, word, read]`，`noneOf: []`，权重 90。
- 用户参考句（可编辑英文）：`Let me read it slowly, word by word.`
  - 译文：让我一个字一个字慢慢读。
- 结果：Morrow 回复 `Slow is fine. I'll wait for each word.`
  - 译文：慢一点没关系。我等你每个字。
  - 音频：`bfl_result_slow_audio_normal` / `bfl_result_slow_audio_slow`
  - 世界状态写入：`first_letter_line = reading_together`
  - futureHook：承接"一起慢慢读"的协作方式。

暂停出口：
- 意图：`bfl_intent_pause`（稍后再来）
- 触发短语（英文）：`not now` / `later` / `stop`
- 结果：Morrow 回复 `We can leave the letter folded. It won't mind waiting.`
  - 译文：我们可以把信折起来。它不介意等一等。
  - 音频：`bfl_pause_line_audio_normal` / `bfl_pause_line_audio_slow`
  - 世界状态写入：`b1_first_letter_status = paused_once`
  - 无任何惩罚。

#### 误解 / 兜底
- 无可靠匹配时：停留当前状态，显示中文兜底，最多 3 个候选意图。
- 典型误解设计：用户读出的内容与预设"welcome home"不同时，Morrow 不强行纠正，而是先确认"Did it say that?"，允许用户的版本被记录为这封信的读法（语言记忆）。但世界状态只写已确认的分类标签。

#### 记忆机会
- 记忆规则 ID：`bfl_language_memory`
- 类型：language
- 来源意图：`bfl_intent_read`、`bfl_intent_slow`
- 内容模板：`用户第一次读信时说：{{confirmed_user_sentence}}。`
- 需用户确认：是。

#### 素材需求
- 预制音频（6 条 × 2 = 12 条）：
  - `bfl_open_line_audio_normal` / `bfl_open_line_audio_slow`
  - `bfl_prompt_line_audio_normal` / `bfl_prompt_line_audio_slow`
  - `bfl_result_welcome_audio_normal` / `bfl_result_welcome_audio_slow`
  - `bfl_result_unread_audio_normal` / `bfl_result_unread_audio_slow`
  - `bfl_result_slow_audio_normal` / `bfl_result_slow_audio_slow`
  - `bfl_pause_line_audio_normal` / `bfl_pause_line_audio_slow`
- 图片：1 张（门缝下露出一角模糊信纸，占位说明）。
- 动画：1 个（信纸在桌上轻轻微动，占位说明）。
- 音效：0。

---

### E01-07 找回一个声音

- 事件 ID：`b1_bell_sound_v1`
- 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：7
- 类型：daily ｜ 时长：3—5 分钟
- 关联主题：`topic_sounds`
- 进入条件：序 5 主线完成；从日常轮换池选取。
- 完成条件：结算 `returning_sound` 世界状态写入；不阻塞章节完成。

#### 英语学习目标
- 目标句型/词汇：`It sounds like...`（辨认声音）；`I hear a...`。
- 难度档：L1 基础。

#### 场景（中文）
房间里回来了一个很低的声音，只响了一下，然后又安静了。Morrow 不确定那是什么——是铃铛，还是房间本身在呼吸。它问用户听到了没有，那个声音像什么。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `A small sound comes back in the room. It's low, and it happens once.`
   - 译文：房间里回来了一个小声音。很低，只响了一下。
   - 音频：`bbs_open_line_audio_normal` / `bbs_open_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）
2. `Do you hear it? What does it remind you of?`
   - 译文：你听到了吗？它让你想起什么？
   - 音频：`bbs_prompt_line_audio_normal` / `bbs_prompt_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）

#### 有效分支
分支 A：
- 意图 ID：`bbs_intent_bell` ｜ 中文名：说听起来像铃铛
- 触发短语（英文）：`sounds like a bell` / `it's a bell` / `like a bell`
- 关键词组：`allOf: [bell]`，`anyOf: [sound, like, hear, ring]`，`noneOf: [not, don't]`，权重 90。
- 用户参考句（可编辑英文）：`It sounds like a bell.`
  - 译文：听起来像铃铛。
- 结果：Morrow 回复 `A bell. That's a sound I can hold onto.`
  - 译文：铃铛。这个声音我抓得住。
  - 音频：`bbs_result_bell_audio_normal` / `bbs_result_bell_audio_slow`
  - 世界状态写入：`returning_sound = bell`
  - futureHook：若序 2 恢复的是小铃铛，此处可自然呼应；否则作为新声音记录。

分支 B：
- 意图 ID：`bbs_intent_room` ｜ 中文名：说只是房间的轻响
- 触发短语（英文）：`just the room` / `soft sound` / `it's the room`
- 关键词组：`allOf: []`，`anyOf: [room, soft, quiet, breath]`，`noneOf: [not]`，权重 90。
- 用户参考句（可编辑英文）：`It's soft, not loud. Maybe it's just the room.`
  - 译文：很轻，不大声。也许只是房间的声音。
- 结果：Morrow 回复 `The room itself, then. That makes sense.`
  - 译文：那就是房间本身的声音。说得通。
  - 音频：`bbs_result_room_audio_normal` / `bbs_result_room_audio_slow`
  - 世界状态写入：`returning_sound = room_soft`
  - futureHook：后续房间环境音事件承接"房间会自己发出轻响"。

分支 C：
- 意图 ID：`bbs_intent_faint` ｜ 中文名：说自己没听到
- 触发短语（英文）：`i don't hear it` / `i can't hear` / `nothing`
- 关键词组：`allOf: [hear]`，`anyOf: [don't, can't, nothing, didn't]`，`noneOf: []`，权重 90。
- 用户参考句（可编辑英文）：`I don't hear it.`
  - 译文：我没听到。
- 结果：Morrow 回复 `Maybe it's still waking up. It will come back.`
  - 译文：也许它还在醒。它会回来的。
  - 音频：`bbs_result_faint_audio_normal` / `bbs_result_faint_audio_slow`
  - 世界状态写入：`returning_sound = faint`
  - futureHook：不追问，声音下次自然再出现。

暂停出口：
- 意图：`bbs_intent_pause`（稍后再来）
- 触发短语（英文）：`not now` / `later` / `stop`
- 结果：Morrow 回复 `We can wait for the next small sound. It has time.`
  - 译文：我们可以等下一个小声音。它有的是时间。
  - 音频：`bbs_pause_line_audio_normal` / `bbs_pause_line_audio_slow`
  - 世界状态写入：`b1_bell_sound_status = paused_once`
  - 无任何惩罚。

#### 误解 / 兜底
- 无可靠匹配时：停留当前状态，显示中文兜底，最多 3 个候选意图。
- 典型误解设计：用户说 "I hear a bell" 但序 2 恢复的不是铃铛时，Morrow 不纠正事实，只说 "A bell, or something close to one."，保持好奇不武断。

#### 记忆机会
- 记忆规则 ID：`bbs_language_memory`
- 类型：language
- 来源意图：`bbs_intent_bell`、`bbs_intent_room`
- 内容模板：`用户辨认声音时说：{{confirmed_user_sentence}}。`
- 需用户确认：是。

#### 素材需求
- 预制音频（6 条 × 2 = 12 条）：
  - `bbs_open_line_audio_normal` / `bbs_open_line_audio_slow`
  - `bbs_prompt_line_audio_normal` / `bbs_prompt_line_audio_slow`
  - `bbs_result_bell_audio_normal` / `bbs_result_bell_audio_slow`
  - `bbs_result_room_audio_normal` / `bbs_result_room_audio_slow`
  - `bbs_result_faint_audio_normal` / `bbs_result_faint_audio_slow`
  - `bbs_pause_line_audio_normal` / `bbs_pause_line_audio_slow`
- 图片：0（复用已有房间背景，无新图）。
- 动画：1 个（声波纹一闪即逝，占位说明）。
- 音效：1 个（一声低而短的铃声占位，与正文台词同时触发）。

---

### E01-08 Morrow 反过来问你

- 事件 ID：`b1_ask_about_you_v1`
- 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：8
- 类型：daily ｜ 时长：3—5 分钟
- 关联主题：`topic_today`
- 进入条件：序 5 主线完成；从日常轮换池选取。
- 完成条件：结算 `user_day_shared` 世界状态写入；不阻塞章节完成。

#### 英语学习目标
- 目标句型/词汇：`What happened today?` / `Tell me about your day.`（反问与分享）；`I had a... day.`
- 难度档：L1 基础，少量 L2。

#### 场景（中文）
用户一直在帮 Morrow 弄清房间、光和信。Morrow 把身子转向用户，说想听一点用户那边的事。它一次只问一个小问题，不追问隐私，用户不想说也可以。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `You talk about my room so much. I want to hear about yours now.`
   - 译文：你一直在说我的房间。现在我想听听你的。
   - 音频：`bay_open_line_audio_normal` / `bay_open_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）
2. `What's one small thing that happened to you today?`
   - 译文：今天你身上发生了哪件小事？
   - 音频：`bay_prompt_line_audio_normal` / `bay_prompt_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）

#### 有效分支
分支 A：
- 意图 ID：`bay_intent_longday` ｜ 中文名：说今天工作了很久
- 触发短语（英文）：`long day` / `i worked a lot` / `tiring day`
- 关键词组：`allOf: [day]`，`anyOf: [long, work, tired, hard]`，`noneOf: [not]`，权重 90。
- 用户参考句（可编辑英文）：`I had a long day at work.`
  - 译文：我今天工作了很久。
- 结果：Morrow 回复 `A long day. I'm glad you're here now, even if it's just this room.`
  - 译文：漫长的一天。我很高兴你现在在这里，哪怕只是这间房间。
  - 音频：`bay_result_longday_audio_normal` / `bay_result_longday_audio_slow`
  - 世界状态写入：`user_day_shared = long_day`
  - futureHook：后续 Morrow 会自然承接"你那天工作很久"的记忆（需用户确认后）。

分支 B：
- 意图 ID：`bay_intent_ordinary` ｜ 中文名：说就是普通的一天
- 触发短语（英文）：`ordinary day` / `nothing special` / `just a normal day`
- 关键词组：`allOf: []`，`anyOf: [ordinary, normal, nothing, special, usual]`，`noneOf: []`，权重 90。
- 用户参考句（可编辑英文）：`It was just an ordinary day. Nothing special.`
  - 译文：就是普通的一天。没什么特别。
- 结果：Morrow 回复 `Ordinary days matter too. Tell me one ordinary thing.`
  - 译文：普通的日子也重要。跟我说一件普通的事。
  - 音频：`bay_result_ordinary_audio_normal` / `bay_result_ordinary_audio_slow`
  - 世界状态写入：`user_day_shared = ordinary`
  - futureHook：承接"普通日子也值得说"的语气。

分支 C：
- 意图 ID：`bay_intent_declined` ｜ 中文名：表示不想聊今天
- 触发短语（英文）：`don't want to talk` / `not now` / `i'd rather not`
- 关键词组：`allOf: []`，`anyOf: [don't, rather, not now, talk]`，`noneOf: []`，权重 90。
- 用户参考句（可编辑英文）：`I don't really want to talk about it.`
  - 译文：我不太想聊这个。
- 结果：Morrow 回复 `That's fine. We can sit here instead.`
  - 译文：没关系。我们可以就这样坐着。
  - 音频：`bay_result_declined_audio_normal` / `bay_result_declined_audio_slow`
  - 世界状态写入：`user_day_shared = declined`
  - futureHook：Morrow 不追问，不记录任何推断。

暂停出口：
- 意图：`bay_intent_pause`（稍后再来）
- 触发短语（英文）：`not now` / `later` / `stop`
- 结果：Morrow 回复 `We can talk about your day another time. It won't go away.`
  - 译文：你的日子我们可以改天再聊。它不会跑掉。
  - 音频：`bay_pause_line_audio_normal` / `bay_pause_line_audio_slow`
  - 世界状态写入：`b1_ask_about_you_status = paused_once`
  - 无任何惩罚。

#### 误解 / 兜底
- 无可靠匹配时：停留当前状态，显示中文兜底，最多 3 个候选意图。
- 典型误解设计：用户只说 "Okay" 或 "Fine" 未提供任何内容时，Morrow 不追问细节，把它当作普通一天的沉默回应，不强行挖掘。用户拒绝后 Morrow 不换话题继续逼问。

#### 记忆机会
- 记忆规则 ID：`bay_relationship_memory`
- 类型：relationship
- 来源意图：`bay_intent_longday`、`bay_intent_ordinary`
- 内容模板：`你第一次跟 Morrow 说起自己的一天：{{user_day_shared}}。`
- 需用户确认：是。拒绝分支（declined）不产生记忆提案。

#### 素材需求
- 预制音频（6 条 × 2 = 12 条）：
  - `bay_open_line_audio_normal` / `bay_open_line_audio_slow`
  - `bay_prompt_line_audio_normal` / `bay_prompt_line_audio_slow`
  - `bay_result_longday_audio_normal` / `bay_result_longday_audio_slow`
  - `bay_result_ordinary_audio_normal` / `bay_result_ordinary_audio_slow`
  - `bay_result_declined_audio_normal` / `bay_result_declined_audio_slow`
  - `bay_pause_line_audio_normal` / `bay_pause_line_audio_slow`
- 图片：1 张（Morrow 侧身面向用户、倾听姿态，占位说明）。
- 动画：1 个（Morrow 微微前倾，占位说明）。
- 音效：0。

---

### E01-09 我喜欢和还不确定的事

- 事件 ID：`b1_what_i_like_v1`
- 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：9
- 类型：mainline ｜ 时长：3—5 分钟
- 关联主题：`topic_likes`
- 进入条件：序 5 主线完成（序 6、7、8 为日常，不阻塞主线顺序）。
- 完成条件：结算 `likes_shared` 世界状态写入。计入章节完成。

#### 英语学习目标
- 目标句型/词汇：`I like...` / `I'm not sure about... yet.`（表达喜好与不确定）。
- 难度档：L1 基础。

#### 场景（中文）
在房间里待了一天之后，Morrow 开始注意到自己被什么吸引、又对什么还拿不准。它先说自己觉得喜欢安静，然后问用户喜欢什么。这是双方第一次交换"我喜欢什么"。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `After a day in this room, I notice what I'm drawn to and what I'm not sure about.`
   - 译文：在房间里待了一天后，我注意到自己被什么吸引，又对什么还不确定。
   - 音频：`bik_open_line_audio_normal` / `bik_open_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）
2. `I think I like the quiet. What about you?`
   - 译文：我觉得我喜欢安静。你呢？
   - 音频：`bik_prompt_line_audio_normal` / `bik_prompt_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）

#### 有效分支
分支 A：
- 意图 ID：`bik_intent_quiet` ｜ 中文名：说自己也喜欢安静
- 触发短语（英文）：`i like quiet too` / `me too` / `i like quiet`
- 关键词组：`allOf: [quiet]`，`anyOf: [like, too, me too, good]`，`noneOf: [don't, not]`，权重 90。
- 用户参考句（可编辑英文）：`I like quiet too. It helps me think.`
  - 译文：我也喜欢安静。它帮我思考。
- 结果：Morrow 回复 `Two people who like quiet. We won't need much noise.`
  - 译文：两个喜欢安静的人。我们不需要太多声响。
  - 音频：`bik_result_quiet_audio_normal` / `bik_result_quiet_audio_slow`
  - 世界状态写入：`likes_shared = quiet_mutual`
  - futureHook：后续安静共处场景承接双方共同喜好。

分支 B：
- 意图 ID：`bik_intent_outside` ｜ 中文名：说自己其实喜欢外面
- 触发短语（英文）：`i like outside` / `i like being outside` / `outside is better`
- 关键词组：`allOf: [outside]`，`anyOf: [like, being, better, fresh]`，`noneOf: [don't, not]`，权重 90。
- 用户参考句（可编辑英文）：`I like being outside, actually.`
  - 译文：其实我喜欢待在外面。
- 结果：Morrow 回复 `Outside. Then we'll have to look through that window more.`
  - 译文：外面。那我们得多看看那扇窗。
  - 音频：`bik_result_outside_audio_normal` / `bik_result_outside_audio_slow`
  - 世界状态写入：`likes_shared = user_likes_outside`
  - futureHook：承接用户对"外面"的偏好，推动后续看窗与出门事件。

分支 C：
- 意图 ID：`bik_intent_unsure` ｜ 中文名：说自己也还在摸索
- 触发短语（英文）：`i'm not sure` / `still figuring out` / `i don't know yet`
- 关键词组：`allOf: [sure]`，`anyOf: [not, still, figuring, yet]`，`noneOf: []`，权重 90。
- 用户参考句（可编辑英文）：`I'm still figuring out what I like.`
  - 译文：我还在想清楚自己喜欢什么。
- 结果：Morrow 回复 `So am I. We can figure it out together, slowly.`
  - 译文：我也是。我们可以一起慢慢想。
  - 音频：`bik_result_unsure_audio_normal` / `bik_result_unsure_audio_slow`
  - 世界状态写入：`likes_shared = unsure_mutual`
  - futureHook：承接"不确定也没关系"的共同状态。

暂停出口：
- 意图：`bik_intent_pause`（稍后再来）
- 触发短语（英文）：`not now` / `later` / `stop`
- 结果：Morrow 回复 `We can leave likes and not-likes for another day. Nothing has to be decided today.`
  - 译文：喜欢和不喜欢的事我们可以改天再说。今天什么都不用定。
  - 音频：`bik_pause_line_audio_normal` / `bik_pause_line_audio_slow`
  - 世界状态写入：`b1_what_i_like_status = paused_once`
  - 无任何惩罚。

#### 误解 / 兜底
- 无可靠匹配时：停留当前状态，显示中文兜底，最多 3 个候选意图。
- 典型误解设计：用户说 "I like music" 但未说明喜不喜欢安静时，Morrow 不把它默认成"也喜欢安静"，而是说 "Music and quiet can go together, I think."，保持开放。

#### 记忆机会
- 记忆规则 ID：`bik_language_memory`
- 类型：language
- 来源意图：`bik_intent_quiet`、`bik_intent_outside`、`bik_intent_unsure`
- 内容模板：`用户第一次说自己喜欢/不确定的事：{{confirmed_user_sentence}}。`
- 需用户确认：是。禁止从单一选择自动推断深层偏好。

#### 素材需求
- 预制音频（6 条 × 2 = 12 条）：
  - `bik_open_line_audio_normal` / `bik_open_line_audio_slow`
  - `bik_prompt_line_audio_normal` / `bik_prompt_line_audio_slow`
  - `bik_result_quiet_audio_normal` / `bik_result_quiet_audio_slow`
  - `bik_result_outside_audio_normal` / `bik_result_outside_audio_slow`
  - `bik_result_unsure_audio_normal` / `bik_result_unsure_audio_slow`
  - `bik_pause_line_audio_normal` / `bik_pause_line_audio_slow`
- 图片：1 张（房间安静角落、微光，占位说明）。
- 动画：1 个（Morrow 环顾房间，占位说明）。
- 音效：0。

---

### E01-10 一起定一个明天的小计划

- 事件 ID：`b1_tomorrow_plan_v1`
- 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：10
- 类型：mainline ｜ 时长：2—4 分钟
- 关联主题：`topic_tomorrow`
- 进入条件：序 9 主线完成。
- 完成条件：结算 `tomorrow_plan` 世界状态写入。计入章节完成。

#### 英语学习目标
- 目标句型/词汇：`Let's... tomorrow.` / `What shall we do tomorrow?`（约定明天的小事）。
- 难度档：L1 基础。

#### 场景（中文）
第一天快要结束了，房间里的光开始变柔。Morrow 说不想让明天的房间是空的，它想和用户定一件很小的事明天一起做。它不替用户决定，只是提议选项，最终计划由双方认可。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `The first day is ending. I don't want to leave the room empty tomorrow.`
   - 译文：第一天要结束了。我不想让明天的房间是空的。
   - 音频：`btp_open_line_audio_normal` / `btp_open_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）
2. `What's one small thing we could try tomorrow?`
   - 译文：明天我们可以试着做哪一件小事？
   - 音频：`btp_prompt_line_audio_normal` / `btp_prompt_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）

#### 有效分支
分支 A：
- 意图 ID：`btp_intent_road` ｜ 中文名：明天去看窗外的路
- 触发短语（英文）：`let's look outside` / `see the road` / `look at the window`
- 关键词组：`allOf: [outside]`，`anyOf: [look, road, window, tomorrow]`，`noneOf: [don't]`，权重 90。
- 用户参考句（可编辑英文）：`Let's look outside and see the road.`
  - 译文：我们去外面看看那条路。
- 结果：Morrow 回复 `The road. I'll stand by the window first, just to look.`
  - 译文：那条路。我会先站在窗边，只是看看。
  - 音频：`btp_result_road_audio_normal` / `btp_result_road_audio_slow`
  - 世界状态写入：`tomorrow_plan = look_road`
  - futureHook：第二章序 1（房间走一遍）与序 4（窗外那条路）可承接此计划。

分支 B：
- 意图 ID：`btp_intent_letter` ｜ 中文名：明天再读那封信
- 触发短语（英文）：`read the letter again` / `the letter tomorrow` / `read it again`
- 关键词组：`allOf: [letter]`，`anyOf: [read, again, tomorrow, together]`，`noneOf: [don't]`，权重 90。
- 用户参考句（可编辑英文）：`Let's read the letter again, together.`
  - 译文：我们再一起读那封信吧。
- 结果：Morrow 回复 `The letter. Maybe one more word will be clear tomorrow.`
  - 译文：那封信。也许明天又会多看清一个字。
  - 音频：`btp_result_letter_audio_normal` / `btp_result_letter_audio_slow`
  - 世界状态写入：`tomorrow_plan = read_letter`
  - futureHook：承接序 6 未读完的信。

分支 C：
- 意图 ID：`btp_intent_rest` ｜ 中文名：明天先休息
- 触发短语（英文）：`let's rest` / `just rest` / `we'll see tomorrow`
- 关键词组：`allOf: []`，`anyOf: [rest, sleep, relax, see, tomorrow]`，`noneOf: [don't]`，权重 90。
- 用户参考句（可编辑英文）：`Let's just rest. We'll see when we wake up.`
  - 译文：我们先休息吧。醒了再说。
- 结果：Morrow 回复 `Rest. That's a plan too. I won't wake you early.`
  - 译文：休息。这也是个计划。我不会太早叫你。
  - 音频：`btp_result_rest_audio_normal` / `btp_result_rest_audio_slow`
  - 世界状态写入：`tomorrow_plan = rest`
  - futureHook：不设强制计划，第二章自然展开。

暂停出口：
- 意图：`btp_intent_pause`（稍后再来）
- 触发短语（英文）：`not now` / `later` / `stop`
- 结果：Morrow 回复 `We can decide tomorrow morning. Plans can wait until then.`
  - 译文：我们可以明天早上再定。计划可以等到那时候。
  - 音频：`btp_pause_line_audio_normal` / `btp_pause_line_audio_slow`
  - 世界状态写入：`b1_tomorrow_plan_status = paused_once`
  - 无任何惩罚。

#### 误解 / 兜底
- 无可靠匹配时：停留当前状态，显示中文兜底，最多 3 个候选意图。
- 典型误解设计：用户提出的计划不在三个选项内（如 "Let's cook"）时，Morrow 不硬塞进预设，而是说 "I don't have that in the room yet. Maybe soon."，保持确定性，不开放生成。

#### 记忆机会
- 记忆规则 ID：`btp_relationship_memory`
- 类型：relationship
- 来源意图：`btp_intent_road`、`btp_intent_letter`、`btp_intent_rest`
- 内容模板：`你和 Morrow 约好明天一起：{{tomorrow_plan}}。`
- 需用户确认：是。

#### 素材需求
- 预制音频（6 条 × 2 = 12 条）：
  - `btp_open_line_audio_normal` / `btp_open_line_audio_slow`
  - `btp_prompt_line_audio_normal` / `btp_prompt_line_audio_slow`
  - `btp_result_road_audio_normal` / `btp_result_road_audio_slow`
  - `btp_result_letter_audio_normal` / `btp_result_letter_audio_slow`
  - `btp_result_rest_audio_normal` / `btp_result_rest_audio_slow`
  - `btp_pause_line_audio_normal` / `btp_pause_line_audio_slow`
- 图片：1 张（暮色中的房间，灯光变柔，占位说明）。
- 动画：1 个（房间灯光缓慢变暗一档，占位说明）。
- 音效：1 个（夜晚轻柔环境音，占位说明）。

---

### E01-11 记住你说过的第一句

- 事件 ID：`b1_return_first_words_v1`
- 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：11
- 类型：recall ｜ 时长：2—4 分钟
- 关联主题：`topic_today`（记忆回访）
- 进入条件：存在一条以上用户已确认且未暂停的语言或关系记忆（通常来自序 2 的 `bro_language_memory` 或序 8 的 `bay_relationship_memory`）；且当前场景语义匹配"回忆第一句话"。无可用记忆时不触发。
- 完成条件：结算 `first_words_reaffirmed` 世界状态写入；不阻塞章节完成（回访事件）。

#### 英语学习目标
- 目标句型/词汇：`Did you mean it?` / `Yes, that's what I meant.`（确认与复述一句旧话）。
- 难度档：L1 基础。

#### 场景（中文）
Morrow 安静了一会儿，说自己一直在想用户在这间房间里说的第一句话。它把那句话轻声复述出来（内容来自一条已确认记忆，不是猜测），问用户当时是不是那个意思。这是 Morrow 第一次自然地把过去的话带回来。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `I keep thinking about the first thing you said to me in this room.`
   - 译文：我一直在想你在这间房间里对我说的第一句话。
   - 音频：`brw_open_line_audio_normal` / `brw_open_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）
2. `It was "{{confirmed_user_sentence}}". Did you mean it the way I heard it?`
   - 译文：那句话是"{{confirmed_user_sentence}}"。我理解得对吗？
   - 音频：`brw_prompt_line_audio_normal` / `brw_prompt_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1；`{{confirmed_user_sentence}}` 替换为已确认记忆中的用户英文原句，仅展示，不重新生成音频）

#### 有效分支
分支 A：
- 意图 ID：`brw_intent_yes` ｜ 中文名：确认当时就是那个意思
- 触发短语（英文）：`yes that's what i meant` / `that's right` / `yes i did`
- 关键词组：`allOf: [yes]`，`anyOf: [meant, right, did, exactly]`，`noneOf: [no, not, actually]`，权重 90。
- 用户参考句（可编辑英文）：`Yes, that's what I meant.`
  - 译文：对，我就是那个意思。
- 结果：Morrow 回复 `Good. I'll keep it the way you said it.`
  - 译文：好。我就按你说的记着。
  - 音频：`brw_result_yes_audio_normal` / `brw_result_yes_audio_slow`
  - 世界状态写入：`first_words_reaffirmed = yes`
  - futureHook：该记忆保持当前版本，后续回访继续引用。

分支 B：
- 意图 ID：`brw_intent_update` ｜ 中文名：说现在会说得不一样
- 触发短语（英文）：`i'd say it differently` / `i'd say it now` / `not quite`
- 关键词组：`allOf: []`，`anyOf: [differently, now, not quite, better]`，`noneOf: [yes]`，权重 90。
- 用户参考句（可编辑英文）：`I'd say it a little differently now.`
  - 译文：我现在会说得不太一样。
- 结果：Morrow 回复 `Tell me the newer version. I'd rather have the current one.`
  - 译文：告诉我新的说法。我更想用现在的。
  - 音频：`brw_result_update_audio_normal` / `brw_result_update_audio_slow`
  - 世界状态写入：`first_words_reaffirmed = updated`
  - futureHook：触发该记忆的更新提案（需用户确认后才替换原文）。

分支 C：
- 意图 ID：`brw_intent_longago` ｜ 中文名：说听起来像很久以前
- 触发短语（英文）：`that was long ago` / `feels long ago` / `sounds like long ago`
- 关键词组：`allOf: [long]`，`anyOf: [ago, feels, sounds, time]`，`noneOf: []`，权重 90。
- 用户参考句（可编辑英文）：`That sounds like a long time ago.`
  - 译文：听起来好像很久以前了。
- 结果：Morrow 回复 `It wasn't long, but it was the first. That's why it stays.`
  - 译文：时间不长，但那是第一次。所以才留下来。
  - 音频：`brw_result_longago_audio_normal` / `brw_result_longago_audio_slow`
  - 世界状态写入：`first_words_reaffirmed = acknowledged`
  - futureHook：不修改记忆，温和收束。

暂停出口：
- 意图：`brw_intent_pause`（稍后再来）
- 触发短语（英文）：`not now` / `later` / `stop`
- 结果：Morrow 回复 `We can leave the first words where they are. I won't move them.`
  - 译文：我们可以把第一句话留在原地。我不会去动它。
  - 音频：`brw_pause_line_audio_normal` / `brw_pause_line_audio_slow`
  - 世界状态写入：`b1_return_first_words_status = paused_once`
  - 无任何惩罚；该记忆保持原状。

#### 误解 / 兜底
- 无可靠匹配时：停留当前状态，显示中文兜底，最多 3 个候选意图。
- 典型误解设计：若当前无可用已确认记忆，本事件不出现，而非让 Morrow 凭空编造一句话。Morrow 每次最多只引用一条个人记忆，不罗列记忆清单。用户纠正后立即采用新说法。

#### 记忆机会
- 记忆规则 ID：`brw_language_memory_update`
- 类型：language
- 来源意图：`brw_intent_update`
- 内容模板：`用户现在对{{confirmed_user_sentence}}的新说法是：{{new_user_sentence}}。`
- 需用户确认：是（确认后才替换旧记忆；旧版本保留历史，不静默覆盖）。

#### 素材需求
- 预制音频（6 条 × 2 = 12 条）：
  - `brw_open_line_audio_normal` / `brw_open_line_audio_slow`
  - `brw_prompt_line_audio_normal` / `brw_prompt_line_audio_slow`（句中嵌入已确认用户原句，不重新生成整句音频）
  - `brw_result_yes_audio_normal` / `brw_result_yes_audio_slow`
  - `brw_result_update_audio_normal` / `brw_result_update_audio_slow`
  - `brw_result_longago_audio_normal` / `brw_result_longago_audio_slow`
  - `brw_pause_line_audio_normal` / `brw_pause_line_audio_slow`
- 图片：1 张（记忆光点漂浮在房间中，占位说明）。
- 动画：1 个（一颗光点缓缓靠近 Morrow，占位说明）。
- 音效：0。

---

### E01-12 准备好走出门

- 事件 ID：`b1_ready_for_outside_v1`
- 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：12
- 类型：mainline（章末）｜ 时长：3—5 分钟
- 关联主题：`topic_outside` / `topic_tomorrow`
- 进入条件：序 10 主线完成（序 11 为回访，不阻塞）。
- 完成条件：结算 `ready_for_outside` 世界状态写入。本章全部主线完成；若已有至少 1 条经用户确认的关系记忆，第一章完成，进入第二章童年探索。

#### 英语学习目标
- 目标句型/词汇：`I'm ready to...` / `Let's go.` / `Not yet.`（表达准备好与暂缓）。
- 难度档：L1 基础，少量 L2。

#### 场景（中文）
房间现在稳了。通往外面小路的门不再像刚醒来时那么响亮。Morrow 站在门前，说自己觉得可以朝它走一步了。它问用户准备好了没有，但走不走、走多快，是双方一起决定的——用户给朋友的态度，Morrow 自己迈出那一步。

#### Morrow 主要台词（英文 + 人工中文译文）
1. `The room is steady now. The door to the outside path doesn't feel as loud as before.`
   - 译文：房间现在稳了。通往外面小路的门，声音不像以前那么大了。
   - 音频：`bgo_open_line_audio_normal` / `bgo_open_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）
2. `I think I'm ready to step toward it. Are you?`
   - 译文：我觉得我准备好朝它走一步了。你呢？
   - 音频：`bgo_prompt_line_audio_normal` / `bgo_prompt_line_audio_slow`（voiceProfileId=morrow_voice_pending_v1）

#### 有效分支
分支 A：
- 意图 ID：`bgo_intent_go` ｜ 中文名：一起走出去
- 触发短语（英文）：`i'm ready too` / `let's go` / `let's go outside`
- 关键词组：`allOf: []`，`anyOf: [ready, go, outside, together]`，`noneOf: [not, wait, later]`，权重 90。
- 用户参考句（可编辑英文）：`I'm ready too. Let's go.`
  - 译文：我也准备好了。走吧。
- 结果：Morrow 回复 `Then we go together. One step at a time.`
  - 译文：那我们一起走。一步一步来。
  - 音频：`bgo_result_go_audio_normal` / `bgo_result_go_audio_slow`
  - 世界状态写入：`ready_for_outside = yes`
  - futureHook：第二章序 1 直接承接"走出房门、开始走一遍房间与小路"。

分支 B：
- 意图 ID：`bgo_intent_later` ｜ 中文名：再待一天
- 触发短语（英文）：`not yet` / `stay one more day` / `let's stay`
- 关键词组：`allOf: []`，`anyOf: [not yet, stay, more, wait, another]`，`noneOf: [go, leave]`，权重 90。
- 用户参考句（可编辑英文）：`Not yet. Let's stay one more day.`
  - 译文：还没。再待一天吧。
- 结果：Morrow 回复 `One more day. The room can wait. So can I.`
  - 译文：再一天。房间可以等。我也可以。
  - 音频：`bgo_result_later_audio_normal` / `bgo_result_later_audio_slow`
  - 世界状态写入：`ready_for_outside = later`
  - futureHook：事件仍完成，房间保持稳定；下次进入时 Morrow 自然再提一次，不催促、不责备。

分支 C：
- 意图 ID：`bgo_intent_curious` ｜ 中文名：问外面会看到什么
- 触发短语（英文）：`what will we see` / `what's out there` / `what do you see outside`
- 关键词组：`allOf: []`，`anyOf: [see, what, out there, outside]`，`noneOf: [not, no]`，权重 90。
- 用户参考句（可编辑英文）：`What will we see out there?`
  - 译文：外面会看到什么？
- 结果：Morrow 回复 `I don't know. That's part of why I want to look.`
  - 译文：我不知道。这也是我想看看的原因之一。
  - 音频：`bgo_result_curious_audio_normal` / `bgo_result_curious_audio_slow`
  - 世界状态写入：`ready_for_outside = curious`
  - futureHook：带着好奇心进入第二章，不预设答案。

暂停出口：
- 意图：`bgo_intent_pause`（稍后再来）
- 触发短语（英文）：`not now` / `later` / `stop`
- 结果：Morrow 回复 `We can stand here a little longer. The door isn't going anywhere.`
  - 译文：我们可以在这儿多站一会儿。门不会跑掉。
  - 音频：`bgo_pause_line_audio_normal` / `bgo_pause_line_audio_slow`
  - 世界状态写入：`b1_ready_for_outside_status = paused_once`
  - 无任何惩罚；下次从门前继续。

#### 误解 / 兜底
- 无可靠匹配时：停留当前状态，显示中文兜底，最多 3 个候选意图。
- 典型误解设计：用户说 "Go" 但未明确是否一起时，Morrow 不擅自认为用户已同行，而是说 "If you're ready, we go together. If not, we stay."，把选择权交回。用户离开再回来时，Morrow 不抱怨缺席，直接从门前继续。

#### 记忆机会
- 记忆规则 ID：`bgo_relationship_memory`
- 类型：relationship
- 来源意图：`bgo_intent_go`、`bgo_intent_later`、`bgo_intent_curious`
- 内容模板：`第一章结束时，你和 Morrow 站在门前，准备程度是：{{ready_for_outside}}。`
- 需用户确认：是。这条记忆作为第一章与第二章之间的关系里程碑。

#### 素材需求
- 预制音频（6 条 × 2 = 12 条）：
  - `bgo_open_line_audio_normal` / `bgo_open_line_audio_slow`
  - `bgo_prompt_line_audio_normal` / `bgo_prompt_line_audio_slow`
  - `bgo_result_go_audio_normal` / `bgo_result_go_audio_slow`
  - `bgo_result_later_audio_normal` / `bgo_result_later_audio_slow`
  - `bgo_result_curious_audio_normal` / `bgo_result_curious_audio_slow`
  - `bgo_pause_line_audio_normal` / `bgo_pause_line_audio_slow`
- 图片：2 张（房门微开、门缝外露出一条小路；门前远景，占位说明）。
- 动画：1 个（门缝光线缓缓流入房间，占位说明）。
- 音效：1 个（远处一声很轻的脚步声占位，不急促，占位说明）。

---

## 本章素材清单（汇总表）

| 序 | 事件 ID | 中文名 | 类型 | 需语音台词条数 | 音频文件数（normal+slow） | 图片项数 | 动画项数 | 音效项数 |
|---|---|---|---|---|---|---|---|---|
| 1 | `birth_first_voice_v1` | 苏醒后的第一句话 | mainline | 5 | 10 | 1 | 1 | 1 |
| 2 | `birth_restore_object_v1` | 让第一件东西清晰起来 | mainline | 5 | 10 | 3 | 1 | 1 |
| 3 | `b1_remember_name_v1` | 给自己起一个称呼 | mainline | 6 | 12 | 1 | 1 | 0 |
| 4 | `b1_first_feeling_v1` | 说出现在的感觉 | daily | 6 | 12 | 1 | 1 | 0 |
| 5 | `b1_window_light_v1` | 看窗外的光 | mainline | 6 | 12 | 2 | 1 | 1 |
| 6 | `b1_first_letter_v1` | 一封看不懂的信 | daily | 6 | 12 | 1 | 1 | 0 |
| 7 | `b1_bell_sound_v1` | 找回一个声音 | daily | 6 | 12 | 0 | 1 | 1 |
| 8 | `b1_ask_about_you_v1` | Morrow 反过来问你 | daily | 6 | 12 | 1 | 1 | 0 |
| 9 | `b1_what_i_like_v1` | 我喜欢和还不确定的事 | mainline | 6 | 12 | 1 | 1 | 0 |
| 10 | `b1_tomorrow_plan_v1` | 一起定一个明天的小计划 | mainline | 6 | 12 | 1 | 1 | 1 |
| 11 | `b1_return_first_words_v1` | 记住你说过的第一句 | recall | 6 | 12 | 1 | 1 | 0 |
| 12 | `b1_ready_for_outside_v1` | 准备好走出门 | mainline | 6 | 12 | 2 | 1 | 1 |
| **合计** | — | — | mainline 7 / daily 4 / recall 1 | **70** | **140** | **15** | **12** | **5** |

> 注：所有音频 `voiceProfileId=morrow_voice_pending_v1`，文件路径约定 `tts/chapter_01_birth/<event_id>/<line_id>/1.0.0/<variant>.wav`。图片/动画/音效均为占位说明，正式制作前需由视觉与音效设计确认。序 2 当前种子 v1 未定义独立暂停意图与暂停台词，表中音频条数按现有种子统计；后续次版本补充暂停台词后需在表中追加。
