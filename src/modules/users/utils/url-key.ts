const RESERVED_URL_KEYS = new Set([
  'me',
  'settings',
  'find',
  'following',
  'admin',
  'u',
  'startup',
  'investor',
  'onboard',
  'login',
  'signup',
  'auth',
  'api',
  'social',
  'user',
  'users',
  'profile',
  'profiles',
])

const BASE_MAX_LENGTH = 48
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function foldAscii(input: string): string {
  return input.normalize('NFKD').replace(/\p{M}/gu, '')
}

export function isUuid(value: string): boolean {
  return UUID_RE.test(value)
}

export function normalizeUrlKey(value: string): string {
  return value.trim().toLowerCase()
}

/** App path for a personal profile (`/u/:urlKey`). */
export function userProfilePath(urlKey: string): string {
  return `/u/${urlKey}`
}

/**
 * Derive a URL key base from a display name (or email local-part).
 * Collision suffixes are applied separately.
 */
export function urlKeyBase(source: string): string {
  let key = foldAscii(source)
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (key.length > BASE_MAX_LENGTH) {
    key = key.slice(0, BASE_MAX_LENGTH).replace(/-+$/g, '')
  }

  if (!key || isReservedUrlKey(key)) {
    return 'member'
  }

  return key
}

export function isReservedUrlKey(key: string): boolean {
  return RESERVED_URL_KEYS.has(key)
}

export function isValidUrlKeyFormat(key: string): boolean {
  return (
    key.length >= 2 &&
    key.length <= 64 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key) &&
    !isReservedUrlKey(key)
  )
}

/**
 * Unique candidate: `dao-nguyen`, `dao-nguyen-2`, …
 * `isTaken` is true when another user already owns the key.
 */
export async function allocateUniqueUrlKey(
  source: string,
  isTaken: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const base = urlKeyBase(source)
  if (!(await isTaken(base))) return base

  for (let n = 2; n < 10_000; n += 1) {
    const suffix = `-${n}`
    const truncated = base
      .slice(0, Math.max(1, 64 - suffix.length))
      .replace(/-+$/g, '')
    const candidate = `${truncated}${suffix}`
    if (!(await isTaken(candidate))) return candidate
  }

  throw new Error('Unable to allocate a unique profile url_key')
}

export function urlKeySourceFromUser(input: {
  name?: string | null
  email?: string | null
}): string {
  const name = input.name?.trim()
  if (name) return name
  const local = input.email?.split('@')[0]?.trim()
  return local || 'member'
}
