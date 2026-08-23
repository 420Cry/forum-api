import { MigrationInterface, QueryRunner } from 'typeorm'

export class FollowsSchema1786110000000 implements MigrationInterface {
  name = 'FollowsSchema1786110000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."follows_target_type_enum" AS ENUM('user', 'startup', 'investor')`,
    )
    await queryRunner.query(
      `CREATE TABLE "follows" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "follower_user_id" uuid NOT NULL, "target_type" "public"."follows_target_type_enum" NOT NULL, "target_id" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_follows_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_follows_follower_target" ON "follows" ("follower_user_id", "target_type", "target_id")`,
    )
    await queryRunner.query(
      `ALTER TABLE "follows" ADD CONSTRAINT "FK_follows_follower_user" FOREIGN KEY ("follower_user_id") REFERENCES "users"("supabaseUid") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "follows" DROP CONSTRAINT "FK_follows_follower_user"`,
    )
    await queryRunner.query(`DROP INDEX "public"."IDX_follows_follower_target"`)
    await queryRunner.query(`DROP TABLE "follows"`)
    await queryRunner.query(`DROP TYPE "public"."follows_target_type_enum"`)
  }
}
