-- AlterTable
ALTER TABLE "TradingAccount" ADD COLUMN "minEquityToday" DOUBLE PRECISION,
ADD COLUMN "minEquityOverall" DOUBLE PRECISION,
ADD COLUMN "lastDailyReset" TIMESTAMP(3);

-- Initialize minEquityOverall to initialBalance for existing accounts
UPDATE "TradingAccount" SET "minEquityOverall" = "initialBalance" WHERE "minEquityOverall" IS NULL;

-- Initialize minEquityToday to current equity for existing accounts
UPDATE "TradingAccount" SET "minEquityToday" = "equity" WHERE "minEquityToday" IS NULL;
