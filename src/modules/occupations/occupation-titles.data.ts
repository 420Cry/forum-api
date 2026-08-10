import type { OccupationTitle } from './occupation-key'
import { occupationCorpus } from './occupation-i18n'

/**
 * @deprecated Prefer `occupationCorpus()` / bilingual JSON under `./i18n/`.
 * Kept as a named export for any leftover imports.
 */
export const OCCUPATION_TITLES: OccupationTitle[] = occupationCorpus()
