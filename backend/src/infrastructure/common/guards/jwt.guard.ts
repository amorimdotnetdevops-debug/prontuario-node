// src/common/guards/jwt.guard.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  /**
   * Guard que valida JWT automaticamente
   * Equivalente ao: [Authorize] em .NET
   */
  handleRequest(err, user) {
    if (err || !user) {
      throw new UnauthorizedException('Token não fornecido ou inválido');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user;
  }
}
