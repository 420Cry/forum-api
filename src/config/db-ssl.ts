export type DbSslOption =
  | false
  | { rejectUnauthorized: true }
  | { rejectUnauthorized: false }

/**
 * Supabase (and most hosted Postgres) requires TLS.
 *
 * - `verify-ca` / `verify-full` / `require` → TLS with CA verification
 * - `no-verify` → TLS without CA verification (Heroku dynos that lack the
 *   pooler CA chain; prefer verifying when possible)
 * - Host hint for `*.supabase.co` / pooler → verify by default
 * - Local Docker / 127.0.0.1 stay unencrypted unless PGSSLMODE is set
 */
export function resolveDbSsl(input: {
  host?: string | null
  sslMode?: string | null
}): DbSslOption {
  const mode = (input.sslMode ?? '').trim().toLowerCase()
  if (mode === 'disable') return false
  if (mode === 'no-verify') {
    return { rejectUnauthorized: false }
  }
  if (
    mode === 'require' ||
    mode === 'prefer' ||
    mode === 'verify-ca' ||
    mode === 'verify-full'
  ) {
    return { rejectUnauthorized: true }
  }

  const host = (input.host ?? '').toLowerCase()
  if (host.includes('supabase.co') || host.includes('pooler.supabase')) {
    return { rejectUnauthorized: true }
  }

  return false
}
