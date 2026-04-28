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
import { HotelsService } from './providers/hotels.service';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { UpdateHotelDto } from './dtos/update-hotel.dto';
import { CreateHotelDto } from './dtos/create-hotel.dto';
import { PermissionGuard } from 'src/rbac/guards/permission.guard';
import { Permissions } from 'src/rbac/decorators/permissions.decorator';
import { Permission } from 'src/rbac/enums/permission.enum';

@ApiTags('Hotels')
@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  // ------------------------------
  // GET /hotels
  // ------------------------------
  @Auth(AuthType.None)
  @Get()
  @ApiOperation({ summary: 'Get paginated list of hotels' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Hotels retrieved successfully' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.hotelsService.findAllHotel(paginationDto);
  }

  // ------------------------------
  // GET /hotels/:id
  // ------------------------------
  @Auth(AuthType.None)
  @Get(':id')
  @ApiOperation({ summary: 'Get hotel by ID (includes rooms)' })
  @ApiParam({ name: 'id', example: 3 })
  @ApiResponse({ status: 200, description: 'Hotel retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Hotel not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.hotelsService.findHotelById(id);
  }

  // ------------------------------
  // POST /hotels
  // ------------------------------

  @UseGuards(PermissionGuard)
  @Permissions(Permission.HOTEL_CREATE)
  @Post()
  @ApiOperation({ summary: 'Create a new hotel' })
  @ApiResponse({ status: 201, description: 'Hotel created successfully' })
  create(
    @Body() createHotelDto: CreateHotelDto,
    @ActiveUser('sub') userId: number,
  ) {
    return this.hotelsService.createHotel(createHotelDto, userId);
  }

  // ------------------------------
  // PATCH /hotels/:id
  // ------------------------------
  @UseGuards(OwnershipGuard)
  @CheckOwnership('hotel', 'id')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a hotel by ID' })
  @ApiParam({ name: 'id', example: 3 })
  @ApiResponse({ status: 200, description: 'Hotel updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden (not owner)' })
  update(
    @Param('id', ParseIntPipe) hotelId: number,
    @Body() dto: UpdateHotelDto,
    @ActiveUser('sub') userId: number,
  ) {
    return this.hotelsService.updateHotel(dto, hotelId, userId);
  }

  // ------------------------------
  // DELETE /hotels/:id
  // ------------------------------
  @UseGuards(OwnershipGuard, PermissionGuard)
  @CheckOwnership('hotel', 'id')
  @Permissions(Permission.HOTEL_DELETE)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a hotel by ID' })
  @ApiParam({ name: 'id', example: 3 })
  @ApiResponse({ status: 200, description: 'Hotel deleted successfully' })
  remove(
    @Param('id', ParseIntPipe) hotelId: number,
    @ActiveUser('sub') userId: number,
  ) {
    return this.hotelsService.deleteHotel(hotelId, userId);
  }
}
