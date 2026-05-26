import { DataSource } from 'typeorm';
import { Hotel } from '#src/hotels/entities/hotel.entity'; // مسیرها رو با پروژه خودت چک کن
import { City } from '#src/city/entities/city.entity';
import { Amenity } from '#src/amenity/entity/amenity.entity';
import { Upload } from '#src/common/upload/entity/upload.entity';
import { User } from '#src/users/user.entity'; // 👈 ایمپورت اضافه شده (مسیر رو چک کن)

export default class HotelSeeder {
  public async run(dataSource: DataSource): Promise<any> {
    const hotelRepository = dataSource.getRepository(Hotel);
    const cityRepository = dataSource.getRepository(City);
    const amenityRepository = dataSource.getRepository(Amenity);
    const uploadRepository = dataSource.getRepository(Upload);
    const userRepository = dataSource.getRepository(User); // 👈 ریپازیتوری یوزر اضافه شد

    // بررسی اینکه آیا قبلا هتل ساخته شده یا نه
    const count = await hotelRepository.count();
    if (count > 0) {
      console.log('✨ Hotels already exist. Skipping seeding...');
      return;
    }

    // دریافت شهرها و امکانات (فرض بر این است که اینها قبلا سید شده‌اند)
    const cities = await cityRepository.find();
    const amenities = await amenityRepository.find();

    if (cities.length === 0 || amenities.length === 0) {
      console.error('❌ Please seed Cities and Amenities first!');
      return;
    }

    // 👈 پیدا کردن داینامیک کاربر برای مالک هتل
    const hostUser = await userRepository.findOne({
      where: { email: 'samiramajidi@gmail.com' },
    });
    if (!hostUser) {
      console.error('❌ Please seed Users first!');
      return;
    }

    // ----------------------------------------------------------------------
    // مرحله ۱: ثبت ۴۱ لینک عکس در جدول Upload (در صورت عدم وجود)
    // ----------------------------------------------------------------------
    const imageUrls = [
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/67014205-dae9-4143-b7f0-13c6353b2471-1779549869098-17ae7f0e-96e7-44d2-a225-bd5f9e0d6d75.png',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-zachtheshoota-1838640-1779550041441-16f8cbb4-56b7-450d-9f3e-b6eb66f1aac2.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-zachtheshoota-1838640-1779550041441-16f8cbb4-56b7-450d-9f3e-b6eb66f1aac2-1779550140175-5f5fe9f8-0eec-44d4-b91a-805df7a53bb6.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-slrajeti-36970800-1779550390404-9ddefbde-2162-4d8e-8c62-73962ac81469.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-bertellifotografia-16985115-1779550563020-14820584-9c7f-4b92-ba80-0746b35f621d.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-denis-mustafaev-143461191-33791950-1779550638994-dac331fa-c212-417b-bf14-7eb0843a2710.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-abedalbaset-12286877-1779550788105-54d0c855-a2f5-47a0-8f2d-a6741ee91452.jpg',
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
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-bouragaa-30130840-1779555004814-f15361b4-94cf-452d-a43e-377a2ff64c4b.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-jdgromov-7974836-1779555043682-18884eb9-a645-4169-adc3-4df2477b92a6.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-mographe-15531226-1779555119908-b56f9b3b-fb8d-4282-9cd9-91bf30e8afab.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-bouragaa-30130845-1779555153766-b4c732b2-75cd-4671-9811-4caba2e72f00.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-taryn-elliott-4502973-1779555189709-bcc8449b-2dd7-4b85-af78-839532b54534.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-lahbabi-7391720-1779555397979-dc93fcee-8195-45ef-b534-eefc634cd80e.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-mographe-34936236-1779555455466-8ff5447d-466b-44e2-86f4-476a12d77ccb.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-iwashere-18320915-1779555564927-f17c5c9d-e28a-42de-98bc-1c1b12223120.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-mographe-34936237-1779555630839-a0e9733f-c96a-4781-8528-95e1f76e0055.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-mographe-34940617-1779555679285-1c285b42-46e8-4e99-80da-c3f5a8547819.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-mographe-18884372-1779555710308-30769177-2e95-481c-8c78-0b545930f7e9.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-jayko-jpg-47826620-17460090-1779555788734-ab807adb-f374-4453-beff-987adc487105.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-ian-panelo-33875339-1779555844071-5acbb2bc-4699-4ac1-9cc5-f9a1c1b3b8cc.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-artbovich-7746571-1779555923687-36a161d5-7f7c-4f42-be43-6eec4cdf4677.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-artbovich-7746573-1779555956621-b5c743f6-3a4a-4a26-9d98-a4aeb251061b.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-pavel-danilyuk-9119736-1779556030474-e0ed62ed-337e-4646-b014-e1b037808be3.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-pavel-danilyuk-9119736-1779556060670-828c6a7e-df4a-4452-90ba-27f1a331bca0.jpg',
      'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/pexels-navlakha-33803745-1779556101760-f888a273-7c10-444e-939b-3a5fcfa56144.jpg',
    ];

    const savedUploads: Upload[] = [];

    const uploader = await userRepository.findOne({ where: {} }); // اولین کاربر موجود رو میگیره

    if (!uploader) {
      throw new Error(
        '❌ هیچ کاربری در دیتابیس پیدا نشد! لطفا اول UserSeeder را بررسی کنید.',
      );
    }
    // ساختن و ذخیره عکس‌ها در جدول آپلود یکی‌یکی (Sequential) اجرا می‌شن.
    console.log('📸 Seeding uploads...');
    for (const url of imageUrls) {
      const fileName = url.split('/').pop() || 'default-image.png';

      // 💡 استخراج پسوند فایل برای ساختن Mime Type حدودی
      const ext = fileName.split('.').pop()?.toLowerCase() || 'png';
      const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

      let upload = await uploadRepository.findOne({ where: { path: url } });
      if (!upload) {
        const newUpload = uploadRepository.create({
          path: url,
          name: fileName,
          mime: mimeType, // ✅ فرمت فایل (مثلا image/png)
          size: 2048,
          uploadedBy: uploader, // ✅ حجم فرضی فایل به بایت (برای جلوگیری از ارور احتمالی بعدی)
        });
        upload = await uploadRepository.save(newUpload);
      }
      savedUploads.push(upload);
    }
    // ----------------------------------------------------------------------
    // مرحله ۲: آماده‌سازی دیتای هتل‌ها و اختصاص عکس‌های ذخیره شده
    // ----------------------------------------------------------------------

    const tehran = cities.find((c) => c.name === 'Tehran');
    const mashhad = cities.find((c) => c.name === 'Mashhad');
    const isfahan = cities.find((c) => c.name === 'Isfahan');
    const shiraz = cities.find((c) => c.name === 'Shiraz');
    const kish = cities.find((c) => c.name === 'Kish');
    const tabriz = cities.find((c) => c.name === 'Tabriz');

    const getRandomAmenities = (count: number) => {
      const shuffled = amenities.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };

    // مپینگ دقیق بر اساس ایندکس عکس‌ها (اعداد 1 تا 41 که گفتید)
    // توجه: چون ایندکس آرایه از 0 شروع میشه، عدد 1 یعنی savedUploads[0]
    const imageMap: Record<number, number[]> = {
      1: [1, 5, 28],
      2: [24, 27],
      3: [30, 32, 33],
      4: [36, 39],
      5: [35, 41],
      6: [29, 26],
      7: [7, 2],
      8: [4, 33],
      9: [6, 27],
      10: [35, 40],
    };

    // تابع برای گرفتن آبجکت‌های Upload بر اساس مپینگ
    const getImages = (hotelIndex: number): Upload[] => {
      const imageNumbers: number[] = imageMap[hotelIndex] || [];
      return (
        imageNumbers
          .map((num: number) => savedUploads[num - 1])
          // ۳. این بخش جادویی! به تایپ‌اسکریپت می‌فهمونیم که مقادیر undefined فیلتر شدن و خروجی قطعا از نوع Upload (یا هر تایپ اکید دیگه‌ای) هست
          .filter((img): img is Upload => img !== undefined)
      );
    };

    const ownerId = hostUser.id; // 👈 دیگه هاردکد نیست! از آیدی کاربری که پیدا کردیم استفاده می‌کنه

    const hotelsData = [
      {
        name: 'Espinas Palace Hotel', // Hotel 1 - Tehran
        cityId: tehran?.id || 1,
        phone: '+98 21 75675000',
        address: 'Behroud Sq, Saadat Abad, Tehran, Iran',
        stars: 5,
        description:
          'Espinas Palace is a true luxury hotel situated in the upscale Saadat Abad neighborhood of Tehran. Boasting breathtaking views of the city and the Alborz mountains.',
        ownerId,
        amenities: getRandomAmenities(8),
        galleryImages: getImages(1), // می‌ره عکس‌های ۱، ۵، و ۲۸ رو برمی‌داره
      },
      {
        name: 'Parsian Azadi Hotel', // Hotel 2 - Tehran
        cityId: tehran?.id || 1,
        phone: '+98 21 29505000',
        address:
          'Intersection of Yadegar-e-Emam and Chamran Highway, Tehran, Iran',
        stars: 5,
        description:
          'Formerly the Hyatt Hotel, Parsian Azadi is one of the largest and tallest international hotels in Iran.',
        ownerId,
        amenities: getRandomAmenities(7),
        galleryImages: getImages(2),
      },
      {
        name: 'Novotel Tehran Airport', // Hotel 3 - Tehran
        cityId: tehran?.id || 1,
        phone: '+98 21 55677900',
        address: 'Persian Gulf Highway, Opposite IKA Terminal, Tehran, Iran',
        stars: 4,
        description:
          'Located directly opposite the Imam Khomeini International Airport (IKA) main terminal, this modern hotel is highly convenient.',
        ownerId,
        amenities: getRandomAmenities(6),
        galleryImages: getImages(3),
      },
      {
        name: 'Darvishi Royal Hotel', // Hotel 4 - Mashhad
        cityId: mashhad?.id || 1,
        phone: '+98 51 38080',
        address: 'Imam Reza Blvd, Mashhad, Iran',
        stars: 5,
        description:
          'The Darvishi Royal Hotel is the highest atrium hotel in eastern Iran, located just a short walk from the Holy Shrine of Imam Reza.',
        ownerId,
        amenities: getRandomAmenities(10),
        galleryImages: getImages(4),
      },
      {
        name: 'Ghasr Talaee International Hotel', // Hotel 5 - Mashhad
        cityId: mashhad?.id || 1,
        phone: '+98 51 38038',
        address: 'Imam Reza Street, Mashhad, Iran',
        stars: 5,
        description:
          'Known as the Golden Palace, this grand hotel is renowned for its architectural majesty and luxurious comfort.',
        ownerId,
        amenities: getRandomAmenities(8),
        galleryImages: getImages(5),
      },
      {
        name: 'Abbasi Hotel', // Hotel 6 - Isfahan
        cityId: isfahan?.id || 1,
        phone: '+98 31 32226010',
        address: 'Amadegah St, Isfahan, Iran',
        stars: 5,
        description:
          'Often described as the most beautiful hotel in the Middle East, the Abbasi Hotel is a 300-year-old caravanserai built during the Safavid era.',
        ownerId,
        amenities: getRandomAmenities(9),
        galleryImages: getImages(6),
      },
      {
        name: 'Kowsar Hotel', // Hotel 7 - Isfahan
        cityId: isfahan?.id || 1,
        phone: '+98 31 32202070',
        address: 'Mellat Blvd, Next to Si-o-Se-Pol Bridge, Isfahan, Iran',
        stars: 4,
        description:
          'Overlooking the historic Si-o-Se-Pol bridge and the Zayandeh Rud river, Parsian Kowsar Hotel offers a perfect blend of modern amenities.',
        ownerId,
        amenities: getRandomAmenities(6),
        galleryImages: getImages(7),
      },
      {
        name: 'Zandiyeh Hotel', // Hotel 8 - Shiraz
        cityId: shiraz?.id || 1,
        phone: '+98 71 32234234',
        address: 'Hijrat St, Behind Karim Khan Citadel, Shiraz, Iran',
        stars: 5,
        description:
          'Located in the heart of Shiraz, just steps away from the majestic Karim Khan Citadel, Zandiyeh Hotel features architecture inspired by the historical Zand dynasty.',
        ownerId,
        amenities: getRandomAmenities(8),
        galleryImages: getImages(8),
      },
      {
        name: 'Dariush Grand Hotel', // Hotel 9 - Kish
        cityId: kish?.id || 1,
        phone: '+98 76 44444900',
        address: 'Dariush Square, Kish Island, Iran',
        stars: 5,
        description:
          'A masterpiece of architecture inspired by the ancient ruins of Persepolis, the Dariush Grand Hotel is a symbol of Persian glory.',
        ownerId,
        amenities: getRandomAmenities(9),
        galleryImages: getImages(9),
      },
      {
        name: 'Kaya Laleh Park Hotel', // Hotel 10 - Tabriz
        cityId: tabriz?.id || 1,
        phone: '+98 41 31202020',
        address: 'Fahmideh Square, Tabriz, Iran',
        stars: 5,
        description:
          'Connected directly to the Laleh Park Shopping Mall, this contemporary high-rise hotel brings Turkish luxury standards to Tabriz.',
        ownerId,
        amenities: getRandomAmenities(7),
        galleryImages: getImages(10),
      },
    ];

    // ذخیره هتل‌ها در دیتابیس
    await hotelRepository.save(hotelsData);

    console.log(
      '✅ 41 Images uploaded and 10 Hotels seeded successfully with perfectly matched gallery images!',
    );
  }
}
