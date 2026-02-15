'use client';

import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { HousingLoanDetailFormData } from '@/types/housingLoanDetail';

interface CostSectionProps {
  register: UseFormRegister<HousingLoanDetailFormData>;
  totalCost: number;
  hasSubsidy: boolean;
  subsidyAmount: number;
  deductibleAmount: number;
  certificateId: string | null;
  setValue: UseFormSetValue<HousingLoanDetailFormData>;
}

export default function CostSection({
  register,
  totalCost,
  hasSubsidy,
  subsidyAmount,
  deductibleAmount,
  certificateId,
  setValue,
}: CostSectionProps) {
  return (
    <>
      {/* (2) 実施した工事の内容 */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-4 sm:p-6 md:p-8">
        <h2 className="text-lg sm:text-xl font-bold text-stone-800 mb-6">
          (2) 実施した工事の内容
        </h2>
        <textarea
          {...register('workDescription')}
          rows={8}
          className="w-full px-4 py-3 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
          placeholder="実施した工事の内容を記入してください"
        />
      </div>

      {/* (3) 実施した工事の費用の概要 */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-4 sm:p-6 md:p-8">
        <h2 className="text-lg sm:text-xl font-bold text-stone-800 mb-6">
          (3) 実施した工事の費用の概要
        </h2>

        <div className="space-y-7">
          {/* ① 総費用 */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-3">
              ① 第1号工事〜第6号工事に要した費用の額（円）
            </label>
            <input
              type="number"
              {...register('totalCost', { valueAsNumber: true })}
              className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
              placeholder="例: 2,500,000"
            />
            {totalCost > 0 && (
              <p className="mt-2 text-base text-stone-600">
                入力額: {totalCost.toLocaleString()}円
              </p>
            )}
          </div>

          {/* ② 補助金等の交付の有無 */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-3">
              ② 第1号工事〜第6号工事に係る補助金等の交付の有無
            </label>
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  checked={hasSubsidy === true}
                  onChange={() => setValue('hasSubsidy', true)}
                  className="w-5 h-5 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-base">有</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  checked={hasSubsidy === false}
                  onChange={() => setValue('hasSubsidy', false)}
                  className="w-5 h-5 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-base">無</span>
              </label>
            </div>

            {hasSubsidy && (
              <div className="mt-4">
                <label className="block text-sm font-semibold text-stone-700 mb-3">
                  有の場合: 交付される補助金等の額（円）
                </label>
                <input
                  type="number"
                  {...register('subsidyAmount', { valueAsNumber: true })}
                  className="w-full px-4 h-12 rounded-2xl border-2 border-stone-200 focus:border-amber-500 focus:outline-none transition-colors text-sm"
                  placeholder="例: 500,000"
                />
                {subsidyAmount > 0 && (
                  <p className="mt-2 text-base text-stone-600">
                    入力額: {subsidyAmount.toLocaleString()}円
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ③ 控除対象額（自動計算） */}
          <div className="border-t border-stone-200 pt-6">
            <label className="block text-lg sm:text-xl font-bold text-stone-900 mb-3">
              ③ ①から②を差し引いた額（100万円以上必要）
            </label>
            <div className="text-4xl font-bold text-amber-800">
              {deductibleAmount.toLocaleString()}円
            </div>

            {deductibleAmount < 1000000 && deductibleAmount > 0 && (
              <div className="mt-5 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-4">
                <p className="text-base text-stone-700">
                  控除対象額が100万円未満です。住宅借入金等特別控除の対象外となります。
                </p>
              </div>
            )}

            {deductibleAmount >= 1000000 && (
              <div className="mt-5 bg-gradient-to-br from-stone-50 to-amber-50/20 rounded-2xl border border-stone-100 p-4">
                <p className="text-base text-stone-700">
                  控除対象額が100万円以上です。住宅借入金等特別控除の対象となります。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* プレビューボタン */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-4 sm:p-6 md:p-8">
        <button
          type="submit"
          disabled={!certificateId}
          className="w-full bg-gradient-to-r from-amber-700 to-stone-700 hover:from-amber-800 hover:to-stone-800 text-white shadow-xl shadow-amber-900/20 transition-all h-12 sm:h-14 rounded-full text-base font-semibold hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          入力内容を確認する →
        </button>
        <p className="text-base text-stone-600 text-center mt-4">
          入力内容をプレビューで確認後、保存できます
        </p>
      </div>
    </>
  );
}
