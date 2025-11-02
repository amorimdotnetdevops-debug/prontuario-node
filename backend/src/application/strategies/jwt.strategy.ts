// src/modules/auth/application/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../../domain/entities/token-payload.entity';
import { JwtConstants } from 'src/infrastructure/common/constants/jwt.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Extrair token do header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JwtConstants.JWT_SECRET,
    });
  }

  /**
   * Validar payload do token
   * Este método é chamado automaticamente pelo Passport
   */
  validate(payload: any): TokenPayload {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!payload || !payload.userId) {
      throw new UnauthorizedException('Token inválido');
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      userId: payload.userId,
      email: '',
      roles: [],
    };
  }
}
