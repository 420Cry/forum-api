import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { OnboardingStateGuard } from './onboarding-state.guard'
import { UsersService } from '../users.service'
import {
  IS_PUBLIC_KEY,
  REQUIRES_NOT_ONBOARDED_KEY,
  REQUIRES_ONBOARDED_KEY,
} from '../../auth/auth.constants'

describe('OnboardingStateGuard', () => {
  const getAllAndOverride = jest.fn()
  const reflector = {
    getAllAndOverride,
  } as unknown as Reflector

  const findBySupabaseUidWithTags = jest.fn()
  const usersService = {
    findBySupabaseUidWithTags,
  } as unknown as UsersService

  const guard = new OnboardingStateGuard(reflector, usersService)

  function createContext(userId = 'user-1') {
    const request = { user: { id: userId, emailVerified: true } }
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
      request,
    } as unknown as ExecutionContext
  }

  beforeEach(() => {
    jest.clearAllMocks()
    getAllAndOverride.mockImplementation((key: string) => {
      if (key === IS_PUBLIC_KEY) return false
      if (key === REQUIRES_ONBOARDED_KEY) return false
      if (key === REQUIRES_NOT_ONBOARDED_KEY) return false
      return false
    })
  })

  it('passes through when no onboarding metadata is set', async () => {
    await expect(guard.canActivate(createContext())).resolves.toBe(true)
    expect(findBySupabaseUidWithTags).not.toHaveBeenCalled()
  })

  it('rejects profile updates when user is not onboarded', async () => {
    getAllAndOverride.mockImplementation((key: string) => {
      if (key === REQUIRES_ONBOARDED_KEY) return true
      return false
    })
    findBySupabaseUidWithTags.mockResolvedValue({ onboarded_at: null })

    await expect(guard.canActivate(createContext())).rejects.toThrow(
      ForbiddenException,
    )
  })

  it('rejects onboarding submit when user is already onboarded', async () => {
    getAllAndOverride.mockImplementation((key: string) => {
      if (key === REQUIRES_NOT_ONBOARDED_KEY) return true
      return false
    })
    findBySupabaseUidWithTags.mockResolvedValue({
      onboarded_at: new Date(),
    })

    await expect(guard.canActivate(createContext())).rejects.toThrow(
      BadRequestException,
    )
  })

  it('allows onboarding routes for in-progress users', async () => {
    getAllAndOverride.mockImplementation((key: string) => {
      if (key === REQUIRES_NOT_ONBOARDED_KEY) return true
      return false
    })
    findBySupabaseUidWithTags.mockResolvedValue({ onboarded_at: null })

    await expect(guard.canActivate(createContext())).resolves.toBe(true)
  })
})
