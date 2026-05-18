import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomPricing } from '#src/rooms/entity/room-pricing.entity';
import { Repository } from 'typeorm';
import { RoomService } from './room.service';
import { CreateRoomPricingDto } from '#src/rooms/dtos/pricing-room.dto';
import { UpdateRoomPricingDto } from '#src/rooms/dtos/update-room-pricing.dto';
import { DailyPrice } from '#src/rooms/entity/daily-price.entity';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(RoomPricing)
    private pricingRepository: Repository<RoomPricing>,
    @InjectRepository(DailyPrice)
    private readonly dailyPriceRepository: Repository<DailyPrice>,
    private roomsService: RoomService,
  ) {}

  async createRoomPricing(
    createRoomPricingDto: CreateRoomPricingDto,
    roomId: string,
  ): Promise<RoomPricing> {
    await this.roomsService.findOneRoombyId(roomId);

    if (
      new Date(createRoomPricingDto.startDate) >=
      new Date(createRoomPricingDto.endDate)
    ) {
      throw new BadRequestException('تاریخ شروع باید قبل از تاریخ پایان باشد');
    }

    const pricing = this.pricingRepository.create({
      ...createRoomPricingDto,
      roomId,
    });

    return this.pricingRepository.save(pricing);
  }

  async findRoomPricingByRoom(roomId: string): Promise<RoomPricing[]> {
    return this.pricingRepository.find({
      where: { roomId },
      order: { priority: 'DESC' },
    });
  }
  async findOneRoomPrice(id: string): Promise<RoomPricing> {
    const pricing = await this.pricingRepository.findOne({ where: { id } });
    if (!pricing) {
      throw new NotFoundException('قیمت‌گذاری یافت نشد');
    }
    return pricing;
  }

  async updateRoomPriccing(
    id: string,
    updateRoomPricingDto: UpdateRoomPricingDto,
  ): Promise<RoomPricing> {
    const pricing = await this.findOneRoomPrice(id);
    Object.assign(pricing, updateRoomPricingDto);
    return this.pricingRepository.save(pricing);
  }
  async removeroompricing(id: string): Promise<void> {
    const pricing = await this.findOneRoomPrice(id);
    await this.pricingRepository.remove(pricing);
  }
  async generateDaliyPrice(roomId: string): Promise<void> {
    await this.dailyPriceRepository.delete({ roomId });

    const pricings = await this.findRoomPricingByRoom(roomId);
    const room = await this.roomsService.findOneRoombyId(roomId);

    const dailyPrices: Partial<DailyPrice>[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      let price = room.basePrice;
      let source = 'BASE_PRICE';

      // حلقه داخلی: چک تمام قوانین برای روز 365
      for (const pricing of pricings) {
        const start = new Date(pricing.startDate);
        const end = new Date(pricing.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        if (date >= start && date <= end) {
          price = pricing.price;
          source = pricing.type;
          break; // ← چون براساس priority مرتب شده، اولین match همون بهترینه
        }
      }

      dailyPrices.push({
        roomId,
        date,
        price,
        source,
      });
    }
    dailyPrices.sort((a, b) => a.date!.getTime() - b.date!.getTime());

    await this.dailyPriceRepository.save(dailyPrices, { chunk: 100 });
  }
  async removeDailyPrice(roomId: string) {
    await this.dailyPriceRepository.delete(roomId);
  }
  async calculatePrice(
    roomId: string,
    checkIn: Date,
    checkOut: Date,
  ): Promise<number> {
    const result = await this.dailyPriceRepository
      .createQueryBuilder('dp')
      .select('SUM(dp.price)', 'total')
      .where('dp.roomId = :roomId', { roomId })
      .andWhere('dp.date >= :checkIn', { checkIn })
      .andWhere('dp.date < :checkOut', { checkOut })
      .getRawOne<{ total: string }>();

    return Number(result?.total) || 0;
  }
}
