import { Tag } from 'src/modules/tags/entities/tags.entities';

export const onboardProcess = [
  'RoleSelection',
  'GoalSelection',
  'BasicInfo',
  'Completed',
] as const;
export type OnboardProcessType = (typeof onboardProcess)[number];

export const rolesSelection = ['Founder', 'Investor'] as const;
export type RolesSelectionType = (typeof rolesSelection)[number];

export type UpdateUserType = {
  email?: string;
  onboard_process?: OnboardProcessType;
  role?: RolesSelectionType | null;
  name?: string;
  occupation?: string;
  age?: number;
  location?: string;
  tags?: Tag[];
};
