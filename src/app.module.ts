import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HallsModule } from './halls/halls.module';
import { SessionsModule } from './sessions/sessions.module';
import { BookingsModule } from './bookings/bookings.module';

@Module({
  imports: [PrismaModule, HallsModule, SessionsModule, BookingsModule],
})
export class AppModule {}

