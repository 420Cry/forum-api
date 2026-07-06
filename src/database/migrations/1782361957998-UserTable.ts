import { MigrationInterface, QueryRunner } from 'typeorm'

export class UserTable1782361957998 implements MigrationInterface {
  name = 'UserTable1782361957998'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_onboard_process_enum" AS ENUM('RoleSelection', 'GoalSelection', 'BasicInfo')`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('startup', 'investor')`,
    )
    await queryRunner.query(
      `CREATE TABLE "users" ("supabaseUid" uuid NOT NULL, "email" character varying NOT NULL, "onboard_process" "public"."users_onboard_process_enum" NOT NULL DEFAULT 'RoleSelection', "role" "public"."users_role_enum", "name" character varying, "occupation" character varying, "age" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b1a45af33ff314458cae2145a19" PRIMARY KEY ("supabaseUid"))`,
    )

    await queryRunner.query(
      `ALTER TABLE public.users ADD CONSTRAINT users_supabaseUid_fk FOREIGN KEY ("supabaseUid") REFERENCES auth.users(id) ON DELETE CASCADE`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE public.users DROP CONSTRAINT "users_supabaseUid_fk"`,
    )
    await queryRunner.query(`DROP TABLE "users"`)
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`)
    await queryRunner.query(`DROP TYPE "public"."users_onboard_process_enum"`)
  }
}
