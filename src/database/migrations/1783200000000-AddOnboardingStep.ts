import { MigrationInterface, QueryRunner } from 'typeorm'

/**
 * Stores the last onboarding UI step for in-progress users (onboarded_at IS NULL).
 * Cleared when onboarding completes.
 */
export class AddOnboardingStep1783200000000 implements MigrationInterface {
  name = 'AddOnboardingStep1783200000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "onboarding_step" smallint`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "onboarding_step"`)
  }
}
