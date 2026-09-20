import {
  fixedContentRulesetSchema,
  type AudioBinding,
  type FixedContentLine,
  type FixedContentRuleset,
  type FixedEvent,
} from '@english-pet/contracts'

function learningLine(
  id: string,
  purpose: FixedContentLine['purpose'],
  english: string,
  textZh: string,
  audioRequired = true,
): FixedContentLine {
  const contentId = `${id}_content`
  return {
    id,
    speaker: purpose === 'reference_reply' ? 'system_example' : 'morrow',
    purpose,
    learningContent: {
      contentId,
      textVersion: '1.0.0',
      english,
      translation: {
        textZh,
        version: '1.0.0',
        status: 'manual_reviewed',
        reviewedBy: 'content_owner',
      },
    },
    audioRequired,
    audioIds: audioRequired ? [`${id}_audio_normal`, `${id}_audio_slow`] : [],
  }
}

const sharedBoundariesZh = [
  '所有导航、按钮、状态、错误、权限、设置和功能说明使用中文；英文只用于学习内容。',
  '未达到唯一意图匹配条件时保持当前状态，不写结果、不生成记忆、不推进剧情。',
  '只允许声明过的结果写入世界状态；拒答、暂停、离开和语言错误不产生惩罚。',
  '长期记忆只能来自本事件声明规则或用户显式提出，并且都要经过用户确认。',
  '未确认 ASR、低置信文本、临时误解、敏感推断和原始录音不得进入长期记忆。',
]

const firstVoiceEvent: FixedEvent = {
  id: 'birth_first_voice_v1',
  version: '1.0.0',
  chapterId: 'chapter_01_birth',
  sequence: 1,
  titleZh: '苏醒后的第一句话',
  estimatedMinutes: { min: 2, max: 4 },
  entryStateId: 'bfv_open',
  lines: [
    learningLine('bfv_wake_line', 'story', 'Hello? I can hear someone beyond the room.', '你好？我能听见房间外有人。'),
    learningLine('bfv_prompt_line', 'prompt', 'I’m Morrow. What should we do first?', '我是 Morrow。我们先做什么？'),
    learningLine('bfv_help_reply', 'reference_reply', 'Let me help you find out where you are.', '让我帮你弄清楚你在哪里。', false),
    learningLine('bfv_question_reply', 'reference_reply', 'Are you all right?', '你还好吗？', false),
    learningLine('bfv_confirm_help', 'confirmation', 'You want to help me understand this room. I can start with that.', '你想帮我弄清这个房间。那我们就从这里开始。'),
    learningLine('bfv_confirm_question', 'confirmation', 'You asked whether I’m all right. I’m uncertain, but I’m listening.', '你问我是否还好。我还不确定，但我在听。'),
    learningLine('bfv_pause_line', 'result', 'We can leave the room quiet for now. I will not treat that as leaving me behind.', '我们可以先让房间安静一会儿。我不会把这理解成你抛下了我。'),
  ],
  intents: [
    {
      id: 'bfv_intent_help',
      labelZh: '主动帮助 Morrow',
      eligibleStateIds: ['bfv_reply'],
      priority: 300,
      exactPhrases: ['let me help you', 'i can help you', 'i will help you'],
      keywordGroups: [
        { allOf: ['help'], anyOf: ['you', 'room', 'find', 'understand'], noneOf: ["can't", 'cannot', "won't"], weight: 90 },
      ],
      excludedPhrases: ["i can't help", 'i cannot help', "i won't help"],
      minimumScore: 70,
      requiredMarginOverSecond: 15,
    },
    {
      id: 'bfv_intent_check',
      labelZh: '先确认 Morrow 的状态',
      eligibleStateIds: ['bfv_reply'],
      priority: 290,
      exactPhrases: ['are you all right', 'are you okay', 'how are you'],
      keywordGroups: [
        { allOf: [], anyOf: ['okay', 'alright', 'all right', 'how are you'], noneOf: [], weight: 90 },
      ],
      excludedPhrases: [],
      minimumScore: 70,
      requiredMarginOverSecond: 15,
    },
    {
      id: 'bfv_intent_pause',
      labelZh: '暂时停下',
      eligibleStateIds: ['bfv_open', 'bfv_reply'],
      priority: 400,
      exactPhrases: ['not now', 'later', 'stop'],
      keywordGroups: [
        { allOf: [], anyOf: ['later', 'stop', 'not now', 'pause'], noneOf: [], weight: 100 },
      ],
      excludedPhrases: [],
      minimumScore: 70,
      requiredMarginOverSecond: 10,
    },
    {
      id: 'bfv_intent_continue',
      labelZh: '继续',
      eligibleStateIds: ['bfv_open', 'bfv_result'],
      priority: 100,
      exactPhrases: ['continue'],
      keywordGroups: [],
      excludedPhrases: [],
      minimumScore: 100,
      requiredMarginOverSecond: 0,
    },
  ],
  states: [
    {
      id: 'bfv_open',
      phase: 'opening',
      uiTitleZh: '听见微弱的声音',
      userTaskZh: '继续聆听，或选择稍后再来。',
      lineIds: ['bfv_wake_line'],
      acceptedInputModes: ['continue', 'choice'],
      choices: [
        { id: 'bfv_choice_continue', labelZh: '继续', submitsIntentId: 'bfv_intent_continue', referenceReplyLineId: null },
        { id: 'bfv_choice_later', labelZh: '稍后再来', submitsIntentId: 'bfv_intent_pause', referenceReplyLineId: null },
      ],
      referenceReplyLineIds: [],
      recoverable: true,
      checkpoint: true,
      advanceOnlyOnResolvedIntent: true,
    },
    {
      id: 'bfv_reply',
      phase: 'input',
      uiTitleZh: '回应 Morrow',
      userTaskZh: '用英语表示愿意帮助，或先问问 Morrow 是否还好。',
      lineIds: ['bfv_prompt_line'],
      acceptedInputModes: ['text', 'confirmed_asr_text', 'reference_reply', 'choice'],
      choices: [
        { id: 'bfv_choice_help', labelZh: '帮助弄清房间', submitsIntentId: 'bfv_intent_help', referenceReplyLineId: 'bfv_help_reply' },
        { id: 'bfv_choice_check', labelZh: '先问问 Morrow', submitsIntentId: 'bfv_intent_check', referenceReplyLineId: 'bfv_question_reply' },
        { id: 'bfv_choice_pause', labelZh: '这次先停下', submitsIntentId: 'bfv_intent_pause', referenceReplyLineId: null },
      ],
      referenceReplyLineIds: ['bfv_help_reply', 'bfv_question_reply'],
      recoverable: true,
      checkpoint: true,
      advanceOnlyOnResolvedIntent: true,
    },
    {
      id: 'bfv_result',
      phase: 'result',
      uiTitleZh: '第一次理解',
      userTaskZh: '查看结果并结束事件。',
      lineIds: ['bfv_confirm_help', 'bfv_confirm_question', 'bfv_pause_line'],
      acceptedInputModes: ['continue'],
      choices: [
        { id: 'bfv_choice_finish', labelZh: '完成', submitsIntentId: 'bfv_intent_continue', referenceReplyLineId: null },
      ],
      referenceReplyLineIds: [],
      recoverable: true,
      checkpoint: true,
      advanceOnlyOnResolvedIntent: true,
    },
  ],
  transitions: [
    { id: 'bfv_open_continue', fromStateId: 'bfv_open', toStateId: 'bfv_reply', onIntentIds: ['bfv_intent_continue'], guard: '用户明确点击继续。', outcomeId: null },
    { id: 'bfv_open_pause', fromStateId: 'bfv_open', toStateId: 'bfv_result', onIntentIds: ['bfv_intent_pause'], guard: '用户明确选择稍后再来。', outcomeId: 'bfv_outcome_paused' },
    { id: 'bfv_reply_help', fromStateId: 'bfv_reply', toStateId: 'bfv_result', onIntentIds: ['bfv_intent_help'], guard: '帮助意图达到阈值且领先第二候选。', outcomeId: 'bfv_outcome_helped' },
    { id: 'bfv_reply_check', fromStateId: 'bfv_reply', toStateId: 'bfv_result', onIntentIds: ['bfv_intent_check'], guard: '关心询问意图达到阈值且领先第二候选。', outcomeId: 'bfv_outcome_checked' },
    { id: 'bfv_reply_pause', fromStateId: 'bfv_reply', toStateId: 'bfv_result', onIntentIds: ['bfv_intent_pause'], guard: '用户明确表示暂停。', outcomeId: 'bfv_outcome_paused' },
    { id: 'bfv_finish', fromStateId: 'bfv_result', toStateId: 'completed', onIntentIds: ['bfv_intent_continue'], guard: '已声明结果只结算一次。', outcomeId: null },
  ],
  outcomes: [
    { id: 'bfv_outcome_helped', labelZh: '从帮助探索开始', worldStateWrites: [{ key: 'first_response_style', value: 'help' }], resultLineIds: ['bfv_confirm_help'], futureHook: '下一事件可承接用户主动帮助探索。' },
    { id: 'bfv_outcome_checked', labelZh: '从确认状态开始', worldStateWrites: [{ key: 'first_response_style', value: 'check_in' }], resultLineIds: ['bfv_confirm_question'], futureHook: '下一事件可承接用户先确认情况的交流方式。' },
    { id: 'bfv_outcome_paused', labelZh: '平静地暂停', worldStateWrites: [{ key: 'birth_first_voice_status', value: 'paused_once' }], resultLineIds: ['bfv_pause_line'], futureHook: '下次从最近确认状态继续，不产生缺席惩罚。' },
  ],
  memoryRules: [
    { id: 'bfv_relationship_memory', kind: 'relationship', origin: 'declared_event_rule', sourceIntentIds: ['bfv_intent_help', 'bfv_intent_check'], contentTemplate: '你和 Morrow 完成了第一次相互理解。', requiresUserConfirmation: true, rejectIfSensitiveInferredOrUnconfirmed: true },
  ],
  boundariesZh: sharedBoundariesZh,
}

const firstObjectEvent: FixedEvent = {
  id: 'birth_restore_object_v1',
  version: '1.0.0',
  chapterId: 'chapter_01_birth',
  sequence: 2,
  titleZh: '让第一件东西清晰起来',
  estimatedMinutes: { min: 3, max: 5 },
  entryStateId: 'bro_open',
  lines: [
    learningLine('bro_open_line', 'story', 'The room remembers a lamp, a plant, and a small bell, but only one is clear.', '房间记得一盏灯、一株植物和一只小铃铛，但现在只有模糊轮廓。'),
    learningLine('bro_prompt_line', 'prompt', 'Which one should we bring back first?', '我们应该先让哪一件回来？'),
    learningLine('bro_lamp_reply', 'reference_reply', 'Let’s bring back the lamp by the window.', '让我们把窗边的灯带回来。', false),
    learningLine('bro_plant_reply', 'reference_reply', 'I choose the plant near the door.', '我选择门边的植物。', false),
    learningLine('bro_bell_reply', 'reference_reply', 'Let’s bring back the small bell.', '让我们把小铃铛带回来。', false),
    learningLine('bro_lamp_result', 'result', 'The lamp is steady now. The room has a place to keep a voice.', '灯光现在稳定了。房间有了一个可以留住声音的地方。'),
    learningLine('bro_plant_result', 'result', 'The plant looks less lost near the door.', '门边的植物看起来不再那么迷失了。'),
    learningLine('bro_bell_result', 'result', 'The bell makes one low note. It sounds awake, not alarmed.', '铃铛发出一声低鸣。听起来像醒来了，而不是在报警。'),
  ],
  intents: [
    {
      id: 'bro_intent_lamp', labelZh: '选择窗边的灯', eligibleStateIds: ['bro_choose'], priority: 300,
      exactPhrases: ['lamp', 'the lamp', 'bring back the lamp'],
      keywordGroups: [{ allOf: ['lamp'], anyOf: ['choose', 'bring', 'window', 'want'], noneOf: ["don't", 'not'], weight: 90 }],
      excludedPhrases: ["don't choose the lamp", 'not the lamp'], minimumScore: 70, requiredMarginOverSecond: 15,
    },
    {
      id: 'bro_intent_plant', labelZh: '选择门边的植物', eligibleStateIds: ['bro_choose'], priority: 300,
      exactPhrases: ['plant', 'the plant', 'bring back the plant'],
      keywordGroups: [{ allOf: ['plant'], anyOf: ['choose', 'bring', 'door', 'want'], noneOf: ["don't", 'not'], weight: 90 }],
      excludedPhrases: ["don't choose the plant", 'not the plant'], minimumScore: 70, requiredMarginOverSecond: 15,
    },
    {
      id: 'bro_intent_bell', labelZh: '选择小铃铛', eligibleStateIds: ['bro_choose'], priority: 300,
      exactPhrases: ['bell', 'the bell', 'small bell', 'bring back the bell'],
      keywordGroups: [{ allOf: ['bell'], anyOf: ['choose', 'bring', 'small', 'want'], noneOf: ["don't", 'not'], weight: 90 }],
      excludedPhrases: ["don't choose the bell", 'not the bell'], minimumScore: 70, requiredMarginOverSecond: 15,
    },
    {
      id: 'bro_intent_continue', labelZh: '继续', eligibleStateIds: ['bro_open', 'bro_result'], priority: 100,
      exactPhrases: ['continue'], keywordGroups: [], excludedPhrases: [], minimumScore: 100, requiredMarginOverSecond: 0,
    },
  ],
  states: [
    {
      id: 'bro_open', phase: 'opening', uiTitleZh: '三个模糊轮廓', userTaskZh: '查看房间并继续。', lineIds: ['bro_open_line'],
      acceptedInputModes: ['continue'], choices: [{ id: 'bro_choice_continue', labelZh: '看看能恢复什么', submitsIntentId: 'bro_intent_continue', referenceReplyLineId: null }],
      referenceReplyLineIds: [], recoverable: true, checkpoint: true, advanceOnlyOnResolvedIntent: true,
    },
    {
      id: 'bro_choose', phase: 'choice', uiTitleZh: '选择第一件恢复物', userTaskZh: '从灯、植物和小铃铛中选择一个，并用英语确认。', lineIds: ['bro_prompt_line'],
      acceptedInputModes: ['text', 'confirmed_asr_text', 'reference_reply', 'choice'],
      choices: [
        { id: 'bro_choice_lamp', labelZh: '窗边的灯', submitsIntentId: 'bro_intent_lamp', referenceReplyLineId: 'bro_lamp_reply' },
        { id: 'bro_choice_plant', labelZh: '门边的植物', submitsIntentId: 'bro_intent_plant', referenceReplyLineId: 'bro_plant_reply' },
        { id: 'bro_choice_bell', labelZh: '小铃铛', submitsIntentId: 'bro_intent_bell', referenceReplyLineId: 'bro_bell_reply' },
      ],
      // 契约限制 referenceReplyLineIds 最多两条（.max(2)），此处保留 lamp/plant 两条可见参考句；
      // bell 选项的参考句 bro_bell_reply 作为额外选项，通过 choices[].referenceReplyLineId 单独挂载，不重复列入此列表。
      referenceReplyLineIds: ['bro_lamp_reply', 'bro_plant_reply'], recoverable: true, checkpoint: true, advanceOnlyOnResolvedIntent: true,
    },
    {
      id: 'bro_result', phase: 'result', uiTitleZh: '房间有了第一处变化', userTaskZh: '查看结果并完成事件。',
      lineIds: ['bro_lamp_result', 'bro_plant_result', 'bro_bell_result'], acceptedInputModes: ['continue'],
      choices: [{ id: 'bro_choice_finish', labelZh: '完成', submitsIntentId: 'bro_intent_continue', referenceReplyLineId: null }],
      referenceReplyLineIds: [], recoverable: true, checkpoint: true, advanceOnlyOnResolvedIntent: true,
    },
  ],
  transitions: [
    { id: 'bro_open_continue', fromStateId: 'bro_open', toStateId: 'bro_choose', onIntentIds: ['bro_intent_continue'], guard: '用户明确继续。', outcomeId: null },
    { id: 'bro_choose_lamp', fromStateId: 'bro_choose', toStateId: 'bro_result', onIntentIds: ['bro_intent_lamp'], guard: '灯的选择达到唯一匹配条件。', outcomeId: 'bro_outcome_lamp' },
    { id: 'bro_choose_plant', fromStateId: 'bro_choose', toStateId: 'bro_result', onIntentIds: ['bro_intent_plant'], guard: '植物的选择达到唯一匹配条件。', outcomeId: 'bro_outcome_plant' },
    { id: 'bro_choose_bell', fromStateId: 'bro_choose', toStateId: 'bro_result', onIntentIds: ['bro_intent_bell'], guard: '铃铛的选择达到唯一匹配条件。', outcomeId: 'bro_outcome_bell' },
    { id: 'bro_finish', fromStateId: 'bro_result', toStateId: 'completed', onIntentIds: ['bro_intent_continue'], guard: '世界状态与记忆提案已幂等结算。', outcomeId: null },
  ],
  outcomes: [
    { id: 'bro_outcome_lamp', labelZh: '恢复窗边的灯', worldStateWrites: [{ key: 'first_restored_object', value: 'lamp' }], resultLineIds: ['bro_lamp_result'], futureHook: '后续房间和来信事件可承接窗边灯。' },
    { id: 'bro_outcome_plant', labelZh: '恢复门边的植物', worldStateWrites: [{ key: 'first_restored_object', value: 'plant' }], resultLineIds: ['bro_plant_result'], futureHook: '后续房间事件可承接门边植物。' },
    { id: 'bro_outcome_bell', labelZh: '恢复小铃铛', worldStateWrites: [{ key: 'first_restored_object', value: 'small_bell' }], resultLineIds: ['bro_bell_result'], futureHook: '后续声音与听力事件可承接铃声。' },
  ],
  memoryRules: [
    { id: 'bro_language_memory', kind: 'language', origin: 'declared_event_rule', sourceIntentIds: ['bro_intent_lamp', 'bro_intent_plant', 'bro_intent_bell'], contentTemplate: '{{confirmed_user_sentence}}', requiresUserConfirmation: true, rejectIfSensitiveInferredOrUnconfirmed: true },
    { id: 'bro_relationship_memory', kind: 'relationship', origin: 'declared_event_rule', sourceIntentIds: ['bro_intent_lamp', 'bro_intent_plant', 'bro_intent_bell'], contentTemplate: '你和 Morrow 一起让 {{first_restored_object}} 回到了房间。', requiresUserConfirmation: true, rejectIfSensitiveInferredOrUnconfirmed: true },
  ],
  boundariesZh: sharedBoundariesZh,
}

const events = [firstVoiceEvent, firstObjectEvent]
const audioBindings: AudioBinding[] = events.flatMap((event) =>
  event.lines.flatMap((line) =>
    line.audioRequired
      ? (['normal', 'slow'] as const).map((variant) => ({
          audioId: `${line.id}_audio_${variant}`,
          lineId: line.id,
          contentId: line.learningContent.contentId,
          textVersion: line.learningContent.textVersion,
          translationVersion: line.learningContent.translation.version,
          variant,
          voiceProfileId: 'morrow_voice_v1',
          fileRef: `tts/${event.chapterId}/${event.id}/${line.id}/1.0.0/${variant}.wav`,
          checksumSha256: null,
          status: 'planned' as const,
        }))
      : [],
  ),
)

const candidate = {
  id: 'fixed-content-v1.0.0',
  version: '1.0.0',
  schemaVersion: '1.0.0',
  personaVersion: 'morrow-1.0',
  defaultUiLocale: 'zh-CN',
  learningLocale: 'en',
  supportedPlatforms: ['web_test', 'wechat_mini_program', 'mobile_app'],
  matchingPolicy: {
    normalizers: ['unicode_nfkc', 'lowercase', 'trim', 'collapse_whitespace', 'strip_terminal_punctuation'],
    order: ['explicit_choice', 'exact_phrase', 'keyword_score', 'conflict_check', 'fallback'],
    confidenceThreshold: 70,
    minimumWinnerMargin: 15,
    tieBehavior: 'do_not_advance_show_candidates',
    denialBehavior: 'discard_temporary_interpretation_and_stay',
    repeatedInputBehavior: 'do_not_repeat_commit_offer_alternate_input',
  },
  fallbacks: [
    { kind: 'no_match', uiMessageZh: '我还不能可靠判断你的意思。你可以换一种说法，或选择下面的参考意图。', keepsCurrentState: true, advancesEvent: false, showCandidateIntentLimit: 3, allowEditableReferenceReplies: true },
    { kind: 'low_confidence', uiMessageZh: '我不确定是否听对了。请先检查并修改转写文字，再确认发送。', keepsCurrentState: true, advancesEvent: false, showCandidateIntentLimit: 0, allowEditableReferenceReplies: true },
    { kind: 'user_denial', uiMessageZh: '好的，刚才的理解不算。请修改原句，或从候选意图中重新选择。', keepsCurrentState: true, advancesEvent: false, showCandidateIntentLimit: 3, allowEditableReferenceReplies: true },
    { kind: 'repeated_input', uiMessageZh: '这条内容已经处理过，不会重复推进。你可以继续当前步骤或修改表达。', keepsCurrentState: true, advancesEvent: false, showCandidateIntentLimit: 2, allowEditableReferenceReplies: true },
  ],
  translationToggle: {
    defaultExpanded: false,
    placement: 'learning_content_bottom_right',
    collapsedLabelZh: '查看中文',
    expandedLabelZh: '收起中文',
    persistScope: 'current_content_block',
    affectsAudio: false,
    affectsProgress: false,
    hideWhenNoLearningContent: true,
  },
  audioBindings,
  events,
  llmPolicy: {
    adapterRetained: true,
    enabledByDefault: false,
    coreDependency: false,
    permittedFutureRole: 'optional_non_authoritative_enhancement',
    mayAdvanceState: false,
    mayWriteMemory: false,
    mayCreateContentIds: false,
  },
}

export const fixedContentV1: FixedContentRuleset = fixedContentRulesetSchema.parse(candidate)

export function getFixedContentEvent(eventId: string): FixedEvent | undefined {
  return fixedContentV1.events.find((event) => event.id === eventId)
}
