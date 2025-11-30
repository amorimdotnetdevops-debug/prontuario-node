import { ApiProperty } from '@nestjs/swagger';

export enum ErrorCode {
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_REFRESH_INVALID = 'AUTH_REFRESH_INVALID',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_EMAIL_CONFLICT = 'USER_EMAIL_CONFLICT',
}
export class ErrorResponseDto {
  @ApiProperty({
    description: 'Mensagem explicando o erro',
    example: 'Email ou senha inválidos',
  })
  message: string;

  @ApiProperty({
    description: 'Código do erro',
    enum: ErrorCode,
    required: false,
  })
  code?: ErrorCode;
}
