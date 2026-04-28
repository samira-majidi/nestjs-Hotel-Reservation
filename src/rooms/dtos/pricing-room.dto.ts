// src/modules/rooms/dto/create-room-pricing.dto.ts
import {
  IsDateString,
  IsNumber,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { PricingType } from '../enums/pricing-type.enum';

export class CreateRoomPricingDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsEnum(PricingType)
  type: PricingType;

  @IsInt()
  @Min(1)
  @IsOptional()
  priority?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
