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
      alert('証明書IDが指定されていません');
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">その他増改築等工事</h1>
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">証明書情報</h2>
            <div className="text-sm text-blue-800 space-y-1">
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
          <p className="text-sm text-gray-600 mb-6">
            この工事種別は標準単価方式ではなく、実際の工事金額を直接入力します
          </p>

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

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      工事カテゴリ *
                    </label>
                    <select
                      {...register(`works.${index}.categoryCode`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                    <div className="mb-4 p-3 bg-blue-50 rounded-md">
                      {(() => {
                        const selectedCategory = OTHER_RENOVATION_CATEGORIES.find(
                          (cat) => cat.code === watch(`works.${index}.categoryCode`)
                        );
                        return selectedCategory ? (
                          <div className="text-sm text-blue-800">
                            <p><strong>説明:</strong> {selectedCategory.description}</p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      工事の説明 *
                    </label>
                    <textarea
                      {...register(`works.${index}.workDescription`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="例: 外壁の全面改修工事"
                      rows={3}
                    />
                    {errors.works?.[index]?.workDescription && (
                      <p className="mt-1 text-sm text-red-600">{errors.works[index]?.workDescription?.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        工事金額 (円) *
                      </label>
                      <input
                        type="number"
                        step="1"
                        {...register(`works.${index}.amount`, { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="例: 1000000"
                      />
                      {errors.works?.[index]?.amount && (
                        <p className="mt-1 text-sm text-red-600">{errors.works[index]?.amount?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        居住用部分の割合 (%) ※該当する場合のみ
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`works.${index}.residentRatio`, { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                onClick={() => append({ categoryCode: '', workDescription: '', amount: 0, residentRatio: undefined })}
                className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-md text-gray-600
                           hover:border-blue-500 hover:text-blue-600 transition-colors"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700
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

export default function OtherRenovationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
      <OtherRenovationContent />
    </Suspense>
  );
}
