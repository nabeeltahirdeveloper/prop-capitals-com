-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('SYSTEM', 'CHALLENGE', 'PAYOUT', 'ACCOUNT');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "category" "NotificationCategory" NOT NULL DEFAULT 'SYSTEM',
ADD COLUMN     "type" "NotificationType" NOT NULL DEFAULT 'INFO';
