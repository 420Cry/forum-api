import { User } from 'src/modules/users/entities'
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm'
import { reactableContent, reactionList, reactProfile } from '../reactions.type'
import type {
  ReactionType,
  ReactableType,
  ReactProfileType,
} from '../reactions.type'

@Entity('reactions')
@Index(['profile_id', 'reactable_type', 'reactable_id'], { unique: true })
export class Reactions {
  @PrimaryGeneratedColumn()
  id: string

  @Column()
  profile_id: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'profile_id' })
  user: User

  @Column({
    type: 'enum',
    enum: reactProfile,
  })
  reacted_as: ReactProfileType

  @Column({
    type: 'enum',
    enum: reactionList,
  })
  type: ReactionType

  @Column({
    type: 'enum',
    enum: reactableContent,
  })
  reactable_type: ReactableType

  @Column('uuid')
  reactable_id: string
}
