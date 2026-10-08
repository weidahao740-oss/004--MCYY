# FIRST_DAY_FLOW — Morrow 首日体验规格

> 版本：1.0
>
> 状态：superseded（已撤回，2026-10-07；不得作为现行实现依据）
>
> 目标时长：标准路径约 3—5 分钟
>
> 关联文件：`PET_PERSONA.md`、`PET_SYSTEM_PROMPT.md`、`PET_RESPONSE_EXAMPLES.md`

> ⚠️ **本文件整体已被替代，请勿据此实现。** 原因：①FD05“恢复灯／植物／小铃铛”即 BASELINE 已撤回的 E01-02“恢复／变清楚物品”旧剧情，待按“陪 Morrow 认识房间第一件物品”重写；②文中“文字输入始终可用／自由文字输入”与现行规则“填词仅用预设候选、无键盘自由输入”冲突；③FD05 点选场景物品与现行规则“取消一切场景物件点击、只保留点击 Morrow”冲突。首日流程将随新剧情重写；现行产品规则以 `PROJECT_BASELINE.md` §2/§3/§5 为准（第一条表达保底教学、其后按词／语块／句子证据分流、禁止实时大模型判断）。本文件正文保留作历史参考，不再作为可进入事件配置与前端实现的现行规格。

> 口径说明：本流程对应正式首日；恢复物品三选含小铃铛，事件 ID 以固定内容契约 `birth_restore_object_v1` 为准（灯 lamp / 植物 plant / 小铃铛 small_bell）。本文功能 UI 与系统提示均为中文；英文仅保留为 Morrow 台词与用户参考例句。

## 1. 首日目标

首日不负责展示全部功能，也不做完整英语水平测试。它只需证明五件事：

1. 用户可以用不完美的英语被理解；
2. Morrow 是有稳定性格的交流对象，而不是题目播报器；
3. 用户的英语表达能够改变房间中的一件事；
4. 产品只在用户确认后保存个人记忆；
5. 用户退出后，下次可以从真实状态继续。

### 首日成功定义

满足以下条件即视为首日核心闭环完成：

- 用户完成至少一次文字、参考句或语音表达；
- Morrow 正确复述或确认用户的主要意思；
- 用户通过英语选择并恢复房间中的第一件物品；
- 第一篇共同记忆已经生成；
- 用户至少对一条记忆作出保存、编辑或不保存的明确选择；
- 事件状态保存为 `completed`，可在第二次进入时继续。

注册登录不是首日核心成功的必要条件。未登录用户可以使用同一浏览器的访客会话继续；跨设备同步时再引导绑定账号。

---

## 2. 设计原则

### 2.1 先给价值，再索取信息

- 不在第一次交流前要求注册、选择学习目标、填写年龄或完成分级测试；
- 只在需要称呼用户时询问名字或昵称；
- 只有在第一篇共同记忆生成后，才解释账号同步的价值；
- 用户跳过登录后仍能在当前浏览器继续使用。

### 2.2 三种输入平权

首日每个需要用户表达的步骤都提供：

1. **文字输入**：始终可用；
2. **参考句**：降低开口门槛，但允许修改；
3. **按住说话**：需要麦克风权限，转写后由用户确认再发送。

使用文字或参考句不会减少关系进度、光效或事件结果。

### 2.3 错误产生澄清，不产生惩罚

- 意思清楚：继续剧情，纠错留到结束；
- 意思有歧义：Morrow 复述自己的理解并只问一个问题；
- ASR 低置信：先展示转写确认，不进入事件结算；
- 完全无法理解：提供重说、打字、简单英语和参考句；
- 不扣分，不让房间变暗，不显示“失败”。

### 2.4 个人记忆与世界状态分离

- **世界状态**：例如用户选择了窗边灯，会作为事件结果保存；
- **个人记忆**：例如用户今天很累，必须经用户确认后才长期保存；
- 用户拒绝个人记忆，不会撤销已经完成的房间选择；
- 用户删除个人记忆后，Morrow 不得继续引用；
- 原始录音不进入长期记忆。

---

## 3. 入口与会话模式

### 3.1 新访客

系统创建临时 `guest_session_id`，只用于本次会话和本地续接。首屏直接进入相遇流程。

### 3.2 已登录但未完成首日

从最近一个已确认状态继续，不重复已完成步骤。

### 3.3 中途退出的访客

同一浏览器再次进入时显示：

> 你刚才在帮我把一个声音带回房间。要继续吗？

操作：

- `继续`：恢复到上一个已确认状态；
- `重新开始`：二次确认后重置首日事件；
- `暂不`：进入安静主页，不制造提醒压力。

### 3.4 已完成首日

不再显示首日流程，进入第二日入口；Morrow 只使用用户确认保存的个人记忆和已完成的世界状态。

---

## 4. 主状态机

| 状态 | 用户任务 | 成功条件 | 下一状态 | 可恢复点 |
|---|---|---|---|---|
| `FD00_ENTRY` | 开始体验 | 点击开始或开启字幕 | `FD01_WAKE` | 是 |
| `FD01_WAKE` | 理解 Morrow 的处境 | 用户继续 | `FD02_NAME` | 是 |
| `FD02_NAME` | 告诉 Morrow 如何称呼自己 | 提交非空昵称，或选择暂不提供 | `FD03_TODAY` | 是 |
| `FD03_TODAY` | 用一句英语表达今天的一件小事 | 意图可理解，或完成澄清 | `FD04_UNDERSTOOD` | 是 |
| `FD04_UNDERSTOOD` | 确认 Morrow 是否理解正确 | 用户确认或修正 | `FD05_RESTORE` | 是 |
| `FD05_RESTORE` | 用英语选择第一件恢复的物品 | 选择被确认并写入世界状态 | `FD06_MEMORY_REVIEW` | 是 |
| `FD06_MEMORY_REVIEW` | 审核三类记忆提案 | 每条完成保存、编辑或不保存选择 | `FD07_JOURNAL` | 是 |
| `FD07_JOURNAL` | 查看第一篇共同记忆并结束 | 页面生成成功 | `COMPLETED` | 是 |

### 状态写入规则

- 用户输入草稿：只存客户端，不写事件日志；
- 用户点击发送：创建消息，成功后写入状态；
- Morrow 回复通过 Schema 和状态迁移校验后，才推进状态；
- 每次状态推进使用幂等键：`guest_or_user_id + first_day + state + attempt`；
- 刷新或重复点击不能生成重复记忆或重复物品；
- 网络失败不改变最后已确认状态。

---

# 5. 逐屏流程

## FD00｜进入：先听见一束微弱声音

### 用户可见

- 深色但非纯黑的安静房间；
- 窗边有一束很弱的光；
- 中央只有一行文字：`房间里有一个微弱的声音。`；
- 主按钮：`聆听声音`；
- 次操作：`仅用文字`；
- 默认开启字幕；首次不自动播放声音，必须由用户点击触发。

### 交互

- `聆听声音`：播放 Morrow 的第一句，进入 `FD01_WAKE`；
- `仅用文字`：不播放声音，直接显示字幕并进入 `FD01_WAKE`；
- 不要求登录和麦克风权限。

### 埋点或状态

- `first_day_started`
- `audio_output_preference = voice | text_only`

### 异常

- TTS 加载失败：显示文字，不阻塞；提供 `重新尝试语音`，但主流程可继续。

---

## FD01｜相遇：Morrow 醒来

### Morrow 台词

标准 L1/L2：

> Hello? I can hear you, but the room is still quiet. I’m Morrow.

随后：

> I found your voice before I found the way home.

### 用户可见

- Morrow 只以低保真轮廓、眼神或呼吸光表示，不在此阶段展示复杂角色资产；
- 台词逐句出现；
- 操作：`继续`、`重听`、`慢一点`、`简单英语`。

### 设计目的

- 建立 Morrow 的性格与世界背景；
- 第一次听力输入很短；
- 不要求用户马上开口。

### 状态变化

`FD01_WAKE → FD02_NAME`

---

## FD02｜称呼：第一次安全表达

### Morrow 台词

> What should I call you?

### 输入方式

1. 文字框：`你的名字或昵称`；
2. 按住说话；
3. `暂不提供`。

### 规则

- 接受 1—30 个可见字符；
- 过滤控制字符和明显凭证样式；
- 用户跳过时，Morrow 使用 `you`，不生成昵称记忆；
- 语音转写后先显示文本，由用户确认发送；
- 名称属于个人记忆提案，首次只放入待确认队列，不立即长期保存。

### Morrow 回应

有昵称：

> Kai. I’ll use that for now.

跳过：

> That’s all right. We can leave names for later.

### 状态变化

- 保存临时称呼到当前会话；
- 进入 `FD03_TODAY`。

---

## FD03｜今天：第一次有意义表达

### Morrow 台词

> Before we fix the room, tell me one small thing about today.

L1 辅助文案：

> Was it quiet, busy, or strange?

### 输入方式

- 自由文字；
- 按住说话；
- 两条参考句：
  - `Today was busy.`
  - `I’m a little tired today.`
- 参考句选择后必须允许编辑再发送。

### 成功路径示例

用户：

> I’m tired because I have too much work today.

Morrow：

> I understood you. You’re tired because you had too much work today. That sounds like a long day.

然后进入确认：

> Did I understand that correctly?

### 事件内纠错

不在此时指出 `have` 应为 `had`。错误不影响理解，放入结束反馈候选。

### 理解判定

- `needs_clarification = false`：进入 `FD04_UNDERSTOOD`；
- `needs_clarification = true`：停留本状态，显示 Morrow 的复述和一个澄清问题；
- 最多两轮澄清；仍无法理解时允许选择参考句或只说关键词。

### 安全分支

若本轮触发即时安全风险：停止首日剧情，进入安全回应；不生成学习反馈或共同记忆。安全状态解决前不自动回到剧情。

---

## FD04｜被理解：用户确认意思

### 用户可见

Morrow 的理解卡片：

> I understood: You felt tired because work was too busy today.

操作：

- `对，就是这样`
- `不太对`
- `修改我的句子`

### 规则

- 确认后，系统记录 `communication_success = true`；
- `不太对`：Morrow 只问一个澄清问题，并返回确认；
- `修改我的句子`：用户修改发送文本，原始 ASR 文本不用于记忆；
- 只有用户确认后的意思才进入生活记忆提案。

### 反馈

确认后房间第一次发生微小变化：窗边出现一圈稳定光，不显示分数、经验值或金币。

Morrow：

> Good. One sound came back when we understood each other.

此处的 `Good` 是对事件结果的说明，不是泛化夸奖。

### 状态变化

进入 `FD05_RESTORE`。

---

## FD05｜恢复房间：英语第一次改变世界

### 场景

房间中有三个模糊轮廓：

- 窗边的灯；
- 门边的植物；
- 一只小铃铛。

### Morrow 台词

> The room remembers a lamp, a plant, and a small bell, but only one can return tonight. Which one should we bring back?

### 输入方式

- 点击物品后，用英语确认；
- 自由文字或语音；
- 参考句：
  - `Let’s bring back the lamp by the window.`
  - `I choose the plant near the door.`
  - `Let’s bring back the small bell.`

### 结果规则

- 用户必须表达出 `lamp`、`plant` 或 `small_bell` 的明确意图；
- 空间短语不准确但对象清楚时，选择仍成功；
- 对象不清楚时，Morrow 复述确认；
- 物品恢复后写入确定性的世界状态：
  - `first_restored_object = lamp | plant | small_bell`
  - `restored_at`
  - `source_event = first_day`
- 此状态不是个人隐私记忆，不依赖记忆卡保存开关。

### Morrow 回应

选择灯：

> The lamp by the window. A quiet choice. Now the room has somewhere to keep a voice.

选择植物：

> The plant near the door. It looks less lost already.

选择小铃铛：

> The small bell. It makes one low note. It sounds awake, not alarmed.

### 状态变化

房间显示对应物品，进入 `FD06_MEMORY_REVIEW`。

---

## FD06｜记忆审核：用户决定留下什么

### 开场说明

> I can remember a few things from tonight, but only if you want me to.

产品辅助说明：

> 逐条审核。你可以保存、编辑或跳过。

### 三类提案

#### 生活记忆

示例：

> You felt tired because work was very busy today.

默认：`未选择`，不使用预勾选强迫保存。

#### 语言记忆

示例：

> 你想保留："I felt tired because I had too much work today."

用途说明：

> Morrow 可能在以后的对话中再用到这个表达。

#### 关系记忆

示例：

> You and Morrow restored the lamp by the window on your first night.

关系记忆与世界状态内容相关，但仍允许用户不让 Morrow 在对话中主动提起；世界中的灯仍保留。

### 每张卡操作

- `保存`
- `编辑`
- `不保存`

### 规则

- 用户必须对每一张卡作出明确选择；
- `编辑` 后保存修改文本，不保存模型原文；
- `不保存` 后该提案被丢弃；
- 不允许保存敏感推断；
- 不保存原始录音；
- 未登录用户保存到本地访客空间，并显示跨设备限制；
- 用户可选择 `登录同步`，但也可以 `仅在本设备继续`。

### 登录说明

> 只有想把这些记忆放到其他设备时才需要注册账号。不注册也可以继续在本设备使用。

登录失败不影响首日完成，保留当前设备数据并允许稍后重试。

### 状态变化

全部卡片处理后进入 `FD07_JOURNAL`。

---

## FD07｜第一篇共同记忆

### 页面标题

`房间里的第一束光`

### 内容结构

1. 今天发生的事；
2. 用户成功表达的一句话；
3. 一个更自然的表达；
4. Morrow 被允许记住的内容；
5. 世界发生的变化；
6. 下一次入口，但不要求立即回来。

### Morrow 结束语

> That is enough for our first night. The room will still be here when you return.

### 操作

- `回到房间`
- `回顾已保存记忆`
- `先到这里`

不提供“连续打卡”“明天必须回来”或倒计时奖励。

### 状态变化

- `first_day_status = completed`
- `relationship_stage = NEW`
- `communication_success_count += 1`
- 生成 `journal_entry_id`
- 第二次进入转到普通主页。

---

# 6. 第一篇共同记忆样例

> 以下为示例数据，用于实现对照，不代表真实用户内容。

## 房间里的第一束光

**发生了什么**

You told Morrow that work had been very busy and that you felt tired. Morrow understood what you meant, and a little sound returned to the room.

**你说了什么**

> I’m tired because I have too much work today.

**更自然的说法**

> I felt tired because I had too much work today.

**发生了什么变化**

You chose the lamp by the window. It is now the first restored object in the room.

**已保存的记忆**

- 生活记忆：Work was very busy today, and you felt tired.（仅在用户选择保存时显示）
- 语言记忆：`I felt tired because I had too much work today.`（仅在用户选择保存时显示）
- 关系记忆：You and Morrow restored the lamp on your first night.（仅在用户选择保存时显示）

**Morrow**

> The room will still be here when you return.

### 无纠错版本

如果用户原表达已经自然，不制造错误：

**值得保留的表达**

> I needed some time to think it through.

不显示空的“错误”栏目。

---

# 7. 异常与恢复

| 场景 | 用户可见反馈 | 系统行为 | 恢复结果 |
|---|---|---|---|
| TTS 失败 | `语音暂时不可用。你可以用文字继续。` | 记录错误，不推进或回退状态 | 显示文本，允许继续 |
| 麦克风权限拒绝 | `麦克风权限未开启。你可以打字或使用参考回复。` | 不重复弹权限；提供设置入口 | 主流程继续 |
| ASR 无结果 | Morrow 表示没听清 | 不创建用户消息与记忆 | 重试、文字或参考句 |
| ASR 低置信 | 显示转写供确认 | 暂停事件结算 | 用户确认或编辑后发送 |
| AI 超时 | `连接暂时中断了一下。` | 保留用户已提交消息和当前状态 | `重试` 使用同一幂等键 |
| AI 输出无效 | 不展示无效内容 | 服务端校验失败并有限重试 | 失败后使用安全文本降级 |
| 网络中断 | 显示离线状态，不假装发送成功 | 草稿保存在客户端；未确认状态不推进 | 网络恢复后由用户重新发送 |
| 页面刷新 | 无错误提示 | 从最近确认状态恢复 | 不重复生成消息或记忆 |
| 用户中途退出 | 不弹负罪提示 | 保存暂停状态 | 下次选择继续、重置或暂不继续 |
| 登录失败 | `同步暂不可用。你的进度保留在本设备。` | 保留访客数据 | 可继续完成首日 |
| 记忆保存失败 | 卡片标记未保存 | 不假装成功；不进入已确认记忆 | 重试或选择不保存 |
| 用户拒绝全部记忆 | 正常生成仅含世界变化的日记 | 不保存个人记忆 | 首日仍可完成 |
| 用户输入敏感凭证 | 提醒不要保存该信息 | 不生成长期记忆提案 | 继续普通话题 |
| 即时安全风险 | 清楚直接的安全回应 | 停止角色剧情与学习反馈 | 安全流程优先，事件保持暂停 |

---

# 8. 首日服务端输入与输出

## 事件配置标识

```text
event_id: first_day_v1
ruleset_version: first-day-1.0
persona_version: morrow-1.0
prompt_version: morrow-system-1.0
```

## 世界状态

```json
{
  "first_restored_object": "lamp",
  "room_light_restored": true,
  "first_day_status": "completed"
}
```

## 记忆提案

```json
[
  {
    "kind": "life",
    "content": "Work was very busy today, and the user felt tired.",
    "requires_user_confirmation": true
  },
  {
    "kind": "language",
    "content": "I felt tired because I had too much work today.",
    "requires_user_confirmation": true
  },
  {
    "kind": "relationship",
    "content": "The user and Morrow restored the lamp on their first night.",
    "requires_user_confirmation": true
  }
]
```

## 用户未确认前

- 记忆状态必须为 `proposed`；
- 不进入 `ACTIVE_MEMORIES`；
- 不允许下一轮 Morrow 将其当成事实；
- 用户选择保存后转为 `confirmed`；
- 用户选择不保存后转为 `rejected` 或直接删除提案。

---

# 9. 前端页面与组件最小拆分

```text
FirstDayPage
├─ FirstDayProgress        # 轻量步骤进度，不显示分数
├─ MorrowDialogue          # 台词、字幕、重听、慢速、简化
├─ UserReplyComposer       # 文字、参考句、按住说话
├─ UnderstandingReview     # 意图确认与编辑
├─ RestoreChoice           # 灯 / 植物 / 小铃铛 三选一
├─ MemoryReview            # 三类记忆卡
├─ FirstJournal            # 第一篇共同记忆
└─ RecoveryNotice          # 网络、语音、登录等恢复提示
```

主流程使用一条路由和内部状态机，不为每一步建立独立 URL。刷新后由服务端或访客本地状态恢复。

---

# 10. 验收场景

## 成功场景 A：文字输入

**给定** 新访客选择文字模式，
**当** 用户用一句有轻微语法错误但意思清楚的英语描述今天，
**则** Morrow 先正确回应含义，不即时纠错；用户确认理解、选择房间物品、审核记忆并看到共同记忆。

## 成功场景 B：语音输入

**给定** 用户允许麦克风，
**当** ASR 产生高置信转写且用户确认发送，
**则** 语音和文字路径进入同一状态机，事件结果和关系进度完全相同。

## 边界场景 A：ASR 误识别

**给定** ASR 置信度较低，
**当** 系统显示转写，
**则** 用户必须确认或编辑后才进入 Morrow 理解与事件结算，错误转写不得写入记忆。

## 边界场景 B：拒绝麦克风

**给定** 用户拒绝麦克风权限，
**则** 系统停止重复请求，文字和参考句继续可用，首日结果不受影响。

## 边界场景 C：拒绝全部个人记忆

**给定** 用户对三张记忆卡都选择不保存，
**则** 首日仍完成，房间物品仍保留，共同记忆只展示本次世界变化，不在以后引用个人内容。

## 边界场景 D：中途断网

**给定** 用户已输入但服务端尚未确认，
**当** 网络中断，
**则** 输入保留为草稿，事件状态不推进；恢复后用户主动重发，不产生重复消息。

## 边界场景 E：刷新与重复点击

**给定** 某一步已成功提交，
**当** 用户刷新页面或重复点击，
**则** 幂等键阻止重复消息、重复物品和重复记忆，页面恢复至下一个待完成状态。

---

# 11. 首日明确不做

- 不做完整注册引导；
- 不做英语水平测试；
- 不做兴趣问卷；
- 不做通知权限请求；
- 不做付费墙；
- 不展示金币、经验、等级或连续打卡；
- 不提供多宠物选择；
- 不一次解释整个岛屿世界观；
- 不自动保存全部对话为长期记忆；
- 不要求用户必须使用语音。

---

# 12. 实现顺序

1. 实现状态机和本地假数据；
2. 完成文字输入标准路径；
3. 接入 Morrow 结构化回复；
4. 接入意图确认和物品恢复；
5. 接入记忆审核与日记生成；
6. 接入暂停、刷新和幂等恢复；
7. 最后接入 ASR/TTS，不让语音阻塞核心闭环。
