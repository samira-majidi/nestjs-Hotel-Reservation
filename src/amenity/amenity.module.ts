import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Amenity } from './entity/amenity.entity';
import { AmenityService } from './providers/amenity.service';
import { AmenityController } from './amenity.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Amenity])],
  providers: [AmenityService],
  controllers: [AmenityController],
  exports: [TypeOrmModule],
})
export class AmenityModule {}
