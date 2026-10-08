# EVENTS_V1 — Morrow 首批生活事件规格

> 版本：1.0.0  
> 状态：可进入数据模型与事件引擎设计  
> 规则集：`events-v1.0.0`  
> 适用范围：完成首日体验后的 Web/PWA MVP；后续小程序与 App 共用同一服务端配置。  
> 关联文件：`FIRST_DAY_FLOW.md`（已 superseded，仅 FD 骨架历史参考，不作现行实现依据）、`PET_PERSONA.md`、`PET_SYSTEM_PROMPT.md`、`english-pet/packages/contracts/src/events.ts`、`english-pet/packages/domain/src/events-v1.ts`

## 1. 这批事件要证明什么

首批事件不是五段彼此无关的英语练习，而是一条短生活线：

```text
读懂一封来信
  → 为共同房间做选择
  → 修复一次真实误解
  → 一起规划第一次外出
  → 把注意力带回用户真实的一天
```

五个事件共同证明：

1. 用户使用不完美的英语也能推动事情发生；
2. 误解会产生轻微、可逆的剧情差异，并可通过继续交流恢复；
3. 世界状态、用户个人记忆和双方共同经历分开处理；
4. 至少一个旧表达会因新情境相关而自然出现；
5. 每次互动约 3—5 分钟，文字、参考句和语音结果平权；
6. 用户拒答、中断或暂时离开不会受到惩罚。

## 2. 全局事件规则

### 2.1 运行顺序与解锁

| 顺序 | 事件 ID | 标题 | 解锁条件 | 重复策略 |
|---|---|---|---|---|
| 1 | `morrow_letter_v1` | The letter with two meanings | 首日完成 | 首次只完成一次 |
| 2 | `room_object_v1` | One more thing for the room | 事件 1 完成 | 首次只完成一次 |
| 3 | `literal_misunderstanding_v1` | What I thought you meant | 事件 2 完成 | 首次只完成一次 |
| 4 | `first_outing_v1` | The road beyond the window | 事件 3 完成 | 首次只完成一次 |
| 5 | `today_story_v1` | One thing from today | 事件 4 完成 | 可作为日常模板再次出现；完成后至少间隔 20 小时 |

首版按顺序解锁，保证自然复现有前文。事件未完成时只保留一个当前活动实例，不同时开启两个生活事件。

### 2.2 通用生命周期

```text
available → active → completed
                ↘ paused ↗
```

- `available`：触发条件满足，但用户尚未开始；
- `active`：已开始，推进至最近一次服务端确认的内部状态；
- `paused`：用户离开、换话题、网络中断或即时安全流程接管；
- `completed`：结果已确定、事件日记已生成；不可重复结算；
- 每次推进使用 `user_or_guest_id + event_instance_id + state_id + attempt` 作为幂等键；
- 草稿、未确认 ASR 文本、无效模型输出不推进状态；
- 即时安全风险优先于事件，停止角色剧情和学习反馈，事件原状态保持暂停；
- 事件完成后的世界状态写入是确定性业务逻辑，不由模型自由生成。

### 2.3 输入与理解

每个用户表达状态都平等提供：

- 自由文字；
- 按住说话，ASR 文本经用户确认或编辑后再发送；
- 最多两条可编辑参考句；
- `Repeat`、`Slower`、`Simpler English`；
- 用户连续两次没听懂时，允许一行简短中文解除阻塞，随后回到简单英语。

理解处理固定为：

| 情况 | 处理 |
|---|---|
| 意思清楚，语言不自然 | 推进事件；纠错留到结束 |
| 存在一个关键歧义 | Morrow 复述当前理解，只问一个澄清问题 |
| ASR 低置信 | 展示听到的文本；确认前暂停结算 |
| 两轮仍无法理解 | 提供打字、简单英语或参考句；不显示失败 |
| 用户不想回答 | 使用该事件的非隐私替代路径，或暂停事件 |

### 2.4 结果、记忆与日记

- **世界状态**：用户明确选择导致的房间、来信或外出计划变化，直接随事件结算保存；
- **生活记忆**：用户主动分享的真实生活信息，只生成提案，必须确认；
- **语言记忆**：值得以后自然复现的表达，只生成提案，必须确认；
- **关系记忆**：双方共同完成的事件或共同说法，只生成提案，必须确认；
- 用户拒绝个人记忆不撤销世界状态；
- 原始录音、未确认转写、模型猜测、敏感推断不得进入长期记忆；
- 每个事件结束最多展示一条成功表达、一条更自然表达，以及仅在影响理解时出现的一条发音提示；
- 每次完成生成一篇简短共同记忆，内容可查看、编辑或删除。

### 2.5 自然复现规则

系统只从用户已确认、未删除、未暂停的语言记忆中选择表达；同时满足以下条件才出现：

1. 当前事件的语义任务与表达匹配；
2. 距表达首次出现至少隔一个事件步骤，或进入另一天；
3. 当前回复只复现一个旧表达；
4. 以邀请或自然示范出现，不要求逐字复述；
5. 用户不用该表达也能完成事件；
6. 连续两次未采用后降低优先级，不反复追问。

首批明确的复现链：

| 来源事件 | 可保存表达 | 后续自然入口 |
|---|---|---|
| 事件 1 | `I think it means…` | 事件 3 确认 Morrow 的理解；事件 4 解读道路情况 |
| 事件 2 | `I'd rather have… because…` | 事件 4 比较“现在出发”与“等安静后出发” |
| 事件 3 | `What I meant was…` | 事件 4 修正计划；事件 5 澄清当天经历 |
| 事件 4 | `If …, we can …` | 事件 5 讨论当天计划或未来安排 |
| 事件 5 | `The hardest/best part was…` | 后续日常事件回顾相似的一天 |

---

# 3. 事件 1：Morrow 收到一封看不懂的来信

## 3.1 基本信息

| 项目 | 定义 |
|---|---|
| 事件 ID | `morrow_letter_v1` |
| 英文标题 | `The letter with two meanings` |
| 目标时长 | 3—5 分钟 |
| 触发 | `first_day_status = completed`；当前无活动事件 |
| Morrow 目标 | 理解来信的实际要求，并决定如何回应 |
| 目标英语能力 | 提取大意、解释自己的理解、表达不确定、作出回应选择 |
| 核心表达 | `I think it means…` / `It might mean…` / `I'm not sure about…` |
| 输入方式 | 文字、确认后语音、两条可编辑参考句 |

## 3.2 来信内容

信纸只有两句，避免依赖庞大世界观：

> Keep the light near the window. When the road sounds empty, leave a small sign at the door.

`leave` 既可能被 Morrow 字面理解为“离开”，也可能是“留下/放置”。误解点有明确语言依据，不靠故意装傻。

## 3.3 状态与标准路径

| 状态 | Morrow / 系统行为 | 用户任务 | 成功与推进 |
|---|---|---|---|
| `lt01_open` | `A letter arrived. I understand every word, which is not the same as understanding the letter.` | 开始或稍后处理 | 开始后进入 `lt02_gist`；稍后则暂停 |
| `lt02_gist` | 展示来信；`What do you think the writer wants me to do?` | 用自己的英语说出大意 | 至少识别“保持窗边光”或“门边留下标记”之一，进入确认 |
| `lt03_confirm` | `Let me make sure I understood. You think the writer wants… Is that right?` | 确认或修正 | 确认后进入选择；修正回到一次澄清 |
| `lt04_reply` | `Should I answer now, or wait until we know what the road sounds like?` | 选择“现在回复”或“先观察道路”，并可说理由 | 写入确定结果 |
| `lt05_result` | 根据选择写一张短便笺，或把信放在窗边等待 | 查看影响 | 生成记忆提案和日记，完成 |

参考句：

- `I think it means: keep the light on and leave a sign by the door.`
- `I'm not sure about “leave.” It may mean “put something there.”`

## 3.4 误解与恢复

**误解触发：** 用户或 ASR 使用 `leave`，但未说明是“离开”还是“留下东西”。

Morrow 的可逆反应：

> If I leave the door, there will be no one here to read the next letter. That seems inefficient.

随后立即给澄清入口：

> Do you mean “go away,” or “put a sign there”?

恢复规则：

- 用户选择或解释后回到 `lt03_confirm`；
- 不把第一次错误理解写入记忆；
- 两轮仍不清楚时可选：`Put a sign there.` / `Go away from the door.`；
- 恢复不会减少光效、关系进度或结果质量。

## 3.5 结果

| 结果 ID | 用户意图 | 世界状态变化 | 后续影响 |
|---|---|---|---|
| `reply_now` | 现在回复，确认会保留窗边光并准备门边标记 | `letter_response = reply_now` | 事件 4 出发前，门边已有一张简短标记 |
| `observe_first` | 先听道路情况再回复 | `letter_response = observe_first` | 事件 4 会先出现“道路是否安静”的判断 |

两种结果都正确；区别是后续外出开场信息和 Morrow 的一句承接台词。

## 3.6 记忆与复现

- 生活记忆：默认不生成；来信内容不是用户个人信息；
- 语言记忆提案：用户实际使用或接受的 `I think it means…`；
- 关系记忆提案：`You and Morrow worked out the meaning of the first letter.`；
- 未来复现：事件 3/4 出现需要解释含义时，Morrow 可说：`You used “I think it means…” with the letter. It may fit here too.`；
- 用户未保存语言记忆时，只能承接“读过来信”的世界事件，不能声称用户学过该表达。

---

# 4. 事件 2：Morrow 想给房间增加一件物品

## 4.1 基本信息

| 项目 | 定义 |
|---|---|
| 事件 ID | `room_object_v1` |
| 英文标题 | `One more thing for the room` |
| 目标时长 | 3—5 分钟 |
| 触发 | 事件 1 完成；首日恢复物仍存在 |
| Morrow 目标 | 与用户共同选一件真正有用途的房间物品 |
| 目标英语能力 | 描述物品、比较选项、说明偏好和原因 |
| 核心表达 | `I'd rather have… because…` / `It would make the room…` |
| 确定候选 | `a low chair`、`a narrow shelf`、`a small kettle` |

用户可以提出候选之外的普通安全物品，但 MVP 只在能映射到 `seat | storage | warm_drink` 三类用途时接受；无法映射时，Morrow 请求从三项中选一个，避免模型任意创造库存和资产。

## 4.2 标准路径

| 状态 | Morrow / 系统行为 | 用户任务 | 成功与推进 |
|---|---|---|---|
| `ro01_open` | `The room has light now, but nowhere sensible to sit, store a letter, or make a warm drink.` | 继续 | 展示三个物品 |
| `ro02_compare` | `Which one would make this room easier to live in?` | 选择物品并尽量说明理由 | 对象明确即进入确认；理由可选但会丰富结果 |
| `ro03_confirm` | Morrow 复述物品与理由 | 确认或修正 | 确认后写入选择 |
| `ro04_place` | 用户从两个固定位置选择：`by the window` / `near the door` | 用英语确认位置 | 位置明确则落位 |
| `ro05_result` | 展示物品和一处克制的房间变化 | 查看影响 | 生成日记并完成 |

参考句：

- `I'd rather have a small kettle because the room feels cold.`
- `Let's add a narrow shelf near the door.`

## 4.3 Morrow 的独立判断

Morrow 不无条件同意，但异议只针对可观察问题：

- 椅子放门口：`That may make the door difficult to open. Do you still want it there, or by the window?`
- 水壶放窗边：`The window ledge looks narrow. Near the door may be safer.`
- 书架放窗边：允许，不制造异议。

用户坚持时，只要不违反确定性布局约束就尊重选择；不能放置的位置由系统规则拒绝，而不是模型临时决定。

## 4.4 误解与恢复

**误解示例：** 语音把 `shelf` 识别成 `self`，或物品明确但位置不明确。

Morrow：

> I heard “self,” but the room already contains both of us. Did you mean “shelf”?

恢复：确认转写或点击物品卡后返回 `ro03_confirm`。错误转写不进入消息事实、记忆或反馈；只有确实影响理解的发音问题才可在结束时提示 `shelf` 的末尾辅音。

## 4.5 结果

| 结果 ID | 世界状态 | 可见变化 | 后续自然承接 |
|---|---|---|---|
| `chair_added` | `room_added_object = low_chair` | 出现可坐下听声音的低椅 | 事件 5 可在椅边进行回顾 |
| `shelf_added` | `room_added_object = narrow_shelf` | 来信被放到架上 | 事件 4 出发前从架上取来信 |
| `kettle_added` | `room_added_object = small_kettle` | 房间出现低声水响 | 事件 5 开场可提到水开了，但不假装真实照料需求 |

另写入 `room_added_object_location`，取值为用户在 `ro04_place` 实际确认的 `window | door`（outcome 通过受白名单约束的槽位 `room_placement` 引用，非硬编码默认）。未确认位置不写默认值，完成时按白名单校验后幂等写入一次；重复提交不得生成第二件物品。

## 4.6 记忆与复现

- 生活记忆：仅当用户把选择联系到自己的真实偏好且愿意保存，例如 `The user likes having tea in the evening.`；
- 语言记忆提案：用户实际采用的 `I'd rather have… because…`；
- 关系记忆提案：`You and Morrow chose a [object] for the room.`；
- 未来复现：事件 4 比较出发时机时，Morrow可邀请：`You can use “I'd rather… because…” again, if it fits.`；
- 不从选择水壶自动推断用户爱喝茶。

---

# 5. 事件 3：Morrow 误解了用户的一句话

## 5.1 基本信息

| 项目 | 定义 |
|---|---|
| 事件 ID | `literal_misunderstanding_v1` |
| 英文标题 | `What I thought you meant` |
| 目标时长 | 3—5 分钟 |
| 触发 | 事件 2 完成 |
| Morrow 目标 | 准确理解用户当下的一项简单计划，并允许用户修正 |
| 目标英语能力 | 澄清、改述、对比原意与误解、确认共同理解 |
| 核心表达 | `What I meant was…` / `I didn't mean…` / `Let me say it another way.` |

## 5.2 误解来源约束

事件只使用用户**本事件内刚提交且已确认的文本**。不从未确认记忆、低置信 ASR、敏感信息或模型猜测中寻找素材。

Morrow 先问：

> Tell me one simple plan for later today. I want to see whether I understand it the human way, not the island way.

服务端将用户句子交给歧义判断：

- 存在高置信、无害的字面歧义：允许 Morrow 给出一个轻微字面理解；
- 句意清楚：Morrow 只做诚实复述，并请用户确认，不强造误解；
- 内容敏感或高风险：跳过剧情误解，进入边界或安全流程；
- ASR 不确定：先处理转写，不进入歧义判断。

## 5.3 标准路径

| 状态 | Morrow / 系统行为 | 用户任务 | 成功与推进 |
|---|---|---|---|
| `mm01_open` | 提出“稍后的一项计划”问题 | 选择自由表达、参考句或不谈个人计划 | 有输入进入理解；拒答进入非个人替代句 |
| `mm02_input` | 接收用户确认后的句子 | 提交 | 服务端分类为 `clear | harmless_ambiguity | unsafe_or_sensitive` |
| `mm03_interpret` | 清楚时复述；有歧义时给出轻微字面解释 | 判断是否正确 | 正确进入结果；不正确进入澄清 |
| `mm04_clarify` | `I may be taking that too literally. What did you mean?` | 使用任意澄清表达 | 重新复述，不要求使用目标句型 |
| `mm05_shared_meaning` | 展示“原句 / 我先理解成 / 你真正的意思”三行卡片 | 确认 | 生成日记并完成 |

参考句：

- `What I meant was: I need some quiet time.`
- `I didn't mean that literally. Let me say it another way.`

拒答替代路径：用户可选择解释系统提供的非个人句子 `I need some space.`；该路径不生成生活记忆。

## 5.4 可逆误解示例

用户：

> I need some space after work.

Morrow：

> I first pictured an empty corner of the room. You may mean time alone instead. Which kind of space did you mean?

这只改变屏幕上的临时草图标签 `empty_corner`，用户澄清后立即移除；不更改房间物品，不制造损失。

## 5.5 结果

| 结果 ID | 条件 | 结果 |
|---|---|---|
| `meaning_confirmed_first_try` | Morrow 首次复述正确 | `last_communication_result = confirmed_first_try`；Morrow承认这次没有陷入字面理解 |
| `meaning_repaired` | 用户通过澄清修复误解 | `last_communication_result = repaired`；展示修复前后差异 |
| `neutral_example_completed` | 用户走非个人替代句 | `last_communication_result = neutral_example`；完成能力体验，但不保存用户生活信息 |

## 5.6 记忆与复现

- 生活记忆：只有用户明确愿意保存其真实计划时才提案；默认不保存“需要独处”等可能敏感或情境性很强的内容；
- 语言记忆提案：用户采用或认可的 `What I meant was…`；
- 关系记忆提案：仅保存 `You and Morrow repaired a misunderstanding together.`，不自动保存被误解的私密内容；
- 未来复现：事件 4/5 出现计划或经历理解偏差时，Morrow 可以自然说：`I may be taking that too literally. What did you mean?`，并允许用户用已保存表达澄清。

---

# 6. 事件 4：Morrow 准备第一次外出

## 6.1 基本信息

| 项目 | 定义 |
|---|---|
| 事件 ID | `first_outing_v1` |
| 英文标题 | `The road beyond the window` |
| 目标时长 | 3—5 分钟 |
| 触发 | 事件 3 完成；信箱与窗外道路可用 |
| Morrow 目标 | 与用户决定是否、何时沿门外短路走到信箱，并准备一个简单条件计划 |
| 目标英语能力 | 计划、条件句、比较时机、给建议和理由 |
| 核心表达 | `If …, we can …` / `I'd rather… because…` / `We should take…` |

MVP 外出范围只到“门外短路—信箱”，不扩展新地图、商店、角色或大型冒险。

## 6.2 环境输入

系统提供确定性状态，不让模型编造：

- `road_sound = quiet | windy`；
- `window_light = on | dim`；
- 事件 1 的 `letter_response`；
- 首日恢复物 `lamp | plant`；
- 事件 2 新增物品，仅用于一句场景承接。

## 6.3 标准路径

| 状态 | Morrow / 系统行为 | 用户任务 | 成功与推进 |
|---|---|---|---|
| `ou01_open` | `The mailbox is only a short walk away. That is still farther than I have gone here.` | 继续或暂不外出 | 暂不外出也进入可完成的计划结果 |
| `ou02_notice` | 给出道路声音与光线 | 用英语描述一个观察 | 意思可理解即进入计划 |
| `ou03_plan` | `Should we go now, wait until it is quieter, or leave it for another day?` | 选择时机，可说明理由 | 进入条件确认 |
| `ou04_condition` | 邀请形成一个条件计划，但不强制句型 | 确认 `if condition → action` | 计划合法则结算 |
| `ou05_result` | 根据选择显示出发、等待或延期 | 查看影响 | 生成日记并完成 |

参考句：

- `If the road stays quiet, we can go to the mailbox now.`
- `I'd rather wait because the wind is too strong.`

## 6.4 旧表达自然复现

若存在已确认语言记忆：

- 事件 1 `I think it means…`：道路声音与来信条件相关时，Morrow 可问 `What do you think the letter means by “when the road sounds empty”?`；
- 事件 2 `I'd rather… because…`：比较出发时机时，输入区可显示为非强制提示；
- 事件 3 `What I meant was…`：用户纠正 `go now / wait` 时可自然使用。

每次只选一条最相关表达；没有已确认语言记忆时，事件仍完整可用。

## 6.5 误解与恢复

**误解点：** `We can go if it gets quiet` 与 `We can't go unless it gets quiet` 被错误理解，或 ASR 漏掉 `can't`。

Morrow：

> I heard “we can go.” The word “can't” changes the whole plan. Should we go now, or only after it gets quiet?

恢复规则：

- 状态停留在 `ou04_condition`；
- 用户用按钮、文字或语音确认；
- 只有确认后的计划写入世界状态；
- 若歧义来自低置信 ASR，不作为用户发音错误记录。

## 6.6 结果

| 结果 ID | 世界状态变化 | 可见结果 | 后续入口 |
|---|---|---|---|
| `went_to_mailbox` | `first_outing_status = completed_now` | Morrow 到信箱取回一张空白声音卡 | 事件 5 可在回房后开始 |
| `waited_for_quiet` | `first_outing_status = waiting_condition`，保存明确条件 | 门边准备好标记，条件满足后用一段短过场完成 | 下次进入先确认环境，不要求重说整段 |
| `postponed_without_penalty` | `first_outing_status = postponed` | Morrow 接受延期，并把计划留在门边 | 不降低关系；事件视为完成，未来可有新外出而非强迫重做 |

## 6.7 记忆与复现

- 生活记忆：用户若主动联系自己的偏好，例如不喜欢大风，必须确认后才保存；
- 语言记忆提案：`If …, we can …` 或用户实际使用的自然条件表达；
- 关系记忆提案：`You and Morrow planned their first walk to the mailbox.`；
- 世界状态可保存延期，但不得把延期描述成用户“让 Morrow 失望”。

---

# 7. 事件 5：Morrow 询问用户今天发生的事情

## 7.1 基本信息

| 项目 | 定义 |
|---|---|
| 事件 ID | `today_story_v1` |
| 英文标题 | `One thing from today` |
| 目标时长 | 3—5 分钟；可选择 1 分钟短路径 |
| 触发 | 事件 4 完成；之后可按冷却作为日常模板出现 |
| Morrow 目标 | 理解用户今天的一件真实小事，并把注意力放在意义而非语法测验上 |
| 目标英语能力 | 叙述、顺序、原因、感受、挑选重要细节 |
| 核心表达 | `The best part was…` / `The hardest part was…` / `What happened was…` |

## 7.2 开场按房间状态承接

只使用一个真实世界状态：

- 椅子：`The chair is finally useful. Tell me one thing from today.`
- 架子：`The letter is quiet on the shelf. How was your day outside this room?`
- 水壶：`The kettle is making a very serious sound. Tell me one thing from today while it does.`
- 未知或配置缺失：使用通用开场，不猜测物品。

## 7.3 标准路径

| 状态 | Morrow / 系统行为 | 用户任务 | 成功与推进 |
|---|---|---|---|
| `td01_open` | `Tell me one thing from today—the best part, the hardest part, or simply what happened.` | 选择分享、短路径、轻话题或不谈 | 分享进入叙述；不谈进入尊重边界路径 |
| `td02_story` | 接收一句或多句真实表达 | 描述事件 | 提取主要意思；一次只追问一个缺失细节 |
| `td03_detail` | 根据内容问 `What happened next?`、`Why did it matter?` 或 `How did you feel afterward?` 中一个 | 补充或选择结束 | 用户可随时选择 `That's enough` |
| `td04_understanding` | Morrow 用 1—2 句总结 | 确认或修正 | 确认后进入结束反馈 |
| `td05_close` | 显示成功表达/自然表达与记忆提案 | 审核或跳过 | 生成共同记忆并完成 |

参考句：

- `The best part was having lunch with a friend.`
- `The hardest part was a long meeting at work.`

## 7.4 一分钟与拒答路径

### 一分钟短路径

用户选择 `I only have one minute`：只完成 `td02_story → td04_understanding → td05_close`，不追问细节。

### 不想谈今天

Morrow：

> We can leave today alone. Would you rather describe one sound in the room, or stop here?

- 描述房间声音：完成一个非个人、30—60 秒的替代路径；
- 停止：正常完成为 `closed_without_sharing`；
- 不生成生活记忆，不用负罪文案，不把沉默解释成情绪问题。

## 7.5 误解与恢复

- 时间顺序不清：`Did that happen before the meeting, or after it?`
- 主体不清：`When you say “they,” do you mean your colleague or your client?`
- ASR 低置信：先确认转写；
- Morrow 总结不对：用户可用 `What I meant was…` 或自由修正；
- 两轮仍不清楚：允许用户只保留一个确定事实，或不生成个人摘要。

修正后的意思替换临时摘要；错误摘要不得进入记忆和日记。

## 7.6 结果

| 结果 ID | 条件 | 结果 |
|---|---|---|
| `story_shared` | 用户分享并确认一个主要意思 | 生成经确认的事件摘要与可选记忆提案 |
| `quick_story_shared` | 一分钟路径完成 | 生成更短日记，不因时长减少关系结果 |
| `room_detail_shared` | 用户选择非个人替代话题 | 只记录共同场景，不保存用户生活信息 |
| `closed_without_sharing` | 用户不想谈并结束 | 正常完成；无个人记忆；下次不追问原因 |

## 7.7 记忆与复现

- 生活记忆：只提取用户确认的具体事实；避免保存短暂情绪标签和敏感推断；
- 语言记忆：保存用户实际使用或选择保留的 `The best/hardest part was…`；
- 关系记忆：可保存 `You told Morrow one thing from your day.`，若用户拒绝分享则不生成；
- 后续复现：仅在相似主题出现时邀请旧表达；不按固定间隔弹题；
- 每次重复运行使用新的事件实例和日期，但共享 `today_story_v1` 配置版本。

---

# 8. 结构化配置约定

工程内配置分为两层：

```text
packages/contracts/src/events.ts
  └─ Zod Schema、枚举、EventRuleset / EventDefinition 类型

packages/domain/src/events-v1.ts
  └─ events-v1.0.0 的五个事件、状态、迁移、结果、记忆和复现配置
```

关键字段：

| 字段 | 用途 |
|---|---|
| `trigger` | 前置事件、世界状态、关系阶段、重复策略和冷却 |
| `targetSkills` | 当前事件真正训练的表达能力，不用于用户打分 |
| `states` | 可恢复的内部状态、用户任务、Morrow 台词和参考句 |
| `transitions` | 服务端允许的确定性状态迁移与守卫条件 |
| `misunderstanding` | 可逆误解、澄清台词和恢复状态 |
| `outcomes` | 允许结果及确定性世界状态写入 |
| `memoryProposals` | 可生成的三类记忆模板，全部要求确认 |
| `resurfacing` | 语言表达未来出现的语义入口和目标事件 |

服务端必须拒绝：

- 配置之外的状态和迁移；
- 未声明的世界状态写入；
- 不要求用户确认的长期记忆；
- 把低置信 ASR 或错误理解当作事实；
- 已完成实例的重复结算；
- 模型临时创造的新地点、货币、库存或关系阶段。

# 9. 事件引擎验收场景

## 9.1 标准路径

1. 首日已完成；
2. 五个事件按前置顺序解锁；
3. 每个事件通过文字输入可在 3—5 分钟完成；
4. 每次完成只写入声明过的结果；
5. 用户审核记忆后生成共同记忆。

## 9.2 误解恢复

1. 在事件 1 提交含糊的 `leave`；
2. Morrow 产生轻微字面理解；
3. 用户通过按钮或英语澄清；
4. 事件回到确认状态并正常完成；
5. 错误理解未进入长期记忆。

## 9.3 旧表达复现

1. 用户在事件 2 保存 `I'd rather have… because…`；
2. 事件 4 的计划状态识别到“偏好 + 原因”语义；
3. 系统只把该表达作为可选提示；
4. 用户采用或不用都可完成；
5. 采用后更新复现记录，不立即再次出现。

## 9.4 中断与幂等

1. 用户在任一确认前刷新；
2. 页面恢复最近已确认状态；
3. 重复提交相同幂等键不产生第二条结果；
4. 暂停后可继续或选择不继续；
5. 已完成事件不会重复写世界状态和记忆提案。

## 9.5 隐私与边界

1. 用户拒绝全部记忆，事件仍完成；
2. 用户不谈今天，事件 5 走非个人路径；
3. 原始录音和未确认转写不进入记忆；
4. 即时安全信息中止剧情，事件保持暂停；
5. Morrow 不因延期外出、拒答或离开表达失望或责备。

# 10. 本版本明确不做

- 不引入金币、经验、连续签到或失败扣分；
- 不增加新宠物、NPC、商店、背包和大型地图；
- 不把五个事件做成语法关卡或固定答案题；
- 不要求使用语音；
- 不因用户选择延期外出而施加关系惩罚；
- 不让模型自由生成世界状态键；
- 不自动保存个人信息；
- 不在用户拒答后换一种方式继续逼问。

# 11. 进入下一任务的输入

本规格已经给数据模型任务提供以下确定对象：

- 规则集、事件定义、事件实例、内部状态与状态迁移；
- 世界状态写入；
- 三类记忆提案；
- 共同记忆条目；
- 语言表达复现规则；
- 幂等键、暂停、恢复与完成状态；
- 重复事件实例与冷却。

下一步 1.5 应据此建立 `DATA_MODEL.md` 与数据库 Schema 初稿，并保持本文档及 `events-v1.ts` 的 ID、状态名和结果名一致。
