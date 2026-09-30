# P4-T01 本地 SQLite 持久化

## 1. 状态

✅ 已完成。账号、会话、设置、宠物、记忆、日记、反馈、对话、事件实例、首日、复现与固定事件状态全部落本地 SQLite，重启不丢。

## 2. 任务目标

在 Web 优先策略下，把原开发内存存储替换为本地 SQLite 持久化，使 API 重启后用户数据不丢失；同时保持 Web 仍只通过 HTTP API 取数，不直连数据库。

## 3. 任务范围

- API 新增本地 SQLite 持久化，数据库文件固定在 `english-pet/.data/english-pet.db`（WAL 模式，已加入 `.gitignore`）。
- 落库对象：账号/外部身份、会话 token、设置、宠物、记忆、日记、反馈、对话、事件实例/世界状态、首日流程、复现任务；固定内容事件实例/世界状态另存 `fixed_event_state` 表。
- 驱动由环境变量显式选择：`STORE_DRIVER=sqlite`（默认）/ `memory`（干净测试）。
- ASR 不再因存在云密钥隐式联网，改由 `AI_ASR_PROVIDER=mock|qwen` 显式选择，默认 mock。
- Web 仍只通过现有 HTTP API / API Client 取数，未直连数据库；API 响应契约与页面调用方式保持不变。

## 4. 不包含

- 不接入云端 PostgreSQL、CloudBase、对象存储或 CDN（云冻结，见 P4-T07）。
- 不做多实例横向扩展（当前单进程模型）。
- 不改变 SSE 流式对话在途生成为瞬时态的既有行为。
- 不删除内存实现，内存模式继续作为干净测试替身。

## 5. 执行清单

- [x] 账号/外部身份、会话 token、设置落库
- [x] 宠物、记忆、日记、反馈落库
- [x] 对话、事件实例/世界状态落库
- [x] 首日流程、复现任务落库
- [x] 固定内容事件实例/世界状态存入 fixed_event_state 表
- [x] STORE_DRIVER 环境变量显式选择 sqlite/memory
- [x] AI_ASR_PROVIDER 显式选择 mock/qwen，默认 mock 不联网
- [x] .data/english-pet.db 加入 .gitignore
- [x] 重启持久化验证：创建账号→改设置→推进首日→重启→同一 token 与数据仍在
- [x] memory 模式独立验证：与 sqlite 数据互不串

## 6. 验收标准

- `npm run typecheck` 全 workspace 通过。
- API 启动后创建账号、改设置、推进首日流程，重启进程后同一 token 与数据仍在。
- `STORE_DRIVER=memory` 可正常启动，且与 sqlite 数据互不串。
- Web 端无感知，页面调用方式不变。

## 7. 相关资料

- 代码：`english-pet/`（API Store 驱动层、`packages/database`）
- 数据模型：[DATA_MODEL.md](../DATA_MODEL.md)
- 数据模型迁移：[DATA_MODEL_MIGRATION.md](../DATA_MODEL_MIGRATION.md)
- 技术栈：[TECH_STACK.md](../TECH_STACK.md)
- 稳定基线：[PROJECT_BASELINE.md](../PROJECT_BASELINE.md) 第 6 节

## 8. 验证记录

已独立复跑 typecheck（全 workspace 绿）；API 重启后账号、设置、首日流程数据持久化验证通过；memory 模式独立启动且与 sqlite 数据互不串。结果见 english-pet 仓库冒烟与手工验证记录。

## 9. 后续任务

→ [P4-T02-固定内容事件Web闭环.md](./P4-T02-固定内容事件Web闭环.md)
