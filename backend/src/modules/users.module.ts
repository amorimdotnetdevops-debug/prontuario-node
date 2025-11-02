// src/modules/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateUserHandler } from 'src/application/commands/users/create-user.handler';
import { GetUserHandler } from 'src/application/queries/users/get-user.handler';
import { UserSchema } from 'src/infrastructure/database/schemas/user.schema';
import { UserController } from 'src/presentation/user.controller';
import { IUserRepositoryToken } from 'src/domain/interfaces/repositories/user.repository.interface';
import { UserRepository } from 'src/infrastructure/database/persistence/user.repository';

const commandHandlers = [CreateUserHandler];
const queryHandlers = [GetUserHandler];

@Module({
  imports: [TypeOrmModule.forFeature([UserSchema]), CqrsModule],
  controllers: [UserController],
  providers: [
    ...commandHandlers,
    ...queryHandlers,
    {
      provide: IUserRepositoryToken,
      useClass: UserRepository,
    },
  ],
  exports: [IUserRepositoryToken],
})
export class UsersModule {}
