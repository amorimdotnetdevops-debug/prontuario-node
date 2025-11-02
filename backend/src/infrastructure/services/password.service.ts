// src/modules/auth/infrastructure/services/password.service.ts
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordService {
  private readonly saltRounds = 10;

  /**
   * Hash de password com bcrypt
   * Equivalente ao: PasswordHasher.HashAsync() do Identity
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Validar password contra hash
   * Equivalente ao: PasswordHasher.VerifyHashedPasswordAsync()
   */
  async validate(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
