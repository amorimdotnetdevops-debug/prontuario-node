/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
// src/modules/users/presentation/user.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiExtraModels,
  getSchemaPath,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserCommand } from 'src/application/commands/users/create-user.command';
import { CreateUserDto } from 'src/application/dtos/users/create-user.dto';
import { UserDto } from 'src/application/dtos/users/user.dto';
import { UserMapper } from 'src/application/mappers/users/user.mapper';
import { GetUserQuery } from 'src/application/queries/users/get-user.query';
import { GetUsersQuery } from 'src/application/queries/users/get-users.query';
import { User } from 'src/domain/entities/user.entity';
import { ErrorResponseDto } from 'src/application/dtos/common/error-response.dto';

@ApiTags('Users')
@ApiExtraModels(CreateUserDto, UserDto, ErrorResponseDto)
@Controller('users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar usuário',
    description: 'Criar usuário no sistema',
  })
  @ApiBody({
    description: 'Dados do usuário a ser criado',
    schema: { $ref: getSchemaPath(CreateUserDto) },
    examples: {
      Valido: {
        summary: 'Exemplo: Dados válidos',
        value: {
          name: 'João da Silva',
          email: 'user@example.com',
          password: 'Passw0rd!',
          age: 30,
        },
      },
      EmailInvalido: {
        summary: 'Exemplo: Email inválido',
        value: {
          name: 'João da Silva',
          email: 'invalid',
          password: 'Passw0rd!',
          age: 30,
        },
      },
      SenhaCurta: {
        summary: 'Exemplo: Senha menor que 8 caracteres',
        value: {
          name: 'João da Silva',
          email: 'user@example.com',
          password: '123',
          age: 30,
        },
      },
      IdadeInvalida: {
        summary: 'Exemplo: Idade fora do intervalo',
        value: {
          name: 'João da Silva',
          email: 'user@example.com',
          password: 'Passw0rd!',
          age: 10,
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Usuário criado com sucesso',
    type: UserDto,
    content: {
      'application/json': {
        examples: {
          Sucesso: {
            value: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              name: 'João da Silva',
              email: 'user@example.com',
              age: 30,
              createdAt: '2025-01-01T10:00:00Z',
              updatedAt: '2025-01-01T12:00:00Z',
            },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos',
    content: {
      'application/json': {
        schema: { $ref: getSchemaPath(ErrorResponseDto) },
        examples: {
          ErroDadosInvalidos: {
            value: {
              statusCode: 400,
              message: 'Dados inválidos',
              timestamp: '2025-01-01T12:00:00Z',
            },
          },
        },
      },
    },
  })
  async create(@Body() dto: CreateUserDto): Promise<UserDto> {
    try {
      const command = new CreateUserCommand(
        dto.name,
        dto.email,
        dto.password,
        dto.age,
      );
      const createdId = String(await this.commandBus.execute(command));
      const created = await this.queryBus.execute<GetUserQuery, User>(
        new GetUserQuery(createdId),
      );
      if (!created) {
        throw new BadRequestException('Usuário criado, mas não encontrado');
      }
      return UserMapper.toDto(created);
    } catch (error) {

      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuários', description: 'Listar usuários cadastrados' })
  @ApiOkResponse({
    description: 'Lista de usuários',
    type: [UserDto],
    content: {
      'application/json': {
        examples: {
          SucessoLista: {
            value: [
              {
                id: '550e8400-e29b-41d4-a716-446655440000',
                name: 'João da Silva',
                email: 'user@example.com',
                age: 30,
                createdAt: '2025-01-01T10:00:00Z',
                updatedAt: '2025-01-01T12:00:00Z',
              },
            ],
          },
        },
      },
    },
  })
  async list(): Promise<UserDto[]> {
    const users = await this.queryBus.execute<GetUsersQuery, User[]>(new GetUsersQuery());
    return users.map((u) => UserMapper.toDto(u));
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'ID único do usuário',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOperation({ summary: 'Obter usuário por ID', description: 'Obter usuário pelo identificador' })
  @ApiOkResponse({
    description: 'Usuário encontrado',
    type: UserDto,
    content: {
      'application/json': {
        examples: {
          SucessoItem: {
            value: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              name: 'João da Silva',
              email: 'user@example.com',
              age: 30,
              createdAt: '2025-01-01T10:00:00Z',
              updatedAt: '2025-01-01T12:00:00Z',
            },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado',
    content: {
      'application/json': {
        schema: { $ref: getSchemaPath(ErrorResponseDto) },
        examples: {
          ErroNaoEncontrado: {
            value: {
              statusCode: 404,
              message: 'Usuário não encontrado',
              timestamp: '2025-01-01T12:00:00Z',
            },
          },
        },
      },
    },
  })
  async getById(@Param('id') id: string): Promise<UserDto> {
    const query = new GetUserQuery(id);

    const user = await this.queryBus.execute(query);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return UserMapper.toDto(user);
  }
}
