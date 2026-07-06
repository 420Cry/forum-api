import { SetMetadata } from '@nestjs/common'
import { SKIP_EMAIL_VERIFICATION_KEY } from './auth.constants'

/** Allows unverified-email tokens (e.g. GET /auth/me during signup flow). */
export const SkipEmailVerification = () =>
  SetMetadata(SKIP_EMAIL_VERIFICATION_KEY, true)
