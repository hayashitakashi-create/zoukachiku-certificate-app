'use client';

import CostCalculationStep from '@/components/CostCalculationStep';
import type { PurposeType } from '@/lib/store';
import type { StepProps, ReformTaxCostCategory, ReformTaxCostForm } from '../types';
import { PURPOSE_SECTION_INFO } from '../types';

type Step4Props = StepProps & {
  effectiveWorkTypes: string[];
};

export default function Step4CostDetails({ formData, setFormData, effectiveWorkTypes }: Step4Props) {
  return (
    <div>
      {formData.purposeType && PURPOSE_SECTION_INFO[formData.purposeType as PurposeType] && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-xs font-semibold text-amber-700">{PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].category}</p>
          <p className="text-sm font-bold text-amber-900 mt-1">
            {PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].sectionNumber}．{PURPOSE_SECTION_INFO[formData.purposeType as PurposeType].title}
          </p>
        </div>
      )}

      {/* housing_loan / resale: 公式様式の①②③ */}
      {(formData.purposeType === 'housing_loan' || formData.purposeType === 'resale') ? (
        <div>
          <h2 className="text-xl font-bold mb-2">（３）実施した工事の費用の額等</h2>
          <p className="text-sm text-stone-600 mb-6">
            公式様式に準拠した費用項目を入力してください。
          </p>

          <div className="space-y-6">
            {/* ① 費用の額 */}
            <div className="p-4 border border-stone-200 rounded-2xl">
              <label className="block text-sm font-semibold text-stone-800 mb-1">
                ① 第１号工事～第６号工事に要した費用の額
              </label>
              <div className="flex items-center gap-2 max-w-md">
                <input
                  type="number"
                  min={0}
                  value={formData.housingLoanCost.totalCost || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    housingLoanCost: { ...prev.housingLoanCost, totalCost: Math.max(0, parseInt(e.target.value) || 0) },
                  }))}
                  className="flex-1 px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                  placeholder="0"
                />
                <span className="text-sm text-stone-600">円</span>
              </div>
            </div>

            {/* ② 補助金等の交付の有無 */}
            <div className="p-4 border border-stone-200 rounded-2xl">
              <label className="block text-sm font-semibold text-stone-800 mb-3">
                ② 第１号工事～第６号工事に係る補助金等の交付の有無
              </label>
              <div className="flex items-center gap-4 mb-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="housingLoanSubsidy"
                    checked={formData.housingLoanCost.hasSubsidy}
                    onChange={() => setFormData(prev => ({
                      ...prev,
                      housingLoanCost: { ...prev.housingLoanCost, hasSubsidy: true },
                    }))}
                    className="w-4 h-4"
                  />
                  有
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="housingLoanSubsidy"
                    checked={!formData.housingLoanCost.hasSubsidy}
                    onChange={() => setFormData(prev => ({
                      ...prev,
                      housingLoanCost: { ...prev.housingLoanCost, hasSubsidy: false, subsidyAmount: 0 },
                    }))}
                    className="w-4 h-4"
                  />
                  無
                </label>
              </div>
              {formData.housingLoanCost.hasSubsidy && (
                <div className="pl-4 border-l-2 border-stone-300">
                  <label className="block text-sm text-stone-700 mb-1">
                    「有」の場合　交付される補助金等の額
                  </label>
                  <div className="flex items-center gap-2 max-w-md">
                    <input
                      type="number"
                      min={0}
                      value={formData.housingLoanCost.subsidyAmount || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        housingLoanCost: { ...prev.housingLoanCost, subsidyAmount: Math.max(0, parseInt(e.target.value) || 0) },
                      }))}
                      className="flex-1 px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                      placeholder="0"
                    />
                    <span className="text-sm text-stone-600">円</span>
                  </div>
                </div>
              )}
            </div>

            {/* ③ 控除対象額（自動計算） */}
            {(() => {
              const cost = formData.housingLoanCost;
              const deductible = Math.max(0, cost.totalCost - (cost.hasSubsidy ? cost.subsidyAmount : 0));
              const over100man = deductible > 1000000;
              return (
                <div className={`p-4 border rounded-2xl ${over100man ? 'border-amber-300 bg-amber-50' : 'border-stone-200'}`}>
                  <label className="block text-sm font-semibold text-stone-800 mb-1">
                    ③ ①から②を差し引いた額（100万円を超える場合）
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-stone-900">
                      {deductible.toLocaleString()}
                    </span>
                    <span className="text-sm text-stone-600">円</span>
                  </div>
                  {!over100man && cost.totalCost > 0 && (
                    <p className="mt-2 text-xs text-amber-600">
                      ※ 100万円以下のため、住宅借入金等特別税額控除の対象外です。
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      ) : formData.purposeType === 'reform_tax' ? (
        /* reform_tax: 公式様式準拠の費用フォーム */
        (() => {
          const rc = formData.reformTaxCost;
          const wt = formData.reformTaxWorkTypes;
          const hasSolar = rc.energySaving.hasSolarPower || (wt.energySaving.equipmentTypes.solarPower !== '');

          // 各カテゴリのウ・エ・オ自動計算
          const calc = (cat: ReformTaxCostCategory, limit: number, needOver50: boolean) => {
            const sub = cat.hasSubsidy ? cat.subsidyAmount : 0;
            const afterSub = cat.totalAmount - sub;
            const deductible = needOver50 ? (afterSub > 500_000 ? afterSub : 0) : Math.max(0, afterSub);
            const maxDed = limit > 0 ? Math.min(deductible, limit) : deductible;
            const excess = Math.max(0, deductible - maxDed);
            return { afterSub, deductible, maxDed, excess };
          };

          const seismicCalc = calc(rc.seismic, 2_500_000, false);
          const bfCalc = calc(rc.barrierFree, 2_000_000, true);
          const energyLimit = hasSolar ? 3_500_000 : 2_500_000;
          const esCalc = calc(rc.energySaving, energyLimit, true);
          const cohabCalc = calc(rc.cohabitation, 2_500_000, true);
          const ccCalc = calc(rc.childcare, 2_500_000, true);

          // ⑳ その他増改築等（第1号～第6号工事）
          const orCat = rc.otherRenovation;
          const orSub = orCat.hasSubsidy ? orCat.subsidyAmount : 0;
          const orAfterSub = Math.max(0, orCat.totalAmount - orSub);

          // ⑤ compound calc (OR: 耐震又は省エネ)
          const lt5 = rc.longTermOr;
          const lt5BaseSub = lt5.baseHasSubsidy ? lt5.baseSubsidyAmount : 0;
          const lt5BaseAfter = lt5.baseTotalAmount - lt5BaseSub;
          const lt5BaseDed = lt5BaseAfter > 500_000 ? lt5BaseAfter : 0;
          const lt5DurSub = lt5.durabilityHasSubsidy ? lt5.durabilitySubsidyAmount : 0;
          const lt5DurAfter = lt5.durabilityTotalAmount - lt5DurSub;
          const lt5DurDed = lt5DurAfter > 500_000 ? lt5DurAfter : 0;
          const lt5Ki = lt5BaseDed + lt5DurDed;
          const lt5Limit = hasSolar ? 3_500_000 : 2_500_000;
          const lt5Ku = Math.min(lt5Ki, lt5Limit);
          const lt5Ke = Math.max(0, lt5Ki - lt5Ku);

          // ⑥ compound calc (AND: 耐震及び省エネ)
          const lt6 = rc.longTermAnd;
          const lt6SesSub = lt6.seismicHasSubsidy ? lt6.seismicSubsidyAmount : 0;
          const lt6SesAfter = lt6.seismicTotalAmount - lt6SesSub;
          const lt6SesDed = lt6SesAfter > 500_000 ? lt6SesAfter : 0;
          const lt6EnSub = lt6.energyHasSubsidy ? lt6.energySubsidyAmount : 0;
          const lt6EnAfter = lt6.energyTotalAmount - lt6EnSub;
          const lt6EnDed = lt6EnAfter > 500_000 ? lt6EnAfter : 0;
          const lt6DurSub = lt6.durabilityHasSubsidy ? lt6.durabilitySubsidyAmount : 0;
          const lt6DurAfter = lt6.durabilityTotalAmount - lt6DurSub;
          const lt6DurDed = lt6DurAfter > 500_000 ? lt6DurAfter : 0;
          const lt6Ko = lt6SesDed + lt6EnDed + lt6DurDed;
          const lt6Limit = hasSolar ? 6_000_000 : 5_000_000;
          const lt6Sa = Math.min(lt6Ko, lt6Limit);
          const lt6Shi = Math.max(0, lt6Ko - lt6Sa);

          // ⑧⑨⑩ パターン1: ①+②+③+④+⑦
          const p1Ded = seismicCalc.deductible + bfCalc.deductible + esCalc.deductible + cohabCalc.deductible + ccCalc.deductible;
          const p1Max = seismicCalc.maxDed + bfCalc.maxDed + esCalc.maxDed + cohabCalc.maxDed + ccCalc.maxDed;
          const p1Exc = seismicCalc.excess + bfCalc.excess + esCalc.excess + cohabCalc.excess + ccCalc.excess;
          // ⑪⑫⑬ パターン2: ②+④+⑤キ/ク/ケ+⑦ (OR)
          const p2Ded = bfCalc.deductible + cohabCalc.deductible + lt5Ki + ccCalc.deductible;
          const p2Max = bfCalc.maxDed + cohabCalc.maxDed + lt5Ku + ccCalc.maxDed;
          const p2Exc = bfCalc.excess + cohabCalc.excess + lt5Ke + ccCalc.excess;
          // ⑭⑮⑯ パターン3: ②+④+⑥コ/サ/シ+⑦ (AND)
          const p3Ded = bfCalc.deductible + cohabCalc.deductible + lt6Ko + ccCalc.deductible;
          const p3Max = bfCalc.maxDed + cohabCalc.maxDed + lt6Sa + ccCalc.maxDed;
          const p3Exc = bfCalc.excess + cohabCalc.excess + lt6Shi + ccCalc.excess;

          // ⑰⑱⑲ 最大値選択
          const r17 = Math.min(Math.max(p1Max, p2Max, p3Max), 10_000_000);
          const r18 = Math.max(p1Ded, p2Ded, p3Ded);
          let r19: number;
          if (r18 === p3Ded && p3Ded > 0) r19 = p3Exc;
          else if (r18 === p2Ded && p2Ded > 0) r19 = p2Exc;
          else r19 = p1Exc;

          // ㉑㉒㉓ 最終計算 — ㉑ = MIN(⑱, ⑲ + ⑳ウ)
          const r21 = r18 <= 0 ? 0 : Math.min(r18, r19 + orAfterSub);
          const r22 = Math.max(0, 10_000_000 - r17);
          const r23 = Math.min(r21, r22);

          // カテゴリ入力フォームの共通レンダラー
          // カテゴリ → 計算ページの対応
          const calcPageMap: Record<string, string> = {
            seismic: '/seismic-reform',
            barrierFree: '/barrier-free-reform',
            energySaving: '/energy-saving-reform',
            cohabitation: '/cohabitation-reform',
            childcare: '/childcare-reform',
            otherRenovation: '/other-renovation',
          };

          const renderCategory = (
            key: 'seismic' | 'barrierFree' | 'energySaving' | 'cohabitation' | 'childcare',
            label: string,
            calcResult: { afterSub: number; deductible: number; maxDed: number; excess: number },
            limitLabel: string,
            needOver50: boolean,
          ) => {
            const cat = rc[key] as ReformTaxCostCategory;
            return (
              <div key={key} className="p-4 border border-stone-200 rounded-2xl">
                <h4 className="font-bold text-sm mb-3">{label}</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-stone-700">ア　標準的な費用の額</label>
                      {calcPageMap[key] && (
                        <a href={calcPageMap[key]} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-amber-600 hover:text-amber-800 underline">計算ページへ →</a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 max-w-sm">
                      <input type="number" min={0}
                        value={cat.totalAmount || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          reformTaxCost: {
                            ...prev.reformTaxCost,
                            [key]: { ...prev.reformTaxCost[key], totalAmount: Math.max(0, parseInt(e.target.value) || 0) },
                          },
                        }))}
                        className="flex-1 px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                        placeholder="0" />
                      <span className="text-sm text-stone-600">円</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">イ　補助金等の交付の有無</label>
                    <div className="flex items-center gap-4 mb-2">
                      <label className="flex items-center gap-1 text-sm">
                        <input type="radio" checked={cat.hasSubsidy}
                          onChange={() => setFormData(prev => ({
                            ...prev,
                            reformTaxCost: { ...prev.reformTaxCost, [key]: { ...prev.reformTaxCost[key], hasSubsidy: true } },
                          }))}
                          className="w-4 h-4" />
                        有
                      </label>
                      <label className="flex items-center gap-1 text-sm">
                        <input type="radio" checked={!cat.hasSubsidy}
                          onChange={() => setFormData(prev => ({
                            ...prev,
                            reformTaxCost: { ...prev.reformTaxCost, [key]: { ...prev.reformTaxCost[key], hasSubsidy: false, subsidyAmount: 0 } },
                          }))}
                          className="w-4 h-4" />
                        無
                      </label>
                    </div>
                    {cat.hasSubsidy && (
                      <div className="pl-4 border-l-2 border-stone-300">
                        <label className="block text-xs text-stone-600 mb-1">補助金等の額</label>
                        <div className="flex items-center gap-2 max-w-sm">
                          <input type="number" min={0}
                            value={cat.subsidyAmount || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              reformTaxCost: { ...prev.reformTaxCost, [key]: { ...prev.reformTaxCost[key], subsidyAmount: Math.max(0, parseInt(e.target.value) || 0) } },
                            }))}
                            className="flex-1 px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                            placeholder="0" />
                          <span className="text-sm text-stone-600">円</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="bg-stone-50 rounded-2xl p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-stone-600">ウ　アからイを差し引いた額{needOver50 ? '（50万円を超える場合）' : ''}</span>
                      <span className={`font-medium ${needOver50 && calcResult.afterSub > 0 && calcResult.deductible === 0 ? 'text-amber-600' : ''}`}>
                        {calcResult.deductible.toLocaleString()}円
                        {needOver50 && calcResult.afterSub > 0 && calcResult.deductible === 0 && ' (50万円以下)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">エ　ウと{limitLabel}のうちいずれか少ない金額</span>
                      <span className="font-medium">{calcResult.maxDed.toLocaleString()}円</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">オ　ウからエを差し引いた額</span>
                      <span className="font-medium">{calcResult.excess.toLocaleString()}円</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          };

          // compound input helper
          const renderCompoundInput = (
            compoundKey: 'longTermOr' | 'longTermAnd',
            field: string,
            label: string,
          ) => {
            const val = (rc[compoundKey] as Record<string, number | boolean>)[field];
            if (typeof val === 'boolean') return null;
            return (
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">{label}</label>
                <div className="flex items-center gap-2 max-w-sm">
                  <input type="number" min={0}
                    value={(val as number) || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      reformTaxCost: {
                        ...prev.reformTaxCost,
                        [compoundKey]: { ...prev.reformTaxCost[compoundKey], [field]: Math.max(0, parseInt(e.target.value) || 0) },
                      },
                    }))}
                    className="flex-1 px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                    placeholder="0" />
                  <span className="text-sm text-stone-600">円</span>
                </div>
              </div>
            );
          };

          const renderCompoundSubsidy = (
            compoundKey: 'longTermOr' | 'longTermAnd',
            hasField: string,
            amountField: string,
            label: string,
          ) => {
            const hasSub = (rc[compoundKey] as Record<string, number | boolean>)[hasField] as boolean;
            return (
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">{label}</label>
                <div className="flex items-center gap-4 mb-2">
                  <label className="flex items-center gap-1 text-sm">
                    <input type="radio" checked={hasSub}
                      onChange={() => setFormData(prev => ({
                        ...prev,
                        reformTaxCost: { ...prev.reformTaxCost, [compoundKey]: { ...prev.reformTaxCost[compoundKey], [hasField]: true } },
                      }))}
                      className="w-4 h-4" />
                    有
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <input type="radio" checked={!hasSub}
                      onChange={() => setFormData(prev => ({
                        ...prev,
                        reformTaxCost: { ...prev.reformTaxCost, [compoundKey]: { ...prev.reformTaxCost[compoundKey], [hasField]: false, [amountField]: 0 } },
                      }))}
                      className="w-4 h-4" />
                    無
                  </label>
                </div>
                {hasSub && (
                  <div className="pl-4 border-l-2 border-stone-300">
                    <label className="block text-xs text-stone-600 mb-1">補助金等の額</label>
                    <div className="flex items-center gap-2 max-w-sm">
                      <input type="number" min={0}
                        value={((rc[compoundKey] as Record<string, number | boolean>)[amountField] as number) || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          reformTaxCost: { ...prev.reformTaxCost, [compoundKey]: { ...prev.reformTaxCost[compoundKey], [amountField]: Math.max(0, parseInt(e.target.value) || 0) } },
                        }))}
                        className="flex-1 px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                        placeholder="0" />
                      <span className="text-sm text-stone-600">円</span>
                    </div>
                  </div>
                )}
              </div>
            );
          };

          return (
            <div>
              <h2 className="text-xl font-bold mb-2">（３）費用の額等</h2>
              <p className="text-sm text-stone-600 mb-6">
                工事カテゴリ別の費用と補助金を入力してください。控除対象額・上限適用・超過額は自動計算されます。
              </p>

              <div className="space-y-4">
                {renderCategory('seismic', '① 住宅耐震改修', seismicCalc, '250万円', false)}
                {renderCategory('barrierFree', '② 高齢者等居住改修工事等', bfCalc, '200万円', true)}
                <div>
                  {renderCategory('energySaving', '③ 一般断熱改修工事等', esCalc, `${hasSolar ? '350' : '250'}万円`, true)}
                  <div className="mt-2 ml-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox"
                        checked={rc.energySaving.hasSolarPower}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          reformTaxCost: { ...prev.reformTaxCost, energySaving: { ...prev.reformTaxCost.energySaving, hasSolarPower: e.target.checked } },
                        }))}
                        className="w-4 h-4 text-amber-600 rounded" />
                      <span className="text-stone-700">太陽光発電設備を設置（上限350万円に変更）</span>
                    </label>
                  </div>
                </div>
                {renderCategory('cohabitation', '④ 多世帯同居改修工事等', cohabCalc, '250万円', true)}

                {/* ⑤ 耐久性向上改修工事等（OR: いずれかと併せて） */}
                <div className="p-4 border border-stone-200 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-sm">⑤ 耐久性向上改修工事等（対象住宅耐震改修又は対象一般断熱改修工事等のいずれかと併せて行う場合）</h4>
                    <a href="/long-term-housing" target="_blank" rel="noopener noreferrer"
                      className="text-xs text-amber-600 hover:text-amber-800 underline whitespace-nowrap ml-2">計算ページへ →</a>
                  </div>
                  <div className="space-y-3">
                    {renderCompoundInput('longTermOr', 'baseTotalAmount', 'ア　当該住宅耐震改修又は当該一般断熱改修工事等に係る標準的な費用の額')}
                    {renderCompoundSubsidy('longTermOr', 'baseHasSubsidy', 'baseSubsidyAmount', 'イ　当該住宅耐震改修又は当該一般断熱改修工事等に係る補助金等の交付の有無')}
                    <div className="bg-stone-50 rounded-2xl p-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-stone-600">ウ　アからイを差し引いた額（50万円を超える場合）</span>
                        <span className="font-medium">{lt5BaseDed.toLocaleString()}円</span>
                      </div>
                    </div>
                    {renderCompoundInput('longTermOr', 'durabilityTotalAmount', 'エ　当該耐久性向上改修工事等に係る標準的な費用の額')}
                    {renderCompoundSubsidy('longTermOr', 'durabilityHasSubsidy', 'durabilitySubsidyAmount', 'オ　当該耐久性向上改修工事等に係る補助金等の交付の有無')}
                    <div className="bg-stone-50 rounded-2xl p-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-stone-600">カ　エからオを差し引いた額（50万円を超える場合）</span>
                        <span className="font-medium">{lt5DurDed.toLocaleString()}円</span>
                      </div>
                    </div>
                    <div className="bg-amber-50 rounded-2xl p-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-stone-700 font-medium">キ　ウ及びカの合計額</span>
                        <span className="font-bold">{lt5Ki.toLocaleString()}円</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600">ク　キと{hasSolar ? '350' : '250'}万円のうちいずれか少ない金額</span>
                        <span className="font-medium">{lt5Ku.toLocaleString()}円</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600">ケ　キからクを差し引いた額</span>
                        <span className="font-medium">{lt5Ke.toLocaleString()}円</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ⑥ 耐久性向上改修工事等（AND: 両方と併せて） */}
                <div className="p-4 border border-emerald-200 bg-emerald-50 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-sm">⑥ 耐久性向上改修工事等（対象住宅耐震改修及び対象一般断熱改修工事等の両方と併せて行う場合）</h4>
                    <a href="/long-term-housing" target="_blank" rel="noopener noreferrer"
                      className="text-xs text-amber-600 hover:text-amber-800 underline whitespace-nowrap ml-2">計算ページへ →</a>
                  </div>
                  <div className="space-y-3">
                    {renderCompoundInput('longTermAnd', 'seismicTotalAmount', 'ア　当該住宅耐震改修に係る標準的な費用の額')}
                    {renderCompoundSubsidy('longTermAnd', 'seismicHasSubsidy', 'seismicSubsidyAmount', 'イ　当該住宅耐震改修に係る補助金等の交付の有無')}
                    <div className="bg-white rounded-2xl p-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-stone-600">ウ　アからイを差し引いた額（50万円を超える場合）</span>
                        <span className="font-medium">{lt6SesDed.toLocaleString()}円</span>
                      </div>
                    </div>
                    {renderCompoundInput('longTermAnd', 'energyTotalAmount', 'エ　当該一般断熱改修工事等に係る標準的な費用の額')}
                    {renderCompoundSubsidy('longTermAnd', 'energyHasSubsidy', 'energySubsidyAmount', 'オ　当該一般断熱改修工事等に係る補助金等の交付の有無')}
                    <div className="bg-white rounded-2xl p-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-stone-600">カ　エからオを差し引いた額（50万円を超える場合）</span>
                        <span className="font-medium">{lt6EnDed.toLocaleString()}円</span>
                      </div>
                    </div>
                    {renderCompoundInput('longTermAnd', 'durabilityTotalAmount', 'キ　当該耐久性向上改修工事等に係る標準的な費用の額')}
                    {renderCompoundSubsidy('longTermAnd', 'durabilityHasSubsidy', 'durabilitySubsidyAmount', 'ク　当該耐久性向上改修工事等に係る補助金等の交付の有無')}
                    <div className="bg-white rounded-2xl p-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-stone-600">ケ　キからクを差し引いた額（50万円を超える場合）</span>
                        <span className="font-medium">{lt6DurDed.toLocaleString()}円</span>
                      </div>
                    </div>
                    <div className="bg-emerald-100 rounded-2xl p-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-stone-700 font-medium">コ　ウ、カ及びケの合計額</span>
                        <span className="font-bold">{lt6Ko.toLocaleString()}円</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600">サ　コと{hasSolar ? '600' : '500'}万円のうちいずれか少ない金額</span>
                        <span className="font-medium">{lt6Sa.toLocaleString()}円</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600">シ　コからサを差し引いた額</span>
                        <span className="font-medium">{lt6Shi.toLocaleString()}円</span>
                      </div>
                    </div>
                  </div>
                </div>

                {renderCategory('childcare', '⑦ 子育て対応改修工事等', ccCalc, '250万円', true)}

                {/* ⑳ その他増改築等（第1号～第6号工事） */}
                <div className="p-4 border border-stone-200 rounded-2xl">
                  <h4 className="font-bold text-sm mb-3">⑳ 改修工事と併せて行われた第1号工事～第6号工事</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-stone-700">ア　第1号工事～第6号工事に要した費用の額</label>
                        <a href="/other-renovation" target="_blank" rel="noopener noreferrer"
                          className="text-xs text-amber-600 hover:text-amber-800 underline">計算ページへ →</a>
                      </div>
                      <div className="flex items-center gap-2 max-w-sm">
                        <input type="number" min={0}
                          value={orCat.totalAmount || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            reformTaxCost: {
                              ...prev.reformTaxCost,
                              otherRenovation: { ...prev.reformTaxCost.otherRenovation, totalAmount: Math.max(0, parseInt(e.target.value) || 0) },
                            },
                          }))}
                          className="flex-1 px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                          placeholder="0" />
                        <span className="text-sm text-stone-600">円</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">イ　補助金等の交付の有無</label>
                      <div className="flex items-center gap-4 mb-2">
                        <label className="flex items-center gap-1 text-sm">
                          <input type="radio" checked={orCat.hasSubsidy}
                            onChange={() => setFormData(prev => ({
                              ...prev,
                              reformTaxCost: { ...prev.reformTaxCost, otherRenovation: { ...prev.reformTaxCost.otherRenovation, hasSubsidy: true } },
                            }))}
                            className="w-4 h-4" />
                          有
                        </label>
                        <label className="flex items-center gap-1 text-sm">
                          <input type="radio" checked={!orCat.hasSubsidy}
                            onChange={() => setFormData(prev => ({
                              ...prev,
                              reformTaxCost: { ...prev.reformTaxCost, otherRenovation: { ...prev.reformTaxCost.otherRenovation, hasSubsidy: false, subsidyAmount: 0 } },
                            }))}
                            className="w-4 h-4" />
                          無
                        </label>
                      </div>
                      {orCat.hasSubsidy && (
                        <div className="pl-4 border-l-2 border-stone-300">
                          <label className="block text-xs text-stone-600 mb-1">補助金等の額</label>
                          <div className="flex items-center gap-2 max-w-sm">
                            <input type="number" min={0}
                              value={orCat.subsidyAmount || ''}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                reformTaxCost: { ...prev.reformTaxCost, otherRenovation: { ...prev.reformTaxCost.otherRenovation, subsidyAmount: Math.max(0, parseInt(e.target.value) || 0) } },
                              }))}
                              className="flex-1 px-3 py-2 text-sm border-2 border-stone-200 rounded-2xl focus:border-amber-500 focus:outline-none transition-colors"
                              placeholder="0" />
                            <span className="text-sm text-stone-600">円</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="bg-stone-50 rounded-2xl p-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-stone-600">ウ　アからイを差し引いた額</span>
                        <span className="font-medium">{orAfterSub.toLocaleString()}円</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ⑧-⑲ パターン比較 */}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <h4 className="font-bold text-sm mb-3">パターン比較（自動計算）</h4>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-4 gap-2 font-medium text-stone-600 text-xs border-b pb-1">
                    <div></div><div className="text-right">ウ合計</div><div className="text-right">エ合計</div><div className="text-right">オ合計</div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-stone-700">⑧⑨⑩ P1</div>
                    <div className="text-right">{p1Ded.toLocaleString()}</div>
                    <div className="text-right">{p1Max.toLocaleString()}</div>
                    <div className="text-right">{p1Exc.toLocaleString()}</div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-stone-700">⑪⑫⑬ P2 (⑤)</div>
                    <div className="text-right">{p2Ded.toLocaleString()}</div>
                    <div className="text-right">{p2Max.toLocaleString()}</div>
                    <div className="text-right">{p2Exc.toLocaleString()}</div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-stone-700">⑭⑮⑯ P3 (⑥)</div>
                    <div className="text-right">{p3Ded.toLocaleString()}</div>
                    <div className="text-right">{p3Max.toLocaleString()}</div>
                    <div className="text-right">{p3Exc.toLocaleString()}</div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 border-t pt-1 font-semibold">
                    <div>⑰⑱⑲ 最大</div>
                    <div className="text-right">{r18.toLocaleString()}</div>
                    <div className="text-right">{r17.toLocaleString()}</div>
                    <div className="text-right">{r19.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* ㉑㉒㉓ 最終計算 */}
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <h4 className="font-bold text-sm mb-3">最終控除額計算</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-700">㉑ MIN(⑱, ⑲ + ⑳ウ)</span>
                    <span className="font-medium">{r21.toLocaleString()}円</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-700">㉒ 残り控除可能額（1,000万 - ⑰）</span>
                    <span className="font-medium">{r22.toLocaleString()}円</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold">
                    <span>㉓ 5%控除分 = MIN(㉑, ㉒)</span>
                    <span className="text-emerald-700">{r23.toLocaleString()}円</span>
                  </div>
                  <div className="mt-2 pt-2 border-t text-xs text-stone-600">
                    <div>10%控除対象: {r17.toLocaleString()}円 → 税額控除: {Math.round(r17 * 0.1).toLocaleString()}円</div>
                    <div>5%控除対象: {r23.toLocaleString()}円 → 税額控除: {Math.round(r23 * 0.05).toLocaleString()}円</div>
                    <div className="font-semibold mt-1">合計税額控除: {(Math.round(r17 * 0.1) + Math.round(r23 * 0.05)).toLocaleString()}円</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        /* その他の用途: 従来の詳細費用計算 */
        <CostCalculationStep
          selectedWorkTypes={effectiveWorkTypes}
          formState={formData.workDataForm}
          onChange={(workDataForm) => setFormData(prev => ({ ...prev, workDataForm }))}
        />
      )}
    </div>
  );
}
