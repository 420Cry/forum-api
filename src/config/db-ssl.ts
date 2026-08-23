export type DbSslOption = false | { rejectUnauthorized: false }

/**
 * Supabase (and most hosted Postgres) requires TLS. node-pg's
 * `PGSSLMODE=require` maps to `ssl: true`, which verifies the CA and fails
 * on Heroku ("self-signed certificate"). Prefer `rejectUnauthorized: false`
 * unless SSL is explicitly disabled.
 *
 * Local Docker / 127.0.0.1 stay unencrypted unless PGSSLMODE is set.
 */
export function resolveDbSsl(input: {
  host?: string | null
  sslMode?: string | null
}): DbSslOption {
  const mode = (input.sslMode ?? '').trim().toLowerCase()
  if (mode === 'disable') return false
  if (
    mode === 'require' ||
    mode === 'prefer' ||
    mode === 'verify-ca' ||
    mode === 'verify-full' ||
    mode === 'no-verify'
  ) {
    return { rejectUnauthorized: false }
  }

  const host = (input.host ?? '').toLowerCase()
  if (host.includes('supabase.co') || host.includes('pooler.supabase')) {
    return { rejectUnauthorized: false }
  }

  return false
}
