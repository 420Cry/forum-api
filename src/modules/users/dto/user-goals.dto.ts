import { ArrayMinSize, IsArray, IsString } from 'class-validator'

export class UserGoalsDto {
  @IsArray()
  @IsString({ each: true, message: 'Invalid format for goal' })
  @ArrayMinSize(1, { message: 'Please select your goal!' })
  goals: string[]
}
