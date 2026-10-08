# T-P4-01 本地 SQLite 持久化

- 小任务状态：completed

## 任务目标

完成本地 SQLite 持久化方案，替代旧 Web 内存存储。

## 完成标准

### 执行清单

- [x] SQLite 驱动接入
- [x] typecheck 通过
- [x] 重启持久化验证通过
- [x] memory 模式独立
- [x] `STORE_DRIVER` 显式开关
- [x] `AI_ASR_PROVIDER` 显式开关

### 验收标准

typecheck 绿；重启后数据持久化验证通过。

## 当前情况

- 技术能力：completed
- 备注：非正式云端持久化（属 P4-T07）；旧 Web 内存存储已被替代。

## 任务范围

- 范围：本地 SQLite 驱动、重启持久化验证、memory 模式独立、环境变量开关。
- 不包含：云端 PostgreSQL、对象存储、多用户同步。

## 依赖

阶段 3.5。

## 输入材料

`DATA_MODEL.md`、`MIGRATION_PLAN_WEB_TO_FIXED_CONTENT.md`。

## 证据

### 交付物

`english-pet` 中 SQLite 持久化实现。

## 下一步

- 后续解锁：P4-T02 固定内容事件 Web 闭环。
