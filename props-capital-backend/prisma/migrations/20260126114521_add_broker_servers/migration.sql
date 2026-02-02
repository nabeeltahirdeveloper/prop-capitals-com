-- AlterTable
ALTER TABLE "BrokerServer" ADD COLUMN     "apiKey" TEXT,
ADD COLUMN     "apiSecret" TEXT,
ADD COLUMN     "connectionStatus" TEXT NOT NULL DEFAULT 'not_connected',
ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastSync" TIMESTAMP(3),
ADD COLUMN     "managerLogin" TEXT,
ADD COLUMN     "managerPassword" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC';

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "paymentDetails" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "processedAt" TIMESTAMP(3);
