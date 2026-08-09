import type { User } from '../users/entities'
import { userProfilePath } from '../users/utils/url-key'

export type AuthProfileResponse = {
  onboarded: boolean
  onboardingStep: number | null
  role: User['role']
  name: string | null
  occupation: string | null
  age: number | null
  location: string | null
  avatarUrl: string | null
  urlKey: string | null
  /** `/u/:urlKey` when a key exists; otherwise null. */
  profilePath: string | null
  /** Goal keys (for onboard / editing), not display labels. */
  goals: string[]
}

export function toAuthProfile(user: User | null): AuthProfileResponse | null {
  if (!user) return null

  const urlKey = user.url_key ?? null

  return {
    onboarded: user.onboarded_at != null,
    onboardingStep:
      user.onboarded_at != null ? null : (user.onboarding_step ?? null),
    role: user.role,
    name: user.name ?? null,
    occupation: user.occupation ?? null,
    age: user.age ?? null,
    location: user.location ?? null,
    avatarUrl: user.avatar_url ?? null,
    urlKey,
    profilePath: urlKey ? userProfilePath(urlKey) : null,
    goals: user.tags?.map((tag) => tag.key) ?? [],
  }
}
