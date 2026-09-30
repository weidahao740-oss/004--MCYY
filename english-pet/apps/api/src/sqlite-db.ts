import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

/**
 * 本地 SQLite 持久化（Web 优先阶段默认驱动）。
 *
 * - 使用 Node 内置 node:sqlite（DatabaseSync，同步 API），无需原生编译依赖。
 * - 路径解析：优先 process.env.SQLITE_PATH；否则固定写到项目内
 *   <english-pet 根>/.data/english-pet.db（基于 import.meta.url，不依赖运行 cwd）。
 * - 首次启动自动建目录、自动建表（CREATE TABLE IF NOT EXISTS），无需手动迁移。
 * - 开启 WAL，提升本地并发读写表现。
 *
 * 复杂嵌套对象（user/settings/pet/记忆卡/journal 条目/conversation/event 实例等）
 * 直接用 JSON 列存储，不强行关系化。
 */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS accounts (
  user_id TEXT PRIMARY KEY,
  email TEXT,
  record TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS accounts_email_unique
  ON accounts(email) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  record TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS memories_user ON memories(user_id);

CREATE TABLE IF NOT EXISTS memory_revisions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  record TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS memory_revisions_user ON memory_revisions(user_id);

CREATE TABLE IF NOT EXISTS memory_user_meta (
  user_id TEXT PRIMARY KEY,
  restricted_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS idempotency (
  scope TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  response TEXT NOT NULL,
  PRIMARY KEY (scope, cache_key)
);

CREATE TABLE IF NOT EXISTS journals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_instance_id TEXT NOT NULL,
  record TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS journals_user ON journals(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS journals_event_instance_unique ON journals(event_instance_id);

CREATE TABLE IF NOT EXISTS feedback_events (
  event_instance_id TEXT PRIMARY KEY,
  record TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS feedback_conversations (
  conversation_id TEXT PRIMARY KEY,
  record TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  record TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS conversations_user ON conversations(user_id);

CREATE TABLE IF NOT EXISTS active_conversations (
  user_id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS event_state (
  user_id TEXT PRIMARY KEY,
  record TEXT NOT NULL
);

-- 固定内容事件引擎（fixed-content-v1.0.0）：每用户持久化世界状态、已完成事件、活动实例与幂等响应缓存。
CREATE TABLE IF NOT EXISTS fixed_event_state (
  user_id TEXT PRIMARY KEY,
  record TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS first_day (
  user_id TEXT PRIMARY KEY,
  record TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS resurfacing_tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  record TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS resurfacing_tasks_user ON resurfacing_tasks(user_id);

CREATE TABLE IF NOT EXISTS resurfacing_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  record TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS resurfacing_attempts_user ON resurfacing_attempts(user_id);

CREATE TABLE IF NOT EXISTS resurfacing_meta (
  user_id TEXT PRIMARY KEY,
  record TEXT NOT NULL
);
`

let instance: DatabaseSync | null = null

function defaultDbPath(): string {
  // sqlite-db.ts 位于 <root>/apps/api/src/，上溯三级即 english-pet 根。
  const srcDir = dirname(fileURLToPath(import.meta.url))
  const root = resolve(srcDir, '..', '..', '..')
  return resolve(root, '.data', 'english-pet.db')
}

export function resolveDbPath(): string {
  const configured = process.env.SQLITE_PATH?.trim()
  return configured ? resolve(configured) : defaultDbPath()
}

export function openDatabase(): DatabaseSync {
  if (instance) return instance
  const dbPath = resolveDbPath()
  const dir = dirname(dbPath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const db = new DatabaseSync(dbPath)
  db.exec('PRAGMA journal_mode = WAL;')
  db.exec('PRAGMA synchronous = NORMAL;')
  db.exec(SCHEMA)
  instance = db
  return db
}

/** 把任意 JS 值序列化为 JSON 文本；undefined 统一转为 null，避免 SQLite 绑定失败。 */
export function toJson(value: unknown): string {
  return JSON.stringify(value)
}

export function fromJson<T>(text: string | null | undefined): T | null {
  if (text === null || text === undefined) return null
  return JSON.parse(text) as T
}

/** 绑定参数归一化：node:sqlite 不接受 undefined。 */
export function b<T>(value: T): T extends undefined ? null : T {
  return (value === undefined ? null : value) as T extends undefined ? null : T
}
