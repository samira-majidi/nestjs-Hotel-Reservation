import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { ActiveUser } from 'src/auth/decorators/active-user.decorator';
import { CheckOwnership } from 'src/auth/authorization/ownership.decorator';
import { OwnershipGuard } from 'src/auth/authorization/ownership.guard';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { PermissionGuard } from 'src/rbac/guards/permission.guard';
import { Permissions } from 'src/rbac/decorators/permissions.decorator';
import { Permission } from 'src/rbac/enums/permission.enum';
import { RoomService } from './providers/room-service/room.service';
import { CreateRoomDto } from './dtos/create-room.dto';
import { UpdateRoomDto } from './dtos/update-room.dto';
import { InjectQueue } from '@nestjs/bull';
import bull from 'bull';

@ApiTags('Rooms')
@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomService: RoomService,
    @InjectQueue('daily-price')
    private dailyPriceQueue: bull.Queue,
  ) {}

  // ------------------------------
  // GET /rooms/hotel/:hotelId
  // ------------------------------
  @Auth(AuthType.None)
  @Get('hotel/:hotelId')
  @ApiOperation({ summary: 'Get paginated list of rooms by hotel ID' })
  @ApiParam({ name: 'hotelId', example: 3 })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Rooms retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Hotel not found' })
  findAllByHotel(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.roomService.findAllRoomsByHotelId(paginationDto, hotelId);
  }

  // ------------------------------
  // GET /rooms/:id
  // ------------------------------
  @Auth(AuthType.None)
  @Get(':id')
  @ApiOperation({ summary: 'Get room by ID' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Room retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  findOne(@Param('id') id: string) {
    return this.roomService.findOneRoombyId(id);
  }

  // ------------------------------
  // POST /rooms
  // ------------------------------

  // ------------------------------
  // POST /rooms/hotel/:hotelId
  // ------------------------------
  @UseGuards(OwnershipGuard, PermissionGuard)
  @CheckOwnership('hotel', 'hotelId')
  @Permissions(Permission.ROOM_CREATE)
  @Post('hotel/:hotelId')
  @ApiOperation({ summary: 'Create a new room' })
  @ApiParam({ name: 'hotelId', example: 3 })
  @ApiResponse({ status: 201, description: 'Room created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden (not hotel owner)' })
  @ApiResponse({ status: 409, description: 'Room number already exists' })
  async create(
    @Param('hotelId', ParseIntPipe) hotelId: number, // ← اضافه شد
    @Body() createRoomDto: CreateRoomDto,
    @ActiveUser('sub') userId: number,
  ) {
    return await this.roomService.create(hotelId, createRoomDto, userId);
  }

  // ------------------------------
  // PATCH /rooms/:id
  // ------------------------------
  @UseGuards(OwnershipGuard, PermissionGuard)
  @CheckOwnership('room', 'id')
  @Permissions(Permission.ROOM_UPDATE)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a room by ID' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Room updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden (not hotel owner)' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  update(
    @Param('id') roomId: string,
    @Body() dto: UpdateRoomDto,
    @ActiveUser('sub') userId: number,
  ) {
    return this.roomService.update(roomId, dto, userId);
  }

  // ------------------------------
  // DELETE /rooms/:id
  // ------------------------------
  @UseGuards(OwnershipGuard, PermissionGuard)
  @CheckOwnership('room', 'id')
  @Permissions(Permission.ROOM_DELETE)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete room by ID' })
  @ApiParam({ name: 'id', example: 'uuid-room-id' })
  @ApiResponse({ status: 200, description: 'Room deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden (not owner)' })
  remove(@Param('id') roomId: string, @ActiveUser('sub') userId: number) {
    return this.roomService.remove(roomId, userId);
  }
}
