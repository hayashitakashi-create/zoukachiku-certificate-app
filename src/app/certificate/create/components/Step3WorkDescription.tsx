'use client';

import type { PurposeType } from '@/lib/store';
import type { StepProps } from '../types';
import { PURPOSE_SECTION_INFO } from '../types';

export default function Step3WorkDescription({ formData, setFormData }: StepProps) {
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
      <h2 className="text-xl font-bold mb-2">（２）実施した工事の内容</h2>
      <p className="text-sm text-stone-600 mb-6">
        実施した増改築等の内容を記入してください。
      </p>

      <textarea
        value={formData.workDescriptions['_all'] || ''}
        onChange={(e) => setFormData(prev => ({
          ...prev,
          workDescriptions: { ...prev.workDescriptions, '_all': e.target.value },
        }))}
        rows={8}
        className="w-full px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
        placeholder="例：居室の窓の断熱改修工事（内窓の設置）、天井・壁・床の断熱改修工事（断熱材の施工）等"
      />
    </div>
  );
}
