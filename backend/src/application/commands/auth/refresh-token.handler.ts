// src/modules/auth/application/commands/refresh-token.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, UnauthorizedException } from '@nestjs/common';
import { RefreshTokenCommand } from './refresh-token.command';
import { AuthResponseDto } from 'src/application/dtos/auth/auth-response.dto';
import * as userRepositoryInterface from 'src/domain/interfaces/repositories/user.repository.interface';
import { JwtService } from 'src/application/services/jwt.service';
import { RefreshTokenRepository } from 'src/infrastructure/database/persistence/refresh-token.repository';
import { TokenPayload } from 'src/domain/entities/token-payload.entity';
import { JwtConstants } from 'src/infrastructure/common/constants/jwt.constants';

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler
  implements ICommandHandler<RefreshTokenCommand, AuthResponseDto>
{
  constructor(
    @Inject(userRepositoryInterface.IUserRepositoryToken)
    private readonly userRepository: userRepositoryInterface.IUserRepository,
    private readonly jwtService: JwtService,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<AuthResponseDto> {
    // 1. Validar refresh token
    const payload = this.jwtService.validateRefreshToken(command.refreshToken);
    if (!payload) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // 2. Verificar se token não foi revogado no banco
    const isValid = await this.refreshTokenRepository.isValid(
      command.refreshToken,
      payload.userId,
    );
    if (!isValid) {
      throw new UnauthorizedException('Refresh token expirado ou revogado');
    }

    // 3. Buscar usuário
    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // 4. Gerar novo access token
    const tokenPayload = new TokenPayload(user.id, user.email);
    const newAccessToken = this.jwtService.generateAccessToken(tokenPayload);

    // 5. Revogar refresh token antigo
    await this.refreshTokenRepository.revoke(command.refreshToken);

    // 6. Gerar novo refresh token
    const newRefreshToken = this.jwtService.generateRefreshToken(tokenPayload);
    const expiresAt = new Date();
    expiresAt.setSeconds(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      expiresAt.getSeconds() + JwtConstants.REFRESH_TOKEN_EXPIRATION_SECONDS,
    );

    await this.refreshTokenRepository.save(user.id, newRefreshToken, expiresAt);

    return new AuthResponseDto(
      newAccessToken,
      newRefreshToken,
      JwtConstants.ACCESS_TOKEN_EXPIRATION_SECONDS,
    );
  }
}
