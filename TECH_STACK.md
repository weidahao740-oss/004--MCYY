# TECH_STACK — 成人英语 AI 宠物

> 状态：已定稿，可直接用于初始化开发。
>
> 决策日期：2026-09-17
>
> 平台策略：Web/PWA 首发；后续增加微信小程序或 App 客户端，共用同一套服务端与数据。

## 1. 最终技术选型

| 层级 | 首发选型 | 用途 |
|---|---|---|
| Web/PWA | React + Vite + TypeScript | 首发客户端，优先手机浏览器并兼容桌面 |
| 样式与组件 | Tailwind CSS + shadcn/ui + Lucide | 建立成人化、可维护的界面系统 |
| 路由 | React Router | 页面路由与登录态路由 |
| 服务端状态 | TanStack Query | API 请求、缓存、重试和失效管理 |
| 本地界面状态 | Zustand | 仅保存录音、播放器、草稿等客户端状态 |
| PWA | vite-plugin-pwa / Workbox | 安装到桌面、静态资源缓存和版本更新 |
| API 服务 | Node.js + TypeScript + Hono | 平台无关的统一 HTTP/WebSocket API |
| 数据校验 | Zod | 客户端、API 和事件配置共享数据契约 |
| 数据访问 | Drizzle ORM | PostgreSQL Schema、迁移与类型安全查询 |
| 数据库 | CloudBase PostgreSQL | 用户、消息、事件、三类记忆和记忆册 |
| 文件存储 | CloudBase Storage | 用户语音、宠物音频和后续资源文件 |
| 计算与部署 | CloudBase Cloud Run / 云托管 | 承载长连接、AI 编排、ASR/TTS 和后台任务 |
| Web 托管 | CloudBase Hosting | Web/PWA 静态资源、HTTPS、自定义域名和回滚 |
| 身份认证 | 服务端统一身份层 + CloudBase Auth | Web 首期使用邮箱/手机号；后续绑定微信、Apple 等身份 |
| 实时通信 | WebSocket，失败时降级为普通 HTTPS | 对话增量输出；兼容后续小程序 WSS 接入 |
| 本地开发 | npm workspaces | 单人项目减少工具数量，统一依赖与脚本 |
| 日志 | Pino 结构化日志 | API 请求、外部服务错误和成本记录，禁止记录不必要的对话原文 |

CloudBase 官方资料说明其提供数据库、认证、对象存储、云函数/云托管和 Web 托管，并覆盖 Web、小程序与移动应用，适合本项目的多客户端路线。微信小程序后续访问独立后端时，需要配置 HTTPS/WSS 通讯域名；因此首版 API 必须使用正式域名和标准协议，而不能依赖浏览器私有能力。

参考：

- [CloudBase Documentation](https://docs.cloudbase.net/en/)
- [微信小程序网络使用说明](https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network)
- [Taro React 概述](https://docs.taro.zone/docs/react-overall/)

## 2. 为什么首发 Web 不直接使用 Taro

首发阶段选择标准 React Web，而不是用 Taro 同时生成 H5 和小程序。

原因：

1. 当前核心风险是 AI 对话、语音、记忆和事件闭环，不是多端 UI 复用；
2. 标准 Web 在音频调试、流式输出、PWA 和开发工具方面更直接；
3. Taro 遵循小程序组件、API 和路由规范，与普通 Web React 存在差异；为了追求首期 UI 复用，会提前引入平台限制；
4. 后续小程序可以共享 TypeScript 类型、事件 Schema、API SDK 和领域逻辑，不必共享全部 UI；
5. App 同理可以使用 React Native/Expo，共享契约与领域包，不强行共享视图组件。

结论：**共享业务，不强求共享界面。**

## 3. 跨端架构

```text
┌─────────────────┐
│ Web / PWA       │  React + Vite
└────────┬────────┘
         │
┌────────▼────────┐       后续       ┌─────────────────┐
│ 统一 API SDK    │◄────────────────│ 微信小程序       │ Taro + React
└────────┬────────┘                  └─────────────────┘
         │                           ┌─────────────────┐
         │◄─────────────────────────│ App             │ React Native / Expo
         │                           └─────────────────┘
         ▼
┌──────────────────────────────────────────────────────┐
│ Node.js / TypeScript / Hono API                      │
│ 鉴权｜对话编排｜宠物人格｜事件引擎｜记忆｜反馈｜成本控制 │
└───────────────┬───────────────────┬──────────────────┘
                │                   │
       ┌────────▼────────┐  ┌──────▼────────────────┐
       │ PostgreSQL      │  │ 外部 AI / ASR / TTS   │
       │ 用户、事件、记忆 │  │ 仅由服务端持有密钥      │
       └────────┬────────┘  └───────────────────────┘
                │
       ┌────────▼────────┐
       │ 对象存储         │
       │ 临时语音与资源    │
       └─────────────────┘
```

## 4. 仓库结构

```text
english-pet/
├─ apps/
│  ├─ web/                 # React Web/PWA
│  ├─ api/                 # Hono API
│  ├─ mini/                # 后续微信小程序客户端，不在首版创建业务代码
│  └─ mobile/              # 后续 App 客户端，不在首版创建业务代码
├─ packages/
│  ├─ contracts/           # Zod Schema、DTO、API 类型
│  └─ domain/              # 平台无关的事件、记忆、语言规则
├─ package.json            # npm workspaces
├─ tsconfig.base.json
└─ .env.example
```

### 允许共享

- API 请求与响应 Schema；
- 用户、宠物、事件、记忆、反馈等领域类型；
- 事件配置解析与校验；
- 输入规范化、错误码和基础工具；
- API SDK。

### 禁止放进共享包

- DOM、Service Worker、浏览器录音实现；
- 微信 `wx.*` API；
- React Native 原生模块；
- 平台路由、权限弹窗和本地缓存实现；
- 任何模型、数据库或云服务密钥。

## 5. 客户端适配接口

所有平台差异通过接口隔离：

```ts
interface RecorderAdapter {
  requestPermission(): Promise<boolean>
  start(): Promise<void>
  stop(): Promise<RecordedAudio>
}

interface AudioPlayerAdapter {
  play(source: string): Promise<void>
  stop(): void
  setRate(rate: number): void
}

interface IdentityAdapter {
  signIn(): Promise<PlatformCredential>
  signOut(): Promise<void>
}

interface NotificationAdapter {
  requestPermission(): Promise<boolean>
  schedule(input: NotificationInput): Promise<void>
}
```

首版分别实现 `webRecorderAdapter`、`webAudioPlayerAdapter` 和 `webIdentityAdapter`。后续小程序/App 只新增适配器，不修改事件、记忆和 AI 编排。

## 6. API 边界

建议首版 API：

```text
GET    /health
POST   /v1/auth/session
DELETE /v1/auth/session
GET    /v1/me
GET    /v1/pet
POST   /v1/conversations
POST   /v1/conversations/:id/messages
WS     /v1/conversations/:id/stream
POST   /v1/audio/transcriptions
POST   /v1/audio/speech
GET    /v1/events/today
POST   /v1/events/:id/actions
GET    /v1/memories
PATCH  /v1/memories/:id
DELETE /v1/memories/:id
POST   /v1/memories/pause
GET    /v1/journal
GET    /v1/journal/:id
DELETE /v1/account
```

规则：

- 客户端只调用统一 API，不直接访问数据库；
- 模型、ASR、TTS 和微信 AppSecret 只存在服务端；
- API 返回统一错误结构；
- 所有写请求具备用户身份校验；
- 对话和事件写入具备幂等键，避免重复提交；
- WebSocket 不可用时允许客户端退回普通消息请求。

## 7. 用户与多平台身份

业务主键使用内部 `user_id`，外部身份单独保存：

```text
users
  id

user_identities
  user_id
  provider        # email / phone / wechat / apple
  provider_user_id
  created_at
```

这样后续增加微信小程序时，只需把 `openid/unionid` 绑定到已有用户，不需要迁移业务数据。

## 8. 数据与语音策略

- PostgreSQL 保存结构化业务数据；
- 对象存储只保存确有必要的音频和资源；
- 首版默认不长期保存原始录音；
- ASR 完成后优先删除临时录音，只保存用户确认后的文本；
- 用户长期记忆必须可查看、修改、删除和暂停；
- 删除后的记忆不能再次进入模型上下文；
- 日志不得默认记录完整对话、Token、手机号、邮箱或原始音频地址。

## 9. PWA 边界

首版 PWA 支持：

- 安装到手机或电脑桌面；
- 静态壳和必要资源缓存；
- 新版本提示；
- 网络恢复后的安全重试。

首版 PWA 不承诺：

- 离线 AI 对话；
- 后台持续录音；
- 关闭页面后的长时间任务；
- 各手机系统一致的推送体验。

## 10. 小程序迁移约束

微信小程序只允许与已配置的域名通信，普通请求需 HTTPS、WebSocket 需 WSS；域名和证书需满足平台要求。因此：

- API 从首版开始使用标准 HTTPS/WSS；
- 不把关键通信绑定到浏览器 SSE；
- 不把认证绑定到浏览器 Cookie，API 同时支持 Bearer Token；
- 不依赖 DOM、浏览器专属语音识别或 Service Worker 完成核心业务；
- 音频上传、播放和通知经适配器调用；
- 后续小程序客户端可以使用 Taro + React，也可在需要时改用原生小程序，服务端不变。

## 11. App 迁移约束

后续 App 默认建议 React Native + Expo，但在真正进入 App 阶段时再复核：

- 复用 `contracts`、`domain` 和 API SDK；
- 重写页面和设备适配层；
- 使用 App 安全存储保存凭证；
- 使用原生录音、播放和通知模块；
- 服务端身份层增加 Apple/手机号等绑定方式。

## 12. 环境与密钥

环境分为：

- `development`：本地开发；
- `staging`：个人线上自测；
- `production`：正式环境。

密钥只通过环境变量注入，仓库只保存 `.env.example`。至少包括：

```text
APP_ENV
WEB_ORIGIN
API_BASE_URL
DATABASE_URL
CLOUDBASE_ENV_ID
CLOUDBASE_SECRET_ID
CLOUDBASE_SECRET_KEY
JWT_SECRET
LLM_API_BASE_URL
LLM_API_KEY
ASR_API_BASE_URL
ASR_API_KEY
TTS_API_BASE_URL
TTS_API_KEY
OBJECT_STORAGE_BUCKET
```

## 13. 第一阶段完成状态

已经确定：

- [x] 首发平台为 Web/PWA；
- [x] 后续增加微信小程序或 App；
- [x] Web 技术栈；
- [x] 平台无关 API 技术栈；
- [x] 数据库与对象存储方向；
- [x] 多平台身份模型；
- [x] 客户端适配层边界；
- [x] API 和密钥边界；
- [x] 仓库结构；

下一步：完成首发宠物 Persona 与系统提示词。

## 迁移到固定内容方案（3.5.3）

> 本节为阶段 3.5.3 的技术栈调整说明，只追加，不改写以上既有选型；对应数据结构见 [`DATA_MODEL_MIGRATION.md`](./DATA_MODEL_MIGRATION.md)。

1. **固定内容引擎替代 MockLLM**：运行时不再依赖生成式大模型。服务端新增“确定性意图匹配 + 白名单状态迁移”引擎（属 `packages/domain` 平台无关逻辑），按服务端下发的规则集（`fixed_rulesets`）执行 NFKC 规范化、短语/关键词匹配、阈值与分差校验，无匹配/低置信/冲突/否认均不推进。MockLLM 仅作开发期占位，正式链路由该引擎承担。
2. **LLM 适配器保留但默认关闭**：旧 LLM 适配器作为历史与实验资产保留，新增 `user_settings.llm_assist_enabled` 默认 `false`；即使未来开启，也只能作为非权威、可关闭的增强，其输出必须落回已声明的内容/意图/状态白名单，不得创造剧情、台词、译文、结果、记忆或世界状态，无 LLM 密钥时完整事件仍须运行。
3. **Web 仅作测试端**：本阶段 Web 定位为内容调试、状态机与接口自动化的测试端；不迁移旧 Web 正式主链路，正式入口（英文 UI 等历史测试能力）随迁移移除。微信小程序 / App 仍按既有适配器边界（`RecorderAdapter`/`AudioPlayerAdapter` 等）后续适配，本阶段不开发。
4. **客户端录音适配边界**：客户端适配层只负责录音、播放、缓存、通知与本地草稿；意图解析、迁移、结果写入、记忆白名单与版本校验一律在服务端。未确认 ASR 只用于转写审核，不进库、不进匹配；原始录音走临时桶，ASR 完成并经用户确认后即删，库内只存确认后文本与 `input_hash`。预制 TTS 音频按 normal/slow 绑定版本号缓存校验，TTS 缺失时降级为英文正文 + 人工译文展示，事件仍可完成。
