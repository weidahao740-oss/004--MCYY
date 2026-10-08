# T-P4-07 云端基础设施与 PostgreSQL

- 小任务状态：not-started

## 任务目标

完成腾讯云 CloudBase 上海 PostgreSQL 模式的实际部署。

## 完成标准

### 执行清单

- [ ] 云厂商组合决策（已固化）
- [ ] 域名规划 `api.morrowpet.cn` / `assets.morrowpet.cn`（已固化）
- [ ] 预算门 ¥300/月分级告警（已固化）
- [ ] 托管容器部署
- [ ] PostgreSQL 接入
- [ ] 对象存储 CDN 配置
- [ ] 域名 HTTPS 监控告警
- [ ] 多实例验证
- [ ] 身份分离
- [ ] 账号注销级联
- [ ] 域名购买前核验可用性/商标/备案

### 验收标准

正式环境可运行 PostgreSQL + 对象存储 + CDN + HTTPS。

## 当前情况

- 技术能力：completed（决策规划层）
- 备注：实施层 0%；严禁因旧 Web/本地 SQLite 存在读作"后端已完成"。

## 任务范围

- 范围：云托管容器、PostgreSQL、对象存储/CDN、域名/HTTPS/监控告警、多实例验证、身份分离、账号注销级联。
- 不包含：Web 端开发（阶段 4 范围）。

## 依赖

T-P4-06-06 完成后按正式端联调需要解冻。

## 输入材料

`STAGE_4_INFRASTRUCTURE_DECISION.md`、BASELINE §6。

## 证据

### 交付物

云端基础设施。

## 下一步

- 后续解锁：阶段 5 移动端。
