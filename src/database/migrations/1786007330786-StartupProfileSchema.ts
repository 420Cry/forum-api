import { MigrationInterface, QueryRunner } from 'typeorm'

export class StartupProfileSchema1786007330786 implements MigrationInterface {
  name = 'StartupProfileSchema1786007330786'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."startup-profiles_stage_enum" AS ENUM('pre_seed', 'seed', 'series_a', 'growth', 'scale', 'exit')`,
    )
    await queryRunner.query(
      `CREATE TABLE "startup-profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "company_name" character varying NOT NULL, "description" text, "stage" "public"."startup-profiles_stage_enum" NOT NULL, "industry" character varying NOT NULL, "website_url" character varying, "contact_email" character varying NOT NULL, "avatar_url" character varying, "logo_url" character varying, "founded_at" date NOT NULL, "views" integer NOT NULL DEFAULT '0', "connections" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_04cde2270b457f8c79dded853fb" UNIQUE ("user_id"), CONSTRAINT "REL_04cde2270b457f8c79dded853f" UNIQUE ("user_id"), CONSTRAINT "PK_3619cabd6056033a3a5a06c4d65" PRIMARY KEY ("id"))`,
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
