import { ServiceUnavailableException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { EnvService } from 'src/config/config.service'
import { SendbirdClient } from './sendbird.client'

type FetchInit = {
  method?: string
  body?: string
  headers?: Record<string, string>
}

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response
}

describe('SendbirdClient', () => {
  let client: SendbirdClient
  let fetchMock: jest.MockedFunction<typeof fetch>
  const originalFetch = globalThis.fetch

  beforeEach(async () => {
    fetchMock = jest.fn()
    globalThis.fetch = fetchMock

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendbirdClient,
        {
          provide: EnvService,
          useValue: {
            getSendbirdConfig: () => ({
              appId: 'APP123',
              apiToken: 'secret-token',
            }),
          },
        },
      ],
    }).compile()

    client = module.get(SendbirdClient)
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  function requestUrl(input: Parameters<typeof fetch>[0]): string {
    if (typeof input === 'string') return input
    if (input instanceof URL) return input.href
    if (input instanceof Request) return input.url
    return ''
  }

  function lastCall(): [string, FetchInit] {
    const call = fetchMock.mock.calls.at(-1)
    if (!call) throw new Error('fetch was not called')
    return [requestUrl(call[0]), (call[1] ?? {}) as FetchInit]
  }

  function parseBody(body: string | undefined): Record<string, unknown> {
    return JSON.parse(body ?? '{}') as Record<string, unknown>
  }

  it('creates a user on first upsert', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { user_id: 'u1' }))

    await client.upsertUser({
      userId: 'u1',
      nickname: 'Alex Morgan',
      profileUrl: 'https://cdn.example/a.png',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = lastCall()
    expect(url).toBe('https://api-APP123.sendbird.com/v3/users')
    expect(init.method).toBe('POST')
    expect(parseBody(init.body)).toEqual({
      user_id: 'u1',
      nickname: 'Alex Morgan',
      profile_url: 'https://cdn.example/a.png',
      issue_access_token: false,
    })
    expect(init.headers?.['Api-Token']).toBe('secret-token')
  })

  it('updates the user when Sendbird reports it already exists', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(400, { error: true, code: 400202, message: 'exists' }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { user_id: 'u1' }))

    await client.upsertUser({
      userId: 'u1',
      nickname: 'Alex Morgan',
      profileUrl: '',
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [url, init] = lastCall()
    expect(url).toBe('https://api-APP123.sendbird.com/v3/users/u1')
    expect(init.method).toBe('PUT')
  })

  it('issues a session token', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { token: 'sess_1', expires_at: 1_700_000_000_000 }),
    )

    const issued = await client.issueSessionToken('u1', 1_700_000_000_000)
    expect(issued).toEqual({ token: 'sess_1', expires_at: 1_700_000_000_000 })
    expect(requestUrl(fetchMock.mock.calls[0]?.[0] ?? '')).toBe(
      'https://api-APP123.sendbird.com/v3/users/u1/token',
    )
  })

  it('creates a distinct DM channel', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { channel_url: 'sendbird_group_abc' }),
    )

    const url = await client.createDistinctDmChannel('me', 'peer')
    expect(url).toBe('sendbird_group_abc')
    const [, init] = lastCall()
    expect(parseBody(init.body)).toMatchObject({
      user_ids: ['me', 'peer'],
      inviter_id: 'me',
      is_distinct: true,
      custom_type: 'dm',
    })
  })

  it('returns 0 unread when the Sendbird user does not exist yet', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, { error: true, code: 400201, message: 'not found' }),
    )

    await expect(client.getUnreadMessageCount('u1')).resolves.toBe(0)
  })

  it('throws when Sendbird is not configured', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendbirdClient,
        {
          provide: EnvService,
          useValue: { getSendbirdConfig: () => null },
        },
      ],
    }).compile()
    const unconfigured = module.get(SendbirdClient)

    await expect(
      unconfigured.upsertUser({ userId: 'u1', nickname: 'A', profileUrl: '' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException)
  })
})
