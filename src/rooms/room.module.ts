import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entity/room.entity';
import { RoomPricing } from './entity/room-pricing.entity';
import { RoomService } from './providers/room-service/room.service';
import { RoomsController } from './room.controller';
import { DailyPrice } from './entity/daily-price.entity';
import { BullModule } from '@nestjs/bull';
import { PricingService } from './providers/room-service/room-pricings.service';
import { DailyPriceProcessor } from './processors/daily-price.processor';
import { HotelsModule } from 'src/hotels/hotels.module';
import { OwnershipModule } from 'src/auth/authorization/ownership.module';
import { PricingRulesController } from './room-pricing-rules.controller';
import { OwnershipHandlerRegistry } from 'src/auth/authorization/ownership-handler.registry';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, RoomPricing, DailyPrice]),
    BullModule.registerQueue({
      name: 'daily-price',
    }),
    OwnershipModule,
    HotelsModule,
  ],
  controllers: [RoomsController, PricingRulesController],
  providers: [RoomService, PricingService, DailyPriceProcessor],
  exports: [RoomService],
})
export class RoomsModule implements OnModuleInit {
  constructor(
    private readonly registry: OwnershipHandlerRegistry,
    private readonly roomService: RoomService,
  ) {}

  onModuleInit() {
    this.registry.register(
      'room',
      async (roomId: string | number, userId: number) => {
        const roomIdStr = String(roomId);
        const room = await this.roomService.findOneRoombyId(roomIdStr);
        return room?.hotel?.owner?.id === userId;
      },
    );
  }
}
