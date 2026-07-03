import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLocationColumn1783045969540 implements MigrationInterface {
  name = 'AddLocationColumn1783045969540';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "location" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "location"`);
  }
}
