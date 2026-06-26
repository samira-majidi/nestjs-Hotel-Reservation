import { DataSource } from 'typeorm';
import { Room } from '#src/rooms/entity/room.entity';
import { RoomPricing } from '#src/rooms/entity/room-pricing.entity';
import { DailyPrice } from '#src/rooms/entity/daily-price.entity';
import { PricingType } from '#src/rooms/enums/pricing-type.enum';

export default class RoomPricingSeeder {
  // 👈 اینجا Promise<any> رو به Promise<void> تغییر دادیم
  public async run(dataSource: DataSource): Promise<void> {
    const roomRepository = dataSource.getRepository(Room);
    const roomPricingRepository = dataSource.getRepository(RoomPricing);
    const dailyPriceRepository = dataSource.getRepository(DailyPrice);

    // 1. Check if pricings are already seeded
    const existingPricings = await roomPricingRepository.count();
    if (existingPricings > 0) {
      console.log('✨ Room pricings already exist. Skipping seeding...');
      return;
    }

    const rooms = await roomRepository.find();
    if (rooms.length === 0) {
      console.log('❌ Please seed Rooms first!');
      return;
    }

    const pricingsData: RoomPricing[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('⏳ Seeding room pricings and generating daily prices...');

    // 2. Create diverse pricing rules for each room
    for (const room of rooms) {
      const basePrice = Number(room.basePrice);

      // 🔴 Rule 1: Holiday (from today up to the next 15 days) - Priority 10
      const holidayStart = new Date(today);
      const holidayEnd = new Date(today);
      holidayEnd.setDate(today.getDate() + 15);

      const holidayPricing = roomPricingRepository.create({
        roomId: room.id,
        startDate: holidayStart,
        endDate: holidayEnd,
        price: basePrice * 1.5, // 50% increase
        type: PricingType.HOLIDAY,
        priority: 10,
        description: 'Special price increase for holidays and summer',
      });

      // 🟠 Rule 2: Special Event or Festival (Days 10 to 12) - Priority 20 (Highest)
      // Note: This period intentionally overlaps with the holiday to check if the higher priority applies
      const eventStart = new Date(today);
      eventStart.setDate(today.getDate() + 10);
      const eventEnd = new Date(today);
      eventEnd.setDate(today.getDate() + 12);

      const eventPricing = roomPricingRepository.create({
        roomId: room.id,
        startDate: eventStart,
        endDate: eventEnd,
        price: basePrice * 2.0, // 100% increase (double price for busy event days)
        type: PricingType.SPECIAL,
        priority: 20,
        description: 'Special Event or International Exhibition',
      });

      // 🟡 Rule 3: Seasonal - Summer (From day 30 to 90 ahead) - Priority 5
      const summerStart = new Date(today);
      summerStart.setDate(today.getDate() + 30);
      const summerEnd = new Date(today);
      summerEnd.setDate(today.getDate() + 90);

      const summerPricing = roomPricingRepository.create({
        roomId: room.id,
        startDate: summerStart,
        endDate: summerEnd,
        price: basePrice * 1.2, // 20% increase
        type: PricingType.SEASONAL,
        priority: 5,
        description: 'Summer season rates',
      });

      // 🟢 Rule 4: Promotional / Low-season discount (From day 120 to 130 ahead) - Priority 8
      const promoStart = new Date(today);
      promoStart.setDate(today.getDate() + 120);
      const promoEnd = new Date(today);
      promoEnd.setDate(today.getDate() + 130);

      const promoPricing = roomPricingRepository.create({
        roomId: room.id,
        startDate: promoStart,
        endDate: promoEnd,
        price: basePrice * 0.85, // 15% discount (price reduction)
        type: PricingType.HOLIDAY,
        priority: 8,
        description: 'Special discount for low-travel season',
      });

      // Push all rules to the array
      pricingsData.push(
        holidayPricing,
        eventPricing,
        summerPricing,
        promoPricing,
      );
    }

    // Save all rules to the database
    await roomPricingRepository.save(pricingsData);
    console.log(`✅ Successfully seeded ${pricingsData.length} pricing rules!`);

    // 3. Generate daily prices for the next 365 days
    const dailyPricesData: DailyPrice[] = [];

    for (const room of rooms) {
      const roomPricings = pricingsData
        .filter((p) => p.roomId === room.id)
        .sort((a, b) => b.priority - a.priority);

      for (let i = 0; i < 365; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);

        let finalPrice = Number(room.basePrice);
        let finalSource = 'BASE_PRICE';

        for (const pricing of roomPricings) {
          const pStart = new Date(pricing.startDate).setHours(0, 0, 0, 0);
          const pEnd = new Date(pricing.endDate).setHours(0, 0, 0, 0);
          const cDate = currentDate.getTime();

          if (cDate >= pStart && cDate <= pEnd) {
            finalPrice = Number(pricing.price);
            finalSource = pricing.type;
            break;
          }
        }

        dailyPricesData.push(
          dailyPriceRepository.create({
            roomId: room.id,
            date: currentDate,
            price: finalPrice,
            source: finalSource,
          }),
        );
      }
    }

    // 4. Save daily prices in chunks
    const chunkSize = 500;
    for (let i = 0; i < dailyPricesData.length; i += chunkSize) {
      const chunk = dailyPricesData.slice(i, i + chunkSize);
      await dailyPriceRepository.save(chunk);
    }

    console.log(
      `✅ Successfully generated and seeded ${dailyPricesData.length} daily prices for ${rooms.length} rooms!`,
    );
  }
}
