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

  @IsString()
  @MaxLength(100)
  guestName: string;
  /*
  @IsEmail()
  guestEmail: string;
*/
  @IsString()
  @IsOptional()
  @Matches(/^\+?[0-9\s-]{7,15}$/, {
    message: 'your phone number is not valid',
  })
  guestPhone?: string;

  @IsDateString()
  checkInDate: Date;

  @IsDateString()
  checkOutDate: Date;

  @IsInt()
  @Min(1)
  numberOfGuests: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  specialRequests?: string;
}
