/*
  Warnings:

  - You are about to drop the column `maxEquityToday` on the `TradingAccount` table. All the data in the column will be lost.
  - You are about to drop the column `minEquityToday` on the `TradingAccount` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN     "challengeType" TEXT NOT NULL DEFAULT 'two_phase',
ADD COLUMN     "eaAllowed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "newsTradingAllowed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "profitSplit" DOUBLE PRECISION NOT NULL DEFAULT 80.0,
ADD COLUMN     "scalingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "weekendHoldingAllowed" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "TradingAccount" DROP COLUMN "maxEquityToday",
DROP COLUMN "minEquityToday";
