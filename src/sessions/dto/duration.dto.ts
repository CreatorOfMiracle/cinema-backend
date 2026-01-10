import { IsInt, IsOptional, Min } from 'class-validator';

export class DurationDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  hours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;
}

