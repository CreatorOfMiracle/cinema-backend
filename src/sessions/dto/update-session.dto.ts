import { Type } from 'class-transformer';
import { IsISO8601, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { DurationDto } from './duration.dto';

export class UpdateSessionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  movieTitle?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsISO8601()
  startsAt?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  hallId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DurationDto)
  duration?: DurationDto;
}

