import { SetMetadata } from '@nestjs/common'
import { REQUIRES_NOT_ONBOARDED_KEY } from '../../auth/auth.constants'

/** Route is only valid while onboarding is still in progress. */
export const RequiresNotOnboarded = () =>
  SetMetadata(REQUIRES_NOT_ONBOARDED_KEY, true)
