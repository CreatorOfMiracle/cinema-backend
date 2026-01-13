import { IsNotEmpty, IsString } from 'class-validator';

export class MoveBookingDto {
  @IsString()
  @IsNotEmpty()
  targetSessionId!: string;
}

