-- CreateTable
CREATE TABLE "HousingLoanDetail" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "workTypes" JSONB NOT NULL,
    "workDescription" TEXT,
    "totalCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "hasSubsidy" BOOLEAN NOT NULL DEFAULT false,
    "subsidyAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductibleAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HousingLoanDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HousingLoanDetail_certificateId_key" ON "HousingLoanDetail"("certificateId");

-- CreateIndex
CREATE INDEX "HousingLoanDetail_certificateId_idx" ON "HousingLoanDetail"("certificateId");

-- AddForeignKey
ALTER TABLE "HousingLoanDetail" ADD CONSTRAINT "HousingLoanDetail_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
