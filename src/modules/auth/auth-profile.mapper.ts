import type { User } from '../users/entities'
import {
  ageFromDateOfBirth,
  formatDateOnly,
  parseDateOfBirth,
} from '../users/utils/date-of-birth'
import { userProfilePath } from '../users/utils/url-key'

export type AuthProfileResponse = {
  onboarded: boolean
  onboardingStep: number | null
  role: User['role']
  name: string | null
  occupation: string | null
  /** Derived from date of birth when present. */
  age: number | null
  /** ISO calendar date `YYYY-MM-DD`, or null. */
  dateOfBirth: string | null
  location: string | null
  avatarUrl: string | null
  urlKey: string | null
  /** `/u/:urlKey` when a key exists; otherwise null. */
  profilePath: string | null
  /** Goal keys (for onboard / editing), not display labels. */
  goals: string[]
}

function resolveDateOfBirth(user: User): string | null {
  if (!user.date_of_birth) return null
  if (typeof user.date_of_birth === 'string') {
    return user.date_of_birth.slice(0, 10)
  }
  // TypeORM may hydrate date columns as Date.
  return formatDateOnly(user.date_of_birth)
}

export function toAuthProfile(user: User | null): AuthProfileResponse | null {
  if (!user) return null

  const urlKey = user.url_key ?? null
  const dateOfBirth = resolveDateOfBirth(user)
  const dob = dateOfBirth ? parseDateOfBirth(dateOfBirth) : null
  const age = dob ? ageFromDateOfBirth(dob) : (user.age ?? null)

  return {
    onboarded: user.onboarded_at != null,
    onboardingStep:
      user.onboarded_at != null ? null : (user.onboarding_step ?? null),
    role: user.role,
    name: user.name ?? null,
    occupation: user.occupation ?? null,
    age,
    dateOfBirth,
    location: user.location ?? null,
    avatarUrl: user.avatar_url ?? null,
    urlKey,
    profilePath: urlKey ? userProfilePath(urlKey) : null,
    goals: user.tags?.map((tag) => tag.key) ?? [],
  }
}
