import * as dotenv from 'dotenv'

dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
})
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local', override: false })
}

import AppDataSource from './dataSource.config'
import { Tag } from 'src/modules/tags/entities/tags.entities'
import { ALL_CATALOG_TAG_SEEDS } from 'src/modules/tags/catalog.seeds'

async function seed() {
  await AppDataSource.initialize()
  const repo = AppDataSource.getRepository(Tag)

  for (const tag of ALL_CATALOG_TAG_SEEDS) {
    await repo
      .createQueryBuilder()
      .insert()
      .into(Tag)
      .values(tag)
      .orUpdate(['name', 'kind'], ['key'])
      .execute()
  }

  console.log(`Seeded ${ALL_CATALOG_TAG_SEEDS.length} catalog tags.`)
  await AppDataSource.destroy()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
