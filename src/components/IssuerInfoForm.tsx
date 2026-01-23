'use client';

import { useState, useEffect } from 'react';
import type { IssuerInfo, ArchitectQualification, BuildingStandardCertifier } from '@/types/issuer';
import {
  getOrganizationTypeLabel,
  getArchitectQualificationLabel,
  getBuildingStandardCertifierLabel,
} from '@/types/issuer';

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

  // 組織種別選択
  const renderOrganizationTypeSelection = () => (
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
  );

  // (1) 登録建築士事務所に属する建築士の場合
  const renderRegisteredArchitectOfficeForm = () => {
    const info = issuerInfo as any;

    return (
      <div className="space-y-6">
        {/* 建築士情報 */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">証明を行った建築士</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* 事務所情報 */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">証明を行った建築士の属する建築士事務所</h3>
          <div className="grid grid-cols-1 gap-4">
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

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
  };

  // (2) 指定確認検査機関の場合
  const renderDesignatedInspectionAgencyForm = () => {
    const info = issuerInfo as any;

    return (
      <div className="space-y-6">
        {/* 機関情報 */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">証明を行った指定確認検査機関</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                名称 *
              </label>
              <input
                type="text"
                value={info?.agencyName || ''}
                onChange={(e) =>
                  onChange({ ...info, agencyName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="○○指定確認検査機関"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                住所 *
              </label>
              <input
                type="text"
                value={info?.agencyAddress || ''}
                onChange={(e) =>
                  onChange({ ...info, agencyAddress: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="東京都千代田区○○ 1-2-3"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  指定年月日
                </label>
                <input
                  type="date"
                  value={info?.agencyDesignationDate || ''}
                  onChange={(e) =>
                    onChange({ ...info, agencyDesignationDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  指定番号
                </label>
                <input
                  type="text"
                  value={info?.agencyDesignationNumber || ''}
                  onChange={(e) =>
                    onChange({ ...info, agencyDesignationNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="第00000号"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                指定をした者 *
              </label>
              <input
                type="text"
                value={info?.agencyDesignator || ''}
                onChange={(e) =>
                  onChange({ ...info, agencyDesignator: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="国土交通大臣"
              />
            </div>
          </div>
        </div>

        {/* 調査を行った建築士 */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">調査を行った建築士又は建築基準適合判定資格者</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
  };

  // (3) 登録住宅性能評価機関の場合
  const renderRegisteredEvaluationAgencyForm = () => {
    const info = issuerInfo as any;

    return (
      <div className="space-y-6">
        {/* 機関情報 */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">証明を行った登録住宅性能評価機関</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                名称 *
              </label>
              <input
                type="text"
                value={info?.agencyName || ''}
                onChange={(e) =>
                  onChange({ ...info, agencyName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="○○住宅性能評価機関"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                住所 *
              </label>
              <input
                type="text"
                value={info?.agencyAddress || ''}
                onChange={(e) =>
                  onChange({ ...info, agencyAddress: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="東京都千代田区○○ 1-2-3"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  登録年月日
                </label>
                <input
                  type="date"
                  value={info?.agencyRegistrationDate || ''}
                  onChange={(e) =>
                    onChange({ ...info, agencyRegistrationDate: e.target.value })
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
                  value={info?.agencyRegistrationNumber || ''}
                  onChange={(e) =>
                    onChange({ ...info, agencyRegistrationNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="第00000号"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                登録をした者 *
              </label>
              <input
                type="text"
                value={info?.agencyRegistrar || ''}
                onChange={(e) =>
                  onChange({ ...info, agencyRegistrar: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="国土交通大臣"
              />
            </div>
          </div>
        </div>

        {/* 調査を行った建築士 */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">調査を行った建築士又は建築基準適合判定資格者</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
  };

  // (4) 住宅瑕疵担保責任保険法人の場合
  const renderWarrantyInsuranceCorporationForm = () => {
    const info = issuerInfo as any;

    return (
      <div className="space-y-6">
        {/* 法人情報 */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">証明を行った住宅瑕疵担保責任保険法人</h3>
          <div className="grid grid-cols-1 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
  };

  // 組織種別に応じて異なるフォームを表示
  const renderOrganizationSpecificForm = () => {
    if (!organizationType) return null;

    switch (organizationType) {
      case 'registered_architect_office':
        return renderRegisteredArchitectOfficeForm();
      case 'designated_inspection_agency':
        return renderDesignatedInspectionAgencyForm();
      case 'registered_evaluation_agency':
        return renderRegisteredEvaluationAgencyForm();
      case 'warranty_insurance_corporation':
        return renderWarrantyInsuranceCorporationForm();
      default:
        return null;
    }
  };

  return (
    <div>
      {renderOrganizationTypeSelection()}
      {renderOrganizationSpecificForm()}
    </div>
  );
}
