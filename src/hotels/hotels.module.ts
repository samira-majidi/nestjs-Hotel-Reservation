import { Module, OnModuleInit } from '@nestjs/common';
import { HotelsService } from './providers/hotels.service';
import { HotelsController } from './hotels.controller';
import { UsersModule } from '#src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hotel } from './entities/hotel.entity';
import { City } from '#src/city/entities/city.entity';
import { UploadModule } from '#src/common/upload/upload.module';
import { OwnershipHandlerRegistry } from '#src/auth/authorization/ownership-handler.registry';
import { OwnershipModule } from '#src/auth/authorization/ownership.module';
import { OwnershipGuard } from '#src/auth/authorization/ownership.guard';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([Hotel, City]),
    OwnershipModule,
    UploadModule,
  ],

  providers: [HotelsService, OwnershipGuard],
  exports: [HotelsService],
  controllers: [HotelsController],
})
export class HotelsModule implements OnModuleInit {
  constructor(
    private readonly registry: OwnershipHandlerRegistry,
    private readonly hotelsService: HotelsService,
  ) {}

  onModuleInit() {
    this.registry.register(
      'hotel',
      async (hotelId: string | number, userId: number) => {
        const hotelIdStr = Number(hotelId);
        const hotel = await this.hotelsService.findById(hotelIdStr);
        return hotel?.owner.id === userId;
      },
    );
  }
}
