// src/modules/auth/application/services/jwt.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { TokenPayload } from '../../domain/entities/token-payload.entity';
import { JwtConstants } from 'src/infrastructure/common/constants/jwt.constants';

@Injectable()
export class JwtService {
  constructor(private readonly nestJwtService: NestJwtService) {}

  /**
   * Gerar Access Token (curta duração)
   * Equivalente ao: CreateToken() do IdentityServer
   */
  generateAccessToken(payload: TokenPayload): string {
    return this.nestJwtService.sign(
      {
        userId: payload.userId,
        email: payload.email,
        roles: payload.roles,
      },
      {
        expiresIn: JwtConstants.ACCESS_TOKEN_EXPIRATION,
        secret: JwtConstants.JWT_SECRET,
      },
    );
  }

  /**
   * Gerar Refresh Token (longa duração)
   * Equivalente ao: CreateRefreshToken() customizado
   */
  generateRefreshToken(payload: TokenPayload): string {
    return this.nestJwtService.sign(
      {
        userId: payload.userId,
        type: 'refresh',
      },
      {
        expiresIn: JwtConstants.REFRESH_TOKEN_EXPIRATION,
        secret: JwtConstants.JWT_REFRESH_SECRET,
      },
    );
  }

  /**
   * Validar Access Token
   * Equivalente ao: ValidateToken() do IdentityServer
   */
  validateAccessToken(token: string): TokenPayload | null {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.nestJwtService.verify(token, {
        secret: JwtConstants.JWT_SECRET,
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      return new TokenPayload(payload.userId, payload.email, payload.roles);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return null;
    }
  }

  /**
   * Validar Refresh Token
   */
  validateRefreshToken(token: string): { userId: string } | null {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.nestJwtService.verify(token, {
        secret: JwtConstants.JWT_REFRESH_SECRET,
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (payload.type !== 'refresh') {
        return null;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      return { userId: payload.userId };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return null;
    }
  }

  /**
   * Decodificar token sem validar (útil para extrair informações)
   */
  decodeToken(token: string): any {
    return this.nestJwtService.decode(token);
  }
}
