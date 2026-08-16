import { IsUUID } from 'class-validator'

export class OpenChannelDto {
  /** Peer Fundedr user id (Supabase UID). */
  @IsUUID()
  userId!: string
}
