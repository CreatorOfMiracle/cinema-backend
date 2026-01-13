import { Controller, Get } from '@nestjs/common';
import { HallsService } from './halls.service';

@Controller('halls')
export class HallsController {
  constructor(private readonly hallsService: HallsService) {}

  @Get()
  async list() {
    const halls = await this.hallsService.list();
    return { halls };
  }
}

