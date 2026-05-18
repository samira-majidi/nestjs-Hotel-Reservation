import { Room } from '../../rooms/entity/room.entity';
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
import { ReservationStatus } from '../enums/reservation-status.enum';
import { User } from '#src/users/user.entity';

@Entity('reservations')
//سیستم باید سریع چک کنه که ایا قبلا توی این تاریخ ها رزروی وجود داره
//این سرعت رو چند برابر میکنه
//رزرو های منقضی هم باید زود پیدا بشن
// هرکدام برای یک نوع QUERY کاملا متفاوت استفاده میشنپس باید جدا باشن
@Index(['roomId', 'checkInDate', 'checkOutDate']) //برای سریع تر کردن query
@Index(['status', 'expiresAt'])
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Room, (room) => room.reservations)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'room_id' })
  roomId: string;

  @Column()
  guestName: string;
  /*
  @Column()
  guestEmail: string;
*/
  @Column({ nullable: true })
  guestPhone: string;

  @Column({ type: 'date' })
  checkInDate: Date;

  @Column({ type: 'date' })
  checkOutDate: Date;

  @Column({ type: 'int' })
  numberOfGuests: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING_PAYMENT,
  })
  status: ReservationStatus;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ nullable: true })
  paymentId: string;

  @Column({ type: 'text', nullable: true })
  specialRequests: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.reservations, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;
}
