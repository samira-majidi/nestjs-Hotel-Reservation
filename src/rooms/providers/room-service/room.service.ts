import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from '#src/common/dto/pagination.dto';
import { PaginatedResponse } from '#src/common/interface/paginated-response.interface';
import { createPaginatedResponse } from '#src/common/utill/pagination.util';
import { HotelsService } from '#src/hotels/providers/hotels.service';
import { RedisService } from '#src/redis/providers/redis.service';
import { CreateRoomDto } from '#src/rooms/dtos/create-room.dto';
import { UpdateRoomDto } from '#src/rooms/dtos/update-room.dto';
import { Room } from '#src/rooms/entity/room.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);
  private readonly CACHE_TTL = 300;

  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    private readonly redisService: RedisService,
    private readonly hotelService: HotelsService,
  ) {}
  async create(
    hotelId: number,
    createRoomDto: CreateRoomDto,
    userId: number,
  ): Promise<Room> {
    const hotel = await this.hotelService.findHotelById(hotelId);
    if (!hotel) {
      throw new NotFoundException('hotel not found');
    }

    if (hotel.ownerId !== userId) {
      throw new ForbiddenException('you are not owner');
    }

    const existingRoom = await this.roomRepository.findOne({
      where: {
        roomNumber: createRoomDto.roomNumber,
        hotelId: hotelId,
      },
    });

    if (existingRoom) {
      throw new ConflictException(
        `Room ${createRoomDto.roomNumber} already exists`,
      );
    }

    const room = this.roomRepository.create({
      ...createRoomDto,
      hotel: { id: hotelId },
    });

    const savedRoom = await this.roomRepository.save(room);

    this.logger.log(`Room created: ${savedRoom.id}`);
    await this.invalidateRoomCache(hotelId);

    return savedRoom;
  }

  async findAllRoomsByHotelId(
    paginationDto: PaginationDto,
    hotelId: number,
  ): Promise<PaginatedResponse<Room>> {
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 10;
    const skip = (page - 1) * limit;

    const cacheKey = `room:hotel:${hotelId}:page:${page}:limit:${limit}`;

    const cached =
      await this.redisService.get<PaginatedResponse<Room>>(cacheKey);
    if (cached) {
      this.logger.log('cache hit: rooms for this hotel');
      return cached;
    }

    const [data, total] = await this.roomRepository.findAndCount({
      where: { hotelId },
      skip,
      take: limit,
    });

    const response = createPaginatedResponse<Room>(data, total, page, limit);
    await this.redisService.set(cacheKey, response, this.CACHE_TTL);
    this.logger.debug(`Cached data for key: ${cacheKey}`);
    return response;
  }

  async findOneRoombyId(id: string): Promise<Room> {
    const cacheKey = `room:${id}`;
    const cached = await this.redisService.get<Room>(cacheKey);
    if (cached) {
      this.logger.log(`cache hit: room:${id}`);
      return cached;
    }

    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['hotel', 'hotel.owner'],
    });

    if (!room) {
      throw new NotFoundException(`could not find room with id ${id}`);
    }

    await this.redisService.set(cacheKey, room, this.CACHE_TTL);
    this.logger.debug(`cached data for room:${id}`);
    return room;
  }
  async update(id: string, dto: UpdateRoomDto, userId: number): Promise<Room> {
    const room = await this.findRoomWithHotel(id);

    if (room.hotel.ownerId !== userId) {
      throw new ForbiddenException('You are not allowed to update this room');
    }

    // Unique check
    if (dto.roomNumber && dto.roomNumber !== room.roomNumber) {
      const exists = await this.roomRepository.findOne({
        where: { roomNumber: dto.roomNumber, hotelId: room.hotelId },
      });

      if (exists) {
        throw new ConflictException(
          `Room ${dto.roomNumber} already exists in this hotel`,
        );
      }
    }

    Object.assign(room, dto);

    const updated = await this.roomRepository.save(room);

    await this.redisService.del(`room:${id}`);
    await this.invalidateRoomCache(room.hotelId);

    return updated;
  }

  async remove(id: string, userId: number): Promise<void> {
    const room = await this.findRoomWithHotel(id);

    if (room.hotel.ownerId !== userId) {
      throw new ForbiddenException('You are not allowed to delete this room');
    }

    await this.roomRepository.remove(room);

    await this.redisService.del(`room:${id}`);
    await this.invalidateRoomCache(room.hotelId);
  }
  private async invalidateRoomCache(hotelId?: number): Promise<void> {
    try {
      const pattern = hotelId ? `room:hotel:${hotelId}:*` : 'room:hotel:*';
      const keys = await this.redisService.keys(pattern);
      if (keys.length > 0) {
        await Promise.all(keys.map((key) => this.redisService.del(key)));
        this.logger.log(`Invalidated ${keys.length} cache keys`);
      }
    } catch (error) {
      this.logger.error('Failed to invalidate room cache', error);
      throw error;
    }
  }

  private async findRoomWithHotel(roomId: string): Promise<Room> {
    const room = await this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.hotel', 'hotel')
      .where('room.id = :roomId', { roomId })
      .getOne();

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }
}
