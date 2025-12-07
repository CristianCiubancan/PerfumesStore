-- Add CHECK constraints for data integrity

-- Product table constraints
ALTER TABLE "Product" ADD CONSTRAINT "Product_priceRON_positive" CHECK ("priceRON" >= 0);
ALTER TABLE "Product" ADD CONSTRAINT "Product_rating_range" CHECK ("rating" >= 0 AND "rating" <= 5);
ALTER TABLE "Product" ADD CONSTRAINT "Product_stock_positive" CHECK ("stock" >= 0);

-- Promotion table constraints
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_discount_range" CHECK ("discountPercent" >= 1 AND "discountPercent" <= 99);
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_date_range" CHECK ("endDate" > "startDate");

-- Add composite index for efficient audit trail queries by user and time
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");
