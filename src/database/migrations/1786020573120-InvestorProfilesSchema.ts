import { MigrationInterface, QueryRunner } from 'typeorm'

export class InvestorProfilesSchema1786020573120 implements MigrationInterface {
  name = 'InvestorProfilesSchema1786020573120'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "investor-profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "firm_name" character varying NOT NULL, "description" text, "industry" character varying NOT NULL, "contact_email" character varying NOT NULL, "avatar_url" character varying, "logo_url" character varying, "website_url" character varying, "min_investment_usd" numeric, "max_investment_usd" numeric, "views" integer NOT NULL DEFAULT '0', "connections" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5ea42b435e0e0fc86cdc8184fdf" UNIQUE ("user_id"), CONSTRAINT "REL_5ea42b435e0e0fc86cdc8184fd" UNIQUE ("user_id"), CONSTRAINT "PK_ebb046386def0cdb3d19127e6b3" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `ALTER TABLE "investor-profiles" ADD CONSTRAINT "FK_5ea42b435e0e0fc86cdc8184fdf" FOREIGN KEY ("user_id") REFERENCES "users"("supabaseUid") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "investor-profiles" DROP CONSTRAINT "FK_5ea42b435e0e0fc86cdc8184fdf"`,
    )
    await queryRunner.query(`DROP TABLE "investor-profiles"`)
  }
}
