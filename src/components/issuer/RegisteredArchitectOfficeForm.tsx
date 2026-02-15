'use client';

import type { IssuerInfo, ArchitectQualification } from '@/types/issuer';
import { getArchitectQualificationLabel } from '@/types/issuer';
import type { OrgFormProps } from './IssuerInfoForm';

export default function RegisteredArchitectOfficeForm({ issuerInfo, onChange }: OrgFormProps) {
  const info = issuerInfo as any;

  return (
    <div className="space-y-6">
      {/* 建築士情報 */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold mb-4">証明を行った建築士</h3>
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

      {/* 建築士資格 */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold mb-4">建築士資格 *</h3>
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
              登録番号 *
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              登録を受けた都道府県名
              <span className="text-xs text-gray-500 ml-1">（二級建築士又は木造建築士の場合）</span>
            </label>
            <input
              type="text"
              value={info?.architectRegistrationPrefecture || ''}
              onChange={(e) =>
                onChange({ ...info, architectRegistrationPrefecture: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="東京都"
              disabled={info?.architectQualification === 'first_class'}
            />
            {info?.architectQualification === 'first_class' && (
              <p className="text-xs text-gray-400 mt-1">一級建築士の場合は入力不要です</p>
            )}
          </div>
        </div>
      </div>

      {/* 事務所情報 */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold mb-4">証明を行った建築士の属する建築士事務所</h3>
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              名称 *
            </label>
            <input
              type="text"
              value={info?.officeName || ''}
              onChange={(e) =>
                onChange({ ...info, officeName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="○○建築設計事務所"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              所在地 *
            </label>
            <input
              type="text"
              value={info?.officeAddress || ''}
              onChange={(e) =>
                onChange({ ...info, officeAddress: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="東京都千代田区○○ 1-2-3"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            事務所種別
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['first_class', 'second_class', 'wooden'] as const).map((type) => (
              <label
                key={type}
                className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  info?.officeType === type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <input
                  type="radio"
                  name="officeType"
                  value={type}
                  checked={info?.officeType === type}
                  onChange={(e) =>
                    onChange({ ...info, officeType: e.target.value as any })
                  }
                  className="mr-3"
                />
                <span className="text-sm">
                  {type === 'first_class' && '一級建築士事務所'}
                  {type === 'second_class' && '二級建築士事務所'}
                  {type === 'wooden' && '木造建築士事務所'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              登録年月日
            </label>
            <input
              type="date"
              value={info?.officeRegistrationDate || ''}
              onChange={(e) =>
                onChange({ ...info, officeRegistrationDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              登録番号
            </label>
            <input
              type="text"
              value={info?.officeRegistrationNumber || ''}
              onChange={(e) =>
                onChange({ ...info, officeRegistrationNumber: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="第00000号"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
