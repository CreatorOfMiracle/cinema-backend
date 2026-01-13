import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { SessionBookingsController } from './session-bookings.controller';

@Module({
  controllers: [BookingsController, SessionBookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}

