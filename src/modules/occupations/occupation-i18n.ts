import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export type CatalogLocale = 'en' | 'vn'

type Bilingual = Record<string, { en: string; vn: string }>

const ROLES = [
  'product_manager',
  'sales_lead',
  'analyst',
  'architect',
  'consultant',
  'designer',
  'director',
  'engineer',
  'lead',
  'manager',
  'marketer',
  'operator',
  'researcher',
  'scientist',
  'specialist',
] as const

const SENIORITIES = [
  'associate',
  'junior',
  'lead',
  'principal',
  'senior',
] as const

function resolveI18nFile(name: string): string {
  const candidates = [
    join(__dirname, 'i18n', name),
    join(process.cwd(), 'src/modules/occupations/i18n', name),
    join(process.cwd(), 'dist/modules/occupations/i18n', name),
  ]
  for (const path of candidates) {
    if (existsSync(path)) return path
  }
  throw new Error(
    `Occupation i18n file not found: ${name} (tried ${candidates.join(', ')})`,
  )
}

function readBilingual(name: string): Bilingual {
  return JSON.parse(readFileSync(resolveI18nFile(name), 'utf8')) as Bilingual
}

const occupations = readBilingual('occupations.json')
const domains = readBilingual('occupation-domains.json')
const roles = readBilingual('occupation-roles.json')
const seniority = readBilingual('occupation-seniority.json')

export function normalizeCatalogLocale(
  value: string | undefined | null,
): CatalogLocale {
  return value === 'vn' ? 'vn' : 'en'
}

function pick(
  map: Bilingual,
  key: string,
  locale: CatalogLocale,
): string | undefined {
  const row = map[key]
  if (!row) return undefined
  return row[locale] || row.en
}

function stripSeniority(key: string): { sen: string | null; rest: string } {
  for (const s of SENIORITIES) {
    if (key.startsWith(`${s}_`))
      return { sen: s, rest: key.slice(s.length + 1) }
  }
  return { sen: null, rest: key }
}

function stripRole(key: string): { domain: string; role: string } | null {
  for (const r of [...ROLES].sort((a, b) => b.length - a.length)) {
    if (key.endsWith(`_${r}`)) {
      return { role: r, domain: key.slice(0, -(r.length + 1)) }
    }
  }
  return null
}

/**
 * Localized occupation label. Prefers exact bilingual JSON, then composes
 * domain/role/seniority. VN uses role-first ("Kỹ sư AI").
 */
export function occupationLabel(
  key: string,
  locale: CatalogLocale,
  fallback?: string,
): string {
  const exact = pick(occupations, key, locale)
  if (exact) return exact

  const roleFirst = locale === 'vn'
  const { sen, rest } = stripSeniority(key)
  if (sen) {
    const restLabel = occupationLabel(rest, locale, '')
    const senLabel = pick(seniority, sen, locale)
    if (restLabel && senLabel) {
      return roleFirst ? `${restLabel} ${senLabel}` : `${senLabel} ${restLabel}`
    }
  }

  const parts = stripRole(key)
  if (parts) {
    const domainLabel = pick(domains, parts.domain, locale)
    const roleLabel = pick(roles, parts.role, locale)
    if (domainLabel && roleLabel) {
      return roleFirst
        ? `${roleLabel} ${domainLabel}`
        : `${domainLabel} ${roleLabel}`
    }
  }

  return fallback ?? pick(occupations, key, 'en') ?? key
}

/** English corpus rows derived from bilingual occupations.json (source of truth). */
export function occupationCorpus(): Array<{ key: string; name: string }> {
  return Object.entries(occupations)
    .map(([key, row]) => ({ key, name: row.en }))
    .sort((a, b) => a.key.localeCompare(b.key))
}

export function occupationEnglishName(key: string): string | undefined {
  return pick(occupations, key, 'en')
}
