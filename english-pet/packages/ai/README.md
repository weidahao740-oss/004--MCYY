# @english-pet/ai

Morrow 的 AI / ASR / TTS 适配层。业务层只依赖统一接口，切换供应商只改环境变量与实现类。

## 目录

```
src/
├── types.ts            # 公共类型与 AdapterError
├── validation.ts       # Zod Schema（对齐 PET_SYSTEM_PROMPT.md morrow-reply-1.0）
├── degradation.ts      # LLM/ASR/TTS 失败降级，绝不抛未捕获异常
├── llm/                # adapter 接口 + OpenAI 兼容实现 + Mock
├── asr/                # adapter 接口（返回可编辑 text + confidence）+ Mock
├── tts/                # adapter 接口（支持语速 speed）+ Mock
└── examples/           # 四个可运行 demo
```

## 环境变量

| 变量 | 用途 |
|---|---|
| `LLM_API_BASE_URL` | 对话模型 OpenAI 兼容 base_url（如 `https://api.deepseek.com/v1`） |
| `LLM_API_KEY` | 对话模型密钥 |
| `LLM_MODEL` | 模型名（如 `deepseek-v4-flash` / `gpt-4o-mini`） |
| `DASHSCOPE_API_KEY` | 阿里云百炼密钥，仅服务端使用；启用 `QwenASR` |
| `QWEN_ASR_BASE_URL` | 千问 ASR OpenAI 兼容 base URL，默认 `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| `QWEN_ASR_MODEL` | 默认 `qwen3-asr-flash` |
| `ASR_API_BASE_URL` | 其他 ASR 的 OpenAI multipart 兼容端点（不用于千问 ASR） |
| `ASR_API_KEY` | 其他 ASR 兼容端点密钥 |
| `ASR_MODEL` | 其他 ASR 模型名 |
| `TTS_API_BASE_URL` | TTS 兼容端点 |
| `TTS_API_KEY` | TTS 密钥 |
| `TTS_MODEL` | TTS 模型名，默认 `tts-1` |
| `TTS_VOICE` | 音色名 |
| `TTS_SPEED` | 语速，默认 `1`（0.5~2.0） |

未配置真实密钥时，直接用 `MockLLM` / `MockASR` / `MockTTS` 运行 demo，零成本。

## 运行 demo（无需密钥）

在 `packages/ai` 目录下：

```bash
npx tsx src/examples/demo-llm.ts          # 完整对话 + Schema 校验 + 记忆提案
npx tsx src/examples/demo-asr.ts          # Mock 可编辑转写 + 置信度 + 低置信度提示
npm run validate:qwen-asr                 # 真实批测 voice-test 下 10 条 WAV；需临时提供 DASHSCOPE_API_KEY
npx tsx src/examples/demo-tts.ts          # 语速参数 + 静音 WAV 落盘 + 失败降级
npx tsx src/examples/demo-full-event.ts    # 完整事件调用链（含一次故意 ASR 失败降级）
```

## 切换到真实供应商

```ts
import { OpenAICompatibleLLM } from './llm/openai-compatible.js'

// 只要环境变量配齐，无需改业务代码：
const llm = new OpenAICompatibleLLM()           // 读 LLM_API_BASE_URL / LLM_API_KEY / LLM_MODEL
// 或显式指定：
const kimi = new OpenAICompatibleLLM({
  baseUrl: 'https://api.moonshot.cn/v1',
  apiKey: process.env.KIMI_KEY!,
  model: 'kimi-k2.6',
})
```

LLM 输出必须经 `parseMorrowReply()` 校验后才进入业务层；推荐统一走 `safeComplete()`，
它会在超时 / JSON 非法 / Schema 拒绝时自动重试一次并回退到安全文字。

## 边界

- Mock 实现不得用于生产；
- 真实 API 的角色一致性、ASR 准确率、TTS 音色主观质量与端到端延迟，
  必须在拿到真实密钥与音频样本后另行验证（见 `AI_TECH_EVALUATION.md` 的证据门清单）。
