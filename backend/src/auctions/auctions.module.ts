import { Module } from '@nestjs/common';
import { ListingsModule } from '../listings/listings.module';
import { AuctionsController } from './auctions.controller';
import { AuctionsGateway } from './auctions.gateway';
import { AuctionsScheduler } from './auctions.scheduler';
import { AuctionsService } from './auctions.service';

@Module({
  imports: [ListingsModule],
  controllers: [AuctionsController],
  providers: [AuctionsService, AuctionsGateway, AuctionsScheduler],
  exports: [AuctionsService],
})
export class AuctionsModule {}
