export type SupportMode = 'beginner' | 'basic' | 'independent'
export type RestoreObject = 'lamp' | 'plant' | 'bell'
export interface TeachingUnit {
  id: string
  english: string
  chinese: string
  explanation: string
  covers: string[]
}
export interface TeachingCourse {
  id: string
  target: string
  chinese: string
  context: string
  units: TeachingUnit[]
  chunks: string[]
  required: string[]
  locationCheck?: boolean
}
const bell: TeachingUnit = { id: 'bell', english: 'bell', chinese: '铃铛', explanation: '发出轻响的，就是铃铛。', covers: ['bell'] }
const windowUnit: TeachingUnit = { id: 'window', english: 'window', chinese: '窗户', explanation: '窗帘旁边，就是窗户。', covers: ['window'] }
const location: TeachingUnit = { id: 'by-the-window', english: 'by the window', chinese: '在窗边', explanation: '开头表示“在旁边”，后面指眼前这扇窗户，合起来就是“在窗边”。', covers: ['by', 'the-window', 'by-the-window'] }
export function restoreCourse(object: RestoreObject): TeachingCourse {
  const name = object === 'lamp' ? '灯' : object === 'plant' ? '植物' : '小铃铛'
  const noun = object === 'bell' ? 'the small bell' : `the ${object}`
  const objectUnits: TeachingUnit[] = object === 'bell' ? [bell,
    { id: 'small', english: 'small', chinese: '小的', explanation: '这个词表示“小的”。', covers: ['small'] },
    { id: 'the-small-bell', english: noun, chinese: '这只小铃铛', explanation: '中间的词表示“小的”，和铃铛连起来就是“小铃铛”。最前面的词，指眼前这只。', covers: ['small', 'small-bell', 'the-bell', 'the-small-bell'] },
  ] : [
    { id: object, english: object, chinese: name, explanation: `这是你选中的${name}。`, covers: [object] },
    { id: `the-${object}`, english: noun, chinese: `这${object === 'lamp' ? '盏灯' : '株植物'}`, explanation: '最前面的词，指我们眼前选中的这一件。', covers: [`the-${object}`] },
  ]
  const units: TeachingUnit[] = [...objectUnits,
    { id: 'bring-back', english: 'bring back', chinese: '找回来', explanation: '这两个词一起表示“找回来”。我们要让它重新变清楚。', covers: ['bring-back'] },
    { id: 'lets', english: "Let's", chinese: '我们来……吧', explanation: '这是邀请一起做一件事：“我们来……吧”。', covers: ['lets'] },
  ]
  return { id: `restore-${object}`, target: `Let's bring back ${noun}.`, chinese: `我们把${name}找回来吧。`, context: `我们一起把${name}找回来，让它重新变清楚。`, units, chunks: ["Let's", 'bring back', noun], required: units.flatMap(unit => unit.covers) }
}
export const windowCourse: TeachingCourse = {
  id: 'window-sound', target: 'I hear a bell by the window.', chinese: '我听见窗边有铃铛声。', context: '窗边有一点轻响，我们一起听听是什么。',
  units: [windowUnit, bell,
    { id: 'bell-position', english: 'The bell is by the window.', chinese: '小铃铛在窗边。', explanation: '开头指刚才那只铃铛，中间连接它所在的位置：就在窗边。', covers: ['the-bell', 'is-position'] },
    location,
    { id: 'hear', english: 'hear', chinese: '听见', explanation: '听到了声音，就是“听见”。', covers: ['hear'] },
    { id: 'i-hear', english: 'I hear', chinese: '我听见……', explanation: '第一个词是“我”，第二个词是“听见”。现在来说说你听见了什么。', covers: ['i', 'hear', 'i-hear'] },
    { id: 'a-bell', english: 'a bell', chinese: '一只铃铛', explanation: '开头表示“一只”，引出听见的东西。接在“我听见”后，就是听见铃铛声。', covers: ['a', 'a-bell'] },
  ], chunks: ['I hear', 'a bell', 'by the window'], required: ['window', 'bell', 'by', 'the-window', 'by-the-window', 'i', 'hear', 'i-hear', 'a', 'a-bell'], locationCheck: true,
}
