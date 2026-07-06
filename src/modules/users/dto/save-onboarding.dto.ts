import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator'
import { rolesSelection } from '../users.type'

const noSpecialChars = /^[a-zA-Z0-9\s]+$/

export class SaveOnboardingDto {
  @IsEnum(rolesSelection, {
    message: 'User role can only be Founder or Investor',
  })
  @IsNotEmpty({ message: 'Role cannot be empty' })
  role: 'Founder' | 'Investor'

  @IsArray()
  @IsString({ each: true, message: 'Invalid format for goal' })
  @ArrayMinSize(1, { message: 'Please select at least one goal' })
  goals: string[]

  @IsString()
  @MinLength(2, { message: 'First name must have at least 2 characters' })
  @Matches(noSpecialChars, {
    message: 'First name must not contain special characters',
  })
  firstName: string

  @IsString()
  @MinLength(2, { message: 'Last name must have at least 2 characters' })
  @Matches(noSpecialChars, {
    message: 'Last name must not contain special characters',
  })
  lastName: string

  @Type(() => Number)
  @IsInt({ message: 'Age invalid format' })
  @Min(17, { message: 'Age must be greater than 16' })
  age: number

  @IsString()
  @MinLength(2, { message: 'Location must have at least 2 characters' })
  @Matches(noSpecialChars, {
    message: 'Location must not contain special characters',
  })
  location: string

  @IsString()
  @MinLength(2, { message: 'Occupation must have at least 2 characters' })
  @Matches(noSpecialChars, {
    message: 'Occupation must not contain special characters',
  })
  occupation: string
}
