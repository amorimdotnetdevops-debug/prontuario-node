// src/modules/users/application/commands/create-user.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateUserCommand } from './create-user.command';
import { v4 as uuidv4 } from 'uuid';
import * as userRepositoryInterface from 'src/domain/interfaces/repositories/user.repository.interface';
import { User } from 'src/domain/entities/user.entity';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject(userRepositoryInterface.IUserRepositoryToken) private readonly userRepository: userRepositoryInterface.IUserRepository,
  ) {}

  async execute(command: CreateUserCommand): Promise<void> {
    // Verificar se email já existe
    const existingUser = await this.userRepository.findByEmail(command.email);
    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    // Criar entidade de domínio
    const user = new User(
      uuidv4(),
      command.name,
      command.email,
      command.age,
    );

    // Persistir
    await this.userRepository.create(user);
  }
}