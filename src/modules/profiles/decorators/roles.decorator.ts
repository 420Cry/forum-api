import { Reflector } from '@nestjs/core'
import { RolesSelectionType } from 'src/modules/users/users.type'
export const Roles = Reflector.createDecorator<RolesSelectionType>()
