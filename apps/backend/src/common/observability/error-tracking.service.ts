import { Injectable, Logger } from '@nestjs/common';

export type ErrorTrackingLevel = 'info' | 'warning' | 'error';

@Injectable()
export class ErrorTrackingService {
  private readonly logger = new Logger(ErrorTrackingService.name);
  private readonly provider: string;

  constructor() {
    this.provider = (
      process.env.ERROR_TRACKING_PROVIDER ?? 'console'
    ).toLowerCase();
  }

  captureException(error: unknown, context?: Record<string, unknown>): void {
    const message = error instanceof Error ? error.message : String(error);
    const payload = {
      provider: this.provider,
      environment:
        process.env.ERROR_TRACKING_ENVIRONMENT ?? process.env.NODE_ENV,
      release: process.env.ERROR_TRACKING_RELEASE ?? 'unknown',
      message,
      ...context,
    };

    if (this.provider === 'disabled') return;

    if (this.provider === 'sentry' && process.env.SENTRY_DSN) {
      this.logger.error(`[sentry-stub] ${JSON.stringify(payload)}`);
      return;
    }

    this.logger.error(JSON.stringify({ event: 'error.tracked', ...payload }));
  }

  captureMessage(
    message: string,
    level: ErrorTrackingLevel = 'info',
    context?: Record<string, unknown>,
  ): void {
    if (this.provider === 'disabled') return;
    const payload = {
      event: 'message.tracked',
      provider: this.provider,
      level,
      message,
      ...context,
    };
    if (level === 'error') this.logger.error(JSON.stringify(payload));
    else if (level === 'warning') this.logger.warn(JSON.stringify(payload));
    else this.logger.log(JSON.stringify(payload));
  }
}
