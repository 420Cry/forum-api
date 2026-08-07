import { SetMetadata } from '@nestjs/common'
import { IS_STARTUP_KEY } from '../profiles.constant'

export const IsStartUp = () => {
  SetMetadata(IS_STARTUP_KEY, true)
}
