import { MigrationInterface, QueryRunner } from 'typeorm'

export class TagsJunctionCreation1782870675851 implements MigrationInterface {
  name = 'TagsJunctionCreation1782870675851'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tags" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_d90243459a697eadb8ad56e9092" UNIQUE ("name"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "user_tag" ("usersSupabaseUid" uuid NOT NULL, "tagsId" integer NOT NULL, CONSTRAINT "PK_049b2a0049463e07afc3f5a1a23" PRIMARY KEY ("usersSupabaseUid", "tagsId"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_ad7af5ea938a22b733e897680f" ON "user_tag"  ("usersSupabaseUid") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_3189cd408f54140342462b551a" ON "user_tag"  ("tagsId") `,
    )
    await queryRunner.query(
      `ALTER TABLE "user_tag" ADD CONSTRAINT "FK_ad7af5ea938a22b733e897680f3" FOREIGN KEY ("usersSupabaseUid") REFERENCES "users"("supabaseUid") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_tag" ADD CONSTRAINT "FK_3189cd408f54140342462b551ab" FOREIGN KEY ("tagsId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_tag" DROP CONSTRAINT "FK_3189cd408f54140342462b551ab"`,
    )
    await queryRunner.query(
      `ALTER TABLE "user_tag" DROP CONSTRAINT "FK_ad7af5ea938a22b733e897680f3"`,
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3189cd408f54140342462b551a"`,
    )
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ad7af5ea938a22b733e897680f"`,
    )
    await queryRunner.query(`DROP TABLE "user_tag"`)
    await queryRunner.query(`DROP TABLE "tags"`)
  }
}
