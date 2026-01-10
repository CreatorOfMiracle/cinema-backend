import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { MoveBookingDto } from './dto/move-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateBookingDto) {
    const booking = await this.bookingsService.createOrAdd(dto);
    return { booking };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateBookingDto) {
    const booking = await this.bookingsService.update(id, dto);
    return { booking };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.bookingsService.delete(id);
  }

  @Post(':id/move')
  @HttpCode(HttpStatus.OK)
  async move(@Param('id') id: string, @Body() dto: MoveBookingDto) {
    const booking = await this.bookingsService.move(id, dto.targetSessionId);
    return { booking };
  }
}
