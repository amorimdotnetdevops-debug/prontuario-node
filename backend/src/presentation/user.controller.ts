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
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserCommand } from 'src/application/commands/users/create-user.command';
import { CreateUserDto } from 'src/application/dtos/users/create-user.dto';
import { UserDto } from 'src/application/dtos/users/user.dto';
import { UserMapper } from 'src/application/mappers/users/user.mapper';
import { GetUserQuery } from 'src/application/queries/users/get-user.query';
import { User } from 'src/domain/entities/user.entity';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar novo usuário',
    description: 'Cria um novo usuário no sistema',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'Dados do usuário a ser criado',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  async create(@Body() dto: CreateUserDto): Promise<{ message: string }> {
    try {
      const command = new CreateUserCommand(dto.name, dto.email, dto.age);
      await this.commandBus.execute(command);
      return { message: 'Usuário criado com sucesso' };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'ID único do usuário',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOperation({ summary: 'Obter usuário por ID' })
  @ApiResponse({
    status: 200,
    description: 'Usuário encontrado',
    type: User,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  async getById(@Param('id') id: string): Promise<UserDto> {
    const query = new GetUserQuery(id);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = await this.queryBus.execute(query);
    if (!user) {
      throw new BadRequestException('Usuário não encontrado');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return UserMapper.toDto(user);
  }
}
