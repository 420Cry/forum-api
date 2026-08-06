import { MigrationInterface, QueryRunner } from 'typeorm'

export class StartupProfileSchema1785932568894 implements MigrationInterface {
  name = 'StartupProfileSchema1785932568894'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."startup-profiles_stage_enum" AS ENUM('pre_seed', 'seed', 'series_a', 'growth', 'scale', 'exit')`,
    )
    await queryRunner.query(
      `CREATE TABLE "startup-profiles" ("user_id" uuid NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_name" character varying NOT NULL, "description" text, "stage" "public"."startup-profiles_stage_enum" NOT NULL, "industry" character varying NOT NULL, "website_url" character varying, "contact_email" character varying NOT NULL, "avatar_url" character varying, "logo_url" character varying, "founded_at" date NOT NULL, "views" integer NOT NULL DEFAULT '0', "connections" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_3619cabd6056033a3a5a06c4d65" UNIQUE ("id"), CONSTRAINT "PK_04cde2270b457f8c79dded853fb" PRIMARY KEY ("user_id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "startup-profiles" ADD CONSTRAINT "FK_04cde2270b457f8c79dded853fb" FOREIGN KEY ("user_id") REFERENCES "users"("supabaseUid") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "startup-profiles" DROP CONSTRAINT "FK_04cde2270b457f8c79dded853fb"`,
    )
    await queryRunner.query(`DROP TABLE "startup-profiles"`)
    await queryRunner.query(`DROP TYPE "public"."startup-profiles_stage_enum"`)
  }
}
