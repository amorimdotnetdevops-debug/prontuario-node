// src/modules/auth/application/commands/login.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoginCommand } from './login.command';
import { AuthResponseDto } from 'src/application/dtos/auth/auth-response.dto';
import { Inject, UnauthorizedException } from '@nestjs/common';
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const user = await this.userRepository.findByEmail(command.email);
    if (!user) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    // 2. Validar password (comparar com hash)
    // Nota: Você precisa adicionar passwordHash na entidade User
    const isPasswordValid = await this.passwordService.validate(
      command.password,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      user.passwordHash, // Campo que deve existir na entidade
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    // 3. Criar payload do token
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const payload = new TokenPayload(user.id, user.email);

    // 4. Gerar tokens
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const accessToken = this.jwtService.generateAccessToken(payload);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const refreshToken = this.jwtService.generateRefreshToken(payload);

    // 5. Salvar refresh token no banco (para poder revogar depois)
    const expiresAt = new Date();
    expiresAt.setSeconds(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      expiresAt.getSeconds() + JwtConstants.REFRESH_TOKEN_EXPIRATION_SECONDS,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await this.refreshTokenRepository.save(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      user.id,
      refreshToken,
      expiresAt,
      command.deviceId,
      command.ipAddress,
    );

    // 6. Retornar tokens
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return new AuthResponseDto(
      accessToken,
      refreshToken,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      JwtConstants.ACCESS_TOKEN_EXPIRATION_SECONDS,
    );
  }
}
