import { Type } from 'class-transformer'
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator'
import { rolesSelection } from '../users.type'

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
  @Type(() => Number)
  @IsInt({ message: 'Age invalid format' })
  @Min(5, { message: 'Age must be at least 5' })
  @Max(100, { message: 'Age must be below 100' })
  age?: number

  @IsOptional()
  @ValidateIf((o: SaveOnboardingDraftDto) => !!o.location)
  @IsString()
  @MinLength(2, { message: 'Location must have at least 2 characters' })
  @Matches(noSpecialChars, {
    message: 'Location must not contain special characters',
  })
  location?: string

  @IsOptional()
  @ValidateIf((o: SaveOnboardingDraftDto) => !!o.occupation)
  @IsString()
  @MinLength(2, { message: 'Occupation must have at least 2 characters' })
  @Matches(noSpecialChars, {
    message: 'Occupation must not contain special characters',
  })
  occupation?: string
}
