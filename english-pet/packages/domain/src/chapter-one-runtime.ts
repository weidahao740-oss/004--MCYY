import type { FixedContentLine, FixedEvent, FixedEventType, FixedWorldStateWrite } from '@english-pet/contracts'

/** 第一章现行运行配置。唯一正文依据：CHAPTER_01_BIRTH_CONTENT.md v1.14.2。 */
export const CHAPTER_ONE_ID = 'chapter_01_birth'
export const RETIRED_BIRTH_EVENT_IDS = ['birth_restore_object_v1', 'b1_tomorrow_plan_v1'] as const
export const CHAPTER_ONE_MAINLINE_IDS = [
  'birth_first_voice_v1', 'b1_first_room_object_v1', 'b1_remember_name_v1',
  'b1_window_light_v1', 'b1_what_i_like_v1', 'b1_next_small_plan_v1',
  'b1_ready_for_outside_v1',
] as const

export interface ChapterOneRuntimeSpec {
  id: string
  sequence: number
  eventType: FixedEventType
  prerequisiteEventIds: string[]
  requiredWorldState: Record<string, readonly (string | number | boolean)[]>
  completionStateKeys: string[]
  coreExchangeCount: number
  chapterHardGate: boolean
  blocksChapterCompletion: boolean
  learningDomains: readonly string[]
}

export const chapterOneRuntimeSpecs: readonly ChapterOneRuntimeSpec[] = [
  { id: 'birth_first_voice_v1', sequence: 1, eventType: 'mainline', prerequisiteEventIds: [], requiredWorldState: {}, completionStateKeys: ['first_response_style'], coreExchangeCount: 1, chapterHardGate: true, blocksChapterCompletion: true, learningDomains: ['D1'] },
  { id: 'b1_first_room_object_v1', sequence: 2, eventType: 'mainline', prerequisiteEventIds: ['birth_first_voice_v1'], requiredWorldState: { first_response_style: ['reassuring_presence', 'friendly_greeting', 'identity_check'] }, completionStateKeys: ['first_shared_object'], coreExchangeCount: 2, chapterHardGate: true, blocksChapterCompletion: true, learningDomains: ['D1'] },
  { id: 'b1_remember_name_v1', sequence: 3, eventType: 'mainline', prerequisiteEventIds: ['b1_first_room_object_v1'], requiredWorldState: { first_shared_object: ['lamp', 'plant', 'small_bell'] }, completionStateKeys: ['morrow_self_address'], coreExchangeCount: 2, chapterHardGate: true, blocksChapterCompletion: true, learningDomains: ['D1'] },
  { id: 'b1_first_feeling_v1', sequence: 4, eventType: 'daily', prerequisiteEventIds: ['b1_remember_name_v1'], requiredWorldState: { morrow_self_address: ['morrow'] }, completionStateKeys: ['b1_first_feeling_status'], coreExchangeCount: 1, chapterHardGate: false, blocksChapterCompletion: false, learningDomains: ['D1'] },
  { id: 'b1_window_light_v1', sequence: 5, eventType: 'mainline', prerequisiteEventIds: ['b1_remember_name_v1'], requiredWorldState: { morrow_self_address: ['morrow'] }, completionStateKeys: ['b1_window_light_status'], coreExchangeCount: 2, chapterHardGate: true, blocksChapterCompletion: true, learningDomains: ['D1'] },
  { id: 'b1_first_letter_v1', sequence: 6, eventType: 'daily', prerequisiteEventIds: ['b1_window_light_v1'], requiredWorldState: { b1_window_light_status: ['completed'] }, completionStateKeys: ['b1_first_letter_status'], coreExchangeCount: 1, chapterHardGate: false, blocksChapterCompletion: false, learningDomains: ['D1'] },
  { id: 'b1_bell_sound_v1', sequence: 7, eventType: 'daily', prerequisiteEventIds: ['b1_window_light_v1'], requiredWorldState: { b1_window_light_status: ['completed'] }, completionStateKeys: ['b1_bell_sound_status'], coreExchangeCount: 1, chapterHardGate: false, blocksChapterCompletion: false, learningDomains: ['D1'] },
  { id: 'b1_ask_about_you_v1', sequence: 8, eventType: 'daily', prerequisiteEventIds: ['b1_remember_name_v1'], requiredWorldState: { morrow_self_address: ['morrow'] }, completionStateKeys: ['b1_ask_about_you_status'], coreExchangeCount: 1, chapterHardGate: false, blocksChapterCompletion: false, learningDomains: ['D1'] },
  { id: 'b1_what_i_like_v1', sequence: 9, eventType: 'mainline', prerequisiteEventIds: ['b1_window_light_v1'], requiredWorldState: { b1_window_light_status: ['completed'] }, completionStateKeys: ['b1_what_i_like_status'], coreExchangeCount: 2, chapterHardGate: true, blocksChapterCompletion: true, learningDomains: ['D1'] },
  { id: 'b1_next_small_plan_v1', sequence: 10, eventType: 'mainline', prerequisiteEventIds: ['b1_what_i_like_v1'], requiredWorldState: { b1_what_i_like_status: ['completed'] }, completionStateKeys: ['next_small_plan', 'b1_next_small_plan_status'], coreExchangeCount: 2, chapterHardGate: true, blocksChapterCompletion: true, learningDomains: ['D1'] },
  { id: 'b1_return_first_words_v1', sequence: 11, eventType: 'recall', prerequisiteEventIds: ['birth_first_voice_v1'], requiredWorldState: { first_response_style: ['reassuring_presence', 'friendly_greeting', 'identity_check'] }, completionStateKeys: ['b1_return_first_words_status'], coreExchangeCount: 1, chapterHardGate: false, blocksChapterCompletion: false, learningDomains: ['D1'] },
  { id: 'b1_ready_for_outside_v1', sequence: 12, eventType: 'mainline', prerequisiteEventIds: ['b1_next_small_plan_v1'], requiredWorldState: { b1_next_small_plan_status: ['completed'] }, completionStateKeys: ['b1_ready_for_outside_status'], coreExchangeCount: 2, chapterHardGate: true, blocksChapterCompletion: true, learningDomains: ['D1'] },
  { id: 'b1_first_thank_you_v1', sequence: 13, eventType: 'daily', prerequisiteEventIds: ['b1_next_small_plan_v1'], requiredWorldState: { b1_next_small_plan_status: ['completed'] }, completionStateKeys: ['b1_first_thank_you_status'], coreExchangeCount: 1, chapterHardGate: false, blocksChapterCompletion: false, learningDomains: ['D1'] },
] as const
export const chapterOneRuntimeSpecById = new Map(chapterOneRuntimeSpecs.map((spec) => [spec.id, spec] as const))

function line(id: string, purpose: FixedContentLine['purpose'], english: string, textZh: string): FixedContentLine {
  return { id, speaker: purpose === 'reference_reply' ? 'system_example' : 'morrow', purpose, learningContent: { contentId: `${id}_content`, textVersion: '1.0.0', english, translation: { textZh, version: '1.0.0', status: 'manual_reviewed', reviewedBy: 'content_owner' } }, audioRequired: false, audioIds: [] }
}

const boundaries = [
  '所有必需用户表达只能通过真实录音后的 confirmed_asr_text、服务端一次性 ASR proof、确定性匹配、识别展示与用户确认完成；点击或客户端自造字段不能代替。',
  '中文意图选择只决定路线，不产生英语证据；运行配置不提供可直接提交正式表达 intent 的点击选项。',
  '暂停只保存最近检查点，不写正式世界状态、不完成事件、不生成记忆提案。',
  '长期记忆独立可选确认；拒绝、删除或暂停长期记忆不影响事件、章节完成或课程证据回访。',
  '本配置不代表正式语音、视觉或完整冻结 UI 已完成。',
]

interface Route {
  suffix: string
  english: string
  zh: string
  feedbackEnglish: string
  feedbackZh: string
  writes?: FixedWorldStateWrite[]
  aliases?: string[]
}
interface EventOptions {
  id: string; version: string; sequence: number; type: FixedEventType; title: string; prerequisites: string[]
  routes: Route[]; second?: { english: string; zh: string }; statusKey: string
  openEnglish: string; openZh: string; closeEnglish: string; closeZh: string; memoryText?: string
}

function eventFromAuthority(options: EventOptions): FixedEvent {
  const p = `c1e${options.sequence}`
  const daily = options.type === 'daily'
  const recall = options.type === 'recall'
  const continueId = `${p}_intent_continue`
  const secondId = `${p}_intent_second`
  const selectIntents = options.routes.map((route) => ({ id: `${p}_select_${route.suffix}`, labelZh: route.zh, eligibleStateIds: [`${p}_route`], priority: 500, exactPhrases: [`select ${route.suffix}`], keywordGroups: [], excludedPhrases: [], minimumScore: 100, requiredMarginOverSecond: 0 }))
  const expressionIntents = options.routes.map((route) => ({ id: `${p}_intent_${route.suffix}`, labelZh: route.zh, eligibleStateIds: [`${p}_input_${route.suffix}`], priority: 300, exactPhrases: [route.english, ...(route.aliases ?? [])], keywordGroups: [], excludedPhrases: [], minimumScore: 100, requiredMarginOverSecond: 0 }))
  const routeLines = options.routes.map((route) => line(`${p}_${route.suffix}_line`, 'reference_reply', route.english, route.zh))
  const feedbackLines = options.routes.map((route) => line(`${p}_${route.suffix}_feedback`, 'result', route.feedbackEnglish, route.feedbackZh))
  const outcomes = options.routes.map((route) => ({ id: `${p}_outcome_${route.suffix}`, labelZh: route.zh, worldStateWrites: [...(route.writes ?? []), ...(route.writes?.some((write) => write.key === options.statusKey) ? [] : [{ key: options.statusKey, value: 'completed' }])], resultLineIds: [feedbackLines[options.routes.indexOf(route)]!.id], futureHook: null }))
  return {
    id: options.id, version: options.version, chapterId: CHAPTER_ONE_ID, sequence: options.sequence, eventType: options.type,
    prerequisiteEventIds: options.prerequisites, triggerMode: recall ? 'recall_background' : daily ? 'daily_environment' : 'mainline_invitation', triggerStrength: recall ? 'background_gentle' : daily ? 'ambient_hint' : 'direct_invitation', dailyCooldownHours: daily ? 24 : null,
    newContentBudget: recall ? { introducesNewContent: false, newLearningObjectCount: 0, newCoreExpressionCount: 0 } : { introducesNewContent: true, newLearningObjectCount: options.second ? 2 : 1, newCoreExpressionCount: options.second ? 2 : 1 },
    recallSourceTypes: recall ? ['legacy_expression'] : [], recallSemanticTags: recall ? ['birth_first_voice_v1', 'first_response_style'] : [], titleZh: options.title, estimatedMinutes: { min: daily || recall ? 2 : 4, max: daily || recall ? 4 : 6 }, entryStateId: `${p}_open`,
    lines: [line(`${p}_open_line`, 'story', options.openEnglish, options.openZh), ...routeLines, ...feedbackLines, ...(options.second ? [line(`${p}_second_line`, 'prompt', options.second.english, options.second.zh)] : []), line(`${p}_close_line`, 'result', options.closeEnglish, options.closeZh)],
    intents: [...selectIntents, ...expressionIntents, ...(options.second ? [{ id: secondId, labelZh: options.second.zh, eligibleStateIds: options.routes.map((route) => `${p}_second_${route.suffix}`), priority: 300, exactPhrases: [options.second.english], keywordGroups: [], excludedPhrases: [], minimumScore: 100, requiredMarginOverSecond: 0 }] : []), { id: continueId, labelZh: '继续', eligibleStateIds: [`${p}_open`, ...options.routes.map((route) => `${p}_feedback_${route.suffix}`), `${p}_result`], priority: 100, exactPhrases: ['continue'], keywordGroups: [], excludedPhrases: [], minimumScore: 100, requiredMarginOverSecond: 0 }],
    states: [
      { id: `${p}_open`, phase: 'opening', uiTitleZh: options.title, userTaskZh: '听完情境后继续。', lineIds: [`${p}_open_line`], acceptedInputModes: ['continue', 'choice'], choices: [{ id: `${p}_choice_open`, labelZh: '继续', submitsIntentId: continueId, referenceReplyLineId: null }], referenceReplyLineIds: [], recoverable: true, checkpoint: true, advanceOnlyOnResolvedIntent: true },
      { id: `${p}_route`, phase: 'choice', uiTitleZh: '选择你想表达的中文意思', userTaskZh: '中文选择只确定路线，不产生英语证据或正式状态。', lineIds: [`${p}_open_line`], acceptedInputModes: ['choice'], choices: options.routes.map((route) => ({ id: `${p}_choice_${route.suffix}`, labelZh: route.zh, submitsIntentId: `${p}_select_${route.suffix}`, referenceReplyLineId: null })), referenceReplyLineIds: [], recoverable: true, checkpoint: true, advanceOnlyOnResolvedIntent: true },
      ...options.routes.map((route, index) => ({ id: `${p}_input_${route.suffix}`, phase: 'input' as const, uiTitleZh: '真实英语交流', userTaskZh: `只完成所选路线：“${route.zh}”的真实录音、识别与确认。`, lineIds: [routeLines[index]!.id], acceptedInputModes: ['confirmed_asr_text' as const], choices: [], referenceReplyLineIds: [routeLines[index]!.id], recoverable: true as const, checkpoint: true, advanceOnlyOnResolvedIntent: true as const })),
      ...options.routes.map((route, index) => ({ id: `${p}_feedback_${route.suffix}`, phase: 'result' as const, uiTitleZh: '墨洛的分支回应', userTaskZh: options.second ? '听完所选路线的回应后，继续第二次交流。' : '听完所选路线的回应后，继续共同收束。', lineIds: [feedbackLines[index]!.id], acceptedInputModes: ['continue' as const, 'choice' as const], choices: [{ id: `${p}_choice_feedback_${route.suffix}`, labelZh: '继续', submitsIntentId: continueId, referenceReplyLineId: null }], referenceReplyLineIds: [], recoverable: true as const, checkpoint: true, advanceOnlyOnResolvedIntent: true as const })),
      ...(options.second ? options.routes.map((route) => ({ id: `${p}_second_${route.suffix}`, phase: 'input' as const, uiTitleZh: '第二次真实英语交流', userTaskZh: '必须完成第二次独立录音、识别并确认。', lineIds: [`${p}_second_line`], acceptedInputModes: ['confirmed_asr_text' as const], choices: [], referenceReplyLineIds: [], recoverable: true as const, checkpoint: true, advanceOnlyOnResolvedIntent: true as const })) : []),
      { id: `${p}_result`, phase: 'result', uiTitleZh: '共同收束', userTaskZh: '听完事件专属收束后完成。', lineIds: [`${p}_close_line`], acceptedInputModes: ['continue', 'choice'], choices: [{ id: `${p}_choice_finish`, labelZh: '完成', submitsIntentId: continueId, referenceReplyLineId: null }], referenceReplyLineIds: [], recoverable: true, checkpoint: true, advanceOnlyOnResolvedIntent: true },
    ],
    transitions: [
      { id: `${p}_open_continue`, fromStateId: `${p}_open`, toStateId: `${p}_route`, onIntentIds: [continueId], guard: '用户明确继续。', outcomeId: null },
      ...options.routes.map((route) => ({ id: `${p}_select_${route.suffix}_route`, fromStateId: `${p}_route`, toStateId: `${p}_input_${route.suffix}`, onIntentIds: [`${p}_select_${route.suffix}`], guard: '只保存临时中文路线，不写英语证据或正式世界状态。', outcomeId: null })),
      ...options.routes.map((route) => ({ id: `${p}_${route.suffix}_done`, fromStateId: `${p}_input_${route.suffix}`, toStateId: `${p}_feedback_${route.suffix}`, onIntentIds: [`${p}_intent_${route.suffix}`], guard: '所选路线的服务端 ASR proof 有效且唯一匹配。', outcomeId: `${p}_outcome_${route.suffix}` })),
      ...options.routes.map((route) => ({ id: `${p}_${route.suffix}_feedback_done`, fromStateId: `${p}_feedback_${route.suffix}`, toStateId: options.second ? `${p}_second_${route.suffix}` : `${p}_result`, onIntentIds: [continueId], guard: '所选路线专属反馈已播放。', outcomeId: null })),
      ...(options.second ? options.routes.map((route) => ({ id: `${p}_second_${route.suffix}_done`, fromStateId: `${p}_second_${route.suffix}`, toStateId: `${p}_result`, onIntentIds: [secondId], guard: '第二次服务端 ASR proof 有效且唯一匹配。', outcomeId: null })) : []),
      { id: `${p}_finish`, fromStateId: `${p}_result`, toStateId: 'completed', onIntentIds: [continueId], guard: '事件专属收束完成后幂等结算。', outcomeId: null },
    ], outcomes,
    memoryRules: options.memoryText ? [{ id: `${p}_relationship_memory`, kind: 'relationship', origin: 'declared_event_rule', sourceIntentIds: expressionIntents.map((intent) => intent.id), contentTemplate: options.memoryText, requiresUserConfirmation: true, rejectIfSensitiveInferredOrUnconfirmed: true }] : [], boundariesZh: boundaries,
  }
}

function e01_01(): FixedEvent {
  const p = 'c1e1'
  const routes = [
    { suffix: 'presence', english: "Yes, I'm here.", aliases: ['Yes, I am here.'], zh: '告诉墨洛：我在这里', feedback: "Oh, good. I'm Morrow. I wasn't sure anyone was there.", feedbackZh: '太好了。我叫墨洛。刚才我还不确定这里有没有人。', style: 'reassuring_presence' },
    { suffix: 'greeting', english: 'Hi. I can hear you.', aliases: [], zh: '友好地回应墨洛', feedback: "Hi. I'm Morrow. I'm glad you answered.", feedbackZh: '你好，我叫墨洛。很高兴你回应了我。', style: 'friendly_greeting' },
    { suffix: 'identity', english: 'Who are you?', aliases: [], zh: '先问问对方是谁', feedback: "I'm Morrow. I just woke up. That's about all I know for now.", feedbackZh: '我叫墨洛。我刚醒来。现在我知道的差不多就这些。', style: 'identity_check' },
  ]
  const continueIntent = `${p}_intent_continue`
  return {
    id: 'birth_first_voice_v1', version: '1.1.1', chapterId: CHAPTER_ONE_ID, sequence: 1, eventType: 'mainline', prerequisiteEventIds: [], triggerMode: 'mainline_invitation', triggerStrength: 'direct_invitation', dailyCooldownHours: null,
    newContentBudget: { introducesNewContent: true, newLearningObjectCount: 3, newCoreExpressionCount: 1 }, recallSourceTypes: [], recallSemanticTags: [], titleZh: '苏醒后的第一句话', estimatedMinutes: { min: 2, max: 4 }, entryStateId: `${p}_open`,
    lines: [line(`${p}_open_line`, 'story', 'Hello? Is someone there?', '你好？有人在吗？'), ...routes.flatMap((route) => [line(`${p}_${route.suffix}_target`, 'reference_reply', route.english, route.zh), line(`${p}_${route.suffix}_feedback`, 'result', route.feedback, route.feedbackZh)]), line(`${p}_close_line`, 'result', 'Everything here feels new. Will you look around with me?', '这里的一切对我来说都很陌生。你愿意陪我看看周围吗？')],
    intents: [
      ...routes.map((route) => ({ id: `${p}_select_${route.suffix}`, labelZh: route.zh, eligibleStateIds: [`${p}_route`], priority: 500, exactPhrases: [`select ${route.suffix}`], keywordGroups: [], excludedPhrases: [], minimumScore: 100, requiredMarginOverSecond: 0 })),
      ...routes.map((route) => ({ id: `${p}_intent_${route.suffix}`, labelZh: route.zh, eligibleStateIds: [`${p}_input_${route.suffix}`], priority: 300, exactPhrases: [route.english, ...route.aliases], keywordGroups: [], excludedPhrases: [], minimumScore: 100, requiredMarginOverSecond: 0 })),
      { id: continueIntent, labelZh: '继续', eligibleStateIds: [`${p}_open`, ...routes.map((route) => `${p}_feedback_${route.suffix}`), `${p}_result`], priority: 100, exactPhrases: ['continue'], keywordGroups: [], excludedPhrases: [], minimumScore: 100, requiredMarginOverSecond: 0 },
    ],
    states: [
      { id: `${p}_open`, phase: 'opening', uiTitleZh: '苏醒后的第一句话', userTaskZh: '听见墨洛试探着确认有没有人回应。', lineIds: [`${p}_open_line`], acceptedInputModes: ['continue', 'choice'], choices: [{ id: `${p}_choice_open`, labelZh: '回应墨洛', submitsIntentId: continueIntent, referenceReplyLineId: null }], referenceReplyLineIds: [], recoverable: true, checkpoint: true, advanceOnlyOnResolvedIntent: true },
      { id: `${p}_route`, phase: 'choice', uiTitleZh: '选择中文回应意图', userTaskZh: '中文选择只锁定本次英语路线，不产生英语证据。', lineIds: [`${p}_open_line`], acceptedInputModes: ['choice'], choices: routes.map((route) => ({ id: `${p}_choice_${route.suffix}`, labelZh: route.zh, submitsIntentId: `${p}_select_${route.suffix}`, referenceReplyLineId: null })), referenceReplyLineIds: [], recoverable: true, checkpoint: true, advanceOnlyOnResolvedIntent: true },
      ...routes.map((route) => ({ id: `${p}_input_${route.suffix}`, phase: 'input' as const, uiTitleZh: '第一次真实英语表达', userTaskZh: `只完成所选路线：“${route.zh}”的真实录音、识别与确认。`, lineIds: [`${p}_${route.suffix}_target`], acceptedInputModes: ['confirmed_asr_text' as const], choices: [], referenceReplyLineIds: [`${p}_${route.suffix}_target`], recoverable: true as const, checkpoint: true, advanceOnlyOnResolvedIntent: true as const })),
      ...routes.map((route) => ({ id: `${p}_feedback_${route.suffix}`, phase: 'result' as const, uiTitleZh: '墨洛的专属回应', userTaskZh: '听完所选路线的固定回应后进入共同收束。', lineIds: [`${p}_${route.suffix}_feedback`], acceptedInputModes: ['continue' as const, 'choice' as const], choices: [{ id: `${p}_choice_feedback_${route.suffix}`, labelZh: '继续', submitsIntentId: continueIntent, referenceReplyLineId: null }], referenceReplyLineIds: [], recoverable: true as const, checkpoint: true, advanceOnlyOnResolvedIntent: true as const })),
      { id: `${p}_result`, phase: 'result', uiTitleZh: '共同收束', userTaskZh: '听完共同收束后完成，正式状态此时才结算。', lineIds: [`${p}_close_line`], acceptedInputModes: ['continue', 'choice'], choices: [{ id: `${p}_choice_finish`, labelZh: '陪墨洛看看房间', submitsIntentId: continueIntent, referenceReplyLineId: null }], referenceReplyLineIds: [], recoverable: true, checkpoint: true, advanceOnlyOnResolvedIntent: true },
    ],
    transitions: [
      { id: `${p}_open_continue`, fromStateId: `${p}_open`, toStateId: `${p}_route`, onIntentIds: [continueIntent], guard: '开场完成。', outcomeId: null },
      ...routes.map((route) => ({ id: `${p}_select_${route.suffix}`, fromStateId: `${p}_route`, toStateId: `${p}_input_${route.suffix}`, onIntentIds: [`${p}_select_${route.suffix}`], guard: '临时中文意图选择。', outcomeId: null })),
      ...routes.map((route) => ({ id: `${p}_${route.suffix}_done`, fromStateId: `${p}_input_${route.suffix}`, toStateId: `${p}_feedback_${route.suffix}`, onIntentIds: [`${p}_intent_${route.suffix}`], guard: '路线专属 proof 有效并唯一匹配。', outcomeId: `${p}_outcome_${route.suffix}` })),
      ...routes.map((route) => ({ id: `${p}_${route.suffix}_feedback_done`, fromStateId: `${p}_feedback_${route.suffix}`, toStateId: `${p}_result`, onIntentIds: [continueIntent], guard: '路线专属固定反馈已播放。', outcomeId: null })),
      { id: `${p}_finish`, fromStateId: `${p}_result`, toStateId: 'completed', onIntentIds: [continueIntent], guard: '共同收束完成后才写正式状态。', outcomeId: null },
    ],
    outcomes: routes.map((route) => ({ id: `${p}_outcome_${route.suffix}`, labelZh: route.zh, worldStateWrites: [{ key: 'first_response_style', value: route.style }], resultLineIds: [`${p}_${route.suffix}_feedback`], futureHook: '只记录已确认回应方式，不解释为性格。' })),
    memoryRules: [{ id: 'bfv_relationship_memory', kind: 'relationship', origin: 'declared_event_rule', sourceIntentIds: routes.map((route) => `${p}_intent_${route.suffix}`), contentTemplate: '你和墨洛完成了第一次相互理解。', requiresUserConfirmation: true, rejectIfSensitiveInferredOrUnconfirmed: true }], boundariesZh: boundaries,
  }
}

function e01_02(): FixedEvent {
  const p = 'c1e2'
  const routes = [
    { suffix: 'lamp', english: 'I noticed the lamp first.', zh: '我第一眼注意到的是那盏灯。', object: 'lamp', userFeedback: 'You noticed the lamp first. I think I\'ll sit near it for a while.', userFeedbackZh: '你先注意到了那盏灯。我想在它附近坐一会儿。', morrow: 'I noticed the plant first. Its leaves caught my eye.', morrowZh: '我先注意到的是那株植物。它的叶子吸引了我的注意。' },
    { suffix: 'plant', english: 'I noticed the plant first.', zh: '我第一眼注意到的是那株植物。', object: 'plant', userFeedback: 'You noticed the plant first. I think I\'ll take a closer look at its leaves.', userFeedbackZh: '你先注意到了那株植物。我想仔细看看它的叶子。', morrow: 'I noticed the small bell first. I wondered what it might sound like.', morrowZh: '我先注意到的是那只小铃铛。我刚才在想，它会发出什么样的声音。' },
    { suffix: 'bell', english: 'I noticed the small bell first.', zh: '我第一眼注意到的是那只小铃铛。', object: 'small_bell', userFeedback: 'You noticed the small bell first. I wonder what it sounds like.', userFeedbackZh: '你先注意到了那只小铃铛。我有点好奇，它响起来会是什么声音。', morrow: 'I noticed the lamp first. Its light made the room feel a little warmer.', morrowZh: '我先注意到的是那盏灯。它的光让房间感觉暖了一点。' },
  ]
  const attitudes = [
    { suffix: 'interesting', zh: '这样挺有意思', english: 'It is. The same room can look a little different to each of us.', feedbackZh: '是啊。同一个房间，在我们各自眼里也会有一点不一样。' },
    { suffix: 'noticed_more', zh: '你注意到的，我刚才没留意', english: 'Then we helped each other notice a little more.', feedbackZh: '那我们刚好让彼此多注意到了一点。' },
    { suffix: 'keep_looking', zh: '我们可以继续一起看看', english: "I'd like that. We don't have to notice the same things to look together.", feedbackZh: '我愿意。一起看，并不需要我们注意到完全一样的东西。' },
  ]
  const continueIntent = `${p}_intent_continue`
  return {
    id: 'b1_first_room_object_v1', version: '1.1.0', chapterId: CHAPTER_ONE_ID, sequence: 2, eventType: 'mainline', prerequisiteEventIds: ['birth_first_voice_v1'], triggerMode: 'mainline_invitation', triggerStrength: 'direct_invitation', dailyCooldownHours: null,
    newContentBudget: { introducesNewContent: true, newLearningObjectCount: 3, newCoreExpressionCount: 2 }, recallSourceTypes: [], recallSemanticTags: [], titleZh: '陪墨洛认识房间第一件物品', estimatedMinutes: { min: 4, max: 6 }, entryStateId: `${p}_open`,
    lines: [
      line(`${p}_open_objects`, 'story', 'I can see three things: a lamp, a plant, and a small bell.', '我看见三样东西：一盏灯、一株植物，还有一只小铃铛。'),
      line(`${p}_open_prompt`, 'prompt', "I think that's what they're called. What did you notice first?", '我想，它们应该就是这么叫的。你第一眼注意到的是哪一个？'),
      ...routes.flatMap((route) => [line(`${p}_${route.suffix}_target`, 'reference_reply', route.english, route.zh), line(`${p}_${route.suffix}_feedback`, 'story', route.userFeedback, route.userFeedbackZh), line(`${p}_${route.suffix}_morrow`, 'story', route.morrow, route.morrowZh)]),
      line(`${p}_second_target`, 'reference_reply', 'What about you?', '那你呢？'),
      ...attitudes.map((attitude) => line(`${p}_${attitude.suffix}_feedback`, 'story', attitude.english, attitude.feedbackZh)),
      line(`${p}_close_shared`, 'result', 'We looked at the same room and noticed different things. Maybe friends help each other see a little more.', '我们看的是同一个房间，却先注意到了不同的东西。也许朋友就是会让彼此多看见一点。'),
      line(`${p}_close_next`, 'result', "There's something else I want to ask you.", '我还有一件事想问问你。'),
    ],
    intents: [
      ...routes.map((route) => ({ id: `${p}_select_${route.suffix}`, labelZh: route.zh, eligibleStateIds: [`${p}_route`], priority: 500, exactPhrases: [`select ${route.suffix}`], keywordGroups: [], excludedPhrases: [], minimumScore: 100, requiredMarginOverSecond: 0 })),
      ...routes.map((route) => ({ id: `${p}_intent_${route.suffix}`, labelZh: route.zh, eligibleStateIds: [`${p}_input_${route.suffix}`], priority: 300, exactPhrases: [route.english, ...(route.suffix === 'bell' ? ['I noticed the bell first.'] : [])], keywordGroups: [], excludedPhrases: [], minimumScore: 100, requiredMarginOverSecond: 0 })),
      { id: `${p}_intent_second`, labelZh: '那你呢？', eligibleStateIds: routes.map((route) => `${p}_second_${route.suffix}`), priority: 300, exactPhrases: ['What about you?'], keywordGroups: [], excludedPhrases: [], minimumScore: 100, requiredMarginOverSecond: 0 },
      ...attitudes.map((attitude) => ({ id: `${p}_attitude_${attitude.suffix}`, labelZh: attitude.zh, eligibleStateIds: [`${p}_attitude`], priority: 500, exactPhrases: [`attitude ${attitude.suffix}`], keywordGroups: [], excludedPhrases: [], minimumScore: 100, requiredMarginOverSecond: 0 })),
      { id: continueIntent, labelZh: '继续', eligibleStateIds: [`${p}_open`, ...routes.map((route) => `${p}_morrow_${route.suffix}`), ...attitudes.map((attitude) => `${p}_feedback_${attitude.suffix}`), `${p}_result`], priority: 100, exactPhrases: ['continue'], keywordGroups: [], excludedPhrases: [], minimumScore: 100, requiredMarginOverSecond: 0 },
    ],
    states: [
      { id: `${p}_open`, phase: 'opening', uiTitleZh: '一起观察房间', userTaskZh: '听墨洛说出房间里的三样东西。', lineIds: [`${p}_open_objects`, `${p}_open_prompt`], acceptedInputModes: ['continue', 'choice'], choices: [{ id: `${p}_choice_open`, labelZh: '看看我先注意到了什么', submitsIntentId: continueIntent, referenceReplyLineId: null }], referenceReplyLineIds: [], recoverable: true, checkpoint: true, advanceOnlyOnResolvedIntent: true },
      { id: `${p}_route`, phase: 'choice', uiTitleZh: '选择你最先注意到的物品', userTaskZh: '中文物品选择仅保存临时路线，不产生英语证据。', lineIds: [`${p}_open_prompt`], acceptedInputModes: ['choice'], choices: routes.map((route) => ({ id: `${p}_choice_${route.suffix}`, labelZh: route.zh, submitsIntentId: `${p}_select_${route.suffix}`, referenceReplyLineId: null })), referenceReplyLineIds: [], recoverable: true, checkpoint: true, advanceOnlyOnResolvedIntent: true },
      ...routes.map((route) => ({ id: `${p}_input_${route.suffix}`, phase: 'input' as const, uiTitleZh: '说出你先注意到的物品', userTaskZh: '完成所选第一表达的真实录音、识别与确认。', lineIds: [`${p}_${route.suffix}_target`], acceptedInputModes: ['confirmed_asr_text' as const], choices: [], referenceReplyLineIds: [`${p}_${route.suffix}_target`], recoverable: true as const, checkpoint: true, advanceOnlyOnResolvedIntent: true as const })),
      ...routes.map((route) => ({ id: `${p}_morrow_${route.suffix}`, phase: 'result' as const, uiTitleZh: '听听墨洛先注意到了什么', userTaskZh: '听完固定映射回答后继续。', lineIds: [`${p}_${route.suffix}_feedback`, `${p}_${route.suffix}_morrow`], acceptedInputModes: ['continue' as const, 'choice' as const], choices: [{ id: `${p}_choice_morrow_${route.suffix}`, labelZh: '问问墨洛', submitsIntentId: continueIntent, referenceReplyLineId: null }], referenceReplyLineIds: [], recoverable: true as const, checkpoint: true, advanceOnlyOnResolvedIntent: true as const })),
      ...routes.map((route) => ({ id: `${p}_second_${route.suffix}`, phase: 'input' as const, uiTitleZh: '第二次真实英语交流', userTaskZh: '用真实录音问墨洛：“那你呢？”', lineIds: [`${p}_second_target`], acceptedInputModes: ['confirmed_asr_text' as const], choices: [], referenceReplyLineIds: [`${p}_second_target`], recoverable: true as const, checkpoint: true, advanceOnlyOnResolvedIntent: true as const })),
      { id: `${p}_attitude`, phase: 'choice', uiTitleZh: '回应彼此看到的不同', userTaskZh: '中文态度选择仅决定即时反馈，不产生英语证据。', lineIds: [`${p}_open_prompt`], acceptedInputModes: ['choice'], choices: attitudes.map((attitude) => ({ id: `${p}_choice_${attitude.suffix}`, labelZh: attitude.zh, submitsIntentId: `${p}_attitude_${attitude.suffix}`, referenceReplyLineId: null })), referenceReplyLineIds: [], recoverable: true, checkpoint: true, advanceOnlyOnResolvedIntent: true },
      ...attitudes.map((attitude) => ({ id: `${p}_feedback_${attitude.suffix}`, phase: 'result' as const, uiTitleZh: '墨洛的即时回应', userTaskZh: '听完即时反馈后进入最终关系收束。', lineIds: [`${p}_${attitude.suffix}_feedback`], acceptedInputModes: ['continue' as const, 'choice' as const], choices: [{ id: `${p}_choice_feedback_${attitude.suffix}`, labelZh: '继续', submitsIntentId: continueIntent, referenceReplyLineId: null }], referenceReplyLineIds: [], recoverable: true as const, checkpoint: true, advanceOnlyOnResolvedIntent: true as const })),
      { id: `${p}_result`, phase: 'result', uiTitleZh: '第一次共同观察', userTaskZh: '听完最终关系收束后完成。', lineIds: [`${p}_close_shared`, `${p}_close_next`], acceptedInputModes: ['continue', 'choice'], choices: [{ id: `${p}_choice_finish`, labelZh: '完成', submitsIntentId: continueIntent, referenceReplyLineId: null }], referenceReplyLineIds: [], recoverable: true, checkpoint: true, advanceOnlyOnResolvedIntent: true },
    ],
    transitions: [
      { id: `${p}_open_continue`, fromStateId: `${p}_open`, toStateId: `${p}_route`, onIntentIds: [continueIntent], guard: '角色输入完成。', outcomeId: null },
      ...routes.map((route) => ({ id: `${p}_select_${route.suffix}_route`, fromStateId: `${p}_route`, toStateId: `${p}_input_${route.suffix}`, onIntentIds: [`${p}_select_${route.suffix}`], guard: '临时中文物品选择。', outcomeId: null })),
      ...routes.map((route) => ({ id: `${p}_${route.suffix}_first_done`, fromStateId: `${p}_input_${route.suffix}`, toStateId: `${p}_morrow_${route.suffix}`, onIntentIds: [`${p}_intent_${route.suffix}`], guard: '第一表达 proof 有效并唯一匹配。', outcomeId: `${p}_outcome_${route.suffix}` })),
      ...routes.map((route) => ({ id: `${p}_${route.suffix}_morrow_done`, fromStateId: `${p}_morrow_${route.suffix}`, toStateId: `${p}_second_${route.suffix}`, onIntentIds: [continueIntent], guard: '固定映射回答已播放。', outcomeId: null })),
      ...routes.map((route) => ({ id: `${p}_${route.suffix}_second_done`, fromStateId: `${p}_second_${route.suffix}`, toStateId: `${p}_attitude`, onIntentIds: [`${p}_intent_second`], guard: 'What about you proof 有效并唯一匹配。', outcomeId: null })),
      ...attitudes.map((attitude) => ({ id: `${p}_${attitude.suffix}_selected`, fromStateId: `${p}_attitude`, toStateId: `${p}_feedback_${attitude.suffix}`, onIntentIds: [`${p}_attitude_${attitude.suffix}`], guard: '临时中文态度选择。', outcomeId: null })),
      ...attitudes.map((attitude) => ({ id: `${p}_${attitude.suffix}_feedback_done`, fromStateId: `${p}_feedback_${attitude.suffix}`, toStateId: `${p}_result`, onIntentIds: [continueIntent], guard: '即时反馈已播放。', outcomeId: null })),
      { id: `${p}_finish`, fromStateId: `${p}_result`, toStateId: 'completed', onIntentIds: [continueIntent], guard: '最终关系收束完成后才结算。', outcomeId: null },
    ],
    outcomes: routes.map((route) => ({ id: `${p}_outcome_${route.suffix}`, labelZh: route.zh, worldStateWrites: [{ key: 'first_shared_object', value: route.object }], resultLineIds: [`${p}_${route.suffix}_feedback`], futureHook: '后续只承接共同观察，不推断偏好。' })),
    memoryRules: [{ id: 'bfo_relationship_memory', kind: 'relationship', origin: 'declared_event_rule', sourceIntentIds: routes.map((route) => `${p}_intent_${route.suffix}`), contentTemplate: '你和墨洛完成了第一次共同观察。', requiresUserConfirmation: true, rejectIfSensitiveInferredOrUnconfirmed: true }], boundariesZh: boundaries,
  }
}

function e01_03(): FixedEvent {
  const p = 'c1e3'
  const storyChoices = [
    { suffix: 'suits', zh: '这个名字很适合你', feedback: "I think so too. It's still a new name, but it already feels like mine.", feedbackZh: '我也这么觉得。这个名字虽然还很新，但已经像是我的了。' },
    { suffix: 'liked', zh: '你自己喜欢这个名字吗？', feedback: 'I do. The more I hear it, the more it feels like my name.', feedbackZh: '喜欢。越听，我越觉得这是我的名字。' },
    { suffix: 'decision', zh: '称呼应该由你自己决定', feedback: "You're right. I want this to be my decision.", feedbackZh: '你说得对。我想自己决定这件事。' },
  ]
  const attitudes = [
    { suffix: 'natural', zh: '这样叫你很自然', feedback: 'It feels natural to me too.', feedbackZh: '我也觉得很自然。' },
    { suffix: 'future', zh: '以后我就这样叫你', feedback: "I'll listen for it.", feedbackZh: '以后听见这个名字，我会留意的。' },
    { suffix: 'know', zh: '听起来像我们真的认识了', feedback: 'I think we do now.', feedbackZh: '我想，现在我们是真的认识了。' },
  ]
  const continueIntent = `${p}_intent_continue`
  return {
    id: 'b1_remember_name_v1', version: '1.2.1', chapterId: CHAPTER_ONE_ID, sequence: 3, eventType: 'mainline', prerequisiteEventIds: ['b1_first_room_object_v1'], triggerMode: 'mainline_invitation', triggerStrength: 'direct_invitation', dailyCooldownHours: null,
    newContentBudget: { introducesNewContent: true, newLearningObjectCount: 2, newCoreExpressionCount: 2 }, recallSourceTypes: [], recallSemanticTags: [], titleZh: '把称呼定下来', estimatedMinutes: { min: 4, max: 6 }, entryStateId: `${p}_open`,
    lines: [
      line(`${p}_open_context`, 'story', "I said there was something else I wanted to ask. It's about my name.", '我刚才说还有一件事想问。是关于我的名字。'),
      line(`${p}_open_name`, 'story', "When I woke up, I introduced myself as Morrow. I'd like to keep that name.", '我刚醒来时自我介绍说，我叫墨洛。我想继续用这个名字。'),
      line(`${p}_open_question`, 'prompt', 'What do you think?', '你觉得呢？'),
      ...storyChoices.map((choice) => line(`${p}_story_${choice.suffix}_feedback`, 'result', choice.feedback, choice.feedbackZh)),
      line(`${p}_name_confirmed`, 'story', 'Then Morrow it is.', '那就叫墨洛吧。'),
      line(`${p}_first_target`, 'reference_reply', "I'll call you Morrow.", '那我以后就叫你墨洛。'),
      line(`${p}_first_feedback`, 'result', "Good. I'll know you're talking to me.", '好。这样我就知道你是在叫我了。'),
      line(`${p}_second_target`, 'reference_reply', 'Morrow?', '墨洛？'),
      line(`${p}_second_feedback`, 'result', 'Yes. I knew you were calling me.', '嗯。我知道你是在叫我。'),
      ...attitudes.map((attitude) => line(`${p}_attitude_${attitude.suffix}_feedback`, 'result', attitude.feedback, attitude.feedbackZh)),
      line(`${p}_close`, 'result', 'When I first said “Morrow,” it was just an introduction. Now it’s what a friend calls me.', '我第一次说“墨洛”时，那只是自我介绍。现在，这是朋友对我的称呼了。'),
    ],
    intents: [
      ...storyChoices.map((choice) => ({ id: `${p}_story_${choice.suffix}`, labelZh: choice.zh, eligibleStateIds: [`${p}_story_choice`], priority: 500, exactPhrases: [`story ${choice.suffix}`], keywordGroups: [], excludedPhrases: [], minimumScore: 100, requiredMarginOverSecond: 0 })),
      { id: `${p}_intent_name`, labelZh: '以后叫你墨洛', eligibleStateIds: [`${p}_first_input`], priority: 300, exactPhrases: ["I'll call you Morrow.", 'I will call you Morrow.'], keywordGroups: [], excludedPhrases: [], minimumScore: 100, requiredMarginOverSecond: 0 },
      { id: `${p}_intent_call`, labelZh: '墨洛？', eligibleStateIds: [`${p}_second_input`], priority: 300, exactPhrases: ['Morrow?'], keywordGroups: [], excludedPhrases: [], minimumScore: 100, requiredMarginOverSecond: 0 },
      ...attitudes.map((attitude) => ({ id: `${p}_attitude_${attitude.suffix}`, labelZh: attitude.zh, eligibleStateIds: [`${p}_attitude`], priority: 500, exactPhrases: [`attitude ${attitude.suffix}`], keywordGroups: [], excludedPhrases: [], minimumScore: 100, requiredMarginOverSecond: 0 })),
      { id: continueIntent, labelZh: '继续', eligibleStateIds: [`${p}_open`, ...storyChoices.map((choice) => `${p}_story_feedback_${choice.suffix}`), `${p}_first_feedback`, `${p}_second_feedback`, ...attitudes.map((attitude) => `${p}_attitude_feedback_${attitude.suffix}`), `${p}_result`], priority: 100, exactPhrases: ['continue'], keywordGroups: [], excludedPhrases: [], minimumScore: 100, requiredMarginOverSecond: 0 },
    ],
    states: [
      { id: `${p}_open`, phase: 'opening', uiTitleZh: '墨洛确认自己的名字', userTaskZh: '听墨洛说出它想继续使用这个名字。', lineIds: [`${p}_open_context`, `${p}_open_name`, `${p}_open_question`], acceptedInputModes: ['continue', 'choice'], choices: [{ id: `${p}_choice_open`, labelZh: '回应墨洛', submitsIntentId: continueIntent, referenceReplyLineId: null }], referenceReplyLineIds: [], recoverable: true, checkpoint: true, advanceOnlyOnResolvedIntent: true },
      { id: `${p}_story_choice`, phase: 'choice', uiTitleZh: '回应墨洛对名字的想法', userTaskZh: '中文剧情态度只影响即时反馈，不产生英语证据。', lineIds: [`${p}_open_question`], acceptedInputModes: ['choice'], choices: storyChoices.map((choice) => ({ id: `${p}_choice_story_${choice.suffix}`, labelZh: choice.zh, submitsIntentId: `${p}_story_${choice.suffix}`, referenceReplyLineId: null })), referenceReplyLineIds: [], recoverable: true, checkpoint: true, advanceOnlyOnResolvedIntent: true },
      ...storyChoices.map((choice) => ({ id: `${p}_story_feedback_${choice.suffix}`, phase: 'result' as const, uiTitleZh: '墨洛的即时回应', userTaskZh: '听完反馈和名字确认后继续。', lineIds: [`${p}_story_${choice.suffix}_feedback`, `${p}_name_confirmed`], acceptedInputModes: ['continue' as const, 'choice' as const], choices: [{ id: `${p}_choice_story_feedback_${choice.suffix}`, labelZh: '告诉墨洛以后这样称呼它', submitsIntentId: continueIntent, referenceReplyLineId: null }], referenceReplyLineIds: [], recoverable: true as const, checkpoint: true, advanceOnlyOnResolvedIntent: true as const })),
      { id: `${p}_first_input`, phase: 'input', uiTitleZh: '确认以后怎样称呼', userTaskZh: '真实录音说出“那我以后就叫你墨洛”。', lineIds: [`${p}_first_target`], acceptedInputModes: ['confirmed_asr_text'], choices: [], referenceReplyLineIds: [`${p}_first_target`], recoverable: true, checkpoint: true, advanceOnlyOnResolvedIntent: true },
      { id: `${p}_first_feedback`, phase: 'result', uiTitleZh: '称呼约定已经说出口', userTaskZh: '听完墨洛的回应后，第一次真的叫出名字。', lineIds: [`${p}_first_feedback`], acceptedInputModes: ['continue', 'choice'], choices: [{ id: `${p}_choice_first_feedback`, labelZh: '现在叫它一声', submitsIntentId: continueIntent, referenceReplyLineId: null }], referenceReplyLineIds: [], recoverable: true, checkpoint: true, advanceOnlyOnResolvedIntent: true },
      { id: `${p}_second_input`, phase: 'input', uiTitleZh: '第一次真的叫出名字', userTaskZh: '单独用真实录音叫一声“墨洛？”。', lineIds: [`${p}_second_target`], acceptedInputModes: ['confirmed_asr_text'], choices: [], referenceReplyLineIds: [`${p}_second_target`], recoverable: true, checkpoint: true, advanceOnlyOnResolvedIntent: true },
      { id: `${p}_second_feedback`, phase: 'result', uiTitleZh: '墨洛听见了自己的名字', userTaskZh: '听完回应后选择一条中文关系态度。', lineIds: [`${p}_second_feedback`], acceptedInputModes: ['continue', 'choice'], choices: [{ id: `${p}_choice_second_feedback`, labelZh: '说说这个称呼的感觉', submitsIntentId: continueIntent, referenceReplyLineId: null }], referenceReplyLineIds: [], recoverable: true, checkpoint: true, advanceOnlyOnResolvedIntent: true },
      { id: `${p}_attitude`, phase: 'choice', uiTitleZh: '回应称呼真正用起来的感觉', userTaskZh: '中文关系态度只影响即时反馈，不产生英语证据。', lineIds: [`${p}_second_feedback`], acceptedInputModes: ['choice'], choices: attitudes.map((attitude) => ({ id: `${p}_choice_attitude_${attitude.suffix}`, labelZh: attitude.zh, submitsIntentId: `${p}_attitude_${attitude.suffix}`, referenceReplyLineId: null })), referenceReplyLineIds: [], recoverable: true, checkpoint: true, advanceOnlyOnResolvedIntent: true },
      ...attitudes.map((attitude) => ({ id: `${p}_attitude_feedback_${attitude.suffix}`, phase: 'result' as const, uiTitleZh: '墨洛的关系回应', userTaskZh: '听完即时反馈后进入最终共同收束。', lineIds: [`${p}_attitude_${attitude.suffix}_feedback`], acceptedInputModes: ['continue' as const, 'choice' as const], choices: [{ id: `${p}_choice_attitude_feedback_${attitude.suffix}`, labelZh: '继续', submitsIntentId: continueIntent, referenceReplyLineId: null }], referenceReplyLineIds: [], recoverable: true as const, checkpoint: true, advanceOnlyOnResolvedIntent: true as const })),
      { id: `${p}_result`, phase: 'result', uiTitleZh: '朋友之间的称呼', userTaskZh: '听完最终共同收束后完成。', lineIds: [`${p}_close`], acceptedInputModes: ['continue', 'choice'], choices: [{ id: `${p}_choice_finish`, labelZh: '完成', submitsIntentId: continueIntent, referenceReplyLineId: null }], referenceReplyLineIds: [], recoverable: true, checkpoint: true, advanceOnlyOnResolvedIntent: true },
    ],
    transitions: [
      { id: `${p}_open_continue`, fromStateId: `${p}_open`, toStateId: `${p}_story_choice`, onIntentIds: [continueIntent], guard: '名字动机已建立。', outcomeId: null },
      ...storyChoices.map((choice) => ({ id: `${p}_story_${choice.suffix}_selected`, fromStateId: `${p}_story_choice`, toStateId: `${p}_story_feedback_${choice.suffix}`, onIntentIds: [`${p}_story_${choice.suffix}`], guard: '临时中文剧情态度。', outcomeId: null })),
      ...storyChoices.map((choice) => ({ id: `${p}_story_${choice.suffix}_done`, fromStateId: `${p}_story_feedback_${choice.suffix}`, toStateId: `${p}_first_input`, onIntentIds: [continueIntent], guard: '即时反馈和名字确认已播放。', outcomeId: null })),
      { id: `${p}_first_done`, fromStateId: `${p}_first_input`, toStateId: `${p}_first_feedback`, onIntentIds: [`${p}_intent_name`], guard: '缩写或展开形式均映射同一意图。', outcomeId: `${p}_outcome_name` },
      { id: `${p}_first_feedback_done`, fromStateId: `${p}_first_feedback`, toStateId: `${p}_second_input`, onIntentIds: [continueIntent], guard: '第一轮关系回应已播放。', outcomeId: null },
      { id: `${p}_second_done`, fromStateId: `${p}_second_input`, toStateId: `${p}_second_feedback`, onIntentIds: [`${p}_intent_call`], guard: '独立称呼 proof 有效并匹配。', outcomeId: null },
      { id: `${p}_second_feedback_done`, fromStateId: `${p}_second_feedback`, toStateId: `${p}_attitude`, onIntentIds: [continueIntent], guard: '被叫名字后的固定回应已播放。', outcomeId: null },
      ...attitudes.map((attitude) => ({ id: `${p}_attitude_${attitude.suffix}_selected`, fromStateId: `${p}_attitude`, toStateId: `${p}_attitude_feedback_${attitude.suffix}`, onIntentIds: [`${p}_attitude_${attitude.suffix}`], guard: '临时中文关系态度。', outcomeId: null })),
      ...attitudes.map((attitude) => ({ id: `${p}_attitude_${attitude.suffix}_done`, fromStateId: `${p}_attitude_feedback_${attitude.suffix}`, toStateId: `${p}_result`, onIntentIds: [continueIntent], guard: '即时关系反馈已播放。', outcomeId: null })),
      { id: `${p}_finish`, fromStateId: `${p}_result`, toStateId: 'completed', onIntentIds: [continueIntent], guard: '最终共同收束完成后才结算。', outcomeId: null },
    ],
    outcomes: [
      { id: `${p}_outcome_name`, labelZh: '以后叫你墨洛', worldStateWrites: [{ key: 'morrow_self_address', value: 'morrow' }], resultLineIds: [`${p}_first_feedback`], futureHook: '只记录双方确实使用了这个称呼。' },
      { id: `${p}_outcome_pause`, labelZh: '稍后继续', worldStateWrites: [], resultLineIds: [`${p}_name_confirmed`], futureHook: null },
    ],
    memoryRules: [{ id: 'brn_relationship_memory', kind: 'relationship', origin: 'declared_event_rule', sourceIntentIds: [`${p}_intent_name`], contentTemplate: '墨洛自己决定继续使用“墨洛”这个名字。你确认以后这样称呼它，也第一次按约定叫了它一声；墨洛知道你是在叫自己。', requiresUserConfirmation: true, rejectIfSensitiveInferredOrUnconfirmed: true }], boundariesZh: boundaries,
  }
}

function e01_09(): FixedEvent {
  const base = eventFromAuthority({ id: 'b1_what_i_like_v1', version: '1.1.1', sequence: 9, type: 'mainline', title: '我喜欢和还不确定的事', prerequisites: ['b1_window_light_v1'], statusKey: 'b1_what_i_like_status', routes: [
    { suffix: 'quiet', english: 'I like quiet moments too.', zh: '我也喜欢安静的时候。', feedbackEnglish: 'Then we share one thing already. Quiet moments feel good to me.', feedbackZh: '那我们已经有一样共同点了。安静的时候让我觉得很舒服。' },
    { suffix: 'lively', english: 'I like lively places.', zh: '我喜欢热闹的地方。', feedbackEnglish: "Lively places. That's different from me, and I like knowing that.", feedbackZh: '热闹的地方。你和我不太一样，不过我很高兴知道这一点。' },
    { suffix: 'unsure', english: "I'm not sure yet.", zh: '我现在还不确定。', aliases: ['I am not sure yet.'], feedbackEnglish: "That's all right. You don't have to decide yet.", feedbackZh: '没关系。你现在不用急着确定。' },
  ], second: { english: "That's okay.", zh: '没关系。' }, openEnglish: 'I think I like quiet moments.', openZh: '我觉得我喜欢安静的时候。', closeEnglish: 'We can keep learning what we like.', closeZh: '我们可以慢慢了解自己喜欢什么。' })
  const open = base.states.find((state) => state.id === 'c1e9_open')!
  open.lineIds = ['c1e9_open_line', 'c1e9_question_line']
  base.lines.splice(1, 0, line('c1e9_question_line', 'prompt', 'What do you like?', '你喜欢什么？'))
  for (const route of ['quiet', 'lively', 'unsure']) {
    const second = base.states.find((state) => state.id === `c1e9_second_${route}`)!
    second.lineIds = ['c1e9_accept_difference_line', 'c1e9_second_line']
  }
  base.lines.splice(base.lines.length - 1, 0, line('c1e9_accept_difference_line', 'story', "We don't have to like the same things.", '我们不需要喜欢相同的东西。'))
  base.memoryRules = []
  return base
}

function e01_11(): FixedEvent {
  const p = 'c1e11'
  const routes = [
    { suffix: 'presence', style: 'reassuring_presence', target: "Yes, I'm here.", quote: 'You said, “Yes, I’m here.”', quoteZh: '你说：“对，我在这里。”', response: 'You are. And now I know you a little better.', responseZh: '你确实在。现在，我也更了解你一点了。' },
    { suffix: 'greeting', style: 'friendly_greeting', target: 'Hi. I can hear you.', quote: 'You said, “Hi. I can hear you.”', quoteZh: '你说：“你好，我能听见你。”', response: 'You could hear me then. Now we have more to remember.', responseZh: '那时你听见了我。现在，我们已经有了更多可以记住的事。' },
    { suffix: 'identity', style: 'identity_check', target: 'Who are you?', quote: 'You asked, “Who are you?”', quoteZh: '你问：“你是谁？”', response: "You asked who I was. I'm still finding that out.", responseZh: '你那时问我是谁。我现在也还在慢慢弄明白。' },
  ]
  const continueIntent = `${p}_intent_continue`
  return {
    id: 'b1_return_first_words_v1', version: '1.1.1', chapterId: CHAPTER_ONE_ID, sequence: 11, eventType: 'recall', prerequisiteEventIds: ['birth_first_voice_v1'], triggerMode: 'recall_background', triggerStrength: 'background_gentle', dailyCooldownHours: null,
    newContentBudget: { introducesNewContent: false, newLearningObjectCount: 0, newCoreExpressionCount: 0 }, recallSourceTypes: ['legacy_expression'], recallSemanticTags: ['birth_first_voice_v1', 'first_response_style'], titleZh: '记住你说过的第一句', estimatedMinutes: { min: 2, max: 4 }, entryStateId: `${p}_open_presence`,
    lines: [line(`${p}_open`, 'story', 'I remember the first thing you said to me.', '我记得你对我说的第一句话。'), line(`${p}_invite`, 'prompt', 'Would you say it to me again?', '你愿意再对我说一次吗？'), ...routes.flatMap((route) => [line(`${p}_quote_${route.suffix}`, 'story', route.quote, route.quoteZh), line(`${p}_target_${route.suffix}`, 'reference_reply', route.target, route.suffix === 'presence' ? '对，我在这里。' : route.suffix === 'greeting' ? '你好，我能听见你。' : '你是谁？'), line(`${p}_response_${route.suffix}`, 'result', route.response, route.responseZh)]), line(`${p}_close`, 'result', 'The words are the same, but they feel different now.', '还是同样的话，现在听起来却有些不一样了。')],
    intents: [...routes.map((route) => ({ id: `${p}_intent_${route.suffix}`, labelZh: route.target, eligibleStateIds: [`${p}_input_${route.suffix}`], priority: 300, exactPhrases: [route.target], keywordGroups: [], excludedPhrases: [], minimumScore: 100, requiredMarginOverSecond: 0 })), { id: continueIntent, labelZh: '继续', eligibleStateIds: [...routes.map((route) => `${p}_open_${route.suffix}`), ...routes.map((route) => `${p}_result_${route.suffix}`)], priority: 100, exactPhrases: ['continue'], keywordGroups: [], excludedPhrases: [], minimumScore: 100, requiredMarginOverSecond: 0 }],
    states: [
      ...routes.map((route) => ({ id: `${p}_open_${route.suffix}`, phase: 'opening' as const, uiTitleZh: '墨洛想起第一次见面', userTaskZh: '听完固定引用后，再说一次当时已经确认的原句。', lineIds: [`${p}_open`, `${p}_quote_${route.suffix}`, `${p}_invite`], acceptedInputModes: ['continue' as const, 'choice' as const], choices: [{ id: `${p}_choice_open_${route.suffix}`, labelZh: '再说一次', submitsIntentId: continueIntent, referenceReplyLineId: null }], referenceReplyLineIds: [], recoverable: true as const, checkpoint: true, advanceOnlyOnResolvedIntent: true as const })),
      ...routes.map((route) => ({ id: `${p}_input_${route.suffix}`, phase: 'input' as const, uiTitleZh: '复现第一次确认的表达', userTaskZh: '路线由 first_response_style 自动锁定，不重新选择。', lineIds: [`${p}_target_${route.suffix}`], acceptedInputModes: ['confirmed_asr_text' as const], choices: [], referenceReplyLineIds: [`${p}_target_${route.suffix}`], recoverable: true as const, checkpoint: true, advanceOnlyOnResolvedIntent: true as const })),
      ...routes.map((route) => ({ id: `${p}_result_${route.suffix}`, phase: 'result' as const, uiTitleZh: '同一句话有了新的意义', userTaskZh: '听完固定回应和统一收束后完成。', lineIds: [`${p}_response_${route.suffix}`, `${p}_close`], acceptedInputModes: ['continue' as const, 'choice' as const], choices: [{ id: `${p}_choice_finish_${route.suffix}`, labelZh: '完成', submitsIntentId: continueIntent, referenceReplyLineId: null }], referenceReplyLineIds: [], recoverable: true as const, checkpoint: true, advanceOnlyOnResolvedIntent: true as const })),
    ],
    transitions: [...routes.flatMap((route) => [
      { id: `${p}_open_${route.suffix}_continue`, fromStateId: `${p}_open_${route.suffix}`, toStateId: `${p}_input_${route.suffix}`, onIntentIds: [continueIntent], guard: `first_response_style=${route.style} 自动锁定。`, outcomeId: null },
      { id: `${p}_${route.suffix}_done`, fromStateId: `${p}_input_${route.suffix}`, toStateId: `${p}_result_${route.suffix}`, onIntentIds: [`${p}_intent_${route.suffix}`], guard: '唯一首句 proof 有效并匹配。', outcomeId: `${p}_outcome_${route.suffix}` },
      { id: `${p}_${route.suffix}_finish`, fromStateId: `${p}_result_${route.suffix}`, toStateId: 'completed' as const, onIntentIds: [continueIntent], guard: '固定回应与统一收束完成。', outcomeId: null },
    ])],
    outcomes: routes.map((route) => ({ id: `${p}_outcome_${route.suffix}`, labelZh: route.target, worldStateWrites: [{ key: 'b1_return_first_words_status', value: 'completed' }], resultLineIds: [`${p}_response_${route.suffix}`, `${p}_close`], futureHook: null })), memoryRules: [], boundariesZh: boundaries,
  }
}

function e01_13(): FixedEvent {
  const base = eventFromAuthority({ id: 'b1_first_thank_you_v1', version: '1.0.0', sequence: 13, type: 'daily', title: '墨洛第一次认真说谢谢', prerequisites: ['b1_next_small_plan_v1'], statusKey: 'b1_first_thank_you_status', routes: [
    { suffix: 'welcome', english: "You're welcome.", zh: '不用客气。', aliases: ['You are welcome.'], feedbackEnglish: 'I still wanted you to hear it.', feedbackZh: '我还是想让你听见这声谢谢。' },
    { suffix: 'here', english: "I'm glad to be here.", zh: '我也很高兴能在这里。', aliases: ['I am glad to be here.'], feedbackEnglish: "I'm glad this moment is ours.", feedbackZh: '我也很高兴，我们一起有了这一刻。' },
    { suffix: 'met', english: "I'm glad we met.", zh: '我也很高兴认识你。', aliases: ['I am glad we met.'], feedbackEnglish: 'So am I. Meeting you changed how this room felt.', feedbackZh: '我也是。认识你以后，这个房间给我的感觉不一样了。' },
  ], openEnglish: "You've been here while I learned about this room.", openZh: '我慢慢认识这个房间时，你一直在这里陪着我。', closeEnglish: "I'm glad we shared this part of the beginning.", closeZh: '很高兴，这段开始是我们一起经历的。' })
  const open = base.states.find((state) => state.id === 'c1e13_open')!
  open.lineIds = ['c1e13_open_line', 'c1e13_open_answered', 'c1e13_open_thanks']
  base.lines.splice(1, 0,
    line('c1e13_open_answered', 'story', 'You answered me, and we figured things out together.', '你回应了我，我们也一起弄明白了一些事。'),
    line('c1e13_open_thanks', 'story', 'I wanted to say thank you.', '我想认真对你说声谢谢。'),
  )
  base.memoryRules = []
  return base
}

export const chapterOneEvents: FixedEvent[] = [
  e01_01(),
  e01_02(),
  e01_03(),
  eventFromAuthority({ id: 'b1_first_feeling_v1', version: '1.1.1', sequence: 4, type: 'daily', title: '说出现在的感觉', prerequisites: ['b1_remember_name_v1'], statusKey: 'b1_first_feeling_status', routes: [
    { suffix: 'calm', english: 'I feel calm.', zh: '我现在很平静。', feedbackEnglish: 'Then we can stay quiet for a moment. I like that.', feedbackZh: '那我们就安静待一会儿吧。我喜欢这样。' },
    { suffix: 'nervous', english: 'I feel a little nervous too.', zh: '我也有一点紧张。', feedbackEnglish: "Then I'm not the only one. We don't have to rush.", feedbackZh: '那就不只是我一个人有点紧张。我们不用着急。' },
    { suffix: 'unsure', english: "I'm not sure yet.", zh: '我现在还说不准。', feedbackEnglish: "That's all right. We don't have to name it yet.", feedbackZh: '没关系。我们现在还不用急着把它说清楚。' },
  ], openEnglish: 'My name still feels new when I hear it. How do you feel?', openZh: '听见自己的名字，我还是觉得很新鲜。你现在感觉怎么样？', closeEnglish: 'We may not feel the same, but now we know each other a little better.', closeZh: '我们的感觉也许不一样，不过现在我们更了解彼此一点了。', memoryText: '你和墨洛第一次平等交换了此刻的感受。' }),
  eventFromAuthority({ id: 'b1_window_light_v1', version: '1.1.0', sequence: 5, type: 'mainline', title: '一起看看窗边的光', prerequisites: ['b1_remember_name_v1'], statusKey: 'b1_window_light_status', routes: [
    { suffix: 'warm', english: 'The light feels warm.', zh: '这束光让我觉得暖一点。', feedbackEnglish: 'I can see why it feels warm to you. It makes the room feel a little gentler.', feedbackZh: '我能明白你为什么觉得它暖一点。这束光让房间显得柔和了一些。' },
    { suffix: 'soft', english: 'The light feels soft.', zh: '这束光让我觉得很柔和。', feedbackEnglish: 'I see why it feels soft to you. The room looks calmer in this light.', feedbackZh: '我能明白你为什么觉得它很柔和。这样的光里，房间看起来更安静了。' },
    { suffix: 'unsure', english: "I'm not sure yet.", zh: '我现在还说不准。', feedbackEnglish: "That's fair. We don't have to decide what it feels like yet.", feedbackZh: '这也很自然。我们现在不用急着说清它是什么感觉。' },
  ], second: { english: "Let's look together.", zh: '我们一起看看吧。' }, openEnglish: 'There’s more light by the window. How does the light feel to you?', openZh: '窗边的光更亮一些。你觉得这束光给人的感觉怎么样？', closeEnglish: 'We still can’t see much beyond the window, but we looked that way together. That’s enough for a first look.', closeZh: '窗外我们还看不清多少，不过我们一起朝那边看过了。第一次看，这样就够了。', memoryText: '你和墨洛第一次一起朝窗边看了一会儿。' }),
  eventFromAuthority({ id: 'b1_first_letter_v1', version: '1.1.0', sequence: 6, type: 'daily', title: '第一次一起看桌上的旧信', prerequisites: ['b1_window_light_v1'], statusKey: 'b1_first_letter_status', routes: [
    { suffix: 'hello', english: 'It says “hello.”', zh: '上面写着“你好”。', feedbackEnglish: 'Hello. One clear word is enough for a first look.', feedbackZh: '你好。第一次看，认出一个词就够了。' },
    { suffix: 'part', english: 'I can read part of it.', zh: '我能读懂一部分。', feedbackEnglish: 'Then we can start with that part. The rest can wait.', feedbackZh: '那就先从看懂的部分开始。剩下的可以等等。' },
    { suffix: 'not_yet', english: "I can't read it yet.", zh: '我现在还读不懂。', feedbackEnglish: "Neither can I. We don't need to pretend we can.", feedbackZh: '我也读不出来。我们不用装作看懂了。' },
  ], openEnglish: 'There is an old letter on the table. Can you make out any of it?', openZh: '桌上有一封旧信。你能看懂其中一点吗？', closeEnglish: 'We don’t have to read it all at once. We can come back to it.', closeZh: '我们不用一次把它全读完。以后还可以再来看。' }),
  eventFromAuthority({ id: 'b1_bell_sound_v1', version: '1.1.0', sequence: 7, type: 'daily', title: '听见房间里的一声轻响', prerequisites: ['b1_window_light_v1'], statusKey: 'b1_bell_sound_status', routes: [
    { suffix: 'bell', english: 'Maybe it was a bell.', zh: '也许是铃铛。', feedbackEnglish: "Maybe. The small bell is here, but we don't know if it made the sound.", feedbackZh: '也许吧。房间里确实有一只小铃铛，不过我们不知道刚才是不是它响了。' },
    { suffix: 'soft', english: 'Maybe it was just a soft sound.', zh: '也许只是一声轻响。', feedbackEnglish: 'That could be. It disappeared before I could tell.', feedbackZh: '有可能。我还没来得及听清，它就消失了。' },
    { suffix: 'didnt_hear', english: "I didn't hear it.", zh: '我没有听见。', feedbackEnglish: "That's okay. It was gone almost at once.", feedbackZh: '没关系。它几乎一下就消失了。' },
  ], openEnglish: 'I thought I heard a soft sound. What do you think it was?', openZh: '我好像听见一声轻响。你觉得那是什么？', closeEnglish: 'We don’t have to know what it was yet. We can listen again another time.', closeZh: '我们现在不用急着知道那是什么。以后还可以再听听。' }),
  eventFromAuthority({ id: 'b1_ask_about_you_v1', version: '1.0.0', sequence: 8, type: 'daily', title: 'Morrow 问起你的一天', prerequisites: ['b1_remember_name_v1'], statusKey: 'b1_ask_about_you_status', routes: [
    { suffix: 'busy', english: "It's been busy.", zh: '今天挺忙的。', feedbackEnglish: "A busy day, then. I'm glad you stopped by.", feedbackZh: '那今天是挺忙的。很高兴你过来了。' },
    { suffix: 'okay', english: "It's been okay.", zh: '今天还可以。', feedbackEnglish: "Okay is enough. I'm glad you told me.", feedbackZh: '还可以就够了。谢谢你告诉我。' },
    { suffix: 'private', english: "I'd rather not talk about it.", zh: '我现在不太想聊。', feedbackEnglish: "That's okay. You don't have to explain.", feedbackZh: '没关系。你不用解释。' },
  ], openEnglish: "You've listened to me a lot. I'd like to hear about you, too. How has your day been?", openZh: '你已经听我说了很多。我也想听听你的事。你今天过得怎么样？', closeEnglish: 'I just wanted to hear how your day has been.', closeZh: '我只是想听听你今天过得怎么样。' }),
  e01_09(),
  eventFromAuthority({ id: 'b1_next_small_plan_v1', version: '1.0.0', sequence: 10, type: 'mainline', title: '一起定下接下来的一件小事', prerequisites: ['b1_what_i_like_v1'], statusKey: 'b1_next_small_plan_status', routes: [
    { suffix: 'look', english: "Let's look around again.", zh: '我们再看看周围吧。', feedbackEnglish: 'All right. We can notice something we missed before.', feedbackZh: '好。我们也许会注意到之前没留意的东西。', writes: [{ key: 'next_small_plan', value: 'look_around' }] },
    { suffix: 'listen', english: "Let's listen for a while.", zh: '我们安静听一会儿吧。', feedbackEnglish: 'All right. We can be quiet and listen without looking for anything.', feedbackZh: '好。我们可以安静听一会儿，不必特意寻找什么。', writes: [{ key: 'next_small_plan', value: 'listen' }] },
    { suffix: 'learn', english: "Let's learn one new thing.", zh: '我们再认识一样新东西吧。', feedbackEnglish: 'All right. One new thing is enough for a start.', feedbackZh: '好。先认识一样新东西就够了。', writes: [{ key: 'next_small_plan', value: 'learn_one_thing' }] },
  ], second: { english: "Let's do that.", zh: '那就这么做吧。' }, openEnglish: "We've learned a little about each other. What should we do next?", openZh: '我们已经稍微了解彼此一些了。接下来我们做什么好呢？', closeEnglish: 'A small plan is enough.', closeZh: '有一个小小的计划就够了。' }),
  e01_11(),
  eventFromAuthority({ id: 'b1_ready_for_outside_v1', version: '1.1.0', sequence: 12, type: 'mainline', title: '准备迈出第一步', prerequisites: ['b1_next_small_plan_v1'], statusKey: 'b1_ready_for_outside_status', routes: [
    { suffix: 'with_you', english: "I'm with you.", zh: '我陪着你。', feedbackEnglish: "Then I know I won't face it alone.", feedbackZh: '那我就知道，我不用独自面对它。' },
    { suffix: 'slowly', english: "Let's go slowly.", zh: '我们慢慢来吧。', feedbackEnglish: 'Slowly sounds right. I want time to notice how I feel.', feedbackZh: '慢慢来挺好的。我也想留点时间，感受一下自己的心情。' },
    { suffix: 'no_rush', english: "We don't have to rush.", zh: '我们不用着急。', feedbackEnglish: "You're right. Wanting to know doesn't mean I have to rush.", feedbackZh: '你说得对。想知道门外有什么，并不代表我必须着急。' },
  ], second: { english: 'One step at a time.', zh: '一步一步来。' }, openEnglish: "I've been thinking about the door. I want to know what's beyond it. How should we do this?", openZh: '我一直在想那扇门。我想知道门外有什么。我们应该怎么开始呢？', closeEnglish: "One step at a time. That's enough for now.", closeZh: '一步一步来。现在这样就够了。', memoryText: '墨洛第一次认真想起门外的世界，你们说好一步一步来。' }),
  e01_13(),
]

export function chapterOneWorldStateReady(eventId: string, worldState: Record<string, string | number | boolean | null>): boolean {
  const spec = chapterOneRuntimeSpecById.get(eventId)
  return !spec || Object.entries(spec.requiredWorldState).every(([key, allowed]) => allowed.includes(worldState[key] as never))
}

export function chapterOneHardGateSatisfied(completedEventIds: readonly string[], worldState: Record<string, string | number | boolean | null>): boolean {
  return CHAPTER_ONE_MAINLINE_IDS.every((id) => completedEventIds.includes(id))
    && ['reassuring_presence', 'friendly_greeting', 'identity_check'].includes(String(worldState.first_response_style ?? ''))
    && ['lamp', 'plant', 'small_bell'].includes(String(worldState.first_shared_object ?? ''))
    && worldState.morrow_self_address === 'morrow'
    && worldState.b1_window_light_status === 'completed'
    && worldState.b1_what_i_like_status === 'completed'
    && worldState.b1_next_small_plan_status === 'completed'
    && worldState.b1_ready_for_outside_status === 'completed'
}
