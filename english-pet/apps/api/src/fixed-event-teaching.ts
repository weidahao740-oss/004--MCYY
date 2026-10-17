import type { FixedContentLine, FixedEventTeachingStep } from '@english-pet/contracts'

export const TEACHING_PLAN_VERSION = 's09_20261016_v1'
export const normalizeSpeech = (text: string): string => text.normalize('NFKC')
  .replace(/[’‘]/g, "'").replace(/[“”"]/g, '').replace(/[.!?,;:]/g, ' ').trim().toLowerCase().replace(/\s+/g, ' ')
  .replace(/\bi am\b/g, "i'm").replace(/\bi will\b/g, "i'll").replace(/\blet us\b/g, "let's")
  .replace(/\bit is\b|\bit has(?= been\b)/g, "it's").replace(/\byou are(?= welcome\b)/g, "you're")
  .replace(/\bi would(?= rather\b)/g, "i'd").replace(/\bthat is\b/g, "that's")
  .replace(/\bdo not\b/g, "don't").replace(/\bdid not\b/g, "didn't").replace(/\bcannot\b|\bcan not\b/g, "can't")

type Unit = [english: string, chinese: string]
const unitsBySentence: Record<string, Unit[]> = {
  "Yes, I'm here.": [['Yes', '对，是的'], ["I'm here", '我在这里']],
  'Hi. I can hear you.': [['Hi', '你好'], ['I can hear you', '我听得见你']],
  'Who are you?': [['Who', '谁'], ['Who are you?', '你是谁？']],
  "I'll call you Morrow.": [["I'll", '我会，我以后会'], ['call you Morrow', '叫你墨洛']],
  'I feel calm.': [['I feel', '我感觉'], ['calm', '平静']],
  'I feel a little nervous too.': [['I feel', '我感觉'], ['a little nervous too', '也有一点紧张']],
  'The light feels warm.': [['the light', '这束光'], ['feels warm', '让人觉得暖暖的']],
  'The light feels soft.': [['the light', '这束光'], ['feels soft', '让人觉得柔和']],
  'It says “hello.”': [['It says', '上面写着'], ['hello', '你好']],
  'I can read part of it.': [['I can read', '我能读懂'], ['part of it', '其中一部分']],
  'Maybe it was a bell.': [['Maybe', '也许'], ['it was a bell', '那是铃铛声']],
  'Maybe it was just a soft sound.': [['Maybe', '也许'], ['it was just a soft sound', '那只是一声轻响']],
  "It's been busy.": [["It's been", '今天过得'], ['busy', '忙碌']],
  "It's been okay.": [["It's been", '今天过得'], ['okay', '还可以']],
  'I like quiet moments too.': [['I like', '我喜欢'], ['quiet moments too', '也喜欢安静的时候']],
  'I like lively places.': [['I like', '我喜欢'], ['lively places', '热闹的地方']],
  "Let's look around again.": [["Let's", '我们一起……吧'], ['look around again', '再看看周围']],
  "Let's listen for a while.": [["Let's", '我们一起……吧'], ['listen for a while', '听一会儿']],
  "Let's learn one new thing.": [["Let's", '我们一起……吧'], ['learn one new thing', '认识一样新东西']],
  "Let's go slowly.": [["Let's", '我们一起……吧'], ['go slowly', '慢慢来']],
  "We don't have to rush.": [["We don't have to", '我们不需要'], ['rush', '着急']],
  "I'm glad to be here.": [["I'm glad", '我很高兴'], ['to be here', '能在这里']],
  "I'm glad we met.": [["I'm glad", '我很高兴'], ['we met', '我们认识了']],
}

const orderSentences = new Set([
  "I'll call you Morrow.", 'The light feels warm.', 'The light feels soft.', 'Maybe it was a bell.',
  'Maybe it was just a soft sound.', "It's been busy.", "It's been okay.", 'I like quiet moments too.',
  'I like lively places.', "Let's look around again.", "Let's listen for a while.", "Let's learn one new thing.",
  "Let's go slowly.", "We don't have to rush.", "I'm glad to be here.", "I'm glad we met.",
])

export function teachingUnits(target: FixedContentLine): Unit[] {
  const english = target.learningContent.english
  const noticed = /^I noticed (the (?:lamp|plant|small bell)) first\.$/.exec(english)
  return noticed ? [['I noticed', '我注意到的是'], [noticed[1]!, noticed[1] === 'the lamp' ? '那盏灯' : noticed[1] === 'the plant' ? '那株植物' : '那只小铃铛'], ['first', '最先，第一眼']]
    : unitsBySentence[english] ?? [[english, target.learningContent.translation.textZh]]
}

export const teachingEvidenceKey = (english: string): string => `${TEACHING_PLAN_VERSION}:${normalizeSpeech(english)}`

/** 只编排当前所选表达，不从角色台词、中文选择或历史本地数据推断掌握。 */
export function buildTeachingSteps(eventId: string, target: FixedContentLine, reliable: Set<string>): FixedEventTeachingStep[] {
  const english = target.learningContent.english
  const chinese = target.learningContent.translation.textZh
  const firstExpression = eventId === 'birth_first_voice_v1'
  const units = teachingUnits(target)
  const noticed = /^I noticed (the (?:lamp|plant|small bell)) first\.$/.exec(english)
  const recall = eventId === 'b1_return_first_words_v1'
  const newUnits = recall || (!firstExpression && reliable.has(teachingEvidenceKey(english))) ? [] : units.filter(([text]) => firstExpression || !reliable.has(teachingEvidenceKey(text)))
  const steps: FixedEventTeachingStep[] = []
  if (newUnits.length && !firstExpression) steps.push({ id: 'understand_whole', kind: 'intro', english, chinese, options: [], answerIds: [] })
  // E01-02 的反问先看整体意思，再直接真实发问；不额外加一次同句跟读。
  const repeatUnits = english === 'What about you?' ? [] : newUnits
  steps.push(...repeatUnits.map(([text, zh], index): FixedEventTeachingStep => ({
    id: `repeat_${index}`, kind: 'repeat', english: text, chinese: zh, options: [], answerIds: [],
  })))
  if ((firstExpression && english !== 'Who are you?') || (orderSentences.has(english) && newUnits.length > 0 && !recall)) {
    steps.push({ id: 'build_order', kind: 'order', english: '', chinese: '把刚才学过的两段，按说话顺序排好。点已选语块可以撤回。',
      options: units.map(([text], index) => ({ id: `part_${index}`, label: index === 0 && english.startsWith('Yes') ? 'Yes,' : index === 0 && english.startsWith('Hi.') ? 'Hi.' : text })).reverse(),
      answerIds: units.map((_, index) => `part_${index}`) })
  }
  if (firstExpression && english === 'Who are you?') {
    steps.push({ id: 'understand_identity', kind: 'meaning', english: 'Who are you?', chinese: '这句话在做什么？语音补齐前先看图理解，本步不记录听力完成。',
      options: [{ id: 'identity', label: '询问陌生对象是谁' }, { id: 'presence', label: '告诉对方自己在这里' }], answerIds: ['identity'] })
  }
  if (noticed && newUnits.some(([text]) => text === 'first')) {
    steps.push({ id: 'build_gap', kind: 'gap', english: `I noticed ${noticed[1]} ___.`, chinese: '表达“第一眼注意到”，选一个放进句子。',
      options: [{ id: 'first', label: 'first' }, { id: 'too', label: 'too' }, { id: 'again', label: 'again' }], answerIds: ['first'] })
  }
  steps.push({ id: 'real_output', kind: 'output', english, chinese: recall ? '把第一次见面时说的那句话，再对墨洛说一次。' : chinese, options: [], answerIds: [] })
  return steps
}
