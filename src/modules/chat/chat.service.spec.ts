import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { FollowsService } from '../follows/follows.service'
import { UsersService } from '../users/users.service'
import { ChatService } from './chat.service'
import { SendbirdClient } from './sendbird.client'

const ME = '11111111-1111-1111-1111-111111111111'
const PEER = '22222222-2222-2222-2222-222222222222'

function onboarded(uid: string, name: string) {
  return {
    supabaseUid: uid,
    name,
    avatar_url: null,
    onboarded_at: new Date('2026-01-01'),
  }
}

describe('ChatService', () => {
  let service: ChatService
  let sendbird: {
    isConfigured: jest.Mock
    getAppId: jest.Mock
    upsertUser: jest.Mock
    issueSessionToken: jest.Mock
    createDistinctDmChannel: jest.Mock
    getUnreadMessageCount: jest.Mock
  }
  let usersService: { findBySupabaseUid: jest.Mock }
  let followsService: { canMessagePeer: jest.Mock }

  beforeEach(async () => {
    sendbird = {
      isConfigured: jest.fn().mockReturnValue(true),
      getAppId: jest.fn().mockReturnValue('APP123'),
      upsertUser: jest.fn().mockResolvedValue(undefined),
      issueSessionToken: jest.fn().mockResolvedValue({
        token: 'sess_1',
        expires_at: 1_700_000_000_000,
      }),
      createDistinctDmChannel: jest
        .fn()
        .mockResolvedValue('sendbird_group_abc'),
      getUnreadMessageCount: jest.fn().mockResolvedValue(3),
    }
    usersService = {
      findBySupabaseUid: jest.fn(),
    }
    followsService = {
      canMessagePeer: jest.fn().mockResolvedValue(true),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: SendbirdClient, useValue: sendbird },
        { provide: UsersService, useValue: usersService },
        { provide: FollowsService, useValue: followsService },
      ],
    }).compile()

    service = module.get(ChatService)
  })

  it('issues a session after upserting the current user', async () => {
    usersService.findBySupabaseUid.mockResolvedValue(
      onboarded(ME, 'Alex Morgan'),
    )

    const session = await service.getSession(ME)

    expect(sendbird.upsertUser).toHaveBeenCalledWith({
      userId: ME,
      nickname: 'Alex Morgan',
      profileUrl: '',
    })
    expect(session).toEqual({
      appId: 'APP123',
      userId: ME,
      token: 'sess_1',
      expiresAt: 1_700_000_000_000,
    })
  })

  it('opens a distinct channel between connected onboarded users', async () => {
    usersService.findBySupabaseUid.mockImplementation((id: string) => {
      if (id === ME) return Promise.resolve(onboarded(ME, 'Alex'))
      if (id === PEER) return Promise.resolve(onboarded(PEER, 'Jordan'))
      return Promise.resolve(null)
    })

    const result = await service.openChannel(ME, PEER)

    expect(followsService.canMessagePeer).toHaveBeenCalledWith(ME, PEER)
    expect(sendbird.createDistinctDmChannel).toHaveBeenCalledWith(ME, PEER)
    expect(result).toEqual({ channelUrl: 'sendbird_group_abc' })
  })

  it('rejects messaging a peer with no follow relationship', async () => {
    usersService.findBySupabaseUid.mockImplementation((id: string) => {
      if (id === ME) return Promise.resolve(onboarded(ME, 'Alex'))
      if (id === PEER) return Promise.resolve(onboarded(PEER, 'Jordan'))
      return Promise.resolve(null)
    })
    followsService.canMessagePeer.mockResolvedValue(false)

    await expect(service.openChannel(ME, PEER)).rejects.toBeInstanceOf(
      ForbiddenException,
    )
    expect(sendbird.createDistinctDmChannel).not.toHaveBeenCalled()
  })

  it('rejects messaging yourself', async () => {
    await expect(service.openChannel(ME, ME)).rejects.toBeInstanceOf(
      BadRequestException,
    )
    expect(sendbird.createDistinctDmChannel).not.toHaveBeenCalled()
  })

  it('rejects a peer who is not onboarded', async () => {
    usersService.findBySupabaseUid.mockImplementation((id: string) => {
      if (id === ME) return Promise.resolve(onboarded(ME, 'Alex'))
      return Promise.resolve(null)
    })

    await expect(service.openChannel(ME, PEER)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })

  it('returns unread 0 when Sendbird is not configured', async () => {
    sendbird.isConfigured.mockReturnValue(false)
    await expect(service.getUnread(ME)).resolves.toEqual({ unread: 0 })
    expect(sendbird.getUnreadMessageCount).not.toHaveBeenCalled()
  })

  it('throws when requesting a session without Sendbird configured', async () => {
    sendbird.isConfigured.mockReturnValue(false)
    await expect(service.getSession(ME)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    )
  })
})
