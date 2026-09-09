import { decodeCursor, encodeCursor, type FeedCursor } from './posts.cursor'

const sample: FeedCursor = {
  c: '2026-09-01T10:30:00.000Z',
  i: 'abc12345-1111-2222-3333-444455556666',
}

describe('posts.cursor', () => {
  it('round-trips encode -> decode', () => {
    expect(decodeCursor(encodeCursor(sample))).toEqual(sample)
  })

  it('produces a URL-safe token (no + / = characters)', () => {
    const token = encodeCursor(sample)
    expect(token).not.toMatch(/[+/=]/)
  })

  it('returns null for undefined, null, or empty input', () => {
    expect(decodeCursor(undefined)).toBeNull()
    expect(decodeCursor(null)).toBeNull()
    expect(decodeCursor('')).toBeNull()
  })

  it('returns null for a non-base64 / non-JSON token', () => {
    expect(decodeCursor('!!!not-base64!!!')).toBeNull()
    expect(
      decodeCursor(Buffer.from('not json', 'utf8').toString('base64url')),
    ).toBeNull()
  })

  it('returns null when JSON is valid but not the cursor shape', () => {
    const enc = (v: unknown) =>
      Buffer.from(JSON.stringify(v), 'utf8').toString('base64url')
    expect(decodeCursor(enc(5))).toBeNull()
    expect(decodeCursor(enc('x'))).toBeNull()
    expect(decodeCursor(enc(null))).toBeNull()
    expect(decodeCursor(enc({}))).toBeNull()
    expect(decodeCursor(enc({ c: '2026-09-01T10:30:00.000Z' }))).toBeNull()
    expect(decodeCursor(enc({ c: 123, i: 'x' }))).toBeNull()
  })

  it('returns null when c is not a parseable date', () => {
    const enc = (v: unknown) =>
      Buffer.from(JSON.stringify(v), 'utf8').toString('base64url')
    expect(decodeCursor(enc({ c: 'hello', i: 'abc' }))).toBeNull()
  })

  it('strips extra keys, keeping only c and i', () => {
    const enc = Buffer.from(
      JSON.stringify({ ...sample, evil: true }),
      'utf8',
    ).toString('base64url')
    expect(decodeCursor(enc)).toEqual(sample)
  })
})
