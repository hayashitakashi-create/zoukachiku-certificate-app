'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import { SEISMIC_WORK_TYPES } from '@/lib/seismic-work-types';

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

  const onSubmit = async (data: SeismicFormData) => {
    if (!certificateId) {
      alert('証明書IDが指定されていません');
      return;
    }

    setIsCalculating(true);
    setIsSaving(true);
    try {
      // 新しいAPI構造: 直接証明書に紐付けて保存
      const worksData = data.works.map((work) => {
        const workType = SEISMIC_WORK_TYPES.find((wt) => wt.code === work.workTypeCode);
        return {
          workTypeCode: work.workTypeCode,
          workName: workType?.name || '',
          unitPrice: workType?.unitPrice || 0,
          unit: workType?.unit || '',
          quantity: work.quantity,
          ratio: work.ratio,
        };
      });

      const response = await fetch(`/api/certificates/${certificateId}/seismic`, {
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
      title="耐震改修工事"
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
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">📋 証明書情報</h2>
            <div className="text-sm text-blue-800 space-y-1">
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

                  {/* 工事種別選択 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      工事種別 *
                    </label>
                    <select
                      {...register(`works.${index}.workTypeCode`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">選択してください</option>
                      {SEISMIC_WORK_TYPES.map((workType) => (
                        <option key={workType.code} value={workType.code}>
                          {workType.name} （{workType.unitPrice.toLocaleString()}円/{workType.unit}）
                        </option>
                      ))}
                    </select>
                    {errors.works?.[index]?.workTypeCode && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.works[index]?.workTypeCode?.message}
                      </p>
                    )}
                  </div>

                  {/* 選択された工事種別の情報表示 */}
                  {watch(`works.${index}.workTypeCode`) && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-md">
                      {(() => {
                        const selectedWork = SEISMIC_WORK_TYPES.find(
                          (wt) => wt.code === watch(`works.${index}.workTypeCode`)
                        );
                        return selectedWork ? (
                          <div className="text-sm text-blue-800">
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        数量 *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`works.${index}.quantity`, { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="例: 100"
                      />
                      {errors.works?.[index]?.quantity && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.works[index]?.quantity?.message}
                        </p>
                      )}
                    </div>

                    {/* 割合入力（オプション） */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        割合 (%) ※マンション等の場合のみ
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`works.${index}.ratio`, { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="例: 60 （空欄可）"
                      />
                      {errors.works?.[index]?.ratio && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.works[index]?.ratio?.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* 工事追加ボタン */}
              <button
                type="button"
                onClick={() => append({ workTypeCode: '', quantity: 0, ratio: undefined })}
                className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
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

export default function SeismicReformPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
      <SeismicReformContent />
    </Suspense>
  );
}
