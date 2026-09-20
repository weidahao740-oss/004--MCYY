import type { Context } from 'hono'

export type ApiErrorCode =
  | 'bad_request'
  | 'email_exists'
  | 'invalid_credentials'
  | 'unauthorized'
  | 'event_locked'
  | 'event_not_found'
  | 'transition_not_allowed'
  | 'memory_not_found'
  | 'memory_version_conflict'
  | 'memory_action_not_allowed'
  | 'memory_restricted'
  | 'journal_not_found'
  | 'journal_version_conflict'
  | 'journal_action_not_allowed'
  | 'journal_memory_not_confirmed'
  | 'conversation_not_found'
  | 'conversation_empty'
  | 'resurfacing_not_available'
  | 'first_day_action_not_allowed'
  | 'first_day_memory_review_incomplete'
  | 'internal_error'

const messages: Record<ApiErrorCode, string> = {
  bad_request: '请求不合法。',
  email_exists: '该邮箱已被其他账号使用。',
  invalid_credentials: '邮箱或密码不正确。',
  unauthorized: '需要有效的登录会话。',
  event_locked: '该事件暂不可用。',
  event_not_found: '未找到该事件实例。',
  transition_not_allowed: '当前事件状态不允许执行此操作。',
  memory_not_found: '未找到该记忆，或它已不可用。',
  memory_version_conflict: '该记忆已在别处更新，请刷新后再试。',
  memory_action_not_allowed: '当前状态下不允许执行此记忆操作。',
  memory_restricted: '敏感内容不能保存为长期记忆。',
  journal_not_found: '未找到该共同记忆条目。',
  journal_version_conflict: '该共同记忆条目已在别处更新，请先刷新。',
  journal_action_not_allowed: '不允许执行此共同记忆操作。',
  journal_memory_not_confirmed: '只有已确认关联的记忆才能在这里编辑。',
  conversation_not_found: '未找到该对话，或它已结束。',
  conversation_empty: '结束对话前请至少发送一条消息。',
  resurfacing_not_available: '这条可选表达已不可用。',
  first_day_action_not_allowed: '当前首日步骤不允许此操作。',
  first_day_memory_review_incomplete: '继续前请审核每一条首日记忆提案。',
  internal_error: '服务暂时无法完成请求。',
}

export function errorResponse(
  context: Context,
  code: ApiErrorCode,
  status: 400 | 401 | 404 | 409 | 500,
  details?: unknown,
) {
  return context.json(
    {
      error: {
        code,
        message: messages[code],
        requestId: context.get('requestId') as string,
        ...(details === undefined ? {} : { details }),
      },
    },
    status,
  )
}

export function getBearerToken(header: string | undefined): string | null {
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}
