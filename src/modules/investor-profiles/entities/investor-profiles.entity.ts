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

@Entity('investor-profiles')
export class InvestorProfiles {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', unique: true })
  user_id: string

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column()
  firm_name: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column()
  industry: string

  @Column()
  contact_email: string

  @Column({ nullable: true })
  avatar_url?: string

  @Column({ nullable: true })
  logo_url?: string

  @Column({ nullable: true })
  website_url?: string

  @Column({ type: 'decimal', nullable: true })
  min_investment_usd?: number

  @Column({ type: 'decimal', nullable: true })
  max_investment_usd?: number

  @Column('integer', { default: 0 })
  views: number

  @Column('integer', { default: 0 })
  connections: number

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
