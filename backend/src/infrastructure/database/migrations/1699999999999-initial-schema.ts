/* eslint-disable prettier/prettier */
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class InitialSchema1699999999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasUsers = await queryRunner.hasTable('users');
    if (!hasUsers) {
      await queryRunner.createTable(
        new Table({
          name: 'users',
          columns: [
            { name: 'id', type: 'varchar', isPrimary: true },
            { name: 'name', type: 'varchar' },
            { name: 'email', type: 'varchar', isUnique: true },
            { name: 'passwordHash', type: 'varchar', isNullable: true },
            { name: 'age', type: 'int' },
            { name: 'createdAt', type: 'datetime', default: "CURRENT_TIMESTAMP" },
            { name: 'updatedAt', type: 'datetime', default: "CURRENT_TIMESTAMP" },
          ],
        }),
        true,
      );
    }

    const hasRefreshTokens = await queryRunner.hasTable('refresh_tokens');
    if (!hasRefreshTokens) {
      await queryRunner.createTable(
        new Table({
          name: 'refresh_tokens',
          columns: [
            { name: 'id', type: 'uuid', isPrimary: true, isGenerated: true, generationStrategy: 'uuid' },
            { name: 'userId', type: 'varchar' },
            { name: 'token', type: 'text' },
            { name: 'expiresAt', type: 'datetime' },
            { name: 'isRevoked', type: 'boolean', default: false },
            { name: 'createdAt', type: 'datetime', default: "CURRENT_TIMESTAMP" },
            { name: 'deviceId', type: 'varchar', isNullable: true },
            { name: 'ipAddress', type: 'varchar', isNullable: true },
          ],
        }),
        true,
      );

      await queryRunner.createIndex(
        'refresh_tokens',
        new TableIndex({ name: 'IDX_refresh_tokens_user_revoked', columnNames: ['userId', 'isRevoked'] }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasRefreshTokens = await queryRunner.hasTable('refresh_tokens');
    if (hasRefreshTokens) {
      await queryRunner.dropTable('refresh_tokens');
    }
    const hasUsers = await queryRunner.hasTable('users');
    if (hasUsers) {
      await queryRunner.dropTable('users');
    }
  }
}

