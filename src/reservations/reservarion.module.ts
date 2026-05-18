import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './entity/reservation.entity';
import { ReservationService } from './providers/reservation.service';
import { RoomsModule } from '#src/rooms/room.module';
import { ReservationController } from './reservation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation]), RoomsModule],
  controllers: [ReservationController],
  providers: [ReservationService],
})
export class ReservarionModule {}
