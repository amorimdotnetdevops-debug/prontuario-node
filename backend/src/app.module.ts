import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './modules/auth.module';
import { RedisModule } from './infrastructure/common/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    RedisModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
