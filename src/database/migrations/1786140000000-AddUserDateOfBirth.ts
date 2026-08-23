import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserDateOfBirth1786140000000 implements MigrationInterface {
  name = 'AddUserDateOfBirth1786140000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "date_of_birth" date`)
    // Backfill from whole-year age (Jan 1 of birth year). Drop absurd ages.
    await queryRunner.query(`
      UPDATE "users"
      SET "age" = NULL
      WHERE "age" IS NOT NULL AND ("age" < 17 OR "age" > 120)
    `)
    await queryRunner.query(`
      UPDATE "users"
      SET "date_of_birth" = make_date(
        EXTRACT(YEAR FROM CURRENT_DATE)::int - "age",
        1,
        1
      )
      WHERE "age" IS NOT NULL AND "date_of_birth" IS NULL
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "date_of_birth"`)
  }
}
