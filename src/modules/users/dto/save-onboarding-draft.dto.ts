import { Type } from 'class-transformer'
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator'
import { TAG_KEY_RE } from '../../tags/tag-key'
import { rolesSelection } from '../users.type'
import { DATE_OF_BIRTH_RE } from '../utils/date-of-birth'

const noSpecialChars = /^[a-zA-Z0-9\s]+$/

/**
 * Partial onboarding progress. Does not set onboarded_at.
 * Validation is relaxed so incomplete drafts can be saved.
 */
export class SaveOnboardingDraftDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Step invalid format' })
  @Min(1, { message: 'Step must be at least 1' })
  @Max(3, { message: 'Step must be at most 3' })
  step?: number

  @IsOptional()
  @IsEnum(rolesSelection, {
    message: 'User role can only be Founder or Investor',
  })
  role?: 'Founder' | 'Investor'

  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Invalid format for goal' })
  goals?: string[]

  @IsOptional()
  @ValidateIf((o: SaveOnboardingDraftDto) => !!o.firstName)
  @IsString()
  @MinLength(2, { message: 'First name must have at least 2 characters' })
  @Matches(noSpecialChars, {
    message: 'First name must not contain special characters',
  })
  firstName?: string

  @IsOptional()
  @ValidateIf((o: SaveOnboardingDraftDto) => !!o.lastName)
  @IsString()
  @MinLength(2, { message: 'Last name must have at least 2 characters' })
  @Matches(noSpecialChars, {
    message: 'Last name must not contain special characters',
  })
  lastName?: string

  @IsOptional()
  @ValidateIf((o: SaveOnboardingDraftDto) => !!o.dateOfBirth)
  @IsString()
  @Matches(DATE_OF_BIRTH_RE, {
    message: 'Date of birth must be YYYY-MM-DD',
  })
  dateOfBirth?: string

  @IsOptional()
  @ValidateIf((o: SaveOnboardingDraftDto) => !!o.location)
  @IsString()
  @Matches(TAG_KEY_RE, {
    message: 'Location must be a valid catalog key',
  })
  location?: string

  @IsOptional()
  @ValidateIf((o: SaveOnboardingDraftDto) => !!o.locationName)
  @IsString()
  @MinLength(1, { message: 'Location name cannot be empty' })
  locationName?: string

  @IsOptional()
  @ValidateIf((o: SaveOnboardingDraftDto) => !!o.occupation)
  @IsString()
  @Matches(TAG_KEY_RE, {
    message: 'Occupation must be a valid catalog key',
  })
  occupation?: string

  @IsOptional()
  @ValidateIf((o: SaveOnboardingDraftDto) => !!o.occupationName)
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
}
