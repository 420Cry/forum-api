import type { AuthProfileResponse } from '../../../contracts/auth-me'
import type { User } from '../entities'
import {
  ageFromDateOfBirth,
  formatDateOnly,
  parseDateOfBirth,
} from '../utils/date-of-birth'
import { userProfilePath } from '../utils/url-key'

function resolveDateOfBirth(user: User): string | null {
  if (!user.date_of_birth) return null
  if (typeof user.date_of_birth === 'string') {
    return user.date_of_birth.slice(0, 10)
  }
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
