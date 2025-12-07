-- CreateIndex
CREATE INDEX "Product_gender_idx" ON "Product"("gender");

-- CreateIndex
CREATE INDEX "Product_concentration_idx" ON "Product"("concentration");

-- CreateIndex
CREATE INDEX "Product_brand_idx" ON "Product"("brand");

-- CreateIndex
CREATE INDEX "Product_priceRON_idx" ON "Product"("priceRON");

-- CreateIndex
CREATE INDEX "Product_rating_idx" ON "Product"("rating");

-- CreateIndex
CREATE INDEX "Product_stock_idx" ON "Product"("stock");

-- CreateIndex
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");

-- CreateIndex
CREATE INDEX "Product_fragranceFamilyId_idx" ON "Product"("fragranceFamilyId");

-- CreateIndex
CREATE INDEX "Product_longevityId_idx" ON "Product"("longevityId");

-- CreateIndex
CREATE INDEX "Product_sillageId_idx" ON "Product"("sillageId");
