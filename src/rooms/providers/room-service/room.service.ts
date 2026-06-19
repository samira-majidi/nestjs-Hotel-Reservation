import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginationDto } from '#src/common/dto/pagination.dto';
import { PaginatedResponse } from '#src/common/interface/paginated-response.interface';
import { createPaginatedResponse } from '#src/common/utill/pagination.util';
import { GalleryManagerService } from '#src/common/upload/providers/gallery-manager.service';
import { Upload } from '#src/common/upload/entity/upload.entity';
import { HotelsService } from '#src/hotels/providers/hotels.service';
import { RedisService } from '#src/redis/providers/redis.service';
import { CreateRoomDto } from '#src/rooms/dtos/create-room.dto';
import { UpdateRoomDto } from '#src/rooms/dtos/update-room.dto';
import { Room } from '#src/rooms/entity/room.entity';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);
  private readonly CACHE_TTL = 300;
  private readonly MAX_GALLERY_IMAGES = 20; // محدودیت تعداد عکس‌ها دقیقاً مثل هتل

  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    private readonly redisService: RedisService,
    private readonly hotelService: HotelsService,
    private readonly galleryManager: GalleryManagerService, // اضافه شدن گالری منیجر
  ) {}

  async create(
    hotelId: number,
    createRoomDto: CreateRoomDto,
    userId: number,
  ): Promise<Room> {
    const { imageIds, ...roomData } = createRoomDto;

    const hotel = await this.hotelService.findHotelById(hotelId);
    if (!hotel) {
      throw new NotFoundException('hotel not found');
    }

    if (hotel.ownerId !== userId) {
      throw new ForbiddenException('you are not owner');
    }

    const existingRoom = await this.roomRepository.findOne({
      where: {
        roomNumber: roomData.roomNumber,
        hotelId: hotelId,
      },
    });

    if (existingRoom) {
      throw new ConflictException(`Room ${roomData.roomNumber} already exists`);
    }

    // استفاده از تراکنش برای اطمینان از ذخیره درست عکس‌ها و اتاق
    return await this.roomRepository.manager.transaction(async (manager) => {
      let galleryImages: Upload[] = [];

      if (imageIds && imageIds.length > 0) {
        galleryImages = await this.galleryManager.attachGallery(
          imageIds,
          userId,
          {
            maxImages: this.MAX_GALLERY_IMAGES,
            entityName: 'Room', // تغییر نام انتیتی به اتاق
          },
          manager,
        );
      }

      const room = this.roomRepository.create({
        ...roomData,
        hotel: { id: hotelId },
        galleryImages, // اضافه کردن عکس‌ها به انتیتی
      });

      const savedRoom = await manager.save(room);

      this.logger.log(`Room created: ${savedRoom.id}`);
      await this.invalidateRoomCache(hotelId);

      return savedRoom;
    });
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
      relations: ['galleryImages', 'hotel'], // لود کردن عکس‌ها در لیست
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
      relations: ['hotel', 'hotel.owner', 'galleryImages'], // لود کردن گالری
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

    const { imageIds, ...roomData } = dto;

    // Unique check
    if (roomData.roomNumber && roomData.roomNumber !== room.roomNumber) {
      const exists = await this.roomRepository.findOne({
        where: { roomNumber: roomData.roomNumber, hotelId: room.hotelId },
      });

      if (exists) {
        throw new ConflictException(
          `Room ${roomData.roomNumber} already exists in this hotel`,
        );
      }
    }

    // اگر قرار است عکس‌ها آپدیت شوند، باید از تراکنش استفاده کنیم
    if (imageIds) {
      return await this.roomRepository.manager.transaction(async (manager) => {
        const newGallery = await this.galleryManager.replaceGallery(
          room.galleryImages || [],
          imageIds,
          userId,
          {
            maxImages: this.MAX_GALLERY_IMAGES,
            entityName: 'Room',
          },
          manager,
        );

        const updatedRoom = await manager.save(Room, {
          ...room,
          ...roomData,
          galleryImages: newGallery,
        });

        await this.redisService.del(`room:${id}`);
        await this.invalidateRoomCache(room.hotelId);
        this.logger.log(`Room updated with new images: ${id}`);
        return updatedRoom;
      });
    }

    // آپدیت عادی بدون تغییر در عکس‌ها
    Object.assign(room, roomData);
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

    // آزادسازی تصاویر هنگام حذف اتاق
    if (room.galleryImages && room.galleryImages.length > 0) {
      await this.galleryManager.releaseImages(room.galleryImages);
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
    // اینجا هم گالری رو لود می‌کنیم تا در آپدیت و دلیت در دسترس باشه
    const room = await this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.hotel', 'hotel')
      .leftJoinAndSelect('room.galleryImages', 'galleryImages') // لود کردن عکس‌ها در کوئری بیلدر
      .where('room.id = :roomId', { roomId })
      .getOne();

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }
}
