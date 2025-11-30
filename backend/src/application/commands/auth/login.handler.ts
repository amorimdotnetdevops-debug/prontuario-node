// src/modules/auth/application/commands/login.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoginCommand } from './login.command';
import { AuthResponseDto } from 'src/application/dtos/auth/auth-response.dto';
import { Inject, UnauthorizedException } from '@nestjs/common';
import { ErrorCode } from 'src/application/dtos/common/error-response.dto';
import { JwtService } from 'src/application/services/jwt.service';
import * as userRepositoryInterface from 'src/domain/interfaces/repositories/user.repository.interface';
import { PasswordService } from 'src/infrastructure/services/password.service';
import { RefreshTokenRepository } from 'src/infrastructure/database/persistence/refresh-token.repository';
import { TokenPayload } from 'src/domain/entities/token-payload.entity';
import { JwtConstants } from 'src/infrastructure/common/constants/jwt.constants';

@CommandHandler(LoginCommand)
export class LoginHandler
  implements ICommandHandler<LoginCommand, AuthResponseDto>
{
  constructor(
    @Inject(userRepositoryInterface.IUserRepositoryToken)
    private readonly userRepository: userRepositoryInterface.IUserRepository,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(command: LoginCommand): Promise<AuthResponseDto> {
    // 1. Buscar usuário por email
    const user = await this.userRepository.findByEmail(command.email);
    if (!user) {
      throw new UnauthorizedException({
        message: 'Email ou senha inválidos',
        code: ErrorCode.AUTH_INVALID_CREDENTIALS,
      });
    }

    const isValid = await this.passwordService.validate(
      command.password,
      user.passwordHash,
    );
    if (!isValid) {
      throw new UnauthorizedException({
        message: 'Email ou senha inválidos',
        code: ErrorCode.AUTH_INVALID_CREDENTIALS,
      });
    }

    // 3. Criar payload do token

    const payload = new TokenPayload(user.id, user.email);

    // 4. Gerar tokens

    const accessToken = this.jwtService.generateAccessToken(payload);

    const refreshToken = this.jwtService.generateRefreshToken(payload);

    // 5. Salvar refresh token no banco (para poder revogar depois)
    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() + JwtConstants.REFRESH_TOKEN_EXPIRATION_SECONDS,
    );

    await this.refreshTokenRepository.save(
      user.id,
      refreshToken,
      expiresAt,
      command.deviceId,
      command.ipAddress,
    );

    // 6. Retornar tokens

    return new AuthResponseDto(
      accessToken,
      refreshToken,

      JwtConstants.ACCESS_TOKEN_EXPIRATION_SECONDS,
    );
  }
}
