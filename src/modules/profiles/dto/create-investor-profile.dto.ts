import { Type } from 'class-transformer'
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator'

export class CreateInvestorProfileDto {
  @IsString()
  @MinLength(2)
  firmName!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsString()
  @MinLength(2)
  industry!: string

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

  @IsOptional()
  @ValidateIf((_, value) => value !== '' && value != null)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  websiteUrl?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minInvestmentUsd?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxInvestmentUsd?: number
}

export class UpdateInvestorProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  firmName?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  @MinLength(2)
  industry?: string

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
  @ValidateIf((_, value) => value !== '' && value != null)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  websiteUrl?: string | null

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minInvestmentUsd?: number | null

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxInvestmentUsd?: number | null
}
