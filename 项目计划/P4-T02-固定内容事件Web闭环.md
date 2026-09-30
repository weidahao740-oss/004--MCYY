# P4-T02 固定内容事件 Web 闭环

## 1. 状态

✅ 已完成。第一章"出生与苏醒"固定内容事件在 Web 端完整闭环：事件推进、中文译文开关、预制音频播放变速、录音 ASR 回退、错误态与窄屏适配均已上线并通过验证。

## 2. 任务目标

把确定性固定内容事件引擎接入真实事件推进链路，并在 Web 端完成完整事件体验闭环，使第一章两个固定事件（birth_first_voice_v1、birth_restore_object_v1）可在浏览器中从头走到尾。

## 3. 任务范围

- 后端：实现 `GET /v1/fixed-content/ruleset` 下发 `fixed-content-v1.0.0`；实现 `POST /v1/events/:id/intents` 确定性意图预览；实现 `GET/POST /v1/fixed-content/events/*` 四个 Bearer 路由，由 `transition.onIntentIds` 驱动状态迁移，outcome 写 worldState，幂等键去重，重启不丢，账号删除级联。
- 后端：事件完成后按 `memoryRules` 向记忆 store 提待确认提案；日记补 `textVersion`/`translationVersion` 快照。
- Web：新增 `FixedEventPage`，`/events` 路由改指新页；目录/进行中两视图；渲染 lines/choices/referenceReplyLines/acceptedInputModes/candidates/messageZh/resultLines/outcome。
- Web：每条学习台词右下角"查看中文/收起中文"，默认收起，展开显 `translation.textZh`，纯 UI 不影响进度。
- Web：`LearningLine` 在 `line.audioIds` 非空时查预制音频绑定，ready 才出播放按钮；模块级单例 HTMLAudioElement 播新停旧；头部加 1.0×/0.8×/0.6× 实时变速。
- Web：录音/ASR 文字回退复用 VoiceComposer，按住录音→mock ASR→可编辑回填主输入框；失败降级手输。
- Web：初始加载转圈、首屏失败大白话重试、提交失败提示条且不丢已输英文、busy 防重复、手机窄屏无横向溢出。
- 旧 `/v1/events/*` 与旧 EventPage 保留兼容。

## 4. 不包含

- 不接入第二章及以后事件（见 P4-T03）。
- 不接真实云 ASR（当前 mock，见 P4-T05）。
- 不迁移 PostgreSQL（云冻结，见 P4-T07）。
- 不实现固定对话主题库（见 P4-T04）。

## 5. 执行清单

- [x] 固定内容规则集端点（GET /v1/fixed-content/ruleset）
- [x] 确定性意图预览端点（POST /v1/events/:id/intents）
- [x] SqliteFixedEventEngine + fixed_event_state 表接入真实事件推进
- [x] 事件完成按 memoryRules 提待确认记忆提案
- [x] 日记补 textVersion/translationVersion 快照
- [x] Web FixedEventPage 目录/进行中两视图
- [x] "查看中文/收起中文"按钮（默认收起）
- [x] 预制音频播放 + 1.0×/0.8×/0.6× 三档变速
- [x] 录音→mock ASR→可编辑回填
- [x] 加载转圈、失败大白话重试、提交失败保留输入、busy 防重复
- [x] 手机窄屏无横向溢出
- [x] 旧 /v1/events/* 与旧 EventPage 保留兼容

## 6. 验收标准

- `npm run typecheck` 全 workspace 绿。
- `npm run build`（web）成功。
- fixed-event / memory-memory-store / memory-journal-store / account-deletion 冒烟全 `{ok:true}`。
- 真实 HTTP：401 鉴权、bfv 全流程、乱码 advanced:false 带候选、幂等重放不增、重启持久、旧 `/v1/events` 不 500。
- 真实浏览器：裸根 `/` 非白屏；375×800 视口无横向溢出；停 API 后发送按钮禁用且原文保留；恢复后重发成功；播放/语速/中文开关/录音可用。

## 7. 相关资料

- 固定内容契约：[FIXED_CONTENT_CONTRACT.md](../FIXED_CONTENT_CONTRACT.md)
- 第一章内容：[CHAPTER_01_BIRTH_CONTENT.md](../CHAPTER_01_BIRTH_CONTENT.md)
- API 迁移：[API_MIGRATION.md](../API_MIGRATION.md)
- 迁移设计：[MIGRATION_PLAN_WEB_TO_FIXED_CONTENT.md](../MIGRATION_PLAN_WEB_TO_FIXED_CONTENT.md)
- 代码：`english-pet/apps/web/src/pages/FixedEventPage/`、`english-pet/apps/api/src/`

## 8. 验证记录

已独立复跑 typecheck（全 workspace 绿）、web build（成功）、fixed-event / memory / account-deletion 冒烟（全 `{ok:true}`）、独立临时库真实 HTTP 13 步全过（401、bfv、乱码带候选、幂等重放、重启持久、旧路由不 500）、真实浏览器窄屏与错误态验证通过。结果见 english-pet 仓库验证记录。

## 9. 后续任务

→ [P4-T03-童年探索第二章固定内容扩展.md](./P4-T03-童年探索第二章固定内容扩展.md)
