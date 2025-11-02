// src/modules/users/application/queries/get-user.handler.ts
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUserQuery } from './get-user.query';
import * as userRepositoryInterface from 'src/domain/interfaces/repositories/user.repository.interface';
import { User } from 'src/domain/entities/user.entity';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  constructor(
    @Inject(userRepositoryInterface.IUserRepositoryToken) private readonly userRepository: userRepositoryInterface.IUserRepository,
  ) {}

  async execute(query: GetUserQuery): Promise<User | null> {
    return this.userRepository.findById(query.userId);
  }
}