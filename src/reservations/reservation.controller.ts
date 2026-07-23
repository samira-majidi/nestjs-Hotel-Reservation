import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
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
  // reservation.controller.ts

  @Get('hotel/:hotelId')
  @ApiOperation({
    summary: 'Get reservations for a specific hotel',
    description: 'Fetches all reservations belonging to a specific hotel ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of hotel reservations returned successfully',
  })
  public getReservationsByHotel(@Param('hotelId') hotelId: number) {
    return this.reservationService.findByHotelId(hotelId);
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
  @Get('my-reservations')
  @ApiOperation({
    summary: 'Get current user reservations',
    description:
      'Fetches all reservations for the authenticated user based on their token.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user reservations returned successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public getUserReservations(@ActiveUser('sub') userId: number) {
    return this.reservationService.findByUserId(userId);
  }
}
