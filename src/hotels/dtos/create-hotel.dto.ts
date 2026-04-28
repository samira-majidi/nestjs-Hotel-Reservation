import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsArray,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateHotelDto {
  @ApiProperty({
    example: 'Hilton Hotel',
    description: 'The official name of the hotel',
    minLength: 3,
    maxLength: 128,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(128)
  name: string;

  @ApiProperty({
    example: 1,
    description: 'ID of the city where the hotel is located',
  })
  @IsInt()
  @IsNotEmpty()
  cityId: number;

  @ApiProperty({
    example: 'Valiasr Street, Tehran',
    description: 'Full address of the hotel',
    minLength: 5,
    maxLength: 256,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(256)
  address: string;

  @ApiProperty({
    description: 'Description of the hotel',
    example: 'A luxury 5‑star hotel located downtown.',
  })
  @IsString()
  @MaxLength(2000)
  description: string;

  @ApiProperty({
    description: 'List of amenities as an array of strings',
    example: ['wifi', 'pool', 'spa'],
  })
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  amenities: string[];
}
