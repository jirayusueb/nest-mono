ALTER TABLE "post" DROP CONSTRAINT "post_slug_unique";--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "post_slug_active_key" ON "post" USING btree ("slug") WHERE "post"."deleted_at" is null;