import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import * as fs from 'fs';
import { UserSchema } from './schemas/user.schema';
import { RefreshTokenSchema } from './schemas/refresh-token.schema';

export function createTypeOrmConfig(): TypeOrmModuleOptions {
  const dbDir = join(process.cwd(), 'var', 'db');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbFile = join(dbDir, 'prontuario.sqlite');

  return {
    type: 'sqlite',
    database: dbFile,
    entities: [UserSchema, RefreshTokenSchema],
    synchronize: true, // Em produção, prefira migrations
    logging: false,
  };
}
