import { AmenityType } from '../type/amenity-type.enum';

export const AMENITY_SEED_DATA = [
  // Sport
  {
    name: 'Indoor Swimming Pool',
    type: AmenityType.SPORT,
    description: 'Heated indoor pool',
  },
  {
    name: 'Outdoor Swimming Pool',
    type: AmenityType.SPORT,
    description: 'Seasonal outdoor pool',
  },
  {
    name: 'Gym',
    type: AmenityType.SPORT,
    description: 'Fully equipped fitness center',
  },
  { name: 'Sauna', type: AmenityType.SPORT },
  { name: 'Jacuzzi', type: AmenityType.SPORT },
  { name: 'Tennis Court', type: AmenityType.SPORT },
  { name: 'Billiard Table', type: AmenityType.SPORT },
  { name: 'Table Tennis', type: AmenityType.SPORT },

  // Welfare
  { name: 'Restaurant', type: AmenityType.WELFARE },
  { name: 'Coffee Shop', type: AmenityType.WELFARE },
  { name: '24h Room Service', type: AmenityType.WELFARE },
  { name: 'Free Parking', type: AmenityType.WELFARE },
  { name: 'Covered Parking', type: AmenityType.WELFARE },
  { name: 'Free Wi-Fi', type: AmenityType.WELFARE },
  { name: 'Free Breakfast', type: AmenityType.WELFARE },
  { name: 'Lobby', type: AmenityType.WELFARE },
  { name: 'Elevator', type: AmenityType.WELFARE },
  { name: '24h Reception', type: AmenityType.WELFARE },
  { name: 'Concierge Service', type: AmenityType.WELFARE },
  { name: 'Valet Parking', type: AmenityType.WELFARE },
  { name: 'Luggage Storage', type: AmenityType.WELFARE },
  { name: 'Ironing Service', type: AmenityType.WELFARE },
  { name: 'Laundry Service', type: AmenityType.WELFARE },
  { name: 'Taxi Service', type: AmenityType.WELFARE },
  { name: 'Smoking Room', type: AmenityType.WELFARE },
  { name: 'Pet Friendly', type: AmenityType.WELFARE },

  // Recreational
  { name: 'Cinema', type: AmenityType.RECREATIONAL },
  { name: 'Kids Club', type: AmenityType.RECREATIONAL },
  { name: 'Playground', type: AmenityType.RECREATIONAL },
  {
    name: 'Game Room',
    type: AmenityType.RECREATIONAL,
    description: 'PlayStation and board games',
  },
  { name: 'Library', type: AmenityType.RECREATIONAL },
  { name: 'Garden', type: AmenityType.RECREATIONAL },
  { name: 'Rooftop Terrace', type: AmenityType.RECREATIONAL },
  { name: 'Meeting Room', type: AmenityType.RECREATIONAL },
  { name: 'Conference Hall', type: AmenityType.RECREATIONAL },

  // Room
  { name: 'TV', type: AmenityType.ROOM },
  { name: 'Refrigerator', type: AmenityType.ROOM },
  { name: 'Mini Bar', type: AmenityType.ROOM },
  { name: 'Electric Kettle', type: AmenityType.ROOM },
  { name: 'Hair Dryer', type: AmenityType.ROOM },
  { name: 'Telephone', type: AmenityType.ROOM },
  { name: 'Safe Box', type: AmenityType.ROOM },
  { name: 'Air Conditioning', type: AmenityType.ROOM },
  { name: 'Window', type: AmenityType.ROOM },
  { name: 'Balcony', type: AmenityType.ROOM },
  { name: 'Bathroom', type: AmenityType.ROOM },
  { name: 'Shower', type: AmenityType.ROOM },
  { name: 'Bathtub', type: AmenityType.ROOM },
  { name: 'Free Toiletries', type: AmenityType.ROOM },
  { name: 'Towels', type: AmenityType.ROOM },
  { name: 'Slippers', type: AmenityType.ROOM },
  { name: 'Work Desk', type: AmenityType.ROOM },
];
