import * as dotenv from 'dotenv'

dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
})
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local', override: false })
}

import AppDataSource from './dataSource.config'
import { Tag } from 'src/modules/tags/entities/tags.entities'

export const GOAL_TAGS: { key: string; name: string }[] = [
  { key: 'raise_capital', name: 'Raise capital' },
  { key: 'find_cofounders', name: 'Find co-founders' },
  { key: 'gather_feedback', name: 'Gather feedback' },
  { key: 'build_following', name: 'Build a following' },
  { key: 'discover_startups', name: 'Discover startups' },
  { key: 'build_deal_flow', name: 'Build deal flow' },
  { key: 'network_peers', name: 'Network with peers' },
  { key: 'market_insights', name: 'Market insights' },
]

async function seed() {
  await AppDataSource.initialize()
  const repo = AppDataSource.getRepository(Tag)

  for (const tag of GOAL_TAGS) {
    await repo
      .createQueryBuilder()
      .insert()
      .into(Tag)
      .values(tag)
      .orUpdate(['name'], ['key'])
      .execute()
  }

  console.log(`Seeded ${GOAL_TAGS.length} goal tags.`)
  await AppDataSource.destroy()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
