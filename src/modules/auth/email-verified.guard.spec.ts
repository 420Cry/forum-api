import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { EmailVerifiedGuard } from './email-verified.guard'
import { IS_PUBLIC_KEY, SKIP_EMAIL_VERIFICATION_KEY } from './auth.constants'

describe('EmailVerifiedGuard', () => {
  const getAllAndOverride = jest.fn()
  const reflector = {
    getAllAndOverride,
  } as unknown as Reflector

  const guard = new EmailVerifiedGuard(reflector)

  function createContext(user?: {
    id: string
    email?: string
    emailVerified: boolean
  }) {
    const request = { user }
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
      request,
    } as unknown as ExecutionContext & {
      request: { user?: { id: string; emailVerified: boolean } }
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    getAllAndOverride.mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false
      if (key === SKIP_EMAIL_VERIFICATION_KEY) return false
      return false
    })
  })

  it('allows public routes', () => {
    getAllAndOverride.mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return true
      return false
    })

    expect(guard.canActivate(createContext())).toBe(true)
  })

  it('allows routes that skip email verification', () => {
    getAllAndOverride.mockImplementation((key: string) => {
      if (key === SKIP_EMAIL_VERIFICATION_KEY) return true
      return false
    })

    expect(
      guard.canActivate(createContext({ id: 'u1', emailVerified: false })),
    ).toBe(true)
  })

  it('allows dev bypass when no user is attached', () => {
    expect(guard.canActivate(createContext())).toBe(true)
  })

  it('rejects unverified users', () => {
    expect(() =>
      guard.canActivate(createContext({ id: 'u1', emailVerified: false })),
    ).toThrow(ForbiddenException)
  })

  it('allows verified users', () => {
    expect(
      guard.canActivate(createContext({ id: 'u1', emailVerified: true })),
    ).toBe(true)
  })
})
