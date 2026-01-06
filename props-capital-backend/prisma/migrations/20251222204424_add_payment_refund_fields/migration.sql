-- AlterTable
-- Add nullable columns
ALTER TABLE "Payment" ADD COLUMN "refundReason" TEXT;
ALTER TABLE "Payment" ADD COLUMN "refundedAt" TIMESTAMP(3);
-- Add updatedAt as nullable first, then update existing rows, then make it NOT NULL
ALTER TABLE "Payment" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "Payment" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
ALTER TABLE "Payment" ALTER COLUMN "updatedAt" SET NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
