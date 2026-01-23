'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CohabitationCalculationResult } from '@/app/api/cohabitation-works/types';

// フォームのスキーマ
const cohabitationFormSchema = z.object({
  works: z.array(
    z.object({
      workTypeCode: z.string().min(1, '工事種別を選択してください'),
      quantity: z.number().positive('数量は正の数である必要があります'),
      residentRatio: z.number().min(0).max(100).optional(),
    })
  ).min(1, '少なくとも1つの工事を追加してください'),
  subsidyAmount: z.number().min(0).default(0),
});

type CohabitationFormData = z.infer<typeof cohabitationFormSchema>;

// カテゴリ別の工事種別データ型
type WorkTypesByCategory = {
  category: string;
  works: Array<{
    code: string;
    name: string;
    unitPrice: number;
    unit: string;
    description: string;
  }>;
};

export default function CohabitationReformPage() {
  const [calculationResult, setCalculationResult] = useState<CohabitationCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [workTypesByCategory, setWorkTypesByCategory] = useState<WorkTypesByCategory[]>([]);
  const [allWorkTypes, setAllWorkTypes] = useState<any[]>([]);

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

  // 工事種別データを取得
  useEffect(() => {
    fetch('/api/cohabitation-works/work-types')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setAllWorkTypes(result.data.all);
          setWorkTypesByCategory(result.data.byCategory);
        }
      })
      .catch((error) => console.error('Error fetching work types:', error));
  }, []);

  const onSubmit = async (data: CohabitationFormData) => {
    setIsCalculating(true);
    try {
      const response = await fetch('/api/cohabitation-works/calculate', {
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
          同居対応改修工事 計算ツール
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
                              {workType.name} （{workType.unitPrice.toLocaleString()}円/{workType.unit}）
                            </option>
                          ))}
                        </optgroup>
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
                    <div className="mb-4 p-3 bg-purple-50 rounded-md">
                      {(() => {
                        const selectedWork = allWorkTypes.find(
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        数量（箇所） *
                      </label>
                      <input
                        type="number"
                        step="1"
                        {...register(`works.${index}.quantity`, { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        placeholder="例: 1"
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
                        居住用部分の割合 (%) ※該当する場合のみ
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`works.${index}.residentRatio`, { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
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
                onClick={() => append({ workTypeCode: '', quantity: 0, residentRatio: undefined })}
                className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-purple-500 hover:text-purple-600 transition-colors"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
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
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
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

            {/* 各工事の明細（カテゴリ別） */}
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
                        [{work.category}] {work.unitPrice.toLocaleString()}円 × {work.quantity}{work.unit}
                        {work.residentRatio && ` × ${work.residentRatio}%`}
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

              <div className="flex justify-between text-xl font-bold text-purple-600 pt-2 border-t">
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
                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded">
                  <p className="text-sm text-purple-800">
                    ℹ️ 同居対応改修の控除対象額は最大250万円です
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
