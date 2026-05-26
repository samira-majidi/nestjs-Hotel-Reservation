// src/hotel/providers/hotels.service.ts
import { Hotel } from '../entities/hotel.entity';
import { Repository } from 'typeorm';
import { CreateHotelDto } from '../dtos/create-hotel.dto';
import { City } from '#src/city/entities/city.entity';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from '#src/common/dto/pagination.dto';
import { PaginatedResponse } from '#src/common/interface/paginated-response.interface';
import { RedisService } from '#src/redis/providers/redis.service';
import { createPaginatedResponse } from '#src/common/utill/pagination.util';
import { UpdateHotelDto } from '../dtos/update-hotel.dto';
import { GalleryManagerService } from '#src/common/upload/providers/gallery-manager.service';
import { Upload } from '#src/common/upload/entity/upload.entity';

@Injectable()
export class HotelsService {
  private readonly logger = new Logger(HotelsService.name);
  private readonly CACHE_TTL = 300;
  private readonly MAX_GALLERY_IMAGES = 20;

  constructor(
    private readonly redisService: RedisService,
    private readonly galleryManager: GalleryManagerService,

    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,

    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
  ) {}

  public async findById(id: number): Promise<Hotel | null> {
    return this.hotelRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
  }

  public async findAllHotel(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Hotel>> {
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 10;
    const skip = (page - 1) * limit;
    const cacheKey = `hotel:all:page:${page}:limit:${limit}`;

    const cached =
      await this.redisService.get<PaginatedResponse<Hotel>>(cacheKey);

    if (cached) {
      this.logger.debug('cache hit : all hotel');
      return cached;
    }

    const [data, total] = await this.hotelRepository.findAndCount({
      relations: ['owner', 'city', 'galleryImages', 'amenities'],
      skip,
      take: limit,
    });

    const response = createPaginatedResponse(data, total, page, limit);
    await this.redisService.set(cacheKey, response, this.CACHE_TTL);
    this.logger.debug(`Cached data for key: ${cacheKey}`);
    return response;
  }

  public async createHotel(createHotelDto: CreateHotelDto, userId: number) {
    const { imageIds, amenityIds, ...hotelData } = createHotelDto;

    const cityExists = await this.cityRepository.existsBy({
      id: createHotelDto.cityId,
    });

    if (!cityExists) {
      throw new NotFoundException(
        `City with id ${createHotelDto.cityId} not found`,
      );
    }

    return await this.hotelRepository.manager.transaction(async (manager) => {
      let galleryImages: Upload[] = [];

      if (imageIds && imageIds.length > 0) {
        galleryImages = await this.galleryManager.attachGallery(
          imageIds,
          userId,
          {
            maxImages: this.MAX_GALLERY_IMAGES,
            entityName: 'Hotel',
          },
          manager,
        );
      }
      const amenities = amenityIds?.map((id) => ({ id })) || [];

      const hotel = this.hotelRepository.create({
        ...hotelData,
        ownerId: userId,
        galleryImages,
        amenities,
      });

      const savedHotel = await manager.save(hotel);
      await this.invalidateHotelCache();
      this.logger.log(`Hotel created: ${savedHotel.id}`);
      return savedHotel;
    });
  }

  async findHotelById(hotelId: number): Promise<Hotel> {
    const cacheKey = `hotel:${hotelId}`;
    const cached = await this.redisService.get<Hotel>(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit: find one hotel ${hotelId}`);
      return cached;
    }

    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId },
      relations: ['owner', 'city', 'rooms', 'galleryImages'],
    });

    if (!hotel) {
      throw new NotFoundException(`Hotel with id ${hotelId} not found`);
    }

    await this.redisService.set(cacheKey, hotel, this.CACHE_TTL);
    this.logger.log(`Hotel with id ${hotelId} found`);

    return hotel;
  }
  public async findHotelsByCityId(
    cityId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Hotel>> {
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 10;
    const skip = (page - 1) * limit;

    // یک کلید کش اختصاصی برای هر شهر و هر صفحه
    const cacheKey = `hotel:city:${cityId}:page:${page}:limit:${limit}`;

    const cached =
      await this.redisService.get<PaginatedResponse<Hotel>>(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit: hotels for city ${cityId}`);
      return cached;
    }

    // اول چک می‌کنیم که اصلا این شهر وجود داره یا نه
    const cityExists = await this.cityRepository.existsBy({ id: cityId });
    if (!cityExists) {
      throw new NotFoundException(`City with id ${cityId} not found`);
    }

    const [data, total] = await this.hotelRepository.findAndCount({
      where: { city: { id: cityId } }, // فیلتر بر اساس آیدی شهر
      relations: ['owner', 'city', 'galleryImages'],
      skip,
      take: limit,
    });

    const response = createPaginatedResponse(data, total, page, limit);
    await this.redisService.set(cacheKey, response, this.CACHE_TTL);
    this.logger.debug(`Cached data for key: ${cacheKey}`);

    return response;
  }

  async updateHotel(
    updatehotelDto: UpdateHotelDto,
    hotelId: number,
    userId: number,
  ) {
    const hotel = await this.findHotelById(hotelId);

    if (hotel.ownerId !== userId) {
      throw new ForbiddenException('شما صاحب هتل نیستید');
    }

    const { imageIds, amenityIds, ...hotelData } = updatehotelDto;
    const amenities = amenityIds
      ? amenityIds.map((id) => ({ id }))
      : hotel.amenities;
    if (imageIds) {
      return await this.hotelRepository.manager.transaction(async (manager) => {
        const newGallery = await this.galleryManager.replaceGallery(
          hotel.galleryImages || [],
          imageIds,
          userId,
          {
            maxImages: this.MAX_GALLERY_IMAGES,
            entityName: 'Hotel',
          },
          manager,
        );

        const updatedHotel = await manager.save(Hotel, {
          ...hotel,
          ...hotelData,
          galleryImages: newGallery,
          amenities,
        });

        await this.invalidateHotelCache();
        this.logger.log(`Hotel with id ${hotelId} updated`);
        return updatedHotel;
      });
    }

    // اگه فایل جدیدی نداریم، فقط بقیه فیلدها رو آپدیت کن
    const updatedHotel = await this.hotelRepository.save({
      ...hotel,
      ...hotelData,
    });

    await this.invalidateHotelCache();
    this.logger.log(`Hotel with id ${hotelId} updated`);
    return updatedHotel;
  }

  public async deleteHotel(hotelId: number, userId: number) {
    const hotel = await this.findHotelById(hotelId);

    if (hotel.ownerId !== userId) {
      throw new ForbiddenException('شما صاحب هتل نیستید');
    }

    await this.galleryManager.releaseImages(hotel.galleryImages);
    await this.hotelRepository.delete(hotelId);
    await this.invalidateHotelCache();

    this.logger.log(`Hotel with id ${hotelId} deleted`);
  }

  private async invalidateHotelCache(): Promise<void> {
    try {
      // پیدا کردن کلیدهای مربوط به همه هتل‌ها و هتل‌های بر اساس شهر
      const allHotelKeys = await this.redisService.keys('hotel:all:*');
      const cityHotelKeys = await this.redisService.keys('hotel:city:*');

      const keys = [...allHotelKeys, ...cityHotelKeys];

      if (keys.length > 0) {
        await Promise.all(keys.map((key) => this.redisService.del(key)));
        this.logger.log(`Invalidated ${keys.length} cache keys`);
      }
    } catch (error) {
      this.logger.error('Failed to invalidate hotel cache', error);
    }
  }
}
