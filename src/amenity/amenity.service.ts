import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Amenity } from './amenity.entity';
import { In, Repository } from 'typeorm';
import { AmenityType } from './type/amenity-type.enum';
import { AMENITY_SEED_DATA } from './data/amenity-seed.data';

@Injectable()
export class AmenityService {
  constructor(
    @InjectRepository(Amenity)
    private readonly amenityRepository: Repository<Amenity>,
  ) {}

  async onModuleInit() {
    await this.seedAmenities();
  }

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

  private async seedAmenities() {
    const count = await this.amenityRepository.count();
    if (count === 0) {
      await this.amenityRepository.save(AMENITY_SEED_DATA);
      return { message: 'amenities seeded successfuly' };
    }
    return { message: 'Amenities already exist' };
  }
}
