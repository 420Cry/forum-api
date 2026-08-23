import { MigrationInterface, QueryRunner } from 'typeorm'
import {
  allocateUniqueUrlKey,
  urlKeySourceFromUser,
} from '../../modules/users/utils/url-key'

export class AddUserUrlKey1786120000000 implements MigrationInterface {
  name = 'AddUserUrlKey1786120000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "url_key" character varying(64)`,
    )

    const rows = (await queryRunner.query(
      `SELECT "supabaseUid", "name", "email" FROM "users"`,
    )) as { supabaseUid: string; name: string | null; email: string }[]

    const taken = new Set<string>()

    for (const row of rows) {
      const urlKey = await allocateUniqueUrlKey(
        urlKeySourceFromUser({ name: row.name, email: row.email }),
        (candidate) => Promise.resolve(taken.has(candidate)),
      )
      taken.add(urlKey)
      await queryRunner.query(
        `UPDATE "users" SET "url_key" = $1 WHERE "supabaseUid" = $2`,
        [urlKey, row.supabaseUid],
      )
    }

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_url_key" ON "users" ("url_key")`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_users_url_key"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "url_key"`)
  }
}
