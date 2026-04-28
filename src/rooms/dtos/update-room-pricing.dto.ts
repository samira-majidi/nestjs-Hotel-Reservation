import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomPricingDto } from './pricing-room.dto';
//سیاست قیمت گذاری یک اتقا نباید برای اتاق دیگه درنظر
//  گرفته بشه اجازه اپدیت اتاق وجود نخواهد داشت
export class UpdateRoomPricingDto extends PartialType(CreateRoomPricingDto) {}
