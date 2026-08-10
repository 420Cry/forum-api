import { User } from 'src/modules/users/entities'
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { startupProfilesStage } from '../profiles.type'
import type { StageType } from '../profiles.type'

@Entity('startup-profiles')
export class StartupProfiles {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', unique: true })
  user_id: string

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column()
  company_name: string

  @Column('text', { nullable: true })
  description?: string

  @Column({
    type: 'enum',
    enum: startupProfilesStage,
  })
  stage: StageType

  @Column()
  industry: string

  @Column({ nullable: true })
  website_url?: string

  @Column()
  contact_email: string

  @Column({ nullable: true })
  avatar_url?: string

  @Column({ nullable: true })
  logo_url?: string

  @Column('date')
  founded_at: Date

  @Column('integer', { default: 0 })
  views: number

  @Column('integer', { default: 0 })
  connections: number

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
