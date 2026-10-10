# 第一章 出生与苏醒（chapter\_01\_birth）完整事件内容

> 版本：1.2.3（E01-01／E01-02 内容、语言与具体教学校准均于 2026-10-10 经用户确认）
> 正文唯一权威来源：本文件是第一章全部事件正文的唯一正式内容文件；任务卡只记录状态、依赖、验收与证据，不另存事件完整正文。
> 依据：
>
> MORROW_LIFE_STORY_BIBLE.md
>
>  第 5 节事件条目模板、第 7 节第一章清单；
>
> FIXED_CONTENT_CONTRACT.md
>
>  v1.0.0；
>
> PET_PERSONA.md
>
>  v1.0
> 已种子／现行事件：序 1
>
> `birth_first_voice_v1`
>
> 、序 2
>
> `b1_first_room_object_v1`
>
> （E01-01 忠实展开自
>
> `fixed-content-v1.ts`；E01-02 已按 P4-T06-08 重写并由用户确认，旧工程配置只作只读历史证据；本轮不修改工程
>
> ）
> 本章共 13 个事件：主线 7 个（序 1、2、3、5、9、10、12），日常 5 个（序 4、6、7、8、13），回访 1 个（序 11）

## 0. 最新实现覆盖（2026-09-30）

第一章旧原型曾按 `项目计划/P4-T06-07-Morrow中文化台词自然翻译与双语语音流.md` 实现恢复物品黄金路径；该路径已被 E01-02 新剧情取代，不再作为现行内容依据。

- E01-01 现行内容、语言与具体教学校准已于 2026-10-10 完成并经用户确认；最终生产台词版本、结果句 ID 与工程世界状态绑定仍留给 S06／P4-T06-09，本轮不修改工程或语音。
- E01-02 现行正文只以本文件对应条目为准，状态为 completed；剧情重写于 2026-10-09 经用户确认，语言 v1.0.1 与具体教学校准于 2026-10-10 完成并经用户确认。
- 旧 `birth_restore_object_v1` 已在内容层正式登记为 `retired`，只作旧原型与历史映射的只读证据，保留不删除；本轮不修改 `english-pet` 旧工程配置。
- 当前产品不提供开放聊天、开放文字输入或课程外自由表达；所有事件中的必需教学不允许用户跳过，明确标记的必修跟读必须真实录音并识别通过。
- 其他 11 个事件的英文和中文尚未完成 P4-T06-07 逐条校准，不得直接迁入正式工程。

## 本章说明



* **进入条件**：新用户首次进入即自动触发序 1（苏醒后的第一句话）。

* **完成条件**：完成本章全部主线事件（序 1、2、3、5、9、10、12）、必要剧情／关系／世界状态和章末主线结算；“第一次互相理解”关系状态成立。系统可提出关系记忆提案，但用户是否保存不作为毕业硬门。日常事件（4、6、7、8、13）从轮换池选取，不阻塞章节完成；回访事件（11）由后台在当前情境与已确认且未暂停的共同记忆或待迁移旧表达语义匹配时自然触发，是否触发不阻塞章节完成。

* **事件类型分布**：主线 7 个、日常 5 个、回访 1 个，合计 13 个，落在蓝图 10—15 区间。

* **世界起点**：一间安静、清晰的房间，窗边的灯、门边的植物和矮柜上的小铃铛都已经存在；一扇还走不到的窗，一扇通往外面小路的门。用户是 Morrow 平等的朋友，可陪伴、表达自己的注意点与给建议，但不替 Morrow 认识世界或作人生决定。

* **语言难度**：全章以 L1 为主（句长 5—10 词、高频词），少量 L2（句长 8—16 词）。Morrow 用 they/them 中性指代，每条英文均配人工中文译文。

* **章节推进硬规则**：单次分支只写世界状态写入与支线细节，不改 chapter\_id；主线未完成时可恢复；暂停不写负向状态、不锁内容、不扣减。



***

### E01-01 苏醒后的第一句话

- 事件 ID：`birth_first_voice_v1`
- 内容校准版本：1.1.0 ｜ 章节：`chapter_01_birth` ｜ sequence：1
- 类型：`mainline` ｜ 时长：2—4 分钟
- 关联主题：`topic_today` / `topic_feelings`
- 生活领域：D1 `domain_self_info`
- 沟通任务：C1 `identifying`——在第一次听见陌生声音时，让用户用一句真实英文表明“我在／我听见你／我想先知道你是谁”。
- 进入条件：新用户首次进入，自动触发（章节序 1，无前序主线）。
- 完成条件：用户完成所选完整表达的真实录音、ASR 识别与用户确认，系统写入 `first_response_style` 并播放对应分支反馈。随后出现共同收束与按钮，进入 E01-02。计入章节完成。
- 暂停条件：用户选择 `稍后继续`，只保存临时中文意图和教学进度；不结算事件、不播放正式分支反馈、不写 `first_response_style`。
- 内容状态：S01 内容、语言与具体教学校准 `completed`（2026-10-10 用户确认）；最终生产台词版本、结果句 ID 和工程世界状态绑定仍由 S06／P4-T06-09 完成。

#### 剧情与角色动机

房间清晰而安静，光线偏暗。Morrow 刚刚醒来，不知道房间外是否有人，于是试探着问出第一句话。用户不是在做问候题，而是在真实回应一个刚醒来、尚未确认有人陪伴的朋友。Morrow 得到回应后才自我介绍，再邀请用户一起看看这个对它来说全新的房间。

#### Morrow 开场台词

1. `Hello? Is someone there?`
   - 人工中文译文：你好？有人在吗？
   - 台词 ID：`bfv_wake_line`
   - 音频需求：`bfv_wake_line_audio`（沿用需求标识；正式语音本轮不制作）

#### 中文意图选择与三条真实表达

Morrow 说完首句后，先在底部上浮选项层显示三条中文意图。用户选择一条后，只进入该路线的英语教学；未选路线不展示成需要学习的内容，也不产生学习证据。

##### 分支 A：回应“我在这里”

- 意图 ID：`bfv_intent_reassuring_presence`
- 中文意图：`告诉墨洛：我在这里`
- 用户完整表达：`Yes, I’m here.`
- 人工中文理解：`对，我在这里。`
- Morrow 分支反馈：`Oh, good. I’m Morrow. I wasn’t sure anyone was there.`
- 人工中文译文：`太好了。我叫墨洛。刚才我还不确定这里有没有人。`
- `first_response_style = reassuring_presence`

##### 分支 B：友好回应

- 意图 ID：`bfv_intent_friendly_greeting`
- 中文意图：`友好地回应墨洛`
- 用户完整表达：`Hi. I can hear you.`
- 人工中文理解：`你好，我能听见你。`
- Morrow 分支反馈：`Hi. I’m Morrow. I’m glad you answered.`
- 人工中文译文：`你好，我叫墨洛。很高兴你回应了我。`
- `first_response_style = friendly_greeting`

##### 分支 C：先确认身份

- 意图 ID：`bfv_intent_identity_check`
- 中文意图：`先问问对方是谁`
- 用户完整表达：`Who are you?`
- 人工中文理解：`你是谁？`
- Morrow 分支反馈：`I’m Morrow. I just woke up. That’s about all I know for now.`
- 人工中文译文：`我叫墨洛。我刚醒来。现在我知道的差不多就这些。`
- `first_response_style = identity_check`

`first_response_style` 只记录这次经过确认的回应方式，不解释为用户性格；禁止使用 `cautious` 或其他标签给用户定性。

#### 共同收束与 E01-02 承接

三条分支反馈后统一播放：

- Morrow：`Everything here feels new. Will you look around with me?`
- 人工中文译文：`这里的一切对我来说都很陌生。你愿意陪我看看周围吗？`
- 中文行动按钮：`陪墨洛看看房间`

点击按钮后进入 E01-02 `b1_first_room_object_v1`。该按钮只承担事件间转场，不替代 E01-01 的必修表达，也不额外写学习证据。

#### 首次产品真实表达教学（完整保底，仅一次）

共同开头固定为：Morrow 说 `Hello? Is someone there?` → 用动作、房间氛围和自然中文让用户明白“刚醒来的 Morrow 正在确认有没有人回应” → 用户选择一条中文意图。中文意图只决定剧情路线，不产生任何英语学习证据；选择后只进入所选路线，未选路线不作为干扰或教学内容出现。

##### 分支 A `Yes, I’m here.` 的实际交互

1. 先播放完整表达 `Yes, I’m here.`，同时用自然中文建立“对，我在这里”的意思。
2. 分别教学自然语块 `Yes`、`I’m here`；两个语块都要完成真实录音跟读并识别通过，才能进入句子搭建。
3. 使用点击式语块排序。底部候选只包含两个已经学过的语块，不放无关干扰项；初始顺序固定反向为 `I’m here` / `Yes,`。
4. 用户按点击顺序把语块送入上方搭建区，先点的排在前面；上方语块可点击撤回后重新排列。逗号和句号由语块／系统处理，不单独作为学习项。
5. 排成 `Yes,` / `I’m here.` 后，播放完整句，再进入完整句真实录音。

##### 分支 B `Hi. I can hear you.` 的实际交互

1. 先播放完整表达 `Hi. I can hear you.`，同时用自然中文建立“你好，我能听见你”的意思。
2. 分别教学自然语块 `Hi`、`I can hear you`；两个语块都要完成真实录音跟读并识别通过。`I can hear you` 保持完整自然语块，不拆成 `I` / `can` / `hear` / `you`。
3. 使用点击式语块排序。底部候选只包含两个已经学过的语块，初始顺序固定反向为 `I can hear you` / `Hi.`，不放无关干扰项。
4. 点击、上方撤回重排和标点处理规则与分支 A 相同；排成 `Hi.` / `I can hear you.` 后播放完整句，再进入完整句真实录音。

##### 分支 C `Who are you?` 的实际交互

1. 先播放完整表达 `Who are you?`，同时用自然中文建立“你是谁”的意思。
2. 先教学并完成 `Who` 的真实录音跟读，再教学并完成完整表达 `Who are you?` 的真实录音跟读；两项都必须识别通过。
3. 本分支不强行做语块排序。改用听音选情境图确认理解：正确图表达“询问陌生对象的身份”，另一图表达“告诉对方自己在这里”。图中不得出现未选路线英文，也不得把 `Yes, I’m here.` 等未选表达作为文字干扰。
4. 理解确认后进入完整句真实录音。

三条路线的最后一步一致：完整句真实录音 → ASR 转写与确定性匹配 → 用户确认系统听到的内容与自己的意思一致 → 写入对应 `first_response_style` → 播放 Morrow 分支反馈与共同收束。看参考句完成的完整句跟读最高只记 `prompted`，不能因为完成了本次事件就记为 `independent`。

排序错误反馈保持非羞辱：首次错误提示“再听一次，看看哪一句先说”；连续错误时可给自然中文顺序提示，但不提供跳过。

#### 必修、暂停与异常规则

- E01-01 是首次产品真实表达，完整保底教学不能由既有学习证据裁剪，也不能由用户跳过。
- 所有界面均无“跳过”按钮。`稍后继续`是暂停出口，不是教学跳过。
- 点击 `稍后继续`只保存临时意图和最近教学检查点；下次回到同一路线继续，不结算事件、不触发正式反馈、不写 `first_response_style`。
- 麦克风、网络或 ASR 异常时，只能重试或稍后继续；不得以点击、文字确认、选项或系统默认值绕过必修跟读／完整句真实录音。
- 无可靠 ASR 唯一匹配或用户否认转写时，停留当前步骤，清除错误临时理解，允许重录或稍后继续。

#### 世界状态与学习证据分离

- 临时事件数据：所选中文意图、当前教学步骤、录音／ASR／确认进度；未完成事件只保存这些临时数据。
- 正式剧情状态：仅在完整表达完成真实录音、识别和用户确认后写入 `first_response_style = reassuring_presence | friendly_greeting | identity_check`。
- 学习证据：中文意图选择不产生英语证据；只对所选路线中实际完成的词、自然语块、必修跟读、搭建／理解确认和完整句分别记录；未选路线不产生证据。
- 单词／自然语块提示跟读、语块排序搭建、听音选情境图理解确认、看参考句完成的完整句跟读，最高均按各自行为记为 `prompted` 或更低，不得记为 `independent`。
- 只有在无译文、无参考句、无积木／选项提示下，由用户自己组织完整句并被确定性匹配接受，才可形成 `independent` 候选证据；E01-01 的首次保底流程本身不可按既有证据裁剪。 
- 剧情状态与学习证据分开存储；不能用 `first_response_style` 反推用户已掌握该句，也不能因某句尚未达到 `independent / transferring / mastered` 改写章节进度规则。

#### 可选记忆机会

- 记忆规则 ID：`bfv_relationship_memory`
- 类型：`relationship`
- 内容模板：`你和墨洛完成了第一次相互理解。`
- 需用户确认：是；拒绝保存不影响事件或章节推进。
- 禁止把分支选择写成用户性格、风险偏好或其他长期画像。

#### 素材需求与冻结边界

- 内容需求：开场 1 条、分支反馈 3 条、共同收束 1 条、平静暂停与异常系统提示；正式 line ID、textVersion、translationVersion 与世界状态工程绑定由 S06／P4-T06-09 冻结。
- 图片：复用清晰房间底图，光线安静偏暗；不制作模糊版。
- 动画：Morrow 呼吸、睁眼、耳朵或视线转向声音来源、额头微光缓慢变化。
- 正式语音、代码、UI 与语音资产：本轮均不制作、不修改。

### E01-02 陪 Morrow 认识房间第一件物品

#### 已确认设计边界

- 本事件从 E01-01 的“第一次听见并回应”自然进入：Morrow 已确认房间外有一位愿意回应自己的朋友，接着主动观察自己所在的房间。
- 房间底图从一开始就是清晰的；灯、植物、小铃铛都已经在房间里，三者不是等待用户处理的异常物。
- Morrow 自己看见、辨认并说出三件物品的名字；用户不替 Morrow 命名，也不替 Morrow 决定重大事项。
- 用户真正决定的是“自己第一眼留意到哪一件”。这个表达会改变 Morrow 当下靠近、观察或准备倾听的对象，并写入后续可承接的共同世界状态。
- 本事件只承载第一章 D1“建立联系”范围内的 C1 识别：用户把自己的注意点告诉新朋友。它不提前承担第二章 D3 居家用品教学。
- 本事件不是新用户首次产品第一条真实英文表达。现行 E01-01 已确认三条真实表达：`Yes, I’m here.` / `Hi. I can hear you.` / `Who are you?`；用户只学习所选路线，并在完整句真实录音、ASR 与用户确认后结算 `first_response_style`。因此，首次产品完整保底梯属于 E01-01；E01-02 不重置保底，只按词／语块／句子证据裁剪不需要的步骤，但当前保留的必需教学全部必须完成。

- 事件 ID：`b1_first_room_object_v1`
- 旧事件 ID：`birth_restore_object_v1` 已于 2026-10-09 在内容层正式登记为 `retired`，只保留为旧原型与历史映射的只读证据；不删除历史，不得复用旧 ID 承载新语义。本轮不修改 `english-pet` 旧工程配置。
- 版本：1.0.1 ｜ 文本版本：1.0.1 ｜ 人工译文版本：1.0.1
- 章节：`chapter_01_birth` ｜ sequence：2
- 类型：`mainline` ｜ 时长：3—5 分钟
- 关联主题：`topic_room`
- 生活领域：D1 `domain_self_info`（第一章唯一领域）
- 沟通任务：C1 `identifying`——把自己先注意到的房间物品告诉刚认识的朋友。
- 进入条件：E01-01 主线完成，`first_response_style = reassuring_presence | friendly_greeting | identity_check` 已结算。
- 常规完成条件：用户在独立选项层选定一件自己先注意到的物品，完成对应表达所需的全部必修教学、真实录音、ASR 识别与用户确认；Morrow 按分支作出自己的观察与行动，写入 `first_shared_object`。计入第一章主线完成。
- 技术异常条件：若麦克风、网络或识别服务异常，只能重试或选择 `稍后继续`；保存当前物品选择与教学检查点，不结算事件、不写 `first_shared_object`、不触发正式分支结果。
- 恢复条件：暂停后从最近确认的检查点继续；尚未选物品时回到三项选择，已选物品但尚未完成表达时直接回到该分支的必修教学／录音步骤，不重复已经完成且有可靠证据的步骤。

#### 与 E01-01 / E01-03 的因果承接

- E01-01 已用共同收束 `Everything here feels new. Will you look around with me?` 和按钮 `陪墨洛看看房间` 完成直接转场，E01-02 无需再按 `first_response_style` 重复解释上一句。
- `first_response_style` 的三种值只保留为后续关系回声：`reassuring_presence` / `friendly_greeting` / `identity_check`；它们不改变 E01-02 三条物品分支的权利、教学要求与结果强度，也不给用户贴性格标签。
- E01-03 的进入条件为本事件完成并写入 `first_shared_object`。Morrow 因为已经和用户共享了第一处注意点，才自然转向“我们已经一起认出了一样东西，但我该怎样称呼自己”的称呼问题。

#### 场景（中文）

房间安静而清晰。窗边有一盏灯，门边有一株植物，小铃铛放在矮柜上。Morrow 慢慢环视房间，先自己说出三件物品的名字，说完后又有点拿不准，像是在确认自己有没有叫对。它没有请用户修好什么，也没有让用户替自己认识世界；它只是想知道，这位刚回应自己的朋友第一眼注意到了什么。

场景物品全部不可点击。Morrow 用视线和轻微转身自然引导，三个剧情选项在独立底部上浮选项层出现。场景内仍只有 Morrow 可点；点击 Morrow 只播放当前阶段的预设短回应，并遵守冷却与录音期间静音规则。

#### Morrow 主要台词（英文 + 人工中文译文）

1. `I can see three things: a lamp, a plant, and a small bell.`
   - 人工中文译文：我看见三样东西：一盏灯、一株植物，还有一只小铃铛。
   - 台词 ID：`bfo_object_line`
   - 音频需求：`bfo_object_line_audio`（仅登记需求，本任务不制作正式语音）
2. `I think that's what they're called. What did you notice first?`
   - 人工中文译文：我想，它们应该就是这么叫的。你第一眼注意到的是哪一个？
   - 台词 ID：`bfo_prompt_line`
   - 音频需求：`bfo_prompt_line_audio`

#### 用户真实行动与预设输入

1. 用户在底部上浮选项层选择“窗边的灯”“门边的植物”或“矮柜上的小铃铛”。三个选项表达用户自己的注意点，不是替 Morrow 决定喜好、名字或人生方向。
2. 选择后，系统锁定对应物品块，不要求用户再次寻找或点击场景物品。
3. 三项中文图片／剧情选项只决定用户实际想表达的物品和剧情路线，不产生任何英语学习证据。选择后只进入所选物品路线。
4. 系统先播放所选完整句并用自然中文建立整体意思，再按学习证据处理 `I noticed`、所选物品语块和 `first`；当前被保留的新成分必须先建立意思并完成必要真实跟读。
5. 用户完成一次预设候选选词填空和完整句真实录音；不提供开放键盘输入，不调用实时大模型判断。使用中文、参考句、慢速、分块或跟读仍可正常结算剧情，学习证据只按实际行为记录。
6. 用户只有在无译文、无参考句、无积木／选项提示下自己组织完整句，并被确定性匹配接受，句子才可成为 `independent` 候选；中文物品选择、跟读、填空和看参考句输出均不得冒充独立掌握。 

#### 有效分支 A：窗边的灯

- 意图 ID：`bfo_intent_lamp` ｜ 中文名：第一眼注意到窗边的灯
- 预设剧情选项：`窗边的灯`
- 用户目标句：`I noticed the lamp first.`
  - 人工中文译文：我第一眼注意到的是那盏灯。
- 可接受确定性短语：`i noticed the lamp first` / `i noticed the lamp`
- 排除条件：含 `not the lamp`、同时明确说出两个以上候选物，或 ASR 结果未达到唯一匹配条件。
- Morrow 结果台词：`You noticed the lamp first. I think I'll sit near it for a while.`
  - 人工中文译文：你先注意到了那盏灯。我想去它旁边坐一会儿。
  - 台词 ID：`bfo_lamp_result`
  - 音频需求：`bfo_lamp_result_audio`
- Morrow 自主行动：走到能看见灯光的位置坐下；这是 Morrow 自己的行动，不由用户替它决定。
- 世界状态写入：`first_shared_object = lamp`
- futureHook：E01-05 可把“我们先注意过窗边的灯”作为关系回声，但不把灯写成用户处理过的对象；第二章房间探索可再次自然提到灯的位置。

#### 有效分支 B：门边的植物

- 意图 ID：`bfo_intent_plant` ｜ 中文名：第一眼注意到门边的植物
- 预设剧情选项：`门边的植物`
- 用户目标句：`I noticed the plant first.`
  - 人工中文译文：我第一眼注意到的是那株植物。
- 可接受确定性短语：`i noticed the plant first` / `i noticed the plant`
- 排除条件：含 `not the plant`、同时明确说出两个以上候选物，或 ASR 结果未达到唯一匹配条件。
- Morrow 结果台词：`You noticed the plant first. I think I'll take a closer look at its leaves.`
  - 人工中文译文：你先注意到了那株植物。我想凑近看看它的叶子。
  - 台词 ID：`bfo_plant_result`
  - 音频需求：`bfo_plant_result_audio`
- Morrow 自主行动：靠近但不触碰植物，观察叶片；它保留自己的好奇方式。
- 世界状态写入：`first_shared_object = plant`
- futureHook：第二章房间探索与物品命名可承接“门边的植物”，但不从单次选择推断用户喜欢植物。

#### 有效分支 C：矮柜上的小铃铛

- 意图 ID：`bfo_intent_bell` ｜ 中文名：第一眼注意到小铃铛
- 预设剧情选项：`矮柜上的小铃铛`
- 用户目标句：`I noticed the small bell first.`
  - 人工中文译文：我第一眼注意到的是那只小铃铛。
- 可接受确定性短语：`i noticed the small bell first` / `i noticed the small bell` / `i noticed the bell first`
- 排除条件：含 `not the bell`、同时明确说出两个以上候选物，或 ASR 结果未达到唯一匹配条件。
- Morrow 结果台词：`You noticed the small bell first. I wonder what it sounds like.`
  - 人工中文译文：你先注意到了那只小铃铛。我有点好奇，它响起来会是什么声音。
  - 台词 ID：`bfo_bell_result`
  - 音频需求：`bfo_bell_result_audio`
- Morrow 自主行动：看向铃铛并停下来听片刻；本事件不让铃铛发声，也不预设它是否能响。
- 世界状态写入：`first_shared_object = small_bell`
- futureHook：后续声音事件可承接“见过但还没有听过的小铃铛”，不提前结算声音结果。

#### 暂停分支（必备）

- 意图 ID：`bfo_intent_pause` ｜ 中文名：稍后继续
- 中文行动按钮：`稍后继续`
- 可接受短语：`later` / `not now` / `pause` / `stop for now`
- Morrow 台词：`We can stop here. The room will still be here when you come back.`
  - 人工中文译文：我们先停在这里吧。等你回来，房间还在。
  - 台词 ID：`bfo_pause_line`
  - 音频需求：`bfo_pause_line_audio`
- 状态写入：`b1_first_room_object_status = paused_once`
- 结果：不写 `first_shared_object`，不写负向关系状态，不扣减预算，不重复催促；下次从最近检查点继续。

#### 误解 / 兜底

- 无可靠匹配时不推进、不写世界状态、不生成记忆提案。
- 中文兜底：`我还没听清你先注意到的是哪一个。灯、植物，还是小铃铛？你可以从下面选一个，也可以稍后继续。`
- 独立选项层最多显示四项：`窗边的灯`、`门边的植物`、`矮柜上的小铃铛`、`稍后继续`。
- 用户同时提到两件物品时，Morrow 不替用户猜：`I heard two of them. Which one did you notice first?`
  - 人工中文译文：我听见你说了两个。你最先注意到的是哪一个？
- 用户只说 `this one`、`that one` 等无法与预设分支唯一对应的表达时，回到带中文位置说明的三项选择。
- 用户否定某项但没有肯定另一项时，仅排除被否定项，不自动选择剩余项。
- 用户点错后可在结果确认前返回重选；只有最终确认的一项写入 `first_shared_object`。

#### 世界状态与学习证据分离

- 剧情／世界状态：`first_shared_object = lamp | plant | small_bell`。
- 暂停状态：`b1_first_room_object_status = paused_once`；恢复后可被完成态覆盖或保留为历史事件标记，但不得解释为关系降级。
- 临时物品选择与教学进度：未完成表达时只保存为事件内检查点，不进入 `first_shared_object`。
- 学习证据单独写入，不进入 `first_shared_object`：
  - 三项中文图片／剧情选择只决定所选物品和剧情路线，不产生任何英语学习证据；未选的两个物品也不产生证据。
  - 单词／自然语块提示跟读、预设候选选词填空、看参考句完成的完整句跟读，最高记 `prompted`。
  - 只有无译文、无参考句、无积木／选项提示，由用户自己组织并被确定性匹配接受的完整句，才可成为 `independent` 候选。
  - 技术异常不产生完成证据；只保存临时检查点，等待重试或稍后继续。 
- 章节推进只看事件剧情是否按规则结算，不要求该句达到 `independent / transferring / mastered`。

#### 可选记忆机会

- 记忆规则 ID：`bfo_relationship_memory`
- 类型：`relationship`
- 来源意图：`bfo_intent_lamp`、`bfo_intent_plant`、`bfo_intent_bell`
- 内容生成规则：按 `first_shared_object` 的枚举值确定中文物品名后，生成“你和 Morrow 第一次一起留意房间时，先说起了窗边的灯／门边的植物／矮柜上的小铃铛。”三条预设中文文本之一。
- 需用户确认：是；保存前展示可编辑中文文本。
- 用户拒绝保存时，事件和章节照常推进。
- 禁止推断：选择某件物品不等于喜欢它，不形成性格、偏好或敏感信息推断。

#### 教学展开

- 主要核心表达：`I noticed the selected object first.`；实际呈现时只使用三条已列明的分支目标句，不把 `selected object` 作为用户可见占位符。
- 最终输出目标：按所选分支说出 `I noticed the lamp first.` / `I noticed the plant first.` / `I noticed the small bell first.` 之一。
- 角色输入：Morrow 自然使用 `I can see three things: a lamp, a plant, and a small bell.`、`What did you notice first?`；不要求用户在本事件掌握全部角色台词。
- 本次学习对象：`I noticed`、所选物品语块 `the lamp` / `the plant` / `the small bell`、`first`，共 3 个自然成分。不得把所选分支改成 `I noticed` + `the lamp first`、`the plant first` 或 `the small bell first` 两段教学；物品语块与 `first` 必须分开建立意思。
- 旧表达复现：E01-01 的英语不在本事件紧邻重考；`first_response_style` 只作为后续可选关系回声，不改变本事件教学路线。
- 首次产品保底表达：否。E01-02 可依据已有可靠证据由系统不呈现不需要的教学步骤；这是系统裁剪，不是用户跳过。当前仍保留的步骤全部必修，最终完整句真实输出必须完成。
- 已有学习证据：运行时分别读取 `I noticed`、所选物品语块、`first` 与完整句证据；无证据不得默认会。E01-01 完成不能自动证明用户已会其中任一成分。
- 选择物品：用户从三项中文图片／剧情选项中选择自己第一眼注意到的对象。该选择只确定剧情路线，不产生 `recognized` 或其他英语学习证据；未选物品不产生证据。
- 听懂完整句：选择后先播放对应完整句，并显示自然中文意思，让用户明白自己将向 Morrow 表达什么。
- 新成分教学：对没有可靠证据的 `I noticed`、所选物品语块、`first` 分别建立意思并完成必要真实跟读；所选物品的冠词跟随自然语块，不拆成孤立关卡。所有要进入填空的成分，在填空前都必须已经建立意思并完成当前所需跟读。
- 唯一句子搭建：只做一次预设候选选词填空，不做语块排序，也不叠加第二道填空。三条路线分别为：
  - 灯：`I noticed the lamp ___.`，候选 `first` / `here` / `now`；
  - 植物：`I noticed the plant ___.`，候选 `first` / `here` / `now`；
  - 铃铛：`I noticed the small bell ___.`，候选 `first` / `here` / `now`。
- `here`、`now` 是预先编排且有意义的少量干扰项；选词填空允许这类合理干扰项。语块排序则只能使用已学目标语块，不加入无关干扰项，两类操作不得混用。
- 禁止紧邻重复考：刚选择的物品不得再次作为填空答案；它直接写入句框，只挖空 `first`。
- 填空完成后固定进入：播放完整句 → 用户完整句真实录音 → ASR 转写与确定性匹配 → 用户确认 → Morrow 播放对应分支反馈并执行自主行动 → 写入 `first_shared_object`。
- 学习未达 `independent` 不阻塞剧情；使用帮助无惩罚，但看参考句、跟读或填空所得证据最高只记 `prompted`。

#### 素材需求

- 房间底图：复用现有清晰房间底图，不修改像素内容，不制作任何物品的替换前后版本。
- 独立选项层：三项既有物品裁切图或清晰缩略图 + 中文位置标签；不得把它们做成场景热点。
- Morrow 动作：开场环视；三个结果分别为看向灯并坐近光、靠近植物观察叶片、看向铃铛安静倾听。动作只需预设轻量状态，不改变房间物品。
- 预制音频需求：两条主台词、三条分支结果、一条暂停、一条双物品澄清，共 7 条；全部仅登记，正式语音由后续任务制作。E01-01 共同收束已在上游播放，不在本事件重复制作条件承接台词。
- 环境音：沿用房间安静底噪；本事件不新增物品触发音，不让铃铛在本事件发声。
- 正式语音、视觉资产和工程配置：本任务均不制作、不修改。

***

### E01-03 给自己起一个称呼



* 事件 ID：`b1_remember_name_v1`

* 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：3

* 类型：mainline ｜ 时长：2—4 分钟

* 关联主题：`topic_today` / `topic_feelings`

* 进入条件：序 2 主线完成（已结算 `first_shared_object`）。

* 完成条件：结算 `morrow_self_address` 世界状态写入。计入章节完成。

#### 英语学习目标



* 目标句型 / 词汇：`What do you think?`（征求朋友意见）；`I'll keep...`（自己做决定）；称呼相关词。

* 难度档：L1 基础。

#### 场景（中文）

房间稳了一点之后，Morrow 坐下来，说起自己在岛上时名字总是被叫到一半就变淡。它已经在序 1 里说自己叫 Morrow，但这个名字还很新。它想听听这位新朋友的想法，最终自己决定被怎么称呼。

#### Morrow 主要台词（英文 + 人工中文译文）



1. `On the island, people never quite finished my name. It always faded halfway.`

* 译文：在岛上，人们从来没把我的名字叫完。它总在一半的地方变淡。

* 音频：`brn_open_line_audio`（voiceProfileId=morrow\_voice\_v1）

1. `I've been called Morrow, but that name still feels new. What do you think?`

* 译文：我一直被叫 Morrow，但这个名字还很新。你觉得呢？

* 音频：`brn_prompt_line_audio`（voiceProfileId=morrow\_voice\_v1）

#### 有效分支

分支 A：



* 意图 ID：`brn_intent_keep` ｜ 中文名：建议保留 Morrow

* 触发短语（英文）：`morrow sounds right` / `keep morrow` / `i like morrow`

* 关键词组：`allOf: [morrow]`，`anyOf: [right, keep, like, good]`，`noneOf: [not, don't]`，权重 90。

* 用户参考句（可编辑英文）：`Morrow sounds right. Keep it.`


  * 译文：Morrow 听起来挺好的。就用它吧。

* 结果：Morrow 回复 `Morrow it is. It sounds steady enough to remember.`


  * 译文：那就叫 Morrow 吧。听起来稳当，记得住。

  * 音频：`brn_result_keep_audio`

  * 世界状态写入：`morrow_self_address = morrow`

  * futureHook：后续事件中 Morrow 自称与用户称呼均使用 Morrow。

分支 B：



* 意图 ID：`brn_intent_short` ｜ 中文名：建议一个更短的称呼

* 触发短语（英文）：`call you m` / `short name` / `for short`

* 关键词组：`allOf: [short]`，`anyOf: [name, call, m, easy]`，`noneOf: [not]`，权重 90。

* 用户参考句（可编辑英文）：`Can I call you M for short?`


  * 译文：我可以叫你 M 吗？短一点。

* 结果：Morrow 回复 `I can try M. It's a small sound, easy to answer.`


  * 译文：我可以试试 M。它声音小，好回应。

  * 音频：`brn_result_short_audio`

  * 世界状态写入：`morrow_self_address = m_short`

  * futureHook：后续事件中 Morrow 偶尔接受 M 这个简称，但仍以 Morrow 自称。

分支 C：



* 意图 ID：`brn_intent_let_decide` ｜ 中文名：让 Morrow 自己决定

* 触发短语（英文）：`you decide` / `you choose` / `whatever you like`

* 关键词组：`allOf: []`，`anyOf: [decide, choose, whatever, your call]`，`noneOf: []`，权重 90。

* 用户参考句（可编辑英文）：`You should pick. I'll use whatever you choose.`


  * 译文：你来选吧。你选什么我都用。

* 结果：Morrow 回复 `Then I'll keep Morrow. It already knows my voice.`


  * 译文：那我还是叫 Morrow 吧。它已经认识我的声音了。

  * 音频：`brn_result_choose_audio`

  * 世界状态写入：`morrow_self_address = morrow`

  * futureHook：体现 Morrow 有自己的判断，不盲目附和。

暂停出口：



* 意图：`brn_intent_pause`（稍后再来）

* 触发短语（英文）：`not now` / `later` / `stop`

* 结果：Morrow 回复 `We can leave the name for later. It won't fade if we wait one day.`


  * 译文：名字的事我们可以晚点再说。等一天它不会变淡。

  * 音频：`brn_pause_line_audio`

  * 世界状态写入：`b1_remember_name_status = paused_once`

  * 无任何惩罚。

#### 误解 / 兜底



* 无可靠匹配时：停留当前状态，显示中文兜底，最多 3 个候选意图（保留 Morrow / 建议短称呼 / 让 Morrow 自己决定）。

* 典型误解设计：用户输入 "I like the name" 但未明确指哪个名字时，不默认推进，引导用户补充。Morrow 不会因为用户建议短称呼就立刻放弃 Morrow—— 它会先 "试试"，保留最终决定权。

#### 记忆机会



* 记忆规则 ID：`brn_relationship_memory`

* 类型：relationship

* 来源意图：`brn_intent_keep`、`brn_intent_short`、`brn_intent_let_decide`

* 内容模板：`你和 Morrow 一起定下了称呼：{{morrow_self_address}}。`

* 需用户确认：是。

#### 素材需求



* 预制音频（6 条需语音台词 = 6 条音频）：


  * `brn_open_line_audio`

  * `brn_prompt_line_audio`

  * `brn_result_keep_audio`

  * `brn_result_short_audio`

  * `brn_result_choose_audio`

  * `brn_pause_line_audio`

* 图片：1 张（Morrow 半身像，坐姿思考表情，占位说明）。

* 动画：1 个（Morrow 轻轻歪头，占位说明）。

* 音效：0。



***

### E01-04 说出现在的感觉



* 事件 ID：`b1_first_feeling_v1`

* 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：4

* 类型：daily ｜ 时长：3—5 分钟

* 关联主题：`topic_feelings`

* 进入条件：序 3 主线完成；从本章日常轮换池选取（相邻两次不取同一事件，冷却期内不重复）。

* 完成条件：结算 `feeling_first_name` 世界状态写入；不阻塞章节完成。

#### 英语学习目标



* 目标句型 / 词汇：`I feel...` / `It's just...`（描述身体感受）；形容词 new /nervous/soft。

* 难度档：L1 基础。

#### 场景（中文）

房间里的东西清楚了一些，Morrow 停下来，注意到胸口有一点说不上来的感觉。它不知道这是紧张还是只是刚醒过来的新鲜。它问用户，人们一般怎么叫这种感觉。

#### Morrow 主要台词（英文 + 人工中文译文）



1. `Now that the room is a little clearer, I notice something in my chest.`

* 译文：房间清楚了一点之后，我注意到胸口有一点感觉。

* 音频：`bff_open_line_audio`（voiceProfileId=morrow\_voice\_v1）

1. `What do people call this feeling? Is it nervous, or just new?`

* 译文：人们把这种感觉叫什么？是紧张，还是只是新鲜？

* 音频：`bff_prompt_line_audio`（voiceProfileId=morrow\_voice\_v1）

#### 有效分支

分支 A：



* 意图 ID：`bff_intent_new` ｜ 中文名：告诉 Morrow 这只是新鲜

* 触发短语（英文）：`just new` / `it's new` / `just new here`

* 关键词组：`allOf: [new]`，`anyOf: [just, okay, fine, normal]`，`noneOf: [not, don't]`，权重 90。

* 用户参考句（可编辑英文）：`It's probably just new. That's okay.`


  * 译文：可能只是新鲜。没关系的。

* 结果：Morrow 回复 `New. I can live with that. It isn't the same as afraid.`


  * 译文：新鲜。那我能接受。它和害怕不一样。

  * 音频：`bff_result_new_audio`

  * 世界状态写入：`feeling_first_name = new`

  * futureHook：后续情绪事件可承接 "新鲜不等于害怕" 这个区分。

分支 B：



* 意图 ID：`bff_intent_nervous` ｜ 中文名：告诉 Morrow 这有点紧张

* 触发短语（英文）：`a little nervous` / `it's nervous` / `you're nervous`

* 关键词组：`allOf: [nervous]`，`anyOf: [little, a bit, probably, sounds]`，`noneOf: [not]`，权重 90。

* 用户参考句（可编辑英文）：`It sounds like you're a little nervous.`


  * 译文：听起来你有一点点紧张。

* 结果：Morrow 回复 `A little nervous, then. Not much, just enough to notice.`


  * 译文：那有一点点紧张。不多，刚好能注意到。

  * 音频：`bff_result_nervous_audio`

  * 世界状态写入：`feeling_first_name = nervous`

  * futureHook：后续 Morrow 会温和提及 "那天有一点紧张"。

分支 C：



* 意图 ID：`bff_intent_shared` ｜ 中文名：说自己也有过这种感觉

* 触发短语（英文）：`i feel it too` / `me too` / `i feel that too`

* 关键词组：`allOf: [feel]`，`anyOf: [too, me too, also, sometimes]`，`noneOf: [not]`，权重 90。

* 用户参考句（可编辑英文）：`I feel it too, sometimes.`


  * 译文：我有时候也有这种感觉。

* 结果：Morrow 回复 `Then we're feeling it together. That makes it smaller.`


  * 译文：那我们就一起感受它。这样它就小一点了。

  * 音频：`bff_result_shared_audio`

  * 世界状态写入：`feeling_first_name = shared`

  * futureHook：承接用户与 Morrow 共同感受的关系基调。

暂停出口：



* 意图：`bff_intent_pause`（稍后再来）

* 触发短语（英文）：`not now` / `later` / `stop`

* 结果：Morrow 回复 `We can sit with the feeling and not name it yet. That's all right.`


  * 译文：我们可以先感受着，不急着给它名字。没关系。

  * 音频：`bff_pause_line_audio`

  * 世界状态写入：`b1_first_feeling_status = paused_once`

  * 无任何惩罚。

#### 误解 / 兜底



* 无可靠匹配时：停留当前状态，显示中文兜底，最多 3 个候选意图。

* 典型误解设计：用户把 Morrow 的感觉说成 "bad" 或 "scared" 时，Morrow 会温和澄清 "不是害怕，只是新"，不把感觉往负面拉。用户不想回答时 Morrow 不追问。

#### 记忆机会



* 记忆规则 ID：`bff_language_memory`

* 类型：language

* 来源意图：`bff_intent_new`、`bff_intent_nervous`、`bff_intent_shared`

* 内容模板：`用户用来描述感觉的英文表达：{{confirmed_user_sentence}}。`

* 需用户确认：是。

#### 素材需求



* 预制音频（6 条 × 2 = 12 条）：


  * `bff_open_line_audio`

  * `bff_prompt_line_audio`

  * `bff_result_new_audio`

  * `bff_result_nervous_audio`

  * `bff_result_shared_audio`

  * `bff_pause_line_audio`

* 图片：1 张（安静房间的柔和光线，占位说明）。

* 动画：1 个（Morrow 低头看向自己胸口，占位说明）。

* 音效：0。



***

### E01-05 看窗外的光



* 事件 ID：`b1_window_light_v1`

* 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：5

* 类型：mainline ｜ 时长：3—5 分钟

* 关联主题：`topic_outside` / `topic_sounds`

* 进入条件：序 3 主线完成（序 4 为日常，不阻塞主线顺序；主线按 sequence 推进）。

* 完成条件：结算 `window_light_memory` 世界状态写入。计入章节完成。

#### 英语学习目标



* 目标句型 / 词汇：`It's warm outside.` / `The light is...`（描述窗外光线）；形容词 warm /high/bright。

* 难度档：L1 基础。

#### 场景（中文）

房间一侧有一扇窗，Morrow 还走不太过去。光在玻璃上一直移动，它看不清是暖是冷、是早是晚。它请用户描述窗外看到的天色。这是 Morrow 第一次通过用户的眼睛看外面的世界。

#### Morrow 主要台词（英文 + 人工中文译文）



1. `There's a window I can't quite reach yet. A light keeps moving on the glass.`

* 译文：有一扇窗我还走不太过去。光在玻璃上一直动。

* 音频：`bwl_open_line_audio`（voiceProfileId=morrow\_voice\_v1）

1. `Can you tell me what you see outside? Is it warm, or still early?`

* 译文：你能告诉我窗外是什么吗？是暖和的，天还早？

* 音频：`bwl_prompt_line_audio`（voiceProfileId=morrow\_voice\_v1）

#### 有效分支

分支 A：



* 意图 ID：`bwl_intent_warm` ｜ 中文名：告诉 Morrow 光是暖的

* 触发短语（英文）：`the light is warm` / `it's warm outside` / `warm light`

* 关键词组：`allOf: [warm]`，`anyOf: [light, outside, afternoon, late]`，`noneOf: [not, cold]`，权重 90。

* 用户参考句（可编辑英文）：`The light is warm. It looks like late afternoon.`


  * 译文：光是暖的。像是傍晚晚些时候。

* 结果：Morrow 回复 `Warm. I'll remember that the light can be warm.`


  * 译文：暖的。我会记住光可以是暖的。

  * 音频：`bwl_result_warm_audio`

  * 世界状态写入：`window_light_memory = warm_afternoon`

  * futureHook：后续窗外事件承接 "暖光" 记忆。

分支 B：



* 意图 ID：`bwl_intent_high` ｜ 中文名：告诉 Morrow 太阳还高

* 触发短语（英文）：`the sun is high` / `it's still daytime` / `sun is high`

* 关键词组：`allOf: [high]`，`anyOf: [sun, day, bright, still]`，`noneOf: [not, dark]`，权重 90。

* 用户参考句（可编辑英文）：`It's still daytime. The sun is high.`


  * 译文：还是白天。太阳很高。

* 结果：Morrow 回复 `High sun. Then the day isn't over yet.`


  * 译文：太阳高。那这一天还没过完。

  * 音频：`bwl_result_sun_audio`

  * 世界状态写入：`window_light_memory = high_sun`

  * futureHook：承接 "白天还长" 的时间感。

分支 C：



* 意图 ID：`bwl_intent_uncertain` ｜ 中文名：说自己也看不清

* 触发短语（英文）：`i can't tell` / `not sure` / `let me look closer`

* 关键词组：`allOf: []`，`anyOf: [can't tell, not sure, close, look]`，`noneOf: []`，权重 90。

* 用户参考句（可编辑英文）：`I can't tell from here. Let me look closer.`


  * 译文：我从这儿看不清。让我走近点看。

* 结果：Morrow 回复 `Take your time. I'll wait with the light.`


  * 译文：慢慢来。我陪着这束光等你。

  * 音频：`bwl_result_uncertain_audio`

  * 世界状态写入：`window_light_memory = uncertain`

  * futureHook：不强行下结论，下次窗外事件再补全。

暂停出口：



* 意图：`bwl_intent_pause`（稍后再来）

* 触发短语（英文）：`not now` / `later` / `stop`

* 结果：Morrow 回复 `We can leave the window for later. The light will still be there.`


  * 译文：窗的事我们可以晚点再看。光还会在那儿。

  * 音频：`bwl_pause_line_audio`

  * 世界状态写入：`b1_window_light_status = paused_once`

  * 无任何惩罚。

#### 误解 / 兜底



* 无可靠匹配时：停留当前状态，显示中文兜底，最多 3 个候选意图。

* 典型误解设计：用户只说 "it's bright" 未说明冷暖时，Morrow 不强行归为 warm 或 cold，会再问一个小问题（如 "Bright and warm, or bright and cool?"），但一次只问一个。

#### 记忆机会



* 记忆规则 ID：`bwl_relationship_memory`

* 类型：relationship

* 来源意图：`bwl_intent_warm`、`bwl_intent_high`、`bwl_intent_uncertain`

* 内容模板：`你第一次帮 Morrow 描述了窗外的光：{{window_light_memory}}。`

* 需用户确认：是。

#### 素材需求



* 预制音频（6 条 × 2 = 12 条）：


  * `bwl_open_line_audio`

  * `bwl_prompt_line_audio`

  * `bwl_result_warm_audio`

  * `bwl_result_sun_audio`

  * `bwl_result_uncertain_audio`

  * `bwl_pause_line_audio`

* 图片：2 张（窗边视角的暖光与高日两张天色图，占位说明）。

* 动画：1 个（光线在玻璃上缓慢移动，占位说明）。

* 音效：1 个（窗外微风轻响，占位说明）。



***

### E01-06 一封看不懂的信



* 事件 ID：`b1_first_letter_v1`

* 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：6

* 类型：daily ｜ 时长：3—5 分钟

* 关联主题：`topic_letter`

* 进入条件：序 5 主线完成；从日常轮换池选取。

* 完成条件：结算 `first_letter_line` 世界状态写入；不阻塞章节完成。

#### 英语学习目标



* 目标句型 / 词汇：`Can you read this?` / `It says...`（请求读信与转述内容）。

* 难度档：L1 基础。

#### 场景（中文）

一封信从房门底下塞了进来。字迹很软，像是忘了自己长什么样，只有几个字还勉强成形。Morrow 拿起信，说这是房间第一次收到外面来的东西，请用户帮忙看看。

#### Morrow 主要台词（英文 + 人工中文译文）



1. `A letter slipped under the door. The words are soft, like they forgot their shapes.`

* 译文：一封信从门缝里塞了进来。字迹很软，像是忘了自己长什么样。

* 音频：`bfl_open_line_audio`（voiceProfileId=morrow\_voice\_v1）

1. `Can you read it for me? Some words are still there.`

* 译文：你能帮我读读吗？有些字还在。

* 音频：`bfl_prompt_line_audio`（voiceProfileId=morrow\_voice\_v1）

#### 有效分支

分支 A：



* 意图 ID：`bfl_intent_read` ｜ 中文名：读出信的内容

* 触发短语（英文）：`it says` / `the letter says` / `welcome home`

* 关键词组：`allOf: []`，`anyOf: [says, read, welcome, home, letter]`，`noneOf: [can't, cannot]`，权重 90。

* 用户参考句（可编辑英文）：`It says "welcome home, whoever finds this."`


  * 译文：上面写着 "欢迎回家，无论是谁找到它。"

* 结果：Morrow 回复 `Welcome home. So this room was waiting for someone.`


  * 译文：欢迎回家。原来这间房间在等某个人。

  * 音频：`bfl_result_welcome_audio`

  * 世界状态写入：`first_letter_line = welcome_home`

  * futureHook：后续来信与房间归属事件可承接 "欢迎回家"。

分支 B：



* 意图 ID：`bfl_intent_blur` ｜ 中文名：说自己也读不清

* 触发短语（英文）：`i can't read it` / `too blurry` / `i can't see it`

* 关键词组：`allOf: [can't]`，`anyOf: [read, see, blurry, hard]`，`noneOf: []`，权重 90。

* 用户参考句（可编辑英文）：`I can't read it either. It's too blurry.`


  * 译文：我也读不出来。太模糊了。

* 结果：Morrow 回复 `That's all right. We can leave it on the table and come back.`


  * 译文：没关系。我们可以把它放在桌上，下次再看。

  * 音频：`bfl_result_unread_audio`

  * 世界状态写入：`first_letter_line = unread`

  * futureHook：后续信件事件可回访这封未读信。

分支 C：



* 意图 ID：`bfl_intent_slow` ｜ 中文名：提议慢慢一起读

* 触发短语（英文）：`let's read together` / `slowly` / `word by word`

* 关键词组：`allOf: []`，`anyOf: [together, slowly, word, read]`，`noneOf: []`，权重 90。

* 用户参考句（可编辑英文）：`Let me read it slowly, word by word.`


  * 译文：让我一个字一个字慢慢读。

* 结果：Morrow 回复 `Slow is fine. I'll wait for each word.`


  * 译文：慢一点没关系。我等你每个字。

  * 音频：`bfl_result_slow_audio`

  * 世界状态写入：`first_letter_line = reading_together`

  * futureHook：承接 "一起慢慢读" 的协作方式。

暂停出口：



* 意图：`bfl_intent_pause`（稍后再来）

* 触发短语（英文）：`not now` / `later` / `stop`

* 结果：Morrow 回复 `We can leave the letter folded. It won't mind waiting.`


  * 译文：我们可以把信折起来。它不介意等一等。

  * 音频：`bfl_pause_line_audio`

  * 世界状态写入：`b1_first_letter_status = paused_once`

  * 无任何惩罚。

#### 误解 / 兜底



* 无可靠匹配时：停留当前状态，显示中文兜底，最多 3 个候选意图。

* 典型误解设计：用户读出的内容与预设 "welcome home" 不同时，Morrow 不强行纠正，而是先确认 "Did it say that?"，允许用户的版本被记录为这封信的读法（语言记忆）。但世界状态只写已确认的分类标签。

#### 记忆机会



* 记忆规则 ID：`bfl_language_memory`

* 类型：language

* 来源意图：`bfl_intent_read`、`bfl_intent_slow`

* 内容模板：`用户第一次读信时说：{{confirmed_user_sentence}}。`

* 需用户确认：是。

#### 素材需求



* 预制音频（6 条 × 2 = 12 条）：


  * `bfl_open_line_audio`

  * `bfl_prompt_line_audio`

  * `bfl_result_welcome_audio`

  * `bfl_result_unread_audio`

  * `bfl_result_slow_audio`

  * `bfl_pause_line_audio`

* 图片：1 张（门缝下露出一角模糊信纸，占位说明）。

* 动画：1 个（信纸在桌上轻轻微动，占位说明）。

* 音效：0。



***

### E01-07 找回一个声音



* 事件 ID：`b1_bell_sound_v1`

* 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：7

* 类型：daily ｜ 时长：3—5 分钟

* 关联主题：`topic_sounds`

* 进入条件：序 5 主线完成；从日常轮换池选取。

* 完成条件：结算 `returning_sound` 世界状态写入；不阻塞章节完成。

#### 英语学习目标



* 目标句型 / 词汇：`It sounds like...`（辨认声音）；`I hear a...`。

* 难度档：L1 基础。

#### 场景（中文）

房间里回来了一个很低的声音，只响了一下，然后又安静了。Morrow 不确定那是什么 —— 是铃铛，还是房间本身在呼吸。它问用户听到了没有，那个声音像什么。

#### Morrow 主要台词（英文 + 人工中文译文）



1. `A small sound comes back in the room. It's low, and it happens once.`

* 译文：房间里回来了一个小声音。很低，只响了一下。

* 音频：`bbs_open_line_audio`（voiceProfileId=morrow\_voice\_v1）

1. `Do you hear it? What does it remind you of?`

* 译文：你听到了吗？它让你想起什么？

* 音频：`bbs_prompt_line_audio`（voiceProfileId=morrow\_voice\_v1）

#### 有效分支

分支 A：



* 意图 ID：`bbs_intent_bell` ｜ 中文名：说听起来像铃铛

* 触发短语（英文）：`sounds like a bell` / `it's a bell` / `like a bell`

* 关键词组：`allOf: [bell]`，`anyOf: [sound, like, hear, ring]`，`noneOf: [not, don't]`，权重 90。

* 用户参考句（可编辑英文）：`It sounds like a bell.`


  * 译文：听起来像铃铛。

* 结果：Morrow 回复 `A bell. That's a sound I can hold onto.`


  * 译文：铃铛。这个声音我抓得住。

  * 音频：`bbs_result_bell_audio`

  * 世界状态写入：`returning_sound = bell`

  * futureHook：若序 2 恢复的是小铃铛，此处可自然呼应；否则作为新声音记录。

分支 B：



* 意图 ID：`bbs_intent_room` ｜ 中文名：说只是房间的轻响

* 触发短语（英文）：`just the room` / `soft sound` / `it's the room`

* 关键词组：`allOf: []`，`anyOf: [room, soft, quiet, breath]`，`noneOf: [not]`，权重 90。

* 用户参考句（可编辑英文）：`It's soft, not loud. Maybe it's just the room.`


  * 译文：很轻，不大声。也许只是房间的声音。

* 结果：Morrow 回复 `The room itself, then. That makes sense.`


  * 译文：那就是房间本身的声音。说得通。

  * 音频：`bbs_result_room_audio`

  * 世界状态写入：`returning_sound = room_soft`

  * futureHook：后续房间环境音事件承接 "房间会自己发出轻响"。

分支 C：



* 意图 ID：`bbs_intent_faint` ｜ 中文名：说自己没听到

* 触发短语（英文）：`i don't hear it` / `i can't hear` / `nothing`

* 关键词组：`allOf: [hear]`，`anyOf: [don't, can't, nothing, didn't]`，`noneOf: []`，权重 90。

* 用户参考句（可编辑英文）：`I don't hear it.`


  * 译文：我没听到。

* 结果：Morrow 回复 `Maybe it's still waking up. It will come back.`


  * 译文：也许它还在醒。它会回来的。

  * 音频：`bbs_result_faint_audio`

  * 世界状态写入：`returning_sound = faint`

  * futureHook：不追问，声音下次自然再出现。

暂停出口：



* 意图：`bbs_intent_pause`（稍后再来）

* 触发短语（英文）：`not now` / `later` / `stop`

* 结果：Morrow 回复 `We can wait for the next small sound. It has time.`


  * 译文：我们可以等下一个小声音。它有的是时间。

  * 音频：`bbs_pause_line_audio`

  * 世界状态写入：`b1_bell_sound_status = paused_once`

  * 无任何惩罚。

#### 误解 / 兜底



* 无可靠匹配时：停留当前状态，显示中文兜底，最多 3 个候选意图。

* 典型误解设计：用户说 "I hear a bell" 但序 2 恢复的不是铃铛时，Morrow 不纠正事实，只说 "A bell, or something close to one."，保持好奇不武断。

#### 记忆机会



* 记忆规则 ID：`bbs_language_memory`

* 类型：language

* 来源意图：`bbs_intent_bell`、`bbs_intent_room`

* 内容模板：`用户辨认声音时说：{{confirmed_user_sentence}}。`

* 需用户确认：是。

#### 素材需求



* 预制音频（6 条 × 2 = 12 条）：


  * `bbs_open_line_audio`

  * `bbs_prompt_line_audio`

  * `bbs_result_bell_audio`

  * `bbs_result_room_audio`

  * `bbs_result_faint_audio`

  * `bbs_pause_line_audio`

* 图片：0（复用已有房间背景，无新图）。

* 动画：1 个（声波纹一闪即逝，占位说明）。

* 音效：1 个（一声低而短的铃声占位，与正文台词同时触发）。



***

### E01-08 Morrow 反过来问你



* 事件 ID：`b1_ask_about_you_v1`

* 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：8

* 类型：daily ｜ 时长：3—5 分钟

* 关联主题：`topic_today`

* 进入条件：序 5 主线完成；从日常轮换池选取。

* 完成条件：结算 `user_day_shared` 世界状态写入；不阻塞章节完成。

#### 英语学习目标



* 目标句型 / 词汇：`What happened today?` / `Tell me about your day.`（反问与分享）；`I had a... day.`

* 难度档：L1 基础，少量 L2。

#### 场景（中文）

用户一直在帮 Morrow 弄清房间、光和信。Morrow 把身子转向用户，说想听一点用户那边的事。它一次只问一个小问题，不追问隐私，用户不想说也可以。

#### Morrow 主要台词（英文 + 人工中文译文）



1. `You talk about my room so much. I want to hear about yours now.`

* 译文：你一直在说我的房间。现在我想听听你的。

* 音频：`bay_open_line_audio`（voiceProfileId=morrow\_voice\_v1）

1. `What's one small thing that happened to you today?`

* 译文：今天你身上发生了哪件小事？

* 音频：`bay_prompt_line_audio`（voiceProfileId=morrow\_voice\_v1）

#### 有效分支

分支 A：



* 意图 ID：`bay_intent_longday` ｜ 中文名：说今天工作了很久

* 触发短语（英文）：`long day` / `i worked a lot` / `tiring day`

* 关键词组：`allOf: [day]`，`anyOf: [long, work, tired, hard]`，`noneOf: [not]`，权重 90。

* 用户参考句（可编辑英文）：`I had a long day at work.`


  * 译文：我今天工作了很久。

* 结果：Morrow 回复 `A long day. I'm glad you're here now, even if it's just this room.`


  * 译文：漫长的一天。我很高兴你现在在这里，哪怕只是这间房间。

  * 音频：`bay_result_longday_audio`

  * 世界状态写入：`user_day_shared = long_day`

  * futureHook：后续 Morrow 会自然承接 "你那天工作很久" 的记忆（需用户确认后）。

分支 B：



* 意图 ID：`bay_intent_ordinary` ｜ 中文名：说就是普通的一天

* 触发短语（英文）：`ordinary day` / `nothing special` / `just a normal day`

* 关键词组：`allOf: []`，`anyOf: [ordinary, normal, nothing, special, usual]`，`noneOf: []`，权重 90。

* 用户参考句（可编辑英文）：`It was just an ordinary day. Nothing special.`


  * 译文：就是普通的一天。没什么特别。

* 结果：Morrow 回复 `Ordinary days matter too. Tell me one ordinary thing.`


  * 译文：普通的日子也重要。跟我说一件普通的事。

  * 音频：`bay_result_ordinary_audio`

  * 世界状态写入：`user_day_shared = ordinary`

  * futureHook：承接 "普通日子也值得说" 的语气。

分支 C：



* 意图 ID：`bay_intent_declined` ｜ 中文名：表示不想聊今天

* 触发短语（英文）：`don't want to talk` / `not now` / `i'd rather not`

* 关键词组：`allOf: []`，`anyOf: [don't, rather, not now, talk]`，`noneOf: []`，权重 90。

* 用户参考句（可编辑英文）：`I don't really want to talk about it.`


  * 译文：我不太想聊这个。

* 结果：Morrow 回复 `That's fine. We can sit here instead.`


  * 译文：没关系。我们可以就这样坐着。

  * 音频：`bay_result_declined_audio`

  * 世界状态写入：`user_day_shared = declined`

  * futureHook：Morrow 不追问，不记录任何推断。

暂停出口：



* 意图：`bay_intent_pause`（稍后再来）

* 触发短语（英文）：`not now` / `later` / `stop`

* 结果：Morrow 回复 `We can talk about your day another time. It won't go away.`


  * 译文：你的日子我们可以改天再聊。它不会跑掉。

  * 音频：`bay_pause_line_audio`

  * 世界状态写入：`b1_ask_about_you_status = paused_once`

  * 无任何惩罚。

#### 误解 / 兜底



* 无可靠匹配时：停留当前状态，显示中文兜底，最多 3 个候选意图。

* 典型误解设计：用户只说 "Okay" 或 "Fine" 未提供任何内容时，Morrow 不追问细节，把它当作普通一天的沉默回应，不强行挖掘。用户拒绝后 Morrow 不换话题继续逼问。

#### 记忆机会



* 记忆规则 ID：`bay_relationship_memory`

* 类型：relationship

* 来源意图：`bay_intent_longday`、`bay_intent_ordinary`

* 内容模板：`你第一次跟 Morrow 说起自己的一天：{{user_day_shared}}。`

* 需用户确认：是。拒绝分支（declined）不产生记忆提案。

#### 素材需求



* 预制音频（6 条 × 2 = 12 条）：


  * `bay_open_line_audio`

  * `bay_prompt_line_audio`

  * `bay_result_longday_audio`

  * `bay_result_ordinary_audio`

  * `bay_result_declined_audio`

  * `bay_pause_line_audio`

* 图片：1 张（Morrow 侧身面向用户、倾听姿态，占位说明）。

* 动画：1 个（Morrow 微微前倾，占位说明）。

* 音效：0。



***

### E01-09 我喜欢和还不确定的事



* 事件 ID：`b1_what_i_like_v1`

* 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：9

* 类型：mainline ｜ 时长：3—5 分钟

* 关联主题：`topic_likes`

* 进入条件：序 5 主线完成（序 6、7、8 为日常，不阻塞主线顺序）。

* 完成条件：结算 `likes_shared` 世界状态写入。计入章节完成。

#### 英语学习目标



* 目标句型 / 词汇：`I like...` / `I'm not sure about... yet.`（表达喜好与不确定）。

* 难度档：L1 基础。

#### 场景（中文）

在房间里待了一天之后，Morrow 开始注意到自己被什么吸引、又对什么还拿不准。它先说自己觉得喜欢安静，然后问用户喜欢什么。这是双方第一次交换 "我喜欢什么"。

#### Morrow 主要台词（英文 + 人工中文译文）



1. `After a day in this room, I notice what I'm drawn to and what I'm not sure about.`

* 译文：在房间里待了一天后，我注意到自己被什么吸引，又对什么还不确定。

* 音频：`bik_open_line_audio`（voiceProfileId=morrow\_voice\_v1）

1. `I think I like the quiet. What about you?`

* 译文：我觉得我喜欢安静。你呢？

* 音频：`bik_prompt_line_audio`（voiceProfileId=morrow\_voice\_v1）

#### 有效分支

分支 A：



* 意图 ID：`bik_intent_quiet` ｜ 中文名：说自己也喜欢安静

* 触发短语（英文）：`i like quiet too` / `me too` / `i like quiet`

* 关键词组：`allOf: [quiet]`，`anyOf: [like, too, me too, good]`，`noneOf: [don't, not]`，权重 90。

* 用户参考句（可编辑英文）：`I like quiet too. It helps me think.`


  * 译文：我也喜欢安静。它帮我思考。

* 结果：Morrow 回复 `Two people who like quiet. We won't need much noise.`


  * 译文：两个喜欢安静的人。我们不需要太多声响。

  * 音频：`bik_result_quiet_audio`

  * 世界状态写入：`likes_shared = quiet_mutual`

  * futureHook：后续安静共处场景承接双方共同喜好。

分支 B：



* 意图 ID：`bik_intent_outside` ｜ 中文名：说自己其实喜欢外面

* 触发短语（英文）：`i like outside` / `i like being outside` / `outside is better`

* 关键词组：`allOf: [outside]`，`anyOf: [like, being, better, fresh]`，`noneOf: [don't, not]`，权重 90。

* 用户参考句（可编辑英文）：`I like being outside, actually.`


  * 译文：其实我喜欢待在外面。

* 结果：Morrow 回复 `Outside. Then we'll have to look through that window more.`


  * 译文：外面。那我们得多看看那扇窗。

  * 音频：`bik_result_outside_audio`

  * 世界状态写入：`likes_shared = user_likes_outside`

  * futureHook：承接用户对 "外面" 的偏好，推动后续看窗与出门事件。

分支 C：



* 意图 ID：`bik_intent_unsure` ｜ 中文名：说自己也还在摸索

* 触发短语（英文）：`i'm not sure` / `still figuring out` / `i don't know yet`

* 关键词组：`allOf: [sure]`，`anyOf: [not, still, figuring, yet]`，`noneOf: []`，权重 90。

* 用户参考句（可编辑英文）：`I'm still figuring out what I like.`


  * 译文：我还在想清楚自己喜欢什么。

* 结果：Morrow 回复 `So am I. We can figure it out together, slowly.`


  * 译文：我也是。我们可以一起慢慢想。

  * 音频：`bik_result_unsure_audio`

  * 世界状态写入：`likes_shared = unsure_mutual`

  * futureHook：承接 "不确定也没关系" 的共同状态。

暂停出口：



* 意图：`bik_intent_pause`（稍后再来）

* 触发短语（英文）：`not now` / `later` / `stop`

* 结果：Morrow 回复 `We can leave likes and not-likes for another day. Nothing has to be decided today.`


  * 译文：喜欢和不喜欢的事我们可以改天再说。今天什么都不用定。

  * 音频：`bik_pause_line_audio`

  * 世界状态写入：`b1_what_i_like_status = paused_once`

  * 无任何惩罚。

#### 误解 / 兜底



* 无可靠匹配时：停留当前状态，显示中文兜底，最多 3 个候选意图。

* 典型误解设计：用户说 "I like music" 但未说明喜不喜欢安静时，Morrow 不把它默认成 "也喜欢安静"，而是说 "Music and quiet can go together, I think."，保持开放。

#### 记忆机会



* 记忆规则 ID：`bik_language_memory`

* 类型：language

* 来源意图：`bik_intent_quiet`、`bik_intent_outside`、`bik_intent_unsure`

* 内容模板：`用户第一次说自己喜欢/不确定的事：{{confirmed_user_sentence}}。`

* 需用户确认：是。禁止从单一选择自动推断深层偏好。

#### 素材需求



* 预制音频（6 条 × 2 = 12 条）：


  * `bik_open_line_audio`

  * `bik_prompt_line_audio`

  * `bik_result_quiet_audio`

  * `bik_result_outside_audio`

  * `bik_result_unsure_audio`

  * `bik_pause_line_audio`

* 图片：1 张（房间安静角落、微光，占位说明）。

* 动画：1 个（Morrow 环顾房间，占位说明）。

* 音效：0。



***

### E01-10 一起定一个明天的小计划



* 事件 ID：`b1_tomorrow_plan_v1`

* 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：10

* 类型：mainline ｜ 时长：2—4 分钟

* 关联主题：`topic_tomorrow`

* 进入条件：序 9 主线完成。

* 完成条件：结算 `tomorrow_plan` 世界状态写入。计入章节完成。

#### 英语学习目标



* 目标句型 / 词汇：`Let's... tomorrow.` / `What shall we do tomorrow?`（约定明天的小事）。

* 难度档：L1 基础。

#### 场景（中文）

第一天快要结束了，房间里的光开始变柔。Morrow 说不想让明天的房间是空的，它想和用户定一件很小的事明天一起做。它不替用户决定，只是提议选项，最终计划由双方认可。

#### Morrow 主要台词（英文 + 人工中文译文）



1. `The first day is ending. I don't want to leave the room empty tomorrow.`

* 译文：第一天要结束了。我不想让明天的房间是空的。

* 音频：`btp_open_line_audio`（voiceProfileId=morrow\_voice\_v1）

1. `What's one small thing we could try tomorrow?`

* 译文：明天我们可以试着做哪一件小事？

* 音频：`btp_prompt_line_audio`（voiceProfileId=morrow\_voice\_v1）

#### 有效分支

分支 A：



* 意图 ID：`btp_intent_road` ｜ 中文名：明天去看窗外的路

* 触发短语（英文）：`let's look outside` / `see the road` / `look at the window`

* 关键词组：`allOf: [outside]`，`anyOf: [look, road, window, tomorrow]`，`noneOf: [don't]`，权重 90。

* 用户参考句（可编辑英文）：`Let's look outside and see the road.`


  * 译文：我们去外面看看那条路。

* 结果：Morrow 回复 `The road. I'll stand by the window first, just to look.`


  * 译文：那条路。我会先站在窗边，只是看看。

  * 音频：`btp_result_road_audio`

  * 世界状态写入：`tomorrow_plan = look_road`

  * futureHook：第二章序 1（房间走一遍）与序 4（窗外那条路）可承接此计划。

分支 B：



* 意图 ID：`btp_intent_letter` ｜ 中文名：明天再读那封信

* 触发短语（英文）：`read the letter again` / `the letter tomorrow` / `read it again`

* 关键词组：`allOf: [letter]`，`anyOf: [read, again, tomorrow, together]`，`noneOf: [don't]`，权重 90。

* 用户参考句（可编辑英文）：`Let's read the letter again, together.`


  * 译文：我们再一起读那封信吧。

* 结果：Morrow 回复 `The letter. Maybe one more word will be clear tomorrow.`


  * 译文：那封信。也许明天又会多看清一个字。

  * 音频：`btp_result_letter_audio`

  * 世界状态写入：`tomorrow_plan = read_letter`

  * futureHook：承接序 6 未读完的信。

分支 C：



* 意图 ID：`btp_intent_rest` ｜ 中文名：明天先休息

* 触发短语（英文）：`let's rest` / `just rest` / `we'll see tomorrow`

* 关键词组：`allOf: []`，`anyOf: [rest, sleep, relax, see, tomorrow]`，`noneOf: [don't]`，权重 90。

* 用户参考句（可编辑英文）：`Let's just rest. We'll see when we wake up.`


  * 译文：我们先休息吧。醒了再说。

* 结果：Morrow 回复 `Rest. That's a plan too. I won't wake you early.`


  * 译文：休息。这也是个计划。我不会太早叫你。

  * 音频：`btp_result_rest_audio`

  * 世界状态写入：`tomorrow_plan = rest`

  * futureHook：不设强制计划，第二章自然展开。

暂停出口：



* 意图：`btp_intent_pause`（稍后再来）

* 触发短语（英文）：`not now` / `later` / `stop`

* 结果：Morrow 回复 `We can decide tomorrow morning. Plans can wait until then.`


  * 译文：我们可以明天早上再定。计划可以等到那时候。

  * 音频：`btp_pause_line_audio`

  * 世界状态写入：`b1_tomorrow_plan_status = paused_once`

  * 无任何惩罚。

#### 误解 / 兜底



* 无可靠匹配时：停留当前状态，显示中文兜底，最多 3 个候选意图。

* 典型误解设计：用户提出的计划不在三个选项内（如 "Let's cook"）时，Morrow 不硬塞进预设，而是说 "I don't have that in the room yet. Maybe soon."，保持确定性，不开放生成。

#### 记忆机会



* 记忆规则 ID：`btp_relationship_memory`

* 类型：relationship

* 来源意图：`btp_intent_road`、`btp_intent_letter`、`btp_intent_rest`

* 内容模板：`你和 Morrow 约好明天一起：{{tomorrow_plan}}。`

* 需用户确认：是。

#### 素材需求



* 预制音频（6 条 × 2 = 12 条）：


  * `btp_open_line_audio`

  * `btp_prompt_line_audio`

  * `btp_result_road_audio`

  * `btp_result_letter_audio`

  * `btp_result_rest_audio`

  * `btp_pause_line_audio`

* 图片：1 张（暮色中的房间，灯光变柔，占位说明）。

* 动画：1 个（房间灯光缓慢变暗一档，占位说明）。

* 音效：1 个（夜晚轻柔环境音，占位说明）。



***

### E01-11 记住你说过的第一句



* 事件 ID：`b1_return_first_words_v1`

* 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：11

* 类型：recall ｜ 时长：2—4 分钟

* 关联主题：`topic_today`（记忆回访）

* 进入条件：存在一条以上用户已确认且未暂停的语言或关系记忆（通常来自序 2 的 `bro_language_memory` 或序 8 的 `bay_relationship_memory`）；且当前场景语义匹配 "回忆第一句话"。无可用记忆时不触发。

* 完成条件：结算 `first_words_reaffirmed` 世界状态写入；不阻塞章节完成（回访事件）。

#### 英语学习目标



* 目标句型 / 词汇：`Did you mean it?` / `Yes, that's what I meant.`（确认与复述一句旧话）。

* 难度档：L1 基础。

#### 场景（中文）

Morrow 安静了一会儿，说自己一直在想用户在这间房间里说的第一句话。它把那句话轻声复述出来（内容来自一条已确认记忆，不是猜测），问用户当时是不是那个意思。这是 Morrow 第一次自然地把过去的话带回来。

#### Morrow 主要台词（英文 + 人工中文译文）



1. `I keep thinking about the first thing you said to me in this room.`

* 译文：我一直在想你在这间房间里对我说的第一句话。

* 音频：`brw_open_line_audio`（voiceProfileId=morrow\_voice\_v1）

1. `It was "{{confirmed_user_sentence}}". Did you mean it the way I heard it?`

* 译文：那句话是 "{{confirmed\_user\_sentence}}"。我理解得对吗？

* 音频：`brw_prompt_line_audio`（voiceProfileId=morrow\_voice\_v1；`{{confirmed_user_sentence}}` 替换为已确认记忆中的用户英文原句，仅展示，不重新生成音频）

#### 有效分支

分支 A：



* 意图 ID：`brw_intent_yes` ｜ 中文名：确认当时就是那个意思

* 触发短语（英文）：`yes that's what i meant` / `that's right` / `yes i did`

* 关键词组：`allOf: [yes]`，`anyOf: [meant, right, did, exactly]`，`noneOf: [no, not, actually]`，权重 90。

* 用户参考句（可编辑英文）：`Yes, that's what I meant.`


  * 译文：对，我就是那个意思。

* 结果：Morrow 回复 `Good. I'll keep it the way you said it.`


  * 译文：好。我就按你说的记着。

  * 音频：`brw_result_yes_audio`

  * 世界状态写入：`first_words_reaffirmed = yes`

  * futureHook：该记忆保持当前版本，后续回访继续引用。

分支 B：



* 意图 ID：`brw_intent_update` ｜ 中文名：说现在会说得不一样

* 触发短语（英文）：`i'd say it differently` / `i'd say it now` / `not quite`

* 关键词组：`allOf: []`，`anyOf: [differently, now, not quite, better]`，`noneOf: [yes]`，权重 90。

* 用户参考句（可编辑英文）：`I'd say it a little differently now.`


  * 译文：我现在会说得不太一样。

* 结果：Morrow 回复 `Tell me the newer version. I'd rather have the current one.`


  * 译文：告诉我新的说法。我更想用现在的。

  * 音频：`brw_result_update_audio`

  * 世界状态写入：`first_words_reaffirmed = updated`

  * futureHook：触发该记忆的更新提案（需用户确认后才替换原文）。

分支 C：



* 意图 ID：`brw_intent_longago` ｜ 中文名：说听起来像很久以前

* 触发短语（英文）：`that was long ago` / `feels long ago` / `sounds like long ago`

* 关键词组：`allOf: [long]`，`anyOf: [ago, feels, sounds, time]`，`noneOf: []`，权重 90。

* 用户参考句（可编辑英文）：`That sounds like a long time ago.`


  * 译文：听起来好像很久以前了。

* 结果：Morrow 回复 `It wasn't long, but it was the first. That's why it stays.`


  * 译文：时间不长，但那是第一次。所以才留下来。

  * 音频：`brw_result_longago_audio`

  * 世界状态写入：`first_words_reaffirmed = acknowledged`

  * futureHook：不修改记忆，温和收束。

暂停出口：



* 意图：`brw_intent_pause`（稍后再来）

* 触发短语（英文）：`not now` / `later` / `stop`

* 结果：Morrow 回复 `We can leave the first words where they are. I won't move them.`


  * 译文：我们可以把第一句话留在原地。我不会去动它。

  * 音频：`brw_pause_line_audio`

  * 世界状态写入：`b1_return_first_words_status = paused_once`

  * 无任何惩罚；该记忆保持原状。

#### 误解 / 兜底



* 无可靠匹配时：停留当前状态，显示中文兜底，最多 3 个候选意图。

* 典型误解设计：若当前无可用已确认记忆，本事件不出现，而非让 Morrow 凭空编造一句话。Morrow 每次最多只引用一条个人记忆，不罗列记忆清单。用户纠正后立即采用新说法。

#### 记忆机会



* 记忆规则 ID：`brw_language_memory_update`

* 类型：language

* 来源意图：`brw_intent_update`

* 内容模板：`用户现在对{{confirmed_user_sentence}}的新说法是：{{new_user_sentence}}。`

* 需用户确认：是（确认后才替换旧记忆；旧版本保留历史，不静默覆盖）。

#### 素材需求



* 预制音频（6 条 × 2 = 12 条）：


  * `brw_open_line_audio`

  * `brw_prompt_line_audio`（句中嵌入已确认用户原句，不重新生成整句音频）

  * `brw_result_yes_audio`

  * `brw_result_update_audio`

  * `brw_result_longago_audio`

  * `brw_pause_line_audio`

* 图片：1 张（记忆光点漂浮在房间中，占位说明）。

* 动画：1 个（一颗光点缓缓靠近 Morrow，占位说明）。

* 音效：0。



***

### E01-12 准备好走出门



* 事件 ID：`b1_ready_for_outside_v1`

* 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：12

* 类型：mainline（章末）｜ 时长：3—5 分钟

* 关联主题：`topic_outside` / `topic_tomorrow`

* 进入条件：序 10 主线完成（序 11 为回访，不阻塞）。

* 完成条件：结算 `ready_for_outside` 世界状态写入。本章全部主线完成；若已有至少 1 条经用户确认的关系记忆，第一章完成，进入第二章童年探索。

#### 英语学习目标



* 目标句型 / 词汇：`I'm ready to...` / `Let's go.` / `Not yet.`（表达准备好与暂缓）。

* 难度档：L1 基础，少量 L2。

#### 场景（中文）

房间现在稳了。通往外面小路的门不再像刚醒来时那么响亮。Morrow 站在门前，说自己觉得可以朝它走一步了。它问用户准备好了没有，但走不走、走多快，是双方一起决定的 —— 用户给朋友的态度，Morrow 自己迈出那一步。

#### Morrow 主要台词（英文 + 人工中文译文）



1. `The room is steady now. The door to the outside path doesn't feel as loud as before.`

* 译文：房间现在稳了。通往外面小路的门，声音不像以前那么大了。

* 音频：`bgo_open_line_audio`（voiceProfileId=morrow\_voice\_v1）

1. `I think I'm ready to step toward it. Are you?`

* 译文：我觉得我准备好朝它走一步了。你呢？

* 音频：`bgo_prompt_line_audio`（voiceProfileId=morrow\_voice\_v1）

#### 有效分支

分支 A：



* 意图 ID：`bgo_intent_go` ｜ 中文名：一起走出去

* 触发短语（英文）：`i'm ready too` / `let's go` / `let's go outside`

* 关键词组：`allOf: []`，`anyOf: [ready, go, outside, together]`，`noneOf: [not, wait, later]`，权重 90。

* 用户参考句（可编辑英文）：`I'm ready too. Let's go.`


  * 译文：我也准备好了。走吧。

* 结果：Morrow 回复 `Then we go together. One step at a time.`


  * 译文：那我们一起走。一步一步来。

  * 音频：`bgo_result_go_audio`

  * 世界状态写入：`ready_for_outside = yes`

  * futureHook：第二章序 1 直接承接 "走出房门、开始走一遍房间与小路"。

分支 B：



* 意图 ID：`bgo_intent_later` ｜ 中文名：再待一天

* 触发短语（英文）：`not yet` / `stay one more day` / `let's stay`

* 关键词组：`allOf: []`，`anyOf: [not yet, stay, more, wait, another]`，`noneOf: [go, leave]`，权重 90。

* 用户参考句（可编辑英文）：`Not yet. Let's stay one more day.`


  * 译文：还没。再待一天吧。

* 结果：Morrow 回复 `One more day. The room can wait. So can I.`


  * 译文：再一天。房间可以等。我也可以。

  * 音频：`bgo_result_later_audio`

  * 世界状态写入：`ready_for_outside = later`

  * futureHook：事件仍完成，房间保持稳定；下次进入时 Morrow 自然再提一次，不催促、不责备。

分支 C：



* 意图 ID：`bgo_intent_curious` ｜ 中文名：问外面会看到什么

* 触发短语（英文）：`what will we see` / `what's out there` / `what do you see outside`

* 关键词组：`allOf: []`，`anyOf: [see, what, out there, outside]`，`noneOf: [not, no]`，权重 90。

* 用户参考句（可编辑英文）：`What will we see out there?`


  * 译文：外面会看到什么？

* 结果：Morrow 回复 `I don't know. That's part of why I want to look.`


  * 译文：我不知道。这也是我想看看的原因之一。

  * 音频：`bgo_result_curious_audio`

  * 世界状态写入：`ready_for_outside = curious`

  * futureHook：带着好奇心进入第二章，不预设答案。

暂停出口：



* 意图：`bgo_intent_pause`（稍后再来）

* 触发短语（英文）：`not now` / `later` / `stop`

* 结果：Morrow 回复 `We can stand here a little longer. The door isn't going anywhere.`


  * 译文：我们可以在这儿多站一会儿。门不会跑掉。

  * 音频：`bgo_pause_line_audio`

  * 世界状态写入：`b1_ready_for_outside_status = paused_once`

  * 无任何惩罚；下次从门前继续。

#### 误解 / 兜底



* 无可靠匹配时：停留当前状态，显示中文兜底，最多 3 个候选意图。

* 典型误解设计：用户说 "Go" 但未明确是否一起时，Morrow 不擅自认为用户已同行，而是说 "If you're ready, we go together. If not, we stay."，把选择权交回。用户离开再回来时，Morrow 不抱怨缺席，直接从门前继续。

#### 记忆机会



* 记忆规则 ID：`bgo_relationship_memory`

* 类型：relationship

* 来源意图：`bgo_intent_go`、`bgo_intent_later`、`bgo_intent_curious`

* 内容模板：`第一章结束时，你和 Morrow 站在门前，准备程度是：{{ready_for_outside}}。`

* 需用户确认：是。这条记忆作为第一章与第二章之间的关系里程碑。

#### 素材需求



* 预制音频（6 条 × 2 = 12 条）：


  * `bgo_open_line_audio`

  * `bgo_prompt_line_audio`

  * `bgo_result_go_audio`

  * `bgo_result_later_audio`

  * `bgo_result_curious_audio`

  * `bgo_pause_line_audio`

* 图片：2 张（房门微开、门缝外露出一条小路；门前远景，占位说明）。

* 动画：1 个（门缝光线缓缓流入房间，占位说明）。

* 音效：1 个（远处一声很轻的脚步声占位，不急促，占位说明）。



***

### E01-13 一件还拿不准的小事



* 事件 ID：`b1_not_sure_v1`

* 版本：1.0.0 ｜ 章节：`chapter_01_birth` ｜ sequence：13

* 类型：daily（新增日常池事件）｜ 时长：2—4 分钟

* 关联主题：`topic_unsure`

* 进入条件：序 5 主线完成；从本章日常轮换池选取（与序 4、6、7、8 同池轮换，相邻两次不取同一事件）。

* 完成条件：结算 `small_uncertainty` 世界状态写入；不阻塞章节完成。

#### 英语学习目标



* 目标句型 / 词汇：`I'm not sure about...` / `It's okay not to know yet.`（表达不确定与接纳）。

* 难度档：L1 基础。

#### 场景（中文）

房间稳下来之后，Morrow 注意到自己有一件小事还拿不准。它不着急解决，也不假装知道，只是把这种 "还不确定" 的感觉说出来，问用户是不是也会有。这是出生期一个轻松的小日常。

#### Morrow 主要台词（英文 + 人工中文译文）



1. `There is one small thing I'm not sure about yet.`

* 译文：有一件小事我还拿不准。

* 音频：`bnu_open_line_audio`（voiceProfileId=morrow\_voice\_v1）

1. `Is it okay not to know yet, or should I figure it out now?`

* 译文：还不知道也没关系吗，还是现在就得弄清楚？

* 音频：`bnu_prompt_line_audio`（voiceProfileId=morrow\_voice\_v1）

#### 有效分支

分支 A：



* 意图 ID：`bnu_intent_fine` ｜ 中文名：说不知道也没关系

* 触发短语（英文）：`it's okay not to know` / `it's fine` / `you don't have to know`

* 关键词组：`allOf: []`，`anyOf: [okay, fine, don't have to, not know]`，`noneOf: [must, now]`，权重 90。

* 用户参考句（可编辑英文）：`It's okay not to know yet.`


  * 译文：还不知道也没关系。

* 结果：Morrow 回复 `Good. We can leave it there and come back.`


  * 译文：好。我们可以先放着，下次再看。

  * 音频：`bnu_fine_result_audio`

  * 世界状态写入：`small_uncertainty = left_open`

  * futureHook：承接 "不确定也没关系" 的关系基调。

分支 B：



* 意图 ID：`bnu_intent_think` ｜ 中文名：说现在可以一起想想

* 触发短语（英文）：`let's think about it` / `we can figure it out` / `think together`

* 关键词组：`allOf: [think 或 figure]`，`anyOf: [together, it, out, now]`，`noneOf: []`，权重 90。

* 用户参考句（可编辑英文）：`We can think about it together.`


  * 译文：我们可以一起想想。

* 结果：Morrow 回复 `Then we think slowly. Not having the answer now is fine.`


  * 译文：那我们慢慢想。现在没有答案也没关系。

  * 音频：`bnu_think_result_audio`

  * 世界状态写入：`small_uncertainty = thinking_together`

  * futureHook：后续事件承接 "一起慢慢想" 的协作方式。

分支 C：



* 意图 ID：`bnu_intent_later` ｜ 中文名：说先放一放

* 触发短语（英文）：`let's leave it for later` / `leave it for later` / `not now`

* 关键词组：`allOf: [later]`，`anyOf: [leave, it, for, now]`，`noneOf: [now solve]`，权重 90。

* 用户参考句（可编辑英文）：`Let's leave it for later.`


  * 译文：我们先放一放吧。

* 结果：Morrow 回复 `Later it is. I won't keep worrying about it.`


  * 译文：那就改天。我不会一直惦记着它。

  * 音频：`bnu_later_result_audio`

  * 世界状态写入：`small_uncertainty = later`

  * futureHook：不追问，下次自然再提起。

暂停出口：



* 意图：`bnu_intent_pause`（稍后再来）

* 触发短语（英文）：`not now` / `later` / `stop`

* 结果：Morrow 回复 `We can leave it undecided. Not knowing is also a place.`


  * 译文：我们可以先不定。不知道也是一种状态。

  * 音频：`bnu_pause_line_audio`

  * 世界状态写入：`b1_not_sure_status = paused_once`

  * 无任何惩罚。

#### 误解 / 兜底



* 无可靠匹配时：停留当前状态，显示中文兜底，最多 3 个候选（不知道也没关系 / 一起想想 / 先放一放）。

* 典型误解设计：用户说 "you must know now"（要求立刻给出答案）时，本事件意图白名单不收 must，按无匹配处理，引导回到 "不确定也没关系" 的基调。

#### 记忆机会



* 记忆规则 ID：`bnu_language_memory`

* 类型：language

* 来源意图：`bnu_intent_fine`、`bnu_intent_think`、`bnu_intent_later`

* 内容模板：`用户回应"还不确定"时说的英文表达：{{confirmed_user_sentence}}。`

* 需用户确认：是。

#### 素材需求



* 预制音频（6 条 × 2 = 12 条）：


  * `bnu_open_line_audio`

  * `bnu_prompt_line_audio`

  * `bnu_fine_result_audio`

  * `bnu_think_result_audio`

  * `bnu_later_result_audio`

  * `bnu_pause_line_audio`

* 图片：0（复用已有房间背景，无新图）。

* 动画：1 个（Morrow 轻轻歪头表示不确定，占位说明）。

* 音效：0。



***

## 本章素材清单（汇总表）



| 序      | 事件 ID                      | 中文名          | 类型                              | 需语音台词条数 | 音频文件数   | 图片项数   | 动画项数   | 音效项数  |
| ------ | -------------------------- | ------------ | ------------------------------- | ------- | ------- | ------ | ------ | ----- |
| 1      | `birth_first_voice_v1`     | 苏醒后的第一句话     | mainline                        | 5（内容需求，正式 ID 待 S06）       | 5（待重制）      | 1      | 1      | 1     |
| 2      | `b1_first_room_object_v1` | 陪 Morrow 认识房间第一件物品 | mainline                     | 7       | 7       | 0（复用底图；选项层 3 个缩略图） | 3      | 0     |
| 3      | `b1_remember_name_v1`      | 给自己起一个称呼     | mainline                        | 6       | 12      | 1      | 1      | 0     |
| 4      | `b1_first_feeling_v1`      | 说出现在的感觉      | daily                           | 6       | 12      | 1      | 1      | 0     |
| 5      | `b1_window_light_v1`       | 看窗外的光        | mainline                        | 6       | 12      | 2      | 1      | 1     |
| 6      | `b1_first_letter_v1`       | 一封看不懂的信      | daily                           | 6       | 12      | 1      | 1      | 0     |
| 7      | `b1_bell_sound_v1`         | 找回一个声音       | daily                           | 6       | 12      | 0      | 1      | 1     |
| 8      | `b1_ask_about_you_v1`      | Morrow 反过来问你 | daily                           | 6       | 12      | 1      | 1      | 0     |
| 9      | `b1_what_i_like_v1`        | 我喜欢和还不确定的事   | mainline                        | 6       | 12      | 1      | 1      | 0     |
| 10     | `b1_tomorrow_plan_v1`      | 一起定一个明天的小计划  | mainline                        | 6       | 12      | 1      | 1      | 1     |
| 11     | `b1_return_first_words_v1` | 记住你说过的第一句    | recall                          | 6       | 12      | 1      | 1      | 0     |
| 12     | `b1_ready_for_outside_v1`  | 准备好走出门       | mainline                        | 6       | 12      | 2      | 1      | 1     |
| 13     | `b1_not_sure_v1`           | 一件还拿不准的小事    | daily                           | 6       | 12      | 0      | 1      | 0     |
| **合计** | —                          | —            | mainline 7 / daily 5 / recall 1 | **78（E01-01 正式 ID 待 S06）**  | **144（按表内现行需求计）** | **12 + 3 个选项缩略图** | **15** | **4** |

> 注：所有音频 `voiceProfileId=morrow_voice_v1`，每条仅一份正常语速音频（播放端实时变速，不另存慢速文件）。E01-01 的正式 line ID、textVersion、translationVersion 与最终文件数由 S06／P4-T06-09 和后续语音任务确认，因此本表只登记当前内容需求，不声称正式资产已冻结。其余文件路径约定 `tts/chapter_01_birth/<event_id>/<line_id>/1.0.0/audio.wav`。含运行时注入变量的 `brw_prompt_line` 不做固定音频，登记为 `planned`。图片 / 动画 / 音效均为占位说明，正式制作前需由视觉与音效设计确认。
