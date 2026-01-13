import { HttpException, HttpStatus } from '@nestjs/common';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'HALL_NOT_FOUND'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_CONFLICT'
  | 'BOOKING_NOT_FOUND'
  | 'TICKETS_LIMIT_EXCEEDED'
  | 'HALL_CAPACITY_EXCEEDED'
  | 'MOVIE_MISMATCH'
  | 'INTERNAL_ERROR';

export class ApiErrorException extends HttpException {
  public readonly code: ApiErrorCode;

  constructor(status: number, code: ApiErrorCode, message: string) {
    super({ error: { code, message } }, status);
    this.code = code;
  }

  static validation(message: string) {
    return new ApiErrorException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', message);
  }

  static hallNotFound() {
    return new ApiErrorException(HttpStatus.NOT_FOUND, 'HALL_NOT_FOUND', 'Зал не найден.');
  }

  static sessionNotFound() {
    return new ApiErrorException(HttpStatus.NOT_FOUND, 'SESSION_NOT_FOUND', 'Сеанс не найден.');
  }

  static sessionConflict(message = 'Сеанс пересекается по времени...') {
    return new ApiErrorException(HttpStatus.CONFLICT, 'SESSION_CONFLICT', message);
  }

  static bookingNotFound() {
    return new ApiErrorException(HttpStatus.NOT_FOUND, 'BOOKING_NOT_FOUND', 'Бронь не найдена.');
  }

  static ticketsLimitExceeded(message: string) {
    return new ApiErrorException(HttpStatus.CONFLICT, 'TICKETS_LIMIT_EXCEEDED', message);
  }

  static hallCapacityExceeded(message: string) {
    return new ApiErrorException(HttpStatus.CONFLICT, 'HALL_CAPACITY_EXCEEDED', message);
  }

  static movieMismatch() {
    return new ApiErrorException(
      HttpStatus.CONFLICT,
      'MOVIE_MISMATCH',
      'Перенос возможен только на сеанс с тем же фильмом.',
    );
  }

  static internal() {
    return new ApiErrorException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'INTERNAL_ERROR',
      'Internal server error',
    );
  }
}

