import type { Certificate } from '@/lib/store';
import { generateHousingLoanPDF } from '@/lib/housingLoanPdfGeneratorV2';
import { generatePropertyTaxPDF } from '@/lib/pdf/propertyTaxPdfGenerator';
import { generateReformTaxPDF } from '@/lib/pdf/reformTaxPdfGenerator';
import { generateResalePDF } from '@/lib/pdf/resalePdfGenerator';

export async function generatePdfForCertificate(
  certificate: Certificate,
): Promise<{ pdfBytes: Uint8Array; fileName: string }> {
  const baseData = {
    id: certificate.id,
    applicantName: certificate.applicantName,
    applicantAddress: certificate.applicantAddress,
    propertyNumber: certificate.propertyNumber || null,
    propertyAddress: certificate.propertyAddress,
    completionDate: certificate.completionDate,
    purposeType: certificate.purposeType,
    subsidyAmount: certificate.subsidyAmount || 0,
    issuerName: certificate.issuerName || null,
    issuerOfficeName: certificate.issuerOfficeName || null,
    issuerOrganizationType: certificate.issuerOrganizationType || null,
    issuerQualificationNumber: certificate.issuerQualificationNumber || null,
    issueDate: certificate.issueDate || null,
    status: certificate.status,
    issuerInfo: certificate.issuerInfo || null,
  };

  let pdfBytes: Uint8Array;
  let filePrefix: string;

  switch (certificate.purposeType) {
    case 'housing_loan': {
      const detail = certificate.housingLoanDetail;
      pdfBytes = await generateHousingLoanPDF({
        ...baseData,
        housingLoanDetail: detail ? {
          id: certificate.id,
          workTypes: detail.workTypes,
          workDescription: detail.workDescription || null,
          totalCost: detail.totalCost,
          hasSubsidy: detail.subsidyAmount > 0,
          subsidyAmount: detail.subsidyAmount,
          deductibleAmount: detail.deductibleAmount,
        } : null,
      });
      filePrefix = 'housing-loan';
      break;
    }
    case 'property_tax': {
      const works = certificate.works;
      pdfBytes = await generatePropertyTaxPDF({
        ...baseData,
        seismic: works.seismic.summary ? {
          totalAmount: works.seismic.summary.totalAmount,
          subsidyAmount: works.seismic.summary.subsidyAmount,
          deductibleAmount: works.seismic.summary.deductibleAmount,
        } : undefined,
        barrierFree: works.barrierFree.summary ? {
          totalAmount: works.barrierFree.summary.totalAmount,
          subsidyAmount: works.barrierFree.summary.subsidyAmount,
          deductibleAmount: works.barrierFree.summary.deductibleAmount,
        } : undefined,
        energySaving: works.energySaving.summary ? {
          totalAmount: works.energySaving.summary.totalAmount,
          subsidyAmount: works.energySaving.summary.subsidyAmount,
          deductibleAmount: works.energySaving.summary.deductibleAmount,
          hasSolarPower: works.energySaving.summary.hasSolarPower || false,
        } : undefined,
        longTermHousing: works.longTermHousing.summary ? {
          totalAmount: works.longTermHousing.summary.totalAmount,
          subsidyAmount: works.longTermHousing.summary.subsidyAmount,
          deductibleAmount: works.longTermHousing.summary.deductibleAmount,
          isExcellentHousing: works.longTermHousing.summary.isExcellentHousing || false,
        } : undefined,
      });
      filePrefix = 'property-tax';
      break;
    }
    case 'reform_tax': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rtDetail = (certificate as any).reformTaxDetail;
      if (rtDetail) {
        pdfBytes = await generateReformTaxPDF({
          ...baseData,
          ...rtDetail,
        });
      } else {
        const rtWorks = certificate.works;
        const toWorkCost = (summary: { totalAmount: number; subsidyAmount: number; deductibleAmount: number } | null, limit: number) => {
          if (!summary) return undefined;
          const maxDeduction = Math.min(summary.deductibleAmount, limit);
          return {
            totalAmount: summary.totalAmount,
            subsidyAmount: summary.subsidyAmount,
            deductibleAmount: summary.deductibleAmount,
            maxDeduction,
            excessAmount: Math.max(0, summary.deductibleAmount - maxDeduction),
          };
        };

        const hasSolar = rtWorks.energySaving.summary?.hasSolarPower || false;
        const energyLimit = hasSolar ? 3_500_000 : 2_500_000;

        const ltSummary = rtWorks.longTermHousing.summary;
        const isExcellent = ltSummary?.isExcellentHousing || false;

        let longTermHousingOr: ReturnType<typeof toWorkCost> = undefined;
        let longTermHousingAnd: ReturnType<typeof toWorkCost> & { isExcellentHousing?: boolean } | undefined = undefined;

        if (ltSummary && ltSummary.deductibleAmount > 0) {
          if (isExcellent) {
            const andLimit = hasSolar ? 6_000_000 : 5_000_000;
            const maxDed = Math.min(ltSummary.deductibleAmount, andLimit);
            longTermHousingAnd = {
              totalAmount: ltSummary.totalAmount,
              subsidyAmount: ltSummary.subsidyAmount,
              deductibleAmount: ltSummary.deductibleAmount,
              maxDeduction: maxDed,
              excessAmount: Math.max(0, ltSummary.deductibleAmount - maxDed),
              isExcellentHousing: true,
            };
          } else {
            const orLimit = hasSolar ? 3_500_000 : 2_500_000;
            const maxDed = Math.min(ltSummary.deductibleAmount, orLimit);
            longTermHousingOr = {
              totalAmount: ltSummary.totalAmount,
              subsidyAmount: ltSummary.subsidyAmount,
              deductibleAmount: ltSummary.deductibleAmount,
              maxDeduction: maxDed,
              excessAmount: Math.max(0, ltSummary.deductibleAmount - maxDed),
            };
          }
        }

        pdfBytes = await generateReformTaxPDF({
          ...baseData,
          seismic: toWorkCost(rtWorks.seismic.summary, 2_500_000),
          barrierFree: toWorkCost(rtWorks.barrierFree.summary, 2_000_000),
          energySaving: rtWorks.energySaving.summary ? {
            ...toWorkCost(rtWorks.energySaving.summary, energyLimit)!,
            hasSolarPower: hasSolar,
          } : undefined,
          cohabitation: toWorkCost(rtWorks.cohabitation.summary, 2_500_000),
          childcare: toWorkCost(rtWorks.childcare.summary, 2_500_000),
          longTermHousingOr,
          longTermHousingAnd: longTermHousingAnd as typeof longTermHousingAnd & { isExcellentHousing: boolean } | undefined,
          otherRenovation: rtWorks.otherRenovation.summary ? {
            totalAmount: rtWorks.otherRenovation.summary.totalAmount,
            subsidyAmount: rtWorks.otherRenovation.summary.subsidyAmount,
            deductibleAmount: rtWorks.otherRenovation.summary.deductibleAmount,
            maxDeduction: rtWorks.otherRenovation.summary.deductibleAmount,
            excessAmount: 0,
          } : undefined,
        });
      }
      filePrefix = 'reform-tax';
      break;
    }
    case 'resale': {
      const rsWorks = certificate.works;
      const allSummaries = [
        rsWorks.seismic.summary,
        rsWorks.barrierFree.summary,
        rsWorks.energySaving.summary,
        rsWorks.cohabitation.summary,
        rsWorks.childcare.summary,
        rsWorks.longTermHousing.summary,
        rsWorks.otherRenovation.summary,
      ];
      const totalWorkCost = allSummaries.reduce(
        (sum, s) => sum + (s?.totalAmount ?? 0), 0
      );
      const totalSubsidy = certificate.subsidyAmount || 0;
      const deductible = Math.max(0, totalWorkCost - totalSubsidy);

      const rsDetail = certificate.housingLoanDetail;
      pdfBytes = await generateResalePDF({
        ...baseData,
        totalWorkCost,
        hasSubsidy: totalSubsidy > 0,
        subsidyAmount: totalSubsidy,
        deductibleAmount: deductible,
        housingLoanDetail: rsDetail ? {
          workTypes: rsDetail.workTypes,
          workDescription: rsDetail.workDescription || null,
          totalCost: rsDetail.totalCost,
          hasSubsidy: rsDetail.subsidyAmount > 0,
          subsidyAmount: rsDetail.subsidyAmount,
          deductibleAmount: rsDetail.deductibleAmount,
        } : null,
      });
      filePrefix = 'resale';
      break;
    }
    default:
      throw new Error(`Unsupported purposeType: ${certificate.purposeType}`);
  }

  const fileName = `certificate_${filePrefix}_${certificate.id}_${new Date().toISOString().slice(0, 10)}.pdf`;
  return { pdfBytes, fileName };
}
