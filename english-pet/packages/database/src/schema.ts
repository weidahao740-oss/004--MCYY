import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
}

export const accountKindEnum = pgEnum('account_kind', ['guest', 'registered'])
export const userStatusEnum = pgEnum('user_status', [
  'active',
  'suspended',
  'deletion_pending',
  'deleted',
])
export const identityProviderEnum = pgEnum('identity_provider', [
  'email',
  'phone',
  'wechat',
  'apple',
])
export const relationshipStageEnum = pgEnum('relationship_stage', [
  'NEW',
  'FAMILIAR',
  'TRUSTED',
  'CLOSE',
])
export const languageLevelEnum = pgEnum('language_level', ['L1', 'L2', 'L3', 'L4'])
export const replyLengthEnum = pgEnum('reply_length', ['short', 'standard'])
export const speechRateEnum = pgEnum('speech_rate', ['1.0', '0.8', '0.6'])
export const correctionPreferenceEnum = pgEnum('correction_preference', [
  'after_conversation',
  'only_when_blocking',
])
export const conversationKindEnum = pgEnum('conversation_kind', [
  'first_day',
  'event',
  'free_chat',
])
export const conversationStatusEnum = pgEnum('conversation_status', [
  'active',
  'paused',
  'completed',
  'abandoned',
])
export const messageRoleEnum = pgEnum('message_role', [
  'user',
  'assistant',
  'system',
  'tool',
])
export const messageInputModeEnum = pgEnum('message_input_mode', [
  'text',
  'voice',
  'reference_reply',
  'choice',
  'system',
])
export const messageStatusEnum = pgEnum('message_status', [
  'pending',
  'accepted',
  'failed',
  'cancelled',
])
export const eventDefinitionStatusEnum = pgEnum('event_definition_status', [
  'draft',
  'active',
  'retired',
])
export const eventInstanceStatusEnum = pgEnum('event_instance_status', [
  'available',
  'active',
  'paused',
  'completed',
  'abandoned',
])
export const eventTransitionTriggerEnum = pgEnum('event_transition_trigger', [
  'continue',
  'meaning_understood',
  'meaning_ambiguous',
  'clarification_resolved',
  'choice_confirmed',
  'user_declines',
  'result_committed',
])
export const idempotencyStatusEnum = pgEnum('idempotency_status', [
  'processing',
  'completed',
  'failed',
])
export const memoryKindEnum = pgEnum('memory_kind', [
  'life',
  'language',
  'relationship',
])
export const memoryStatusEnum = pgEnum('memory_status', [
  'proposed',
  'confirmed',
  'paused',
  'rejected',
  'deleted',
  'expired',
])
export const memoryConfidenceEnum = pgEnum('memory_confidence', [
  'high',
  'medium',
  'low',
])
export const memorySensitivityEnum = pgEnum('memory_sensitivity', [
  'normal',
  'restricted',
])
export const memoryRevisionActionEnum = pgEnum('memory_revision_action', [
  'propose',
  'confirm',
  'edit',
  'pause',
  'resume',
  'reject',
  'delete',
  'expire',
])
export const revisionActorEnum = pgEnum('revision_actor', ['user', 'system'])
export const journalVisibilityEnum = pgEnum('journal_visibility', [
  'visible',
  'hidden',
  'deleted',
])
export const languageFeedbackResultEnum = pgEnum('language_feedback_result', [
  'successful',
  'more_natural',
  'affects_understanding',
])
export const resurfacingStatusEnum = pgEnum('resurfacing_status', [
  'pending',
  'eligible',
  'served',
  'mastered',
  'snoozed',
  'cancelled',
])
export const resurfacingModeEnum = pgEnum('resurfacing_mode', [
  'optional_prompt',
  'natural_modeling',
])
export const resurfacingResultEnum = pgEnum('resurfacing_result', [
  'used',
  'paraphrased',
  'ignored',
  'declined',
  'not_applicable',
])
export const consentTypeEnum = pgEnum('consent_type', [
  'terms',
  'privacy',
  'memory_storage',
  'voice_processing',
  'analytics',
])
export const consentDecisionEnum = pgEnum('consent_decision', [
  'granted',
  'denied',
  'withdrawn',
])
export const consentSourceEnum = pgEnum('consent_source', [
  'onboarding',
  'settings',
  'memory_review',
])
export const deletionRequestStatusEnum = pgEnum('deletion_request_status', [
  'requested',
  'cooling_off',
  'processing',
  'completed',
  'cancelled',
  'failed',
])

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountKind: accountKindEnum('account_kind').notNull().default('guest'),
    status: userStatusEnum('status').notNull().default('active'),
    locale: varchar('locale', { length: 16 }).notNull().default('zh-CN'),
    timeZone: varchar('time_zone', { length: 64 })
      .notNull()
      .default('Asia/Shanghai'),
    ...timestamps,
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    purgeAfter: timestamp('purge_after', { withTimezone: true }),
  },
  (table) => [index('users_status_idx').on(table.status, table.deletedAt)],
)

export const userIdentities = pgTable(
  'user_identities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: identityProviderEnum('provider').notNull(),
    providerSubject: varchar('provider_subject', { length: 255 }).notNull(),
    emailNormalized: varchar('email_normalized', { length: 320 }),
    phoneE164: varchar('phone_e164', { length: 32 }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    ...timestamps,
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('user_identities_provider_subject_uq').on(
      table.provider,
      table.providerSubject,
    ),
    index('user_identities_user_idx').on(table.userId, table.deletedAt),
  ],
)

export const guestSessions = pgTable(
  'guest_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 128 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('guest_sessions_token_hash_uq').on(table.tokenHash),
    index('guest_sessions_user_active_idx').on(
      table.userId,
      table.revokedAt,
      table.expiresAt,
    ),
  ],
)

export const pets = pgTable(
  'pets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    characterKey: varchar('character_key', { length: 64 })
      .notNull()
      .default('morrow'),
    displayName: varchar('display_name', { length: 64 })
      .notNull()
      .default('Morrow'),
    personaVersion: varchar('persona_version', { length: 64 })
      .notNull()
      .default('morrow-1.0'),
    relationshipStage: relationshipStageEnum('relationship_stage')
      .notNull()
      .default('NEW'),
    meaningfulInteractionCount: integer('meaningful_interaction_count')
      .notNull()
      .default(0),
    communicationSuccessCount: integer('communication_success_count')
      .notNull()
      .default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('pets_user_uq').on(table.userId),
    check('pets_meaningful_count_nonnegative', sql`${table.meaningfulInteractionCount} >= 0`),
    check('pets_communication_count_nonnegative', sql`${table.communicationSuccessCount} >= 0`),
  ],
)

export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  languageLevel: languageLevelEnum('language_level').notNull().default('L2'),
  preferredReplyLength: replyLengthEnum('preferred_reply_length')
    .notNull()
    .default('standard'),
  speechRate: speechRateEnum('speech_rate').notNull().default('1.0'),
  subtitlesEnabled: boolean('subtitles_enabled').notNull().default(true),
  correctionPreference: correctionPreferenceEnum('correction_preference')
    .notNull()
    .default('after_conversation'),
  memoryEnabled: boolean('memory_enabled').notNull().default(true),
  voiceInputEnabled: boolean('voice_input_enabled').notNull().default(true),
  voiceOutputEnabled: boolean('voice_output_enabled').notNull().default(true),
  interfaceLocale: varchar('interface_locale', { length: 16 })
    .notNull()
    .default('zh-CN'),
  timeZone: varchar('time_zone', { length: 64 })
    .notNull()
    .default('Asia/Shanghai'),
  ...timestamps,
})

export const eventDefinitions = pgTable(
  'event_definitions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventKey: varchar('event_key', { length: 96 }).notNull(),
    version: varchar('version', { length: 32 }).notNull(),
    rulesetId: varchar('ruleset_id', { length: 96 }).notNull(),
    personaVersion: varchar('persona_version', { length: 64 }).notNull(),
    promptVersion: varchar('prompt_version', { length: 64 }).notNull(),
    outputSchemaVersion: varchar('output_schema_version', { length: 64 }).notNull(),
    configJson: jsonb('config_json').notNull(),
    configHash: varchar('config_hash', { length: 64 }).notNull(),
    status: eventDefinitionStatusEnum('status').notNull().default('draft'),
    activatedAt: timestamp('activated_at', { withTimezone: true }),
    retiredAt: timestamp('retired_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('event_definitions_key_version_uq').on(
      table.eventKey,
      table.version,
    ),
    uniqueIndex('event_definitions_config_hash_uq').on(table.configHash),
    index('event_definitions_active_idx').on(table.eventKey, table.status),
  ],
)

export const eventInstances = pgTable(
  'event_instances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    petId: uuid('pet_id')
      .notNull()
      .references(() => pets.id, { onDelete: 'cascade' }),
    eventDefinitionId: uuid('event_definition_id')
      .notNull()
      .references(() => eventDefinitions.id, { onDelete: 'restrict' }),
    eventKey: varchar('event_key', { length: 96 }).notNull(),
    eventVersion: varchar('event_version', { length: 32 }).notNull(),
    rulesetId: varchar('ruleset_id', { length: 96 }).notNull(),
    status: eventInstanceStatusEnum('status').notNull().default('available'),
    currentStateId: varchar('current_state_id', { length: 96 }).notNull(),
    statePayload: jsonb('state_payload').notNull().default(sql`'{}'::jsonb`),
    definitionSnapshot: jsonb('definition_snapshot').notNull(),
    attemptCount: integer('attempt_count').notNull().default(0),
    lastIdempotencyKey: varchar('last_idempotency_key', { length: 160 }),
    availableAt: timestamp('available_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    pausedAt: timestamp('paused_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    abandonedAt: timestamp('abandoned_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index('event_instances_user_status_idx').on(
      table.userId,
      table.status,
      table.availableAt,
    ),
    index('event_instances_definition_idx').on(table.eventDefinitionId),
    uniqueIndex('event_instances_one_open_per_user_uq')
      .on(table.userId)
      .where(sql`${table.status} in ('active', 'paused')`),
    check('event_instances_attempt_nonnegative', sql`${table.attemptCount} >= 0`),
  ],
)

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    petId: uuid('pet_id')
      .notNull()
      .references(() => pets.id, { onDelete: 'cascade' }),
    eventInstanceId: uuid('event_instance_id').references(
      () => eventInstances.id,
      { onDelete: 'set null' },
    ),
    kind: conversationKindEnum('kind').notNull(),
    status: conversationStatusEnum('status').notNull().default('active'),
    summary: text('summary'),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    ...timestamps,
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('conversations_user_recent_idx').on(table.userId, table.lastMessageAt),
    index('conversations_event_idx').on(table.eventInstanceId),
  ],
)

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: messageRoleEnum('role').notNull(),
    contentText: text('content_text').notNull(),
    inputMode: messageInputModeEnum('input_mode').notNull(),
    asrConfidence: doublePrecision('asr_confidence'),
    eventStateId: varchar('event_state_id', { length: 96 }),
    clientMessageId: varchar('client_message_id', { length: 160 }).notNull(),
    modelOutputJson: jsonb('model_output_json'),
    status: messageStatusEnum('status').notNull().default('accepted'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('messages_conversation_client_uq').on(
      table.conversationId,
      table.clientMessageId,
    ),
    index('messages_conversation_time_idx').on(
      table.conversationId,
      table.createdAt,
    ),
    index('messages_user_deleted_idx').on(table.userId, table.deletedAt),
    check(
      'messages_asr_confidence_range',
      sql`${table.asrConfidence} is null or (${table.asrConfidence} >= 0 and ${table.asrConfidence} <= 1)`,
    ),
  ],
)

export const eventTransitionLogs = pgTable(
  'event_transition_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventInstanceId: uuid('event_instance_id')
      .notNull()
      .references(() => eventInstances.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    messageId: uuid('message_id').references(() => messages.id, {
      onDelete: 'set null',
    }),
    fromStateId: varchar('from_state_id', { length: 96 }),
    toStateId: varchar('to_state_id', { length: 96 }).notNull(),
    trigger: eventTransitionTriggerEnum('trigger').notNull(),
    guardResult: jsonb('guard_result').notNull().default(sql`'{}'::jsonb`),
    idempotencyKey: varchar('idempotency_key', { length: 160 }).notNull(),
    payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('event_transition_user_idempotency_uq').on(
      table.userId,
      table.idempotencyKey,
    ),
    index('event_transition_instance_time_idx').on(
      table.eventInstanceId,
      table.createdAt,
    ),
  ],
)

export const eventOutcomes = pgTable(
  'event_outcomes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventInstanceId: uuid('event_instance_id')
      .notNull()
      .references(() => eventInstances.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    outcomeId: varchar('outcome_id', { length: 96 }).notNull(),
    worldStateWrites: jsonb('world_state_writes')
      .notNull()
      .default(sql`'[]'::jsonb`),
    effectSummary: text('effect_summary').notNull(),
    committedAt: timestamp('committed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('event_outcomes_instance_uq').on(table.eventInstanceId),
    index('event_outcomes_user_idx').on(table.userId, table.committedAt),
  ],
)

export const userWorldState = pgTable(
  'user_world_state',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    petId: uuid('pet_id')
      .notNull()
      .references(() => pets.id, { onDelete: 'cascade' }),
    stateKey: varchar('state_key', { length: 96 }).notNull(),
    stateValue: jsonb('state_value').notNull(),
    sourceEventInstanceId: uuid('source_event_instance_id').references(
      () => eventInstances.id,
      { onDelete: 'set null' },
    ),
    version: integer('version').notNull().default(1),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('user_world_state_key_uq').on(
      table.userId,
      table.petId,
      table.stateKey,
    ),
    check('user_world_state_version_positive', sql`${table.version} > 0`),
  ],
)

export const idempotencyRecords = pgTable(
  'idempotency_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    eventInstanceId: uuid('event_instance_id').references(
      () => eventInstances.id,
      { onDelete: 'cascade' },
    ),
    scope: varchar('scope', { length: 64 }).notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 160 }).notNull(),
    requestHash: varchar('request_hash', { length: 64 }).notNull(),
    status: idempotencyStatusEnum('status').notNull().default('processing'),
    responseCode: integer('response_code'),
    responseBody: jsonb('response_body'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('idempotency_user_scope_key_uq').on(
      table.userId,
      table.scope,
      table.idempotencyKey,
    ),
    index('idempotency_expiry_idx').on(table.expiresAt),
  ],
)

export const memories = pgTable(
  'memories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    petId: uuid('pet_id')
      .notNull()
      .references(() => pets.id, { onDelete: 'cascade' }),
    kind: memoryKindEnum('kind').notNull(),
    status: memoryStatusEnum('status').notNull().default('proposed'),
    content: text('content').notNull(),
    normalizedKey: varchar('normalized_key', { length: 255 }),
    expression: text('expression'),
    naturalExpression: text('natural_expression'),
    semanticTags: jsonb('semantic_tags').notNull().default(sql`'[]'::jsonb`),
    confidence: memoryConfidenceEnum('confidence').notNull().default('medium'),
    sensitivity: memorySensitivityEnum('sensitivity').notNull().default('normal'),
    requiresUserConfirmation: boolean('requires_user_confirmation')
      .notNull()
      .default(true),
    sourceEventInstanceId: uuid('source_event_instance_id').references(
      () => eventInstances.id,
      { onDelete: 'set null' },
    ),
    sourceConversationId: uuid('source_conversation_id').references(
      () => conversations.id,
      { onDelete: 'set null' },
    ),
    validFrom: timestamp('valid_from', { withTimezone: true }),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    pausedAt: timestamp('paused_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    version: integer('version').notNull().default(1),
    ...timestamps,
  },
  (table) => [
    index('memories_active_lookup_idx').on(
      table.userId,
      table.kind,
      table.status,
      table.deletedAt,
      table.expiresAt,
    ),
    index('memories_source_event_idx').on(table.sourceEventInstanceId),
    check('memories_version_positive', sql`${table.version} > 0`),
    check(
      'memories_confirmed_requires_timestamp',
      sql`${table.status} <> 'confirmed' or ${table.confirmedAt} is not null`,
    ),
    check(
      'memories_confirmed_are_user_controlled',
      sql`${table.requiresUserConfirmation} = true`,
    ),
  ],
)

export const memorySources = pgTable(
  'memory_sources',
  {
    memoryId: uuid('memory_id')
      .notNull()
      .references(() => memories.id, { onDelete: 'cascade' }),
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.memoryId, table.messageId] })],
)

export const memoryRevisions = pgTable(
  'memory_revisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    memoryId: uuid('memory_id')
      .notNull()
      .references(() => memories.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    action: memoryRevisionActionEnum('action').notNull(),
    actor: revisionActorEnum('actor').notNull(),
    previousContent: text('previous_content'),
    newContent: text('new_content'),
    previousStatus: memoryStatusEnum('previous_status'),
    newStatus: memoryStatusEnum('new_status').notNull(),
    reasonCode: varchar('reason_code', { length: 96 }),
    mergedIntoMemoryId: uuid('merged_into_memory_id').references(
      () => memories.id,
      { onDelete: 'set null' },
    ),
    memoryVersion: integer('memory_version').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('memory_revisions_memory_version_idx').on(
      table.memoryId,
      table.memoryVersion,
    ),
    check('memory_revisions_version_positive', sql`${table.memoryVersion} > 0`),
  ],
)

export const journalEntries = pgTable(
  'journal_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    petId: uuid('pet_id')
      .notNull()
      .references(() => pets.id, { onDelete: 'cascade' }),
    eventInstanceId: uuid('event_instance_id')
      .notNull()
      .references(() => eventInstances.id, { onDelete: 'cascade' }),
    eventKey: text('event_key'),
    title: varchar('title', { length: 200 }).notNull(),
    titleZh: text('title_zh'),
    whatHappened: text('what_happened').notNull(),
    whatUserSaid: text('what_user_said'),
    naturalExpression: text('natural_expression'),
    pronunciationNote: text('pronunciation_note'),
    whatMorrowRemembers: text('what_morrow_remembers'),
    worldChange: text('world_change'),
    userEditedContent: jsonb('user_edited_content'),
    visibility: journalVisibilityEnum('visibility').notNull().default('visible'),
    version: integer('version').notNull().default(1),
    ...timestamps,
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('journal_entries_event_uq').on(table.eventInstanceId),
    index('journal_entries_user_time_idx').on(table.userId, table.createdAt),
  ],
)

export const journalMemoryLinks = pgTable(
  'journal_memory_links',
  {
    journalEntryId: uuid('journal_entry_id')
      .notNull()
      .references(() => journalEntries.id, { onDelete: 'cascade' }),
    memoryId: uuid('memory_id')
      .notNull()
      .references(() => memories.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.journalEntryId, table.memoryId] })],
)

export const languageFeedback = pgTable(
  'language_feedback',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }),
    eventInstanceId: uuid('event_instance_id').references(
      () => eventInstances.id,
      { onDelete: 'cascade' },
    ),
    sourceMessageId: uuid('source_message_id').references(() => messages.id, {
      onDelete: 'set null',
    }),
    result: languageFeedbackResultEnum('result').notNull(),
    focusItems: jsonb('focus_items').notNull().default(sql`'[]'::jsonb`),
    successExpression: text('success_expression'),
    originalExpression: text('original_expression'),
    naturalExpression: text('natural_expression'),
    pronunciationNote: text('pronunciation_note'),
    userSavedAsMemory: boolean('user_saved_as_memory')
      .notNull()
      .default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('language_feedback_event_uq')
      .on(table.eventInstanceId)
      .where(sql`${table.eventInstanceId} is not null`),
    index('language_feedback_user_time_idx').on(table.userId, table.createdAt),
    check(
      'language_feedback_has_content',
      sql`jsonb_array_length(${table.focusItems}) > 0`,
    ),
  ],
)

export const resurfacingTasks = pgTable(
  'resurfacing_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    memoryId: uuid('memory_id')
      .notNull()
      .references(() => memories.id, { onDelete: 'cascade' }),
    targetEventKey: varchar('target_event_key', { length: 96 }).notNull(),
    semanticContexts: jsonb('semantic_contexts')
      .notNull()
      .default(sql`'[]'::jsonb`),
    status: resurfacingStatusEnum('status').notNull().default('pending'),
    minEventGap: integer('min_event_gap').notNull().default(1),
    cooldownUntil: timestamp('cooldown_until', { withTimezone: true }),
    nextEligibleAt: timestamp('next_eligible_at', { withTimezone: true }),
    lastServedAt: timestamp('last_served_at', { withTimezone: true }),
    serveCount: integer('serve_count').notNull().default(0),
    successCount: integer('success_count').notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index('resurfacing_eligibility_idx').on(
      table.userId,
      table.targetEventKey,
      table.status,
      table.nextEligibleAt,
    ),
    check('resurfacing_min_gap_positive', sql`${table.minEventGap} >= 1`),
    check('resurfacing_serve_count_nonnegative', sql`${table.serveCount} >= 0`),
    check('resurfacing_success_count_nonnegative', sql`${table.successCount} >= 0`),
    check('resurfacing_success_not_over_served', sql`${table.successCount} <= ${table.serveCount}`),
  ],
)

export const resurfacingAttempts = pgTable(
  'resurfacing_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => resurfacingTasks.id, { onDelete: 'cascade' }),
    eventInstanceId: uuid('event_instance_id')
      .notNull()
      .references(() => eventInstances.id, { onDelete: 'cascade' }),
    mode: resurfacingModeEnum('mode').notNull(),
    result: resurfacingResultEnum('result').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('resurfacing_attempt_task_event_uq').on(
      table.taskId,
      table.eventInstanceId,
    ),
  ],
)

export const privacyConsents = pgTable(
  'privacy_consents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    consentType: consentTypeEnum('consent_type').notNull(),
    documentVersion: varchar('document_version', { length: 64 }).notNull(),
    decision: consentDecisionEnum('decision').notNull(),
    source: consentSourceEnum('source').notNull(),
    decidedAt: timestamp('decided_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('privacy_consents_latest_idx').on(
      table.userId,
      table.consentType,
      table.decidedAt,
    ),
  ],
)

export const accountDeletionRequests = pgTable(
  'account_deletion_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: deletionRequestStatusEnum('status').notNull().default('requested'),
    scheduledPurgeAt: timestamp('scheduled_purge_at', { withTimezone: true }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    failureCode: varchar('failure_code', { length: 96 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('account_deletion_user_status_idx').on(table.userId, table.status)],
)
