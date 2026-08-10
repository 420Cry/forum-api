import {
  allocateUniqueUrlKey,
  isReservedUrlKey,
  isUuid,
  isValidUrlKeyFormat,
  urlKeyBase,
  urlKeySourceFromUser,
  userProfilePath,
} from './url-key'

describe('urlKeyBase', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(urlKeyBase('Dao Nguyen')).toBe('dao-nguyen')
  })

  it('strips non-alphanumeric characters and folds accents', () => {
    expect(urlKeyBase('José  García!')).toBe('jose-garcia')
  })

  it('collapses repeated hyphens and trims edges', () => {
    expect(urlKeyBase('  Foo---Bar  ')).toBe('foo-bar')
  })

  it('falls back for reserved or empty results', () => {
    expect(urlKeyBase('admin')).toBe('member')
    expect(urlKeyBase('!!!')).toBe('member')
  })
})

describe('isValidUrlKeyFormat', () => {
  it('accepts simple hyphenated keys', () => {
    expect(isValidUrlKeyFormat('dao-nguyen')).toBe(true)
    expect(isValidUrlKeyFormat('dao-nguyen-2')).toBe(true)
  })

  it('rejects reserved, short, or malformed keys', () => {
    expect(isValidUrlKeyFormat('me')).toBe(false)
    expect(isValidUrlKeyFormat('a')).toBe(false)
    expect(isValidUrlKeyFormat('-dao')).toBe(false)
    expect(isValidUrlKeyFormat('Dao')).toBe(false)
  })
})

describe('allocateUniqueUrlKey', () => {
  it('returns the base when available', async () => {
    const key = await allocateUniqueUrlKey('Dao Nguyen', () =>
      Promise.resolve(false),
    )
    expect(key).toBe('dao-nguyen')
  })

  it('appends -2, -3 on collisions', async () => {
    const taken = new Set(['dao-nguyen', 'dao-nguyen-2'])
    const key = await allocateUniqueUrlKey('Dao Nguyen', (c) =>
      Promise.resolve(taken.has(c)),
    )
    expect(key).toBe('dao-nguyen-3')
  })
})

describe('urlKeySourceFromUser', () => {
  it('prefers name over email local-part', () => {
    expect(
      urlKeySourceFromUser({ name: 'Dao Nguyen', email: 'dao@example.com' }),
    ).toBe('Dao Nguyen')
    expect(urlKeySourceFromUser({ name: null, email: 'dao@example.com' })).toBe(
      'dao',
    )
  })
})

describe('isReservedUrlKey / isUuid / userProfilePath', () => {
  it('flags route-adjacent names', () => {
    expect(isReservedUrlKey('settings')).toBe(true)
    expect(isReservedUrlKey('dao-nguyen')).toBe(false)
  })

  it('detects uuid-shaped ids', () => {
    expect(isUuid('11111111-1111-1111-1111-111111111111')).toBe(true)
    expect(isUuid('alex-morgan')).toBe(false)
  })

  it('builds the public profile path', () => {
    expect(userProfilePath('dao-nguyen')).toBe('/u/dao-nguyen')
  })
})
