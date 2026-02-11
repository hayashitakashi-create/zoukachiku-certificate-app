'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { certificateStore, type StandardWorkItem, type WorkSummary } from '@/lib/store';
import {
  CHILDCARE_WORK_TYPES,
  calculateChildcareAmount,
  calculateChildcareTotal,
  calculateChildcareDeductibleAmount,
  getChildcareWorkTypesByCategory,
} from '@/lib/childcare-work-types';

// フォームのスキーマ
const childcareFormSchema = z.object({
  works: z.array(
    z.object({
      workTypeCode: z.string().min(1, '工事種別を選択してください'),
      quantity: z.number().positive('数量は正の数である必要があります'),
      residentRatio: z.number().min(0).max(100).optional(),
    })
  ).min(1, '少なくとも1つの工事を追加してください'),
  subsidyAmount: z.number().min(0),
});

type ChildcareFormData = z.infer<typeof childcareFormSchema>;

function ChildcareReformContent() {
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
  } = useForm<ChildcareFormData>({
    resolver: zodResolver(childcareFormSchema),
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

  const onSubmit = async (data: ChildcareFormData) => {
    if (!certificateId) {
      // 計算を実行して結果をlocalStorageに保存（証明書作成フロー用）
      const totalAmount = calculateChildcareTotal(
        data.works.map((work) => {
          const workType = CHILDCARE_WORK_TYPES.find((wt) => wt.code === work.workTypeCode);
          return {
            unitPrice: workType?.unitPrice || 0,
            quantity: work.quantity,
            residentRatio: work.residentRatio,
          };
        })
      );
      localStorage.setItem('calc_result_childcare', String(totalAmount));
      alert(`計算結果: ${totalAmount.toLocaleString()}円\n証明書作成ページに反映します。`);
      window.close();
      router.push('/certificate/create?step=4');
      return;
    }

    setIsSaving(true);
    try {
      // クライアント側で計算
      const items: StandardWorkItem[] = data.works.map((work) => {
        const workType = CHILDCARE_WORK_TYPES.find((wt) => wt.code === work.workTypeCode);
        const unitPrice = workType?.unitPrice || 0;
        const amount = calculateChildcareAmount(unitPrice, work.quantity, work.residentRatio);
        return {
          id: crypto.randomUUID(),
          workTypeCode: work.workTypeCode,
          workName: workType?.name || '',
          category: 'childcare',
          unitPrice,
          unit: workType?.unit || '',
          quantity: work.quantity,
          residentRatio: work.residentRatio ?? 0,
          calculatedAmount: amount,
        };
      });

      const totalAmount = calculateChildcareTotal(
        items.map((item) => ({
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          residentRatio: item.residentRatio || undefined,
        }))
      );

      const summary: WorkSummary = {
        totalAmount,
        subsidyAmount: data.subsidyAmount,
        deductibleAmount: calculateChildcareDeductibleAmount(totalAmount, data.subsidyAmount),
      };

      // IndexedDBに保存
      await certificateStore.saveWorks(certificateId, 'childcare', items, summary);
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
  const categoryMap = getChildcareWorkTypesByCategory();
  const workTypesByCategory = Array.from(categoryMap.entries()).map(([category, works]) => ({
    category,
    works,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/30">
      <header className="bg-white/90 border-b border-stone-200 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-stone-800 to-amber-900 bg-clip-text text-transparent">子育て対応改修工事</h1>
          <Link
            href={certificateId ? `/certificate/${certificateId}` : '/certificate/create?step=4'}
            className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full h-10 px-4 flex items-center transition-colors text-sm font-medium"
          >
            &larr; {certificateId ? '証明書詳細へ戻る' : '（３）費用の額等へ戻る'}
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* 証明書情報表示 */}
        {certificateId && certificateInfo && (
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-4 sm:p-5 mb-6">
            <h2 className="font-bold text-amber-900 mb-2">証明書情報</h2>
            <div className="text-sm text-amber-800 space-y-1">
              <p><strong>申請者:</strong> {certificateInfo.applicantName}</p>
              <p><strong>物件所在地:</strong> {certificateInfo.propertyAddress}</p>
            </div>
          </div>
        )}


        <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-4 sm:p-6 md:p-8 mb-6">
          <h2 className="text-xl font-semibold text-stone-800 mb-4">工事内容入力</h2>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="border-2 border-stone-200 rounded-2xl p-4 sm:p-5 relative hover:border-amber-200 transition-colors">
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      削除
                    </button>
                  )}

                  <h3 className="font-medium text-stone-800 mb-4">工事 #{index + 1}</h3>

                  {/* 工事種別選択（カテゴリ別） */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      工事種別 *
                    </label>
                    <select
                      {...register(`works.${index}.workTypeCode`)}
                      className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
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
                    <div className="mb-4 bg-gradient-to-br from-amber-50 to-stone-50 rounded-2xl p-4 border border-amber-100">
                      {(() => {
                        const selectedWork = CHILDCARE_WORK_TYPES.find(
                          (wt) => wt.code === watch(`works.${index}.workTypeCode`)
                        );
                        return selectedWork ? (
                          <div className="text-sm text-stone-700">
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
                      <label className="block text-sm font-semibold text-stone-700 mb-2">数量 *</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`works.${index}.quantity`, { valueAsNumber: true })}
                        className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                        placeholder="例: 1"
                      />
                      {errors.works?.[index]?.quantity && (
                        <p className="mt-1 text-sm text-red-600">{errors.works[index]?.quantity?.message}</p>
                      )}
                    </div>

                    {/* 割合入力（オプション） */}
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-2">
                        居住用部分の割合 (%) ※該当する場合のみ
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`works.${index}.residentRatio`, { valueAsNumber: true })}
                        className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                        placeholder="例: 80 (空欄可)"
                      />
                      <p className="mt-1 text-xs text-stone-500">
                        改修部分のうち、居住用以外の用途に供する部分がある場合に入力
                      </p>
                      {errors.works?.[index]?.residentRatio && (
                        <p className="mt-1 text-sm text-red-600">{errors.works[index]?.residentRatio?.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* 工事追加ボタン */}
              <button
                type="button"
                onClick={() => append({ workTypeCode: '', quantity: 0, residentRatio: undefined })}
                className="w-full py-3 px-4 border-2 border-dashed border-stone-300 rounded-2xl text-stone-600 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50/50 transition-colors font-medium"
              >
                + 工事を追加
              </button>
            </div>

            {/* 補助金入力 */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-stone-700 mb-2">補助金額 (円)</label>
              <input
                type="number"
                step="1"
                {...register('subsidyAmount', { valueAsNumber: true })}
                className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                placeholder="例: 100000"
              />
            </div>

            {/* 保存ボタン */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-amber-700 to-stone-700 hover:from-amber-800 hover:to-stone-800 text-white shadow-xl shadow-amber-900/20 transition-all h-12 sm:h-14 rounded-full text-base font-semibold hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSaving ? '保存中...' : certificateId ? '工事データを保存' : '計算結果を反映'}
              </button>
              <p className="text-xs text-stone-500 text-center mt-2">
                保存すると証明書に工事データが紐付けられます
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function ChildcareReformPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
      <ChildcareReformContent />
    </Suspense>
  );
}
