import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { ReservationService } from './providers/reservation.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateReservationDto } from './dtos/create-reservation.dto';
import { ActiveUser } from '#src/auth/decorators/active-user.decorator';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @ApiOperation({
    summary: 'Create room reservation',
    description: 'Available for both authenticated users and guests',
  })
  @ApiResponse({ status: 201, description: 'Reservation created' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 409, description: 'Room unavailable' })
  public createReservation(
    @Body() createReservationDto: CreateReservationDto,
    @ActiveUser('sub') userId: number,
  ) {
    return this.reservationService.create(createReservationDto, userId);
  }

  @Patch(':id/cancel')
  async cancel(@Param('id') id: string, @ActiveUser('sub') userId: number) {
    return this.reservationService.cancelReservation(id, userId);
  }
}
