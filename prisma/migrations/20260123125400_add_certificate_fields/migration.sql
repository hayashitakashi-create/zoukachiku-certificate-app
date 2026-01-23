-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantAddress" TEXT NOT NULL,
    "propertyNumber" TEXT,
    "propertyAddress" TEXT NOT NULL,
    "completionDate" TIMESTAMP(3) NOT NULL,
    "purposeType" TEXT NOT NULL,
    "issuerName" TEXT,
    "issuerOfficeName" TEXT,
    "issueDate" TIMESTAMP(3),
    "issuerOrganizationType" TEXT,
    "issuerQualificationNumber" TEXT,
    "subsidyAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeismicWork" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "workTypeCode" TEXT NOT NULL,
    "workName" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "ratio" DECIMAL(5,2),
    "calculatedAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeismicWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeismicSummary" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "subsidyAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductibleAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeismicSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BarrierFreeWork" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "workTypeCode" TEXT NOT NULL,
    "workName" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "ratio" DECIMAL(5,2),
    "calculatedAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BarrierFreeWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BarrierFreeSummary" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "subsidyAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductibleAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BarrierFreeSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnergySavingWork" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "workTypeCode" TEXT NOT NULL,
    "workName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "regionCode" TEXT,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "windowRatio" DECIMAL(5,2),
    "residentRatio" DECIMAL(5,2),
    "calculatedAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnergySavingWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnergySavingSummary" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "subsidyAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductibleAmount" DECIMAL(12,2) NOT NULL,
    "hasSolarPower" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnergySavingSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CohabitationWork" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "workTypeCode" TEXT NOT NULL,
    "workName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "residentRatio" DECIMAL(5,2),
    "calculatedAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CohabitationWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CohabitationSummary" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "subsidyAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductibleAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CohabitationSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildcareWork" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "workTypeCode" TEXT NOT NULL,
    "workName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "residentRatio" DECIMAL(5,2),
    "calculatedAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildcareWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildcareSummary" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "subsidyAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductibleAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildcareSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtherRenovationWork" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "categoryCode" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "workDescription" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "residentRatio" DECIMAL(5,2),
    "calculatedAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtherRenovationWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtherRenovationSummary" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "subsidyAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductibleAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtherRenovationSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LongTermHousingWork" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "workTypeCode" TEXT NOT NULL,
    "workName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "residentRatio" DECIMAL(5,2),
    "calculatedAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LongTermHousingWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LongTermHousingSummary" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "subsidyAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductibleAmount" DECIMAL(12,2) NOT NULL,
    "isExcellentHousing" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LongTermHousingSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Certificate_status_idx" ON "Certificate"("status");

-- CreateIndex
CREATE INDEX "Certificate_createdAt_idx" ON "Certificate"("createdAt");

-- CreateIndex
CREATE INDEX "SeismicWork_certificateId_idx" ON "SeismicWork"("certificateId");

-- CreateIndex
CREATE INDEX "SeismicWork_workTypeCode_idx" ON "SeismicWork"("workTypeCode");

-- CreateIndex
CREATE UNIQUE INDEX "SeismicSummary_certificateId_key" ON "SeismicSummary"("certificateId");

-- CreateIndex
CREATE INDEX "SeismicSummary_certificateId_idx" ON "SeismicSummary"("certificateId");

-- CreateIndex
CREATE INDEX "BarrierFreeWork_certificateId_idx" ON "BarrierFreeWork"("certificateId");

-- CreateIndex
CREATE INDEX "BarrierFreeWork_workTypeCode_idx" ON "BarrierFreeWork"("workTypeCode");

-- CreateIndex
CREATE UNIQUE INDEX "BarrierFreeSummary_certificateId_key" ON "BarrierFreeSummary"("certificateId");

-- CreateIndex
CREATE INDEX "BarrierFreeSummary_certificateId_idx" ON "BarrierFreeSummary"("certificateId");

-- CreateIndex
CREATE INDEX "EnergySavingWork_certificateId_idx" ON "EnergySavingWork"("certificateId");

-- CreateIndex
CREATE INDEX "EnergySavingWork_workTypeCode_idx" ON "EnergySavingWork"("workTypeCode");

-- CreateIndex
CREATE INDEX "EnergySavingWork_category_idx" ON "EnergySavingWork"("category");

-- CreateIndex
CREATE UNIQUE INDEX "EnergySavingSummary_certificateId_key" ON "EnergySavingSummary"("certificateId");

-- CreateIndex
CREATE INDEX "EnergySavingSummary_certificateId_idx" ON "EnergySavingSummary"("certificateId");

-- CreateIndex
CREATE INDEX "CohabitationWork_certificateId_idx" ON "CohabitationWork"("certificateId");

-- CreateIndex
CREATE INDEX "CohabitationWork_workTypeCode_idx" ON "CohabitationWork"("workTypeCode");

-- CreateIndex
CREATE INDEX "CohabitationWork_category_idx" ON "CohabitationWork"("category");

-- CreateIndex
CREATE UNIQUE INDEX "CohabitationSummary_certificateId_key" ON "CohabitationSummary"("certificateId");

-- CreateIndex
CREATE INDEX "CohabitationSummary_certificateId_idx" ON "CohabitationSummary"("certificateId");

-- CreateIndex
CREATE INDEX "ChildcareWork_certificateId_idx" ON "ChildcareWork"("certificateId");

-- CreateIndex
CREATE INDEX "ChildcareWork_workTypeCode_idx" ON "ChildcareWork"("workTypeCode");

-- CreateIndex
CREATE INDEX "ChildcareWork_category_idx" ON "ChildcareWork"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ChildcareSummary_certificateId_key" ON "ChildcareSummary"("certificateId");

-- CreateIndex
CREATE INDEX "ChildcareSummary_certificateId_idx" ON "ChildcareSummary"("certificateId");

-- CreateIndex
CREATE INDEX "OtherRenovationWork_certificateId_idx" ON "OtherRenovationWork"("certificateId");

-- CreateIndex
CREATE INDEX "OtherRenovationWork_categoryCode_idx" ON "OtherRenovationWork"("categoryCode");

-- CreateIndex
CREATE UNIQUE INDEX "OtherRenovationSummary_certificateId_key" ON "OtherRenovationSummary"("certificateId");

-- CreateIndex
CREATE INDEX "OtherRenovationSummary_certificateId_idx" ON "OtherRenovationSummary"("certificateId");

-- CreateIndex
CREATE INDEX "LongTermHousingWork_certificateId_idx" ON "LongTermHousingWork"("certificateId");

-- CreateIndex
CREATE INDEX "LongTermHousingWork_workTypeCode_idx" ON "LongTermHousingWork"("workTypeCode");

-- CreateIndex
CREATE INDEX "LongTermHousingWork_category_idx" ON "LongTermHousingWork"("category");

-- CreateIndex
CREATE UNIQUE INDEX "LongTermHousingSummary_certificateId_key" ON "LongTermHousingSummary"("certificateId");

-- CreateIndex
CREATE INDEX "LongTermHousingSummary_certificateId_idx" ON "LongTermHousingSummary"("certificateId");

-- AddForeignKey
ALTER TABLE "SeismicWork" ADD CONSTRAINT "SeismicWork_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarrierFreeWork" ADD CONSTRAINT "BarrierFreeWork_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnergySavingWork" ADD CONSTRAINT "EnergySavingWork_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohabitationWork" ADD CONSTRAINT "CohabitationWork_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildcareWork" ADD CONSTRAINT "ChildcareWork_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtherRenovationWork" ADD CONSTRAINT "OtherRenovationWork_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LongTermHousingWork" ADD CONSTRAINT "LongTermHousingWork_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "Certificate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
