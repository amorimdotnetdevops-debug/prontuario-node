import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetLatestPasswordResetTokenQuery } from './get-latest-password-reset-token.query';
import * as userRepositoryInterface from 'src/domain/interfaces/repositories/user.repository.interface';
import { PasswordResetTokenRepository } from 'src/infrastructure/database/persistence/password-reset-token.repository';

@QueryHandler(GetLatestPasswordResetTokenQuery)
export class GetLatestPasswordResetTokenHandler
  implements
    IQueryHandler<
      GetLatestPasswordResetTokenQuery,
      { token: string; expiresAt: Date }
    >
{
  constructor(
    @Inject(userRepositoryInterface.IUserRepositoryToken)
    private readonly userRepository: userRepositoryInterface.IUserRepository,
    private readonly resetRepo: PasswordResetTokenRepository,
  ) {}

  async execute(
    query: GetLatestPasswordResetTokenQuery,
  ): Promise<{ token: string; expiresAt: Date }> {
    const user = await this.userRepository.findByEmail(query.email);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    const row = await this.resetRepo.findLatestByUserId(user.id);
    if (!row) {
      throw new NotFoundException('Nenhum token de reset encontrado');
    }
    return { token: row.token, expiresAt: row.expiresAt };
  }
}
