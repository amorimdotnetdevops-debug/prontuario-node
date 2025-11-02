// src/modules/users/application/queries/get-user.query.ts
import { IQuery } from '@nestjs/cqrs';

export class GetUserQuery implements IQuery {
  constructor(public readonly userId: string) {}
}