import { AuthController } from './auth.controller'
import { UsersService } from '../users/users.service'

describe('AuthController', () => {
  const findBySupabaseUidWithTags = jest.fn()
  const ensureUrlKey = jest.fn()
  const usersService = {
    findBySupabaseUidWithTags,
    ensureUrlKey,
  } as unknown as UsersService

  const controller = new AuthController(usersService)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('GET /auth/me returns null profile when request has no user', async () => {
    await expect(
      controller.getMe({ user: undefined } as never),
    ).resolves.toEqual({
      id: null,
      email: null,
      profile: null,
    })
    expect(findBySupabaseUidWithTags).not.toHaveBeenCalled()
  })

  it('GET /auth/me maps onboarded user profile', async () => {
    const user = {
      supabase_uid: 'uid-1',
      onboarded_at: new Date('2024-01-01'),
      onboarding_step: null,
      role: 'Investor',
      name: 'Alex',
      occupation: null,
      age: 30,
      date_of_birth: '1994-01-01',
      location: null,
      avatar_url: null,
      url_key: 'alex',
      tags: [{ key: 'raise_capital' }],
    }
    findBySupabaseUidWithTags.mockResolvedValue(user)
    ensureUrlKey.mockResolvedValue(user)

    const result = await controller.getMe({
      user: { id: 'uid-1', email: 'alex@example.com' },
    } as never)

    expect(result.id).toBe('uid-1')
    expect(result.email).toBe('alex@example.com')
    expect(result.profile).toMatchObject({
      onboarded: true,
      onboardingStep: null,
      role: 'Investor',
      name: 'Alex',
      occupation: null,
      dateOfBirth: '1994-01-01',
      location: null,
      avatarUrl: null,
      urlKey: 'alex',
      profilePath: '/u/alex',
      goals: ['raise_capital'],
    })
    expect(typeof result.profile?.age).toBe('number')
    expect(ensureUrlKey).toHaveBeenCalledWith(user)
  })

  it('GET /auth/me skips ensureUrlKey for in-progress onboarding', async () => {
    const user = {
      supabase_uid: 'uid-2',
      onboarded_at: null,
      onboarding_step: 1,
      role: null,
      name: null,
      tags: [],
    }
    findBySupabaseUidWithTags.mockResolvedValue(user)

    const result = await controller.getMe({
      user: { id: 'uid-2', email: 'new@example.com' },
    } as never)

    expect(result.profile?.onboarded).toBe(false)
    expect(result.profile?.onboardingStep).toBe(1)
    expect(ensureUrlKey).not.toHaveBeenCalled()
  })
})
