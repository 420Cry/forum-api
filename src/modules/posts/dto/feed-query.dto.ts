import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Min } from 'class-validator'

/** Query params for `GET /posts`; the service clamps `limit` to its ceiling. */
export class FeedQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  limit?: number

  @IsOptional()
  @IsString()
  cursor?: string
}
