-- AlterTable
ALTER TABLE "Trade" ADD COLUMN     "breachAt" TIMESTAMP(3),
ADD COLUMN     "breachDrawdownPercentDaily" DOUBLE PRECISION,
ADD COLUMN     "breachDrawdownPercentOverall" DOUBLE PRECISION,
ADD COLUMN     "breachEquity" DOUBLE PRECISION,
ADD COLUMN     "breachPrice" DOUBLE PRECISION,
ADD COLUMN     "breachTriggered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "breachType" TEXT,
ADD COLUMN     "breachUnrealizedPnl" DOUBLE PRECISION,
ADD COLUMN     "closeReason" TEXT;
