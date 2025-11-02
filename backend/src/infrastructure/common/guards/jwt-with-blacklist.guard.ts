// src/common/guards/jwt-with-blacklist.guard.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { RedisService } from '../services/redis.service';

@Injectable()
export class JwtWithBlacklistGuard extends AuthGuard('jwt') {
  constructor(private readonly redisService: RedisService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Token não fornecido');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const token = authHeader.replace('Bearer ', '');
    const user = await super.canActivate(context);

    if (!user) {
      throw new UnauthorizedException('Token inválido');
    }

    // Verificar se token está na blacklist
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const blacklistKey = `token_blacklist:${request.user.userId}:${token}`;
    const isBlacklisted = await this.redisService.exists(blacklistKey);

    if (isBlacklisted) {
      throw new UnauthorizedException('Token foi revogado (logout)');
    }

    return true;
  }
}
