import * as dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
});

import AppDataSource from './dataSource.config';
import { Tag } from 'src/modules/tags/entities/tags.entities';

export const TAGS = [
  'capital',
  'co-founders',
  'feedback',
  'following',
  'startups',
  'deal',
  'flow',
  'peers',
  'insights',
  'market',
];

async function seed() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Tag);

  for (const name of TAGS) {
    await repo
      .createQueryBuilder()
      .insert()
      .into(Tag)
      .values({ name })
      .orIgnore()
      .execute();
  }

  console.log(`Seeded ${TAGS.length} tags.`);
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
