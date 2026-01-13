import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HallsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.hall.findMany({ orderBy: { name: 'asc' } });
  }
}

