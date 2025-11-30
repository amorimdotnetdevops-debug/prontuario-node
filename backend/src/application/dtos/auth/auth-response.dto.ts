// src/modules/auth/application/dtos/auth-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT de acesso',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Expiração do access token em segundos',
    example: 900,
  })
  expiresIn: number;

  @ApiProperty({ description: 'Tipo de token', example: 'Bearer' })
  tokenType: string;

  constructor(
    accessToken: string,
    refreshToken: string,
    expiresIn: number = 900, // 15 minutos em segundos
  ) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresIn = expiresIn;
    this.tokenType = 'Bearer';
  }
}
