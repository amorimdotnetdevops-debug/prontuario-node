// src/modules/auth/infrastructure/persistence/refresh-token.repository.ts
import { Injectable } from '@nestjs/common';
import { Repository, LessThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshTokenSchema } from '../schemas/refresh-token.schema';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenSchema)
    private readonly repository: Repository<RefreshTokenSchema>,
  ) {}

  /**
   * Salvar refresh token no banco
   * Importante: Tokens devem ser armazenados para poder revogar
   */
  async save(
    userId: string,
    token: string,
    expiresAt: Date,
    deviceId?: string,
    ipAddress?: string,
  ): Promise<void> {
    const refreshToken = this.repository.create({
      userId,
      token,
      expiresAt,
      deviceId,
      ipAddress,
    });
    await this.repository.save(refreshToken);
  }

  /**
   * Verificar se refresh token é válido e não foi revogado
   */
  async isValid(token: string, userId: string): Promise<boolean> {
    const refreshToken = await this.repository.findOne({
      where: {
        token,
        userId,
        isRevoked: false,
      },
      // Verificar tokens não expirados usando a cláusula where com Raw
      // A data atual deve ser menor que a data de expiração
      relations: [],
      withDeleted: false,
    });

    // Verificar se o token existe e não está expirado
    return !!refreshToken && refreshToken.expiresAt > new Date();
  }

  /**
   * Revogar refresh token (logout)
   */
  async revoke(token: string): Promise<void> {
    await this.repository.update({ token }, { isRevoked: true });
  }

  /**
   * Revogar todos os tokens de um usuário (logout em todos os devices)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.repository.update({ userId }, { isRevoked: true });
  }

  /**
   * Limpar tokens expirados (manutenção)
   */
  async cleanExpiredTokens(): Promise<void> {
    const currentDate = new Date();
    await this.repository.delete({
      expiresAt: LessThan(currentDate),
    });
  }
}
