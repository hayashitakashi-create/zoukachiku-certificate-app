import { certificateStore, type PurposeType } from '@/lib/store';
import { convertFormStateToWorkData } from '@/components/CostCalculationStep';
import type { CertificateFormData } from './types';

export async function executeSaveCertificate(
  formData: CertificateFormData,
  status: 'draft' | 'completed',
  userId: string | undefined,
  existingId?: string,
): Promise<string> {
  const fullApplicantAddress = formData.applicantAddress + (formData.applicantAddressDetail || '');

  // issuerInfo から各フィールドを抽出
  let issuerName = '';
  let issuerOfficeName = '';
  let issuerOrganizationType = '';
  let issuerQualificationNumber = '';

  if (formData.issuerInfo && formData.issuerInfo.organizationType) {
    const info = formData.issuerInfo as any;
    issuerName = info.architectName || '';
    switch (info.organizationType) {
      case 'registered_architect_office':
        issuerOfficeName = info.officeName || '';
        issuerOrganizationType = '登録建築士事務所';
        issuerQualificationNumber = info.architectRegistrationNumber || '';
        break;
      case 'designated_inspection_agency':
        issuerOfficeName = info.agencyName || '';
        issuerOrganizationType = '指定確認検査機関';
        issuerQualificationNumber = info.architectRegistrationNumber || '';
        break;
      case 'registered_evaluation_agency':
        issuerOfficeName = info.agencyName || '';
        issuerOrganizationType = '登録住宅性能評価機関';
        issuerQualificationNumber = info.architectRegistrationNumber || '';
        break;
      case 'warranty_insurance_corporation':
        issuerOfficeName = info.corporationName || '';
        issuerOrganizationType = '住宅瑕疵担保責任保険法人';
        issuerQualificationNumber = info.architectRegistrationNumber || '';
        break;
    }
  }

  // WorkData変換
  const workData = convertFormStateToWorkData(formData.workDataForm);

  // 補助金合計を計算
  let totalSubsidy = 0;
  let totalWorkCost = 0;
  for (const data of Object.values(workData)) {
    if (data.summary) {
      totalSubsidy += data.summary.subsidyAmount;
      totalWorkCost += data.summary.totalAmount;
    }
  }

  // housingLoanDetail の構築（housing_loan, resale の場合）
  // 公式様式①②③の値を使用
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let housingLoanDetail: any = null;
  if (formData.purposeType === 'housing_loan' || formData.purposeType === 'resale') {
    const hlCost = formData.housingLoanCost;
    const hlSubsidy = hlCost.hasSubsidy ? hlCost.subsidyAmount : 0;
    const deductible = Math.max(0, hlCost.totalCost - hlSubsidy);
    // saveCertificateでも使う
    totalWorkCost = hlCost.totalCost;
    totalSubsidy = hlSubsidy;
    housingLoanDetail = {
      workTypes: formData.housingLoanWorkTypes,
      workDescription: formData.workDescriptions['_all'] || Object.values(formData.workDescriptions || {}).filter(Boolean).join('、'),
      totalCost: hlCost.totalCost,
      hasSubsidy: hlCost.hasSubsidy,
      subsidyAmount: hlSubsidy,
      deductibleAmount: deductible,
    };
  }

  // reform_tax 用: reformTaxCost から WorkCostData を計算して works + reformTaxDetail に保存
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reformTaxDetail: any = undefined;
  if (formData.purposeType === 'reform_tax') {
    const rc = formData.reformTaxCost;
    const wt = formData.reformTaxWorkTypes;
    const hasSolar = rc.energySaving.hasSolarPower || (wt.energySaving.equipmentTypes.solarPower !== '');
    const isAnd = wt.longTermHousing.isExcellentHousing;

    const buildCost = (cat: { totalAmount: number; hasSubsidy: boolean; subsidyAmount: number }, limit: number, needOver50: boolean) => {
      const sub = cat.hasSubsidy ? cat.subsidyAmount : 0;
      const afterSub = cat.totalAmount - sub;
      const deductible = needOver50 ? (afterSub > 500_000 ? afterSub : 0) : Math.max(0, afterSub);
      const maxDed = limit > 0 ? Math.min(deductible, limit) : deductible;
      const excess = Math.max(0, deductible - maxDed);
      return {
        totalAmount: cat.totalAmount,
        subsidyAmount: sub,
        deductibleAmount: deductible,
        maxDeduction: maxDed,
        excessAmount: excess,
      };
    };

    const seismicCost = buildCost(rc.seismic, 2_500_000, false);
    const bfCost = buildCost(rc.barrierFree, 2_000_000, true);
    const energyLimit = hasSolar ? 3_500_000 : 2_500_000;
    const esCost = buildCost(rc.energySaving, energyLimit, true);
    const cohabCost = buildCost(rc.cohabitation, 2_500_000, true);
    const ccCost = buildCost(rc.childcare, 2_500_000, true);
    // ⑳ その他増改築等（第1号～第6号工事）
    const orSub = rc.otherRenovation.hasSubsidy ? rc.otherRenovation.subsidyAmount : 0;
    const orAfterSub = Math.max(0, rc.otherRenovation.totalAmount - orSub);

    // ⑤ compound (OR)
    const lt5 = rc.longTermOr;
    const lt5BaseSub = lt5.baseHasSubsidy ? lt5.baseSubsidyAmount : 0;
    const lt5BaseAfter = lt5.baseTotalAmount - lt5BaseSub;
    const lt5BaseDed = lt5BaseAfter > 500_000 ? lt5BaseAfter : 0;
    const lt5DurSub = lt5.durabilityHasSubsidy ? lt5.durabilitySubsidyAmount : 0;
    const lt5DurAfter = lt5.durabilityTotalAmount - lt5DurSub;
    const lt5DurDed = lt5DurAfter > 500_000 ? lt5DurAfter : 0;
    const lt5Ki = lt5BaseDed + lt5DurDed;
    const lt5Limit = hasSolar ? 3_500_000 : 2_500_000;
    const lt5Ku = Math.min(lt5Ki, lt5Limit);
    const lt5Ke = Math.max(0, lt5Ki - lt5Ku);
    const lt5Total = lt5.baseTotalAmount + lt5.durabilityTotalAmount;
    const lt5SubTotal = lt5BaseSub + lt5DurSub;

    // ⑥ compound (AND)
    const lt6 = rc.longTermAnd;
    const lt6SesSub = lt6.seismicHasSubsidy ? lt6.seismicSubsidyAmount : 0;
    const lt6SesAfter = lt6.seismicTotalAmount - lt6SesSub;
    const lt6SesDed = lt6SesAfter > 500_000 ? lt6SesAfter : 0;
    const lt6EnSub = lt6.energyHasSubsidy ? lt6.energySubsidyAmount : 0;
    const lt6EnAfter = lt6.energyTotalAmount - lt6EnSub;
    const lt6EnDed = lt6EnAfter > 500_000 ? lt6EnAfter : 0;
    const lt6DurSub = lt6.durabilityHasSubsidy ? lt6.durabilitySubsidyAmount : 0;
    const lt6DurAfter = lt6.durabilityTotalAmount - lt6DurSub;
    const lt6DurDed = lt6DurAfter > 500_000 ? lt6DurAfter : 0;
    const lt6Ko = lt6SesDed + lt6EnDed + lt6DurDed;
    const lt6Limit = hasSolar ? 6_000_000 : 5_000_000;
    const lt6Sa = Math.min(lt6Ko, lt6Limit);
    const lt6Shi = Math.max(0, lt6Ko - lt6Sa);
    const lt6Total = lt6.seismicTotalAmount + lt6.energyTotalAmount + lt6.durabilityTotalAmount;
    const lt6SubTotal = lt6SesSub + lt6EnSub + lt6DurSub;

    // works に WorkSummary として保存（WorkData構造に合わせる）
    const toSummary = (cost: { totalAmount: number; subsidyAmount: number; deductibleAmount: number }) => ({
      totalAmount: cost.totalAmount,
      subsidyAmount: cost.subsidyAmount,
      deductibleAmount: cost.deductibleAmount,
    });
    workData.seismic.summary = rc.seismic.totalAmount > 0 ? toSummary(seismicCost) : null;
    workData.barrierFree.summary = rc.barrierFree.totalAmount > 0 ? toSummary(bfCost) : null;
    workData.energySaving.summary = rc.energySaving.totalAmount > 0 ? { ...toSummary(esCost), hasSolarPower: hasSolar } : null;
    workData.cohabitation.summary = rc.cohabitation.totalAmount > 0 ? toSummary(cohabCost) : null;
    if (lt5Total > 0) {
      workData.longTermHousing.summary = { totalAmount: lt5Total, subsidyAmount: lt5SubTotal, deductibleAmount: lt5Ki, isExcellentHousing: false };
    } else if (lt6Total > 0) {
      workData.longTermHousing.summary = { totalAmount: lt6Total, subsidyAmount: lt6SubTotal, deductibleAmount: lt6Ko, isExcellentHousing: true };
    } else {
      workData.longTermHousing.summary = null;
    }
    workData.childcare.summary = rc.childcare.totalAmount > 0 ? toSummary(ccCost) : null;

    // reformTaxDetail 構築（ReformTaxData 相当）
    reformTaxDetail = {
      seismic: rc.seismic.totalAmount > 0 ? seismicCost : undefined,
      barrierFree: rc.barrierFree.totalAmount > 0 ? bfCost : undefined,
      energySaving: rc.energySaving.totalAmount > 0 ? { ...esCost, hasSolarPower: hasSolar } : undefined,
      cohabitation: rc.cohabitation.totalAmount > 0 ? cohabCost : undefined,
      longTermHousingOr: lt5Total > 0 ? {
        totalAmount: lt5Total, subsidyAmount: lt5SubTotal, deductibleAmount: lt5Ki,
        maxDeduction: lt5Ku, excessAmount: lt5Ke,
      } : undefined,
      longTermHousingAnd: lt6Total > 0 ? {
        totalAmount: lt6Total, subsidyAmount: lt6SubTotal, deductibleAmount: lt6Ko,
        maxDeduction: lt6Sa, excessAmount: lt6Shi, isExcellentHousing: true,
      } : undefined,
      childcare: rc.childcare.totalAmount > 0 ? ccCost : undefined,
      otherRenovation: rc.otherRenovation.totalAmount > 0 ? {
        totalAmount: rc.otherRenovation.totalAmount,
        subsidyAmount: orSub,
        deductibleAmount: orAfterSub,
      } : undefined,
      workDescription: formData.workDescriptions['_all'] || '',
    };

    // 合計再計算
    totalWorkCost = 0;
    totalSubsidy = 0;
    for (const data of Object.values(workData)) {
      if ((data as { summary: { totalAmount: number; subsidyAmount: number } | null }).summary) {
        totalWorkCost += (data as { summary: { totalAmount: number; subsidyAmount: number } }).summary.totalAmount;
        totalSubsidy += (data as { summary: { totalAmount: number; subsidyAmount: number } }).summary.subsidyAmount;
      }
    }
  }

  // IndexedDBに保存（existingIdがあれば既存を更新、なければ新規作成）
  const updates = {
    applicantName: formData.applicantName,
    applicantAddress: fullApplicantAddress,
    propertyNumber: formData.propertyNumber,
    propertyAddress: formData.propertyAddress,
    completionDate: formData.completionDate,
    issuerName,
    issuerOfficeName,
    issueDate: formData.issueDate,
    issuerOrganizationType,
    issuerQualificationNumber,
    issuerInfo: formData.issuerInfo as any || null,
    subsidyAmount: totalSubsidy,
    works: workData,
    workDescriptions: formData.workDescriptions,
    housingLoanDetail,
    reformTaxDetail,
    status,
  };

  let certId: string;
  if (existingId) {
    // Verify the existing certificate still exists before updating
    const existing = await certificateStore.getCertificate(existingId);
    if (existing) {
      await certificateStore.updateCertificate(existingId, updates);
      certId = existingId;
    } else {
      // Fallback to creating new if the draft was deleted
      const cert = await certificateStore.createCertificate(formData.purposeType as PurposeType, userId);
      await certificateStore.updateCertificate(cert.id, updates);
      certId = cert.id;
    }
  } else {
    const cert = await certificateStore.createCertificate(formData.purposeType as PurposeType, userId);
    await certificateStore.updateCertificate(cert.id, updates);
    certId = cert.id;
  }

  return certId;
}
