import * as dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
});

import { DataSource } from 'typeorm';
import { User, UserInfo } from '../modules/users/entities';
import { TestSchema1776137074948 } from './migrations/1776137074948-test-schema';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'forum',
  synchronize: process.env.NODE_ENV !== 'production',
  entities: [User, UserInfo],
  migrations: [TestSchema1776137074948],
});
