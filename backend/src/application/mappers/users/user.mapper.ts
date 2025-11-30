/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { UserDto } from 'src/application/dtos/users/user.dto';
import { User } from 'src/domain/entities/user.entity';

export class UserMapper {
  static toDomain(raw: any): User {
    const user = new User(
      raw.id,
      raw.name,
      raw.email,
      raw.passwordHash,
      raw.age,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    user.createdAt = raw.createdAt;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    user.updatedAt = raw.updatedAt;
    return user;
  }

  static toDto(user: User): UserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      age: user.age,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static toPersistence(user: User): any {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      age: user.age,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
