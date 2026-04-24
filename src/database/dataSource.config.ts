import { DataSource } from 'typeorm';
import { User, UserInfo } from '../modules/users/entities';
import { TestSchema1776137074948 } from './migrations/1776137074948-test-schema';

export default new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  username: process.env.MYSQL_USERNAME || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'forum',
  synchronize: process.env.NODE_ENV !== 'production',
  entities: [User, UserInfo],
  migrations: [TestSchema1776137074948],
});
