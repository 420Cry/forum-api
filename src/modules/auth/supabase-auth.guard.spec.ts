import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { isInsecureAuthBypassAllowed } from './auth-bypass'
import { SupabaseAuthGuard } from './supabase-auth.guard'
import { SupabaseService } from './supabase.service'
import { IS_PUBLIC_KEY } from './auth.constants'

describe('isInsecureAuthBypassAllowed', () => {
  it('is false by default even in development', () => {
    expect(isInsecureAuthBypassAllowed({ NODE_ENV: 'development' })).toBe(false)
  })

  it('requires the explicit flag and a local NODE_ENV', () => {
    expect(
      isInsecureAuthBypassAllowed({
        ALLOW_INSECURE_AUTH_BYPASS: 'true',
        NODE_ENV: 'development',
      }),
    ).toBe(true)
    expect(
      isInsecureAuthBypassAllowed({
        ALLOW_INSECURE_AUTH_BYPASS: 'true',
      }),
    ).toBe(true)
  })

  it('never allows bypass for staging or production', () => {
    expect(
      isInsecureAuthBypassAllowed({
        ALLOW_INSECURE_AUTH_BYPASS: 'true',
        NODE_ENV: 'production',
      }),
    ).toBe(false)
    expect(
      isInsecureAuthBypassAllowed({
        ALLOW_INSECURE_AUTH_BYPASS: 'true',
        NODE_ENV: 'staging',
      }),
    ).toBe(false)
  })
})

describe('SupabaseAuthGuard', () => {
  const getAllAndOverride = jest.fn()
  const reflector = {
    getAllAndOverride,
  } as unknown as Reflector

  const verifyToken = jest.fn()
  const supabase = {
    isEnabled: true,
    verifyToken,
  } as unknown as SupabaseService

  const guard = new SupabaseAuthGuard(supabase, reflector)

  function createContext(authHeader?: string) {
    const request = {
      headers: { authorization: authHeader },
      user: undefined,
    }

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
      request,
    } as unknown as ExecutionContext & {
      request: { user?: { id: string; email?: string } }
    }
  }

  const previousEnv = { ...process.env }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(supabase as { isEnabled: boolean }).isEnabled = true
    getAllAndOverride.mockReturnValue(false)
    process.env = { ...previousEnv }
    delete process.env.ALLOW_INSECURE_AUTH_BYPASS
  })

  afterAll(() => {
    process.env = previousEnv
  })

  it('allows public routes without a token', async () => {
    getAllAndOverride.mockReturnValue(true)
    const ctx = createContext()

    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    expect(verifyToken).not.toHaveBeenCalled()
    expect(getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ])
  })

  it('throws when Authorization header is missing', async () => {
    const ctx = createContext()

    await expect(guard.canActivate(ctx)).rejects.toThrow(
      new UnauthorizedException('Missing or invalid token'),
    )
  })

  it('throws when token verification fails', async () => {
    const ctx = createContext('Bearer bad-token')
    verifyToken.mockResolvedValue({
      error: 'Invalid token',
    })

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
  })

  it('attaches user to request when token is valid', async () => {
    const ctx = createContext('Bearer good-token')
    verifyToken.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'founder@example.com',
        emailVerified: true,
      },
    })

    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    expect(ctx.request.user).toEqual({
      id: 'user-1',
      email: 'founder@example.com',
      emailVerified: true,
    })
  })

  it('rejects when Supabase is disabled without an explicit local bypass', async () => {
    ;(supabase as { isEnabled: boolean }).isEnabled = false
    process.env.NODE_ENV = 'development'
    delete process.env.ALLOW_INSECURE_AUTH_BYPASS

    await expect(guard.canActivate(createContext())).rejects.toThrow(
      new UnauthorizedException('Auth not configured'),
    )
  })

  it('rejects when Supabase is disabled in staging even with the bypass flag', async () => {
    ;(supabase as { isEnabled: boolean }).isEnabled = false
    process.env.NODE_ENV = 'staging'
    process.env.ALLOW_INSECURE_AUTH_BYPASS = 'true'

    await expect(guard.canActivate(createContext())).rejects.toThrow(
      new UnauthorizedException('Auth not configured'),
    )
  })

  it('allows the explicit local bypass when Supabase is disabled', async () => {
    ;(supabase as { isEnabled: boolean }).isEnabled = false
    process.env.NODE_ENV = 'development'
    process.env.ALLOW_INSECURE_AUTH_BYPASS = 'true'

    await expect(guard.canActivate(createContext())).resolves.toBe(true)
    expect(verifyToken).not.toHaveBeenCalled()
  })
})
