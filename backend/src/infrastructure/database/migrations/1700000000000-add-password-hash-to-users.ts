import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPasswordHashToUsers1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('users', 'passwordHash');
    if (!hasColumn) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'passwordHash',
          type: 'varchar',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('users', 'passwordHash');
    if (hasColumn) {
      await queryRunner.dropColumn('users', 'passwordHash');
    }
  }
}
