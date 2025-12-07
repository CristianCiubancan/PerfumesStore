-- CreateTable
CREATE TABLE "ExchangeRateSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "feePercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRateSettings_pkey" PRIMARY KEY ("id")
);
