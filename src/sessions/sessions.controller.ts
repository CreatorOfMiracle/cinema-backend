import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  async list() {
    const sessions = await this.sessionsService.list();
    return { sessions };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSessionDto) {
    const session = await this.sessionsService.create(dto);
    return { session };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSessionDto) {
    const session = await this.sessionsService.update(id, dto);
    return { session };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.sessionsService.delete(id);
  }
}
