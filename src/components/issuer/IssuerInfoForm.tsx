'use client';

import { useState, useEffect } from 'react';
import type { IssuerInfo } from '@/types/issuer';
import RegisteredArchitectOfficeForm from './RegisteredArchitectOfficeForm';
import DesignatedInspectionAgencyForm from './DesignatedInspectionAgencyForm';
import RegisteredEvaluationAgencyForm from './RegisteredEvaluationAgencyForm';
import WarrantyInsuranceCorporationForm from './WarrantyInsuranceCorporationForm';

export type OrgFormProps = {
  issuerInfo: Partial<IssuerInfo> | null;
  onChange: (info: Partial<IssuerInfo>) => void;
};

type Props = {
  issuerInfo: Partial<IssuerInfo> | null;
  onChange: (issuerInfo: Partial<IssuerInfo>) => void;
};

export default function IssuerInfoForm({ issuerInfo, onChange }: Props) {
  const [organizationType, setOrganizationType] = useState<string>(
    issuerInfo?.organizationType || ''
  );

  // 組織種別が変更されたときに、新しい構造でissuerInfoを初期化
  useEffect(() => {
    if (organizationType && organizationType !== issuerInfo?.organizationType) {
      const newInfo: Partial<IssuerInfo> = { organizationType: organizationType as any };
      onChange(newInfo);
    }
  }, [organizationType]);

  // 組織種別に応じて異なるフォームを表示
  const renderOrganizationSpecificForm = () => {
    if (!organizationType) return null;

    switch (organizationType) {
      case 'registered_architect_office':
        return <RegisteredArchitectOfficeForm issuerInfo={issuerInfo} onChange={onChange} />;
      case 'designated_inspection_agency':
        return <DesignatedInspectionAgencyForm issuerInfo={issuerInfo} onChange={onChange} />;
      case 'registered_evaluation_agency':
        return <RegisteredEvaluationAgencyForm issuerInfo={issuerInfo} onChange={onChange} />;
      case 'warranty_insurance_corporation':
        return <WarrantyInsuranceCorporationForm issuerInfo={issuerInfo} onChange={onChange} />;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* 組織種別選択 */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-blue-600">🏢</span>
          組織種別を選択 *
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          証明書を発行できる組織の種類を選択してください
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              value: 'registered_architect_office',
              label: '登録建築士事務所',
              description: '建築士事務所登録を受けた事務所',
            },
            {
              value: 'designated_inspection_agency',
              label: '指定確認検査機関',
              description: '建築基準法に基づく指定機関',
            },
            {
              value: 'registered_evaluation_agency',
              label: '登録住宅性能評価機関',
              description: '住宅品質確保法に基づく評価機関',
            },
            {
              value: 'warranty_insurance_corporation',
              label: '住宅瑕疵担保責任保険法人',
              description: '保険法人の建築士',
            },
          ].map((orgType) => (
            <label
              key={orgType.value}
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                organizationType === orgType.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <input
                type="radio"
                name="organizationType"
                value={orgType.value}
                checked={organizationType === orgType.value}
                onChange={(e) => setOrganizationType(e.target.value)}
                className="mt-1 mr-3"
              />
              <div>
                <p className="font-medium">{orgType.label}</p>
                <p className="text-sm text-gray-600">{orgType.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {renderOrganizationSpecificForm()}
    </div>
  );
}
