/*
  Warnings:

  - You are about to drop the column `fragranceFamily` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `longevity` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `occasion` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `season` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `sillage` on the `Product` table. All the data in the column will be lost.
  - Added the required column `fragranceFamilyId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longevityId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sillageId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "fragranceFamily",
DROP COLUMN "longevity",
DROP COLUMN "occasion",
DROP COLUMN "season",
DROP COLUMN "sillage",
ADD COLUMN     "fragranceFamilyId" INTEGER NOT NULL,
ADD COLUMN     "longevityId" INTEGER NOT NULL,
ADD COLUMN     "sillageId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "FragranceFamily" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FragranceFamily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Longevity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Longevity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sillage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Sillage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Occasion" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Occasion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProductOccasions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ProductOccasions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProductSeasons" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ProductSeasons_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "FragranceFamily_name_key" ON "FragranceFamily"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Longevity_name_key" ON "Longevity"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Sillage_name_key" ON "Sillage"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Season_name_key" ON "Season"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Occasion_name_key" ON "Occasion"("name");

-- CreateIndex
CREATE INDEX "_ProductOccasions_B_index" ON "_ProductOccasions"("B");

-- CreateIndex
CREATE INDEX "_ProductSeasons_B_index" ON "_ProductSeasons"("B");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_fragranceFamilyId_fkey" FOREIGN KEY ("fragranceFamilyId") REFERENCES "FragranceFamily"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_longevityId_fkey" FOREIGN KEY ("longevityId") REFERENCES "Longevity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_sillageId_fkey" FOREIGN KEY ("sillageId") REFERENCES "Sillage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductOccasions" ADD CONSTRAINT "_ProductOccasions_A_fkey" FOREIGN KEY ("A") REFERENCES "Occasion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductOccasions" ADD CONSTRAINT "_ProductOccasions_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductSeasons" ADD CONSTRAINT "_ProductSeasons_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductSeasons" ADD CONSTRAINT "_ProductSeasons_B_fkey" FOREIGN KEY ("B") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
