import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hotel } from '../entities/hotel.entity';
import { Room } from '#src/rooms/entity/room.entity'; // اضافه شدن Room
import { GetHotelsFilterDto } from '../dtos/hotel-search.dto';
import { createPaginatedResponse } from '#src/common/utill/pagination.util';
import { ReservationStatus } from '#src/reservations/enums/reservation-status.enum';

@Injectable()
export class HotelsSearchService {
  private readonly logger = new Logger(HotelsSearchService.name);

  constructor(
    @InjectRepository(Hotel)
    private readonly hotelRepository: Repository<Hotel>,

    @InjectRepository(Room) // اینجکت کردن RoomRepository
    private readonly roomRepository: Repository<Room>,
  ) {}

  async searchAndFilter(filterDto: GetHotelsFilterDto) {
    const {
      // پارامترهای فرم جستجو
      cityId,
      checkIn,
      checkOut,
      guests,

      // پارامترهای سایدبار فیلتر
      minPrice,
      maxPrice,
      stars,
      amenities,

      // صفحه‌بندی
      page = 1,
      limit = 10,
    } = filterDto;

    // محاسبه متغیر skip با فرمول $skip = (page - 1) * limit$
    const skip = (page - 1) * limit;

    const qb = this.hotelRepository.createQueryBuilder('hotel');

    // --- Join های پایه ---
    qb.leftJoinAndSelect('hotel.city', 'city')
      .leftJoinAndSelect('hotel.galleryImages', 'galleryImages')
      .leftJoinAndSelect('hotel.amenities', 'hotelAmenities');

    // از اونجایی که جستجوی نفرات، قیمت و تاریخ به اتاق نیاز دارد،
    // فقط هتل‌هایی رو میاریم که حداقل یک اتاق (مطابق با شرایط) داشته باشن.
    qb.innerJoinAndSelect('hotel.rooms', 'room');

    // ==========================================
    // ۱. منطق فرم جستجو (Search Form Logic)
    // ==========================================

    // فیلتر شهر
    if (cityId) {
      qb.andWhere('hotel.cityId = :cityId', { cityId });
    }

    // فیلتر ظرفیت نفرات
    if (guests) {
      qb.andWhere('room.capacity >= :guests', { guests });
    }

    if (checkIn && checkOut) {
      qb.andWhere(
        `NOT EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.room_id = room.id
      AND r."checkInDate" < :checkOut
      AND r."checkOutDate" > :checkIn
      AND r.status IN (:...blockingStatuses)
    )`,
        {
          checkIn,
          checkOut,
          blockingStatuses: [
            ReservationStatus.PENDING_PAYMENT,
            ReservationStatus.CONFIRMED,
          ],
        },
      );
    }

    // ==========================================
    // ۲. منطق فیلترهای سایدبار (Sidebar Filters)
    // ==========================================

    // فیلتر بازه قیمت
    if (minPrice !== undefined) {
      qb.andWhere('room.basePrice >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      qb.andWhere('room.basePrice <= :maxPrice', { maxPrice });
    }

    // فیلتر ستاره‌های هتل
    if (stars && stars.length > 0) {
      qb.andWhere('hotel.stars IN (:...stars)', { stars });
    }

    // فیلتر امکانات هتل
    if (amenities && amenities.length > 0) {
      qb.andWhere(
        `EXISTS (
        SELECT 1 FROM hotel_amenities ha 
        INNER JOIN amenities a ON a.id = ha."amenityId"
        WHERE ha."hotelId" = hotel.id AND a.name IN (:...amenities)
      )`,
        { amenities },
      );
    }
    // ==========================================
    // ۳. صفحه‌بندی و اجرا
    // ==========================================
    qb.skip(skip).take(limit);

    // استفاده از distinct برای جلوگیری از تکرار هتل در خروجی به دلیل Join با چند اتاق
    const [data, total] = await qb.distinct(true).getManyAndCount();

    // --- اضافه شدن محاسبه‌ی قیمت به نتایج فیلتر ---
    const hotelsWithMinPrice = await this.attachMinPriceToHotels(data);

    this.logger.debug(`Found ${total} hotels matching criteria`);

    return createPaginatedResponse(hotelsWithMinPrice, total, page, limit);
  }

  // --- متد الحاق قیمت به هتل‌ها ---
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
      .getRawMany<{ hotelId: number; minPrice: string }>();

    const priceMap = new Map<number, number>();
    prices.forEach((p) => {
      priceMap.set(p.hotelId, parseFloat(p.minPrice));
    });

    return hotels.map((hotel) => ({
      ...hotel,
      minPrice: priceMap.get(hotel.id) || null,
    }));
  }
}
