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
import { Room } from '#src/rooms/entity/room.entity';

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

    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  public async findById(id: number): Promise<Hotel | null> {
    return this.hotelRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
  }

  public async findAllHotel(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Hotel & { minPrice: number | null }>> {
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 10;
    const skip = (page - 1) * limit;
    const cacheKey = `hotel:all:page:${page}:limit:${limit}`;

    const cached =
      await this.redisService.get<PaginatedResponse<any>>(cacheKey);

    if (cached) {
      this.logger.debug('cache hit : all hotel');
      return cached;
    }

    const [data, total] = await this.hotelRepository.findAndCount({
      relations: ['owner', 'city', 'galleryImages', 'amenities'],
      skip,
      take: limit,
    });

    // --- اضافه شدن کمترین قیمت به هتل‌ها ---
    const hotelsWithMinPrice = await this.attachMinPriceToHotels(data);

    const response = createPaginatedResponse(
      hotelsWithMinPrice,
      total,
      page,
      limit,
    );
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
  async findHotelById(
    hotelId: number,
  ): Promise<Hotel & { minPrice: number | null }> {
    const cacheKey = `hotel:${hotelId}`;

    // اصلاح تایپ کش
    const cached = await this.redisService.get<
      Hotel & { minPrice: number | null }
    >(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit: find one hotel ${hotelId}`);
      return cached;
    }

    const hotel = await this.hotelRepository.findOne({
      where: { id: hotelId },
      relations: ['city', 'rooms', 'galleryImages', 'amenities'],
    });

    if (!hotel) {
      throw new NotFoundException(`Hotel with id ${hotelId} not found`);
    }

    const [hotelWithMinPrice] = await this.attachMinPriceToHotels([hotel]);

    await this.redisService.set(cacheKey, hotelWithMinPrice, this.CACHE_TTL);
    this.logger.log(`Hotel with id ${hotelId} found`);

    return hotelWithMinPrice;
  }
  public async findHotelsByCityId(
    cityId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Hotel & { minPrice: number | null }>> {
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 10;
    const skip = (page - 1) * limit;

    const cacheKey = `hotel:city:${cityId}:page:${page}:limit:${limit}`;

    const cached =
      await this.redisService.get<PaginatedResponse<any>>(cacheKey);

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
      relations: ['owner', 'city', 'galleryImages', 'amenities'],
      skip,
      take: limit,
    });

    // --- اضافه شدن کمترین قیمت به هتل‌ها ---
    const hotelsWithMinPrice = await this.attachMinPriceToHotels(data);

    const response = createPaginatedResponse(
      hotelsWithMinPrice,
      total,
      page,
      limit,
    );
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
      amenities,
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

      const keys = await this.redisService.keys('hotel:*');

      if (keys.length > 0) {
        await Promise.all(keys.map((key) => this.redisService.del(key)));
        this.logger.log(`Invalidated ${keys.length} cache keys`);
      }
    } catch (error) {
      this.logger.error('Failed to invalidate hotel cache', error);
    }
  }
  private async attachMinPriceToHotels(
    hotels: Hotel[],
  ): Promise<(Hotel & { minPrice: number | null })[]> {
    if (hotels.length === 0) {
      return [];
    }

    const hotelIds = hotels.map((hotel) => hotel.id);

    const prices = await this.roomRepository
      .createQueryBuilder('room')
      .select('room.hotelId', 'hotelId')
      .addSelect('MIN(room.basePrice)', 'minPrice')
      .where('room.hotelId IN (:...hotelIds)', { hotelIds })
      .groupBy('room.hotelId')
      .getRawMany<{ hotelId: number; minPrice: string }>(); // getRawMany a string for minPrice

    const priceMap = new Map<number, number>();
    prices.forEach((p) => {
      priceMap.set(p.hotelId, parseFloat(p.minPrice)); // Convert string to number
    });

    return hotels.map((hotel) => ({
      ...hotel,
      minPrice: priceMap.get(hotel.id) || null,
    }));
  }
  public async findRandomHotels(
    limit: number = 4,
  ): Promise<(Hotel & { minPrice: number | null })[]> {
    // مرحله ۱: گرفتن فقط ID هتل‌ها به صورت رندوم (بدون Join برای جلوگیری از ارور DISTINCT)
    const randomHotels = await this.hotelRepository
      .createQueryBuilder('hotel')
      .select('hotel.id')
      .orderBy('RANDOM()') // نکته مهم: اگر Postgres است RANDOM() و اگر MySQL است RAND()
      .limit(limit) // اینجا به جای take از limit استفاده می‌کنیم
      .getMany();

    const ids = randomHotels.map((h) => h.id);

    // اگر هیچ هتلی تو دیتابیس نبود، همون اول آرایه خالی برمی‌گردونیم
    if (ids.length === 0) {
      this.logger.debug(`Fetched 0 random hotels`);
      return [];
    }

    // مرحله ۲: گرفتن اطلاعات کامل هتل‌ها بر اساس IDهای استخراج شده با استفاده از Join
    const data = await this.hotelRepository
      .createQueryBuilder('hotel')
      .leftJoinAndSelect('hotel.city', 'city')
      .leftJoinAndSelect('hotel.galleryImages', 'galleryImages')
      .leftJoinAndSelect('hotel.amenities', 'amenities')
      .where('hotel.id IN (:...ids)', { ids })
      .getMany();

    // مرحله ۳: اضافه کردن کمترین قیمت به هتل‌های پیدا شده
    const hotelsWithMinPrice = await this.attachMinPriceToHotels(data);

    this.logger.debug(`Fetched ${hotelsWithMinPrice.length} random hotels`);
    return hotelsWithMinPrice;
  }
  public async findHotelByOwnerId(userId: number): Promise<Hotel | null> {
    const cacheKey = `hotel:owner:${userId}`;

    // ۱. چک کردن کش (اختیاری ولی برای پرفورمنس عالیه)
    const cached = await this.redisService.get<Hotel>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: find hotel for owner ${userId}`);
      return cached;
    }

    // ۲. پیدا کردن هتل در دیتابیس
    const hotel = await this.hotelRepository.findOne({
      where: { ownerId: userId },
      relations: ['city', 'galleryImages', 'amenities'], // هر ریلیشنی که برای داشبورد نیاز داری
    });

    if (!hotel) {
      // دقت کن اینجا Exception پرت نمی‌کنیم، چون ممکنه کاربر تازه مالک شده باشه و هنوز هتل نساخته باشه
      // پس null برمی‌گردونیم تا فرانت‌بفهمه باید فرم ثبت هتل رو نشون بده
      return null;
    }

    await this.redisService.set(cacheKey, hotel, this.CACHE_TTL);
    this.logger.log(`Hotel for owner ${userId} fetched and cached`);
    return hotel;
  }
}
