import { randomUUID } from 'node:crypto'
import type { EventDefinition, JournalActionRequest, JournalEntry } from '@english-pet/contracts'
import { getEventDefinition } from '@english-pet/domain'
import { MemoryMemoryStore } from './memory-memory-store.js'

export interface JournalCreateInput {
  userId: string
  eventInstanceId: string
  eventKey: string
  outcomeId: string
  userExpression: string | null
}

interface IJournalRecord extends JournalEntry {
  userId: string
  baseMorrowMemory: string | null
}

const journalsByUser = new Map<string, Map<string, IJournalRecord>>()
const journalIdByEventInstance = new Map<string, string>()
const responseByIdempotencyKey = new Map<string, JournalEntry>()

function recordsFor(userId: string) {
  let records = journalsByUser.get(userId)
  if (!records) {
    records = new Map()
    journalsByUser.set(userId, records)
  }
  return records
}

function worldChange(definition: EventDefinition, outcomeId: string) {
  const outcome = definition.outcomes.find((item) => item.id === outcomeId)
  if (!outcome) return null
  const writes = outcome.worldStateWrites.map((item) => `${item.key}: ${String(item.value)}`)
  return writes.length > 0 ? writes.join(' · ') : outcome.visibleEffect
}

function firstNaturalExpression(definition: EventDefinition, userExpression: string | null) {
  if (userExpression && definition.keyExpressions.some((expression) => userExpression.toLowerCase().includes(expression.replace('…', '').toLowerCase()))) {
    return userExpression
  }
  return definition.keyExpressions[0] ?? null
}

function baseRelationshipMemory(definition: EventDefinition, outcomeId: string) {
  const rule = definition.memoryProposals.find((item) => item.kind === 'relationship')
  const outcome = definition.outcomes.find((item) => item.id === outcomeId)
  if (!rule || !outcome || outcomeId === 'closed_without_sharing') return null
  const values = Object.fromEntries(outcome.worldStateWrites.map((write) => [write.key, String(write.value)]))
  return rule.contentTemplate.replace(/\{\{([a-z0-9_]+)\}\}/g, (_, key: string) => values[key] ?? outcome.label)
}

function publicEntry(record: IJournalRecord, memoryStore: MemoryMemoryStore): JournalEntry {
  const linked = memoryStore.confirmedForEvent(record.userId, record.eventInstanceId).find((memory) => memory.kind === 'relationship')
  const { userId: _userId, baseMorrowMemory: _baseMorrowMemory, ...entry } = record
  return {
    ...entry,
    whatMorrowRemembers: linked?.content ?? null,
    linkedMemoryId: linked?.id ?? null,
    linkedMemoryVersion: linked?.version ?? null,
  }
}

export class MemoryJournalStore {
  constructor(private readonly memoryStore: MemoryMemoryStore) {}

  createFirstDay(input: { userId: string; eventInstanceId: string; userExpression: string; restoredObject: 'lamp' | 'plant' }): JournalEntry {
    const existingId = journalIdByEventInstance.get(input.eventInstanceId)
    const existing = existingId ? recordsFor(input.userId).get(existingId) : undefined
    if (existing) return publicEntry(existing, this.memoryStore)
    const stamp = new Date().toISOString()
    const record: IJournalRecord = {
      id: randomUUID(), userId: input.userId, eventInstanceId: input.eventInstanceId,
      eventKey: 'first_day_v1', title: 'The first light in the room', titleZh: '房间里的第一束光',
      whatHappened: `You told Morrow one thing about today and restored the ${input.restoredObject}.`,
      whatUserSaid: input.userExpression,
      naturalExpression: input.userExpression,
      pronunciationNote: null,
      whatMorrowRemembers: null,
      linkedMemoryId: null,
      linkedMemoryVersion: null,
      worldChange: `first_restored_object: ${input.restoredObject} · first_day_status: completed`,
      visibility: 'visible', version: 1, createdAt: stamp, updatedAt: stamp,
      baseMorrowMemory: `You and Morrow restored the ${input.restoredObject} on your first night.`,
    }
    recordsFor(input.userId).set(record.id, record)
    journalIdByEventInstance.set(input.eventInstanceId, record.id)
    return publicEntry(record, this.memoryStore)
  }

  createFromEvent(input: JournalCreateInput): JournalEntry {
    const existingId = journalIdByEventInstance.get(input.eventInstanceId)
    const existing = existingId ? recordsFor(input.userId).get(existingId) : undefined
    if (existing) return publicEntry(existing, this.memoryStore)
    const definition = getEventDefinition(input.eventKey)
    const outcome = definition?.outcomes.find((item) => item.id === input.outcomeId)
    if (!definition || !outcome) throw new Error('journal_event_invalid')
    const stamp = new Date().toISOString()
    const record: IJournalRecord = {
      id: randomUUID(), userId: input.userId, eventInstanceId: input.eventInstanceId,
      eventKey: definition.id, title: definition.title, titleZh: definition.titleZh,
      whatHappened: outcome.visibleEffect,
      whatUserSaid: input.userExpression,
      naturalExpression: firstNaturalExpression(definition, input.userExpression),
      pronunciationNote: null,
      whatMorrowRemembers: null,
      linkedMemoryId: null,
      linkedMemoryVersion: null,
      worldChange: worldChange(definition, outcome.id),
      visibility: 'visible', version: 1, createdAt: stamp, updatedAt: stamp,
      baseMorrowMemory: baseRelationshipMemory(definition, outcome.id),
    }
    recordsFor(input.userId).set(record.id, record)
    journalIdByEventInstance.set(input.eventInstanceId, record.id)
    return publicEntry(record, this.memoryStore)
  }

  list(userId: string) {
    return [...recordsFor(userId).values()]
      .filter((record) => record.visibility !== 'deleted')
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .map((record) => publicEntry(record, this.memoryStore))
  }

  clearUser(userId: string) {
    const records = journalsByUser.get(userId)
    if (records) {
      for (const record of records.values()) journalIdByEventInstance.delete(record.eventInstanceId)
    }
    journalsByUser.delete(userId)
    for (const key of [...responseByIdempotencyKey.keys()]) {
      if (key.startsWith(`${userId}:`)) responseByIdempotencyKey.delete(key)
    }
  }

  act(userId: string, journalId: string, input: JournalActionRequest): JournalEntry {
    const cacheKey = `${userId}:${input.idempotencyKey}`
    const cached = responseByIdempotencyKey.get(cacheKey)
    if (cached) return cached
    const record = recordsFor(userId).get(journalId)
    if (!record || record.visibility === 'deleted') throw new Error('journal_not_found')
    if (record.version !== input.expectedVersion) throw new Error('journal_version_conflict')

    if (input.action === 'edit') {
      const patch = input.patch!
      if (patch.whatHappened !== undefined) record.whatHappened = patch.whatHappened
      if (patch.whatUserSaid !== undefined) record.whatUserSaid = patch.whatUserSaid
      if (patch.naturalExpression !== undefined) record.naturalExpression = patch.naturalExpression
      if (patch.whatMorrowRemembers !== undefined && patch.whatMorrowRemembers !== null) {
        const current = publicEntry(record, this.memoryStore)
        if (!current.linkedMemoryId || !current.linkedMemoryVersion) throw new Error('journal_memory_not_confirmed')
        this.memoryStore.editLinkedMemory(
          userId,
          current.linkedMemoryId,
          current.linkedMemoryVersion,
          patch.whatMorrowRemembers ?? '',
          `${input.idempotencyKey}:memory`,
        )
      }
    } else if (input.action === 'hide' && record.visibility === 'visible') {
      record.visibility = 'hidden'
    } else if (input.action === 'restore' && record.visibility === 'hidden') {
      record.visibility = 'visible'
    } else if (input.action === 'delete') {
      record.visibility = 'deleted'
    } else {
      throw new Error('journal_action_not_allowed')
    }

    record.version += 1
    record.updatedAt = new Date().toISOString()
    const result = publicEntry(record, this.memoryStore)
    responseByIdempotencyKey.set(cacheKey, result)
    return result
  }
}
