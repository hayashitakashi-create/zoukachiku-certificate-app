'use client';

import type { PurposeType } from '@/lib/store';
import type { StepProps } from '../types';
import { PURPOSE_SECTION_INFO } from '../types';
import Step2PropertyTaxForm from './Step2PropertyTaxForm';
import Step2ReformTaxForm from './Step2ReformTaxForm';
import Step2HousingLoanForm from './Step2HousingLoanForm';

export default function Step2WorkTypes({ formData, setFormData }: StepProps) {
  return (
    <div>
      {formData.purposeType && PURPOSE_SECTION_INFO[formData.purposeType as PurposeType] && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-xs font-semibold text-amber-700">{PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].category}</p>
          <p className="text-sm font-bold text-amber-900 mt-1">
            {PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].sectionNumber}．{PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].title}
          </p>
        </div>
      )}
      <h2 className="text-xl font-bold mb-2">（１）実施した工事の種別</h2>
      <p className="text-sm text-stone-600 mb-6">
        公式様式に準拠した工事種別の詳細項目を選択してください。
      </p>

      {/* === 固定資産税用フォーム === */}
      {formData.purposeType === 'property_tax' && (
        <Step2PropertyTaxForm formData={formData} setFormData={setFormData} />
      )}

      {/* === reform_tax 専用フォーム（セクションIII 工事の種別） === */}
      {formData.purposeType === 'reform_tax' && (
        <Step2ReformTaxForm formData={formData} setFormData={setFormData} />
      )}

      {/* === 所得税控除用フォーム（housing_loan, resale） === */}
      {(formData.purposeType === 'housing_loan' || formData.purposeType === 'resale') && (
        <Step2HousingLoanForm formData={formData} setFormData={setFormData} />
      )}
    </div>
  );
}
