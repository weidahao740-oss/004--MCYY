import { useEffect, useState } from 'react'
import { BookOpenText, ChevronLeft, CircleUserRound, Home, Mic, Pause, Play, RotateCcw, Settings, Sparkles, Volume2, VolumeX } from 'lucide-react'
import { Image } from '@/components/ui/image'

const BASE = `${(import.meta.env.MIAODA_CLIENT_BASE_PATH || '').replace(/\/$/, '')}/`
const STORAGE_KEY = 'morrow-ch1-fixed-course:v1'

type Page = 'welcome' | 'encounter' | 'home' | 'lesson' | 'growth' | 'echoes' | 'settings'
type EncounterStep = 'wake' | 'intro' | 'observe' | 'chooseIntent' | 'restore' | 'restoreSentence' | 'complete'
type HomeMode = 'explore' | 'invite' | 'free' | 'quiet' | 'resume'
type LessonStep = 'context' | 'wordWindow' | 'phraseWindow' | 'wordBell' | 'sentence' | 'listenCheck' | 'speak' | 'result' | 'finished'
type SupportMode = 'beginner' | 'basic' | 'independent'
type EchoTab = 'recent' | 'review' | 'familiar'
type RestoredObject = 'lamp' | 'plant' | 'bell' | null

interface ISavedState { onboarded: boolean; pausedLesson: boolean; restoredObject: RestoredObject; explored: boolean }
const initialSaved: ISavedState = { onboarded: false, pausedLesson: false, restoredObject: null, explored: false }

function readSaved(): ISavedState {
  try { return { ...initialSaved, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } as ISavedState } catch { return initialSaved }
}
function saveState(value: ISavedState) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)) } catch { /* 原型仍可继续 */ } }

const encounterCopy: Record<EncounterStep, [string, string]> = {
  wake: ['Hello? I can hear someone beyond the room.', '你好？我能听见房间外有人。'],
  intro: ["I'm Morrow. What should we do first?", '我是 Morrow。我们先做什么？'],
  observe: ['I hear a soft sound by the window.', '我听见窗边有一个轻轻的声音。'],
  chooseIntent: ['You want to help me understand this room.', '你想帮我弄清这个房间。'],
  restore: ['The room remembers three things.', '房间记得三样东西。'],
  restoreSentence: ['Which one should we bring back first?', '我们应该先让哪一件回来？'],
  complete: ['The room is a little clearer now.', '房间现在清楚了一点。'],
}

const objectMeta = {
  lamp: { name: '窗边的灯', sentence: "Let's bring back the lamp.", result: 'The lamp is steady now.' },
  plant: { name: '门边的植物', sentence: 'I choose the plant.', result: 'The plant looks less lost now.' },
  bell: { name: '小铃铛', sentence: "Let's bring back the small bell.", result: 'The bell makes one low note.' },
}

export default function HomePage() {
  const [saved, setSaved] = useState<ISavedState>(readSaved)
  const [page, setPage] = useState<Page>(saved.onboarded ? 'home' : 'welcome')
  const [encounterStep, setEncounterStep] = useState<EncounterStep>('wake')
  const [homeMode, setHomeMode] = useState<HomeMode>(saved.pausedLesson ? 'resume' : 'invite')
  const [lessonStep, setLessonStep] = useState<LessonStep>('context')
  const [supportMode, setSupportMode] = useState<SupportMode>('beginner')
  const [echoTab, setEchoTab] = useState<EchoTab>('recent')
  const [selectedObject, setSelectedObject] = useState<RestoredObject>(null)
  const [translation, setTranslation] = useState(false)
  const [muted, setMuted] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (page !== 'home' || homeMode !== 'explore') return
    const timer = window.setTimeout(() => {
      setSaved(current => {
        const next = { ...current, explored: true }
        saveState(next)
        return next
      })
      setHomeMode('free')
    }, 2600)
    return () => window.clearTimeout(timer)
  }, [page, homeMode])

  function persist(patch: Partial<ISavedState>) {
    setSaved(current => {
      const next = { ...current, ...patch }
      saveState(next)
      return next
    })
  }
  function goHome(mode: HomeMode = 'free') { setPage('home'); setHomeMode(mode); setTranslation(false) }
  function startLesson() { setPage('lesson'); setLessonStep(saved.pausedLesson ? 'sentence' : supportMode === 'beginner' ? 'context' : supportMode === 'basic' ? 'phraseWindow' : 'sentence'); setTranslation(false) }
  function chooseObject(object: Exclude<RestoredObject, null>) { setSelectedObject(object); setEncounterStep('restoreSentence') }
  function replay(text: string) { setNotice(muted ? '声音已关闭，可在设置中重新开启。' : `重听：${text}`) }
  function resetPrototype() { saveState(initialSaved); setSaved(initialSaved); setPage('welcome'); setEncounterStep('wake'); setHomeMode('invite'); setLessonStep('context'); setSelectedObject(null); setEchoTab('recent') }

  const room = `${BASE}assets/morrow-room.png`
  const lessonCopy: [string, string] = lessonStep === 'context' ? ['窗帘轻轻动了一下。', '窗边传来一声很轻的响动。'] : lessonStep === 'wordWindow' ? ['Window.', '窗户。'] : lessonStep === 'phraseWindow' ? ['By the window.', '在窗边。'] : lessonStep === 'wordBell' ? ['Bell.', '铃铛。'] : lessonStep === 'sentence' ? ['I hear a bell by the window.', '我听见窗边有铃铛声。'] : lessonStep === 'listenCheck' ? ['Where is the bell?', '铃铛在哪里？'] : lessonStep === 'speak' ? ['Say it with me.', '跟我一起说。'] : ['The sound is clear now.', '声音现在清楚了。']

  return <main className="prototype-shell"><section className="phone" aria-label="Morrow 全产品可点击原型（第一章样板内容）">
    <Image src={room} loading="eager" decoding="sync" alt="Morrow 在固定房间中" className="room-image"/><div className="shade"/>

    {page === 'welcome' && <div className="welcome panel-page"><button className="welcome-sound" aria-label={muted ? '打开声音' : '关闭声音'} onClick={() => setMuted(v => !v)}>{muted ? <VolumeX/> : <Volume2/>}</button><div className="breath-light"/><div className="welcome-content"><p>欢迎来到 Morrow 的成长世界</p><h1>房间里有一个微弱的声音。</h1><button className="welcome-start" onClick={() => { setEncounterStep('wake'); setPage('encounter') }}>去看看是谁</button></div></div>}

    {page === 'encounter' && <div className="panel-page encounter-page"><div className="top-status">第一次相遇</div><Dialogue english={encounterCopy[encounterStep][0]} chinese={encounterCopy[encounterStep][1]} showChinese={translation} onTranslation={() => setTranslation(v => !v)} onReplay={() => replay(encounterCopy[encounterStep][0])}/><div className="bottom-stack encounter-actions">
      {encounterStep === 'wake' && <button className="primary" onClick={() => setEncounterStep('intro')}>继续听</button>}
      {encounterStep === 'intro' && <button className="primary" onClick={() => setEncounterStep('observe')}>看看 Morrow 在听哪里</button>}
      {encounterStep === 'observe' && <><p className="hint">不用说英语，先用动作回应。</p><div className="touch-choices"><button onClick={() => { setNotice('Morrow 的耳朵转向窗边。'); setEncounterStep('chooseIntent') }}>点 Morrow 的耳朵</button><button onClick={() => { setNotice('窗帘轻轻动了一下。'); setEncounterStep('chooseIntent') }}>点窗边</button><button onClick={() => { setNotice('铃铛只响了半声。'); setEncounterStep('chooseIntent') }}>点小铃铛</button></div></>}
      {encounterStep === 'chooseIntent' && <><p className="hint">Morrow 会给出预设表达，你只需选择当前想做的事。</p><div className="intent-list"><button onClick={() => setEncounterStep('restore')}><b>Let me help you.</b><span>让我帮你。</span></button><button onClick={() => setEncounterStep('restore')}><b>Are you all right?</b><span>你还好吗？</span></button></div></>}
      {encounterStep === 'restore' && <><p className="hint">选择一件先恢复的物品。</p><div className="object-choices"><button onClick={() => chooseObject('lamp')}>灯</button><button onClick={() => chooseObject('plant')}>植物</button><button onClick={() => chooseObject('bell')}>小铃铛</button></div></>}
      {encounterStep === 'restoreSentence' && selectedObject && <div className="confirm-card"><span>Morrow 教你这样表达</span><blockquote>{objectMeta[selectedObject].sentence}</blockquote><small>{selectedObject === 'lamp' ? '让我们把灯带回来。' : selectedObject === 'plant' ? '我选择植物。' : '让我们把小铃铛带回来。'}</small><button className="primary" onClick={() => setEncounterStep('complete')}><Mic/>跟着说一次</button><button className="secondary" onClick={() => setEncounterStep('complete')}>先听懂并继续</button></div>}
      {encounterStep === 'complete' && selectedObject && <div className="confirm-card"><b>{objectMeta[selectedObject].result}</b><span>你通过动作、选择和跟读完成了第一次互动。</span><button className="primary" onClick={() => { persist({ onboarded: true, restoredObject: selectedObject }); goHome(saved.explored ? 'free' : 'explore') }}>回到房间</button></div>}
    </div></div>}

    {page === 'home' && <div className="panel-page home-page"><div className="header-row"><span className="status-pill">{homeMode === 'invite' ? '正在听窗边的声音' : homeMode === 'quiet' ? '正在安静陪伴' : homeMode === 'resume' ? '还记得窗边的声音' : '正在观察房间'}</span><button className="icon-button" aria-label="设置" onClick={() => setPage('settings')}><Settings/></button></div><button className="morrow-hotspot" aria-label="摸摸 Morrow" onClick={() => { persist({ explored: true }); setHomeMode('free'); setNotice('Morrow 闭了闭眼，尾巴的光暖了一点。') }}/>
      {homeMode === 'invite' && <><div className="speech-bubble morrow-dialogue"><p className="english">I hear something near the window.</p>{translation && <p className="translation">我听见窗边有一点声音。</p>}<div className="dialogue-tools"><button className="replay-button" onClick={() => replay('I hear something near the window.')}><span className="play-disc"><Play/></span><span>重听</span></button><button className="translation-button" onClick={() => setTranslation(v => !v)}>{translation ? '收起中文' : '查看中文'}</button></div></div><div className="home-actions"><button className="primary" onClick={startLesson}>跟 Morrow 一起看看</button><button className="secondary" onClick={() => setHomeMode('free')}>稍后再说</button></div></>}
      {homeMode === 'explore' && <div className="explore-tip" role="status">可以点点 Morrow 或房间里的东西试试看。</div>}
      {homeMode === 'free' && <div className="home-actions"><button className="primary" onClick={startLesson}>继续 Morrow 的下一段互动</button><button className="text-button" onClick={() => setHomeMode('quiet')}>安静待一会</button></div>}
      {homeMode === 'quiet' && <div className="quiet-card"><p>We can stay quiet.</p><span>我们可以安静待着。这里没有要完成的任务。</span><button className="secondary" onClick={() => setHomeMode('free')}>想继续时再回来</button></div>}
      {homeMode === 'resume' && <div className="resume-card"><b>上次停在窗边</b><span>Morrow 会从上次确认的固定步骤继续。</span><button className="primary" onClick={startLesson}>继续刚才</button><button className="secondary" onClick={() => { persist({ pausedLesson: false }); setHomeMode('free') }}>这次先不继续</button></div>}
      <BottomNav page={page} onChange={setPage}/></div>}

    {page === 'lesson' && <div className="panel-page scene-page"><div className="header-row"><span className="status-pill">Morrow 正带你听窗边</span><button className="pause-button" onClick={() => { persist({ pausedLesson: true }); goHome('resume') }}><Pause/>暂停</button></div><div className="learning-stage">{supportMode === 'beginner' ? '启蒙支持' : supportMode === 'basic' ? '基础支持' : '自主练习'}</div><Dialogue english={lessonCopy[0]} chinese={lessonCopy[1]} showChinese={translation} onTranslation={() => setTranslation(v => !v)} onReplay={() => replay(lessonCopy[0])} scene/>
      {lessonStep === 'context' && <div className="scene-actions"><p className="hint">先看画面，不需要说英语：窗帘动了，Morrow 的耳朵转向窗边。</p><button className="primary" onClick={() => setLessonStep('wordWindow')}>点一下窗户</button><button className="text-button" onClick={() => goHome('quiet')}>先安静待一会</button></div>}
      {lessonStep === 'wordWindow' && <div className="scene-actions"><LearningCard english="window" chinese="窗户" note="Morrow 看向窗户，把声音和物体连在一起。"/><button className="primary" onClick={() => setLessonStep('phraseWindow')}>认识了，继续</button><button className="secondary" onClick={() => setNotice('window · 窗户')}>再听一遍</button></div>}
      {lessonStep === 'phraseWindow' && <div className="scene-actions"><LearningCard english="by the window" chinese="在窗边" note="by 在这里表示在……旁边。"/><button className="primary" onClick={() => setLessonStep('wordBell')}>继续听声音</button></div>}
      {lessonStep === 'wordBell' && <div className="scene-actions"><LearningCard english="bell" chinese="铃铛" note="铃铛轮廓亮了一下，同时响起半声低鸣。"/><button className="primary" onClick={() => setLessonStep('sentence')}>把词放进句子</button></div>}
      {lessonStep === 'sentence' && <div className="scene-actions"><div className="sentence-builder"><span>I hear a</span><b>bell</b><span>by the window.</span><small>我听见窗边有铃铛声。</small></div><button className="primary" onClick={() => setLessonStep('listenCheck')}>听完整句</button><button className="secondary" onClick={() => setNotice('播放速度：0.8×')}>慢一点听</button></div>}
      {lessonStep === 'listenCheck' && <div className="scene-actions"><p className="hint">根据刚才的画面，铃铛在哪里？</p><div className="location-choices"><button onClick={() => setNotice('再看一眼 Morrow 耳朵的方向。')}>房间中央</button><button className="correct" onClick={() => setLessonStep('speak')}>在窗边</button></div></div>}
      {lessonStep === 'speak' && <div className="scene-actions"><LearningCard english="I hear a bell by the window." chinese="我听见窗边有铃铛声。" note="可以跟着 Morrow 说，也可以先听懂。"/><button className="primary" onClick={() => setLessonStep('result')}><Mic/>跟着说一次</button><button className="secondary" onClick={() => setLessonStep('result')}>先听懂并继续</button></div>}
      {lessonStep === 'result' && <div className="result-card"><Sparkles/><b>铃铛发出一声清楚的低鸣。</b><span>Morrow 走近窗边，房间真的发生了变化。</span><button className="primary" onClick={() => { persist({ pausedLesson: false }); setLessonStep('finished') }}>看看这次经历</button></div>}
      {lessonStep === 'finished' && <div className="finish-sheet"><b>The sound is clear now.</b><span>声音现在清楚了。Morrow 第一次走近了窗边。</span><blockquote>I hear a bell by the window.</blockquote><small>你完成了：看懂场景 → 认识词和短语 → 理解句子 → 跟读或听懂。</small><button className="primary" onClick={() => goHome('free')}>回到房间</button><button className="secondary" onClick={() => setLessonStep(supportMode === 'beginner' ? 'context' : 'sentence')}>再体验一次</button><button className="text-button" onClick={() => setPage('echoes')}>查看刚遇见的表达</button></div>}
    </div>}

    {page === 'growth' && <div className="list-page"><h1>成长</h1><p>这里只回看已经发生的变化。</p>{saved.restoredObject ? <><article><Sparkles/><div><b>Morrow 第一次走近了窗边</b><span>它现在会朝声音的方向转动耳朵。</span></div></article><article><Home/><div><b>{objectMeta[saved.restoredObject].name}回到了房间</b><span>这是你们共同留下的第一处变化。</span></div></article></> : <p className="empty-state">还没有成长变化。先回到房间陪陪 Morrow。</p>}<BottomNav page={page} onChange={setPage}/></div>}
    {page === 'echoes' && <div className="list-page"><h1>词语回声</h1><p>这里只出现 Morrow 已经带你遇见的表达。</p><div className="tabs"><button className={echoTab === 'recent' ? 'active' : ''} onClick={() => setEchoTab('recent')}>最近遇见</button><button className={echoTab === 'review' ? 'active' : ''} onClick={() => setEchoTab('review')}>还想再用</button><button className={echoTab === 'familiar' ? 'active' : ''} onClick={() => setEchoTab('familiar')}>已经很熟</button></div>{!saved.onboarded ? <p className="empty-state">还没有遇见可以回看的词语。</p> : echoTab === 'recent' ? <><article><Volume2/><div><b>window</b><span>窗户 · Morrow 第一次听声音时</span></div></article><article><Volume2/><div><b>by the window</b><span>在窗边 · 判断声音位置时</span></div></article></> : <p className="empty-state">这里还没有表达。以后遇见更多内容时会自动归入。</p>}<BottomNav page={page} onChange={setPage}/></div>}
    {page === 'settings' && <div className="list-page settings-page"><button className="back-button" onClick={() => goHome('free')} aria-label="返回"><ChevronLeft/></button><h1>设置与隐私</h1><h2>学习支持</h2><div className="mode-picker"><button className={supportMode === 'beginner' ? 'active' : ''} onClick={() => setSupportMode('beginner')}><b>启蒙支持</b><span>中文默认显示，从画面和单词开始</span></button><button className={supportMode === 'basic' ? 'active' : ''} onClick={() => setSupportMode('basic')}><b>基础支持</b><span>从短语和完整句开始</span></button><button className={supportMode === 'independent' ? 'active' : ''} onClick={() => setSupportMode('independent')}><b>自主练习</b><span>从完整句和听力确认开始</span></button></div><p className="privacy-copy">Morrow 按预设课程安排内容和复现节奏；用户不用自己找学习内容。</p><h2>体验设置</h2><button className="setting-row" onClick={() => setMuted(v => !v)}><span>{muted ? <VolumeX/> : <Volume2/>}声音</span><b>{muted ? '已关闭' : '已开启'}</b></button><button className="setting-row" onClick={() => setNotice('当前原型固定使用 1.0× 语速。')}><span>默认语速</span><b>1.0×</b></button><h2>记忆与数据</h2><p className="privacy-copy">只记录预设课程步骤、用户确认的选择和已发生的世界变化；原始录音不长期保存。</p><button className="setting-row" onClick={resetPrototype}><span><RotateCcw/>重新体验产品原型</span><b>清空本地进度</b></button></div>}
    {notice && <div className="toast" role="status" aria-live="polite">{notice}</div>}
  </section></main>
}

function Dialogue({ english, chinese, showChinese, onTranslation, onReplay, scene = false }: { english: string; chinese: string; showChinese: boolean; onTranslation: () => void; onReplay: () => void; scene?: boolean }) {
  const isChineseLead = /[\u4e00-\u9fff]/.test(english)
  return <div className={scene ? 'scene-response morrow-dialogue' : 'dialogue-card morrow-dialogue'}><p className={isChineseLead ? 'context-line' : 'english'}>{english}</p>{showChinese && !isChineseLead && <p className="translation">{chinese}</p>}{isChineseLead && <p className="translation">{chinese}</p>}<div className="dialogue-tools"><button className="replay-button" onClick={onReplay}><span className="play-disc"><Play/></span><span>重听</span></button>{!isChineseLead && <button className="translation-button" onClick={onTranslation} aria-expanded={showChinese}>{showChinese ? '收起中文' : '查看中文'}</button>}</div></div>
}
function LearningCard({ english, chinese, note }: { english: string; chinese: string; note: string }) { return <div className="learning-card"><b>{english}</b><span>{chinese}</span><small>{note}</small></div> }
function BottomNav({ page, onChange }: { page: Page; onChange: (page: Page) => void }) { return <nav className="bottom-nav" aria-label="主导航"><button className={page === 'home' ? 'active' : ''} onClick={() => onChange('home')}><CircleUserRound/>陪伴</button><button className={page === 'growth' ? 'active' : ''} onClick={() => onChange('growth')}><Sparkles/>成长</button><button className={page === 'echoes' ? 'active' : ''} onClick={() => onChange('echoes')}><BookOpenText/>词语回声</button></nav> }
