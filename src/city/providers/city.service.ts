import { Injectable } from '@nestjs/common';
import { CreateCityDto } from '../dto/create-city.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { City } from '../entities/city.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CityService {
  @InjectRepository(City)
  private readonly cityRepository: Repository<City>;
  public async createCity(createCityDto: CreateCityDto) {
    const city = this.cityRepository.create({
      ...createCityDto,
    });
    return this.cityRepository.save(city);
  }
  public async findAllCities() {
    return await this.cityRepository.find(); // اگه از TypeORM استفاده می‌کنی
  }
}
