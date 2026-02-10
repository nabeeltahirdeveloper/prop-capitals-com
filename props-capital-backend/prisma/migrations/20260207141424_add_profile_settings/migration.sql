-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetPasswordExpiry" TIMESTAMP(3),
ADD COLUMN     "resetPasswordOtp" TEXT;

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "leverage" TEXT NOT NULL DEFAULT '1:100',
ADD COLUMN     "lotSize" DOUBLE PRECISION DEFAULT 0.01,
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'dark';
