import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'
import type {
  LoginRequest,
  MeResponse,
  PetAction,
  PetHomeResponse,
  PetHomeState,
  PetSummary,
  PublicUser,
  RegisterRequest,
  SessionResponse,
  UpdateSettingsRequest,
  UserSettings,
} from '@english-pet/contracts'

interface IUserRecord {
  user: PublicUser
  passwordHash: string | null
  settings: UserSettings
  pet: PetSummary
  petHome: PetHomeState
  firstDayCompletedAt: string | null
  firstDayReturnSummary: string | null
}

const users = new Map<string, IUserRecord>()
const userIdByEmail = new Map<string, string>()
const userIdByToken = new Map<string, string>()

const defaultSettings: UserSettings = {
  languageLevel: 'L2',
  preferredReplyLength: 'standard',
  speechRate: 'normal',
  subtitlesEnabled: true,
  correctionPreference: 'after_conversation',
  memoryEnabled: true,
  voiceInputEnabled: true,
  voiceOutputEnabled: true,
  interfaceLocale: 'zh-CN',
  timeZone: 'Asia/Shanghai',
}

function createPet(): PetSummary {
  return {
    id: randomUUID(),
    characterKey: 'morrow',
    displayName: 'Morrow',
    personaVersion: 'morrow-1.0',
    relationshipStage: 'NEW',
    firstDayStatus: 'not_started',
  }
}

function createPetHome(): PetHomeState {
  return {
    emotion: 'curious',
    activity: 'listening_by_window',
    statusTextZh: '正在窗边听远处的声音',
    statusTextEn: 'Listening to distant sounds by the window',
    lastSeenAt: null,
    returnMessageZh: '房间一直在这里。我们可以从今天开始。',
    returnMessageEn: 'The room is still here. We can start with today.',
    todayEvent: {
      eventKey: 'first_day_v1',
      titleZh: '房间里的第一束光',
      titleEn: 'The first light in the room',
      status: 'available',
      estimatedMinutes: { min: 3, max: 5 },
    },
  }
}

function issueToken(userId: string): string {
  const token = randomBytes(32).toString('base64url')
  userIdByToken.set(token, userId)
  return token
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function passwordMatches(password: string, stored: string): boolean {
  const [salt, expectedHex] = stored.split(':')
  if (!salt || !expectedHex) return false
  const actual = scryptSync(password, salt, 64)
  const expected = Buffer.from(expectedHex, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

function toSession(record: IUserRecord, token: string): SessionResponse {
  return {
    token,
    user: record.user,
    settings: record.settings,
    pet: record.pet,
    persistence: 'memory',
  }
}

export class MemoryAccountStore {
  createGuest(): SessionResponse {
    const id = randomUUID()
    const record: IUserRecord = {
      user: {
        id,
        accountKind: 'guest',
        status: 'active',
        email: null,
        displayName: null,
        createdAt: new Date().toISOString(),
      },
      passwordHash: null,
      settings: { ...defaultSettings },
      pet: createPet(),
      petHome: createPetHome(),
      firstDayCompletedAt: null,
      firstDayReturnSummary: null,
    }
    users.set(id, record)
    return toSession(record, issueToken(id))
  }

  register(input: RegisterRequest, currentToken?: string): SessionResponse {
    if (userIdByEmail.has(input.email)) {
      throw new Error('email_exists')
    }

    const current = currentToken ? this.findByToken(currentToken) : null
    const id = current?.user.accountKind === 'guest' ? current.user.id : randomUUID()
    const record: IUserRecord = current ?? {
      user: {
        id,
        accountKind: 'registered',
        status: 'active',
        email: input.email,
        displayName: input.displayName ?? null,
        createdAt: new Date().toISOString(),
      },
      passwordHash: null,
      settings: { ...defaultSettings },
      pet: createPet(),
      petHome: createPetHome(),
      firstDayCompletedAt: null,
      firstDayReturnSummary: null,
    }

    record.user = {
      ...record.user,
      accountKind: 'registered',
      email: input.email,
      displayName: input.displayName ?? record.user.displayName,
    }
    record.passwordHash = hashPassword(input.password)
    users.set(id, record)
    userIdByEmail.set(input.email, id)
    if (currentToken) userIdByToken.delete(currentToken)
    return toSession(record, issueToken(id))
  }

  login(input: LoginRequest): SessionResponse {
    const userId = userIdByEmail.get(input.email)
    const record = userId ? users.get(userId) : undefined
    if (!record?.passwordHash || !passwordMatches(input.password, record.passwordHash)) {
      throw new Error('invalid_credentials')
    }
    return toSession(record, issueToken(record.user.id))
  }

  findByToken(token: string): IUserRecord | null {
    const userId = userIdByToken.get(token)
    return userId ? users.get(userId) ?? null : null
  }

  me(token: string): MeResponse | null {
    const record = this.findByToken(token)
    if (!record) return null
    return {
      user: record.user,
      settings: record.settings,
      pet: record.pet,
      persistence: 'memory',
    }
  }

  updateSettings(token: string, patch: UpdateSettingsRequest): MeResponse | null {
    const record = this.findByToken(token)
    if (!record) return null
    record.settings = { ...record.settings, ...patch }
    return {
      user: record.user,
      settings: record.settings,
      pet: record.pet,
      persistence: 'memory',
    }
  }

  getPetHome(token: string): PetHomeResponse | null {
    const record = this.findByToken(token)
    if (!record) return null
    const previousSeenAt = record.petHome.lastSeenAt
    const completedFirstDay = record.pet.firstDayStatus === 'completed'
    record.petHome = {
      ...record.petHome,
      lastSeenAt: new Date().toISOString(),
      returnMessageZh: completedFirstDay
        ? record.firstDayReturnSummary ?? '欢迎回来。窗边的光还在，Morrow 记得你们完成的第一件事。'
        : previousSeenAt
          ? '欢迎回来。我们可以从上次确认的位置继续首日相遇。'
          : '房间一直在这里。我们可以从今天开始。',
      returnMessageEn: completedFirstDay
        ? 'Welcome back. The light by the window is still here, and Morrow remembers what you completed together.'
        : previousSeenAt
          ? 'Welcome back. We can continue the first meeting from the last confirmed step.'
          : 'The room is still here. We can start with today.',
    }
    return {
      pet: {
        id: record.pet.id,
        displayName: record.pet.displayName,
        relationshipStage: record.pet.relationshipStage,
      },
      home: record.petHome,
    }
  }

  performPetAction(token: string, action: PetAction): PetHomeResponse | null {
    const record = this.findByToken(token)
    if (!record) return null
    const stateByAction: Record<PetAction, Pick<PetHomeState, 'emotion' | 'activity' | 'statusTextZh' | 'statusTextEn'>> = {
      greet: {
        emotion: 'warm',
        activity: 'listening_by_window',
        statusTextZh: '听见你回来，安静地抬起了头',
        statusTextEn: 'Heard you return and quietly looked up',
      },
      listen: {
        emotion: 'curious',
        activity: 'reading_letter',
        statusTextZh: '正在分辨门外与信箱的声音',
        statusTextEn: 'Listening for the road and the mailbox',
      },
      rest: {
        emotion: 'calm',
        activity: 'resting',
        statusTextZh: '把尾巴收好，在微光里休息',
        statusTextEn: 'Resting in the low light',
      },
    }
    record.petHome = { ...record.petHome, ...stateByAction[action] }
    return {
      pet: {
        id: record.pet.id,
        displayName: record.pet.displayName,
        relationshipStage: record.pet.relationshipStage,
      },
      home: record.petHome,
    }
  }

  updateFirstDay(userId: string, status: PetSummary['firstDayStatus']) {
    const record = users.get(userId)
    if (!record) throw new Error('user_not_found')
    record.pet.firstDayStatus = status
    record.petHome.todayEvent = status === 'completed'
      ? { eventKey: 'morrow_letter_v1', titleZh: 'Morrow 收到一封看不懂的来信', titleEn: 'The letter with two meanings', status: 'available', estimatedMinutes: { min: 3, max: 5 } }
      : { ...record.petHome.todayEvent!, status: status === 'in_progress' ? 'in_progress' : 'available' }
  }

  updateFirstDayWorld(userId: string, restoredObject: 'lamp' | 'plant') {
    const record = users.get(userId)
    if (!record) throw new Error('user_not_found')
    record.petHome = {
      ...record.petHome,
      emotion: 'warm',
      activity: 'listening_by_window',
      statusTextZh: restoredObject === 'lamp' ? '守着窗边恢复的灯光' : '看着门边重新舒展的植物',
      statusTextEn: restoredObject === 'lamp' ? 'Keeping watch beside the restored window lamp' : 'Watching the restored plant by the door',
    }
    record.firstDayReturnSummary = restoredObject === 'lamp'
      ? '欢迎回来。窗边的灯还亮着，Morrow 记得这是你们一起恢复的第一件东西。'
      : '欢迎回来。门边的植物还在，Morrow 记得这是你们一起恢复的第一件东西。'
  }

  deleteAccount(token: string): string | null {
    const record = this.findByToken(token)
    if (!record) return null
    const userId = record.user.id
    users.delete(userId)
    if (record.user.email) userIdByEmail.delete(record.user.email)
    for (const [sessionToken, sessionUserId] of userIdByToken) {
      if (sessionUserId === userId) userIdByToken.delete(sessionToken)
    }
    return userId
  }

  signOut(token: string): boolean {
    return userIdByToken.delete(token)
  }
}
