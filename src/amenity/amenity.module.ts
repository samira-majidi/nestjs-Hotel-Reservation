import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Amenity } from './amenity.entity';
import { AmenityService } from './amenity.service';
import { AmenityController } from './amenity.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Amenity])],
  providers: [AmenityService],
  controllers: [AmenityController],
  exports: [TypeOrmModule],
})
export class AmenityModule {}
