import type { User } from '../users/entities'

export type AuthProfileResponse = {
  onboarded: boolean
  role: User['role']
  name: string | null
  occupation: string | null
  age: number | null
  location: string | null
  goals: string[]
}

export function toAuthProfile(user: User | null): AuthProfileResponse | null {
  if (!user) return null

  return {
    onboarded: user.onboarded_at != null,
    role: user.role,
    name: user.name ?? null,
    occupation: user.occupation ?? null,
    age: user.age ?? null,
    location: user.location ?? null,
    goals: user.tags?.map((tag) => tag.key) ?? [],
  }
}
