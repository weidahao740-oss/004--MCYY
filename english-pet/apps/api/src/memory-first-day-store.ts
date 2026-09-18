import { randomUUID } from 'node:crypto'
import type { FirstDayActionRequest, FirstDayState, FirstDayView, Memory } from '@english-pet/contracts'
import { MemoryAccountStore } from './memory-account-store.js'
import { MemoryEventEngine } from './memory-event-engine.js'
import { MemoryJournalStore } from './memory-journal-store.js'
import { MemoryMemoryStore } from './memory-memory-store.js'

interface IFirstDayRecord {
  instanceId: string
  userId: string
  status: FirstDayView['status']
  state: FirstDayState
  nickname: string | null
  todayExpression: string | null
  understoodMeaning: string | null
  restoredObject: 'lamp' | 'plant' | null
  proposalIds: string[]
  journalId: string | null
  responses: Map<string, FirstDayView>
}

const recordsByUser = new Map<string, IFirstDayRecord>()

const screenCopy: Record<FirstDayState, { lines: string[]; zh: string; en: string }> = {
  FD00_ENTRY: { lines: ['There is a faint voice in the room.'], zh: '选择聆听，或只使用文字开始。', en: 'Listen, or begin with text only.' },
  FD01_WAKE: { lines: ["Hello? I can hear you, but the room is still quiet. I’m Morrow.", 'I found your voice before I found the way home.'], zh: '认识 Morrow，然后继续。', en: 'Meet Morrow, then continue.' },
  FD02_NAME: { lines: ['What should I call you?'], zh: '输入名字或昵称，也可以暂时跳过。', en: 'Enter a name or nickname, or skip for now.' },
  FD03_TODAY: { lines: ['Before we fix the room, tell me one small thing about today.', 'Was it quiet, busy, or strange?'], zh: '用一句英语说说今天；可以输入或使用语音转写。', en: 'Share one thing about today in English, by text or voice transcript.' },
  FD04_UNDERSTOOD: { lines: ['Let me make sure I understood.', 'Did I understand that correctly?'], zh: '确认 Morrow 对你意思的理解。', en: 'Confirm that Morrow understood your meaning.' },
  FD05_RESTORE: { lines: ['The room remembers two things, but only one can return tonight.', 'Which one should we bring back?'], zh: '用英语选择窗边的灯或门边的植物。', en: 'Choose the lamp by the window or the plant by the door in English.' },
  FD06_MEMORY_REVIEW: { lines: ['I can remember a few things from tonight, but only if you want me to.'], zh: '逐条审核记忆提案；保存、修改或不保存都可以。', en: 'Review every memory proposal. Save, edit, or reject each one.' },
  FD07_JOURNAL: { lines: ['That is enough for our first night. The room will still be here when you return.'], zh: '查看第一篇共同记忆，然后结束首日。', en: 'Review the first shared memory, then finish the first day.' },
  COMPLETED: { lines: ['The room will still be here when you return.'], zh: '首日已经完成。', en: 'Your first day is complete.' },
}

function recordFor(userId: string) {
  let record = recordsByUser.get(userId)
  if (!record) {
    record = {
      instanceId: randomUUID(), userId, status: 'not_started', state: 'FD00_ENTRY',
      nickname: null, todayExpression: null, understoodMeaning: null, restoredObject: null,
      proposalIds: [], journalId: null, responses: new Map(),
    }
    recordsByUser.set(userId, record)
  }
  return record
}

export class MemoryFirstDayStore {
  constructor(
    private readonly accountStore: MemoryAccountStore,
    private readonly memoryStore: MemoryMemoryStore,
    private readonly journalStore: MemoryJournalStore,
    private readonly eventEngine: MemoryEventEngine,
  ) {}

  get(userId: string): FirstDayView {
    return this.view(recordFor(userId))
  }

  act(userId: string, input: FirstDayActionRequest): FirstDayView {
    const record = recordFor(userId)
    const cached = record.responses.get(input.idempotencyKey)
    if (cached) return cached

    if (input.action === 'start' && record.state === 'FD00_ENTRY') {
      record.status = 'in_progress'; record.state = 'FD01_WAKE'
      this.accountStore.updateFirstDay(userId, 'in_progress')
    } else if (input.action === 'continue' && record.state === 'FD01_WAKE') {
      record.state = 'FD02_NAME'
    } else if ((input.action === 'submit_name' || input.action === 'skip_name') && record.state === 'FD02_NAME') {
      record.nickname = input.action === 'submit_name' ? input.text!.trim() : null
      record.state = 'FD03_TODAY'
    } else if (input.action === 'submit_today' && record.state === 'FD03_TODAY') {
      record.todayExpression = input.text!.trim()
      record.understoodMeaning = record.todayExpression
      record.state = 'FD04_UNDERSTOOD'
    } else if (input.action === 'confirm_understanding' && record.state === 'FD04_UNDERSTOOD') {
      record.state = 'FD05_RESTORE'
    } else if (input.action === 'select_object' && record.state === 'FD05_RESTORE') {
      record.restoredObject = input.object!
      this.accountStore.updateFirstDayWorld(userId, input.object!)
      const proposals = this.memoryStore.proposeFirstDay(userId, record.instanceId, record.nickname, record.todayExpression!, input.object!)
      record.proposalIds = proposals.map((proposal) => proposal.id)
      record.state = 'FD06_MEMORY_REVIEW'
    } else if (input.action === 'complete_memory_review' && record.state === 'FD06_MEMORY_REVIEW') {
      if (this.pendingProposals(record).length > 0) throw new Error('first_day_memory_review_incomplete')
      const journal = this.journalStore.createFirstDay({
        userId, eventInstanceId: record.instanceId, userExpression: record.todayExpression!, restoredObject: record.restoredObject!,
      })
      record.journalId = journal.id
      record.state = 'FD07_JOURNAL'
    } else if (input.action === 'finish' && record.state === 'FD07_JOURNAL') {
      record.state = 'COMPLETED'; record.status = 'completed'
      this.accountStore.updateFirstDay(userId, 'completed')
      this.eventEngine.markFirstDayCompleted(userId, record.restoredObject!)
    } else {
      throw new Error('first_day_action_not_allowed')
    }

    const result = this.view(record)
    record.responses.set(input.idempotencyKey, result)
    return result
  }

  clearUser(userId: string) {
    recordsByUser.delete(userId)
  }

  private pendingProposals(record: IFirstDayRecord): Memory[] {
    const proposed = this.memoryStore.list(record.userId, true).proposed
    const ids = new Set(record.proposalIds)
    return proposed.filter((memory) => ids.has(memory.id))
  }

  private view(record: IFirstDayRecord): FirstDayView {
    const screen = screenCopy[record.state]
    const journal = record.journalId ? this.journalStore.list(record.userId).find((entry) => entry.id === record.journalId) ?? null : null
    return {
      instanceId: record.instanceId,
      status: record.status,
      state: record.state,
      morrowLines: screen.lines,
      userTaskZh: screen.zh,
      userTaskEn: screen.en,
      nickname: record.nickname,
      todayExpression: record.todayExpression,
      understoodMeaning: record.understoodMeaning,
      restoredObject: record.restoredObject,
      proposals: this.pendingProposals(record),
      journal,
    }
  }
}
