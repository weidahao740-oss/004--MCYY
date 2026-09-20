# 千问 Qwen3-ASR-Flash 真实验收记录

> 项目：Morrow 成人英语 AI 宠物  
> 测试日期：2026-09-19  
> 测试对象：`voice-test/samples/asr_01.wav`—`asr_10.wav`  
> 模型：`qwen3-asr-flash`  
> 结论：**本批 10 条标准录音全部转写成功，标准化词错误率 WER = 0；千问通过当前样本门槛，暂不测试豆包。**

## 1. 测试设置

- 接口：阿里云百炼 OpenAI 兼容 `chat/completions`；
- 输入：本地 WAV 读取后编码为 `data:audio/wav;base64,...`；
- `language=en`；`enable_itn=false`；`stream=false`；
- API Key 只在测试进程临时注入，未写入项目文件、结果文件或环境配置；
- 对照文本：`voice-test/录音原稿.txt`；
- 评分：统一大小写与弯/直撇号，忽略标点后计算词级 Levenshtein 距离和 WER。

## 2. 汇总结果

| 指标 | 结果 |
|---|---:|
| 成功请求 | 10/10 |
| 标准化完全一致 | 10/10 |
| 对照词数 | 107 |
| 词错误数 | 0 |
| 总体 WER | 0.00% |
| 平均延迟 | 0.404 秒 |
| 中位延迟 | 0.364 秒 |
| P95 延迟 | 0.606 秒 |
| 最小 / 最大延迟 | 0.327 / 0.763 秒 |

## 3. 逐条结果

| 文件 | 转写结果 | WER | 延迟 |
|---|---|---:|---:|
| `asr_01.wav` | Hello, Morrow. I can help you understand this room. | 0% | 0.763s |
| `asr_02.wav` | I think the letter means we should leave a sign by the door. | 0% | 0.374s |
| `asr_03.wav` | Let's bring back the lamp near the window first. | 0% | 0.364s |
| `asr_04.wav` | I'd rather choose the small kettle because the room feels cold. | 0% | 0.350s |
| `asr_05.wav` | What I meant was that I need some quiet time, after work. | 0% | 0.415s |
| `asr_06.wav` | We can't go outside unless the road becomes quiet. | 0% | 0.333s |
| `asr_07.wav` | If the wind stops, we can walk to the mailbox together. | 0% | 0.411s |
| `asr_08.wav` | The hardest part of my day was a long meeting at work. | 0% | 0.364s |
| `asr_09.wav` | I put the letter on the narrow shelf beside the door. | 0% | 0.338s |
| `asr_10.wav` | Tomorrow morning, I need to leave home at seven thirty. | 0% | 0.327s |

## 4. 关键内容保真

- 否定与条件词保真：`can’t`、`unless`、`if` 均正确；
- 时间表达保真：`tomorrow morning`、`seven thirty` 正确；
- 场景实体保真：`Morrow`、`letter`、`lamp`、`kettle`、`mailbox`、`narrow shelf` 正确；
- 第 5 条仅多一个逗号，标准化词序与词内容完全一致，不计词错误；
- 当前响应没有可靠的 0—1 数值置信度，因此工程返回 `confidence=null`，前端统一要求用户检查并确认可编辑转写，不伪造置信度。

## 5. 工程落地

- 新增 `english-pet/packages/ai/src/asr/qwen.ts`：千问专用适配器；
- 新增 `english-pet/packages/ai/src/examples/validate-qwen-asr.ts`：10 条批测与 WER 计算；
- 新增命令：`npm run validate:qwen-asr --workspace @english-pet/ai`；
- API 服务检测到 `DASHSCOPE_API_KEY` 时使用真实千问，未配置时保留 Mock 开发模式；
- 前端显示实际 ASR 供应商；无置信度时显示“请人工确认”；
- 原始机器结果：`voice-test/qwen-asr-results.json`。

## 6. 判定与下一步

**判定：通过。** 当前 10 条标准录音已足以证明 `qwen3-asr-flash` 能稳定接收项目样本、快速返回并准确转写；按单供应商达标即采用的既定策略，不启动豆包 ASR 备选测试。

下一步不再补做别的音频格式方案：由开发者使用 Seed Audio 1.0 生成 Morrow 候选样音，人工试听确定参考音色、情绪边界与 normal/slow 规则，然后再批量制作固定台词预制语音。

## 7. 公开接口依据

- [Qwen-ASR API 调用方式及参数](https://help.aliyun.com/zh/model-studio/qwen-asr-api-reference)
- [非实时语音识别与音频限制](https://help.aliyun.com/zh/model-studio/qwen-speech-recognition)
