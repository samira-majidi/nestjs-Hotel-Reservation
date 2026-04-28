import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AmenityType } from '../type/amenity-type.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAmenityDto {
  @ApiProperty({ example: 'Pool' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: AmenityType, example: AmenityType.SPORT })
  @IsEnum(AmenityType)
  type: AmenityType;

  @ApiPropertyOptional({ example: 'Olympic size swimming pool' })
  @IsString()
  @IsOptional()
  description?: string;
}
