import { MigrationInterface, QueryRunner } from 'typeorm'

export class PostsSchema1786071519998 implements MigrationInterface {
  name = 'PostsSchema1786071519998'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."posts_visibility_enum" AS ENUM('public', 'private')`,
    )
    await queryRunner.query(
      `CREATE TABLE "posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "profile_id" uuid NOT NULL, "content" text NOT NULL, "visibility" "public"."posts_visibility_enum" NOT NULL, "image_url" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_fccf8ad12448a532feb8127280" ON "posts"  ("createdAt", "id") `,
    )
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_9dbc2524c6f46641f5e7d107da1" FOREIGN KEY ("profile_id") REFERENCES "users"("supabaseUid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_9dbc2524c6f46641f5e7d107da1"`,
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fccf8ad12448a532feb8127280"`,
    )
    await queryRunner.query(`DROP TABLE "posts"`)
    await queryRunner.query(`DROP TYPE "public"."posts_visibility_enum"`)
  }
}
