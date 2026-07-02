import * as dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
});

import { DataSource } from 'typeorm';
import { User } from '../modules/users/entities';
import { Tag } from 'src/modules/tags/entities/tags.entities';
import { UserTable1782361957998 } from './migrations/1782361957998-UserTable';
import { UpdateRoleEnum1782702393426 } from './migrations/1782702393426-UpdateRoleEnum';
import { TagsJunctionCreation1782870675851 } from './migrations/1782870675851-TagsJunctionCreation';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '54322', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'postgres',
  synchronize: false,
  entities: [User, Tag],
  migrations: [
    UserTable1782361957998,
    UpdateRoleEnum1782702393426,
    TagsJunctionCreation1782870675851,
  ],
});
