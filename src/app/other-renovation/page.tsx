'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import { OTHER_RENOVATION_CATEGORIES } from '@/lib/other-renovation-work-types';

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
  const certificateId = searchParams.get('certificateId');

  const [calculationResult, setCalculationResult] = useState<any | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
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

  // 証明書情報を取得
  useEffect(() => {
    if (certificateId) {
      fetch(`/api/certificates/${certificateId}`)
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            setCertificateInfo({
              applicantName: result.data.applicantName,
              propertyAddress: result.data.propertyAddress,
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

    setIsCalculating(true);
    setIsSaving(true);
    try {
      // 新しいAPI構造: 直接証明書に紐付けて保存
      const worksData = data.works.map((work) => {
        const category = OTHER_RENOVATION_CATEGORIES.find((cat) => cat.code === work.categoryCode);
        return {
          categoryCode: work.categoryCode,
          categoryName: category?.name || '',
          workDescription: work.workDescription,
          amount: work.amount,
          residentRatio: work.residentRatio,
        };
      });

      const response = await fetch(`/api/certificates/${certificateId}/other-renovation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          works: worksData,
          subsidyAmount: data.subsidyAmount,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setCalculationResult(result.data.calculation);
        alert('工事データを保存しました');
        // 証明書詳細ページへリダイレクト
        window.location.href = `/certificate/${certificateId}`;
      } else {
        alert('保存エラー: ' + result.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('保存中にエラーが発生しました');
    } finally {
      setIsCalculating(false);
      setIsSaving(false);
    }
  };

  return (
    <Layout
      title="その他増改築等工事"
      actions={
        <Link
          href={certificateId ? `/certificate/${certificateId}` : '/certificate/create?step=3'}
          className="px-6 py-2.5 rounded-lg text-base font-medium transition-all duration-200 flex items-center gap-2"
          style={{
            backgroundColor: '#F1F5F9',
            color: '#475569',
          }}
        >
          <ArrowLeft className="w-5 h-5" />
          {certificateId ? '証明書詳細へ戻る' : '証明者情報入力へ'}
        </Link>
      }
    >
      <div className="max-w-5xl">

        {/* 証明書情報表示 */}
        {certificateId && certificateInfo && (
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-indigo-900 mb-2">📋 証明書情報</h2>
            <div className="text-sm text-indigo-800 space-y-1">
              <p><strong>申請者:</strong> {certificateInfo.applicantName}</p>
              <p><strong>物件所在地:</strong> {certificateInfo.propertyAddress}</p>
              <p><strong>証明書ID:</strong> {certificateId}</p>
            </div>
          </div>
        )}

        {/* certificateIdがない場合の警告 */}
        {!certificateId && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              ⚠️ 証明書IDが指定されていません。証明書作成フローから開始してください。
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">工事内容入力</h2>
          <p className="text-sm text-gray-600 mb-6">
            ※ この工事種別は標準単価方式ではなく、実際の工事金額を直接入力します
          </p>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* 工事リスト */}
            <div className="space-y-6">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="border border-gray-200 rounded-lg p-4 relative"
                >
                  {/* 削除ボタン */}
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                    >
                      ✕ 削除
                    </button>
                  )}

                  <h3 className="font-medium mb-4">工事 #{index + 1}</h3>

                  {/* カテゴリ選択 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      工事カテゴリ *
                    </label>
                    <select
                      {...register(`works.${index}.categoryCode`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">選択してください</option>
                      {OTHER_RENOVATION_CATEGORIES.map((category) => (
                        <option key={category.code} value={category.code}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.works?.[index]?.categoryCode && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.works[index]?.categoryCode?.message}
                      </p>
                    )}
                  </div>

                  {/* 選択されたカテゴリの情報表示 */}
                  {watch(`works.${index}.categoryCode`) && (
                    <div className="mb-4 p-3 bg-indigo-50 rounded-md">
                      {(() => {
                        const selectedCategory = OTHER_RENOVATION_CATEGORIES.find(
                          (cat) => cat.code === watch(`works.${index}.categoryCode`)
                        );
                        return selectedCategory ? (
                          <div className="text-sm text-indigo-800">
                            <p><strong>説明:</strong> {selectedCategory.description}</p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  {/* 工事の説明入力 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      工事の説明 *
                    </label>
                    <textarea
                      {...register(`works.${index}.workDescription`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="例: 外壁の全面改修工事"
                      rows={3}
                    />
                    {errors.works?.[index]?.workDescription && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.works[index]?.workDescription?.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 金額入力 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        工事金額 (円) *
                      </label>
                      <input
                        type="number"
                        step="1"
                        {...register(`works.${index}.amount`, { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="例: 1000000"
                      />
                      {errors.works?.[index]?.amount && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.works[index]?.amount?.message}
                        </p>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="例: 80 （空欄可）"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        改修部分のうち、居住用以外の用途に供する部分がある場合に入力
                      </p>
                      {errors.works?.[index]?.residentRatio && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.works[index]?.residentRatio?.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* 工事追加ボタン */}
              <button
                type="button"
                onClick={() => append({ categoryCode: '', workDescription: '', amount: 0, residentRatio: undefined })}
                className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
              >
                + 工事を追加
              </button>
            </div>

            {/* 補助金入力 */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                補助金額 (円)
              </label>
              <input
                type="number"
                step="1"
                {...register('subsidyAmount', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="例: 100000"
              />
              {errors.subsidyAmount && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.subsidyAmount.message}
                </p>
              )}
            </div>

            {/* 保存ボタン */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={isCalculating || isSaving}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isCalculating || isSaving ? '保存中...' : '✓ 工事データを証明書に保存'}
              </button>
              <p className="text-sm text-gray-600 text-center mt-2">
                保存すると証明書に工事データが紐付けられます
              </p>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default function OtherRenovationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
      <OtherRenovationContent />
    </Suspense>
  );
}
