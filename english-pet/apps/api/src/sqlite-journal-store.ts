import { randomUUID } from 'node:crypto'
import type { EventDefinition, FixedEvent, JournalActionRequest, JournalEntry } from '@english-pet/contracts'
import { getEventDefinition } from '@english-pet/domain'
import { fromJson, openDatabase, toJson } from './sqlite-db.js'
import type { SqliteMemoryStore } from './sqlite-memory-store.js'

/**
 * SQLite 持久化共同记忆 journal。行为与 MemoryJournalStore 完全一致。
 */

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

export class SqliteJournalStore {
  constructor(private readonly memoryStore: SqliteMemoryStore) {}

  private recordsFor(userId: string): Map<string, IJournalRecord> {
    const rows = openDatabase().prepare('SELECT record FROM journals WHERE user_id = ?').all(userId) as { record: string }[]
    const map = new Map<string, IJournalRecord>()
    for (const row of rows) {
      const rec = fromJson<IJournalRecord>(row.record)!
      map.set(rec.id, rec)
    }
    return map
  }

  private saveRecord(record: IJournalRecord) {
    openDatabase()
      .prepare(
        `INSERT INTO journals (id, user_id, event_instance_id, record) VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET event_instance_id = excluded.event_instance_id, record = excluded.record`,
      )
      .run(record.id, record.userId, record.eventInstanceId, toJson(record))
  }

  private findByEventInstance(eventInstanceId: string, userId: string): IJournalRecord | null {
    const row = openDatabase().prepare('SELECT record FROM journals WHERE event_instance_id = ?').get(eventInstanceId) as { record: string } | undefined
    if (!row) return null
    const rec = fromJson<IJournalRecord>(row.record)!
    return rec.userId === userId ? rec : null
  }

  private publicEntry(record: IJournalRecord): JournalEntry {
    const linked = this.memoryStore.confirmedForEvent(record.userId, record.eventInstanceId).find((memory) => memory.kind === 'relationship')
    const { userId: _userId, baseMorrowMemory: _baseMorrowMemory, ...entry } = record
    return {
      ...entry,
      whatMorrowRemembers: linked?.content ?? null,
      linkedMemoryId: linked?.id ?? null,
      linkedMemoryVersion: linked?.version ?? null,
    }
  }

  private getIdempotency(cacheKey: string): JournalEntry | null {
    const row = openDatabase().prepare("SELECT response FROM idempotency WHERE scope = 'journal' AND cache_key = ?").get(cacheKey) as { response: string } | undefined
    return row ? fromJson<JournalEntry>(row.response) : null
  }

  private upsertIdempotency(cacheKey: string, response: JournalEntry) {
    openDatabase()
      .prepare(
        `INSERT INTO idempotency (scope, cache_key, response) VALUES ('journal', ?, ?)
         ON CONFLICT(scope, cache_key) DO UPDATE SET response = excluded.response`,
      )
      .run(cacheKey, toJson(response))
  }

  createFirstDay(input: { userId: string; eventInstanceId: string; userExpression: string; restoredObject: 'lamp' | 'plant' }): JournalEntry {
    const existing = this.findByEventInstance(input.eventInstanceId, input.userId)
    if (existing) return this.publicEntry(existing)
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
      textVersion: null,
      translationVersion: null,
    }
    this.saveRecord(record)
    return this.publicEntry(record)
  }

  createFromEvent(input: JournalCreateInput): JournalEntry {
    const existing = this.findByEventInstance(input.eventInstanceId, input.userId)
    if (existing) return this.publicEntry(existing)
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
      textVersion: null,
      translationVersion: null,
    }
    this.saveRecord(record)
    return this.publicEntry(record)
  }

  /**
   * 固定内容事件完成时写一条可见日记。按 eventInstanceId 去重（沿用 findByEventInstance）。
   * textVersion/translationVersion 由引擎从本次 outcome 的结果台词第一条解析后传入。
   */
  createFromFixedEvent(input: {
    userId: string
    instanceId: string
    event: FixedEvent
    outcomeId: string
    userExpression: string | null
    textVersion: string
    translationVersion: string
  }): JournalEntry {
    const existing = this.findByEventInstance(input.instanceId, input.userId)
    if (existing) return this.publicEntry(existing)
    const outcome = input.event.outcomes.find((item) => item.id === input.outcomeId)
    if (!outcome) throw new Error('journal_event_invalid')
    const stamp = new Date().toISOString()
    const worldChangeText = outcome.worldStateWrites.map((item) => `${item.key}: ${String(item.value)}`).join(' · ')
    const record: IJournalRecord = {
      id: randomUUID(), userId: input.userId, eventInstanceId: input.instanceId,
      eventKey: input.event.id, title: input.event.titleZh, titleZh: input.event.titleZh,
      whatHappened: outcome.labelZh,
      whatUserSaid: input.userExpression,
      naturalExpression: input.userExpression,
      pronunciationNote: null,
      whatMorrowRemembers: null,
      linkedMemoryId: null,
      linkedMemoryVersion: null,
      worldChange: worldChangeText || outcome.labelZh,
      visibility: 'visible', version: 1, createdAt: stamp, updatedAt: stamp,
      baseMorrowMemory: null,
      textVersion: input.textVersion,
      translationVersion: input.translationVersion,
    }
    this.saveRecord(record)
    return this.publicEntry(record)
  }

  list(userId: string) {
    return [...this.recordsFor(userId).values()]
      .filter((record) => record.visibility !== 'deleted')
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .map((record) => this.publicEntry(record))
  }

  clearUser(userId: string) {
    const db = openDatabase()
    db.prepare('DELETE FROM journals WHERE user_id = ?').run(userId)
    db.prepare("DELETE FROM idempotency WHERE scope = 'journal' AND cache_key LIKE ?").run(`${userId}:%`)
  }

  act(userId: string, journalId: string, input: JournalActionRequest): JournalEntry {
    const cacheKey = `${userId}:${input.idempotencyKey}`
    const cached = this.getIdempotency(cacheKey)
    if (cached) return cached
    const records = this.recordsFor(userId)
    const record = records.get(journalId)
    if (!record || record.visibility === 'deleted') throw new Error('journal_not_found')
    if (record.version !== input.expectedVersion) throw new Error('journal_version_conflict')

    if (input.action === 'edit') {
      const patch = input.patch!
      if (patch.whatHappened !== undefined) record.whatHappened = patch.whatHappened
      if (patch.whatUserSaid !== undefined) record.whatUserSaid = patch.whatUserSaid
      if (patch.naturalExpression !== undefined) record.naturalExpression = patch.naturalExpression
      if (patch.whatMorrowRemembers !== undefined && patch.whatMorrowRemembers !== null) {
        const current = this.publicEntry(record)
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
    this.saveRecord(record)
    const result = this.publicEntry(record)
    this.upsertIdempotency(cacheKey, result)
    return result
  }
}
