import { Hotel } from '../entities/hotel.entity';
import { Repository } from 'typeorm';
import { CreateHotelDto } from '../dtos/create-hotel.dto';
import { City } from 'src/city/entities/city.entity';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginatedResponse } from 'src/common/interface/paginated-response.interface';
import { RedisService } from 'src/redis/providers/redis.service';
import { createPaginatedResponse } from 'src/common/utill/pagination.util';
import { UpdateHotelDto } from '../dtos/update-hotel.dto';

@Injectable()
export class HotelsService {
  private readonly logger = new Logger(HotelsService.name);
  private readonly CACHE_TTL = 300;

  constructor(
    private readonly redisService: RedisService,

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
      relations: ['owner', 'city'],
      skip,
      take: limit,
    });

    const response = createPaginatedResponse(data, total, page, limit);
    await this.redisService.set(cacheKey, response, this.CACHE_TTL);
    this.logger.debug(`Cached data for key: ${cacheKey}`);
    return response;
  }

  public async createHotel(createHotelDto: CreateHotelDto, userId: number) {
    const cityExists = await this.cityRepository.existsBy({
      id: createHotelDto.cityId,
    });

    if (!cityExists) {
      throw new NotFoundException(
        `City with id ${createHotelDto.cityId} not found`,
      );
    }

    const hotel = this.hotelRepository.create({
      ...createHotelDto,
      ownerId: userId,
    });

    const savedHotel = await this.hotelRepository.save(hotel);
    this.logger.log(`Hotel created: ${savedHotel.id}`);
    await this.invalidateHotelCache();
    return savedHotel;
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
      relations: ['owner', 'city', 'rooms'],
    });
    if (!hotel) {
      throw new NotFoundException(`Hotel with id ${hotelId} not found`);
    }
    console.log('🔍 Hotel found:', hotel);

    await this.redisService.set(cacheKey, hotel, this.CACHE_TTL);
    this.logger.log(`Hotel with id ${hotelId} found`);

    return hotel;
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
    const updateHotelData = await this.hotelRepository.save({
      ...hotel,
      ...updatehotelDto,
    });
    await this.invalidateHotelCache();
    this.logger.log(`hotel with id ${hotelId} update`);
    return updateHotelData;
  }
  public async deleteHotel(hotelId: number, userId: number) {
    const hotel = await this.findHotelById(hotelId);

    if (hotel.ownerId !== userId) {
      throw new ForbiddenException('شما صاحب هتل نیستید');
    }

    await this.hotelRepository.delete(hotelId);

    await this.invalidateHotelCache();

    this.logger.log(`Hotel with id ${hotelId} deleted`);
  }

  private async invalidateHotelCache(): Promise<void> {
    try {
      const keys = await this.redisService.keys('hotel:all:*');
      if (keys.length > 0) {
        await Promise.all(keys.map((key) => this.redisService.del(key)));
        this.logger.log(`Invalidated ${keys.length} cache keys`);
      }
    } catch (error) {
      this.logger.error('Failed to invalidate hotel cache', error);
    }
  }
}
