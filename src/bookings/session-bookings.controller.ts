import { Controller, Get, Param } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller('sessions')
export class SessionBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get(':id/bookings')
  async list(@Param('id') sessionId: string) {
    const bookings = await this.bookingsService.listBySession(sessionId);
    return { bookings };
  }
}

