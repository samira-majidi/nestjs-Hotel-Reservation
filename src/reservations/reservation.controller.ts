import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { ReservationService } from './providers/reservation.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateReservationDto } from './dtos/create-reservation.dto';
import { ActiveUser } from '#src/auth/decorators/active-user.decorator';
import { Auth } from '#src/auth/decorators/auth.decorator';
import { AuthType } from '#src/auth/enums/auth-type.enum';

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
  @Auth(AuthType.None)
  @Patch(':id/confirm-payment')
  @ApiOperation({
    summary: 'Confirm reservation payment',
    description:
      'Triggered by the checkout pay button to confirm a pending reservation.',
  })
  @ApiResponse({ status: 200, description: 'Payment confirmed successfully' })
  @ApiResponse({
    status: 400,
    description: 'Only pending reservations can be confirmed',
  })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  async confirmPayment(@Param('id') id: string) {
    return this.reservationService.confirmPayment(id);
  }
}
