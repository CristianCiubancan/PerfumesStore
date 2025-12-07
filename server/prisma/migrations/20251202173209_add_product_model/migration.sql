-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Men', 'Women', 'Unisex');

-- CreateEnum
CREATE TYPE "Concentration" AS ENUM ('Eau_de_Cologne', 'Eau_de_Toilette', 'Eau_de_Parfum', 'Parfum', 'Extrait_de_Parfum');

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "concentration" "Concentration" NOT NULL,
    "gender" "Gender" NOT NULL,
    "fragranceFamily" TEXT NOT NULL,
    "topNotes" TEXT[],
    "heartNotes" TEXT[],
    "baseNotes" TEXT[],
    "volumeMl" INTEGER NOT NULL,
    "priceUSD" DECIMAL(10,2) NOT NULL,
    "launchYear" INTEGER NOT NULL,
    "perfumer" TEXT,
    "longevity" TEXT NOT NULL,
    "sillage" TEXT NOT NULL,
    "season" TEXT[],
    "occasion" TEXT[],
    "rating" DECIMAL(2,1) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
