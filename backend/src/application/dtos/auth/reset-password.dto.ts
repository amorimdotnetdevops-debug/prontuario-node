import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de reset de senha',
    example: 'c2f8d4a4-0c8f-4b9f-9f0a-123456789abc',
  })
  @IsString()
  token: string;

  @ApiProperty({ description: 'Nova senha', example: 'NovaSenha123!' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
