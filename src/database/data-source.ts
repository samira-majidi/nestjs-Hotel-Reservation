import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.development') });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,

  // این دو تا رو معمولا تو محیط Production فالس می‌کنن، دقت کن!
  synchronize: process.env.DATABASE_SYNC === 'true',

  // مسیر انتیتی‌ها و مایگریشن‌ها برای زمان اجرای خارج از NestJS
  entities: ['src/**/*.entity{.ts,.js}'], // آدرس انتیتی‌هات رو اینجا دقیق کن
  migrations: ['src/database/migrations/*{.ts,.js}'], // مسیر مایگریشن‌ها
});
