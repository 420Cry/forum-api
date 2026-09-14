import { readFileSync } from 'node:fs'

export type DbSslOption =
  | false
  | { rejectUnauthorized: true; ca?: string }
  | { rejectUnauthorized: false }

export type LoadDbSslCaInput = {
  /** PEM text (Heroku `DB_SSL_CA`). Supports literal `\n` from single-line config vars. */
  pem?: string | null
  /** Filesystem path (`PGSSLROOTCERT`). */
  certPath?: string | null
  readFile?: (path: string) => string
}

/**
 * Supabase signs with a private CA (dashboard → Database → SSL → download).
 * Node's public CA store does not include it, so `rejectUnauthorized: true`
 * without `ca` fails on Heroku ("self-signed certificate", H10/503).
 */
export function loadDbSslCa(input: LoadDbSslCaInput): string | undefined {
  const pem = input.pem?.trim()
  if (pem) return pem.replace(/\\n/g, '\n')

  const certPath = input.certPath?.trim()
  if (!certPath) return undefined
  const read = input.readFile ?? ((path) => readFileSync(path, 'utf8'))
  return read(certPath)
}

/**
 * Map PGSSLMODE / host to node-pg `ssl`.
 *
 * - `disable` — no TLS
 * - `no-verify` — TLS, no CA check
 * - `require` / `prefer` / `verify-ca` / `verify-full` — TLS + CA verify
 * - Host hint for `*.supabase.co` / pooler — verify by default
 *
 * Pass `ca` (from `loadDbSslCa`) so verify can succeed against Supabase.
 */
export function resolveDbSsl(input: {
  host?: string | null
  sslMode?: string | null
  ca?: string | null
}): DbSslOption {
  const mode = (input.sslMode ?? '').trim().toLowerCase()
  if (mode === 'disable') return false
  if (mode === 'no-verify') {
    return { rejectUnauthorized: false }
  }

  const ca = input.ca?.trim() || undefined
  const verify = (): DbSslOption =>
    ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: true }

  if (
    mode === 'require' ||
    mode === 'prefer' ||
    mode === 'verify-ca' ||
    mode === 'verify-full'
  ) {
    return verify()
  }

  const host = (input.host ?? '').toLowerCase()
  if (host.includes('supabase.co') || host.includes('pooler.supabase')) {
    return verify()
  }

  return false
}

/** Fail fast when verify modes are set without a Supabase CA (common Heroku boot crash). */
export function assertDbSslConfig(
  ssl: DbSslOption,
  sslMode?: string | null,
): void {
  const mode = (sslMode ?? '').trim().toLowerCase()
  if (mode !== 'verify-ca' && mode !== 'verify-full') return

  if (typeof ssl === 'object' && ssl.rejectUnauthorized === true && !ssl.ca) {
    throw new Error(
      'PGSSLMODE verify-ca/verify-full requires DB_SSL_CA or PGSSLROOTCERT',
    )
  }
}
