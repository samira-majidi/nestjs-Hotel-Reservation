import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Unique,
  JoinColumn,
} from 'typeorm';
import { Room } from './room.entity';

@Entity('daily_prices')
@Unique(['room', 'date']) // جلوگیری از duplicate data
export class DailyPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Room, (room) => room.dailyPrices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'room_id' })
  roomId: string; // چون Room.id از نوع string (uuid) است، این هم string درست است

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'decimal', precision: 12, scale: 0 })
  price: number;

  @Column({ nullable: true })
  source: string; //دیباگ. وقتی  قیمت اشتباهه میدونم از کجا اومده

  @CreateDateColumn()
  createdAt: Date;
}
