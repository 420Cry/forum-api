import { User } from 'src/modules/users/entities'
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { followTargetTypes } from '../follows.type'
import type { FollowTargetType } from '../follows.type'

@Entity('follows')
@Index(['follower_user_id', 'target_type', 'target_id'], { unique: true })
export class Follows {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  follower_user_id!: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_user_id' })
  follower!: User

  @Column({
    type: 'enum',
    enum: followTargetTypes,
  })
  target_type!: FollowTargetType

  @Column({ type: 'uuid' })
  target_id!: string

  @CreateDateColumn()
  createdAt!: Date
}
