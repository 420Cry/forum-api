import type { Request } from 'express'

export interface AuthUser {
  id: string
  email?: string
  emailVerified: boolean
}

export type RequestWithUser = Request & { user?: AuthUser }
