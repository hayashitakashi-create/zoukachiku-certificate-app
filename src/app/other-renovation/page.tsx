'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { OtherRenovationCalculationResult } from '@/app/api/other-renovation-works/types';

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
  subsidyAmount: z.number().min(0).default(0),
});

type OtherRenovationFormData = z.infer<typeof otherRenovationFormSchema>;

// カテゴリデータ型
type Category = {
  code: string;
  name: string;
  description: string;
};

export default function OtherRenovationPage() {
  const [calculationResult, setCalculationResult] = useState<OtherRenovationCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

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

  // カテゴリデータを取得
  useEffect(() => {
    fetch('/api/other-renovation-works/categories')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setCategories(result.data);
        }
      })
      .catch((error) => console.error('Error fetching categories:', error));
  }, []);

  const onSubmit = async (data: OtherRenovationFormData) => {
    setIsCalculating(true);
    try {
      const response = await fetch('/api/other-renovation-works/calculate', {
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
          その他増改築等工事 計算ツール
        </h1>

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
                      {categories.map((category) => (
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
                        const selectedCategory = categories.find(
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

            {/* 計算ボタン */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={isCalculating}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
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
                    <div className="flex-1">
                      <p className="font-medium">{work.categoryName}</p>
                      <p className="text-sm text-gray-600">{work.workDescription}</p>
                      <p className="text-sm text-gray-600">
                        {work.amount.toLocaleString()}円
                        {work.residentRatio && ` × ${work.residentRatio}%`}
                      </p>
                    </div>
                    <div className="text-right ml-4">
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

              <div className="flex justify-between text-xl font-bold text-indigo-600 pt-2 border-t">
                <span>控除対象額:</span>
                <span>{calculationResult.deductibleAmount.toLocaleString()}円</span>
              </div>

              <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded">
                <p className="text-sm text-indigo-800">
                  ℹ️ その他増改築等工事は住宅借入金等特別控除の対象です
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
