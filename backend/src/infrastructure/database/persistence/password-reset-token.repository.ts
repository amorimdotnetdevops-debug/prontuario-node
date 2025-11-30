import { Injectable } from '@nestjs/common';
import { Repository, LessThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PasswordResetTokenSchema } from '../schemas/password-reset-token.schema';

@Injectable()
export class PasswordResetTokenRepository {
  constructor(
    @InjectRepository(PasswordResetTokenSchema)
    private readonly repository: Repository<PasswordResetTokenSchema>,
  ) {}

  async save(userId: string, token: string, expiresAt: Date): Promise<void> {
    const row = this.repository.create({ userId, token, expiresAt });
    await this.repository.save(row);
  }

  async findValid(token: string): Promise<PasswordResetTokenSchema | null> {
    const row = await this.repository.findOne({
      where: { token, isUsed: false },
    });
    if (!row) return null;
    return row.expiresAt > new Date() ? row : null;
  }

  async findLatestByUserId(
    userId: string,
  ): Promise<PasswordResetTokenSchema | null> {
    const rows = await this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 1,
    });
    return rows.length > 0 ? rows[0] : null;
  }

  async markUsed(token: string): Promise<void> {
    await this.repository.update(
      { token },
      { isUsed: true, usedAt: new Date() },
    );
  }

  async cleanExpired(): Promise<void> {
    const now = new Date();
    await this.repository.delete({ expiresAt: LessThan(now) });
  }
}
