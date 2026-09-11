-- CreateIndex
CREATE UNIQUE INDEX "Product_name_brand_key" ON "Product"("name", "brand");

-- CreateIndex
CREATE UNIQUE INDEX "Salesperson_name_key" ON "Salesperson"("name");

