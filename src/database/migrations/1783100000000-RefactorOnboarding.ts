import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Onboarding refactor:
 * - tags gain a stable `key` (exact-match goal identity, replaces fuzzy name matching)
 * - users.onboard_process enum is replaced by users.onboarded_at timestamp
 *   (completion = onboarded_at IS NOT NULL)
 *
 * Goal selections and tags are reseeded because the old tag names do not map
 * 1:1 to the new stable keys.
 */
export class RefactorOnboarding1783100000000 implements MigrationInterface {
  name = 'RefactorOnboarding1783100000000'

  private readonly tags: { key: string; name: string }[] = [
    { key: 'raise_capital', name: 'Raise capital' },
    { key: 'find_cofounders', name: 'Find co-founders' },
    { key: 'gather_feedback', name: 'Gather feedback' },
    { key: 'build_following', name: 'Build a following' },
    { key: 'discover_startups', name: 'Discover startups' },
    { key: 'build_deal_flow', name: 'Build deal flow' },
    { key: 'network_peers', name: 'Network with peers' },
    { key: 'market_insights', name: 'Market insights' },
  ]

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- tags: add stable key + reseed ---
    await queryRunner.query(`ALTER TABLE "tags" ADD "key" character varying`)
    await queryRunner.query(
      `TRUNCATE TABLE "user_tag", "tags" RESTART IDENTITY CASCADE`,
    )
    for (const tag of this.tags) {
      await queryRunner.query(
        `INSERT INTO "tags" ("key", "name") VALUES ($1, $2)`,
        [tag.key, tag.name],
      )
    }
    await queryRunner.query(
      `ALTER TABLE "tags" ALTER COLUMN "key" SET NOT NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE "tags" ADD CONSTRAINT "UQ_tags_key" UNIQUE ("key")`,
    )

    // --- users: onboarded_at replaces onboard_process enum ---
    await queryRunner.query(
      `ALTER TABLE "users" ADD "onboarded_at" TIMESTAMP WITH TIME ZONE`,
    )
    await queryRunner.query(
      `UPDATE "users" SET "onboarded_at" = now() WHERE "onboard_process" = 'Completed'`,
    )
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "onboard_process"`)
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."users_onboard_process_enum"`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_onboard_process_enum" AS ENUM('RoleSelection', 'GoalSelection', 'BasicInfo', 'Completed')`,
    )
    await queryRunner.query(
      `ALTER TABLE "users" ADD "onboard_process" "public"."users_onboard_process_enum" NOT NULL DEFAULT 'RoleSelection'`,
    )
    await queryRunner.query(
      `UPDATE "users" SET "onboard_process" = 'Completed' WHERE "onboarded_at" IS NOT NULL`,
    )
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "onboarded_at"`)

    await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "UQ_tags_key"`)
    await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "key"`)
  }
}
