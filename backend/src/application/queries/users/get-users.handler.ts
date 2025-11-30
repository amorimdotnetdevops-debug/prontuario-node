import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUsersQuery } from './get-users.query';
import * as userRepositoryInterface from 'src/domain/interfaces/repositories/user.repository.interface';
import { User } from 'src/domain/entities/user.entity';

@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery> {
  constructor(
    @Inject(userRepositoryInterface.IUserRepositoryToken)
    private readonly userRepository: userRepositoryInterface.IUserRepository,
  ) {}

  async execute(query: GetUsersQuery): Promise<User[]> {
    void query;
    return this.userRepository.findAll();
  }
}
