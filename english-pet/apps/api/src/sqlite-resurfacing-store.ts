import { randomUUID } from 'node:crypto'
import type {
  EventDefinition,
  Memory,
  ResurfacingAttempt,
  ResurfacingMode,
  ResurfacingPrompt,
  ResurfacingResult,
  ResurfacingStatus,
} from '@english-pet/contracts'
import { eventsV1 } from '@english-pet/domain'
import { fromJson, openDatabase, toJson } from './sqlite-db.js'
import type { SqliteMemoryStore } from './sqlite-memory-store.js'

/**
 * SQLite 持久化复现(resurfacing)任务/尝试/最近投放。行为与 MemoryResurfacingStore 完全一致。
 */

interface IResurfacingTask {
  id: string
  userId: string
  memoryId: string
  sourceEventKey: string
  targetEventKey: string
  expression: string
  semanticContexts: string[]
  mode: ResurfacingMode
  status: ResurfacingStatus
  minEventGap: number
  cooldownHours: number
  cooldownUntil: number | null
  lastServedAt: number | null
  lastServedStartOrdinal: number | null
  serveCount: number
  successCount: number
}

interface IResurfacingMeta {
  lastServedMemory: { memoryId: string; startOrdinal: number } | null
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[’]/g, "'").replace(/…/g, ' ').replace(/[^a-z0-9'\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function expressionMatches(memory: Memory, expression: string) {
  const pattern = normalize(expression.split('/')[0])
  if (!pattern) return false
  const values = [memory.content, memory.expression, memory.naturalExpression].filter((value): value is string => Boolean(value)).map(normalize)
  const terms = pattern.split(' ').filter((term) => term.length > 1)
  return values.some((value) => value.includes(pattern) || (terms.length >= 2 && terms.every((term) => value.includes(term))))
}

function promptFor(task: IResurfacingTask): ResurfacingPrompt {
  if (task.mode === 'natural_modeling') {
    return {
      taskId: task.id,
      memoryId: task.memoryId,
      expression: task.expression,
      semanticContexts: task.semanticContexts,
      mode: task.mode,
      prompt: `Morrow remembers your earlier words: “${task.expression}”. The new event continues from there without asking you to repeat them.`,
      promptZh: `Morrow 记得你上次确认留下的话：“${task.expression}”。新事件会自然承接它，不要求你重复练习。`,
    }
  }
  return {
    taskId: task.id,
    memoryId: task.memoryId,
    expression: task.expression,
    semanticContexts: task.semanticContexts,
    mode: task.mode,
    prompt: `If it fits what you mean, you could naturally reuse “${task.expression}”.`,
    promptZh: `如果符合你的真实意思，可以自然地再次使用“${task.expression}”。不用特意完成练习。`,
  }
}

interface IResurfacingState {
  tasks: Map<string, IResurfacingTask>
  attempts: ResurfacingAttempt[]
  meta: IResurfacingMeta
}

export class SqliteResurfacingStore {
  constructor(private readonly memoryStore: SqliteMemoryStore) {}

  private loadState(userId: string): IResurfacingState {
    const db = openDatabase()
    const taskRows = db.prepare('SELECT record FROM resurfacing_tasks WHERE user_id = ?').all(userId) as { record: string }[]
    const tasks = new Map<string, IResurfacingTask>()
    for (const row of taskRows) {
      const task = fromJson<IResurfacingTask>(row.record)!
      tasks.set(task.id, task)
    }
    const attemptRows = db.prepare('SELECT record FROM resurfacing_attempts WHERE user_id = ? ORDER BY rowid ASC').all(userId) as { record: string }[]
    const attempts = attemptRows.map((row) => fromJson<ResurfacingAttempt>(row.record)!)
    const metaRow = db.prepare('SELECT record FROM resurfacing_meta WHERE user_id = ?').get(userId) as { record: string } | undefined
    const meta = metaRow ? fromJson<IResurfacingMeta>(metaRow.record)! : { lastServedMemory: null }
    return { tasks, attempts, meta }
  }

  private saveState(userId: string, state: IResurfacingState, loadedAttemptCount: number) {
    const db = openDatabase()
    const upsert = db.prepare(
      `INSERT INTO resurfacing_tasks (id, user_id, record) VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET record = excluded.record`,
    )
    for (const task of state.tasks.values()) {
      upsert.run(task.id, userId, toJson(task))
    }
    const insertAttempt = db.prepare('INSERT OR IGNORE INTO resurfacing_attempts (id, user_id, record) VALUES (?, ?, ?)')
    for (const attempt of state.attempts.slice(loadedAttemptCount)) {
      insertAttempt.run(attempt.id, userId, toJson(attempt))
    }
    db.prepare(
      `INSERT INTO resurfacing_meta (user_id, record) VALUES (?, ?)
       ON CONFLICT(user_id) DO UPDATE SET record = excluded.record`,
    ).run(userId, toJson(state.meta))
  }

  selectForEvent(userId: string, definition: EventDefinition, eventStartOrdinal: number, completedCounts: ReadonlyMap<string, number>): ResurfacingPrompt | null {
    const state = this.loadState(userId)
    const loadedAttemptCount = state.attempts.length
    this.sync(userId, state)
    const now = Date.now()
    const lastServedMemory = state.meta.lastServedMemory
    const candidates = [...state.tasks.values()]
      .filter((task) => task.targetEventKey === definition.id)
      .filter((task) => task.status !== 'cancelled' && task.status !== 'mastered')
      .filter((task) => task.cooldownUntil === null || task.cooldownUntil <= now)
      .filter((task) => task.lastServedStartOrdinal === null || eventStartOrdinal - task.lastServedStartOrdinal >= 2)
      .filter((task) => !lastServedMemory || task.memoryId !== lastServedMemory.memoryId || eventStartOrdinal - lastServedMemory.startOrdinal >= 2)
      .filter((task) => {
        if (task.sourceEventKey === 'first_day_v1') return completedCounts.has('first_day_v1') || eventStartOrdinal >= task.minEventGap
        if (task.sourceEventKey === definition.id) return (completedCounts.get(definition.id) ?? 0) >= task.minEventGap
        const sourceIndex = eventsV1.events.findIndex((event) => event.id === task.sourceEventKey)
        const targetIndex = eventsV1.events.findIndex((event) => event.id === definition.id)
        return sourceIndex >= 0 && targetIndex - sourceIndex >= task.minEventGap
      })
      .sort((a, b) => a.serveCount - b.serveCount || (a.lastServedAt ?? 0) - (b.lastServedAt ?? 0))
    const selected = candidates[0]
    if (!selected) {
      this.saveState(userId, state, loadedAttemptCount)
      return null
    }
    selected.status = 'eligible'
    this.saveState(userId, state, loadedAttemptCount)
    return promptFor(selected)
  }

  recordAttempt(userId: string, eventInstanceId: string, prompt: ResurfacingPrompt, result: ResurfacingResult, eventStartOrdinal: number) {
    const state = this.loadState(userId)
    const loadedAttemptCount = state.attempts.length
    if (state.attempts.some((attempt) => attempt.taskId === prompt.taskId && attempt.eventInstanceId === eventInstanceId)) {
      this.saveState(userId, state, loadedAttemptCount)
      return
    }
    const task = state.tasks.get(prompt.taskId)
    if (!task || task.status === 'cancelled' || task.status === 'mastered') {
      this.saveState(userId, state, loadedAttemptCount)
      return
    }
    const stamp = Date.now()
    state.attempts.push({
      id: randomUUID(), taskId: task.id, eventInstanceId,
      mode: task.mode, result, createdAt: new Date(stamp).toISOString(),
    })
    task.serveCount += 1
    if (result === 'used' || result === 'paraphrased') task.successCount += 1
    task.lastServedAt = stamp
    task.lastServedStartOrdinal = eventStartOrdinal
    state.meta.lastServedMemory = { memoryId: task.memoryId, startOrdinal: eventStartOrdinal }
    task.cooldownUntil = stamp + task.cooldownHours * 3_600_000
    task.status = result === 'used' ? 'mastered' : 'served'
    this.saveState(userId, state, loadedAttemptCount)
  }

  inferResult(prompt: ResurfacingPrompt, text: string | undefined, action: string): ResurfacingResult {
    if (action === 'decline') return 'declined'
    if (!text?.trim()) return 'not_applicable'
    const input = normalize(text)
    const expression = normalize(prompt.expression)
    if (input.includes(expression)) return 'used'
    const terms = expression.split(' ').filter((term) => term.length > 2)
    return terms.length >= 2 && terms.filter((term) => input.includes(term)).length >= Math.ceil(terms.length / 2)
      ? 'paraphrased'
      : 'ignored'
  }

  isPromptActive(userId: string, prompt: ResurfacingPrompt | null) {
    if (!prompt) return false
    const state = this.loadState(userId)
    const loadedAttemptCount = state.attempts.length
    const task = state.tasks.get(prompt.taskId)
    if (!task) {
      this.saveState(userId, state, loadedAttemptCount)
      return false
    }
    if (!this.memoryStore.isConfirmedLanguageMemory(userId, prompt.memoryId)) {
      task.status = 'cancelled'
      this.saveState(userId, state, loadedAttemptCount)
      return false
    }
    this.saveState(userId, state, loadedAttemptCount)
    return task.status !== 'cancelled' && task.status !== 'mastered'
  }

  debug(userId: string) {
    const state = this.loadState(userId)
    this.sync(userId, state)
    return {
      tasks: [...state.tasks.values()].map((task) => ({ ...task })),
      attempts: [...state.attempts],
    }
  }

  clearUser(userId: string) {
    const db = openDatabase()
    db.prepare('DELETE FROM resurfacing_tasks WHERE user_id = ?').run(userId)
    db.prepare('DELETE FROM resurfacing_attempts WHERE user_id = ?').run(userId)
    db.prepare('DELETE FROM resurfacing_meta WHERE user_id = ?').run(userId)
  }

  private sync(userId: string, state: IResurfacingState) {
    const activeMemories = this.memoryStore.confirmedLanguageMemories(userId)
    const activeIds = new Set(activeMemories.map((memory) => memory.id))
    for (const task of state.tasks.values()) {
      if (!activeIds.has(task.memoryId)) task.status = 'cancelled'
    }
    for (const memory of activeMemories) {
      if (memory.semanticTags.includes('first_day')) {
        const key = `${memory.id}:first_day_v1:morrow_letter_v1`
        const existing = [...state.tasks.values()].find((task) => `${task.memoryId}:${task.sourceEventKey}:${task.targetEventKey}` === key)
        if (!existing) {
          const task: IResurfacingTask = {
            id: randomUUID(), userId, memoryId: memory.id, sourceEventKey: 'first_day_v1',
            targetEventKey: 'morrow_letter_v1', expression: memory.naturalExpression ?? memory.expression ?? memory.content,
            semanticContexts: ['returning after the first shared night', 'opening a new shared event'],
            mode: 'natural_modeling', status: 'pending', minEventGap: 1, cooldownHours: 20,
            cooldownUntil: null, lastServedAt: null, lastServedStartOrdinal: null, serveCount: 0, successCount: 0,
          }
          state.tasks.set(task.id, task)
        }
      }
      for (const sourceEvent of eventsV1.events) {
        for (const rule of sourceEvent.resurfacing) {
          if (!expressionMatches(memory, rule.expression)) continue
          for (const targetEventKey of rule.targetEventIds) {
            const key = `${memory.id}:${sourceEvent.id}:${targetEventKey}`
            const existing = [...state.tasks.values()].find((task) => `${task.memoryId}:${task.sourceEventKey}:${task.targetEventKey}` === key)
            if (existing) {
              if (existing.status === 'cancelled') existing.status = 'pending'
              continue
            }
            const task: IResurfacingTask = {
              id: randomUUID(), userId, memoryId: memory.id, sourceEventKey: sourceEvent.id,
              targetEventKey, expression: rule.expression, semanticContexts: rule.semanticContexts,
              mode: 'optional_prompt', status: 'pending', minEventGap: rule.minEventGap,
              cooldownHours: rule.cooldownHours, cooldownUntil: null, lastServedAt: null,
              lastServedStartOrdinal: null, serveCount: 0, successCount: 0,
            }
            state.tasks.set(task.id, task)
          }
        }
      }
    }
  }
}
