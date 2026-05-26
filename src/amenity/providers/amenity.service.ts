import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Amenity } from '../entity/amenity.entity';
import { In, Repository } from 'typeorm';
import { AmenityType } from '../type/amenity-type.enum';
@Injectable()
export class AmenityService {
  constructor(
    @InjectRepository(Amenity)
    private readonly amenityRepository: Repository<Amenity>,
  ) {}

  async findAll(type?: AmenityType) {
    return this.amenityRepository.find({
      where: type ? { type } : undefined,
    });
  }

  async findByIds(ids: number[]) {
    const amenities = await this.amenityRepository.find({
      where: { id: In(ids) },
    });

    if (amenities.length === 0) {
      throw new NotFoundException('we could not finf any amenity');
    }

    return amenities;
  }
}
