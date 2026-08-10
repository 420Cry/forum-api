import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import {
  FIXED_OCCUPATION_OPTIONS,
  isOtherOccupationKey,
  type OccupationTitle,
} from './occupation-key'
import { OCCUPATION_TITLES } from './occupation-titles.data'

export type OccupationSuggestion = {
  key: string
  name: string
}

type TitleIndexRow = {
  key: string
  name: string
  search: string
  words: string[]
}

const CACHE_TTL_MS = 30 * 60 * 1000
const MIN_QUERY_LEN = 1
const MAX_RESULTS = 15
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

  private titleIndex: TitleIndexRow[] | null = null
  private byKey = new Map<string, TitleIndexRow>()
  private prefixBuckets = new Map<string, TitleIndexRow[]>()
  private exampleSuggestions: OccupationSuggestion[] = []
  private indexReady: Promise<void> | null = null

  onModuleInit() {
    void this.ensureTitleIndexAsync()
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

  /** Resolve display name from the in-memory corpus (if present). */
  nameForKey(key: string): string | undefined {
    this.ensureTitleIndex()
    return this.byKey.get(key)?.name
  }

  private words(value: string): string[] {
    return value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
  }

  private pinOtherLast(rows: OccupationSuggestion[]): OccupationSuggestion[] {
    const rest: OccupationSuggestion[] = []
    const others: OccupationSuggestion[] = []
    for (const row of rows) {
      if (isOtherOccupationKey(row.key)) others.push(row)
      else rest.push(row)
    }
    return [...rest, ...others]
  }

  private matchingFixed(q: string): OccupationSuggestion[] {
    const needle = q.trim().toLowerCase()
    if (!needle) return [...FIXED_OCCUPATION_OPTIONS]
    return FIXED_OCCUPATION_OPTIONS.filter(
      (opt) =>
        opt.key.includes(needle) || opt.name.toLowerCase().includes(needle),
    )
  }

  private addToBucket(prefix: string, row: TitleIndexRow) {
    if (!prefix) return
    const list = this.prefixBuckets.get(prefix)
    if (list) list.push(row)
    else this.prefixBuckets.set(prefix, [row])
  }

  private buildIndex(): TitleIndexRow[] {
    const started = Date.now()
    const rows: TitleIndexRow[] = []
    this.prefixBuckets = new Map()
    this.byKey = new Map()

    const seen = new Set<string>()
    const corpus: OccupationTitle[] = [
      ...OCCUPATION_TITLES,
      ...FIXED_OCCUPATION_OPTIONS,
    ]

    for (const title of corpus) {
      if (seen.has(title.key)) continue
      seen.add(title.key)
      const search = title.name.toLowerCase()
      const row: TitleIndexRow = {
        key: title.key,
        name: title.name,
        search,
        words: this.words(title.name),
      }
      rows.push(row)
      this.byKey.set(row.key, row)

      const keySearch = title.key.toLowerCase()
      for (const hay of [search, keySearch]) {
        this.addToBucket(hay.slice(0, 1), row)
        if (hay.length >= PREFIX_BUCKET_LEN) {
          this.addToBucket(hay.slice(0, PREFIX_BUCKET_LEN), row)
        }
      }
    }

    for (const [prefix, list] of this.prefixBuckets) {
      const uniq = [...new Map(list.map((row) => [row.key, row])).values()]
      uniq.sort(
        (a, b) =>
          a.search.length - b.search.length || a.search.localeCompare(b.search),
      )
      this.prefixBuckets.set(prefix, uniq)
    }

    this.titleIndex = rows
    this.exampleSuggestions = this.resolveExamples()

    this.logger.log(
      `Loaded ${rows.length} occupations for search in ${Date.now() - started}ms`,
    )
    return rows
  }

  private resolveExamples(): OccupationSuggestion[] {
    const out: OccupationSuggestion[] = []
    const seen = new Set<string>()
    for (const key of EXAMPLE_OCCUPATION_KEYS) {
      const row = this.byKey.get(key)
      if (!row || seen.has(row.key)) continue
      seen.add(row.key)
      out.push({ key: row.key, name: row.name })
    }
    return out
  }

  private ensureTitleIndex(): TitleIndexRow[] {
    if (this.titleIndex) return this.titleIndex
    return this.buildIndex()
  }

  private ensureTitleIndexAsync(): Promise<void> {
    if (this.titleIndex) return Promise.resolve()
    if (!this.indexReady) {
      this.indexReady = Promise.resolve()
        .then(() => {
          this.ensureTitleIndex()
        })
        .catch((err: unknown) => {
          this.indexReady = null
          this.logger.error('Failed to warm occupation title index', err)
        })
    }
    return this.indexReady
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

  private searchTitles(query: string): OccupationSuggestion[] {
    const needle = query.toLowerCase()
    const tokens = this.words(needle)
    this.ensureTitleIndex()

    const bucketKey =
      needle.length >= PREFIX_BUCKET_LEN
        ? needle.slice(0, PREFIX_BUCKET_LEN)
        : needle.slice(0, 1)
    const bucket = this.prefixBuckets.get(bucketKey) ?? []

    const ranked: Array<{ row: TitleIndexRow; rank: number }> = []
    for (const row of bucket) {
      if (isOtherOccupationKey(row.key)) continue
      const rank = this.rankRow(row, needle, tokens)
      if (!Number.isFinite(rank)) continue
      ranked.push({ row, rank })
    }

    ranked.sort(
      (a, b) => a.rank - b.rank || a.row.search.localeCompare(b.row.search),
    )

    const out: OccupationSuggestion[] = []
    for (const { row } of ranked) {
      out.push({ key: row.key, name: row.name })
      if (out.length >= MAX_RESULTS) break
    }

    for (const row of out) this.rememberSuggestion(row.key, row.name)
    return out
  }

  /**
   * Empty query → sample titles + Other.
   * 1+ chars → ranked title matches + Other when it matches (always pin Other last).
   */
  search(q: string): OccupationSuggestion[] {
    const query = q.trim()
    const fixed = this.matchingFixed(query)

    if (query.length < MIN_QUERY_LEN) {
      this.ensureTitleIndex()
      const examples = this.exampleSuggestions
      for (const row of examples) this.rememberSuggestion(row.key, row.name)
      return this.pinOtherLast([...examples, ...fixed])
    }

    const titles = this.searchTitles(query)
    const seen = new Set<string>()
    const merged: OccupationSuggestion[] = []
    for (const row of titles) {
      if (seen.has(row.key)) continue
      seen.add(row.key)
      merged.push(row)
    }
    for (const row of fixed) {
      if (seen.has(row.key)) continue
      seen.add(row.key)
      merged.push(row)
    }
    return this.pinOtherLast(merged)
  }
}
