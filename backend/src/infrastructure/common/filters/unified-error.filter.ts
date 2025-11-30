import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { ErrorCode } from 'src/application/dtos/common/error-response.dto';
import type { Response } from 'express';

@Catch()
export class UnifiedErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    let status = 500;
    let message = 'Erro interno';
    let code: ErrorCode | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response: unknown = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
      } else if (response && typeof response === 'object') {
        const r = response as {
          message?: unknown;
          error?: unknown;
          code?: unknown;
        };
        if (Array.isArray(r.message)) {
          message = r.message.join('; ');
        } else if (typeof r.message === 'string') {
          message = r.message;
        } else if (typeof r.error === 'string') {
          message = r.error;
        } else {
          message = exception.message;
        }
        if (typeof r.code === 'string') {
          code = r.code as ErrorCode;
        }
      } else {
        message = exception.message;
      }
      if (!code) {
        code = this.resolveCode(status, message);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      code = this.resolveCode(status, message);
    }

    res.status(status).json({ message, code });
  }

  private resolveCode(status: number, message: string): ErrorCode | undefined {
    const m = message.toLowerCase();
    if (status === 401) return ErrorCode.AUTH_UNAUTHORIZED;
    if (status === 404) return ErrorCode.NOT_FOUND;
    if (status === 400) {
      if (m.includes('email') && m.includes('senha'))
        return ErrorCode.AUTH_INVALID_CREDENTIALS;
      if (m.includes('refresh token')) return ErrorCode.AUTH_REFRESH_INVALID;
      if (
        m.includes('token inválido') ||
        (m.includes('token') && m.includes('expirado'))
      )
        return ErrorCode.AUTH_TOKEN_INVALID;
      if (m.includes('obrigatório') || m.includes('inválid'))
        return ErrorCode.VALIDATION_ERROR;
      return ErrorCode.BAD_REQUEST;
    }
    if (status >= 500) return ErrorCode.INTERNAL_ERROR;
    return undefined;
  }
}
