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
  bad_request: 'The request is not valid.',
  email_exists: 'An account already uses this email.',
  invalid_credentials: 'The email or password is incorrect.',
  unauthorized: 'A valid session is required.',
  event_locked: 'This event is not available yet.',
  event_not_found: 'The event instance was not found.',
  transition_not_allowed: 'This action cannot advance the current event state.',
  memory_not_found: 'The memory was not found or is no longer available.',
  memory_version_conflict: 'The memory changed on another screen. Reload the latest version.',
  memory_action_not_allowed: 'This memory action is not allowed in the current state.',
  memory_restricted: 'Sensitive content cannot be stored as a long-term memory.',
  journal_not_found: 'The shared memory entry was not found.',
  journal_version_conflict: 'The shared memory entry changed on another screen. Reload it first.',
  journal_action_not_allowed: 'This shared memory action is not allowed.',
  journal_memory_not_confirmed: 'Only a confirmed linked memory can be edited here.',
  conversation_not_found: 'The conversation was not found or is already closed.',
  conversation_empty: 'Send at least one message before ending the conversation.',
  resurfacing_not_available: 'This optional expression is no longer available.',
  first_day_action_not_allowed: 'This action is not available at the current first-day step.',
  first_day_memory_review_incomplete: 'Review every first-day memory proposal before continuing.',
  internal_error: 'The service could not complete the request.',
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
