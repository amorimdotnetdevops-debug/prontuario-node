// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { LoginHandler } from 'src/application/commands/auth/login.handler';
import { RefreshTokenHandler } from 'src/application/commands/auth/refresh-token.handler';
import { RefreshTokenSchema } from 'src/infrastructure/database/schemas/refresh-token.schema';
import { JwtConstants } from 'src/infrastructure/common/constants/jwt.constants';
import { AuthController } from 'src/presentation/auth.controller';
import { PasswordService } from 'src/infrastructure/services/password.service';
import { RefreshTokenRepository } from 'src/infrastructure/database/persistence/refresh-token.repository';
import { JwtStrategy } from 'src/application/strategies/jwt.strategy';
import { RefreshJwtStrategy } from 'src/application/strategies/refresh-jwt.strategy';
import { UsersModule } from './users.module';
import { JwtService } from 'src/application/services/jwt.service';

const commandHandlers = [LoginHandler, RefreshTokenHandler];

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshTokenSchema]),
    PassportModule,
    JwtModule.register({
      global: true,
      secret: JwtConstants.JWT_SECRET,
      signOptions: { expiresIn: JwtConstants.ACCESS_TOKEN_EXPIRATION },
    }),
    CqrsModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    ...commandHandlers,
    JwtService,
    PasswordService,
    RefreshTokenRepository,
    JwtStrategy,
    RefreshJwtStrategy,
  ],
  exports: [PasswordService],
})
export class AuthModule {}
