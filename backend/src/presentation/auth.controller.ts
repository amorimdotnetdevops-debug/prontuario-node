// src/modules/auth/presentation/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { TokenPayload } from '../domain/entities/token-payload.entity';
import { LoginDto } from 'src/application/dtos/auth/login.dto';
import { AuthResponseDto } from 'src/application/dtos/auth/auth-response.dto';
import { LoginCommand } from 'src/application/commands/auth/login.command';
import { RefreshTokenDto } from 'src/application/dtos/auth/refresh-token.dto';
import { RefreshTokenCommand } from 'src/application/commands/auth/refresh-token.command';
import { JwtGuard } from 'src/infrastructure/common/guards/jwt.guard';
import { CurrentUser } from 'src/infrastructure/common/decorators/current-user.decorator';
import { JwtRefreshGuard } from 'src/infrastructure/common/guards/jwt-refresh.guard';
import { RequestPasswordResetDto } from 'src/application/dtos/auth/request-password-reset.dto';
import { ResetPasswordDto } from 'src/application/dtos/auth/reset-password.dto';
import { RequestPasswordResetCommand } from 'src/application/commands/auth/request-password-reset.command';
import { ResetPasswordCommand } from 'src/application/commands/auth/reset-password.command';
import { GetLatestPasswordResetTokenQuery } from 'src/application/queries/auth/get-latest-password-reset-token.query';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /**
   * POST /auth/login
   * Realizar login com email e senha
   */
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    try {
      const command = new LoginCommand(
        dto.email,
        dto.password,
        undefined, // deviceId
        undefined, // ipAddress
      );
      return await this.commandBus.execute(command);
    } catch (error: unknown) {
      const msg = typeof error === 'string' ? error : String(error);
      throw new BadRequestException(msg);
    }
  }

  /**
   * POST /auth/refresh
   * Renovar access token usando refresh token
   */
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    try {
      const command = new RefreshTokenCommand(dto.refreshToken);
      return await this.commandBus.execute(command);
    } catch (error: unknown) {
      const msg = typeof error === 'string' ? error : String(error);
      throw new BadRequestException(msg);
    }
  }

  /**
   * GET /auth/me
   * Obter informações do usuário autenticado
   * Requer: Authorization: Bearer <access_token>
   */
  @Get('me')
  @UseGuards(JwtGuard)
  getCurrentUser(@CurrentUser() user: TokenPayload) {
    return {
      userId: user.userId,
      email: user.email,
      roles: user.roles,
    };
  }

  /**
   * POST /auth/logout
   * Fazer logout (revogar refresh token)
   * Requer: Authorization: Bearer <refresh_token>
   */
  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtRefreshGuard)
  logout() {
    // Implementação de logout revogando o token
    // (será adicionada no próximo passo)
    return { message: 'Logout realizado com sucesso' };
  }

  /**
   * GET /auth/debug/password-reset-token?email=...
   * Endpoint de debug para obter o último token de reset
   * Não habilitar em produção
   */
  @Get('debug/password-reset-token')
  @HttpCode(200)
  async getLatestPasswordResetToken(@Query('email') email?: string) {
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Indisponível em produção');
    }
    if (!email) {
      throw new BadRequestException('Email é obrigatório');
    }
    try {
      const result = await this.queryBus.execute<
        GetLatestPasswordResetTokenQuery,
        { token: string; expiresAt: Date }
      >(new GetLatestPasswordResetTokenQuery(email));
      return { token: result.token, expiresAt: result.expiresAt };
    } catch (error: unknown) {
      const msg = typeof error === 'string' ? error : String(error);
      throw new BadRequestException(msg);
    }
  }

  @Post('request-password-reset')
  @HttpCode(200)
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    try {
      const command = new RequestPasswordResetCommand(dto.email);
      await this.commandBus.execute(command);
      return { message: 'Se o email existir, o reset foi solicitado' };
    } catch (error: unknown) {
      const msg = typeof error === 'string' ? error : String(error);
      throw new BadRequestException(msg);
    }
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    try {
      const command = new ResetPasswordCommand(dto.token, dto.newPassword);
      await this.commandBus.execute(command);
      return { message: 'Senha redefinida com sucesso' };
    } catch (error: unknown) {
      const msg = typeof error === 'string' ? error : String(error);
      throw new BadRequestException(msg);
    }
  }
}
