# T-P4.5-04EC 公共调度验收门

- 小任务状态：completed（2026-10-12；修复后技术复验通过并经用户重新确认）

## 任务目标

在 T04-I 三类事件调度工程实现完成且 T04-X 恢复可运行测试环境后，验证不依赖某一章具体内容的公共能力；公共能力只在本门验收一次，第一章门与第二章门复用该结果，不重复验收。

## 阻塞条件

- [T-P4.5-04I](./T-P4.5-04I-三类事件调度工程实现.md) 已完成；不再是阻塞项。
- [T-P4.5-04X](./T-P4.5-04X-workspace测试环境修复.md) 已完成；不再是阻塞项。

## 完成标准

- [x] 运行契约可区分 `mainline / daily / recall`，并支持显式依赖
- [x] 主线只受显式主线依赖约束，不被日常、回访、记忆保存或学习证据卡住
- [x] 日常相邻去重、冷却期内不重复、到期后可再次出现
- [x] 回访无目录／按钮／任务列表入口，由后台语义匹配触发，每次最多一条
- [x] 回访同时支持已确认且未暂停的共同经历／关系记忆和待迁移旧表达
- [x] 主线主动邀请、日常由动作／环境引出、回访由 Morrow 后台非抢占式自然提起
- [x] 每日新内容预算、额外一事件和预算后陪伴／恢复／复现符合设计
- [x] 调度、持久化、API、最小 Web 行为的自动化测试通过
- [x] 相关 smoke 与全 workspace typecheck 可进入真实断言并通过

## 判定规则

- 模块加载、依赖解析或测试环境失败只记环境阻塞，不得判业务 FAIL。
- 静态代码存在不等于运行 PASS；必须保存真实断言证据。
- 本门不验收第一章或第二章正文、台词、具体内容配置，不反向阻塞内容校准启动。

## 任务范围

- 包含：跨章节公共事件契约、调度、冷却、回访、预算、持久化、API、隐藏 recall 入口、三类触发最小 Web 行为及测试。
- 不包含：第一章／第二章具体内容一致性、冻结 UI 的完整迁移、视觉还原或全内容层接入。

## 依赖

- [T-P4.5-04D](./T-P4.5-04D-主线日常回访分工设计验证.md) — completed。
- [T-P4.5-04I](./T-P4.5-04I-三类事件调度工程实现.md) — completed。
- [T-P4.5-04X](./T-P4.5-04X-workspace测试环境修复.md) — completed。

## 证据输入

- [MORROW_MAINLINE_DAILY_RECALL_VALIDATION.md](../MORROW_MAINLINE_DAILY_RECALL_VALIDATION.md) v1.1.2。
- [MORROW_CH1_CH2_CONTINUITY_GATE_DESIGN.md](../MORROW_CH1_CH2_CONTINUITY_GATE_DESIGN.md) v1.0.5。

## 2026-10-12 重新打开原因

- 独立运行复核证明：主线已为 `available` 且 recall 同时满足条件时，旧推荐器先创建 recall 活动实例，随后启动主线返回 `fixed_event_locked`。
- 该行为违反“主线不被回访／记忆卡住”与“recall 为较弱后台触发”的完成标准。
- 旧 `scheduler-presentation.smoke.ts` 只验证纯文案和过滤函数，未挂载真实页面或覆盖 API／按钮行为，不能单独证明最小 Web 行为通过。
- 修复范围严格限于 `english-pet` 公共调度工程骨架；历史边界：当时 S04／T04-E1 尚未启动；现行状态以总计划为准，已首轮失败并等待 T04-C1 新独立验收通过。

## 历史验收证据（2026-10-11，已被本次独立复核推翻）

- 结论：**PASS**。所有命令均在 `C:\004-MCYY\english-pet` 执行并实际进入断言；无环境阻塞、无业务 FAIL。
- 公共 smoke 最终复跑：依次执行 `node_modules\.bin\tsx.cmd apps/api/src/fixed-scheduler.smoke.ts`、`fixed-scheduler-api.smoke.ts`、`fixed-event-engine.smoke.ts`、`fixed-daily-topics.smoke.ts`、`fixed-event-memory.smoke.ts`、`memory-resurfacing-store.smoke.ts`；六项退出码均为 0，并分别返回 `ok: true`。
- 最小 Web smoke：`node_modules\.bin\tsx.cmd apps/web/src/pages/FixedEventPage/scheduler-presentation.smoke.ts` 返回 `ok: true`、退出码 0，真实断言主线／日常／回访展示文案、Web 层 recall 二次隐藏和预算封顶后的普通陪伴展示。
- 断言覆盖：三类事件契约与显式依赖；三类触发方式／强度；主线排除日常与回访硬门；日常相邻去重、真实冷却、到期恢复和重启持久化；recall 目录隐藏、手动启动拒绝、后台语义匹配、每次单候选、共同经历／关系记忆与旧表达双来源；每日 2 个新主线 + 1 个新内容日常、学习对象／核心表达硬上限、额外一事件仅一次且幂等；预算封顶后的普通陪伴与已暂停事件恢复；固定事件、记忆、日记的 SQLite 持久化；统一推荐、额外事件、暂停／恢复 API。
- 最小 Web：`FixedEventPage.tsx` 通过统一 recommendation 展示主线主动邀请／日常环境引出／后台回访强度，目录通过 API 与 Web 展示层双重过滤 recall，提供预算后普通陪伴、额外一事件和暂停／恢复行为；新增 `scheduler-presentation.ts` 与真实 Web smoke 固定展示规则，其余 API 客户端与路由由全 workspace typecheck 和 Web 生产构建覆盖。
- `npm.cmd run typecheck`：退出码 0；API、Web、AI、contracts、database、domain 六个 workspace 全部通过。
- `npm.cmd run build --workspace '@english-pet/web'`：退出码 0；Vite 8.3.0，2106 modules transformed，最大 JS chunk 371.28 kB，无 500 kB 大包 warning。
- 为消除静态推断替代运行证据的风险，只做验收需要的最小改动：增强 `apps/api/src/fixed-scheduler.smoke.ts` 的三类触发方式／强度和预算封顶后恢复断言；抽出 `apps/web/src/pages/FixedEventPage/scheduler-presentation.ts`，新增 `scheduler-presentation.smoke.ts` 并由页面复用。未改正文、正式 UI、台词、词表或语音。
- 唯一遗留告警：使用 Node 内置 `node:sqlite` 的 smoke 会输出 `ExperimentalWarning`；所有相应进程退出码仍为 0，属于运行时实验状态提示，不是业务失败或环境阻塞。

## 2026-10-12 修复与技术复验

- 历史修复阶段结论：**技术 PASS**；当时状态曾为 `reopened`。此为修复过程记录，用户随后已重新确认通过。
- 契约新增可选并行语义 `recallPrompt`：主推荐仍为可立即启动的主线；提示每次最多一条，只携带回访标题、较弱触发强度与来源类型，不是目录项、按钮或活动事件。
- 引擎在主线与 recall 同时满足时返回主线推荐并附 `recallPrompt`，`current()` 仍为 `null`，随后启动主线返回活动实例；只有没有主线可推荐时，recall 才进入既有活动事件流程并消耗当日回访额度。
- 引擎 smoke 新增真实竞争断言：主线优先、recall 不创建 active instance、主线可启动、双来源、暂停过滤、无主线时 recall 的既有交互流程。
- API smoke 新增完整竞争场景：统一推荐保留主线并附非抢占提示，current 为空，主线 start 返回 201；目录隐藏与 recall 手动 start 409 继续通过。
- Web 新增真实 React 组件挂载 smoke，实际挂载页面复用的 `SchedulerOverview`／`SchedulerActiveControls`，验证 recall 目录隐藏、非抢占提示、主线按钮可点击、普通陪伴额外事件按钮、暂停与恢复按钮；不再只测文案纯函数。
- 八组相关 smoke 均 `ok: true`、退出码 0；全 workspace typecheck 退出码 0；Web 生产构建退出码 0（Vite 8.3.0，2107 modules transformed，最大 JS chunk 371.21 kB）。
- 边界：未修改旧测试原型，未迁入第一章完整正文、冻结 UI、视觉、台词、词表或语音；未启动 S04／T04-E1。
- 遗留告警：Node `node:sqlite` 仍输出 `ExperimentalWarning`；组件 smoke 使用的 `react-test-renderer` 输出弃用提示。两者进程退出码均为 0，未屏蔽警告，不影响本轮业务断言。

## 下一步

S03／T04-EC 当前状态为 `completed（2026-10-12；修复后技术复验通过并经用户重新确认）`。S04／T04-E1 已启动但首轮失败，当前 `in-progress`，T04-C1 为 reopened，等待新独立验收通过；T04-E 父任务保持 `partial`，T04-E2 继续等待 T06 第 2 批。
