import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { SupabaseAuthGuard } from './supabase-auth.guard'
import { SupabaseService } from './supabase.service'
import { IS_PUBLIC_KEY } from './auth.constants'

describe('SupabaseAuthGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector

  const supabase = {
    isEnabled: true,
    verifyToken: jest.fn(),
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
    } as unknown as ExecutionContext & { request: { user?: { id: string; email?: string } } }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(supabase as { isEnabled: boolean }).isEnabled = true
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(false)
  })

  it('allows public routes without a token', async () => {
    ;(reflector.getAllAndOverride as jest.Mock).mockReturnValue(true)
    const ctx = createContext()

    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    expect(supabase.verifyToken).not.toHaveBeenCalled()
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
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
    ;(supabase.verifyToken as jest.Mock).mockResolvedValue({ error: 'Invalid token' })

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException)
  })

  it('attaches user to request when token is valid', async () => {
    const ctx = createContext('Bearer good-token')
    ;(supabase.verifyToken as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', email: 'founder@example.com' },
    })

    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    expect(ctx.request.user).toEqual({
      id: 'user-1',
      email: 'founder@example.com',
    })
  })
})
