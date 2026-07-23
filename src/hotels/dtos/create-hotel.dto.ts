import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsArray,
  MaxLength,
  MinLength,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(255)
  address: string;

  @ApiProperty({
    description: 'the amount of starts should be between 1 to 5',
    example: 4,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  stars?: number;

  @ApiProperty({
    example: '+98 21 1234 5678',
    description: 'Contact phone number',
    required: false,
    maxLength: 20,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({
    description: 'Description of the hotel',
    example: 'A luxury 5‑star hotel located downtown.',
  })
  @IsString()
  @MaxLength(2000)
  description: string;

  @ApiProperty({
    description: 'List of amenity IDs',
    example: [1, 2, 5],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  amenityIds?: number[];

  @ApiProperty({
    description: 'Array of uploaded file IDs for hotel gallery',
    example: [1, 2, 3],
    type: [Number],
  })
  @ApiProperty({
    description: 'Array of uploaded file IDs for hotel gallery',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional() // یا اگر عکس اجباریه از @ArrayNotEmpty() استفاده کن
  @IsArray()
  @IsInt({ each: true })
  // @Type(() => Number) 👈 این خط رو کاملا پاک کن
  imageIds?: number[];
}
