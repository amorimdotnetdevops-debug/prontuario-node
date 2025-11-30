// src/common/guards/jwt-refresh.guard.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ErrorCode } from 'src/application/dtos/common/error-response.dto';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  handleRequest(err, user) {
    if (err || !user) {
      throw new UnauthorizedException({
        message: 'Refresh token inválido',
        code: ErrorCode.AUTH_REFRESH_INVALID,
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user;
  }
}
