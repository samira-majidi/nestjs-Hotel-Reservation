import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { RoomType } from 'src/rooms/enums/room-type.enum';

export class SearchAvailabilityDto {
  @IsDateString()
  checkInDate: string;

  @IsDateString()
  checkOutDate: string;

  @IsEnum(RoomType)
  @IsOptional()
  roomType?: RoomType;

  @IsInt()
  @Min(1)
  @IsOptional()
  guests?: number;
}

//یک جور فیتر برای پیدا کردن اتاق های موردنير براساس داده های کاربر
