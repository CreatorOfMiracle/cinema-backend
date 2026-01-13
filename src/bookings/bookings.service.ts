import { Injectable } from '@nestjs/common';
import type { Booking, Hall, Session } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiErrorException } from '../common/errors/api-error.exception';
import { MAX_TICKETS_PER_PERSON } from '../config/constants';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

type BookingDto = {
  id: string;
  sessionId: string;
  fullName: string;
  tickets: number;
};

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async listBySession(sessionId: string): Promise<BookingDto[]> {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId }, select: { id: true } });
    if (!session) throw ApiErrorException.sessionNotFound();

    const bookings = await this.prisma.booking.findMany({
      where: { sessionId },
      orderBy: { fullName: 'asc' },
    });

    return bookings.map(this.toDto);
  }

  async createOrAdd(dto: CreateBookingDto): Promise<BookingDto> {
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.session.findUnique({
        where: { id: dto.sessionId },
        include: { hall: true },
      });
      if (!session) throw ApiErrorException.sessionNotFound();

      const existing = await tx.booking.findUnique({
        where: { sessionId_fullName: { sessionId: dto.sessionId, fullName: dto.fullName } },
      });

      const nextTicketsForPerson = (existing?.tickets ?? 0) + dto.tickets;
      if (nextTicketsForPerson > MAX_TICKETS_PER_PERSON) {
        throw ApiErrorException.ticketsLimitExceeded(
          `В одни руки не более ${MAX_TICKETS_PER_PERSON} билетов.`,
        );
      }

      const total = await tx.booking.aggregate({
        where: { sessionId: dto.sessionId },
        _sum: { tickets: true },
      });
      const currentTotal = total._sum.tickets ?? 0;
      const nextTotal = currentTotal + dto.tickets;
      if (nextTotal > session.hall.capacity) {
        throw ApiErrorException.hallCapacityExceeded('Недостаточно мест...');
      }

      const booking = existing
        ? await tx.booking.update({
            where: { id: existing.id },
            data: { tickets: nextTicketsForPerson },
          })
        : await tx.booking.create({
            data: {
              sessionId: dto.sessionId,
              fullName: dto.fullName,
              tickets: dto.tickets,
            },
          });

      return this.toDto(booking);
    });
  }

  async update(id: string, dto: UpdateBookingDto): Promise<BookingDto> {
    if (!dto.fullName && dto.tickets === undefined) {
      throw ApiErrorException.validation('Нужно передать хотя бы одно поле для обновления.');
    }

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.booking.findUnique({
        where: { id },
        include: { session: { include: { hall: true } } },
      });
      if (!current) throw ApiErrorException.bookingNotFound();

      const desiredFullName = dto.fullName ?? current.fullName;
      const desiredTickets = dto.tickets ?? current.tickets;

      if (desiredTickets > MAX_TICKETS_PER_PERSON) {
        throw ApiErrorException.ticketsLimitExceeded(
          `В одни руки не более ${MAX_TICKETS_PER_PERSON} билетов.`,
        );
      }

      const total = await tx.booking.aggregate({
        where: { sessionId: current.sessionId },
        _sum: { tickets: true },
      });
      const currentTotal = total._sum.tickets ?? 0;
      const deltaTickets = desiredTickets - current.tickets;
      const nextTotal = currentTotal + deltaTickets;
      if (nextTotal > current.session.hall.capacity) {
        throw ApiErrorException.hallCapacityExceeded('Недостаточно мест...');
      }

      if (desiredFullName === current.fullName) {
        const updated = await tx.booking.update({
          where: { id: current.id },
          data: { tickets: desiredTickets },
        });
        return this.toDto(updated);
      }

      const target = await tx.booking.findUnique({
        where: { sessionId_fullName: { sessionId: current.sessionId, fullName: desiredFullName } },
      });

      if (target) {
        const mergedTickets = target.tickets + desiredTickets;
        if (mergedTickets > MAX_TICKETS_PER_PERSON) {
          throw ApiErrorException.ticketsLimitExceeded(
            `В одни руки не более ${MAX_TICKETS_PER_PERSON} билетов.`,
          );
        }

        const merged = await tx.booking.update({
          where: { id: target.id },
          data: { tickets: mergedTickets },
        });

        await tx.booking.delete({ where: { id: current.id } });
        return this.toDto(merged);
      }

      const updated = await tx.booking.update({
        where: { id: current.id },
        data: { fullName: desiredFullName, tickets: desiredTickets },
      });
      return this.toDto(updated);
    });
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.booking.delete({ where: { id } });
    } catch (e: any) {
      if (e?.code === 'P2025') throw ApiErrorException.bookingNotFound();
      throw e;
    }
  }

  async move(id: string, targetSessionId: string): Promise<BookingDto> {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id },
        include: { session: { include: { hall: true } } },
      });
      if (!booking) throw ApiErrorException.bookingNotFound();

      const targetSession = await tx.session.findUnique({
        where: { id: targetSessionId },
        include: { hall: true },
      });
      if (!targetSession) throw ApiErrorException.sessionNotFound();

      if (targetSession.movieTitle !== booking.session.movieTitle) throw ApiErrorException.movieMismatch();

      const existingInTarget = await tx.booking.findUnique({
        where: { sessionId_fullName: { sessionId: targetSessionId, fullName: booking.fullName } },
      });

      const nextTicketsForPerson = (existingInTarget?.tickets ?? 0) + booking.tickets;
      if (nextTicketsForPerson > MAX_TICKETS_PER_PERSON) {
        throw ApiErrorException.ticketsLimitExceeded(
          `В одни руки не более ${MAX_TICKETS_PER_PERSON} билетов.`,
        );
      }

      const targetTotalAgg = await tx.booking.aggregate({
        where: { sessionId: targetSessionId },
        _sum: { tickets: true },
      });
      const targetTotal = targetTotalAgg._sum.tickets ?? 0;
      const nextTargetTotal = targetTotal + booking.tickets;
      if (nextTargetTotal > targetSession.hall.capacity) {
        throw ApiErrorException.hallCapacityExceeded('Недостаточно мест...');
      }

      if (existingInTarget) {
        const merged = await tx.booking.update({
          where: { id: existingInTarget.id },
          data: { tickets: nextTicketsForPerson },
        });
        await tx.booking.delete({ where: { id: booking.id } });
        return this.toDto(merged);
      }

      const moved = await tx.booking.update({
        where: { id: booking.id },
        data: { sessionId: targetSessionId },
      });
      return this.toDto(moved);
    });
  }

  private toDto(booking: Booking): BookingDto {
    return {
      id: booking.id,
      sessionId: booking.sessionId,
      fullName: booking.fullName,
      tickets: booking.tickets,
    };
  }
}

