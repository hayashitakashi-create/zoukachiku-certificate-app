'use client';

import type { IssuerInfo, ArchitectQualification, BuildingStandardCertifier } from '@/types/issuer';
import {
  getArchitectQualificationLabel,
  getBuildingStandardCertifierLabel,
} from '@/types/issuer';
import type { OrgFormProps } from './IssuerInfoForm';

export default function WarrantyInsuranceCorporationForm({ issuerInfo, onChange }: OrgFormProps) {
  const info = issuerInfo as any;

  return (
    <div className="space-y-6">
      {/* 法人情報 */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold mb-4">証明を行った住宅瑕疵担保責任保険法人</h3>
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              名称 *
            </label>
            <input
              type="text"
              value={info?.corporationName || ''}
              onChange={(e) =>
                onChange({ ...info, corporationName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="○○住宅瑕疵担保責任保険法人"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              住所 *
            </label>
            <input
              type="text"
              value={info?.corporationAddress || ''}
              onChange={(e) =>
                onChange({ ...info, corporationAddress: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="東京都千代田区○○ 1-2-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              指定年月日
            </label>
            <input
              type="date"
              value={info?.corporationDesignationDate || ''}
              onChange={(e) =>
                onChange({ ...info, corporationDesignationDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 調査を行った建築士 */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold mb-4">調査を行った建築士又は建築基準適合判定資格者</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              氏名 *
            </label>
            <input
              type="text"
              value={info?.architectName || ''}
              onChange={(e) =>
                onChange({ ...info, architectName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="山田 一郎"
            />
          </div>
        </div>
      </div>

      {/* 建築士の資格 */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold mb-4">建築士の資格</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(['first_class', 'second_class', 'wooden'] as ArchitectQualification[]).map((qual) => (
            <label
              key={qual}
              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                info?.architectQualification === qual
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <input
                type="radio"
                name="architectQualification"
                value={qual}
                checked={info?.architectQualification === qual}
                onChange={(e) =>
                  onChange({
                    ...info,
                    architectQualification: e.target.value as ArchitectQualification,
                  })
                }
                className="mr-3"
              />
              <span className="font-medium">{getArchitectQualificationLabel(qual)}</span>
            </label>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              登録番号
            </label>
            <input
              type="text"
              value={info?.architectRegistrationNumber || ''}
              onChange={(e) =>
                onChange({ ...info, architectRegistrationNumber: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="第123456号"
            />
          </div>
          {(info?.architectQualification === 'second_class' ||
            info?.architectQualification === 'wooden') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                登録を受けた都道府県名
              </label>
              <input
                type="text"
                value={info?.architectRegistrationPrefecture || ''}
                onChange={(e) =>
                  onChange({ ...info, architectRegistrationPrefecture: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="東京都"
              />
            </div>
          )}
        </div>
      </div>

      {/* 建築基準適合判定資格者 */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold mb-4">建築基準適合判定資格者</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {(['first_class', 'general', 'none'] as BuildingStandardCertifier[]).map((cert) => (
            <label
              key={cert}
              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                info?.buildingStandardCertifier === cert
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <input
                type="radio"
                name="buildingStandardCertifier"
                value={cert}
                checked={info?.buildingStandardCertifier === cert}
                onChange={(e) =>
                  onChange({
                    ...info,
                    buildingStandardCertifier: e.target.value as BuildingStandardCertifier,
                  })
                }
                className="mr-3"
              />
              <span className="text-sm">{getBuildingStandardCertifierLabel(cert)}</span>
            </label>
          ))}
        </div>

        {info?.buildingStandardCertifier && info?.buildingStandardCertifier !== 'none' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                登録番号
              </label>
              <input
                type="text"
                value={info?.certifierRegistrationNumber || ''}
                onChange={(e) =>
                  onChange({ ...info, certifierRegistrationNumber: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="第00000号"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                登録を受けた地方整備局等名
              </label>
              <input
                type="text"
                value={info?.certifierRegistrationAuthority || ''}
                onChange={(e) =>
                  onChange({ ...info, certifierRegistrationAuthority: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="関東地方整備局"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
