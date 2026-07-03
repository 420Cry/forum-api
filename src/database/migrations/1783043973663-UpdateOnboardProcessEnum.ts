import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateOnboardProcessEnum1783043973663 implements MigrationInterface {
    name = 'UpdateOnboardProcessEnum1783043973663'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."users_onboard_process_enum" ADD VALUE 'Completed'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_onboard_process_enum_old" AS ENUM('RoleSelection', 'GoalSelection', 'BasicInfo')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "onboard_process" TYPE "public"."users_onboard_process_enum_old" USING "onboard_process"::"text"::"public"."users_onboard_process_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."users_onboard_process_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_onboard_process_enum_old" RENAME TO "users_onboard_process_enum"`);
    }

}
