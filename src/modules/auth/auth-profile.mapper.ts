import type { User } from '../users/entities'

export type AuthProfileResponse = {
  onboard_process: User['onboard_process']
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
    onboard_process: user.onboard_process,
    role: user.role,
    name: user.name ?? null,
    occupation: user.occupation ?? null,
    age: user.age ?? null,
    location: user.location ?? null,
    goals: user.tags?.map((tag) => tag.name) ?? [],
  }
}
