'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { certificateStore, type StandardWorkItem, type WorkSummary } from '@/lib/store';
import {
  COHABITATION_WORK_TYPES,
  calculateCohabitationAmount,
  calculateCohabitationTotal,
  calculateCohabitationDeductibleAmount,
  getCohabitationWorkTypesByCategory,
} from '@/lib/cohabitation-work-types';

// フォームのスキーマ
const cohabitationFormSchema = z.object({
  works: z.array(
    z.object({
      workTypeCode: z.string().min(1, '工事種別を選択してください'),
      quantity: z.number().positive('数量は正の数である必要があります'),
      residentRatio: z.number().min(0).max(100).optional(),
    })
  ).min(1, '少なくとも1つの工事を追加してください'),
  subsidyAmount: z.number().min(0),
});

type CohabitationFormData = z.infer<typeof cohabitationFormSchema>;

function CohabitationReformContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const certificateId = searchParams.get('certificateId');

  const [isSaving, setIsSaving] = useState(false);
  const [certificateInfo, setCertificateInfo] = useState<{
    applicantName: string;
    propertyAddress: string;
  } | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CohabitationFormData>({
    resolver: zodResolver(cohabitationFormSchema),
    defaultValues: {
      works: [{ workTypeCode: '', quantity: 0, residentRatio: undefined }],
      subsidyAmount: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'works',
  });

  // 証明書情報をIndexedDBから取得
  useEffect(() => {
    if (certificateId) {
      certificateStore.getCertificate(certificateId)
        .then((cert) => {
          if (cert) {
            setCertificateInfo({
              applicantName: cert.applicantName,
              propertyAddress: cert.propertyAddress,
            });
          }
        })
        .catch((error) => {
          console.error('Failed to fetch certificate:', error);
        });
    }
  }, [certificateId]);

  const onSubmit = async (data: CohabitationFormData) => {
    if (!certificateId) {
      alert('証明書IDが指定されていません');
      return;
    }

    setIsSaving(true);
    try {
      // クライアント側で計算
      const items: StandardWorkItem[] = data.works.map((work) => {
        const workType = COHABITATION_WORK_TYPES.find((wt) => wt.code === work.workTypeCode);
        const unitPrice = workType?.unitPrice || 0;
        const amount = calculateCohabitationAmount(unitPrice, work.quantity, work.residentRatio);
        return {
          id: crypto.randomUUID(),
          workTypeCode: work.workTypeCode,
          workName: workType?.name || '',
          category: 'cohabitation',
          unitPrice,
          unit: workType?.unit || '',
          quantity: work.quantity,
          residentRatio: work.residentRatio ?? 0,
          calculatedAmount: amount,
        };
      });

      const totalAmount = calculateCohabitationTotal(
        items.map((item) => ({
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          ratio: item.residentRatio || undefined,
        }))
      );

      const summary: WorkSummary = {
        totalAmount,
        subsidyAmount: data.subsidyAmount,
        deductibleAmount: calculateCohabitationDeductibleAmount(totalAmount, data.subsidyAmount),
      };

      // IndexedDBに保存
      await certificateStore.saveWorks(certificateId, 'cohabitation', items, summary);
      alert('工事データを保存しました');
      router.push(`/certificate/${certificateId}`);
    } catch (error) {
      console.error('Save error:', error);
      alert('保存中にエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  // カテゴリ別の工事種別を取得
  const categoryMap = getCohabitationWorkTypesByCategory();
  const workTypesByCategory = Array.from(categoryMap.entries()).map(([category, works]) => ({
    category,
    works,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">同居対応改修工事</h1>
          <Link
            href={certificateId ? `/certificate/${certificateId}` : '/'}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; {certificateId ? '証明書詳細へ戻る' : '一覧へ戻る'}
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* 証明書情報表示 */}
        {certificateId && certificateInfo && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-purple-900 mb-2">証明書情報</h2>
            <div className="text-sm text-purple-800 space-y-1">
              <p><strong>申請者:</strong> {certificateInfo.applicantName}</p>
              <p><strong>物件所在地:</strong> {certificateInfo.propertyAddress}</p>
            </div>
          </div>
        )}

        {!certificateId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              証明書IDが指定されていません。証明書作成フローから開始してください。
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">工事内容入力</h2>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4 relative">
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-sm"
                    >
                      削除
                    </button>
                  )}

                  <h3 className="font-medium mb-4">工事 #{index + 1}</h3>

                  {/* 工事種別選択（カテゴリ別） */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      工事種別 *
                    </label>
                    <select
                      {...register(`works.${index}.workTypeCode`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">選択してください</option>
                      {workTypesByCategory.map((categoryData) => (
                        <optgroup key={categoryData.category} label={categoryData.category}>
                          {categoryData.works.map((workType) => (
                            <option key={workType.code} value={workType.code}>
                              {workType.name} ({workType.unitPrice.toLocaleString()}円/{workType.unit})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {errors.works?.[index]?.workTypeCode && (
                      <p className="mt-1 text-sm text-red-600">{errors.works[index]?.workTypeCode?.message}</p>
                    )}
                  </div>

                  {/* 選択された工事種別の情報表示 */}
                  {watch(`works.${index}.workTypeCode`) && (
                    <div className="mb-4 p-3 bg-purple-50 rounded-md">
                      {(() => {
                        const selectedWork = COHABITATION_WORK_TYPES.find(
                          (wt) => wt.code === watch(`works.${index}.workTypeCode`)
                        );
                        return selectedWork ? (
                          <div className="text-sm text-purple-800">
                            <p><strong>カテゴリ:</strong> {selectedWork.category}</p>
                            <p><strong>単価:</strong> {selectedWork.unitPrice.toLocaleString()}円</p>
                            <p><strong>単位:</strong> {selectedWork.unit}</p>
                            <p><strong>説明:</strong> {selectedWork.description}</p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 数量入力 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">数量 *</label>
                      <input
                        type="number"
                        step="1"
                        {...register(`works.${index}.quantity`, { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        placeholder="例: 1"
                      />
                      {errors.works?.[index]?.quantity && (
                        <p className="mt-1 text-sm text-red-600">{errors.works[index]?.quantity?.message}</p>
                      )}
                    </div>

                    {/* 割合入力（オプション） */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        居住用部分の割合 (%) ※該当する場合のみ
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`works.${index}.residentRatio`, { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        placeholder="例: 80 (空欄可)"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        改修部分のうち、居住用以外の用途に供する部分がある場合に入力
                      </p>
                      {errors.works?.[index]?.residentRatio && (
                        <p className="mt-1 text-sm text-red-600">{errors.works[index]?.residentRatio?.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => append({ workTypeCode: '', quantity: 0, residentRatio: undefined })}
                className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-md text-gray-600
                           hover:border-purple-500 hover:text-purple-600 transition-colors"
              >
                + 工事を追加
              </button>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">補助金額 (円)</label>
              <input
                type="number"
                step="1"
                {...register('subsidyAmount', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                placeholder="例: 100000"
              />
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700
                           disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isSaving ? '保存中...' : '工事データを保存'}
              </button>
              <p className="text-sm text-gray-600 text-center mt-2">
                保存すると証明書に工事データが紐付けられます
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function CohabitationReformPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
      <CohabitationReformContent />
    </Suspense>
  );
}
