/*
  Warnings:

  - You are about to drop the column `apiKey` on the `BrokerServer` table. All the data in the column will be lost.
  - You are about to drop the column `apiSecret` on the `BrokerServer` table. All the data in the column will be lost.
  - You are about to drop the column `connectionStatus` on the `BrokerServer` table. All the data in the column will be lost.
  - You are about to drop the column `isDemo` on the `BrokerServer` table. All the data in the column will be lost.
  - You are about to drop the column `lastSync` on the `BrokerServer` table. All the data in the column will be lost.
  - You are about to drop the column `managerLogin` on the `BrokerServer` table. All the data in the column will be lost.
  - You are about to drop the column `managerPassword` on the `BrokerServer` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `BrokerServer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BrokerServer" DROP COLUMN "apiKey",
DROP COLUMN "apiSecret",
DROP COLUMN "connectionStatus",
DROP COLUMN "isDemo",
DROP COLUMN "lastSync",
DROP COLUMN "managerLogin",
DROP COLUMN "managerPassword",
DROP COLUMN "timezone";

-- AlterTable
ALTER TABLE "ScalingRequest" ADD COLUMN     "newProfitSplit" DOUBLE PRECISION NOT NULL DEFAULT 85.0,
ADD COLUMN     "oldProfitSplit" DOUBLE PRECISION NOT NULL DEFAULT 80.0,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "reason" TEXT;
