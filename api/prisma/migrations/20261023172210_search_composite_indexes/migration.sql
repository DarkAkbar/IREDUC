-- CreateIndex
CREATE INDEX "Property_status_offerType_communeId_idx" ON "Property"("status", "offerType", "communeId");

-- CreateIndex
CREATE INDEX "Property_status_categoryId_price_idx" ON "Property"("status", "categoryId", "price");

-- CreateIndex
CREATE INDEX "Property_status_kind_offerType_idx" ON "Property"("status", "kind", "offerType");

-- CreateIndex
CREATE INDEX "Service_status_categoryId_idx" ON "Service"("status", "categoryId");

-- CreateIndex
CREATE INDEX "Service_status_isFeatured_idx" ON "Service"("status", "isFeatured");
