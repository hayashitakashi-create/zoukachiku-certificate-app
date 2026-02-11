'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { certificateStore, type StandardWorkItem, type WorkSummary } from '@/lib/store';
import {
  SEISMIC_WORK_TYPES,
  calculateSeismicAmount,
  calculateSeismicTotal,
  calculateDeductibleAmount,
} from '@/lib/seismic-work-types';

// フォームのスキーマ
const seismicFormSchema = z.object({
  works: z.array(
    z.object({
      workTypeCode: z.string().min(1, '工事種別を選択してください'),
      quantity: z.number().positive('数量は正の数である必要があります'),
      ratio: z.number().min(0).max(100).optional(),
    })
  ).min(1, '少なくとも1つの工事を追加してください'),
  subsidyAmount: z.number().min(0),
});

type SeismicFormData = z.infer<typeof seismicFormSchema>;

function SeismicReformContent() {
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
  } = useForm<SeismicFormData>({
    resolver: zodResolver(seismicFormSchema),
    defaultValues: {
      works: [{ workTypeCode: '', quantity: 0, ratio: undefined }],
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

  const onSubmit = async (data: SeismicFormData) => {
    if (!certificateId) {
      // 計算を実行して結果をlocalStorageに保存（証明書作成フロー用）
      const totalAmount = calculateSeismicTotal(
        data.works.map((work) => {
          const workType = SEISMIC_WORK_TYPES.find((wt) => wt.code === work.workTypeCode);
          return {
            unitPrice: workType?.unitPrice || 0,
            quantity: work.quantity,
            ratio: work.ratio,
          };
        })
      );
      localStorage.setItem('calc_result_seismic', String(totalAmount));
      alert(`計算結果: ${totalAmount.toLocaleString()}円\n証明書作成ページに反映します。`);
      window.close();
      router.push('/certificate/create?step=4');
      return;
    }

    setIsSaving(true);
    try {
      // クライアント側で計算
      const items: StandardWorkItem[] = data.works.map((work) => {
        const workType = SEISMIC_WORK_TYPES.find((wt) => wt.code === work.workTypeCode);
        const unitPrice = workType?.unitPrice || 0;
        const amount = calculateSeismicAmount(unitPrice, work.quantity, work.ratio);
        return {
          id: crypto.randomUUID(),
          workTypeCode: work.workTypeCode,
          workName: workType?.name || '',
          category: 'seismic',
          unitPrice,
          unit: workType?.unit || '',
          quantity: work.quantity,
          residentRatio: work.ratio ?? 0,
          calculatedAmount: amount,
        };
      });

      const totalAmount = calculateSeismicTotal(
        items.map((item) => ({
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          ratio: item.residentRatio || undefined,
        }))
      );

      const summary: WorkSummary = {
        totalAmount,
        subsidyAmount: data.subsidyAmount,
        deductibleAmount: calculateDeductibleAmount(totalAmount, data.subsidyAmount),
      };

      // IndexedDBに保存
      await certificateStore.saveWorks(certificateId, 'seismic', items, summary);
      alert('工事データを保存しました');
      router.push(`/certificate/${certificateId}`);
    } catch (error) {
      console.error('Save error:', error);
      alert('保存中にエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/30">
      <header className="bg-white/90 border-b border-stone-200 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-stone-800 to-amber-900 bg-clip-text text-transparent">耐震改修工事</h1>
          <Link
            href={certificateId ? `/certificate/${certificateId}` : '/certificate/create?step=4'}
            className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full h-10 px-4 flex items-center transition-colors text-sm font-medium"
          >
            &larr; {certificateId ? '証明書詳細へ戻る' : '（３）費用の額等へ戻る'}
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 証明書情報表示 */}
        {certificateId && certificateInfo && (
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-5 mb-6">
            <h2 className="font-bold text-amber-900 mb-2">証明書情報</h2>
            <div className="text-sm text-amber-800 space-y-1">
              <p><strong>申請者:</strong> {certificateInfo.applicantName}</p>
              <p><strong>物件所在地:</strong> {certificateInfo.propertyAddress}</p>
            </div>
          </div>
        )}


        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-8 mb-6">
          <h2 className="text-xl font-semibold text-stone-800 mb-4">工事内容入力</h2>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="border-2 border-stone-200 rounded-2xl p-5 relative hover:border-amber-200 transition-colors">
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

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      工事種別 *
                    </label>
                    <select
                      {...register(`works.${index}.workTypeCode`)}
                      className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                    >
                      <option value="">選択してください</option>
                      {SEISMIC_WORK_TYPES.map((workType) => (
                        <option key={workType.code} value={workType.code}>
                          {workType.name} ({workType.unitPrice.toLocaleString()}円/{workType.unit})
                        </option>
                      ))}
                    </select>
                    {errors.works?.[index]?.workTypeCode && (
                      <p className="mt-1 text-sm text-red-600">{errors.works[index]?.workTypeCode?.message}</p>
                    )}
                  </div>

                  {watch(`works.${index}.workTypeCode`) && (
                    <div className="mb-4 bg-gradient-to-br from-amber-50 to-stone-50 rounded-2xl p-4 border border-amber-100">
                      {(() => {
                        const selectedWork = SEISMIC_WORK_TYPES.find(
                          (wt) => wt.code === watch(`works.${index}.workTypeCode`)
                        );
                        return selectedWork ? (
                          <div className="text-sm text-stone-700">
                            <p><strong>単価:</strong> {selectedWork.unitPrice.toLocaleString()}円</p>
                            <p><strong>単位:</strong> {selectedWork.unit}</p>
                            <p><strong>説明:</strong> {selectedWork.description}</p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-2">数量 *</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`works.${index}.quantity`, { valueAsNumber: true })}
                        className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                        placeholder="例: 100"
                      />
                      {errors.works?.[index]?.quantity && (
                        <p className="mt-1 text-sm text-red-600">{errors.works[index]?.quantity?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-2">
                        割合 (%) ※マンション等の場合のみ
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`works.${index}.ratio`, { valueAsNumber: true })}
                        className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                        placeholder="例: 60 (空欄可)"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => append({ workTypeCode: '', quantity: 0, ratio: undefined })}
                className="w-full py-3 px-4 border-2 border-dashed border-stone-300 rounded-2xl text-stone-600 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50/50 transition-colors font-medium"
              >
                + 工事を追加
              </button>
            </div>

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

            <div className="mt-6">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-amber-700 to-stone-700 hover:from-amber-800 hover:to-stone-800 text-white shadow-xl shadow-amber-900/20 transition-all h-14 rounded-full text-base font-semibold hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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

export default function SeismicReformPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
      <SeismicReformContent />
    </Suspense>
  );
}
