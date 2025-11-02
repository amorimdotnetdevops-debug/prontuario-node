import { User } from '../../entities/user.entity';

export interface IUserRepository {
  create(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<User[]>;
}

// Token para injetar a interface
export const IUserRepositoryToken = 'IUserRepository';