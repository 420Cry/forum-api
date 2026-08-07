import { User } from 'src/modules/users/entities'
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { postVisibility } from '../posts.type'
import type { VisibilityType } from '../posts.type'

@Entity('posts')
@Index(['createdAt', 'id'], { unique: true })
export class Posts {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  profile_id: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'profile_id' })
  author: User

  @Column('text')
  content: string

  @Column({
    type: 'enum',
    enum: postVisibility,
  })
  visibility: VisibilityType

  @Column({ nullable: true })
  image_url?: string

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @Column({ nullable: true, default: null })
  deletedAt!: Date
}
