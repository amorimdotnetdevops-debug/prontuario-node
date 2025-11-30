import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { RequestPasswordResetCommand } from './request-password-reset.command';
import * as userRepositoryInterface from 'src/domain/interfaces/repositories/user.repository.interface';
import { PasswordResetTokenRepository } from 'src/infrastructure/database/persistence/password-reset-token.repository';
import { v4 as uuidv4 } from 'uuid';
import { MailService } from 'src/infrastructure/services/mail.service';

@CommandHandler(RequestPasswordResetCommand)
export class RequestPasswordResetHandler
  implements ICommandHandler<RequestPasswordResetCommand, void>
{
  constructor(
    @Inject(userRepositoryInterface.IUserRepositoryToken)
    private readonly userRepository: userRepositoryInterface.IUserRepository,
    private readonly resetRepo: PasswordResetTokenRepository,
    private readonly mailService: MailService,
  ) {}

  async execute(command: RequestPasswordResetCommand): Promise<void> {
    const user = await this.userRepository.findByEmail(command.email);
    if (!user) {
      return;
    }
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);
    await this.resetRepo.save(user.id, token, expiresAt);
    await this.mailService.sendPasswordReset(user.email, token);
  }
}
