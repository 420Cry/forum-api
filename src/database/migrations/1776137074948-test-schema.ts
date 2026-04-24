import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class TestSchema1776137074948 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'user_info',
        columns: [
          {
            name: 'users_id',
            type: 'char',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'user',
            type: 'int',
            isUnique: true,
          },
          {
            name: 'onboard_process',
            type: 'enum',
            enum: ['RoleSelection', 'GoalSelection', 'BasicInfo'],
            enumName: 'onboardProcessEnum',
            default: "'RoleSelection'",
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['startup', 'investor'],
            enumName: 'rolesEnum',
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'occupation',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'user_info',
      new TableForeignKey({
        columnNames: ['user'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_info');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user') !== -1,
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey('user_info', foreignKey);
    }

    await queryRunner.dropTable('user_info');
  }
}
