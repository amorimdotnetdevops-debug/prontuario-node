// src/modules/auth/application/dtos/auth-response.dto.ts
export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
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
