import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AmenityService } from './providers/amenity.service';
import { AmenityType } from './type/amenity-type.enum';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Amenity } from './entity/amenity.entity';
import { FindAmenityByIdsDto } from './dto/findamenitybyid.dto';

@Controller('amenity')
export class AmenityController {
  constructor(private readonly amenityService: AmenityService) {}

  @Get('sport')
  async findAllamenityType(@Query('type') type?: AmenityType) {
    return this.amenityService.findAll(type);
  }

  @Post('list-of-amenity')
  @ApiOperation({
    summary: 'ساخت امکانات جدید',
    description: 'name و type الزامیه، description اختیاری',
  })
  @ApiResponse({
    status: 201,
    description: 'امکانات با موفقیت ساخته شد',
    type: Amenity,
  })
  @ApiResponse({
    status: 400,
    description: 'داده‌های ورودی نامعتبر',
  })
  findAmenitiesById(@Body() dto: FindAmenityByIdsDto) {
    return this.amenityService.findByIds(dto.ids);
  }
}
