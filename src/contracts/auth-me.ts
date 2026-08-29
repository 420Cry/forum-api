/**
 * Canonical GET /auth/me contract — keep forum-app/app/types/user.ts in sync.
 * forum-app/tests/authMeContract.test.ts asserts parity when forum-api is a sibling checkout.
 */
export const AUTH_PROFILE_KEYS = [
  'onboarded',
  'onboardingStep',
  'role',
  'name',
  'occupation',
  'age',
  'dateOfBirth',
  'location',
  'avatarUrl',
  'urlKey',
  'profilePath',
  'goals',
] as const

export type AuthProfileResponse = {
  onboarded: boolean
  onboardingStep: number | null
  role: 'Founder' | 'Investor' | null
  name: string | null
  occupation: string | null
  age: number | null
  dateOfBirth: string | null
  location: string | null
  avatarUrl: string | null
  urlKey: string | null
  profilePath: string | null
  goals: string[]
}

export type AuthMeResponse = {
  id: string | null
  email: string | null
  profile: AuthProfileResponse | null
}
