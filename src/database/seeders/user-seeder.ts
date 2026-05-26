import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '#src/users/user.entity';
// این خط رو اضافه کن تا Enum نقش‌ها ایمپورت بشه
import { UserRole } from '#src/common/enum/user-role.enum';

export class UserSeeder {
  public async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);
    const email = 'samiramajidi@gmail.com';

    // چک می‌کنیم کاربر تکراری نباشه
    if ((await userRepository.count({ where: { email } })) === 0) {
      const hashedPassword = await bcrypt.hash('1378SmHa', 10);

      await userRepository.save(
        userRepository.create({
          name: 'samira',
          lastName: 'majidi',
          email: email,
          password: hashedPassword,
          role: UserRole.HOST, // 👈 اینجا نقش رو تنظیم کردیم روی مالک
        }),
      );
      console.log('✅ کاربر سمیرا با موفقیت به عنوان مالک (Host) ساخته شد!');
    } else {
      console.log('⚠️ کاربر سمیرا از قبل وجود داشت (رد شد).');
    }
  }
}
