// src/common/constants/jwt.constants.ts
export class JwtConstants {
  // Access Token: válido por 15 minutos
  static readonly ACCESS_TOKEN_EXPIRATION = '15m';
  static readonly ACCESS_TOKEN_EXPIRATION_SECONDS = 15 * 60;

  // Refresh Token: válido por 7 dias
  static readonly REFRESH_TOKEN_EXPIRATION = '7d';
  static readonly REFRESH_TOKEN_EXPIRATION_SECONDS = 7 * 24 * 60 * 60;

  // Secrets (usar variáveis de ambiente em produção!)
  static readonly JWT_SECRET = 'sua-chave-secreta-super-segura-aqui';
  static readonly JWT_REFRESH_SECRET = 'sua-chave-refresh-super-segura-aqui';
}
