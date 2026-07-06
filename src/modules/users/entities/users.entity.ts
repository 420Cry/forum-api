import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm'
import { rolesSelection } from '../users.type'
import type { RolesSelectionType } from '../users.type'
import { Tag } from 'src/modules/tags/entities/tags.entities'

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  supabaseUid!: string

  @Column()
  email!: string

  @Column({ type: 'timestamptz', nullable: true })
  onboarded_at: Date | null

  @Column({ type: 'smallint', nullable: true })
  onboarding_step: number | null

  @Column({
    type: 'enum',
    enum: rolesSelection,
    nullable: true,
  })
  role: RolesSelectionType | null

  @Column({ nullable: true })
  name: string

  @Column({ nullable: true })
  occupation: string

  @Column({ nullable: true })
  age: number

  @Column({ nullable: true })
  location: string

  @ManyToMany(() => Tag)
  @JoinTable({ name: 'user_tag' })
  tags: Tag[]

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
