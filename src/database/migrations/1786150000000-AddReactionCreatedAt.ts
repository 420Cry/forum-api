import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddReactionCreatedAt1786150000000 implements MigrationInterface {
  name = 'AddReactionCreatedAt1786150000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reactions" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "reactions" DROP COLUMN "createdAt"`)
  }
}
