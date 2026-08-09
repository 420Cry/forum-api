import { IsEnum, IsUUID } from 'class-validator'
import { followTargetTypes } from '../follows.type'

export class FollowDto {
  @IsEnum(followTargetTypes)
  targetType!: (typeof followTargetTypes)[number]

  @IsUUID()
  targetId!: string
}
