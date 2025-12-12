-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "NewsletterCampaign" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "subject" JSONB NOT NULL,
    "heading" JSONB NOT NULL,
    "body" JSONB NOT NULL,
    "ctaText" JSONB,
    "ctaUrl" TEXT,
    "targetLocales" TEXT[],
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "totalRecipients" INTEGER,
    "sentCount" INTEGER,
    "failedCount" INTEGER,
    "sendingStartedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsletterCampaign_status_idx" ON "NewsletterCampaign"("status");

-- CreateIndex
CREATE INDEX "NewsletterCampaign_scheduledFor_idx" ON "NewsletterCampaign"("scheduledFor");

-- CreateIndex
CREATE INDEX "NewsletterCampaign_createdAt_idx" ON "NewsletterCampaign"("createdAt");
