import { Hotel } from '#src/hotels/entities/hotel.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class City {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string;

  @OneToMany(() => Hotel, (hotel) => hotel.city)
  hotels: Hotel[];
}
