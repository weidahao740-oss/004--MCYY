# T-P4.5-04I 三类事件调度工程实现

- 小任务状态：completed（2026-10-11；公共调度工程实现与本任务内自动化验证通过）

## 任务目标

依据 T03 v1.0.5 与 T04-D 已确认设计，在固定事件运行链路中实现主线／日常／回访分类、显式主线依赖、日常冷却、后台回访、触发强度分层、E01-02 暂停出口和每日新内容柔性预算。

## 完成标准

- [x] 运行契约包含 `mainline / daily / recall` 类型并持久化
- [x] 主线使用显式依赖，不再按全局全部更小 sequence 解锁
- [x] E2-06 直接依赖 E2-04，排除 E2-03
- [x] E2-12 不依赖 E2-11
- [x] 章节日常池支持相邻去重、冷却期内不重复、到期后可再出现
- [x] recall 从用户目录移除，只由后台语义匹配触发，每次最多一条
- [x] recall 同时支持已确认且未暂停的共同经历／关系记忆和待迁移旧表达
- [x] 主线、日常、回访三种触发强度分别落地
- [x] E01-02 支持平静暂停、无负反馈和最近状态恢复
- [x] 每日新内容柔性预算按用户本地日期记录和拦截，预算后仍可陪伴、恢复和复现
- [x] 新增相应自动化测试并通过

## 任务范围

- 包含：事件类型与显式依赖契约、调度、持久化、API、隐藏 recall 目录入口、支撑主线主动邀请／日常环境引出／回访后台提起三类触发的最小 Web 行为，以及相应自动化测试。
- Web 边界：只允许为三类事件调度与验收补齐必要的最小入口行为；不得迁入冻结 UI，不得做完整页面结构／组件／视觉还原，不得接入完整内容层。
- 不包含：逐事件正文、台词、英文目标句、词表、语音生产；冻结 UI 的完整页面迁移、视觉还原、全内容层接入与正式 Web 功能界面适配归 [P4-T06-06](./T-P4-06-06-第一章Web功能界面适配.md)。
- 并行约束：T04-I 与 P4-T06-06 不并行修改同一完整页面；T04-I 形成的最小调度接口与行为由 P4-T06-06 后续复用，不在本任务扩展为正式界面迁移。

## 依赖

- [T-P4.5-04D](./T-P4.5-04D-主线日常回访分工设计验证.md) — completed。
- 最终事件分类与依赖配置随 P4-T06-08、T06 第 1/2 批内容校准提供；工程骨架可先行，实现后以最终内容配置联调。

## 证据输入

- [MORROW_MAINLINE_DAILY_RECALL_VALIDATION.md](../MORROW_MAINLINE_DAILY_RECALL_VALIDATION.md) v1.1.1 的 F-01—F-08。
- [MORROW_CH1_CH2_CONTINUITY_GATE_DESIGN.md](../MORROW_CH1_CH2_CONTINUITY_GATE_DESIGN.md) v1.0.5。

## 实现与验证证据（2026-10-11）

- 契约与内容配置：`english-pet/packages/contracts/src/fixed-content.ts`、`english-pet/packages/domain/src/fixed-content-v1.ts`。
- 调度与持久化：`english-pet/apps/api/src/sqlite-fixed-event-engine.ts`；API 为 `english-pet/apps/api/src/index.ts`。
- 最小 Web：`english-pet/apps/web/src/pages/FixedEventPage/FixedEventPage.tsx`、`english-pet/apps/web/src/api/fixed-event-api.ts`。
- 新增测试：`fixed-scheduler.smoke.ts` 8 组检查，覆盖 recall 来源过滤、语义标签匹配、不相关记忆不触发、双来源兼容、多候选确定性选择，以及 extra 未达默认主线额度拒绝、达额后一次领取、幂等重放和第二 key 拒绝；`fixed-scheduler-api.smoke.ts` 7 组检查；既有 `fixed-event-engine.smoke.ts` 6 项、`fixed-daily-topics.smoke.ts` 10 项、`fixed-event-memory.smoke.ts` 8 项、`memory-resurfacing-store.smoke.ts` 8 项均通过。
- `npm run typecheck`：全 workspace 通过。
- `npm run build --workspace @english-pet/web`：通过。已撤销调高 chunk warning 阈值，采用现有路由 `React.lazy` 最小拆包；最大 JS chunk 由基线约 644.62 kB 降为约 371.28 kB，低于默认 500 kB 警告门，无大包 warning。
- Node `node:sqlite` 运行 smoke 时仍会输出 `ExperimentalWarning`；这是当前 Node 内置 SQLite API 的实验状态提示，未使用 `NODE_NO_WARNINGS` 屏蔽，不属于业务断言失败。
- 边界：未迁移第一章 13 事件完整正文，未制作台词、词表、语音、图片、动画或音效，未启动 P4-T06-06 或 T06 第2批；旧 `first_restored_object` 等迁移兼容字段仍存在，不代表完整内容迁移完成。

## 下一步

本任务已完成。[T-P4.5-04EC 公共调度验收门](./T-P4.5-04EC-公共调度验收门.md) 当前为 `completed`（2026-10-12；修复后技术复验通过并经用户重新确认）；T04-E1 已启动但首轮验收失败，T04-C1 为 reopened，等待新独立验收通过；T04-E2 仍 blocked、未启动。本任务不承担 P4-T06-06 的完整页面迁移。
