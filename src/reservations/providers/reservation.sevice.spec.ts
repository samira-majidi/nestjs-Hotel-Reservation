// reservation.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, UpdateResult } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { Reservation } from '../entity/reservation.entity';
import { RoomService } from '#src/rooms/providers/room-service/room.service';
import { PricingService } from '#src/rooms/providers/room-service/room-pricings.service';
import { RedisLockService } from '#src/redis/providers/redis-lock.service';
import { RedisService } from '#src/redis/providers/redis.service';
import { ReservationStatus } from '../enums/reservation-status.enum';
import { CreateReservationDto } from '../dtos/create-reservation.dto';
import { RoomStatus } from '#src/rooms/enums/room-status.enum';
import { RoomType } from '#src/rooms/enums/room-type.enum';
import { Hotel } from '#src/hotels/entities/hotel.entity';

const getRelativeDates = () => {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 1);

  const checkOut = new Date();
  checkOut.setDate(checkOut.getDate() + 5);

  return { checkIn, checkOut };
};
describe('ReservationService', () => {
  let service: ReservationService;
  let reservationRepository: jest.Mocked<Repository<Reservation>>;
  let roomService: jest.Mocked<RoomService>;
  let pricingService: jest.Mocked<PricingService>;
  let redisLockService: jest.Mocked<RedisLockService>;
  let redisService: jest.Mocked<RedisService>;

  const { checkIn, checkOut } = getRelativeDates();
  // Mock data
  const mockRoom = {
    id: 'room-123',
    roomNumber: '101',
    type: RoomType.DELUXE,
    basePrice: 100,
    capacity: 2,
    floor: 1,
    amenities: ['WiFi', 'TV'],
    status: RoomStatus.AVAILABLE,
    description: 'Deluxe Room',
    images: [],
    reservations: [],
    pricings: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    hotel: {} as Hotel,
    hotelId: 1,
    dailyPrices: [],
  };

  const mockReservation: Partial<Reservation> = {
    id: 'reservation-123',
    roomId: 'room-123',
    userId: 1,
    checkInDate: new Date('2026-06-01'),
    checkOutDate: new Date('2026-06-05'),
    guestName: 'Ali Ahmadi',
    guestPhone: '09123456789',
    numberOfGuests: 2,
    status: ReservationStatus.PENDING_PAYMENT,
    totalPrice: 5000000,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    room: { ...mockRoom, id: 'room-123' },
    createdAt: new Date(),
  };

  beforeEach(async () => {
    // Mock repository methods
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    // Mock services
    const mockRoomService = {
      findOneRoombyId: jest.fn(),
    };

    const mockPricingService = {
      calculatePrice: jest.fn(),
    };

    const mockRedisLockService = {
      withLock: jest.fn(),
    };

    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        {
          provide: getRepositoryToken(Reservation),
          useValue: mockRepository,
        },
        {
          provide: RoomService,
          useValue: mockRoomService,
        },
        {
          provide: PricingService,
          useValue: mockPricingService,
        },
        {
          provide: RedisLockService,
          useValue: mockRedisLockService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
    reservationRepository = module.get(getRepositoryToken(Reservation));
    roomService = module.get(RoomService);
    pricingService = module.get(PricingService);
    redisLockService = module.get(RedisLockService);
    redisService = module.get(RedisService);

    jest
      .spyOn(service, 'invalidateReservationCache')
      .mockResolvedValue(undefined);

    jest.spyOn(service, 'invalidateRoomCache').mockResolvedValue(undefined);
  });

  /** مرحله ۳: تست متد create() — مسیر موفق */
  describe('create', () => {
    it('should create a reservation successfully', async () => {
      const dto: CreateReservationDto = {
        roomId: 'room-123',

        checkInDate: checkIn,

        checkOutDate: checkOut,

        guestName: 'Ali Ahmadi',

        guestPhone: '09123456789',

        numberOfGuests: 2,

        specialRequests: 'none',
      };

      //‌ آماده‌سازی mocks

      redisLockService.withLock.mockImplementation(async (_key, fn) => fn());

      roomService.findOneRoombyId.mockResolvedValue(mockRoom);

      jest.spyOn(service, 'checkroomAvailibility').mockResolvedValue(true);

      pricingService.calculatePrice.mockResolvedValue(5000000);

      reservationRepository.create.mockReturnValue(
        mockReservation as Reservation,
      );

      reservationRepository.save.mockResolvedValue(
        mockReservation as Reservation,
      );

      const result = await service.create(dto, 1);

      expect(redisLockService.withLock).toHaveBeenCalled();

      expect(roomService.findOneRoombyId).toHaveBeenCalledWith('room-123');

      expect(result).toEqual(mockReservation);
    });

    it('should throw BadRequestException if check-out <= check-in', async () => {
      const dto: CreateReservationDto = {
        roomId: 'room-123',

        checkInDate: checkOut, //تاریخ بزرگ تر

        checkOutDate: checkIn,

        guestName: 'Ali',

        guestPhone: '0912',

        numberOfGuests: 1,

        specialRequests: '',
      };

      await expect(service.create(dto, 1)).rejects.toThrow(BadRequestException);
    });
    it('should throw ConflictException if room not available', async () => {
      const dto: CreateReservationDto = {
        roomId: 'room-123',

        checkInDate: checkIn,

        checkOutDate: checkOut,

        guestName: 'Ali',

        guestPhone: '0912',

        numberOfGuests: 1,

        specialRequests: '',
      };

      redisLockService.withLock.mockImplementation(async (_key, fn) => fn());

      roomService.findOneRoombyId.mockResolvedValue(mockRoom);

      jest.spyOn(service, 'checkroomAvailibility').mockResolvedValue(false);
      await expect(service.create(dto, 1)).rejects.toThrow(ConflictException);
    });
  });
  /** تست عدم موجود بودن اتاق */

  describe('checkroomAvailibility', () => {
    it('should return true when room is available(no overlaping reservation)', async () => {
      const roomId = 'room123';

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      jest
        .spyOn(reservationRepository, 'createQueryBuilder')

        .mockReturnValue(
          mockQueryBuilder as unknown as SelectQueryBuilder<Reservation>,
        );

      const result = await service.checkroomAvailibility(
        roomId,
        checkIn,
        checkOut,
      );

      expect(result).toBe(true);
      expect(reservationRepository.createQueryBuilder).toHaveBeenCalledWith(
        'reservation',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'reservation.roomId = :roomId',
        { roomId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(3);
    });
    it('should return false when room is not available(overlapping reservation)', async () => {
      const roomId = 'room-123';
      const checkIn = new Date('2025-06-01');
      const checkOut = new Date('2025-06-05');

      const overlappingReservation = {
        id: 'reservation-533',
        roomId: 'room-123',
        checkInDate: new Date(checkIn.getTime() - 24 * 60 * 60 * 1000), // یک روز قبل
        checkOutDate: new Date(checkOut.getTime() + 24 * 60 * 60 * 1000), // یک روز بعد
        status: ReservationStatus.CONFIRMED,
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(overlappingReservation),
      };

      jest
        .spyOn(reservationRepository, 'createQueryBuilder')

        .mockReturnValue(
          mockQueryBuilder as unknown as SelectQueryBuilder<Reservation>,
        );

      const result = await service.checkroomAvailibility(
        roomId,
        checkIn,
        checkOut,
      );

      expect(result).toBe(false);
      expect(reservationRepository.createQueryBuilder).toHaveBeenCalledWith(
        'reservation',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'reservation.roomId = :roomId',
        { roomId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(3);
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
    });
  });

  describe('confirmPayment', () => {
    it('should confirm reservation when status is PENDING_PAYMENT', async () => {
      const reservationId = 'reservation-123';

      const updateReservation = {
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
      };

      jest
        .spyOn(service, 'findReservationOrFail')
        .mockResolvedValue(mockReservation as Reservation);
      reservationRepository.save.mockResolvedValue(
        updateReservation as Reservation,
      );
      const result = await service.confirmPayment(reservationId);

      expect(service.findReservationOrFail).toHaveBeenCalledWith(reservationId);
      expect(reservationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: reservationId,
          status: ReservationStatus.CONFIRMED,
        }),
      );
      expect(service.invalidateReservationCache).toHaveBeenCalledWith(
        reservationId,
      );

      expect(service.invalidateRoomCache).toHaveBeenCalledWith(
        mockReservation.room?.id,
      );

      expect(result).toEqual(updateReservation);
      expect(result.status).toBe(ReservationStatus.CONFIRMED);
    });
    it('should throw error if reservation is not pending', async () => {
      const nonPendingReservation = {
        ...mockReservation,
        status: ReservationStatus.CONFIRMED,
      } as Reservation;

      jest
        .spyOn(service, 'findReservationOrFail')
        .mockResolvedValue(nonPendingReservation);

      await expect(service.confirmPayment('reservation-123')).rejects.toThrow(
        BadRequestException,
      );

      expect(reservationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('cancelReservation', () => {
    it('should cancel reservation successfully', async () => {
      const reservationId = 'reservation-123';
      const userId = 1;

      const cancelledReservation = {
        ...mockReservation,
        status: ReservationStatus.CANCELLED,
        cancelledAt: new Date(),
      };

      jest
        .spyOn(service, 'findReservationOrFail')
        .mockResolvedValue(mockReservation as Reservation);

      jest
        .spyOn(service, 'invalidateReservationCache')
        .mockResolvedValue(undefined);

      jest.spyOn(service, 'invalidateRoomCache').mockResolvedValue(undefined);

      reservationRepository.save.mockResolvedValue(
        cancelledReservation as Reservation,
      );

      const result = await service.cancelReservation(reservationId, userId);

      expect(service.findReservationOrFail).toHaveBeenCalledWith(reservationId);

      expect(reservationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: reservationId,
          status: ReservationStatus.CANCELLED,
        }),
      );

      expect(service.invalidateReservationCache).toHaveBeenCalledWith(
        reservationId,
      );

      expect(service.invalidateRoomCache).toHaveBeenCalledWith(
        mockReservation.room?.id,
      );

      expect(result.status).toBe(ReservationStatus.CANCELLED);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const reservationId = 'reservation-123';

      const reservation = {
        ...mockReservation,
        userId: 2,
      };

      jest
        .spyOn(service, 'findReservationOrFail')
        .mockResolvedValue(reservation as Reservation);

      await expect(service.cancelReservation(reservationId, 1)).rejects.toThrow(
        ForbiddenException,
      );

      expect(reservationRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if reservation already cancelled', async () => {
      const reservationId = 'reservation-123';

      const reservation = {
        ...mockReservation,
        status: ReservationStatus.CANCELLED,
      };

      jest
        .spyOn(service, 'findReservationOrFail')
        .mockResolvedValue(reservation as Reservation);

      await expect(service.cancelReservation(reservationId, 1)).rejects.toThrow(
        BadRequestException,
      );

      expect(reservationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('autoCancelexpiredReservation', () => {
    const fixedDate = new Date('2026-01-01T10:00:00Z');

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(fixedDate);
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.clearAllMocks();
    });

    it('should cancel expired reservations and clear cache', async () => {
      reservationRepository.update.mockResolvedValue({
        affected: 2,
      } as UpdateResult);

      await service.autoCancelexpiredReservation();

      expect(reservationRepository.update).toHaveBeenCalledTimes(1);

      const [where, payload] = reservationRepository.update.mock.calls[0];

      expect(where).toMatchObject({
        status: ReservationStatus.PENDING_PAYMENT,
      });

      expect(payload).toMatchObject({
        status: ReservationStatus.CANCELLED,
        cancelledAt: fixedDate,
      });

      expect(redisService.del).toHaveBeenCalledWith('reservations:all');
    });

    it('should not clear cache if no reservation was cancelled', async () => {
      reservationRepository.update.mockResolvedValue({
        affected: 0,
      } as UpdateResult);

      await service.autoCancelexpiredReservation();

      expect(redisService.del).not.toHaveBeenCalled();
    });
  });
});
