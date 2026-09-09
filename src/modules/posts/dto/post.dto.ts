import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator'
import { POST_CONTENT_MAX_LENGTH } from '../posts.constants'
import { postVisibility } from '../posts.type'
import type { VisibilityType } from '../posts.type'

/**
 * `profile_id` is never accepted from the body — the controller always takes it
 * from `req.user.id`.
 */
export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(POST_CONTENT_MAX_LENGTH)
  content!: string

  @IsIn(postVisibility)
  visibility!: VisibilityType

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  imageUrl?: string | null
}

/** Every field optional; an explicit `null` on `imageUrl` clears the stored value. */
export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(POST_CONTENT_MAX_LENGTH)
  content?: string

  @IsOptional()
  @IsIn(postVisibility)
  visibility?: VisibilityType

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  imageUrl?: string | null
}
