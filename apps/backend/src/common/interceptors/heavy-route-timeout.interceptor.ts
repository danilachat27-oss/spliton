import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

const HEAVY_PATH_PREFIXES = [
  '/api/admin/v1/analytics',
  '/api/admin/v1/reports',
] as const;

const HEAVY_ROUTE_TIMEOUT_MS = 30_000;

@Injectable()
export class HeavyRouteTimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ url?: string }>();
    const path = req.url?.split('?')[0] ?? '';
    const isHeavy = HEAVY_PATH_PREFIXES.some((p) => path.startsWith(p));
    if (!isHeavy) {
      return next.handle();
    }

    return next.handle().pipe(
      timeout(HEAVY_ROUTE_TIMEOUT_MS),
      catchError((err: unknown) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () =>
              new RequestTimeoutException({
                code: 'REQUEST_TIMEOUT',
                message: 'Запрос превысил допустимое время выполнения',
              }),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
