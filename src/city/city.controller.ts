import { Body, Controller, Post } from '@nestjs/common';
import { CityService } from './providers/city.service';
import { CreateCityDto } from './dto/create-city.dto';

@Controller('city')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Post()
  public createCity(@Body() createCityDto: CreateCityDto) {
    return this.cityService.createCity(createCityDto);
  }
}
