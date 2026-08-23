import { MigrationInterface, QueryRunner } from 'typeorm'
import { ALL_CATALOG_TAG_SEEDS } from '../../modules/tags/catalog.seeds'

export class TagKindsAndCatalog1786130000000 implements MigrationInterface {
  name = 'TagKindsAndCatalog1786130000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tags_kind_enum" AS ENUM('goal', 'location', 'occupation', 'industry')`,
    )
    await queryRunner.query(
      `ALTER TABLE "tags" ADD "kind" "public"."tags_kind_enum" NOT NULL DEFAULT 'goal'`,
    )
    await queryRunner.query(
      `UPDATE "tags" SET "kind" = 'goal' WHERE "kind" IS NULL OR "kind" = 'goal'`,
    )

    // Names can repeat across kinds (e.g. "Other"); keys stay globally unique.
    await queryRunner.query(
      `ALTER TABLE "tags" DROP CONSTRAINT IF EXISTS "UQ_tag_name"`,
    )
    await queryRunner.query(
      `ALTER TABLE "tags" DROP CONSTRAINT IF EXISTS "UQ_tags_name"`,
    )
    const nameUniques = (await queryRunner.query(`
      SELECT con.conname
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
      WHERE rel.relname = 'tags'
        AND con.contype = 'u'
        AND att.attname = 'name'
        AND array_length(con.conkey, 1) = 1
    `)) as { conname: string }[]
    for (const row of nameUniques) {
      await queryRunner.query(
        `ALTER TABLE "tags" DROP CONSTRAINT "${row.conname}"`,
      )
    }

    await queryRunner.query(`CREATE INDEX "IDX_tags_kind" ON "tags" ("kind")`)

    for (const tag of ALL_CATALOG_TAG_SEEDS) {
      await queryRunner.query(
        `
        INSERT INTO "tags" ("key", "name", "kind")
        VALUES ($1, $2, $3::"public"."tags_kind_enum")
        ON CONFLICT ("key") DO UPDATE
          SET "name" = EXCLUDED."name",
              "kind" = EXCLUDED."kind"
        `,
        [tag.key, tag.name, tag.kind],
      )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "tags" WHERE "kind" IN ('location', 'occupation', 'industry')`,
    )
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_tags_kind"`)
    await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "kind"`)
    await queryRunner.query(`DROP TYPE "public"."tags_kind_enum"`)
  }
}
