import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomDto } from './create-room.dto';
import { RoomStatus } from '../enums/room-status.enum';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {
  @IsEnum(RoomStatus)
  @IsOptional()
  status?: RoomStatus;
}
