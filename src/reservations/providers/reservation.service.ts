import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { RedisLockService } from 'src/redis/providers/redis-lock.service';
import { RedisService } from 'src/redis/providers/redis.service';
import { LessThan, Repository } from 'typeorm';
import { Reservation } from '../entity/reservation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateReservationDto } from '../dtos/create-reservation.dto';
import { ReservationStatus } from '../enums/reservation-status.enum';
import { RoomService } from 'src/rooms/providers/room-service/room.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);
  private readonly CACHE_TTL = 300;
  private readonly LOCK_TTL = 10000;

  constructor(
    @InjectRepository(Reservation)
    private reservaionRepository: Repository<Reservation>,
    private readonly roomService: RoomService,

    private readonly redislockService: RedisLockService,
    private readonly redisService: RedisService,
  ) {}

  async create(
    createReservationDto: CreateReservationDto,
  ): Promise<Reservation> {
    const {
      roomId,
      checkInDate,
      checkOutDate,
      guestName,
      guestEmail,
      guestPhone,
    } = createReservationDto;

    if (new Date(checkInDate) >= new Date(checkOutDate)) {
      throw new BadRequestException(
        'Check-out date must be after check-in date',
      );
    }
    const lockKey = `room:lock:${roomId}`;
    return this.redislockService.withLock(
      lockKey,
      async () => {
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

        const reservation = this.reservaionRepository.create({
          room,
          checkInDate: new Date(checkInDate),
          checkOutDate: new Date(checkOutDate),
          guestName: guestName,
          guestEmail: guestEmail,
          guestPhone: guestPhone,
          status: ReservationStatus.PENDING_PAYMENT,
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

  private async invalidateReservationCache(id: string) {
    await this.redisService.del(`reservation:${id}`);
  }
  private async invalidateAllReservationCache() {
    await this.redisService.del('reservation:all');
  }
  private async invalidateRoomCache(roomId: string) {
    await this.redisService.del(`room:${roomId}`);
    await this.invalidateAllReservationCache();
  }
  private async findReservationOrFail(id: string): Promise<Reservation> {
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
      .andWhere('reservation.status =: status', {
        status: ReservationStatus.CONFIRMED,
      })
      .andWhere('reservation.checkInDate < : checkOut', { checkOut })
      .andWhere('reservation.checkOutDate >:checkIn', {
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

  async cancelReservation(id: string): Promise<Reservation> {
    const reservation = await this.findReservationOrFail(id);
    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException('Reservation already cancelled');
    }

    reservation.status = ReservationStatus.CANCELLED;
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
        createdAt: LessThan(new Date(now.getTime() - 60 * 60 * 1000)),
      },
      { status: ReservationStatus.CANCELLED },
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

/**bulk update
await repository.update(
  criteria,    // ← شرط‌ها (WHERE)
  partialEntity // ← تغییرات (SET)
);

 * loop+save
 * async cancelExpiredReservations() {
  const expired = await this.reservationRepo.find({
    where: {
      status: ReservationStatus.PENDING,
      expiresAt: LessThan(new Date()),
    },
  });

  // ❌ 
  for (const reservation of expired) {
    reservation.status = ReservationStatus.CANCELLED;
    await this.reservationRepo.save(reservation); // ← کوئری جداگانه
  }
}
 */
