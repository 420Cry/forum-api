import { Reflector } from '@nestjs/core'
import { UsersService } from 'src/modules/users/users.service'
import { RolesGuard } from './roles.guard'
import { ExecutionContext } from '@nestjs/common'

describe('RolesGuard', () => {
  const get = jest.fn()
  const reflector = {
    get,
  } as unknown as Reflector

  const findBySupabaseUid = jest.fn()
  const usersService = {
    findBySupabaseUid,
  } as unknown as UsersService

  function createContext(userId = 'user-2') {
    const request = { user: { id: userId, emailVerified: true } }
    return {
      switchToHttps: () => ({ getRequest: () => request }),
      request,
    } as unknown as ExecutionContext
  }

  const guard = new RolesGuard(reflector, usersService)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('guard must be defined', () => {})
})
