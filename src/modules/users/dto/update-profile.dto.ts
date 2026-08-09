import { Transform, Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator'
import { rolesSelection } from '../users.type'

const noSpecialChars = /^[a-zA-Z0-9\s]+$/

/**
 * Editing an already-onboarded profile. Every field is optional so the client
 * can send only what changed. No onboarding state machine is involved.
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsEnum(rolesSelection, {
    message: 'User role can only be Founder or Investor',
  })
  role?: 'Founder' | 'Investor'

  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Invalid format for goal' })
  @ArrayMinSize(1, { message: 'Please select at least one goal' })
  goals?: string[]

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'First name must have at least 2 characters' })
  @Matches(noSpecialChars, {
    message: 'First name must not contain special characters',
  })
  firstName?: string

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Last name must have at least 2 characters' })
  @Matches(noSpecialChars, {
    message: 'Last name must not contain special characters',
  })
  lastName?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Age invalid format' })
  @Min(17, { message: 'Age must be greater than 16' })
  age?: number

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Location must have at least 2 characters' })
  @Matches(noSpecialChars, {
    message: 'Location must not contain special characters',
  })
  location?: string

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Occupation must have at least 2 characters' })
  @Matches(noSpecialChars, {
    message: 'Occupation must not contain special characters',
  })
  occupation?: string

  /** Public avatar URL after client upload to storage. Empty string clears it. */
  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value != null)
  @IsUrl(
    { require_protocol: true, protocols: ['http', 'https'] },
    { message: 'Avatar URL must be a valid http(s) URL' },
  )
  avatarUrl?: string | null

  /** Optional custom `users.url_key` (`/u/:urlKey`). Normalized in BE. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @MinLength(2, { message: 'Profile URL must have at least 2 characters' })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Profile URL may only use lowercase letters, numbers, and hyphens',
  })
  urlKey?: string
}
