import { DataSource } from 'typeorm';
import { City } from '#src/city/entities/city.entity';

export default class CitySeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const cityRepository = dataSource.getRepository(City);

    console.log('⏳ Starting City Seeder...');

    // لیست $6$ شهر توریستی به همراه لینک‌های مستقیم Arvan S3
    const citiesData = [
      {
        name: 'Mashhad',
        imageUrl:
          'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/mashhad-1780049289675-9e45d405-0b07-40b6-a8a4-bf3d9bd99450.png',
      },
      {
        name: 'Kish',
        imageUrl:
          'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/kish-1780049408523-4b61d14d-14f5-41d2-b1d1-899496dd6bde.png',
      },
      {
        name: 'Tehran',
        imageUrl:
          'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/tehran-1780049483026-8d54fcca-1b5f-4916-abb6-786d4e99ba42.png',
      },
      {
        name: 'Isfahan',
        imageUrl:
          'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/isfahan-1780049517890-df9a2aad-3459-4e15-9bf9-52355ecbefeb.png',
      },
      {
        name: 'Shiraz',
        imageUrl:
          'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/shiraz-1780049582572-fff631ea-9817-4424-827e-776827275390.png',
      },
      {
        name: 'Tabriz',
        imageUrl:
          'https://s3.ir-thr-at1.arvanstorage.ir/hotel-reservation-images/tabriz-1780049765743-26ba1170-9ff2-4e1e-9088-89ab67ab1271.png',
      },
    ];

    // اجرای منطق Upsert (بررسی، ایجاد یا آپدیت)
    for (const cityData of citiesData) {
      const existingCity = await cityRepository.findOneBy({
        name: cityData.name,
      });

      if (!existingCity) {
        // ساخت شهر جدید با تمام دیتاها (شامل عکس)
        const newCity = cityRepository.create(cityData);
        await cityRepository.save(newCity);
        console.log(`✅ City added: ${cityData.name}`);
      } else {
        // آپدیت کردن عکس برای شهرهایی که از قبل وجود دارن
        existingCity.imageUrl = cityData.imageUrl;
        await cityRepository.save(existingCity);
        console.log(`⏩ City updated with S3 Image: ${cityData.name}`);
      }
    }

    console.log('✨ All cities processed successfully!');
  }
}
