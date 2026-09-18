import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: {
    service: 'english-pet-api',
    environment: process.env.APP_ENV ?? 'development',
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'email',
      'password',
      '*.email',
      '*.password',
      '*.contentText',
    ],
    censor: '[redacted]',
  },
})
