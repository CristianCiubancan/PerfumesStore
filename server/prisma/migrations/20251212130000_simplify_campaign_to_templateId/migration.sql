-- Migration: Simplify NewsletterCampaign to use templateId
-- This migration removes content fields and adds templateId reference

-- Add templateId column (initially nullable for migration)
ALTER TABLE "NewsletterCampaign" ADD COLUMN "templateId" TEXT;

-- Set default templateId for any existing campaigns
-- (assumes 'campaign-example-promo' as the default template)
UPDATE "NewsletterCampaign" SET "templateId" = 'campaign-example-promo' WHERE "templateId" IS NULL;

-- Make templateId non-nullable
ALTER TABLE "NewsletterCampaign" ALTER COLUMN "templateId" SET NOT NULL;

-- Drop the old content columns
ALTER TABLE "NewsletterCampaign" DROP COLUMN IF EXISTS "subject";
ALTER TABLE "NewsletterCampaign" DROP COLUMN IF EXISTS "heading";
ALTER TABLE "NewsletterCampaign" DROP COLUMN IF EXISTS "body";
ALTER TABLE "NewsletterCampaign" DROP COLUMN IF EXISTS "ctaText";
ALTER TABLE "NewsletterCampaign" DROP COLUMN IF EXISTS "ctaUrl";
ALTER TABLE "NewsletterCampaign" DROP COLUMN IF EXISTS "targetLocales";

-- Add index on templateId
CREATE INDEX "NewsletterCampaign_templateId_idx" ON "NewsletterCampaign"("templateId");
