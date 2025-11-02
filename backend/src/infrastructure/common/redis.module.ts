// src/infrastructure/common/redis.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './services/redis.service';
import redisConfig from '../config/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [redisConfig],
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
