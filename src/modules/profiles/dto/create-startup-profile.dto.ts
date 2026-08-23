import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  ValidateIf,
} from 'class-validator'
import { startupProfilesStage } from '../profiles.type'

export class CreateStartupProfileDto {
  @IsString()
  @MinLength(2)
  companyName!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsEnum(startupProfilesStage)
  stage!: (typeof startupProfilesStage)[number]

  @IsString()
  @MinLength(2)
  industry!: string

  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value != null)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  websiteUrl?: string

  @IsEmail()
  contactEmail!: string

  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value != null)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  avatarUrl?: string

  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value != null)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  logoUrl?: string

  @IsDateString()
  foundedAt!: string
}

export class UpdateStartupProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  companyName?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsEnum(startupProfilesStage)
  stage?: (typeof startupProfilesStage)[number]

  @IsOptional()
  @IsString()
  @MinLength(2)
  industry?: string

  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value != null)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  websiteUrl?: string | null

  @IsOptional()
  @IsEmail()
  contactEmail?: string

  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value != null)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  avatarUrl?: string | null

  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value != null)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  logoUrl?: string | null

  @IsOptional()
  @IsDateString()
  foundedAt?: string
}
