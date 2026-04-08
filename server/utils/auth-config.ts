import { betterAuth } from 'better-auth'
import { admin, username } from 'better-auth/plugins'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import db from '#server/database'
import * as schema from '#server/database/schema'
import {
  DEFAULT_SESSION_EXPIRY_DAYS,
  FAILED_LOGIN_LOCK_MINUTES,
  MAX_FAILED_LOGIN_ATTEMPTS
} from '~~/shared/utils/constants'

const SESSION_EXPIRES_IN_SECONDS = DEFAULT_SESSION_EXPIRY_DAYS * 24 * 60 * 60
const LOGIN_LOCK_WINDOW_SECONDS = FAILED_LOGIN_LOCK_MINUTES * 60

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema
  }),
  emailAndPassword: {
    enabled: true
  },
  session: {
    expiresIn: SESSION_EXPIRES_IN_SECONDS
  },
  rateLimit: {
    enabled: true,
    customRules: {
      '/sign-in/email': {
        window: LOGIN_LOCK_WINDOW_SECONDS,
        max: MAX_FAILED_LOGIN_ATTEMPTS
      },
      '/sign-in/username': {
        window: LOGIN_LOCK_WINDOW_SECONDS,
        max: MAX_FAILED_LOGIN_ATTEMPTS
      }
    }
  },
  plugins: [
    username(),
    admin()
  ]
})
