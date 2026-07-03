import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { onboardProcess, rolesSelection } from '../users.type';
import type { OnboardProcessType, RolesSelectionType } from '../users.type';
import { Tag } from 'src/modules/tags/entities/tags.entities';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  supabaseUid!: string;

  @Column()
  email!: string;

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
  age: number;

  @Column({ nullable: true })
  location: string;

  @ManyToMany(() => Tag)
  @JoinTable({ name: 'user_tag' })
  tags: Tag[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
