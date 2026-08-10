import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator'
import { TAG_KEY_RE } from '../../tags/tag-key'
import { rolesSelection } from '../users.type'
import { DATE_OF_BIRTH_RE } from '../utils/date-of-birth'

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

  /** Calendar date of birth (`YYYY-MM-DD`). Must be 17–120 years old. */
  @IsString()
  @Matches(DATE_OF_BIRTH_RE, {
    message: 'Date of birth must be YYYY-MM-DD',
  })
  dateOfBirth: string

  @IsString()
  @Matches(TAG_KEY_RE, {
    message: 'Location must be a valid catalog key',
  })
  location: string

  /** Display name for a new city location (required when key is not yet in tags). */
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Location name cannot be empty' })
  locationName?: string

  @IsString()
  @Matches(TAG_KEY_RE, {
    message: 'Occupation must be a valid catalog key',
  })
  occupation: string

  /** Display name when saving a new free-text occupation key. */
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Occupation name cannot be empty' })
  occupationName?: string
}
