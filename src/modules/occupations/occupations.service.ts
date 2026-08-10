import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { foldSearchText } from '../../common/fold-search-text'
import { isOtherOccupationKey } from './occupation-key'
import {
  type CatalogLocale,
  normalizeCatalogLocale,
  occupationCorpus,
  occupationLabel,
} from './occupation-i18n'

export type OccupationSuggestion = {
  key: string
  name: string
}

export type CatalogSearchPage<T> = {
  items: T[]
  total: number
  hasMore: boolean
}

type TitleIndexRow = {
  key: string
  name: string
  /** Folded localized name + English name + key for typeahead. */
  search: string
  words: string[]
}

type LocaleIndex = {
  titleIndex: TitleIndexRow[]
  sortedTitleRows: TitleIndexRow[]
  byKey: Map<string, TitleIndexRow>
  prefixBuckets: Map<string, TitleIndexRow[]>
  exampleSuggestions: OccupationSuggestion[]
}

const CACHE_TTL_MS = 30 * 60 * 1000
const MIN_QUERY_LEN = 1
const DEFAULT_LIMIT = 20
/** Corpus is ~1.3k titles — allow a full pull for client caches. */
const MAX_LIMIT = 2000
const PREFIX_BUCKET_LEN = 2

/** Empty-state examples so users see they can type a title. */
const EXAMPLE_OCCUPATION_KEYS = [
  'founder',
  'ceo',
  'cto',
  'product_manager',
  'engineer',
  'designer',
  'investor',
  'angel_investor',
  'consultant',
  'student',
] as const

@Injectable()
export class OccupationsService implements OnModuleInit {
  private readonly logger = new Logger(OccupationsService.name)
  private readonly recent = new Map<string, { name: string; at: number }>()

  private readonly indexes = new Map<CatalogLocale, LocaleIndex>()
  private indexReady: Promise<void> | null = null

  onModuleInit() {
    void this.ensureIndexesAsync()
  }

  cachedName(key: string): string | undefined {
    const entry = this.recent.get(key)
    if (!entry) return undefined
    if (Date.now() - entry.at > CACHE_TTL_MS) {
      this.recent.delete(key)
      return undefined
    }
    return entry.name
  }

  rememberSuggestion(key: string, name: string): void {
    this.recent.set(key, { name, at: Date.now() })
  }

  /** Resolve display name from the bilingual corpus (default English). */
  nameForKey(key: string, locale = 'en'): string | undefined {
    const loc = normalizeCatalogLocale(locale)
    const index = this.ensureIndex(loc)
    return index.byKey.get(key)?.name
  }

  private words(value: string): string[] {
    return foldSearchText(value)
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
  }

  private addToBucket(
    buckets: Map<string, TitleIndexRow[]>,
    prefix: string,
    row: TitleIndexRow,
  ) {
    if (!prefix) return
    const list = buckets.get(prefix)
    if (list) list.push(row)
    else buckets.set(prefix, [row])
  }

  private buildIndex(locale: CatalogLocale): LocaleIndex {
    const started = Date.now()
    const rows: TitleIndexRow[] = []
    const prefixBuckets = new Map<string, TitleIndexRow[]>()
    const byKey = new Map<string, TitleIndexRow>()

    const seen = new Set<string>()
    for (const title of occupationCorpus()) {
      if (seen.has(title.key) || isOtherOccupationKey(title.key)) continue
      seen.add(title.key)
      const name = occupationLabel(title.key, locale, title.name)
      const search = foldSearchText(`${name} ${title.name} ${title.key}`)
      const row: TitleIndexRow = {
        key: title.key,
        name,
        search,
        words: this.words(search),
      }
      rows.push(row)
      byKey.set(row.key, row)

      for (const hay of [
        foldSearchText(name),
        foldSearchText(title.name),
        foldSearchText(title.key),
      ]) {
        this.addToBucket(prefixBuckets, hay.slice(0, 1), row)
        if (hay.length >= PREFIX_BUCKET_LEN) {
          this.addToBucket(prefixBuckets, hay.slice(0, PREFIX_BUCKET_LEN), row)
        }
      }
    }

    for (const [prefix, list] of prefixBuckets) {
      const uniq = [...new Map(list.map((row) => [row.key, row])).values()]
      uniq.sort(
        (a, b) =>
          a.search.length - b.search.length || a.search.localeCompare(b.search),
      )
      prefixBuckets.set(prefix, uniq)
    }

    const sortedTitleRows = [...rows].sort((a, b) =>
      a.name.localeCompare(b.name, locale === 'vn' ? 'vi' : 'en'),
    )
    const exampleSuggestions = this.resolveExamples(byKey)

    this.logger.log(
      `Loaded ${rows.length} occupations (${locale}) in ${Date.now() - started}ms`,
    )

    return {
      titleIndex: rows,
      sortedTitleRows,
      byKey,
      prefixBuckets,
      exampleSuggestions,
    }
  }

  private resolveExamples(
    byKey: Map<string, TitleIndexRow>,
  ): OccupationSuggestion[] {
    const out: OccupationSuggestion[] = []
    const seen = new Set<string>()
    for (const key of EXAMPLE_OCCUPATION_KEYS) {
      const row = byKey.get(key)
      if (!row || seen.has(row.key)) continue
      seen.add(row.key)
      out.push({ key: row.key, name: row.name })
    }
    return out
  }

  private ensureIndex(locale: CatalogLocale): LocaleIndex {
    const existing = this.indexes.get(locale)
    if (existing) return existing
    const built = this.buildIndex(locale)
    this.indexes.set(locale, built)
    return built
  }

  private ensureIndexesAsync(): Promise<void> {
    if (this.indexes.has('en') && this.indexes.has('vn')) {
      return Promise.resolve()
    }
    if (!this.indexReady) {
      this.indexReady = Promise.resolve()
        .then(() => {
          this.ensureIndex('en')
          this.ensureIndex('vn')
        })
        .catch((err: unknown) => {
          this.indexReady = null
          this.logger.error('Failed to warm occupation title index', err)
        })
    }
    return this.indexReady
  }

  private clampLimit(limit?: number): number {
    const n = limit ?? DEFAULT_LIMIT
    return Math.min(MAX_LIMIT, Math.max(1, n))
  }

  private rememberPage(items: OccupationSuggestion[]) {
    for (const row of items) this.rememberSuggestion(row.key, row.name)
  }

  private emptyStatePage(
    offset: number,
    limit: number,
    locale: CatalogLocale,
  ): CatalogSearchPage<OccupationSuggestion> {
    const index = this.ensureIndex(locale)
    const examples = index.exampleSuggestions
    const exampleKeys = new Set(examples.map((row) => row.key))
    const browseRows = index.sortedTitleRows.filter(
      (row) => !exampleKeys.has(row.key),
    )
    const total = examples.length + browseRows.length
    const items: OccupationSuggestion[] = []

    for (let i = offset; i < offset + limit && i < total; i++) {
      if (i < examples.length) {
        items.push(examples[i])
      } else {
        const row = browseRows[i - examples.length]
        items.push({ key: row.key, name: row.name })
      }
    }

    this.rememberPage(items)
    return {
      items,
      total,
      hasMore: offset + items.length < total,
    }
  }

  private rankRow(
    row: TitleIndexRow,
    needle: string,
    tokens: string[],
  ): number {
    let rank = Number.POSITIVE_INFINITY
    if (row.search === needle || row.key === needle) rank = 0
    else if (row.search.startsWith(needle) || row.key.startsWith(needle))
      rank = 1
    else if (needle.startsWith(row.search) && row.search.length >= 2) rank = 2
    else if (row.search.includes(needle) || row.key.includes(needle)) rank = 3
    else {
      for (const token of tokens) {
        if (row.words.includes(token) || row.key === token) {
          rank = Math.min(rank, 4)
          continue
        }
        if (
          row.words.some((w) => w.startsWith(token)) ||
          row.key.startsWith(token)
        ) {
          rank = Math.min(rank, 5)
        }
      }
    }
    return rank
  }

  private collectTitleMatches(
    query: string,
    locale: CatalogLocale,
  ): OccupationSuggestion[] {
    const needle = foldSearchText(query)
    const tokens = this.words(needle)
    const index = this.ensureIndex(locale)

    const bucketKey =
      needle.length >= PREFIX_BUCKET_LEN
        ? needle.slice(0, PREFIX_BUCKET_LEN)
        : needle.slice(0, 1)
    const bucket = index.prefixBuckets.get(bucketKey) ?? []

    // Diacritic-heavy VN queries may miss prefix buckets — fall back to full scan.
    const candidates =
      bucket.length > 0 || needle.length < 1 ? bucket : index.titleIndex

    const ranked: Array<{ row: TitleIndexRow; rank: number }> = []
    for (const row of candidates.length ? candidates : index.titleIndex) {
      if (isOtherOccupationKey(row.key)) continue
      const rank = this.rankRow(row, needle, tokens)
      if (!Number.isFinite(rank)) continue
      ranked.push({ row, rank })
    }

    // If prefix bucket missed (e.g. folded VN first chars), scan all.
    if (ranked.length === 0 && needle.length >= 1) {
      for (const row of index.titleIndex) {
        if (isOtherOccupationKey(row.key)) continue
        const rank = this.rankRow(row, needle, tokens)
        if (!Number.isFinite(rank)) continue
        ranked.push({ row, rank })
      }
    }

    ranked.sort(
      (a, b) => a.rank - b.rank || a.row.search.localeCompare(b.row.search),
    )

    const out: OccupationSuggestion[] = []
    const seen = new Set<string>()
    for (const { row } of ranked) {
      if (seen.has(row.key)) continue
      seen.add(row.key)
      out.push({ key: row.key, name: row.name })
    }
    return out
  }

  /**
   * Empty query → sample titles first, then alphabetical browse (paginated).
   * 1+ chars → ranked title matches (paginated).
   */
  search(
    q: string,
    offset = 0,
    limit = DEFAULT_LIMIT,
    locale: string = 'en',
  ): CatalogSearchPage<OccupationSuggestion> {
    const loc = normalizeCatalogLocale(locale)
    const query = q.trim()
    const safeOffset = Math.max(0, offset)
    const safeLimit = this.clampLimit(limit)

    if (query.length < MIN_QUERY_LEN) {
      return this.emptyStatePage(safeOffset, safeLimit, loc)
    }

    const matches = this.collectTitleMatches(query, loc)
    const items = matches.slice(safeOffset, safeOffset + safeLimit)
    this.rememberPage(items)

    return {
      items,
      total: matches.length,
      hasMore: safeOffset + items.length < matches.length,
    }
  }
}
