import {
  IsString,
  IsUUID,
  IsDateString,
  IsInt,
  IsOptional,
  Min,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateReservationDto {
  @IsUUID()
  roomId: string;

  @IsInt()
  @Min(1)
  userId: number;

  @IsString()
  @MaxLength(100)
  guestName: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s-]{7,15}$/, {
    message: 'your phone number is not valid',
  })
  guestPhone?: string;

  @IsDateString()
  checkInDate: string;

  @IsDateString()
  checkOutDate: string;

  @IsInt()
  @Min(1)
  numberOfGuests: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialRequests?: string;
}
