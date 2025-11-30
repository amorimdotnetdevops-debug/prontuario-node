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
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  getSchemaPath,
  ApiExtraModels,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from 'src/application/dtos/common/error-response.dto';
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
import { RefreshTokenRepository } from 'src/infrastructure/database/persistence/refresh-token.repository';

@ApiTags('Auth')
@ApiExtraModels(
  LoginDto,
  RefreshTokenDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  ErrorResponseDto,
)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  /**
   * POST /auth/login
   * Realizar login com email e senha
   */
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Login',
    description: 'Autenticar usuário com email e senha',
  })
  @ApiBody({
    description: 'Credenciais para autenticação',
    schema: { $ref: getSchemaPath(LoginDto) },
    examples: {
      Valido: {
        summary: 'Exemplo: Credenciais corretas',
        value: { email: 'user@example.com', password: 'Passw0rd!' },
      },
      EmailInvalido: {
        summary: 'Exemplo: Email inválido',
        value: { email: 'invalid', password: 'Passw0rd!' },
      },
      SenhaCurta: {
        summary: 'Exemplo: Senha menor que 8 caracteres',
        value: { email: 'user@example.com', password: '123' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Login realizado',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Exemplo: Sucesso',
    content: {
      'application/json': {
        examples: {
          Sucesso: {
            value: {
              accessToken: 'eyJhbGciOi...access',
              refreshToken: 'eyJhbGciOi...refresh',
              expiresIn: 900,
              tokenType: 'Bearer',
            },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Credenciais inválidas',
    content: {
      'application/json': {
        schema: { $ref: getSchemaPath(ErrorResponseDto) },
        examples: {
          ErroCredenciaisInvalidas: {
            value: {
              message: 'Email ou senha inválidos',
              code: 'AUTH_INVALID_CREDENTIALS',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Exemplo: Erro',
    content: {
      'application/json': {
        examples: {
          ErroCredenciaisInvalidas: {
            value: {
              message: 'Email ou senha inválidos',
              code: 'AUTH_INVALID_CREDENTIALS',
            },
          },
        },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Renovar token',
    description: 'Renovar token de acesso usando refreshToken',
  })
  @ApiBody({
    description: 'Refresh token válido',
    schema: { $ref: getSchemaPath(RefreshTokenDto) },
    examples: {
      Valido: {
        summary: 'Exemplo: Token válido',
        value: {
          refreshToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIuLi4iLCJpYXQiOjE3NjQ1MjQ3MDAsImV4cCI6MTc2NDUzNDcwMH0.signature',
        },
      },
      TokenVazio: {
        summary: 'Exemplo: Token vazio (inválido)',
        value: { refreshToken: '' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Token renovado',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Exemplo: Sucesso',
    content: {
      'application/json': {
        examples: {
          Sucesso: {
            value: {
              accessToken: 'eyJhbGciOi...access',
              refreshToken: 'eyJhbGciOi...refresh',
              expiresIn: 900,
              tokenType: 'Bearer',
            },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Refresh token inválido',
    content: {
      'application/json': {
        schema: { $ref: getSchemaPath(ErrorResponseDto) },
        examples: {
          ErroRefreshInvalido: {
            value: {
              message: 'Refresh token inválido',
              code: 'AUTH_REFRESH_INVALID',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Exemplo: Erro',
    content: {
      'application/json': {
        examples: {
          ErroRefreshInvalido: {
            value: {
              message: 'Refresh token inválido',
              code: 'AUTH_REFRESH_INVALID',
            },
          },
        },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Obter usuário',
    description: 'Retornar dados do usuário autenticado',
  })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Payload do usuário' })
  @ApiUnauthorizedResponse({
    description: 'Não autorizado',
    content: {
      'application/json': {
        schema: { $ref: getSchemaPath(ErrorResponseDto) },
        examples: {
          ErroSemToken: {
            value: {
              message: 'Não autorizado',
              code: 'AUTH_UNAUTHORIZED',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Exemplo: Sucesso',
    content: {
      'application/json': {
        examples: {
          Sucesso: {
            value: {
              userId: '550e8400-e29b-41d4-a716-446655440000',
              email: 'user@example.com',
              roles: [],
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Exemplo: Erro',
    content: {
      'application/json': {
        examples: {
          ErroSemToken: {
            value: { message: 'Não autorizado', code: 'AUTH_UNAUTHORIZED' },
          },
        },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Logout',
    description: 'Requer Authorization: Bearer <refresh_token>',
  })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Logout realizado' })
  @ApiUnauthorizedResponse({
    description: 'Não autorizado',
    content: {
      'application/json': {
        schema: { $ref: getSchemaPath(ErrorResponseDto) },
        examples: {
          ErroSemToken: {
            value: {
              message: 'Não autorizado',
              code: 'AUTH_UNAUTHORIZED',
            },
          },
          ErroTokenIncorreto: {
            value: {
              message: 'Refresh token não fornecido ou inválido',
              code: 'AUTH_REFRESH_INVALID',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Exemplo: Sucesso',
    content: {
      'application/json': {
        examples: {
          Sucesso: { value: { message: 'Logout realizado com sucesso' } },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Exemplo: Erro',
    content: {
      'application/json': {
        examples: {
          ErroSemToken: {
            value: { message: 'Não autorizado', code: 'AUTH_UNAUTHORIZED' },
          },
          ErroTokenIncorreto: {
            value: {
              message: 'Refresh token não fornecido ou inválido',
              code: 'AUTH_REFRESH_INVALID',
            },
          },
        },
      },
    },
  })
  async logout(@Req() req: Request) {
    const authHeader = req.headers?.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : '';
    if (token) {
      await this.refreshTokenRepository.revoke(token);
    }
    return { message: 'Logout realizado com sucesso' };
  }

  /**
   * GET /auth/debug/password-reset-token?email=...
   * Endpoint de debug para obter o último token de reset
   * Não habilitar em produção
   */
  @Get('debug/password-reset-token')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Token de reset (debug)',
    description: 'Obter último token de reset para um email (apenas debug)',
  })
  @ApiQuery({ name: 'email', type: String, required: true })
  @ApiOkResponse({ description: 'Token e expiração' })
  @ApiBadRequestResponse({
    description: 'Requisição inválida',
    content: {
      'application/json': {
        schema: { $ref: getSchemaPath(ErrorResponseDto) },
        examples: {
          ErroAusenciaEmail: {
            value: {
              message: 'Email é obrigatório',
              code: 'VALIDATION_ERROR',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Exemplo: Sucesso',
    content: {
      'application/json': {
        examples: {
          Sucesso: {
            value: {
              token: '550e8400-e29b-41d4-a716-446655440000',
              expiresAt: '2025-01-01T23:59:59Z',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Exemplo: Erro',
    content: {
      'application/json': {
        examples: {
          ErroAusenciaEmail: {
            value: { message: 'Email é obrigatório', code: 'VALIDATION_ERROR' },
          },
        },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Solicitar reset',
    description: 'Solicitar envio de token de reset para o email',
  })
  @ApiBody({
    description: 'Email cadastrado para receber o link de reset',
    schema: { $ref: getSchemaPath(RequestPasswordResetDto) },
    examples: {
      Valido: {
        summary: 'Exemplo: Email cadastrado',
        value: { email: 'user@example.com' },
      },
      EmailNaoCadastrado: {
        summary: 'Exemplo: Email não cadastrado',
        value: { email: 'user@example.com' },
      },
    },
  })
  @ApiOkResponse({ description: 'Solicitação recebida' })
  @ApiBadRequestResponse({
    description: 'Requisição inválida',
    content: {
      'application/json': {
        schema: { $ref: getSchemaPath(ErrorResponseDto) },
        examples: {
          ErroDadosInvalidos: {
            value: {
              message: 'Requisição inválida',
              code: 'BAD_REQUEST',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Exemplo: Sucesso',
    content: {
      'application/json': {
        examples: {
          Sucesso: {
            value: { message: 'Se o email existir, o reset foi solicitado' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Exemplo: Erro',
    content: {
      'application/json': {
        examples: {
          ErroDadosInvalidos: {
            value: { message: 'Requisição inválida', code: 'BAD_REQUEST' },
          },
        },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Redefinir senha',
    description: 'Redefinir senha usando token de reset',
  })
  @ApiBody({
    description: 'Token de reset e nova senha',
    schema: { $ref: getSchemaPath(ResetPasswordDto) },
    examples: {
      Valido: {
        summary: 'Exemplo: Redefinição com token válido',
        value: {
          token: 'c2f8d4a4-0c8f-4b9f-9f0a-123456789abc',
          newPassword: 'NovaSenha123!',
        },
      },
      SenhaFraca: {
        summary: 'Exemplo: Senha menor que 8 caracteres',
        value: {
          token: 'c2f8d4a4-0c8f-4b9f-9f0a-123456789abc',
          newPassword: '123',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Senha redefinida' })
  @ApiBadRequestResponse({
    description: 'Token inválido ou expirado',
    content: {
      'application/json': {
        schema: { $ref: getSchemaPath(ErrorResponseDto) },
        examples: {
          ErroTokenInvalido: {
            value: {
              message: 'Token inválido ou expirado',
              code: 'AUTH_TOKEN_INVALID',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Exemplo: Sucesso',
    content: {
      'application/json': {
        examples: {
          Sucesso: { value: { message: 'Senha redefinida com sucesso' } },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Exemplo: Erro',
    content: {
      'application/json': {
        examples: {
          ErroTokenInvalido: {
            value: {
              message: 'Token inválido ou expirado',
              code: 'AUTH_TOKEN_INVALID',
            },
          },
        },
      },
    },
  })
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
