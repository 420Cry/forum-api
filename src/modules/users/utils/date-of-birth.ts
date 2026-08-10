/** Calendar date as `YYYY-MM-DD`. */
export const DATE_OF_BIRTH_RE = /^\d{4}-\d{2}-\d{2}$/

export const MIN_AGE = 17
export const MAX_AGE = 120

export function formatDateOnly(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Parse `YYYY-MM-DD` as a UTC calendar date (no timezone shift). */
export function parseDateOfBirth(raw: string): Date | null {
  if (!DATE_OF_BIRTH_RE.test(raw)) return null
  const [ys, ms, ds] = raw.split('-')
  const y = Number(ys)
  const m = Number(ms)
  const d = Number(ds)
  const date = new Date(Date.UTC(y, m - 1, d))
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null
  }
  return date
}

export function ageFromDateOfBirth(dob: Date, asOf: Date = new Date()): number {
  let age = asOf.getUTCFullYear() - dob.getUTCFullYear()
  const monthDelta = asOf.getUTCMonth() - dob.getUTCMonth()
  if (
    monthDelta < 0 ||
    (monthDelta === 0 && asOf.getUTCDate() < dob.getUTCDate())
  ) {
    age -= 1
  }
  return age
}

export type DateOfBirthCheck =
  | { ok: true; date: Date; age: number; iso: string }
  | { ok: false; reason: 'invalid' | 'too_young' | 'too_old' | 'future' }

export function checkDateOfBirth(
  raw: string,
  asOf: Date = new Date(),
): DateOfBirthCheck {
  const date = parseDateOfBirth(raw.trim())
  if (!date) return { ok: false, reason: 'invalid' }
  const today = new Date(
    Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate()),
  )
  if (date.getTime() > today.getTime()) return { ok: false, reason: 'future' }
  const age = ageFromDateOfBirth(date, today)
  if (age < MIN_AGE) return { ok: false, reason: 'too_young' }
  if (age > MAX_AGE) return { ok: false, reason: 'too_old' }
  return { ok: true, date, age, iso: formatDateOnly(date) }
}
