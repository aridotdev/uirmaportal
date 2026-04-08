import type { AuthUser } from '#server/utils/auth'

declare module 'h3' {
  interface H3EventContext {
    auth: {
      user: AuthUser
      session: Record<string, unknown>
    } | null
  }
}

export {}
