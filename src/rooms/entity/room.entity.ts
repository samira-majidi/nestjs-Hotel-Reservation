import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { RoomStatus } from '../enums/room-status.enum';
import { RoomType } from '../enums/room-type.enum';

import { Reservation } from 'src/reservations/entity/reservation.entity';
import { RoomPricing } from './room-pricing.entity';
import { Hotel } from 'src/hotels/entities/hotel.entity';
import { DailyPrice } from './daily-price.entity';

@Entity('rooms')
@Unique(['hotelId', 'roomNumber'])
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  roomNumber: string;

  @Column({ type: 'enum', enum: RoomType })
  type: RoomType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'int', default: 1 })
  floor: number;

  @Column({ type: 'simple-array', nullable: true })
  amenities: string[];

  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.AVAILABLE })
  status: RoomStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @OneToMany(() => Reservation, (reservation) => reservation.room)
  reservations: Reservation[];

  @OneToMany(() => RoomPricing, (pricing) => pricing.room)
  pricings: RoomPricing[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Hotel, (hotel) => hotel.rooms)
  @JoinColumn({ name: 'hotelId' })
  hotel: Hotel;

  @Column()
  hotelId: number;

  @OneToMany(() => DailyPrice, (dailyPrice) => dailyPrice.room)
  dailyPrices: DailyPrice[];
}
