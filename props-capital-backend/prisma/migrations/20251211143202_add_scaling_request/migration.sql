-- CreateTable
CREATE TABLE "ScalingRequest" (
    "id" TEXT NOT NULL,
    "tradingAccountId" TEXT NOT NULL,
    "oldBalance" DOUBLE PRECISION NOT NULL,
    "newBalance" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "ScalingRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScalingRequest" ADD CONSTRAINT "ScalingRequest_tradingAccountId_fkey" FOREIGN KEY ("tradingAccountId") REFERENCES "TradingAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
