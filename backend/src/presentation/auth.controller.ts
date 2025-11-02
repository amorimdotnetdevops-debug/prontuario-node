// src/modules/auth/presentation/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { TokenPayload } from '../domain/entities/token-payload.entity';
import { LoginDto } from 'src/application/dtos/auth/login.dto';
import { AuthResponseDto } from 'src/application/dtos/auth/auth-response.dto';
import { LoginCommand } from 'src/application/commands/auth/login.command';
import { RefreshTokenDto } from 'src/application/dtos/auth/refresh-token.dto';
import { RefreshTokenCommand } from 'src/application/commands/auth/refresh-token.command';
import { JwtGuard } from 'src/infrastructure/common/guards/jwt.guard';
import { CurrentUser } from 'src/infrastructure/common/decorators/current-user.decorator';
import { JwtRefreshGuard } from 'src/infrastructure/common/guards/jwt-refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

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
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new BadRequestException(error.message);
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
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new BadRequestException(error.message);
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
}
