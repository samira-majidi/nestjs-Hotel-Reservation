import { DataSource } from 'typeorm';
import { Room } from '#src/rooms/entity/room.entity';
import { Hotel } from '#src/hotels/entities/hotel.entity';
import { Upload } from '#src/common/upload/entity/upload.entity';
import { User } from '#src/users/user.entity';
import { RoomStatus } from '#src/rooms/enums/room-status.enum';
import { RoomType } from '#src/rooms/enums/room-type.enum';

export default class RoomSeeder {
  public async run(dataSource: DataSource): Promise<any> {
    const hotelRepository = dataSource.getRepository(Hotel);
    const roomRepository = dataSource.getRepository(Room);
    const uploadRepository = dataSource.getRepository(Upload);
    const userRepository = dataSource.getRepository(User);

    const count = await roomRepository.count();
    if (count > 0) {
      console.log('✨ Rooms already exist. Skipping seeding...');
      return;
    }

    const hotels = await hotelRepository.find();
    if (hotels.length === 0) {
      console.error('❌ Please seed Hotels first!');
      return;
    }

    // 👈 پیدا کردن داینامیک کاربر
    const hostUser = await userRepository.findOne({
      where: { email: 'samiramajidi@gmail.com' },
    });
    if (!hostUser) {
      console.error('❌ Please seed Users first!');
      return;
    }

    console.log('🖼️ Registering room images in Upload table...');

    // لیست دقیق لینک‌هایی که درخواست دادی
    const rawImageUrls = [
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-zachtheshoota-1838640-1779550041441-16f8cbb4-56b7-450d-9f3e-b6eb66f1aac2.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-zachtheshoota-1838640-1779550041441-16f8cbb4-56b7-450d-9f3e-b6eb66f1aac2-1779550140175-5f5fe9f8-0eec-44d4-b91a-805df7a53bb6.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-asphotography-97083-1779550896983-6836a7a1-32e8-4d9a-9876-bcf88e44a177.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-enginakyurt-2736384-1779551026777-f237d004-5d39-42d8-9175-1fb96503abc4.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-enginakyurt-2736388-1779551091173-2f29b944-da82-48e8-b0fd-efad55d00d19.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-enginakyurt-2725675-1779551148346-fb8d845e-bb18-4507-b6a2-5da3b266d591.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-pixabay-279746-1779551192080-aadbb929-1cdb-49d2-b48e-97767a872003.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-curtis-adams-1694007-3555618-1779551234819-4d226f90-6dd8-4a32-ae55-b2b98bd5d58c.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-michaelgaultphotos-10450052-1779551309122-c5f6a101-bd8d-43a9-9036-f70b841c1528.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-curtis-adams-1694007-3555619-1779551431201-3176a42f-c071-4b2d-8fa3-95427e8db978.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-optical-chemist-340351297-36583428-1779551483903-561478af-7d4a-45f3-b152-7c022141cafe.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-mographe-34672504-1779554539320-88038f50-3f1a-41f0-9d6c-071f2cc208fc.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-mographe-34769922-1779554584169-7b4f30c5-d712-4fe3-90ea-4e455ac6aa30.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-mographe-34769922-1779554689136-86e80af2-abc2-473a-aaa4-d67cae5abf8e.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-pabloramon-18077191-1779554755042-f4b275f7-2276-4132-8491-89c218b8df7b.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-chrislyn-dsouza-424969149-34496702-1779554834341-0fe83b75-5cfc-4dc7-8f4f-3c37a3e5258f.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-chrislyn-dsouza-424969149-34496701-1779554875078-bdd940c3-5a08-411e-a2b6-4377466c1e0c.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-chrislyn-dsouza-424969149-34496715-1779554961712-2bb0326f-1f56-441d-9bec-49f3c248d96f.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-mographe-18884372-1779555710308-30769177-2e95-481c-8c78-0b545930f7e9.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-artbovich-7746571-1779555923687-36a161d5-7f7c-4f42-be43-6eec4cdf4677.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-artbovich-7746573-1779555956621-b5c743f6-3a4a-4a26-9d98-a4aeb251061b.jpg',
    ];

    // به هم ریختن آرایه تا عکس‌ها رندم باشن
    const shuffledUrls = rawImageUrls.sort(() => 0.5 - Math.random());
    const savedUploads: Upload[] = [];

    // ذخیره عکس‌ها در دیتابیس
    for (const url of shuffledUrls) {
      const filename = url.substring(url.lastIndexOf('/') + 1);
      const isPng = url.toLowerCase().endsWith('.png');

      const uploaderId = hostUser.id; // 👈 دیگه هاردکد نیست! از یوزر می‌گیره

      const uploadEntity = uploadRepository.create({
        path: url,
        name: filename,
        mime: isPng ? 'image/png' : 'image/jpeg',
        size: Math.floor(Math.random() * (5000000 - 100000) + 100000),
        uploadedById: uploaderId,
      });

      const saved = await uploadRepository.save(uploadEntity);
      savedUploads.push(saved);
    }

    console.log('🛏️ Seeding rooms...');
    const roomsData: Room[] = [];
    let imageIndex = 0;

    // برای هر هتل دقیقا 2 تا اتاق می‌سازیم
    for (const hotel of hotels) {
      for (let i = 1; i <= 2; i++) {
        // برداشتن یک عکس از لیست آپلودها
        const roomImage = savedUploads[imageIndex % savedUploads.length];
        imageIndex++;

        const room = roomRepository.create({
          hotelId: hotel.id,
          roomNumber: `${hotel.id}-${100 + i}`,
          type: Object.values(RoomType)[
            i % Object.values(RoomType).length
          ] as RoomType,
          basePrice: i === 1 ? 120 : 220,
          capacity: i === 1 ? 2 : 4,
          floor: 1,
          status: RoomStatus.AVAILABLE,
          description:
            i === 1
              ? 'A lovely standard room perfect for couples, featuring a comfortable bed and great amenities.'
              : 'A spacious family suite with beautiful views, high-speed Wi-Fi, and premium room service.',
          galleryImages: [roomImage],
        });

        roomsData.push(room);
      }
    }

    // ذخیره اتاق‌ها در دیتابیس
    await roomRepository.save(roomsData);

    // تو کنسول لاگ بک‌تیک‌های TS رو گذاشتم بمونه ولی برای خروجی تمیزتر یه دستی به سر و روش کشیدم
    console.log(
      `✅ Successfully seeded ${roomsData.length} rooms for ${hotels.length} hotels!`,
    );
  }
}
