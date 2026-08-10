import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { City, Country } from 'country-state-city'
import { cityToKey, FIXED_LOCATION_OPTIONS } from './place-key'

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
  /** Lowercased country name → cities in that country. */
  private countryBuckets = new Map<string, CityIndexRow[]>()
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

  /** Resolve display name from fixed options or the city index. */
  nameForKey(key: string): string | undefined {
    const fixed = FIXED_LOCATION_OPTIONS.find((row) => row.key === key)
    if (fixed) return fixed.name
    this.ensureCityIndex()
    return this.sortedCityRows.find((row) => row.key === key)?.name
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
    this.countryBuckets = new Map()

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

      const countryKey = countryName.toLowerCase()
      const countryList = this.countryBuckets.get(countryKey)
      if (countryList) countryList.push(row)
      else this.countryBuckets.set(countryKey, [row])
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
    for (const list of this.countryBuckets.values()) {
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

  private fixedMatches(needle: string): LocationSuggestion[] {
    const q = needle.trim().toLowerCase()
    return FIXED_LOCATION_OPTIONS.filter((row) => {
      if (!q) return true
      return (
        row.key.includes(q) ||
        row.name.toLowerCase().startsWith(q) ||
        row.name.toLowerCase().includes(q)
      )
    }).map((row) => ({ key: row.key, name: row.name, placeId: null }))
  }

  private emptyStatePage(
    offset: number,
    limit: number,
  ): CatalogSearchPage<LocationSuggestion> {
    this.ensureCityIndex()
    const fixed = this.fixedMatches('')
    const examples = this.exampleSuggestions
    const exampleKeys = new Set(examples.map((row) => row.key))
    const browseRows = this.sortedCityRows.filter(
      (row) => !exampleKeys.has(row.key),
    )
    const head = [...fixed, ...examples]
    const total = head.length + browseRows.length
    const items: LocationSuggestion[] = []

    for (let i = offset; i < offset + limit && i < total; i++) {
      if (i < head.length) {
        items.push(head[i])
      } else {
        const row = browseRows[i - head.length]
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
   * Prefix match on city name, plus country-name matches and fixed Remote/Other.
   * City lookup uses 1–2 char buckets so we never scan ~150k rows per keystroke.
   */
  private collectCityMatches(query: string): LocationSuggestion[] {
    const needle = query.toLowerCase()
    this.ensureCityIndex()

    const bucketKey =
      needle.length >= PREFIX_BUCKET_LEN
        ? needle.slice(0, PREFIX_BUCKET_LEN)
        : needle.slice(0, 1)
    const bucket = this.prefixBuckets.get(bucketKey) ?? []

    const out: LocationSuggestion[] = [...this.fixedMatches(needle)]
    const seen = new Set(out.map((row) => row.key))

    for (const row of bucket) {
      if (!row.citySearch.startsWith(needle) || seen.has(row.key)) continue
      seen.add(row.key)
      out.push(this.rowToSuggestion(row))
    }

    // Country-name typeahead (e.g. "Viet" → Vietnamese cities).
    if (needle.length >= 2) {
      for (const [country, rows] of this.countryBuckets) {
        if (!country.startsWith(needle) && !country.includes(needle)) continue
        for (const row of rows) {
          if (seen.has(row.key)) continue
          seen.add(row.key)
          out.push(this.rowToSuggestion(row))
          if (out.length >= MAX_LIMIT * 20) break
        }
        if (out.length >= MAX_LIMIT * 20) break
      }
    }

    out.sort((a, b) => {
      const aFixed = a.placeId == null ? 0 : 1
      const bFixed = b.placeId == null ? 0 : 1
      return aFixed - bFixed || a.name.localeCompare(b.name)
    })
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
