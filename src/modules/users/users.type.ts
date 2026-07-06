import { Tag } from 'src/modules/tags/entities/tags.entities'

export const rolesSelection = ['Founder', 'Investor'] as const
export type RolesSelectionType = (typeof rolesSelection)[number]

export type UpdateUserType = {
  email?: string
  onboarded_at?: Date | null
  onboarding_step?: number | null
  role?: RolesSelectionType | null
  name?: string
  occupation?: string
  age?: number
  location?: string
  tags?: Tag[]
}
