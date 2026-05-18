import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { RedisLockService } from '#src/redis/providers/redis-lock.service';
import { RedisService } from '#src/redis/providers/redis.service';
import { LessThan, Repository } from 'typeorm';
import { Reservation } from '../entity/reservation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateReservationDto } from '../dtos/create-reservation.dto';
import { ReservationStatus } from '../enums/reservation-status.enum';
import { RoomService } from '#src/rooms/providers/room-service/room.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PricingService } from '#src/rooms/providers/room-service/room-pricings.service';

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);
  private readonly CACHE_TTL = 300;
  private readonly LOCK_TTL = 10000;

  constructor(
    @InjectRepository(Reservation)
    private reservaionRepository: Repository<Reservation>,
    private readonly roomService: RoomService,
    private readonly pricingService: PricingService,

    private readonly redislockService: RedisLockService,
    private readonly redisService: RedisService,
  ) {}

  async create(
    createReservationDto: CreateReservationDto,
    userId: number,
  ): Promise<Reservation> {
    const {
      roomId,
      checkInDate,
      checkOutDate,
      guestName,
      guestPhone,
      numberOfGuests,
      specialRequests,
    } = createReservationDto;

    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      throw new BadRequestException(
        'Check-out date must be after check-in date',
      );
    }
    const lockKey = `room:lock:${roomId}`;
    return this.redislockService.withLock(
      lockKey,
      async () => {
        this.logger.log(`Starting reservation for room ${roomId}`);
        const room = await this.roomService.findOneRoombyId(roomId);
        const isAvailable = await this.checkroomAvailibility(
          roomId,
          new Date(checkInDate),
          new Date(checkOutDate),
        );
        if (!isAvailable) {
          throw new ConflictException(
            'Room is not available for the selected dates',
          );
        }
        const totalPrice = await this.pricingService.calculatePrice(
          roomId,
          checkInDate,
          checkOutDate,
        );
        const reservation = this.reservaionRepository.create({
          room,
          userId: userId,
          checkInDate: new Date(checkInDate),
          checkOutDate: new Date(checkOutDate),
          guestName: guestName,
          // guestEmail: guestEmail,
          guestPhone: guestPhone,
          numberOfGuests,
          specialRequests,
          status: ReservationStatus.PENDING_PAYMENT,
          totalPrice: totalPrice,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 ساعت بعد
        });
        const saved = await this.reservaionRepository.save(reservation);
        await this.invalidateRoomCache(roomId);
        this.logger.log(`Reservation created: ${saved.id}`);

        return saved;
      },
      this.LOCK_TTL,
    );
  }

  async findAll(): Promise<Reservation[]> {
    const cacheKey = 'reservations:all';

    const cached = await this.redisService.get<Reservation[]>(cacheKey);

    if (cached) {
      this.logger.debug('Cache hit: all reservations');
      return cached;
    }

    const reservations = await this.reservaionRepository.find({
      relations: ['room'],
      order: {
        createdAt: 'DESC',
      },
    });
    await this.redisService.set(cacheKey, reservations, this.CACHE_TTL);

    return reservations;
  }

  async findOne<Reservation>(id: string) {
    const cacheKey = `reservation:${id}`;
    const cached = await this.redisService.get<Reservation>(cacheKey);

    if (cached) {
      this.logger.debug('cached hit : one reservation');
      return cached;
    }

    const reservation = await this.findReservationOrFail(id);
    await this.redisService.set(cacheKey, reservation, this.CACHE_TTL);
    return reservation;
  }

  async invalidateReservationCache(id: string) {
    await this.redisService.del(`reservation:${id}`);
  }
  async invalidateAllReservationCache() {
    await this.redisService.del('reservation:all');
  }
  async invalidateRoomCache(roomId: string) {
    await this.redisService.del(`room:${roomId}`);
    await this.invalidateAllReservationCache();
  }
  async findReservationOrFail(id: string): Promise<Reservation> {
    const reservation = await this.reservaionRepository.findOne({
      where: { id },
      relations: ['room'],
    });
    if (!reservation) {
      throw new NotFoundException(`reservation with ID${id} not found`);
    }

    return reservation;
  }

  //همیشه دسترسی رو موقع رزرو چک کن
  //محاسبهreal time
  async checkroomAvailibility(
    roomId: string,
    checkIn: Date,
    checkOut: Date,
  ): Promise<boolean> {
    const overlapping = await this.reservaionRepository
      .createQueryBuilder('reservation')
      .where('reservation.roomId = :roomId', { roomId })
      .andWhere('reservation.status IN (:...statuses)', {
        statuses: [
          ReservationStatus.PENDING_PAYMENT,
          ReservationStatus.CONFIRMED,
        ],
      })
      .andWhere('reservation.checkInDate < :checkOut', { checkOut })
      .andWhere('reservation.checkOutDate > :checkIn', {
        checkIn,
      })
      .getOne();
    return !overlapping;
  }

  async confirmPayment(id: string): Promise<Reservation> {
    const reservation = await this.findReservationOrFail(id);

    if (reservation.status !== ReservationStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        'Only pending reservations can be confirmed',
      );
    }
    reservation.status = ReservationStatus.CONFIRMED;

    const update = await this.reservaionRepository.save(reservation);

    await this.invalidateReservationCache(id);
    await this.invalidateRoomCache(reservation.room.id);
    this.logger.log(`payment comfirmed for reservation${id}`);
    return update;
  }

  async cancelReservation(id: string, userId: number): Promise<Reservation> {
    const reservation = await this.findReservationOrFail(id);
    if (reservation.userId !== userId) {
      throw new ForbiddenException(
        'you ae not allowed to cancel this reservation',
      );
    }
    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException('Reservation already cancelled');
    }

    reservation.status = ReservationStatus.CANCELLED;
    reservation.cancelledAt = new Date();
    const update = await this.reservaionRepository.save(reservation);
    await this.invalidateReservationCache(id);
    await this.invalidateRoomCache(reservation.room.id);

    this.logger.log(`Reservation cancelled: ${id}`);
    return update;
  }
  @Cron(CronExpression.EVERY_HOUR)
  async autoCancelexpiredReservation() {
    const now = new Date();

    const result = await this.reservaionRepository.update(
      {
        status: ReservationStatus.PENDING_PAYMENT,
        expiresAt: LessThan(now),
      },
      { status: ReservationStatus.CANCELLED, cancelledAt: now },
    );
    const affectedCount = result.affected ?? 0;
    if (affectedCount) {
      this.logger.warn(
        `Auto-cancelled ${result.affected} expired reservations`,
      );
      await this.redisService.del('reservations:all');
    }
  }
}
