import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AmenityType } from './type/amenity-type.enum';

@Entity('amenities')
export class Amenity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 64 })
  name: string;

  @Column({ type: 'enum', enum: AmenityType })
  type: AmenityType;

  @Column({ length: 256, nullable: true })
  description: string;
}
