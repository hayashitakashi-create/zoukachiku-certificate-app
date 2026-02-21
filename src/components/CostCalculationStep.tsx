'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { WorkCategory, WorkData, StandardWorkItem, OtherRenovationItem, WorkSummary } from '@/lib/store/types';
import { SEISMIC_WORK_TYPES, calculateSeismicAmount, calculateDeductibleAmount as calcSeismicDeductible } from '@/lib/seismic-work-types';
import { BARRIER_FREE_WORK_TYPES, calculateBarrierFreeAmount, calculateBarrierFreeDeductibleAmount } from '@/lib/barrier-free-work-types';
import { ENERGY_SAVING_WORK_TYPES, calculateEnergySavingAmount, calculateEnergySavingDeductibleAmount, hasSolarPowerWork } from '@/lib/energy-saving-work-types';
import { COHABITATION_WORK_TYPES, calculateCohabitationAmount, calculateCohabitationDeductibleAmount } from '@/lib/cohabitation-work-types';
import { CHILDCARE_WORK_TYPES, calculateChildcareAmount, calculateChildcareDeductibleAmount } from '@/lib/childcare-work-types';
import { LONG_TERM_HOUSING_WORK_TYPES, calculateLongTermHousingAmount, calculateLongTermHousingDeductibleAmount } from '@/lib/long-term-housing-work-types';
import { OTHER_RENOVATION_CATEGORIES, calculateOtherRenovationAmount, calculateOtherRenovationDeductibleAmount } from '@/lib/other-renovation-work-types';

// =============================================
// 型定義
// =============================================

export type WorkItemFormEntry = {
  id: string;
  workTypeCode: string;
  quantity: number;
  ratio?: number;
  windowRatio?: number;
  amount?: number; // その他増改築用（直接金額）
  workDescription?: string;
  categoryCode?: string;
};

export type WorkTypeFormState = {
  items: WorkItemFormEntry[];
  subsidyAmount: number;
  hasSolarPower?: boolean;
  isExcellentHousing?: boolean;
};

export type WorkDataFormState = Partial<Record<WorkCategory, WorkTypeFormState>>;

// =============================================
// マスターデータ統合ヘルパー
// =============================================

type MasterWorkType = {
  code: string;
  name: string;
  unitPrice: number;
  unit: string;
  category?: string;
  needsWindowRatio?: boolean;
};

const WORK_TYPE_MASTER: Record<string, MasterWorkType[]> = {
  seismic: SEISMIC_WORK_TYPES,
  barrierFree: BARRIER_FREE_WORK_TYPES,
  energySaving: ENERGY_SAVING_WORK_TYPES as MasterWorkType[],
  cohabitation: COHABITATION_WORK_TYPES,
  childcare: CHILDCARE_WORK_TYPES,
  longTermHousing: LONG_TERM_HOUSING_WORK_TYPES,
};

const WORK_CATEGORY_LABELS: Record<string, string> = {
  seismic: '耐震改修工事',
  barrierFree: 'バリアフリー改修工事',
  energySaving: '省エネ改修工事',
  cohabitation: '同居対応改修工事',
  childcare: '子育て対応改修工事',
  longTermHousing: '長期優良住宅化改修工事',
  otherRenovation: 'その他増改築等工事',
};

// 割合(%)入力に関する注意書き（工事種別ごと）
const RATIO_HELP_TEXTS: Record<string, { whenToUse: string; whenToLeaveBlank: string }> = {
  seismic: {
    whenToUse: '耐震改修に係る部分のうちに、減税申請者の居住の用以外の用に供する部分がある場合は、各項目の工事費に対する当該居住の用に供する部分に係った金額の割合（％）をご入力ください。',
    whenToLeaveBlank: '耐震改修に係る部分が減税申請者の居住の用に供する部分のみの場合は空欄としてください。',
  },
  barrierFree: {
    whenToUse: 'バリアフリー改修に係る部分のうちに、減税申請者の居住の用以外の用に供する部分がある場合は、各項目の工事費に対する当該居住の用に供する部分に係った金額の割合（％）をご入力ください。',
    whenToLeaveBlank: 'バリアフリー改修に係る部分が減税申請者の居住の用に供する部分のみの場合は空欄としてください。',
  },
  energySaving: {
    whenToUse: '省エネ改修に係る部分のうちに、減税申請者の居住の用以外の用に供する部分がある場合は、各項目の工事費に対する当該居住の用に供する部分に係った金額の割合（％）をご入力ください。',
    whenToLeaveBlank: '省エネ改修に係る部分が減税申請者の居住の用に供する部分のみの場合は空欄としてください。',
  },
  cohabitation: {
    whenToUse: '同居対応改修に係る部分のうちに、減税申請者の居住の用以外の用に供する部分がある場合は、各項目の工事費に対する当該居住の用に供する部分に係った金額の割合（％）をご入力ください。',
    whenToLeaveBlank: '同居対応改修に係る部分が減税申請者の居住の用に供する部分のみの場合は空欄としてください。',
  },
  childcare: {
    whenToUse: '子育て対応改修に係る部分のうちに、減税申請者の居住の用以外の用に供する部分がある場合は、各項目の工事費に対する当該居住の用に供する部分に係った金額の割合（％）をご入力ください。',
    whenToLeaveBlank: '子育て対応改修に係る部分が減税申請者の居住の用に供する部分のみの場合は空欄としてください。',
  },
  longTermHousing: {
    whenToUse: '長期優良住宅化改修に係る部分のうちに、減税申請者の居住の用以外の用に供する部分がある場合は、各項目の工事費に対する当該居住の用に供する部分に係った金額の割合（％）をご入力ください。',
    whenToLeaveBlank: '長期優良住宅化改修に係る部分が減税申請者の居住の用に供する部分のみの場合は空欄としてください。',
  },
  otherRenovation: {
    whenToUse: '増改築等に係る部分のうちに、減税申請者の居住の用以外の用に供する部分がある場合は、工事費に対する当該居住の用に供する部分に係った金額の割合（％）をご入力ください。',
    whenToLeaveBlank: '増改築等に係る部分が減税申請者の居住の用に供する部分のみの場合は空欄としてください。',
  },
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function createEmptyItem(): WorkItemFormEntry {
  return { id: generateId(), workTypeCode: '', quantity: 0 };
}

function createEmptyOtherItem(): WorkItemFormEntry {
  return { id: generateId(), workTypeCode: '', quantity: 0, categoryCode: '', amount: 0, workDescription: '' };
}

function createEmptyFormState(): WorkTypeFormState {
  return { items: [], subsidyAmount: 0 };
}

// =============================================
// 金額計算ヘルパー
// =============================================

function calcItemAmount(category: string, item: WorkItemFormEntry, master?: MasterWorkType): number {
  if (category === 'otherRenovation') {
    return calculateOtherRenovationAmount(item.amount || 0, item.ratio);
  }
  if (!master) return 0;

  if (category === 'energySaving') {
    return calculateEnergySavingAmount(master.unitPrice, item.quantity, item.windowRatio, item.ratio);
  }
  // seismic uses ratio as 2nd param, others use residentRatio
  if (category === 'seismic') {
    return calculateSeismicAmount(master.unitPrice, item.quantity, item.ratio);
  }
  if (category === 'barrierFree') {
    return calculateBarrierFreeAmount(master.unitPrice, item.quantity, item.ratio);
  }
  if (category === 'cohabitation') {
    return calculateCohabitationAmount(master.unitPrice, item.quantity, item.ratio);
  }
  if (category === 'childcare') {
    return calculateChildcareAmount(master.unitPrice, item.quantity, item.ratio);
  }
  if (category === 'longTermHousing') {
    return calculateLongTermHousingAmount(master.unitPrice, item.quantity, item.ratio);
  }
  return 0;
}

function calcCategoryTotal(category: string, items: WorkItemFormEntry[]): number {
  const masterList = WORK_TYPE_MASTER[category];
  return items.reduce((sum, item) => {
    if (category === 'otherRenovation') {
      return sum + calculateOtherRenovationAmount(item.amount || 0, item.ratio);
    }
    const master = masterList?.find(m => m.code === item.workTypeCode);
    if (!master) return sum;
    return sum + calcItemAmount(category, item, master);
  }, 0);
}

function calcDeductible(category: string, total: number, subsidy: number, state: WorkTypeFormState): number {
  switch (category) {
    case 'seismic': return calcSeismicDeductible(total, subsidy);
    case 'barrierFree': return calculateBarrierFreeDeductibleAmount(total, subsidy);
    case 'energySaving': return calculateEnergySavingDeductibleAmount(total, subsidy, state.hasSolarPower ?? false);
    case 'cohabitation': return calculateCohabitationDeductibleAmount(total, subsidy);
    case 'childcare': return calculateChildcareDeductibleAmount(total, subsidy);
    case 'longTermHousing': return calculateLongTermHousingDeductibleAmount(total, subsidy, state.isExcellentHousing ?? false);
    case 'otherRenovation': return calculateOtherRenovationDeductibleAmount(total, subsidy);
    default: return 0;
  }
}

// =============================================
// convertFormStateToWorkData
// =============================================

export function convertFormStateToWorkData(formState: WorkDataFormState): WorkData {
  const workData: WorkData = {
    seismic: { items: [], summary: null },
    barrierFree: { items: [], summary: null },
    energySaving: { items: [], summary: null },
    cohabitation: { items: [], summary: null },
    childcare: { items: [], summary: null },
    longTermHousing: { items: [], summary: null },
    otherRenovation: { items: [], summary: null },
  };

  for (const [cat, state] of Object.entries(formState)) {
    const category = cat as WorkCategory;
    if (!state || state.items.length === 0) continue;

    if (category === 'otherRenovation') {
      const items: OtherRenovationItem[] = state.items
        .filter(item => item.categoryCode && (item.amount || 0) > 0)
        .map(item => {
          const catInfo = OTHER_RENOVATION_CATEGORIES.find(c => c.code === item.categoryCode);
          const calculatedAmount = calculateOtherRenovationAmount(item.amount || 0, item.ratio);
          return {
            id: item.id,
            categoryCode: item.categoryCode || '',
            categoryName: catInfo?.name || '',
            workDescription: item.workDescription || '',
            amount: item.amount || 0,
            residentRatio: item.ratio || 0,
            calculatedAmount,
          };
        });
      const totalAmount = items.reduce((s, i) => s + i.calculatedAmount, 0);
      const subsidyAmount = state.subsidyAmount || 0;
      const deductibleAmount = calculateOtherRenovationDeductibleAmount(totalAmount, subsidyAmount);
      workData.otherRenovation = {
        items,
        summary: items.length > 0 ? { totalAmount, subsidyAmount, deductibleAmount } : null,
      };
    } else {
      const masterList = WORK_TYPE_MASTER[category];
      if (!masterList) continue;

      const items: StandardWorkItem[] = [];
      for (const item of state.items) {
        if (!item.workTypeCode || item.quantity <= 0) continue;
        const master = masterList.find(m => m.code === item.workTypeCode);
        if (!master) continue;
        const amount = calcItemAmount(category, item, master);
        items.push({
          id: item.id,
          workTypeCode: item.workTypeCode,
          workName: master.name,
          category: master.category || '',
          unitPrice: master.unitPrice,
          unit: master.unit,
          quantity: item.quantity,
          residentRatio: item.ratio || 0,
          calculatedAmount: amount,
          windowAreaRatio: item.windowRatio,
        });
      }

      const totalAmount = items.reduce((s, i) => s + i.calculatedAmount, 0);
      const subsidyAmount = state.subsidyAmount || 0;
      const deductibleAmount = calcDeductible(category, totalAmount, subsidyAmount, state);

      const summary: WorkSummary = {
        totalAmount,
        subsidyAmount,
        deductibleAmount,
      };
      if (category === 'energySaving') {
        summary.hasSolarPower = state.hasSolarPower ?? hasSolarPowerWork(items.map(i => i.workTypeCode));
      }
      if (category === 'longTermHousing') {
        summary.isExcellentHousing = state.isExcellentHousing ?? false;
      }

      workData[category] = {
        items,
        summary: items.length > 0 ? summary : null,
      };
    }
  }

  return workData;
}

// =============================================
// コンポーネント
// =============================================

type Props = {
  selectedWorkTypes: string[];
  formState: WorkDataFormState;
  onChange: (state: WorkDataFormState) => void;
};

export default function CostCalculationStep({ selectedWorkTypes, formState, onChange }: Props) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(selectedWorkTypes));
  const initializedRef = useRef(false);

  // 初回表示時：選択された工事種別にまだ項目がなければ1行追加
  useEffect(() => {
    if (initializedRef.current || selectedWorkTypes.length === 0) return;
    initializedRef.current = true;

    let needsUpdate = false;
    const updated = { ...formState };

    for (const cat of selectedWorkTypes) {
      const existing = formState[cat as WorkCategory];
      if (!existing || existing.items.length === 0) {
        needsUpdate = true;
        const isOther = cat === 'otherRenovation';
        updated[cat as WorkCategory] = {
          ...(existing || createEmptyFormState()),
          items: [isOther ? createEmptyOtherItem() : createEmptyItem()],
        };
      }
    }

    if (needsUpdate) {
      onChange(updated);
    }
  }, [selectedWorkTypes, formState, onChange]);

  const toggleSection = useCallback((cat: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const updateCategory = useCallback((category: string, updater: (prev: WorkTypeFormState) => WorkTypeFormState) => {
    onChange({
      ...formState,
      [category]: updater(formState[category as WorkCategory] || createEmptyFormState()),
    });
  }, [formState, onChange]);

  // サマリー計算
  const summary = useMemo(() => {
    let grandTotal = 0;
    let grandSubsidy = 0;
    const perCategory: Record<string, { total: number; subsidy: number; deductible: number }> = {};

    for (const cat of selectedWorkTypes) {
      const state = formState[cat as WorkCategory] || createEmptyFormState();
      const total = calcCategoryTotal(cat, state.items);
      const subsidy = state.subsidyAmount || 0;
      const deductible = calcDeductible(cat, total, subsidy, state);
      perCategory[cat] = { total, subsidy, deductible };
      grandTotal += total;
      grandSubsidy += subsidy;
    }

    return { grandTotal, grandSubsidy, perCategory };
  }, [selectedWorkTypes, formState]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">費用計算</h2>
      <p className="text-sm text-gray-600 mb-6">
        各工事種別の項目を追加し、数量を入力すると標準的な費用の額が自動計算されます。
      </p>

      {/* サマリーパネル */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 sticky top-0 z-10">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">費用サマリー</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {selectedWorkTypes.map(cat => {
            const s = summary.perCategory[cat];
            return s && s.total > 0 ? (
              <div key={cat} className="flex justify-between">
                <span className="text-gray-600 truncate mr-2">{WORK_CATEGORY_LABELS[cat]}:</span>
                <span className="font-medium whitespace-nowrap">{s.total.toLocaleString()}円</span>
              </div>
            ) : null;
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-blue-300 flex flex-wrap gap-4 text-sm font-semibold">
          <div>
            <span className="text-gray-600">総合計: </span>
            <span className="text-blue-900 text-lg">{summary.grandTotal.toLocaleString()}円</span>
          </div>
          {summary.grandSubsidy > 0 && (
            <div>
              <span className="text-gray-600">補助金合計: </span>
              <span className="text-green-700">{summary.grandSubsidy.toLocaleString()}円</span>
            </div>
          )}
        </div>
      </div>

      {/* アコーディオンセクション */}
      <div className="space-y-3">
        {selectedWorkTypes.map(cat => {
          const state = formState[cat as WorkCategory] || createEmptyFormState();
          const total = summary.perCategory[cat]?.total || 0;
          const isOpen = openSections.has(cat);
          const isOther = cat === 'otherRenovation';

          return (
            <div key={cat} className="border rounded-lg overflow-hidden">
              {/* ヘッダー */}
              <button
                type="button"
                onClick={() => toggleSection(cat)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs transition-transform ${isOpen ? 'rotate-90' : ''}`}>&#9654;</span>
                  <span className="font-semibold text-sm">{WORK_CATEGORY_LABELS[cat]}</span>
                  <span className="text-xs text-gray-500">({state.items.length}項目)</span>
                </div>
                <span className="text-sm font-medium text-blue-700">{total.toLocaleString()}円</span>
              </button>

              {/* 展開コンテンツ */}
              {isOpen && (
                <div className="p-4 space-y-4">
                  {isOther ? (
                    <OtherRenovationSection
                      state={state}
                      onUpdate={(updater) => updateCategory(cat, updater)}
                    />
                  ) : (
                    <StandardWorkSection
                      category={cat}
                      state={state}
                      onUpdate={(updater) => updateCategory(cat, updater)}
                    />
                  )}

                  {/* 補助金 */}
                  <div className="border-t pt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      補助金額 (円)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={state.subsidyAmount || ''}
                      onChange={(e) => updateCategory(cat, prev => ({ ...prev, subsidyAmount: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="max-w-xs w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>

                  {/* 省エネ固有: 太陽光発電フラグ */}
                  {cat === 'energySaving' && (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={state.hasSolarPower ?? false}
                        onChange={(e) => updateCategory(cat, prev => ({ ...prev, hasSolarPower: e.target.checked }))}
                        className="w-4 h-4"
                      />
                      太陽光発電設備を併設（控除上限350万円に引き上げ）
                    </label>
                  )}

                  {/* 長期優良固有: 認定フラグ */}
                  {cat === 'longTermHousing' && (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={state.isExcellentHousing ?? false}
                        onChange={(e) => updateCategory(cat, prev => ({ ...prev, isExcellentHousing: e.target.checked }))}
                        className="w-4 h-4"
                      />
                      長期優良住宅の認定を取得（控除上限500万円に引き上げ）
                    </label>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedWorkTypes.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          工事種別が選択されていません。前のステップで工事種別を選択してください。
        </div>
      )}
    </div>
  );
}

// =============================================
// 標準工事セクション
// =============================================

function StandardWorkSection({
  category,
  state,
  onUpdate,
}: {
  category: string;
  state: WorkTypeFormState;
  onUpdate: (updater: (prev: WorkTypeFormState) => WorkTypeFormState) => void;
}) {
  const masterList = WORK_TYPE_MASTER[category] || [];
  const isEnergySaving = category === 'energySaving';

  const addItem = () => {
    onUpdate(prev => ({
      ...prev,
      items: [...prev.items, createEmptyItem()],
    }));
  };

  const removeItem = (id: string) => {
    onUpdate(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== id),
    }));
  };

  const updateItem = (id: string, updates: Partial<WorkItemFormEntry>) => {
    onUpdate(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, ...updates } : i),
    }));
  };

  return (
    <div>
      {state.items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b">
                <th className="pb-2 pr-2 min-w-[200px]">工事種別</th>
                <th className="pb-2 pr-2 w-20">数量</th>
                <th className="pb-2 pr-2 w-16">単位</th>
                <th className="pb-2 pr-2 w-24">割合(%)</th>
                {isEnergySaving && <th className="pb-2 pr-2 w-24">窓面積(%)</th>}
                <th className="pb-2 pr-2 w-28 text-right">計算額</th>
                <th className="pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {state.items.map(item => {
                const master = masterList.find(m => m.code === item.workTypeCode);
                const amount = master ? calcItemAmount(category, item, master) : 0;
                const showWindowRatio = isEnergySaving && master?.needsWindowRatio;

                return (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-2 pr-2">
                      <select
                        value={item.workTypeCode}
                        onChange={(e) => updateItem(item.id, { workTypeCode: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">選択...</option>
                        {masterList.map(m => (
                          <option key={m.code} value={m.code}>
                            {m.name} (¥{m.unitPrice.toLocaleString()}/{m.unit})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </td>
                    <td className="py-2 pr-2 text-xs text-gray-500">
                      {master?.unit || '-'}
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={item.ratio ?? ''}
                        onChange={(e) => updateItem(item.id, { ratio: parseFloat(e.target.value) || undefined })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="任意"
                      />
                    </td>
                    {isEnergySaving && (
                      <td className="py-2 pr-2">
                        {showWindowRatio ? (
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={item.windowRatio ?? ''}
                            onChange={(e) => updateItem(item.id, { windowRatio: parseFloat(e.target.value) || undefined })}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="窓%"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    )}
                    <td className="py-2 pr-2 text-right font-medium">
                      {amount > 0 ? `${amount.toLocaleString()}円` : '-'}
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-600 text-lg leading-none"
                        title="削除"
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={addItem}
        className="mt-2 px-3 py-1.5 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
      >
        + 項目を追加
      </button>

      {/* 割合(%)の注意書き */}
      {RATIO_HELP_TEXTS[category] && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-xs font-medium text-amber-800 mb-1">割合（％）について</p>
          <ul className="text-xs text-amber-700 space-y-1">
            <li>※ {RATIO_HELP_TEXTS[category].whenToUse}</li>
            <li>※ {RATIO_HELP_TEXTS[category].whenToLeaveBlank}</li>
          </ul>
        </div>
      )}
    </div>
  );
}

// =============================================
// その他増改築セクション
// =============================================

function OtherRenovationSection({
  state,
  onUpdate,
}: {
  state: WorkTypeFormState;
  onUpdate: (updater: (prev: WorkTypeFormState) => WorkTypeFormState) => void;
}) {
  const addItem = () => {
    onUpdate(prev => ({
      ...prev,
      items: [...prev.items, createEmptyOtherItem()],
    }));
  };

  const removeItem = (id: string) => {
    onUpdate(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== id),
    }));
  };

  const updateItem = (id: string, updates: Partial<WorkItemFormEntry>) => {
    onUpdate(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, ...updates } : i),
    }));
  };

  return (
    <div>
      {state.items.map(item => {
        const calcAmt = calculateOtherRenovationAmount(item.amount || 0, item.ratio);
        return (
          <div key={item.id} className="border border-gray-200 rounded-md p-3 mb-3">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">カテゴリ</label>
                  <select
                    value={item.categoryCode || ''}
                    onChange={(e) => updateItem(item.id, { categoryCode: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">選択...</option>
                    {OTHER_RENOVATION_CATEGORIES.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">工事金額 (円)</label>
                  <input
                    type="number"
                    min={0}
                    value={item.amount || ''}
                    onChange={(e) => updateItem(item.id, { amount: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">工事内容</label>
                  <input
                    type="text"
                    value={item.workDescription || ''}
                    onChange={(e) => updateItem(item.id, { workDescription: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="工事内容の説明"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">居住用割合 (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={item.ratio ?? ''}
                    onChange={(e) => updateItem(item.id, { ratio: parseFloat(e.target.value) || undefined })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="任意"
                  />
                </div>
                <div className="flex items-end">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">計算額</label>
                    <span className="text-sm font-medium">
                      {calcAmt > 0 ? `${calcAmt.toLocaleString()}円` : '-'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="ml-2 text-red-400 hover:text-red-600 text-lg leading-none"
                title="削除"
              >
                &times;
              </button>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addItem}
        className="mt-2 px-3 py-1.5 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
      >
        + 工事を追加
      </button>

      {/* 割合(%)の注意書き */}
      {RATIO_HELP_TEXTS.otherRenovation && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-xs font-medium text-amber-800 mb-1">居住用割合（％）について</p>
          <ul className="text-xs text-amber-700 space-y-1">
            <li>※ {RATIO_HELP_TEXTS.otherRenovation.whenToUse}</li>
            <li>※ {RATIO_HELP_TEXTS.otherRenovation.whenToLeaveBlank}</li>
          </ul>
        </div>
      )}
    </div>
  );
}
