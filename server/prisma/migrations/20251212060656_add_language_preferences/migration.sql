-- AlterTable
ALTER TABLE "NewsletterSubscriber" ADD COLUMN     "preferredLanguage" TEXT NOT NULL DEFAULT 'ro';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "orderLocale" TEXT NOT NULL DEFAULT 'ro';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "preferredLanguage" TEXT NOT NULL DEFAULT 'ro';

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_preferredLanguage_idx" ON "NewsletterSubscriber"("preferredLanguage");
