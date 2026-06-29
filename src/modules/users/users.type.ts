export const onboardProcess = [
  'RoleSelection',
  'GoalSelection',
  'BasicInfo',
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
  age?: string;
};
