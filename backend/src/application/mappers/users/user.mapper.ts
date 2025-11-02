import { UserDto } from "src/application/dtos/users/user.dto";
import { User } from "src/domain/entities/user.entity";


export class UserMapper {
  static toDomain(raw: any): User {
    return new User(
      raw.id,
      raw.name,
      raw.email,
      raw.age,
    );
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
      age: user.age,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}