'use client';

import { useRef, useCallback } from 'react';
import type { PurposeType } from '@/lib/store';
import type { StepProps } from '../types';

type Step1Props = StepProps & {
  wasRestored: boolean;
};

export default function Step1BasicInfo({ formData, setFormData, wasRestored }: Step1Props) {
  const postalCodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 郵便番号から住所を検索
  const fetchAddressFromPostalCode = useCallback(async (postalCode: string, fieldType: 'applicant' | 'property') => {
    const cleanedPostalCode = postalCode.replace(/-/g, '');
    if (cleanedPostalCode.length !== 7 || !/^\d{7}$/.test(cleanedPostalCode)) return;

    try {
      const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleanedPostalCode}`);
      const data = await response.json();
      if (data.status === 200 && data.results && data.results.length > 0) {
        const result = data.results[0];
        const address = `${result.address1}${result.address2}${result.address3}`;
        if (fieldType === 'applicant') {
          setFormData(prev => ({ ...prev, applicantAddress: address }));
        } else {
          setFormData(prev => ({ ...prev, propertyAddress: address }));
        }
      }
    } catch (error) {
      console.error('郵便番号検索エラー:', error);
    }
  }, [setFormData]);

  // デバウンス付き郵便番号検索
  const debouncedFetchAddress = useCallback((postalCode: string, fieldType: 'applicant' | 'property') => {
    if (postalCodeTimerRef.current) {
      clearTimeout(postalCodeTimerRef.current);
    }
    postalCodeTimerRef.current = setTimeout(() => {
      fetchAddressFromPostalCode(postalCode, fieldType);
    }, 300);
  }, [fetchAddressFromPostalCode]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">基本情報</h2>

      {wasRestored && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-800">
          前回入力したデータが復元されました。続きから入力できます。
        </div>
      )}

      <div className="space-y-6">
        {/* 申請者情報 */}
        <div className="border-b border-stone-200 pb-6">
          <h3 className="text-lg font-semibold mb-3">申請者情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">氏名 *</label>
              <input type="text" value={formData.applicantName}
                onChange={(e) => setFormData(prev => ({ ...prev, applicantName: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                placeholder="山田 太郎" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">郵便番号</label>
              <input type="text" value={formData.applicantPostalCode}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, applicantPostalCode: value }));
                  if (value.replace(/-/g, '').length === 7) debouncedFetchAddress(value, 'applicant');
                }}
                className="w-full px-3 py-2 border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                placeholder="1000001" maxLength={8} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">住所 *</label>
              <input type="text" value={formData.applicantAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, applicantAddress: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                placeholder="東京都千代田区千代田" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">番地・建物名</label>
              <input type="text" value={formData.applicantAddressDetail}
                onChange={(e) => setFormData(prev => ({ ...prev, applicantAddressDetail: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                placeholder="1-2-3 〇〇ビル 4階" />
            </div>
          </div>
        </div>

        {/* 家屋情報 */}
        <div className="border-b border-stone-200 pb-6">
          <h3 className="text-lg font-semibold mb-3">家屋番号及び所在地</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">郵便番号</label>
              <input type="text" value={formData.propertyPostalCode}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, propertyPostalCode: value }));
                  if (value.replace(/-/g, '').length === 7) debouncedFetchAddress(value, 'property');
                }}
                className="w-full px-3 py-2 border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                placeholder="1000001" maxLength={8} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">所在地 *</label>
              <input type="text" value={formData.propertyAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, propertyAddress: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                placeholder="東京都千代田区千代田 1-2-3" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">家屋番号</label>
              <input type="text" value={formData.propertyNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, propertyNumber: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                placeholder="12番地3" />
            </div>
          </div>
        </div>

        {/* 用途区分（工事種別の前に配置） */}
        <div className="border-b border-stone-200 pb-6">
          <h3 className="text-lg font-semibold mb-3">証明書の用途 *</h3>
          <p className="text-sm text-stone-600 mb-4">証明する工事の内容に該当するものを選択してください。</p>

          {/* Ⅰ．所得税額の特別控除 */}
          <div className="mb-4">
            <div className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full mb-2 inline-block">Ⅰ．所得税額の特別控除</div>
            <div className="space-y-2">
              {[
                { value: 'housing_loan', label: '住宅ローン減税（増改築）をした場合', sub: '（住宅借入金等特別税額控除）', page: '様式 1ページ' },
                { value: 'reform_tax', label: 'リフォーム促進税制＞省エネ改修・子育て対応改修をした場合＞耐震改修・その他増改築をした場合', sub: '（住宅耐震改修特別税額控除又は住宅特定改修特別税額控除）', page: '様式 9ページ' },
                { value: 'resale', label: '買取再販住宅の要件を満たす工事', sub: '（買取再販住宅の取得に係る住宅借入金等特別税額控除）', page: '様式 17ページ' },
              ].map((purpose) => (
                <label key={purpose.value} className={`flex items-start p-3 border-2 rounded-2xl cursor-pointer transition-colors ${
                  formData.purposeType === purpose.value ? 'border-amber-500 bg-amber-50' : 'border-stone-200 hover:border-amber-300'
                }`}>
                  <input type="radio" name="purposeType" value={purpose.value}
                    checked={formData.purposeType === purpose.value}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, purposeType: e.target.value as PurposeType }));
                    }}
                    className="mt-1 mr-3 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{purpose.label}</p>
                    {purpose.sub && <p className="text-xs text-stone-500 mt-0.5">{purpose.sub}</p>}
                    <p className="text-xs text-stone-400 mt-0.5">{purpose.page}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Ⅱ．固定資産税の減額 */}
          <div>
            <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-2 inline-block">Ⅱ．固定資産税の減額</div>
            <div className="space-y-2">
              {[
                { value: 'property_tax', label: '固定資産税減額に資する耐震・省エネ・長期優良住宅化リフォーム', page: '様式 20ページ' },
              ].map((purpose) => (
                <label key={purpose.value} className={`flex items-start p-3 border-2 rounded-2xl cursor-pointer transition-colors ${
                  formData.purposeType === purpose.value ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200 hover:border-emerald-300'
                }`}>
                  <input type="radio" name="purposeType" value={purpose.value}
                    checked={formData.purposeType === purpose.value}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, purposeType: e.target.value as PurposeType }));
                    }}
                    className="mt-1 mr-3 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{purpose.label}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{purpose.page}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 工事情報 */}
        <div className="border-b border-stone-200 pb-6">
          <h3 className="text-lg font-semibold mb-3">工事情報</h3>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-stone-700 mb-1">工事完了年月日 *</label>
            <input type="date" value={formData.completionDate}
              onChange={(e) => setFormData(prev => ({ ...prev, completionDate: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}
