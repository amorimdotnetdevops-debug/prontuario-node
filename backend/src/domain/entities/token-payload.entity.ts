// src/modules/auth/domain/entities/token-payload.entity.ts
export class TokenPayload {
  userId: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;

  constructor(userId: string, email: string, roles: string[] = []) {
    this.userId = userId;
    this.email = email;
    this.roles = roles;
  }
}
