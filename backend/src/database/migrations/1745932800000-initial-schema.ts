import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1745932800000 implements MigrationInterface {
  name = 'InitialSchema1745932800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text NOT NULL,
        "unit" character varying NOT NULL,
        "category" character varying NOT NULL,
        "stock_minimo" integer NOT NULL,
        "status" character varying NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_products_name" ON "products" ("name")
    `);

    await queryRunner.query(`
      CREATE TABLE "movements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" character varying NOT NULL,
        "quantity" integer NOT NULL,
        "reason" character varying NOT NULL,
        "movement_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "product_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_movements_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_movements_product_id" FOREIGN KEY ("product_id") REFERENCES "products" ("id")
          ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_movements_created_at" ON "movements" ("created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_movements_created_at"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "movements"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_name"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
  }
}
