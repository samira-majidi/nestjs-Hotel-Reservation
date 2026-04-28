import { IsArray, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FindAmenityByIdsDto {
  @ApiProperty({ example: [1, 3, 5] })
  @IsArray()
  @IsInt({ each: true })
  ids: number[];
}
