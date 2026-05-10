import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface UnifiedSuccessResponse {
  code: number;
  message: string;
  data: unknown;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, T | UnifiedSuccessResponse>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<T | UnifiedSuccessResponse> {
    return next.handle().pipe(
      map((data) => {
        // When @Res() is used to manually send a response
        // (e.g. file download), the data is undefined and
        // we must not wrap it.
        if (data === undefined) {
          return data;
        }

        if (this.isAlreadyWrapped(data)) {
          return data;
        }

        return {
          code: 0,
          message: 'ok',
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }

  private isAlreadyWrapped(data: unknown): boolean {
    return (
      data !== null &&
      typeof data === 'object' &&
      'code' in data &&
      'message' in data &&
      'data' in data &&
      'timestamp' in data
    );
  }
}
