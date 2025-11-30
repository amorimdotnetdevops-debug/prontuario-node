/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { UnifiedErrorFilter } from './infrastructure/common/filters/unified-error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Adicionar prefixo global /api/v1
  app.setGlobalPrefix('api/v1');

  // Padronizar respostas de erro para { message: string }
  app.useGlobalFilters(new UnifiedErrorFilter());

  // Validação automática de DTOs (como FluentValidation)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3000);

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Prontuario na Nuvem')
    .setDescription('Armazena dados de pacientes e médicos')
    .setVersion('1.0')
    .setContact('Prontuario na Nuvem', 'https://prontuario.example.com', 'contato@example.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer(`http://localhost:${port}`)
    .addServer('https://api.prontuario.example.com')
    .addBearerAuth()
    .addTag('Auth', 'Autenticação e gerenciamento de tokens')
    .addTag('Users', 'Gestão de usuários')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port);
  console.log(`Aplicação rodando em http://localhost:${port}/api/v1`);
  console.log(
    `Documentação Swagger disponível em http://localhost:${port}/api/v1/docs`,
  );
}

void bootstrap();
