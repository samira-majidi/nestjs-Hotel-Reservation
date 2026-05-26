import 'dotenv/config';
import { AppDataSource } from './data-source';

// ایمپورت کردن سیدرهای خودت
import CitySeeder from './seeders/city-seeder';
import AmenitySeeder from './seeders/amitity-seeder';
import { UserSeeder } from './seeders/user-seeder';
import HotelSeeder from './seeders/hotel-seeder';
import RoomSeeder from './seeders/room-seeder';

async function bootstrap() {
  try {
    // ۱. اتصال به دیتابیس
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully!');

    // ۲. اجرای سیدرها به ترتیب دلخواه
    console.log('🌱 Starting database seeding...');

    const citySeeder = new CitySeeder();
    await citySeeder.run(AppDataSource);
    console.log('✔️ CitySeeder completed');

    const amenitySeeder = new AmenitySeeder();
    await amenitySeeder.run(AppDataSource);
    console.log('✔️ AmenitySeeder completed');

    const userSeeder = new UserSeeder();
    await userSeeder.run(AppDataSource);
    console.log('✔️ UserSeeder completed');

    const hotelSeeder = new HotelSeeder();
    await hotelSeeder.run(AppDataSource);
    console.log('✔️ HotelSeeder completed');

    const roomSeeder = new RoomSeeder();
    await roomSeeder.run(AppDataSource);
    console.log('✔️ RoomSeeder completed');

    console.log('🎉 All seeds completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    process.exit(1);
  }
}
bootstrap().catch((error) => {
  console.error('❌ Unhandled error during bootstrap:', error);
  process.exit(1);
});
