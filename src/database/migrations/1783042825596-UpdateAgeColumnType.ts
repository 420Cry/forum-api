import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAgeColumnType1783042825596 implements MigrationInterface {
    name = 'UpdateAgeColumnType1783042825596'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Convert in place so existing values are preserved; blank strings become NULL.
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "age" TYPE integer USING NULLIF("age", '')::integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "age" TYPE character varying USING "age"::character varying`);
    }

}
