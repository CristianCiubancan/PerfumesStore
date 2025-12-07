-- Add CHECK constraint for volumeMl (must be positive)
ALTER TABLE "Product" ADD CONSTRAINT "Product_volumeMl_positive" CHECK ("volumeMl" > 0);

-- Add composite indexes on join tables for better query performance
-- These help with many-to-many filtering (e.g., find products by seasons)
CREATE INDEX IF NOT EXISTS "_ProductSeasons_A_B_idx" ON "_ProductSeasons"("A", "B");
CREATE INDEX IF NOT EXISTS "_ProductOccasions_A_B_idx" ON "_ProductOccasions"("A", "B");
