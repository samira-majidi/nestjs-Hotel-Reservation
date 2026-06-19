// auth.service.ts
import { Injectable } from '@nestjs/common';
import { UserRole } from '#src/common/enum/user-role.enum';
import { CreatUserDto } from '#src/users/dtos/creat-user.dto';
import { UserService } from '#src/users/providers/user-service';
import { SignInDto } from '../dto/sing-in.dto';
import { SignInProvider } from './sing-in.provider';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly signInProvider: SignInProvider,
  ) {}

  public async registerUser(dto: CreatUserDto) {
    // ۱. ساخت کاربر با نقش USER
    const user = await this.usersService.createUser(dto, UserRole.USER);

    // ۲. تولید بلافاصله‌ی توکن‌ها
    const tokens = await this.signInProvider.signIn({
      email: dto.email,
      password: dto.password,
    });

    // ۳. بازگرداندن کاربر و توکن‌ها
    return {
      user,
      ...tokens,
    };
  }

  public async registerHost(dto: CreatUserDto) {
    const user = await this.usersService.createUser(dto, UserRole.HOST);

    const tokens = await this.signInProvider.signIn({
      email: dto.email,
      password: dto.password,
    });

    return {
      user,
      ...tokens,
    };
  }

  public async signIn(signInDto: SignInDto) {
    return this.signInProvider.signIn(signInDto);
  }
}
