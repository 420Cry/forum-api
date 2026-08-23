/** Stable catalog key: lowercase letters, digits, underscore, hyphen. */
export const TAG_KEY_RE = /^[a-z0-9]+(?:[_-][a-z0-9]+)*$/

/** Slug free-text (e.g. occupation title) into a TAG_KEY_RE-compatible key. */
export function textToTagKey(raw: string): string {
  const slug = raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
  return slug || 'other'
}
