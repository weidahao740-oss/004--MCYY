# workspace 测试环境修复报告

> 日期：2026-10-09  
> 任务：T-P4.5-04X workspace 测试环境修复  
> 目标工程：`C:\004-MCYY\english-pet`  
> 最终状态：**completed / PASS（环境层）**

## 一、结论

F-10 workspace 包链接／解析阻塞已解除。`@english-pet/contracts`、`@english-pet/domain`、`@english-pet/ai`、`@english-pet/database` 现在可以被 Node 解析器、tsx 和 TypeScript 稳定解析；两个既有 smoke 均进入并完成业务断言；全 workspace typecheck 通过。

本结论只表示测试环境恢复，不表示 T04-I、T04-EC、T04-E1、T04-E2 或任何剧情／内容任务已完成。T04-EC 仍等待 T04-I，不得因本次环境修复而记为通过。

## 二、根因

项目的 workspace 声明、内部包 `package.json`、`exports`、源码目录和 `package-lock.json` 登记均存在。真正故障位于 Windows 当前安全环境与 npm 默认 workspace 链接形态的组合：

1. npm 把内部 workspace 包登记为 `node_modules/@english-pet/*` Junction。
2. 这些 Junction 由当前非提升进程创建，被 Windows RedirectionGuard 标记为不可信。
3. 访问 Junction 内的 `package.json` 时，文件 API 返回：`The path cannot be traversed because it contains an untrusted mount point.`
4. Node 与 tsx 因无法穿越该 Junction，表面表现为 `ERR_MODULE_NOT_FOUND`；TypeScript 随后产生 `TS2307` 和连带错误。
5. 临时 npm 工程验证表明，`npm install --install-links=true` 在本机仍创建 Junction，不能解决问题；普通 `mklink /J` 也同样不可穿越。目录符号链接需要管理员权限，不适合作为普通开发流程的可复现前置。

相关平台行为说明：Microsoft 对 RedirectionGuard 的公开说明指出，启用该缓解的进程只会跟随管理员创建或没有新信任元数据的 Junction：<https://www.microsoft.com/en-us/msrc/blog/2025/06/redirectionguard-mitigating-unsafe-junction-traversal-in-windows/>。

## 三、修复前证据

### 3.1 链接状态

- `node_modules/@english-pet/contracts`、`domain`、`ai`、`database`：`Directory, ReparsePoint`，`LinkType=Junction`。
- Junction 目标分别指向 `packages/contracts`、`packages/domain`、`packages/ai`、`packages/database`。
- 源目录中的 `package.json` 可直接读取；通过 Junction 读取时返回不可信挂载点错误。

### 3.2 解析和命令结果

- Node 对四个包：`MODULE_NOT_FOUND`。
- tsx 对四个包：`ERR_MODULE_NOT_FOUND`。
- `npx tsx apps/api/src/fixed-daily-topics.smoke.ts`：退出码 1，在加载 `sqlite-fixed-event-engine.ts` 时无法解析 `@english-pet/domain`，未进入业务断言。
- `npx tsx apps/api/src/memory-resurfacing-store.smoke.ts`：退出码 1，在加载 `memory-event-engine.ts` 时无法解析 `@english-pet/domain`，未进入业务断言。
- 历史全 workspace typecheck 先出现内部包 `TS2307`，其余为连带类型错误。

## 四、修复方式

采用项目内、最小且可复现的物化方案，不修改系统安全策略，不要求管理员权限，不关闭类型检查，也不改业务断言：

1. 新增 `english-pet/scripts/materialize-workspace-packages.mjs`。
2. 脚本逐一校验四个内部包的真实包名，再从 `packages/*` 复制到 `node_modules/@english-pet/*` 的临时目录，排除 `node_modules`、`dist`、`coverage`，最后原子替换为普通目录。
3. 根 `package.json` 新增：
   - `workspace:materialize`：手动刷新四个内部包。
   - `postinstall`：标准 `npm install` 后自动物化。
   - 根 `typecheck`：全 workspace 检查前先刷新物化目录。
4. `package-lock.json` 只新增根包 `hasInstallScript: true`，既有依赖版本与 workspace 登记保持不变。

该方案仍使用各内部包原有 `package.json` 和 `exports`，没有通过 `paths` 伪造解析，也没有跳过任何 workspace。开发中的源码变更在根 typecheck 前会自动刷新；依赖重装后由 `postinstall` 自动恢复。

## 五、改动文件

- `english-pet/package.json`
- `english-pet/package-lock.json`
- `english-pet/scripts/materialize-workspace-packages.mjs`
- `任务看板/T-P4.5-04X-workspace测试环境修复.md`
- `成人英语AI宠物-项目执行计划.md`（只合并 T04-X 状态，保留并行的 P4-T06-08 更新）
- `workspace测试环境修复报告-20261009.md`

没有修改应用业务源码、内部包业务源码、tsconfig、smoke 断言、剧情正文、台词、教学、语音、词库、UI 或视觉文件。

## 六、修复后验证

### 6.1 可复现安装

执行：

`npm install --no-audit --no-fund`

结果：退出码 0；根 `postinstall` 自动物化四个内部包；物化后四个目标均为普通 `Directory`，不是 ReparsePoint，且可读取 `package.json`。lockfile 的依赖版本没有漂移，唯一结构性变化为根包 `hasInstallScript: true`。

### 6.2 Node、tsx 与 TypeScript 解析

- Node `import.meta.resolve`：四个内部包全部退出码 0，解析到对应 `node_modules/@english-pet/*/src/index.ts`。
- tsx 动态导入：四个内部包全部成功。
- TypeScript：API 与 domain 的 `--traceResolution` 显示内部包成功解析；相关 `tsc` 均退出码 0。

说明：Node 已能完成包解析；由于包入口是 TypeScript 源文件，直接用纯 Node 执行入口会受 Node“不在 node_modules 内剥离 TypeScript 类型”的运行限制，因此运行能力由项目既定的 tsx 承担。这与修复目标中的 Node 解析、tsx 执行分工一致。

### 6.3 两个既有 smoke

1. `npx tsx apps/api/src/fixed-daily-topics.smoke.ts`
   - 退出码：0
   - 结果：`ok: true`
   - 完成 10 项业务检查，`dailyTopicCount: 10`
   - stderr 仅有 Node SQLite experimental warning，不影响断言。
2. `npx tsx apps/api/src/memory-resurfacing-store.smoke.ts`
   - 退出码：0
   - 结果：`ok: true`
   - 完成 8 项业务检查。

### 6.4 全 workspace typecheck

执行：

`npm run typecheck`

结果：退出码 0。依次完成 API、Web、ai、contracts、database、domain 的 TypeScript 检查，没有 `TS2307`，也没有暴露新的业务类型错误。

## 七、残余问题与下一步

- 本次没有残余环境阻塞。
- 根 `node_modules` 仍是生成目录；如果单独运行某个子 workspace 命令且同时绕过根脚本，先在根目录执行 `npm run workspace:materialize`。标准 `npm install` 和根 `npm run typecheck` 已自动处理。
- T04-I 仍是 `not-started（已解锁未启动）`。
- T04-EC 仍是 `blocked`，现在只剩等待 T04-I；没有执行或通过 T04-EC。
- T04-E1、T04-E2 继续等待各自既定前置；本报告不改变剧情、内容、台词、教学、语音或词库状态。

## 八、交付自检

- 报告与变更文件使用严格 UTF-8。
- 报告包含根因、改动文件、命令、修复前结果、修复后结果、残余问题和下一步。
- 未使用待替换占位符。
- 唯一状态源只合并 T04-X completed，保留并行 P4-T06-08 的现行 partial 状态。
- Git 差异范围将按 T04-X 允许清单核对；不得把并行剧情差异归入本任务。
