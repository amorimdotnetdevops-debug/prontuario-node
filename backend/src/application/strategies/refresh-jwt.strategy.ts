// src/modules/auth/application/strategies/refresh-jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ErrorCode } from 'src/application/dtos/common/error-response.dto';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtConstants } from 'src/infrastructure/common/constants/jwt.constants';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JwtConstants.JWT_REFRESH_SECRET,
    });
  }

  validate(payload: { userId?: string; type?: string }): { userId: string } {
    if (!payload || !payload.userId || payload.type !== 'refresh') {
      throw new UnauthorizedException({
        message: 'Refresh token inválido',
        code: ErrorCode.AUTH_REFRESH_INVALID,
      });
    }

    return { userId: payload.userId };
  }
}
