'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SEISMIC_WORK_TYPES } from '@/lib/seismic-work-types';
import type { SeismicCalculationResult } from '@/app/api/seismic-works/types';

// フォームのスキーマ
const seismicFormSchema = z.object({
  works: z.array(
    z.object({
      workTypeCode: z.string().min(1, '工事種別を選択してください'),
      quantity: z.number().positive('数量は正の数である必要があります'),
      ratio: z.number().min(0).max(100).optional(),
    })
  ).min(1, '少なくとも1つの工事を追加してください'),
  subsidyAmount: z.number().min(0).default(0),
});

type SeismicFormData = z.infer<typeof seismicFormSchema>;

export default function SeismicReformPage() {
  const [calculationResult, setCalculationResult] = useState<SeismicCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

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

  const onSubmit = async (data: SeismicFormData) => {
    setIsCalculating(true);
    try {
      const response = await fetch('/api/seismic-works/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setCalculationResult(result.data);
      } else {
        alert('計算エラー: ' + result.error);
      }
    } catch (error) {
      console.error('Calculation error:', error);
      alert('計算中にエラーが発生しました');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          耐震改修工事 計算ツール
        </h1>

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

            {/* 計算ボタン */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={isCalculating}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isCalculating ? '計算中...' : '金額を計算'}
              </button>
            </div>
          </form>
        </div>

        {/* 計算結果表示 */}
        {calculationResult && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">計算結果</h2>

            {/* 各工事の明細 */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">工事明細</h3>
              <div className="space-y-2">
                {calculationResult.works.map((work, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <p className="font-medium">{work.workName}</p>
                      <p className="text-sm text-gray-600">
                        {work.unitPrice.toLocaleString()}円 × {work.quantity}{work.unit}
                        {work.ratio && ` × ${work.ratio}%`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        {work.calculatedAmount.toLocaleString()}円
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 合計・控除対象額 */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-lg">
                <span>合計金額:</span>
                <span className="font-semibold">
                  {calculationResult.totalAmount.toLocaleString()}円
                </span>
              </div>

              {calculationResult.subsidyAmount > 0 && (
                <div className="flex justify-between">
                  <span>補助金額:</span>
                  <span className="text-red-600">
                    - {calculationResult.subsidyAmount.toLocaleString()}円
                  </span>
                </div>
              )}

              <div className="flex justify-between text-xl font-bold text-blue-600 pt-2 border-t">
                <span>控除対象額:</span>
                <span>{calculationResult.deductibleAmount.toLocaleString()}円</span>
              </div>

              {!calculationResult.isEligible && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    ⚠️ 控除対象額が50万円以下のため、減税対象外です
                  </p>
                </div>
              )}

              {calculationResult.deductibleAmount >= 2500000 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    ℹ️ 耐震改修の控除対象額は最大250万円です
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
