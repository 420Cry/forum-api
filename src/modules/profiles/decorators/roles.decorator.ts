import { Reflector } from '@nestjs/core'
import { RolesSelectionType } from '../../users/users.type'
export const Roles = Reflector.createDecorator<RolesSelectionType>()
