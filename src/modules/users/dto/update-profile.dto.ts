import { Transform } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator'
import { TAG_KEY_RE } from '../../tags/tag-key'
import { rolesSelection } from '../users.type'
import { DATE_OF_BIRTH_RE } from '../utils/date-of-birth'

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
  @IsString()
  @Matches(DATE_OF_BIRTH_RE, {
    message: 'Date of birth must be YYYY-MM-DD',
  })
  dateOfBirth?: string

  @IsOptional()
  @IsString()
  @Matches(TAG_KEY_RE, {
    message: 'Location must be a valid catalog key',
  })
  location?: string

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Location name cannot be empty' })
  locationName?: string

  @IsOptional()
  @IsString()
  @Matches(TAG_KEY_RE, {
    message: 'Occupation must be a valid catalog key',
  })
  occupation?: string

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Occupation name cannot be empty' })
  occupationName?: string

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
