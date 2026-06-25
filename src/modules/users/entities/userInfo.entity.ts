import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './index';
import type { UUID } from 'crypto';

export const onboardProcess = [
  'RoleSelection',
  'GoalSelection',
  'BasicInfo',
] as const;
export type OnboardProcessType = (typeof onboardProcess)[number];

export const rolesSelection = ['startup', 'investor'] as const;
export type RolesSelectionType = (typeof rolesSelection)[number];

@Entity('users_info')
export class UserInfo {
  @PrimaryColumn('uuid')
  user_id: UUID;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column({
    type: 'enum',
    enum: onboardProcess,
    default: 'RoleSelection',
  })
  onboard_process: OnboardProcessType;

  @Column({
    type: 'enum',
    enum: rolesSelection,
    nullable: true,
  })
  role: RolesSelectionType | null;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  occupation: string;

  @Column({ nullable: true })
  age: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
