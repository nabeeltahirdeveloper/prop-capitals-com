-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "discountType" TEXT NOT NULL DEFAULT 'percentage',
ADD COLUMN     "maxUses" INTEGER,
ADD COLUMN     "usedCount" INTEGER NOT NULL DEFAULT 0;
