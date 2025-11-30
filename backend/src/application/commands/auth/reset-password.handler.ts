import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, BadRequestException } from '@nestjs/common';
import { ResetPasswordCommand } from './reset-password.command';
import * as userRepositoryInterface from 'src/domain/interfaces/repositories/user.repository.interface';
import { PasswordResetTokenRepository } from 'src/infrastructure/database/persistence/password-reset-token.repository';
import { PasswordService } from 'src/infrastructure/services/password.service';

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler
  implements ICommandHandler<ResetPasswordCommand, void>
{
  constructor(
    @Inject(userRepositoryInterface.IUserRepositoryToken)
    private readonly userRepository: userRepositoryInterface.IUserRepository,
    private readonly resetRepo: PasswordResetTokenRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<void> {
    const row = await this.resetRepo.findValid(command.token);
    if (!row) {
      throw new BadRequestException('Token inválido ou expirado');
    }
    const user = await this.userRepository.findById(row.userId);
    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }
    const hash = await this.passwordService.hash(command.newPassword);
    user.passwordHash = hash;
    await this.userRepository.update(user);
    await this.resetRepo.markUsed(command.token);
  }
}
