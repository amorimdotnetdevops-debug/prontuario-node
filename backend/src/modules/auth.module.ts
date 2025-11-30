// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { LoginHandler } from 'src/application/commands/auth/login.handler';
import { RefreshTokenHandler } from 'src/application/commands/auth/refresh-token.handler';
import { RefreshTokenSchema } from 'src/infrastructure/database/schemas/refresh-token.schema';
import { PasswordResetTokenSchema } from 'src/infrastructure/database/schemas/password-reset-token.schema';
import { JwtConstants } from 'src/infrastructure/common/constants/jwt.constants';
import { AuthController } from 'src/presentation/auth.controller';
import { PasswordService } from 'src/infrastructure/services/password.service';
import { RefreshTokenRepository } from 'src/infrastructure/database/persistence/refresh-token.repository';
import { PasswordResetTokenRepository } from 'src/infrastructure/database/persistence/password-reset-token.repository';
import { JwtStrategy } from 'src/application/strategies/jwt.strategy';
import { RefreshJwtStrategy } from 'src/application/strategies/refresh-jwt.strategy';
import { UsersModule } from './users.module';
import { JwtService } from 'src/application/services/jwt.service';
import { RequestPasswordResetHandler } from 'src/application/commands/auth/request-password-reset.handler';
import { ResetPasswordHandler } from 'src/application/commands/auth/reset-password.handler';
import { GetLatestPasswordResetTokenHandler } from 'src/application/queries/auth/get-latest-password-reset-token.handler';
import { MailService } from 'src/infrastructure/services/mail.service';

const commandHandlers = [
  LoginHandler,
  RefreshTokenHandler,
  RequestPasswordResetHandler,
  ResetPasswordHandler,
];
const queryHandlers = [GetLatestPasswordResetTokenHandler];

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshTokenSchema, PasswordResetTokenSchema]),
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
    ...queryHandlers,
    JwtService,
    PasswordService,
    MailService,
    RefreshTokenRepository,
    PasswordResetTokenRepository,
    JwtStrategy,
    RefreshJwtStrategy,
  ],
  exports: [PasswordService],
})
export class AuthModule {}
