// src/common/guards/rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { RedisService } from '../services/redis.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const email = request.body.email;
    
    if (!email) return true;

    const key = `login_attempts:${email}`;
    const attempts = await this.redisService.get(key);

    if (attempts && Number(attempts) > 5) {
      throw new BadRequestException(
        'Muitas tentativas de login. Tente novamente em 15 minutos.',
      );
    }

    if (attempts) {
      await this.redisService.increment(key);
    } else {
      await this.redisService.set(key, 1, 900); // 15 minutos
    }

    return true;
  }
}
