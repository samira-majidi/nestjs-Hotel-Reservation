import { InjectQueue } from '@nestjs/bull';
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CreateRoomPricingDto } from './dtos/pricing-room.dto';
import { UpdateRoomPricingDto } from './dtos/update-room-pricing.dto';
import { PricingService } from './providers/room-service/room-pricings.service';
import bull from 'bull';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { CheckOwnership } from '#src/auth/authorization/ownership.decorator';
import { OwnershipGuard } from '#src/auth/authorization/ownership.guard';
import { PermissionGuard } from '#src/rbac/guards/permission.guard';

@Controller('pricing-rules')
export class PricingRulesController {
  constructor(
    private readonly pricingService: PricingService,
    @InjectQueue('daily-price') private readonly dailyPriceQueue: bull.Queue,
  ) {}
  @Post(':roomId')
  @ApiOperation({ summary: 'Create pricing rule for room' })
  @ApiParam({ name: 'roomId', type: 'string' })
  @UseGuards(OwnershipGuard, PermissionGuard)
  @CheckOwnership('room', 'roomId')
  //@Permissions(Permission.ROOM_UPDATE)
  async create(
    @Param('roomId') roomId: string,
    @Body() dto: CreateRoomPricingDto,
  ) {
    const result = await this.pricingService.createRoomPricing(dto, roomId);
    await this.dailyPriceQueue.add('regenerate', { roomId });
    return result;
  }

  @Get(':roomId')
  @ApiOperation({ summary: 'Get all pricing rules for room' })
  @ApiParam({ name: 'roomId', type: 'string' })
  async findAll(@Param('roomId') roomId: string) {
    return this.pricingService.findRoomPricingByRoom(roomId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateRoomPricingDto) {
    return this.pricingService.updateRoomPriccing(id, dto);
  }

  @Delete(':roomId/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete pricing rule' })
  @ApiParam({ name: 'roomId', type: 'string' })
  @ApiParam({ name: 'id', type: 'string' })
  @UseGuards(OwnershipGuard, PermissionGuard)
  @CheckOwnership('room', 'roomId')
  async remove(@Param('roomId') roomId: string, @Param('id') id: string) {
    await this.pricingService.removeroompricing(id);
    await this.dailyPriceQueue.add('regenerate', { roomId });
  }
}
