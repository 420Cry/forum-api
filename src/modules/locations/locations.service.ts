import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { City, Country } from 'country-state-city'
import { cityToKey } from './place-key'

export type LocationSuggestion = {
  key: string
  name: string
  placeId: string | null
}

export type CatalogSearchPage<T> = {
  items: T[]
  total: number
  hasMore: boolean
}

type CityIndexRow = {
  key: string
  name: string
  search: string
  citySearch: string
  sourceId: string
}

const CACHE_TTL_MS = 30 * 60 * 1000
/** Show city dropdown from the first typed letter. */
const MIN_QUERY_LEN = 1
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50
/** Prefix bucket width for the city-name index (keeps per-keystroke work small). */
const PREFIX_BUCKET_LEN = 2

/**
 * Well-known cities shown when the query is empty so users see they can
 * type a city/country or scroll for more.
 */
const EXAMPLE_CITIES: Array<{ city: string; countryCode: string }> = [
  { city: 'San Francisco', countryCode: 'US' },
  { city: 'New York', countryCode: 'US' },
  { city: 'London', countryCode: 'GB' },
  { city: 'Berlin', countryCode: 'DE' },
  { city: 'Singapore', countryCode: 'SG' },
  { city: 'Tokyo', countryCode: 'JP' },
  { city: 'Hanoi', countryCode: 'VN' },
  { city: 'Sydney', countryCode: 'AU' },
  { city: 'Toronto', countryCode: 'CA' },
  { city: 'Dubai', countryCode: 'AE' },
]

@Injectable()
export class LocationsService implements OnModuleInit {
  private readonly logger = new Logger(LocationsService.name)
  /** Recent autocomplete picks so save can upsert without trusting only the client. */
  private readonly recent = new Map<
    string,
    { name: string; placeId: string; at: number }
  >()

  private cityIndex: CityIndexRow[] | null = null
  private sortedCityRows: CityIndexRow[] = []
  /** First 1–2 chars of city name → rows (prefix search only). */
  private prefixBuckets = new Map<string, CityIndexRow[]>()
  /** Curated empty-state suggestions resolved from the city index. */
  private exampleSuggestions: LocationSuggestion[] = []
  private indexReady: Promise<void> | null = null

  onModuleInit() {
    // Warm the index at boot so the first keystroke is not a cold scan.
    void this.ensureCityIndexAsync()
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

  rememberSuggestion(key: string, name: string, placeId: string): void {
    this.recent.set(key, { name, placeId, at: Date.now() })
  }

  private addToBucket(prefix: string, row: CityIndexRow) {
    if (!prefix) return
    const list = this.prefixBuckets.get(prefix)
    if (list) list.push(row)
    else this.prefixBuckets.set(prefix, [row])
  }

  private buildIndex(): CityIndexRow[] {
    const started = Date.now()
    const countryNames = new Map(
      Country.getAllCountries().map((c) => [c.isoCode, c.name]),
    )

    const rows: CityIndexRow[] = []
    const seen = new Set<string>()
    this.prefixBuckets = new Map()

    for (const city of City.getAllCities()) {
      const countryName = countryNames.get(city.countryCode) ?? city.countryCode
      const name = `${city.name}, ${countryName}`
      const key = cityToKey({
        name: city.name,
        countryCode: city.countryCode,
        stateCode: city.stateCode,
      })
      if (seen.has(key)) continue
      seen.add(key)
      const citySearch = city.name.toLowerCase()
      const row: CityIndexRow = {
        key,
        name,
        search: name.toLowerCase(),
        citySearch,
        sourceId: `${city.countryCode}:${city.stateCode || ''}:${city.name}`,
      }
      rows.push(row)

      // Bucket by first letter and first two letters of the city name.
      this.addToBucket(citySearch.slice(0, 1), row)
      if (citySearch.length >= PREFIX_BUCKET_LEN) {
        this.addToBucket(citySearch.slice(0, PREFIX_BUCKET_LEN), row)
      }
    }

    this.cityIndex = rows
    this.sortedCityRows = [...rows].sort((a, b) => a.name.localeCompare(b.name))

    for (const list of this.prefixBuckets.values()) {
      list.sort(
        (a, b) =>
          a.citySearch.length - b.citySearch.length ||
          a.citySearch.localeCompare(b.citySearch),
      )
    }

    this.exampleSuggestions = this.resolveExamples(rows)

    this.logger.log(
      `Loaded ${rows.length} cities for location search in ${Date.now() - started}ms`,
    )
    return rows
  }

  private resolveExamples(rows: CityIndexRow[]): LocationSuggestion[] {
    const out: LocationSuggestion[] = []
    const seen = new Set<string>()

    for (const example of EXAMPLE_CITIES) {
      const cityNeedle = example.city.toLowerCase()
      const match = rows.find((row) => {
        if (!row.sourceId.startsWith(`${example.countryCode}:`)) return false
        return (
          row.citySearch === cityNeedle ||
          row.citySearch.startsWith(`${cityNeedle} `)
        )
      })
      if (!match || seen.has(match.key)) continue
      seen.add(match.key)
      out.push({
        key: match.key,
        name: match.name,
        placeId: match.sourceId,
      })
    }

    return out
  }

  private ensureCityIndex(): CityIndexRow[] {
    if (this.cityIndex) return this.cityIndex
    return this.buildIndex()
  }

  private ensureCityIndexAsync(): Promise<void> {
    if (this.cityIndex) return Promise.resolve()
    if (!this.indexReady) {
      this.indexReady = Promise.resolve()
        .then(() => {
          this.ensureCityIndex()
        })
        .catch((err: unknown) => {
          this.indexReady = null
          this.logger.error('Failed to warm location city index', err)
        })
    }
    return this.indexReady
  }

  private rowToSuggestion(row: CityIndexRow): LocationSuggestion {
    return {
      key: row.key,
      name: row.name,
      placeId: row.sourceId,
    }
  }

  private rememberPage(items: LocationSuggestion[]) {
    for (const row of items) {
      if (row.placeId) this.rememberSuggestion(row.key, row.name, row.placeId)
    }
  }

  private clampLimit(limit?: number): number {
    const n = limit ?? DEFAULT_LIMIT
    return Math.min(MAX_LIMIT, Math.max(1, n))
  }

  private emptyStatePage(
    offset: number,
    limit: number,
  ): CatalogSearchPage<LocationSuggestion> {
    this.ensureCityIndex()
    const examples = this.exampleSuggestions
    const exampleKeys = new Set(examples.map((row) => row.key))
    const browseRows = this.sortedCityRows.filter(
      (row) => !exampleKeys.has(row.key),
    )
    const total = examples.length + browseRows.length
    const items: LocationSuggestion[] = []

    for (let i = offset; i < offset + limit && i < total; i++) {
      if (i < examples.length) {
        items.push(examples[i])
      } else {
        const row = browseRows[i - examples.length]
        items.push(this.rowToSuggestion(row))
      }
    }

    this.rememberPage(items)
    return {
      items,
      total,
      hasMore: offset + items.length < total,
    }
  }

  /**
   * Prefix match on city name only (letter-based typeahead).
   * Uses 1–2 char buckets so we never scan ~150k rows per keystroke.
   */
  private collectCityMatches(query: string): LocationSuggestion[] {
    const needle = query.toLowerCase()
    this.ensureCityIndex()

    const bucketKey =
      needle.length >= PREFIX_BUCKET_LEN
        ? needle.slice(0, PREFIX_BUCKET_LEN)
        : needle.slice(0, 1)
    const bucket = this.prefixBuckets.get(bucketKey) ?? []

    const out: LocationSuggestion[] = []
    for (const row of bucket) {
      if (!row.citySearch.startsWith(needle)) continue
      out.push(this.rowToSuggestion(row))
    }

    out.sort((a, b) => a.name.localeCompare(b.name))
    return out
  }

  /**
   * Search cities from the free country-state-city dataset.
   * Empty query → examples first, then alphabetical browse (paginated).
   * 1+ chars → prefix city matches (paginated).
   */
  search(
    q: string,
    offset = 0,
    limit = DEFAULT_LIMIT,
  ): CatalogSearchPage<LocationSuggestion> {
    const query = q.trim()
    const safeOffset = Math.max(0, offset)
    const safeLimit = this.clampLimit(limit)

    if (query.length < MIN_QUERY_LEN) {
      return this.emptyStatePage(safeOffset, safeLimit)
    }

    const matches = this.collectCityMatches(query)
    const items = matches.slice(safeOffset, safeOffset + safeLimit)
    this.rememberPage(items)
    return {
      items,
      total: matches.length,
      hasMore: safeOffset + items.length < matches.length,
    }
  }
}
