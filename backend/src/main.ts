import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Adicionar prefixo global /api/v1
  app.setGlobalPrefix('api/v1');

  // Validação automática de DTOs (como FluentValidation)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Prontuario na Nuvem')
    .setDescription('Armazena dados de pacientes e médicos')
    .setVersion('1.0')
    .setContact('Prontuario na Nuvem', 'https://prontuario.example.com', 'contato@example.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3000/api/v1')
    .addServer('https://api.prontuario.example.com/api/v1')
    .addBearerAuth()
    .addTag('Auth', 'Autenticação e gerenciamento de tokens')
    .addTag('Users', 'Gestão de usuários')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(3000);
  console.log('Aplicação rodando em http://localhost:3000/api/v1');
  console.log(
    'Documentação Swagger disponível em http://localhost:3000/api/v1/docs',
  );
}

void bootstrap();
