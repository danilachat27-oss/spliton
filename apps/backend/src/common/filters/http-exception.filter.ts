import {

  ArgumentsHost,

  Catch,

  ExceptionFilter,

  HttpException,

  HttpStatus,

  Logger,

} from '@nestjs/common';

import { Request, Response } from 'express';

import {

  isTechnicalClientMessage,

  sanitizeErrorMessage,

  sanitizeLogValue,

} from '../observability/log-sanitizer';

import { isAppErrorBody } from '../platform/errors/throw-app-error';

import { HttpErrorResponse } from '../types/http-error-response.type';



@Catch()

export class HttpExceptionFilter implements ExceptionFilter {

  private readonly logger = new Logger(HttpExceptionFilter.name);



  catch(exception: unknown, host: ArgumentsHost): void {

    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();

    const request = ctx.getRequest<Request>();



    const isHttpException = exception instanceof HttpException;

    const statusCode = isHttpException

      ? exception.getStatus()

      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException ? exception.getResponse() : null;



    let message: string | string[] = 'Internal server error';

    let error: string | undefined;

    let code: string | undefined;

    let details: unknown;



    if (typeof exceptionResponse === 'string') {

      message = exceptionResponse;

    } else if (exceptionResponse && typeof exceptionResponse === 'object') {

      if (isAppErrorBody(exceptionResponse)) {

        code = exceptionResponse.error.code;

        message = exceptionResponse.error.message;

        details = exceptionResponse.error.details;

      } else {

        const responseObj = exceptionResponse as {

          message?: string | string[] | { code?: string; message?: string };

          error?: string;

          code?: string;

        };

        const rawMessage = responseObj.message;

        if (
          rawMessage &&
          typeof rawMessage === 'object' &&
          !Array.isArray(rawMessage)
        ) {
          const structured = rawMessage as { code?: string; message?: string };
          code = structured.code ?? responseObj.code ?? code;
          message = structured.message ?? message;
        } else {
          message = rawMessage ?? message;
        }

        error = typeof responseObj.error === 'string' ? responseObj.error : undefined;

        code = code ?? responseObj.code;

      }

    }



    const isProduction = process.env.NODE_ENV === 'production';

    if (statusCode >= 500) {

      message = 'Internal server error';

      error = undefined;

      details = undefined;

      code = code ?? 'INTERNAL_ERROR';

    } else if (typeof message === 'string' && isTechnicalClientMessage(message)) {

      message = 'Internal server error';

      code = code ?? 'INTERNAL_ERROR';

    } else if (Array.isArray(message)) {

      message = message.map((m) =>

        isTechnicalClientMessage(m) ? 'Internal server error' : sanitizeErrorMessage(m),

      );

    }



    const payload: HttpErrorResponse = {

      statusCode,

      timestamp: new Date().toISOString(),

      path: request.url,

      method: request.method,

      message: Array.isArray(message)

        ? message.map((m) => sanitizeErrorMessage(m))

        : sanitizeErrorMessage(message),

      error,

      code,

      details,

      requestId: request.requestId,

    };



    if (statusCode >= 500) {

      const errMessage =

        exception instanceof Error ? exception.message : String(exception);

      this.logger.error(

        JSON.stringify(

          sanitizeLogValue({

            event: 'http.exception',

            requestId: request.requestId,

            statusCode,

            path: request.url?.split('?')[0],

            method: request.method,

            code,

            message: sanitizeErrorMessage(errMessage),

          }),

        ),

      );

    }



    response.status(statusCode).json(payload);

  }

}


