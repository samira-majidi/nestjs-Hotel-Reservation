// src/hotel/dtos/get-hotels-filter.dto.ts
import {
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  IsDateString,
  IsString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class GetHotelsFilterDto {
  // ==========================================
  // فیلدهای جستجوی اصلی (از فرم هدر)
  // ==========================================

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cityId?: number;

  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  guests?: number;

  // ==========================================
  // فیلدهای فیلتر (از سایدبار)
  // ==========================================

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map(Number) : [Number(value)],
  )
  @IsArray()
  @IsNumber({}, { each: true })
  stars?: number[];

  @IsOptional()
  @Transform(({ value }): string[] | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    return Array.isArray(value) ? value.map(String) : [String(value)];
  })
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];
  // ==========================================
  // صفحه‌بندی (Pagination)
  // ==========================================

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
