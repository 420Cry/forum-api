import { SetMetadata } from '@nestjs/common'
import { IS_INVESTOR_KEY } from '../profiles.constant'

export const IsProfile = () => {
  SetMetadata(IS_INVESTOR_KEY, true)
}
