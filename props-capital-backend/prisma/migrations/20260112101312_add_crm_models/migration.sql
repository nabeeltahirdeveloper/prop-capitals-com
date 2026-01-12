-- CreateEnum
CREATE TYPE "LeadOnlineStatus" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CALLBACK', 'FOLLOW_UP', 'CONVERTED', 'LOST');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'BANK_TRANSFER', 'CRYPTO');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'PAYPAL', 'SKRILL', 'NETELLER', 'BINANCE_PAY', 'COINBASE', 'WIRE_TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "LeadActivityType" AS ENUM ('CALL', 'EMAIL', 'WHATSAPP', 'TELEGRAM', 'NOTE', 'STATUS_CHANGE', 'FIELD_UPDATE');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "onlineStatus" "LeadOnlineStatus" NOT NULL DEFAULT 'OFFLINE',
    "leadReceivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "country" TEXT,
    "source" TEXT,
    "leadStatus" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "ftdAmount" DOUBLE PRECISION,
    "paymentMethod" "PaymentMethod",
    "paymentProvider" "PaymentProvider",
    "priority" "LeadPriority" NOT NULL DEFAULT 'MEDIUM',
    "assignedAgent" TEXT,
    "callAttempts" INTEGER NOT NULL DEFAULT 0,
    "age" INTEGER,
    "salary" TEXT,
    "jobIndustry" TEXT,
    "workTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "affiliateId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "funnelName" TEXT,
    "subParameters" TEXT,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CRMMeeting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "description" TEXT,
    "agentName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CRMMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadActivity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "activityType" "LeadActivityType" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_leadStatus_idx" ON "Lead"("leadStatus");

-- CreateIndex
CREATE INDEX "Lead_assignedAgent_idx" ON "Lead"("assignedAgent");

-- CreateIndex
CREATE INDEX "Lead_leadReceivedDate_idx" ON "Lead"("leadReceivedDate");

-- CreateIndex
CREATE INDEX "CRMMeeting_startTime_idx" ON "CRMMeeting"("startTime");

-- CreateIndex
CREATE INDEX "CRMMeeting_status_idx" ON "CRMMeeting"("status");

-- CreateIndex
CREATE INDEX "LeadActivity_leadId_idx" ON "LeadActivity"("leadId");

-- CreateIndex
CREATE INDEX "LeadActivity_createdAt_idx" ON "LeadActivity"("createdAt");

-- AddForeignKey
ALTER TABLE "LeadActivity" ADD CONSTRAINT "LeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
