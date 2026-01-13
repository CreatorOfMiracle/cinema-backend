import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { ApiErrorException } from '../errors/api-error.exception';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof ApiErrorException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      res.status(status).json(body);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse() as any;
      const message = this.extractMessage(response);
      const code = status === HttpStatus.BAD_REQUEST ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR';
      if (status >= 500) {
        this.logException(exception);
      }
      res.status(status).json({ error: { code, message } });
      return;
    }

    this.logException(exception);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }

  private extractMessage(response: any): string {
    if (!response) return 'Unknown error';
    if (typeof response === 'string') return response;
    if (typeof response.message === 'string') return response.message;
    if (Array.isArray(response.message) && response.message.length > 0) return String(response.message[0]);
    if (typeof response.error === 'string') return response.error;
    return 'Unknown error';
  }

  private logException(exception: unknown) {
    const err = exception as { message?: string; stack?: string };
    this.logger.error(err?.message ?? 'Unhandled exception', err?.stack);
  }
}
