import { DataSource } from 'typeorm';
import { City } from '#src/city/entities/city.entity';

export default class CitySeeder {
  // دیگه factoryManager رو نمی‌گیریم چون پکیجش رو نداریم
  public async run(dataSource: DataSource): Promise<void> {
    const cityRepository = dataSource.getRepository(City);

    // بررسی اینکه آیا شهرها قبلا ثبت شدن یا نه
    const count = await cityRepository.count();
    if (count > 0) {
      console.log('✨ Cities already exist. Skipping seeding...');
      return;
    }

    // لیست $6$ شهر توریستی
    const citiesData = [
      { name: 'Mashhad' },
      { name: 'Tehran' },
      { name: 'Isfahan' },
      { name: 'Shiraz' },
      { name: 'Kish' },
      { name: 'Tabriz' },
    ];

    await cityRepository.save(citiesData);
    console.log('✅ $6$ Tourist Cities created successfully!');
  }
}
