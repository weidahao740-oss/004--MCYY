import type { InterfaceLocale } from '@english-pet/contracts'

const copy = {
  'zh-CN': {
    brandTagline: '一间温柔记住你的房间',
    room: '房间', events: '事件', journal: '记忆册', memories: '记忆', chat: '对话', settings: '设置', signOut: '退出',
    heroEyebrow: '安静的英语伙伴', heroKicker: '房间正在等待',
    heroTitle: '不用说得完美，也可以被理解。',
    heroBody: 'Morrow 是来自失语小岛的 AI 生物。每天用英语处理一件生活小事，留下共同记忆；离开和回来都没有打卡压力。',
    equalTitle: '文字与语音同等有效', equalBody: '可以打字、说话，或修改参考句。',
    memoryTitle: '由你决定记住什么', memoryBody: '每条个人记忆都可以审核、编辑、暂停或拒绝。',
    enterEyebrow: '进入房间', enterTitle: '注册之前也可以开始',
    enterBody: '访客进度暂时保留在当前浏览器。绑定账号后可为跨设备同步做准备。',
    continueGuest: '以访客身份继续', orAccount: '或使用账号', login: '登录', register: '创建账号',
    email: '邮箱', password: '密码', nickname: '名字或昵称',
    roomState: '房间状态', relationshipNew: '关系：初识', deviceOnly: '仅此设备', accountSynced: '账号已绑定',
    todayEvent: '今日事件', available: '可以开始', minutes: '分钟',
    greet: '向 Morrow 打招呼', listen: '一起听窗外', rest: '让房间安静一会儿',
    memoryNotice: '个人记忆只会在你审核后保存。',
    settingsEyebrow: '你的控制项', settingsTitle: '对话与界面设置',
    settingsBody: '界面语言只改变产品菜单和说明；Morrow 仍默认使用英语与你交流。',
    interfaceLanguage: '界面语言', chinese: '中文', english: 'English',
    englishVoice: '英语与语音', englishSupport: '英语辅助程度', speechRate: '语速',
    moreSupport: '更多辅助', everyday: '日常英语', independent: '独立表达', nuance: '更多细微表达', slow: '慢速', normal: '正常',
    memoryAccess: '记忆与可访问性', memoryAccessBody: '暂停记忆后，所有个人记忆都不会进入后续 AI 上下文。',
    subtitles: '字幕', subtitlesBody: '显示 Morrow 英语语音对应的文字。',
    voiceInput: '语音输入', voiceInputBody: '接入语音功能后允许使用麦克风。',
    voiceOutput: '语音播放', voiceOutputBody: '可用时播放 Morrow 的英语语音。',
    useMemories: '使用已保存记忆', useMemoriesBody: '暂停或恢复全部已确认个人记忆。',
    devStorage: '当前为开发内存存储。接入 PostgreSQL 前，重启 API 会清空账号与设置。',
    saved: '设置已保存', saveFailed: '设置未能保存', connectionQuiet: '连接暂时安静了，请稍后再试。',
    notFound: '页面不存在', backHome: '返回首页',
  },
  en: {
    brandTagline: 'a room that remembers gently',
    room: 'Room', events: 'Events', journal: 'Journal', memories: 'Memories', chat: 'Chat', settings: 'Settings', signOut: 'Sign out',
    heroEyebrow: 'A quiet English companion', heroKicker: 'The room is waiting',
    heroTitle: 'Speak imperfectly. Be understood anyway.',
    heroBody: 'Morrow is an AI creature from an island losing its voice. Handle one small life event in English, leave a shared memory, and return without streaks or guilt.',
    equalTitle: 'Text and voice are equal', equalBody: 'Type, speak, or adapt a reference line.',
    memoryTitle: 'You decide what is remembered', memoryBody: 'Review, edit, pause, or reject every personal memory.',
    enterEyebrow: 'Enter the room', enterTitle: 'Begin before you sign up',
    enterBody: 'A guest session stays in this browser. Bind an account later for another device.',
    continueGuest: 'Continue as guest', orAccount: 'or use an account', login: 'Sign in', register: 'Create account',
    email: 'Email', password: 'Password', nickname: 'Name or nickname',
    roomState: 'Room state', relationshipNew: 'Relationship: new', deviceOnly: 'This device only', accountSynced: 'Account synced',
    todayEvent: 'Today’s event', available: 'Available', minutes: 'minutes',
    greet: 'Greet Morrow', listen: 'Listen outside together', rest: 'Let the room rest',
    memoryNotice: 'Personal memories are saved only after you review them.',
    settingsEyebrow: 'Your controls', settingsTitle: 'Conversation and interface settings',
    settingsBody: 'Interface language changes product menus and explanations only. Morrow still speaks English by default.',
    interfaceLanguage: 'Interface language', chinese: '中文', english: 'English',
    englishVoice: 'English and voice', englishSupport: 'English support', speechRate: 'Speech rate',
    moreSupport: 'More support', everyday: 'Everyday English', independent: 'Independent', nuance: 'More nuance', slow: 'Slow', normal: 'Normal',
    memoryAccess: 'Memory and accessibility', memoryAccessBody: 'Pausing memory stops all personal memories from entering future AI context.',
    subtitles: 'Subtitles', subtitlesBody: 'Show text for Morrow’s spoken replies.',
    voiceInput: 'Voice input', voiceInputBody: 'Allow microphone input when voice is connected.',
    voiceOutput: 'Voice output', voiceOutputBody: 'Play Morrow’s English voice when available.',
    useMemories: 'Use saved memories', useMemoriesBody: 'Pause or resume all confirmed personal memories.',
    devStorage: 'Development storage is currently in memory. Restarting the API clears accounts and settings until PostgreSQL is connected.',
    saved: 'Settings saved', saveFailed: 'Settings could not be saved', connectionQuiet: 'The connection went quiet for a moment.',
    notFound: 'Page not found', backHome: 'Back home',
  },
} as const

export function getCopy(locale: InterfaceLocale) {
  return copy[locale]
}

export function currentLocale(value: string | undefined): InterfaceLocale {
  return value === 'en' ? 'en' : 'zh-CN'
}
