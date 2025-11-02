// src/modules/auth/application/strategies/refresh-jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
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

  validate(payload: any): { userId: string } {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!payload || !payload.userId) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    return { userId: payload.userId };
  }
}
