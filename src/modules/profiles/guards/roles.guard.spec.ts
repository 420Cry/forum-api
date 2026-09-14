import { Reflector } from '@nestjs/core'
import { UsersService } from '../../users/users.service'
import { RolesGuard } from './roles.guard'

describe('RolesGuard', () => {
  const get = jest.fn()
  const reflector = {
    get,
  } as unknown as Reflector

  const findBySupabaseUid = jest.fn()
  const usersService = {
    findBySupabaseUid,
  } as unknown as UsersService

  const guard = new RolesGuard(reflector, usersService)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('guard must be defined', () => {
    expect(guard).toBeDefined()
  })
})
