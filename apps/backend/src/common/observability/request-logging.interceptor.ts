import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { sanitizeLogValue } from './log-sanitizer';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const started = Date.now();
    const path = req.url?.split('?')[0] ?? req.url;

    if (path === '/health/live' || path === '/health/ready') {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: () => this.logRequest(req, res.statusCode, Date.now() - started),
        error: (err: unknown) => {
          const status =
            typeof err === 'object' &&
            err !== null &&
            'status' in err &&
            typeof err.status === 'number'
              ? (err as { status: number }).status
              : 500;
          this.logRequest(req, status, Date.now() - started, err);
        },
      }),
    );
  }

  private logRequest(
    req: Request,
    statusCode: number,
    durationMs: number,
    err?: unknown,
  ): void {
    const { userId, roles } = readAuthContext(req.user);
    const payload = sanitizeLogValue({
      event: 'http.request',
      requestId: req.requestId,
      method: req.method,
      path: req.url?.split('?')[0],
      statusCode,
      durationMs,
      userId,
      roles,
      error:
        err instanceof Error
          ? { name: err.name, message: err.message }
          : undefined,
    });
    const line = JSON.stringify(payload);
    if (statusCode >= 500) this.logger.error(line);
    else if (statusCode >= 400) this.logger.warn(line);
    else if (durationMs >= 5000) this.logger.warn(line);
    else this.logger.log(line);
  }
}

function readAuthContext(user: unknown): {
  userId?: string;
  roles?: string[];
} {
  if (!user || typeof user !== 'object') return {};
  const userId =
    'id' in user && typeof user.id === 'string' ? user.id : undefined;
  const roles =
    'roles' in user && Array.isArray(user.roles)
      ? user.roles.filter((r): r is string => typeof r === 'string')
      : undefined;
  return { userId, roles };
}
