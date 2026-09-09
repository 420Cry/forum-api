/** Keyset cursor: last row's `(createdAt, id)`. */
export type FeedCursor = {
  c: string
  i: string
}

export function encodeCursor(cursor: FeedCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url')
}

/** Returns `null` on missing or malformed input. */
export function decodeCursor(
  raw: string | undefined | null,
): FeedCursor | null {
  if (typeof raw !== 'string' || raw.length === 0) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'))
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) return null
  const { c, i } = parsed as Record<string, unknown>
  if (typeof c !== 'string' || typeof i !== 'string') return null
  if (Number.isNaN(Date.parse(c))) return null

  return { c, i }
}
