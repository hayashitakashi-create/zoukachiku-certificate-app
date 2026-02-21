'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { certificateStore, type OtherRenovationItem, type WorkSummary } from '@/lib/store';
import {
  OTHER_RENOVATION_CATEGORIES,
  calculateOtherRenovationAmount,
  calculateOtherRenovationTotal,
  calculateOtherRenovationDeductibleAmount,
} from '@/lib/other-renovation-work-types';

// フォームのスキーマ
const otherRenovationFormSchema = z.object({
  works: z.array(
    z.object({
      categoryCode: z.string().min(1, 'カテゴリを選択してください'),
      workDescription: z.string().min(1, '工事の説明を入力してください'),
      amount: z.number().positive('金額は正の数である必要があります'),
      residentRatio: z.number().min(0).max(100).optional(),
    })
  ).min(1, '少なくとも1つの工事を追加してください'),
  subsidyAmount: z.number().min(0),
});

type OtherRenovationFormData = z.infer<typeof otherRenovationFormSchema>;

function OtherRenovationContent() {
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
  } = useForm<OtherRenovationFormData>({
    resolver: zodResolver(otherRenovationFormSchema),
    defaultValues: {
      works: [{ categoryCode: '', workDescription: '', amount: 0, residentRatio: undefined }],
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

  const onSubmit = async (data: OtherRenovationFormData) => {
    if (!certificateId) {
      // 計算を実行して結果をlocalStorageに保存（証明書作成フロー用）
      const totalAmount = calculateOtherRenovationTotal(
        data.works.map((work) => ({
          amount: work.amount,
          ratio: work.residentRatio,
        }))
      );
      localStorage.setItem('calc_result_otherRenovation', String(totalAmount));
      if (data.subsidyAmount > 0) {
        localStorage.setItem('calc_subsidy_otherRenovation', String(data.subsidyAmount));
      }
      alert(`計算結果: ${totalAmount.toLocaleString()}円\n証明書作成ページに反映します。`);
      window.close();
      router.push('/certificate/create?step=4');
      return;
    }

    setIsSaving(true);
    try {
      // クライアント側で計算
      const items: OtherRenovationItem[] = data.works.map((work) => {
        const category = OTHER_RENOVATION_CATEGORIES.find((cat) => cat.code === work.categoryCode);
        const calculatedAmount = calculateOtherRenovationAmount(work.amount, work.residentRatio);
        return {
          id: crypto.randomUUID(),
          categoryCode: work.categoryCode,
          categoryName: category?.name || '',
          workDescription: work.workDescription,
          amount: work.amount,
          residentRatio: work.residentRatio ?? 0,
          calculatedAmount,
        };
      });

      const totalAmount = calculateOtherRenovationTotal(
        items.map((item) => ({
          amount: item.amount,
          ratio: item.residentRatio || undefined,
        }))
      );

      const summary: WorkSummary = {
        totalAmount,
        subsidyAmount: data.subsidyAmount,
        deductibleAmount: calculateOtherRenovationDeductibleAmount(totalAmount, data.subsidyAmount),
      };

      // IndexedDBに保存
      await certificateStore.saveWorks(certificateId, 'otherRenovation', items, summary);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-stone-800 to-amber-900 bg-clip-text text-transparent">その他増改築等工事</h1>
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
          <p className="text-sm text-stone-600 mb-6">
            この工事種別は標準単価方式ではなく、実際の工事金額を直接入力します
          </p>

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

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      工事カテゴリ *
                    </label>
                    <select
                      {...register(`works.${index}.categoryCode`)}
                      className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                    >
                      <option value="">選択してください</option>
                      {OTHER_RENOVATION_CATEGORIES.map((category) => (
                        <option key={category.code} value={category.code}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.works?.[index]?.categoryCode && (
                      <p className="mt-1 text-sm text-red-600">{errors.works[index]?.categoryCode?.message}</p>
                    )}
                  </div>

                  {watch(`works.${index}.categoryCode`) && (
                    <div className="mb-4 bg-gradient-to-br from-amber-50 to-stone-50 rounded-2xl p-4 border border-amber-100">
                      {(() => {
                        const selectedCategory = OTHER_RENOVATION_CATEGORIES.find(
                          (cat) => cat.code === watch(`works.${index}.categoryCode`)
                        );
                        return selectedCategory ? (
                          <div className="text-sm text-stone-700">
                            <p><strong>説明:</strong> {selectedCategory.description}</p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      工事の説明 *
                    </label>
                    <textarea
                      {...register(`works.${index}.workDescription`)}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                      placeholder="例: 外壁の全面改修工事"
                      rows={3}
                    />
                    {errors.works?.[index]?.workDescription && (
                      <p className="mt-1 text-sm text-red-600">{errors.works[index]?.workDescription?.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-2">
                        工事金額 (円) *
                      </label>
                      <input
                        type="number"
                        step="1"
                        {...register(`works.${index}.amount`, { valueAsNumber: true })}
                        className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                        placeholder="例: 1000000"
                      />
                      {errors.works?.[index]?.amount && (
                        <p className="mt-1 text-sm text-red-600">{errors.works[index]?.amount?.message}</p>
                      )}
                    </div>

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

              <button
                type="button"
                onClick={() => append({ categoryCode: '', workDescription: '', amount: 0, residentRatio: undefined })}
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
              {errors.subsidyAmount && (
                <p className="mt-1 text-sm text-red-600">{errors.subsidyAmount.message}</p>
              )}
            </div>

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

export default function OtherRenovationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
      <OtherRenovationContent />
    </Suspense>
  );
}
