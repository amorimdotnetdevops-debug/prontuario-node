// src/modules/auth/application/commands/refresh-token.command.ts
import { ICommand } from '@nestjs/cqrs';

export class RefreshTokenCommand implements ICommand {
  constructor(public readonly refreshToken: string) {}
}
