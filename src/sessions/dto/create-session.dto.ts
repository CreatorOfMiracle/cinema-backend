import { Type } from 'class-transformer';
import { IsISO8601, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { DurationDto } from './duration.dto';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  movieTitle!: string;

  @IsString()
  @IsNotEmpty()
  @IsISO8601()
  startsAt!: string;

  @IsString()
  @IsNotEmpty()
  hallId!: string;

  @ValidateNested()
  @Type(() => DurationDto)
  duration!: DurationDto;
}

