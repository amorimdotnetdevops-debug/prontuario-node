import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ description: 'Código HTTP do erro', example: 400 })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem explicando o erro',
    example: 'Email ou senha inválidos',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp ISO do erro',
    example: '2025-01-01T12:00:00Z',
  })
  timestamp: string;
}
