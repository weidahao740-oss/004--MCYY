# P4-T07 云端基础设施与 PostgreSQL

## 1. 状态

⏸ 冻结（Web 优先）。云厂商与产品组合决策已定稿，但在 Web 功能完成前不接入云端。

## 2. 任务目标

按已确认的腾讯云 CloudBase 上海 PostgreSQL 模式，建立小程序/App 共用的正式后端：托管容器 + PostgreSQL + 对象存储/CDN + 独立私有临时录音区，替换当前本地 SQLite 与开发内存实现。

## 3. 任务范围

- 部署 Node.js API 到 Serverless 托管容器。
- 接入托管 PostgreSQL，建立数据库迁移、备份和恢复流程，替换当前 SQLite / 内存存储。
- 建立版本化固定素材区（预制 TTS、图片、动画、音效）与私有临时录音区。
- 为审核通过的音频配置对象存储与 CDN；用户录音走私有临时目录，ASR 后立即删除或 1—24 小时过期。
- 配置正式域名（api.morrowpet.cn / assets.morrowpet.cn）、HTTPS、日志脱敏、监控、限流、成本告警（¥300/月，70%/90%/100% 分级）与回滚。
- 验证容器重启与多实例下用户状态不丢失。
- 将身份与业务用户 ID 分离，预留微信、手机号、Apple 等身份绑定。
- 验证账号注销与用户数据级联删除。

## 4. 不包含

- 当前冻结：Web 优先阶段不启动任何云端接入、不购买域名、不申请备案、不配置云资源。
- 不在 PostgreSQL 未完成前删除现有 SQLite / 内存实现（它们继续作为开发测试替身）。
- 不把 Web 版本作为正式首发产品。
- 不在源码、客户端包、文档或日志中写入真实云密钥。
- 不并行开发 App。

## 5. 执行清单

- [x] 云厂商与产品组合决策已定稿（腾讯云 CloudBase 上海 PostgreSQL 模式）
- [x] 域名规划与预算门已定（api.morrowpet.cn / assets.morrowpet.cn；¥300/月分级告警）
- [ ] 部署 API 到托管容器（冻结）
- [ ] 接入 PostgreSQL 并替换存储层（冻结）
- [ ] 建立对象存储与 CDN（冻结）
- [ ] 配置正式域名、HTTPS、监控、告警、回滚（冻结）
- [ ] 多实例与重启持久化验证（冻结）
- [ ] 身份与业务用户 ID 分离（冻结）
- [ ] 账号注销级联删除正式验证（冻结）

## 6. 验收标准

- 托管容器重启后用户状态不丢失，多实例可共享数据库与文件资源。
- 客户端不含任何服务密钥。
- 固定素材可通过 CDN 稳定播放和缓存。
- 原始录音不会长期或公开保存，ASR 后及时删除或过期。
- 不接生成式大模型也能完成核心学习闭环。
- 账号注销后用户数据级联删除彻底。

## 7. 相关资料

- 基础设施决策：[STAGE_4_INFRASTRUCTURE_DECISION.md](../STAGE_4_INFRASTRUCTURE_DECISION.md)
- 技术栈：[TECH_STACK.md](../TECH_STACK.md)
- 数据模型：[DATA_MODEL.md](../DATA_MODEL.md)
- API 迁移：[API_MIGRATION.md](../API_MIGRATION.md)
- 数据模型迁移：[DATA_MODEL_MIGRATION.md](../DATA_MODEL_MIGRATION.md)
- 隐私设计：[PRIVACY_DESIGN.md](../PRIVACY_DESIGN.md)
- 稳定基线：[PROJECT_BASELINE.md](../PROJECT_BASELINE.md) 第 6、8 节

## 8. 验证记录

冻结中。决策文档与架构图已完成；当前 Web 优先阶段以本地 SQLite 运行，云端资源未配置。Web 功能完成后再解冻本任务。

## 9. 后续任务

→ [P5-T01-首个正式移动端.md](./P5-T01-首个正式移动端.md)
