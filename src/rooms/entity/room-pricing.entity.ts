import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Room } from './room.entity';
import { PricingType } from '../enums/pricing-type.enum';

@Entity('room_pricings')
@Index(['roomId', 'startDate', 'endDate'])
export class RoomPricing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Room, (room) => room.pricings, { onDelete: 'CASCADE' }) // وقتی اتاق پاک شد، قیمت‌هاش هم پاک بشن
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'room_id' })
  roomId: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'enum', enum: PricingType })
  type: PricingType;

  @Column({
    type: 'int',
    default: 1,
    comment: 'Higher value = higher priority',
  })
  priority: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
