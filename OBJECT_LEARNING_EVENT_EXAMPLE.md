# OBJECT_LEARNING_EVENT_EXAMPLE — 样板：幼年 Morrow 第一次认识苹果

> **声明（开头必读）**：本文只是 `LEARNING_SCENARIO_LIBRARY.md` 情景库中的**一个完整样板案例**，演示"一个新物品从指认到迁移"的完整教学链路长什么样。它**不替代**完整的 `LEARNING_SCENARIO_LIBRARY.md`，也不新增事件 ID；苹果只是拿来讲清楚这条链路的道具，真实上线时可替换成任意物品。
>
> 项目：成人英语 AI 宠物 Morrow（墨洛）｜阶段 3.5.4
> 术语沿用情景库：掌握六阶 encountered / recognized / prompted / independent / transferring / mastered；三档 basic / intermediate / advanced；六能力与 12 交互结构同前。
> 界面/功能说明用中文；Morrow 台词与用户例句为简单地道英文，每句配人工中文。

---

## 0. 这个样板要演示的完整链路

一个新物品（这里用 apple）的教学不是一步"这是苹果"，而是八个步骤、逐步升级掌握证据：

**指向 pointing → 命名 naming（apple / red...）→ 完整句 It is an apple. → 特征描述 It is red and round. → 误认纠正（把苹果错认成西红柿/球，用户纠正）→ 生活任务（放进篮子/递给我）→ 偏好表达 I like apples. → 跨场景迁移（几天后早餐场景自然复现 apple）。**

每一步都给：① 中文界面任务；② Morrow 英文台词 + 人工中文；③ 基础/中等/进阶三档用户分别怎么回答；④ 掌握证据如何从一阶升到下一阶。

---

## 步骤 1：指向（pointing）

- **中文界面任务**：屏幕桌上出现一个红苹果。Morrow 伸手指着它，界面下方提示："Morrow 指着桌上的东西，它不知道这叫什么。你可以指给它看，或直接说出它的名字。"
- **Morrow 台词**：
  - `What is this? It is on the table.`（译文：这是什么？它在桌上。）
  - `I can point at it, but I don't know the word.`（译文：我能指着它，但不知道这个词。）
- **三档用户回答**：
  - 基础 basic：点中文候选"这是一个苹果"（提交预设意图，自己不打英文）。
  - 中等 intermediate：输入/选择参考句 `This is an apple.`（译文：这是一个苹果。）
  - 进阶 advanced：自己说 `That red thing on the table is an apple.`（译文：桌上那个红色的东西是苹果。）
- **掌握证据升级**：用户首次接触 apple 一词，停在 **encountered**；只要能把"红色圆形物"和 apple 对上，即进入 **recognized**。此步只要求认识，不要求独立造句。

---

## 步骤 2：命名（naming：apple / red...）

- **中文界面任务**：界面高亮苹果，并提示"Morrow 想跟着念一遍。你帮它把名字和颜色说出来。"
- **Morrow 台词**：
  - `Apple. Is that the word?`（译文：Apple。是这个词吗？）
  - `And it is red, right?`（译文：而且它是红色的，对吧？）
- **三档用户回答**：
  - 基础 basic：点选"apple / red"两个词卡。
  - 中等 intermediate：说 `It is an apple, and it is red.`（译文：这是一个苹果，它是红色的。）
  - 进阶 advanced：说 `It's an apple. Apples can be red or green.`（译文：这是一个苹果。苹果可以是红的或绿的。）
- **掌握证据升级**：能跟着说出 apple 这个名词 + 颜色形容词 = **prompted（提示下会用）**。Morrow 此时仍依赖用户提示词卡。

---

## 步骤 3：完整句（It is an apple.）

- **中文界面任务**：界面只留苹果特写，不再给词卡。提示"Morrow 想自己说完整一句。你来确认它说得对不对。"
- **Morrow 台词**：
  - `I will try: It is an apple.`（译文：我试试：这是一个苹果。）
  - `Did I say it right?`（译文：我说对了吗？）
- **三档用户回答**：
  - 基础 basic：点选"对/不对"。
  - 中等 intermediate：说 `Yes, it is an apple.`（译文：对，这是一个苹果。）
  - 进阶 advanced：说 `Yes. "It is an apple." That sounds right.`（译文：对。"It is an apple."听起来是对的。）
- **掌握证据升级**：Morrow 能在无词卡时用完整 `It is an apple.`；用户确认后，该句型进入 **independent（独立会用）** 的候选——但还需用户自己也独立说一次才算站稳。

---

## 步骤 4：特征描述（It is red and round.）

- **中文界面任务**：提示"除了名字，它还有什么样子？你描述给 Morrow 听。"
- **Morrow 台词**：
  - `It is not just a name. What does it look like?`（译文：它不只是一个名字。它看起来什么样？）
  - `Is it big? Is it smooth?`（译文：它大吗？它光滑吗？）
- **三档用户回答**：
  - 基础 basic：点选"红色/圆的"两个特征。
  - 中等 intermediate：说 `It is red and round.`（译文：它又红又圆。）
  - 进阶 advanced：说 `It is red, round, and smooth. It is a little sweet.`（译文：它又红又圆又光滑。它有点甜。）
- **掌握证据升级**：用户能用 `It is ... and ...` 把多个特征串成一句，即从"只会说名词"升级到**描述世界 describing**能力，apple 相关表达进入 **independent**。

---

## 步骤 5：误认纠正（纠正误认）

- **中文界面任务**：Morrow 把苹果错认成别的东西（西红柿 / 皮球）。界面提示"Morrow 认错了，你来温和纠正。"
- **Morrow 台词**：
  - `Is this a tomato? Or a ball? It is red and round.`（译文：这是西红柿吗？还是球？它又红又圆。）
  - `Did I get it wrong?`（译文：我认错了吗？）
- **三档用户回答**：
  - 基础 basic：点选"不是，这是苹果"。
  - 中等 intermediate：说 `No. It is not a tomato. It is an apple.`（译文：不，这不是西红柿。这是苹果。）
  - 进阶 advanced：说 `I thought it looked like a ball too, but it's an apple. We eat apples.`（译文：我也觉得它像个球，但这是苹果，我们吃苹果。）
- **掌握证据升级**：用户用否定 + 纠正句把"苹果 ≠ 西红柿 ≠ 球"区分开，触发 **纠正误认** 交互结构；apple 的识别从"孤立名词"升级为"在混淆项中仍能认出"，迈向 **transferring**。

---

## 步骤 6：生活任务（把苹果放进篮子 / 递给我）

- **中文界面任务**：桌上出现篮子。提示"Morrow 想请你帮个小忙——用一句话指挥或请求。"
- **Morrow 台词**：
  - `Can you help me? Put the apple in the basket, please.`（译文：你能帮我吗？请把苹果放进篮子里。）
  - `Or give it to me?`（译文：或者递给我？）
- **三档用户回答**：
  - 基础 basic：点选"放进篮子 / 递给我"。
  - 中等 intermediate：说 `Here you are. I put the apple in the basket.`（译文：给你。我把苹果放进篮子里了。）
  - 进阶 advanced：说 `I'll give it to you. Catch! It's an apple, not a ball.`（译文：我递给你。接好！这是苹果，不是球。）
- **掌握证据升级**：用户把 apple 用到一个真实小任务里（执行动作 doing + 社会沟通 social），语言从"认东西"变成"做事"，掌握证据巩固 **independent**，并为下一步偏好表达铺路。

---

## 步骤 7：偏好表达（I like apples.）

- **中文界面任务**：提示"吃过/看过苹果之后，Morrow 想知道你喜不喜欢，也想说说自己的感觉。"
- **Morrow 台词**：
  - `Do you like apples?`（译文：你喜欢苹果吗？）
  - `I think I like them. They are sweet.`（译文：我觉得我喜欢。它们甜甜的。）
- **三档用户回答**：
  - 基础 basic：点选"喜欢 / 一般 / 不确定"。
  - 中等 intermediate：说 `Yes, I like apples.`（译文：是的，我喜欢苹果。）
  - 进阶 advanced：说 `I like apples, but I like bananas too.`（译文：我喜欢苹果，但我也喜欢香蕉。）
- **掌握证据升级**：用户用 `I like apples.` 独立表达偏好（表达自己 expressing），apple 从"物品名"进入"有情感色彩的词"，此时已具备 **independent** 稳定输出；最后一步测试迁移。

---

## 步骤 8：跨场景迁移（几天后早餐场景自然复现）

- **中文界面任务**：时间跳到几天后的早餐桌。苹果出现在橙汁和面包旁边。提示"Morrow 没有再问'这是什么'，而是在新场景里自然用到 apple。"
- **Morrow 台词**：
  - `Good morning. There is an apple with breakfast today.`（译文：早上好。今天早餐有一个苹果。）
  - `Do you want the apple or the bread?`（译文：你要苹果还是面包？）
- **三档用户回答**：
  - 基础 basic：点选"苹果 / 面包"。
  - 中等 intermediate：说 `I want the apple, please.`（译文：请给我苹果。）
  - 进阶 advanced：说 `I'll have the apple. Remember? It is red and round.`（译文：我要苹果。还记得吗？它又红又圆。）
- **掌握证据升级**：在**没有任何"命名提示词卡"的新场景**里，用户仍能听懂 apple 并主动用它点餐 = **transferring（迁移中）**；若一周内又在购物/野餐等场景无提示复现一次，即判 **mastered（稳定掌握）**。这一步正是"防退化"关键：同一个词被反复考"这是什么"只会停在 recognized，跨场景自然复现才能升到 mastered。

---

## 收尾声明

> 再次强调：**本文只是 `LEARNING_SCENARIO_LIBRARY.md` 情景库中的一个样板案例**。它的作用是把"指向→命名→完整句→特征→纠正→任务→偏好→迁移"这条八步链路讲清楚，供设计其它物品（如 cup / cushion / school bag / book）时套用同一张表。它**不替代完整的情景库**——完整的首两章 25 事件映射与第三至七章 40 个候选情景，请以 `LEARNING_SCENARIO_LIBRARY.md` 为准。
