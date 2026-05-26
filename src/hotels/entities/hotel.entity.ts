import { Upload } from '#src/common/upload/entity/upload.entity';
import { City } from '#src/city/entities/city.entity';
import { Room } from '#src/rooms/entity/room.entity';
import { User } from '#src/users/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Amenity } from '#src/amenity/entity/amenity.entity';
@Entity()
@Index(['id'])
export class Hotel {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'varchar', length: 128, nullable: false })
  name: string;

  @ManyToOne(() => City, (city) => city.hotels)
  @JoinColumn({ name: 'cityId' })
  city: City;

  @Column()
  cityId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: false }) // دقیقاً ۲۵۵ کاراکتر
  address: string;
  @Column({ type: 'int', default: 1 }) // اضافه شدن فیلد ستاره با پیش‌فرض ۱
  stars: number;
  @Column({ type: 'text', nullable: false })
  description: string;

  @ManyToMany(() => Amenity)
  @JoinTable({
    name: 'hotel_amenities',
    joinColumn: { name: 'hotelId' },
    inverseJoinColumn: { name: 'amenityId' },
  })
  amenities: Amenity[];

  @ManyToOne(() => User, (user) => user.hotel)
  @JoinColumn({ name: 'ownerId' })
  owner: User;
  @Column()
  ownerId: number;

  @OneToMany(() => Room, (room) => room.hotel)
  rooms: Room[];

  @ManyToMany(() => Upload)
  @JoinTable({
    name: 'hotel_gallery',
    joinColumn: { name: 'hotelId' },
    inverseJoinColumn: { name: 'fileId' },
  })
  galleryImages: Upload[];
}
