import {
  IsString,
  IsEnum,
  IsNumber,
  IsInt,
  IsOptional,
  IsArray,
  Min,
  MaxLength,
} from 'class-validator';
import { RoomType } from '../enums/room-type.enum';

export class CreateRoomDto {
  @IsString()
  @MaxLength(10)
  roomNumber: string;

  @IsEnum(RoomType)
  type: RoomType;

  @IsNumber({ maxDecimalPlaces: 2 }) //حداکثر دو رقم اعشار
  @Min(0)
  basePrice: number;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsInt()
  @IsOptional()
  floor?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];
}
