// src/modules/users/infrastructure/persistence/user.repository.ts
import { Injectable } from '@nestjs/common';
import { IUserRepository } from 'src/domain/interfaces/repositories/user.repository.interface';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserMapper } from 'src/application/mappers/users/user.mapper';
import { User } from 'src/domain/entities/user.entity';
import { UserSchema } from '../schemas/user.schema';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserSchema)
    private readonly repository: Repository<UserSchema>,
  ) {}

  async create(user: User): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userSchema = UserMapper.toPersistence(user);
    await this.repository.save(userSchema);
  }

  async findById(id: string): Promise<User | null> {
    const userSchema = await this.repository.findOne({ where: { id } });
    if (!userSchema) {
      return null;
    }
    return UserMapper.toDomain(userSchema);
  }

  async findByEmail(email: string): Promise<User | null> {
    const userSchema = await this.repository.findOne({ where: { email } });
    if (!userSchema) {
      return null;
    }
    return UserMapper.toDomain(userSchema);
  }

  async update(user: User): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userSchema = UserMapper.toPersistence(user);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await this.repository.update({ id: user.id }, userSchema);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  async findAll(): Promise<User[]> {
    const userSchemas = await this.repository.find();
    return userSchemas.map((schema) => UserMapper.toDomain(schema));
  }
}
