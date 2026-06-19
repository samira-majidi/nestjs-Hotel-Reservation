import { Body, Controller, Get, Post } from '@nestjs/common';
import { CityService } from './providers/city.service';
import { CreateCityDto } from './dto/create-city.dto';
import { AuthType } from '#src/auth/enums/auth-type.enum';
import { Auth } from '#src/auth/decorators/auth.decorator';
@Auth(AuthType.None)
@Controller('city')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Post()
  public createCity(@Body() createCityDto: CreateCityDto) {
    return this.cityService.createCity(createCityDto);
  }
  @Get()
  public getAllCities() {
    console.log('Received request to get all cities!'); // اضافه شده برای دیباگ
    return this.cityService.findAllCities(); // اسم این متد بستگی به چیزی داره که تو سرویس نوشتی
  }
}
