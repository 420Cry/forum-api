import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import type { TagKind } from '../catalog.seeds'

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ unique: true })
  key!: string

  @Column()
  name!: string

  @Column({
    type: 'enum',
    enum: ['goal', 'location', 'occupation', 'industry'],
    enumName: 'tags_kind_enum',
    default: 'goal',
  })
  kind!: TagKind
}
