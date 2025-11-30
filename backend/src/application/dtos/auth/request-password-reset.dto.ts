import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetDto {
  @ApiProperty({
    description: 'Email cadastrado para reset',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;
}
