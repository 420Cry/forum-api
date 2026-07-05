import { IsEnum, IsNotEmpty } from 'class-validator'
import { rolesSelection } from '../users.type'

export class UserRoleDto {
  @IsEnum(rolesSelection, {
    message: 'User role can only be startup or investor',
  })
  @IsNotEmpty({ message: 'Role cannot be empty' })
  role: 'Founder' | 'Investor'
}
