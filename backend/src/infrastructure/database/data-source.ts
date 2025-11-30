import { DataSource } from 'typeorm';
import { join } from 'path';
import * as fs from 'fs';
import { UserSchema } from './schemas/user.schema';
import { RefreshTokenSchema } from './schemas/refresh-token.schema';

const dbDir = join(process.cwd(), 'var', 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbFile = join(dbDir, 'prontuario.sqlite');

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: dbFile,
  entities: [UserSchema, RefreshTokenSchema],
  migrations: [
    join(
      process.cwd(),
      'src',
      'infrastructure',
      'database',
      'migrations',
      '*.ts',
    ),
  ],
  synchronize: false,
  logging: false,
});
