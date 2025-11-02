// src/modules/auth/application/commands/login.command.ts
import { ICommand } from '@nestjs/cqrs';

export class LoginCommand implements ICommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly deviceId?: string,
    public readonly ipAddress?: string,
  ) {}
}
