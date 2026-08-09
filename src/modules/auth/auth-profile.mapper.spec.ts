import { toAuthProfile } from './auth-profile.mapper'
import type { User } from '../users/entities'
import { Tag } from '../tags/entities/tags.entities'

function makeUser(overrides: Partial<User> = {}): User {
  return {
    supabaseUid: '11111111-1111-1111-1111-111111111111',
    email: 'founder@example.com',
    onboarded_at: null,
    onboarding_step: null,
    role: null,
    name: undefined as unknown as string,
    occupation: undefined as unknown as string,
    age: undefined as unknown as number,
    location: undefined as unknown as string,
    avatar_url: null,
    url_key: null,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('toAuthProfile', () => {
  it('returns null when user is null', () => {
    expect(toAuthProfile(null)).toBeNull()
  })

  it('maps an incomplete user as not onboarded', () => {
    const profile = toAuthProfile(
      makeUser({
        role: 'Founder',
        onboarded_at: null,
      }),
    )

    expect(profile).toEqual({
      onboarded: false,
      onboardingStep: null,
      role: 'Founder',
      name: null,
      occupation: null,
      age: null,
      location: null,
      avatarUrl: null,
      urlKey: null,
      profilePath: null,
      goals: [],
    })
  })

  it('exposes onboarding step for in-progress users', () => {
    const profile = toAuthProfile(
      makeUser({
        role: 'Founder',
        onboarding_step: 2,
        onboarded_at: null,
      }),
    )

    expect(profile?.onboardingStep).toBe(2)
  })

  it('maps onboarded user fields and goal tag keys', () => {
    const tags: Tag[] = [
      { id: 1, key: 'raise_capital', name: 'Raise capital' },
      { id: 2, key: 'find_cofounders', name: 'Find co-founders' },
    ]

    const profile = toAuthProfile(
      makeUser({
        onboarded_at: new Date('2026-07-06T00:00:00.000Z'),
        role: 'Founder',
        name: 'Alex Morgan',
        occupation: 'Founder',
        age: 28,
        location: 'Austin',
        url_key: 'alex-morgan',
        tags,
      }),
    )

    expect(profile).toEqual({
      onboarded: true,
      onboardingStep: null,
      role: 'Founder',
      name: 'Alex Morgan',
      occupation: 'Founder',
      age: 28,
      location: 'Austin',
      avatarUrl: null,
      urlKey: 'alex-morgan',
      profilePath: '/u/alex-morgan',
      goals: ['raise_capital', 'find_cofounders'],
    })
  })

  it('maps avatarUrl when present', () => {
    const profile = toAuthProfile(
      makeUser({
        onboarded_at: new Date(),
        avatar_url: 'https://cdn.example.com/a.png',
      }),
    )
    expect(profile?.avatarUrl).toBe('https://cdn.example.com/a.png')
  })
})
