import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreatePasswordResetTokens1700000000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('password_reset_tokens');
    if (!hasTable) {
      await queryRunner.createTable(
        new Table({
          name: 'password_reset_tokens',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'uuid',
            },
            { name: 'userId', type: 'varchar' },
            { name: 'token', type: 'text' },
            { name: 'expiresAt', type: 'datetime' },
            { name: 'isUsed', type: 'boolean', default: false },
            {
              name: 'createdAt',
              type: 'datetime',
              default: 'CURRENT_TIMESTAMP',
            },
            { name: 'usedAt', type: 'datetime', isNullable: true },
          ],
        }),
        true,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('password_reset_tokens');
    if (hasTable) {
      await queryRunner.dropTable('password_reset_tokens');
    }
  }
}
