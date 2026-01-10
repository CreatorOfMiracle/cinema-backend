import { Injectable } from '@nestjs/common';
import type { Hall, Session } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TECHNICAL_PAUSE_MINUTES } from '../config/constants';
import { ApiErrorException } from '../common/errors/api-error.exception';
import { CreateSessionDto } from './dto/create-session.dto';
import { DurationDto } from './dto/duration.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

type SessionDto = {
  id: string;
  movieTitle: string;
  startsAt: string;
  durationMinutes: number;
  hall: { id: string; name: string; capacity: number };
  bookingsCount: number;
  bookedTickets: number;
};

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<SessionDto[]> {
    const sessions = await this.prisma.session.findMany({
      include: { hall: true },
      orderBy: { startsAt: 'asc' },
    });

    const agg = await this.prisma.booking.groupBy({
      by: ['sessionId'],
      _count: { _all: true },
      _sum: { tickets: true },
    });

    const bySessionId = new Map(
      agg.map((a) => [
        a.sessionId,
        { bookingsCount: a._count._all, bookedTickets: a._sum.tickets ?? 0 },
      ]),
    );

    return sessions.map((s) => this.toDto(s, s.hall, bySessionId.get(s.id)));
  }

  async create(dto: CreateSessionDto): Promise<SessionDto> {
    const startsAt = this.parseStartsAt(dto.startsAt);
    const durationMinutes = this.parseDurationMinutes(dto.duration);

    const hall = await this.prisma.hall.findUnique({ where: { id: dto.hallId } });
    if (!hall) throw ApiErrorException.hallNotFound();

    await this.ensureNoConflict({ hallId: hall.id, startsAt, durationMinutes });

    const session = await this.prisma.session.create({
      data: {
        movieTitle: dto.movieTitle,
        startsAt,
        durationMinutes,
        hallId: hall.id,
      },
    });

    return this.toDto(session, hall, { bookingsCount: 0, bookedTickets: 0 });
  }

  async update(id: string, dto: UpdateSessionDto): Promise<SessionDto> {
    if (!dto.movieTitle && !dto.startsAt && !dto.hallId && !dto.duration) {
      throw ApiErrorException.validation('Нужно передать хотя бы одно поле для обновления.');
    }

    const current = await this.prisma.session.findUnique({ where: { id }, include: { hall: true } });
    if (!current) throw ApiErrorException.sessionNotFound();

    const hallId = dto.hallId ?? current.hallId;
    const hall = hallId === current.hallId ? current.hall : await this.prisma.hall.findUnique({ where: { id: hallId } });
    if (!hall) throw ApiErrorException.hallNotFound();

    const startsAt = dto.startsAt ? this.parseStartsAt(dto.startsAt) : current.startsAt;
    const durationMinutes = dto.duration ? this.parseDurationMinutes(dto.duration) : current.durationMinutes;
    const movieTitle = dto.movieTitle ?? current.movieTitle;

    await this.ensureNoConflict({ hallId, startsAt, durationMinutes, excludeSessionId: id });

    const session = await this.prisma.session.update({
      where: { id },
      data: { hallId, startsAt, durationMinutes, movieTitle },
    });

    const bookedTickets = await this.prisma.booking.aggregate({
      where: { sessionId: id },
      _sum: { tickets: true },
      _count: { _all: true },
    });

    return this.toDto(session, hall, {
      bookingsCount: bookedTickets._count._all,
      bookedTickets: bookedTickets._sum.tickets ?? 0,
    });
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.session.delete({ where: { id } });
    } catch (e: any) {
      if (e?.code === 'P2025') throw ApiErrorException.sessionNotFound();
      throw e;
    }
  }

  private toDto(
    session: Session,
    hall: Hall,
    agg?: { bookingsCount: number; bookedTickets: number },
  ): SessionDto {
    return {
      id: session.id,
      movieTitle: session.movieTitle,
      startsAt: session.startsAt.toISOString(),
      durationMinutes: session.durationMinutes,
      hall: { id: hall.id, name: hall.name, capacity: hall.capacity },
      bookingsCount: agg?.bookingsCount ?? 0,
      bookedTickets: agg?.bookedTickets ?? 0,
    };
  }

  private parseStartsAt(startsAtIso: string): Date {
    const d = new Date(startsAtIso);
    if (Number.isNaN(d.getTime())) throw ApiErrorException.validation('Некорректное значение startsAt.');
    return d;
  }

  private parseDurationMinutes(duration: DurationDto): number {
    if (duration.durationMinutes !== undefined) return duration.durationMinutes;
    const hours = duration.hours ?? 0;
    const minutes = duration.minutes ?? 0;
    const total = hours * 60 + minutes;
    if (total <= 0) throw ApiErrorException.validation('Некорректная продолжительность сеанса.');
    return total;
  }

  private async ensureNoConflict(params: {
    hallId: string;
    startsAt: Date;
    durationMinutes: number;
    excludeSessionId?: string;
  }) {
    const sessions = await this.prisma.session.findMany({
      where: { hallId: params.hallId, NOT: params.excludeSessionId ? { id: params.excludeSessionId } : undefined },
      select: { id: true, startsAt: true, durationMinutes: true },
    });

    const pauseMs = TECHNICAL_PAUSE_MINUTES * 60_000;
    const newStart = params.startsAt.getTime();
    const newEnd = newStart + params.durationMinutes * 60_000;
    const newEndWithPause = newEnd + pauseMs;

    for (const s of sessions) {
      const existingStart = s.startsAt.getTime();
      const existingEnd = existingStart + s.durationMinutes * 60_000;
      const existingEndWithPause = existingEnd + pauseMs;

      const overlaps = newStart < existingEndWithPause && existingStart < newEndWithPause;
      if (overlaps) throw ApiErrorException.sessionConflict();
    }
  }
}

