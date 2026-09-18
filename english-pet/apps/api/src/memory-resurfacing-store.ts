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
import { MemoryMemoryStore } from './memory-memory-store.js'

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

const tasksByUser = new Map<string, Map<string, IResurfacingTask>>()
const attemptsByUser = new Map<string, ResurfacingAttempt[]>()
const lastServedMemoryByUser = new Map<string, { memoryId: string; startOrdinal: number }>()

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

function taskMap(userId: string) {
  let map = tasksByUser.get(userId)
  if (!map) {
    map = new Map()
    tasksByUser.set(userId, map)
  }
  return map
}

function attempts(userId: string) {
  let list = attemptsByUser.get(userId)
  if (!list) {
    list = []
    attemptsByUser.set(userId, list)
  }
  return list
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

export class MemoryResurfacingStore {
  constructor(private readonly memoryStore: MemoryMemoryStore) {}

  selectForEvent(userId: string, definition: EventDefinition, eventStartOrdinal: number, completedCounts: ReadonlyMap<string, number>): ResurfacingPrompt | null {
    this.sync(userId)
    const now = Date.now()
    const lastServedMemory = lastServedMemoryByUser.get(userId)
    const candidates = [...taskMap(userId).values()]
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
    if (!selected) return null
    selected.status = 'eligible'
    return promptFor(selected)
  }

  recordAttempt(userId: string, eventInstanceId: string, prompt: ResurfacingPrompt, result: ResurfacingResult, eventStartOrdinal: number) {
    if (attempts(userId).some((attempt) => attempt.taskId === prompt.taskId && attempt.eventInstanceId === eventInstanceId)) return
    const task = taskMap(userId).get(prompt.taskId)
    if (!task || task.status === 'cancelled' || task.status === 'mastered') return
    const stamp = Date.now()
    attempts(userId).push({
      id: randomUUID(), taskId: task.id, eventInstanceId,
      mode: task.mode, result, createdAt: new Date(stamp).toISOString(),
    })
    task.serveCount += 1
    if (result === 'used' || result === 'paraphrased') task.successCount += 1
    task.lastServedAt = stamp
    task.lastServedStartOrdinal = eventStartOrdinal
    lastServedMemoryByUser.set(userId, { memoryId: task.memoryId, startOrdinal: eventStartOrdinal })
    task.cooldownUntil = stamp + task.cooldownHours * 3_600_000
    task.status = result === 'used' ? 'mastered' : 'served'
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
    const task = taskMap(userId).get(prompt.taskId)
    if (!task) return false
    if (!this.memoryStore.isConfirmedLanguageMemory(userId, prompt.memoryId)) {
      task.status = 'cancelled'
      return false
    }
    return task.status !== 'cancelled' && task.status !== 'mastered'
  }

  debug(userId: string) {
    this.sync(userId)
    return {
      tasks: [...taskMap(userId).values()].map((task) => ({ ...task })),
      attempts: [...attempts(userId)],
    }
  }

  clearUser(userId: string) {
    tasksByUser.delete(userId)
    attemptsByUser.delete(userId)
    lastServedMemoryByUser.delete(userId)
  }

  private sync(userId: string) {
    const activeMemories = this.memoryStore.confirmedLanguageMemories(userId)
    const activeIds = new Set(activeMemories.map((memory) => memory.id))
    const tasks = taskMap(userId)
    for (const task of tasks.values()) {
      if (!activeIds.has(task.memoryId)) task.status = 'cancelled'
    }
    for (const memory of activeMemories) {
      if (memory.semanticTags.includes('first_day')) {
        const key = `${memory.id}:first_day_v1:morrow_letter_v1`
        const existing = [...tasks.values()].find((task) => `${task.memoryId}:${task.sourceEventKey}:${task.targetEventKey}` === key)
        if (!existing) {
          const task: IResurfacingTask = {
            id: randomUUID(), userId, memoryId: memory.id, sourceEventKey: 'first_day_v1',
            targetEventKey: 'morrow_letter_v1', expression: memory.naturalExpression ?? memory.expression ?? memory.content,
            semanticContexts: ['returning after the first shared night', 'opening a new shared event'],
            mode: 'natural_modeling', status: 'pending', minEventGap: 1, cooldownHours: 20,
            cooldownUntil: null, lastServedAt: null, lastServedStartOrdinal: null, serveCount: 0, successCount: 0,
          }
          tasks.set(task.id, task)
        }
      }
      for (const sourceEvent of eventsV1.events) {
        for (const rule of sourceEvent.resurfacing) {
          if (!expressionMatches(memory, rule.expression)) continue
          for (const targetEventKey of rule.targetEventIds) {
            const key = `${memory.id}:${sourceEvent.id}:${targetEventKey}`
            const existing = [...tasks.values()].find((task) => `${task.memoryId}:${task.sourceEventKey}:${task.targetEventKey}` === key)
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
            tasks.set(task.id, task)
          }
        }
      }
    }
  }
}
