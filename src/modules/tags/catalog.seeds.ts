export type TagKind = 'goal' | 'location' | 'occupation' | 'industry'

export type CatalogTagSeed = {
  kind: TagKind
  key: string
  name: string
}

/** Goal tags (existing product copy). */
export const GOAL_TAG_SEEDS: CatalogTagSeed[] = [
  { kind: 'goal', key: 'raise_capital', name: 'Raise capital' },
  { kind: 'goal', key: 'find_cofounders', name: 'Find co-founders' },
  { kind: 'goal', key: 'gather_feedback', name: 'Gather feedback' },
  { kind: 'goal', key: 'build_following', name: 'Build a following' },
  { kind: 'goal', key: 'discover_startups', name: 'Discover startups' },
  { kind: 'goal', key: 'build_deal_flow', name: 'Build deal flow' },
  { kind: 'goal', key: 'network_peers', name: 'Network with peers' },
  { kind: 'goal', key: 'market_insights', name: 'Market insights' },
]

/** Fixed location options only; cities come from city search + upsert on save. */
export const LOCATION_TAG_SEEDS: CatalogTagSeed[] = [
  { kind: 'location', key: 'remote', name: 'Remote' },
  { kind: 'location', key: 'location_other', name: 'Other' },
]

export const OCCUPATION_TAG_SEEDS: CatalogTagSeed[] = [
  { kind: 'occupation', key: 'occupation_other', name: 'Other' },
]

export const INDUSTRY_TAG_SEEDS: CatalogTagSeed[] = [
  { kind: 'industry', key: 'ai_ml', name: 'AI / ML' },
  { kind: 'industry', key: 'climate', name: 'Climate' },
  { kind: 'industry', key: 'fintech', name: 'Fintech' },
  { kind: 'industry', key: 'healthtech', name: 'Healthtech' },
  { kind: 'industry', key: 'edtech', name: 'Edtech' },
  { kind: 'industry', key: 'saas', name: 'SaaS' },
  { kind: 'industry', key: 'marketplace', name: 'Marketplace' },
  { kind: 'industry', key: 'consumer', name: 'Consumer' },
  { kind: 'industry', key: 'enterprise', name: 'Enterprise' },
  { kind: 'industry', key: 'biotech', name: 'Biotech' },
  { kind: 'industry', key: 'mobility', name: 'Mobility' },
  { kind: 'industry', key: 'foodtech', name: 'Foodtech' },
  { kind: 'industry', key: 'industry_other', name: 'Other' },
]

export const ALL_CATALOG_TAG_SEEDS: CatalogTagSeed[] = [
  ...GOAL_TAG_SEEDS,
  ...LOCATION_TAG_SEEDS,
  ...OCCUPATION_TAG_SEEDS,
  ...INDUSTRY_TAG_SEEDS,
]

export const TAG_KINDS: TagKind[] = [
  'goal',
  'location',
  'occupation',
  'industry',
]

export function isTagKind(value: string): value is TagKind {
  return (TAG_KINDS as string[]).includes(value)
}
