import { City } from 'src/city/entities/city.entity';
import { Room } from 'src/rooms/entity/room.entity';
import { User } from 'src/users/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
@Entity()
@Index(['id'])
export class Hotel {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'varchar', length: 512, nullable: false })
  name: string;

  @ManyToOne(() => City, (city) => city.hotels)
  @JoinColumn({ name: 'cityId' })
  city: City;

  @Column()
  cityId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  phone: string;

  @Column({ type: 'varchar', nullable: false })
  address: string;
  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({ type: 'json' })
  amenities: string[];

  @ManyToOne(() => User, (user) => user.hotel)
  @JoinColumn({ name: 'ownerId' })
  owner: User;
  @Column()
  ownerId: number;

  @OneToMany(() => Room, (room) => room.hotel)
  rooms: Room[];
}
