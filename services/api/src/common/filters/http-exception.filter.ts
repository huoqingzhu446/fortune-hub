import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface UnifiedErrorResponse {
  code: number;
  message: string;
  data: null;
  timestamp: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const body = this.buildErrorBody(exception);
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (statusCode >= 500) {
      this.logger.error(
        `[${statusCode}] ${body.message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(statusCode).json(body);
  }

  private buildErrorBody(exception: unknown): UnifiedErrorResponse {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      const message = this.extractMessage(exceptionResponse);

      return {
        code: statusCode,
        message,
        data: null,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: '服务器内部错误，请稍后再试',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  private extractMessage(response: string | object): string {
    if (typeof response === 'string') {
      return response;
    }

    const body = response as {
      message?: string | string[];
      error?: string;
    };

    if (Array.isArray(body.message)) {
      const first = body.message.find(
        (msg): msg is string =>
          typeof msg === 'string' && msg.trim().length > 0,
      );
      if (first) {
        return first;
      }
    }

    if (typeof body.message === 'string' && body.message.trim()) {
      return body.message;
    }

    return body.error ?? '请求处理失败';
  }
}
