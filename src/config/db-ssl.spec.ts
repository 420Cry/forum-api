import { loadDbSslCa, resolveDbSsl } from './db-ssl'

describe('loadDbSslCa', () => {
  it('reads PEM from DB_SSL_CA, including escaped newlines', () => {
    expect(
      loadDbSslCa({
        pem: '  -----BEGIN CERTIFICATE-----\\nABC\\n-----END CERTIFICATE-----  ',
      }),
    ).toBe('-----BEGIN CERTIFICATE-----\nABC\n-----END CERTIFICATE-----')
  })

  it('reads a file from PGSSLROOTCERT', () => {
    const readFile = (path: string) => {
      expect(path).toBe('/tmp/prod-ca-2021.crt')
      return 'FILE-PEM'
    }
    expect(loadDbSslCa({ certPath: '/tmp/prod-ca-2021.crt', readFile })).toBe(
      'FILE-PEM',
    )
  })

  it('prefers inline PEM over a file path', () => {
    expect(
      loadDbSslCa({
        pem: 'INLINE',
        certPath: '/tmp/prod-ca-2021.crt',
        readFile: () => 'FILE',
      }),
    ).toBe('INLINE')
  })
})

describe('resolveDbSsl', () => {
  it('keeps local hosts unencrypted', () => {
    expect(resolveDbSsl({ host: '127.0.0.1' })).toBe(false)
    expect(resolveDbSsl({ host: 'localhost' })).toBe(false)
    expect(resolveDbSsl({ host: 'host.docker.internal' })).toBe(false)
  })

  it('enables TLS with CA verify for Supabase hosts', () => {
    expect(
      resolveDbSsl({ host: 'aws-0-eu-central-1.pooler.supabase.com' }),
    ).toEqual({ rejectUnauthorized: true })
    expect(
      resolveDbSsl({ host: 'db.qiinsfqoljenkhtasvrk.supabase.co' }),
    ).toEqual({ rejectUnauthorized: true })
  })

  it('attaches the CA when verifying', () => {
    expect(
      resolveDbSsl({
        host: 'aws-0-eu-central-1.pooler.supabase.com',
        sslMode: 'verify-full',
        ca: 'PEM',
      }),
    ).toEqual({ rejectUnauthorized: true, ca: 'PEM' })
  })

  it('does not attach the CA when no-verify', () => {
    expect(
      resolveDbSsl({
        host: 'aws-0-eu-central-1.pooler.supabase.com',
        sslMode: 'no-verify',
        ca: 'PEM',
      }),
    ).toEqual({ rejectUnauthorized: false })
  })

  it('honours PGSSLMODE', () => {
    expect(resolveDbSsl({ host: '127.0.0.1', sslMode: 'require' })).toEqual({
      rejectUnauthorized: true,
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
    expect(
      resolveDbSsl({
        host: 'aws-0-eu-central-1.pooler.supabase.com',
        sslMode: 'verify-full',
      }),
    ).toEqual({ rejectUnauthorized: true })
  })
})
