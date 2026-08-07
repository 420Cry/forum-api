import { MigrationInterface, QueryRunner } from 'typeorm'

export class ReactionsSchema1786094100789 implements MigrationInterface {
  name = 'ReactionsSchema1786094100789'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."reactions_reacted_as_enum" AS ENUM('user', 'organization')`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."reactions_type_enum" AS ENUM('back', 'watch', 'signal', 'celebrate', 'insight')`,
    )
    await queryRunner.query(
      `CREATE TYPE "public"."reactions_reactable_type_enum" AS ENUM('post', 'comment')`,
    )
    await queryRunner.query(
      `CREATE TABLE "reactions" ("id" SERIAL NOT NULL, "profile_id" uuid NOT NULL, "reacted_as" "public"."reactions_reacted_as_enum" NOT NULL, "type" "public"."reactions_type_enum" NOT NULL, "reactable_type" "public"."reactions_reactable_type_enum" NOT NULL, "reactable_id" uuid NOT NULL, CONSTRAINT "PK_0b213d460d0c473bc2fb6ee27f3" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_22c684b481b8c35c1b6f2e4db3" ON "reactions"  ("profile_id", "reactable_type", "reactable_id") `,
    )
    await queryRunner.query(
      `ALTER TABLE "reactions" ADD CONSTRAINT "FK_5b044028267159b4dae94f173b4" FOREIGN KEY ("profile_id") REFERENCES "users"("supabaseUid") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reactions" DROP CONSTRAINT "FK_5b044028267159b4dae94f173b4"`,
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_22c684b481b8c35c1b6f2e4db3"`,
    )
    await queryRunner.query(`DROP TABLE "reactions"`)
    await queryRunner.query(
      `DROP TYPE "public"."reactions_reactable_type_enum"`,
    )
    await queryRunner.query(`DROP TYPE "public"."reactions_type_enum"`)
    await queryRunner.query(`DROP TYPE "public"."reactions_reacted_as_enum"`)
  }
}
