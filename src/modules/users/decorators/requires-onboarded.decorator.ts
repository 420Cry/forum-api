import { SetMetadata } from '@nestjs/common'
import { REQUIRES_ONBOARDED_KEY } from '../../auth/auth.constants'

/** Route mutates or reads data that requires a completed onboarding profile. */
export const RequiresOnboarded = () => SetMetadata(REQUIRES_ONBOARDED_KEY, true)
