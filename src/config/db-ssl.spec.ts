import { resolveDbSsl } from './db-ssl'

describe('resolveDbSsl', () => {
  it('keeps local hosts unencrypted', () => {
    expect(resolveDbSsl({ host: '127.0.0.1' })).toBe(false)
    expect(resolveDbSsl({ host: 'localhost' })).toBe(false)
    expect(resolveDbSsl({ host: 'host.docker.internal' })).toBe(false)
  })

  it('enables TLS without CA verify for Supabase hosts', () => {
    expect(
      resolveDbSsl({ host: 'aws-0-eu-central-1.pooler.supabase.com' }),
    ).toEqual({ rejectUnauthorized: false })
    expect(
      resolveDbSsl({ host: 'db.qiinsfqoljenkhtasvrk.supabase.co' }),
    ).toEqual({ rejectUnauthorized: false })
  })

  it('honours PGSSLMODE', () => {
    expect(resolveDbSsl({ host: '127.0.0.1', sslMode: 'require' })).toEqual({
      rejectUnauthorized: false,
    })
    expect(
      resolveDbSsl({
        host: 'aws-0-eu-central-1.pooler.supabase.com',
        sslMode: 'disable',
      }),
    ).toBe(false)
    expect(resolveDbSsl({ host: '127.0.0.1', sslMode: 'no-verify' })).toEqual({
      rejectUnauthorized: false,
    })
  })
})
