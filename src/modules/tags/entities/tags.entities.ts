import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  key: string

  @Column({ unique: true })
  name: string
}
