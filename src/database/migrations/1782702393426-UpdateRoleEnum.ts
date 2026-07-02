import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRoleEnum1782702393426 implements MigrationInterface {
  name = 'UpdateRoleEnum1782702393426';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE VARCHAR`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'Founder' WHERE "role" = 'startup'`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'Investor' WHERE "role" = 'investor'`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('Founder', 'Investor')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"public"."users_role_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE VARCHAR`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'startup' WHERE "role" = 'Founder'`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'investor' WHERE "role" = 'Investor'`,
    );
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('startup', 'investor')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"public"."users_role_enum"`,
    );
  }
}
