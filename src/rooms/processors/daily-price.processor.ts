import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { PricingService } from '../providers/room-service/room-pricings.service';
import bull from 'bull';

@Processor('daily-price')
export class DailyPriceProcessor {
  private readonly logger = new Logger('DailyPriceProcessor');
  constructor(private readonly pricingService: PricingService) {}

  @Process('regenerate')
  async handleRegenerate(job: bull.Job<{ roomId: string }>) {
    const { roomId } = job.data;

    this.logger.log(`start caculate daily price for this room${roomId}`);

    try {
      await this.pricingService.generateDaliyPrice(roomId);
      this.logger.log(`✅ caculating daily price is done${roomId}`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`❌ error in caculation :failed ${error.message}`);
      } else {
        this.logger.error('❌ unknown error', error);
      }
      throw error;
    }
  }
}
