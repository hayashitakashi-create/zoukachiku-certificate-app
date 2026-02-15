'use client';

import type { PurposeType } from '@/lib/store';
import type { StepProps, WizardStep } from '../types';
import { PURPOSE_SECTION_INFO } from '../types';

type Step6Props = StepProps & {
  goToStep: (step: WizardStep) => void;
  saveCertificate: (status: 'draft' | 'completed') => void;
  isSaving: boolean;
  getCostSummary: () => { totalAmount: number; totalSubsidy: number; details: { label: string; total: number; subsidy: number }[] };
  effectiveWorkTypes: string[];
};

export default function Step6Confirmation({ formData, setFormData, goToStep, saveCertificate, isSaving, getCostSummary, effectiveWorkTypes }: Step6Props) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">確認と保存</h2>

      <div className="space-y-4">
        {/* 基本情報プレビュー */}
        <div className="bg-stone-50 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">基本情報</h3>
            <button type="button" onClick={() => goToStep(1)} className="text-xs text-amber-600">編集</button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-stone-500">氏名:</span> {formData.applicantName || '(未入力)'}</div>
            <div><span className="text-stone-500">住所:</span> {(formData.applicantAddress + (formData.applicantAddressDetail || '')) || '(未入力)'}</div>
            <div><span className="text-stone-500">所在地:</span> {formData.propertyAddress || '(未入力)'}</div>
            <div><span className="text-stone-500">完了日:</span> {formData.completionDate || '(未入力)'}</div>
          </div>
        </div>

        {/* (1) 工事種別プレビュー */}
        <div className="bg-stone-50 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">(1) 実施した工事の種別</h3>
            <button type="button" onClick={() => goToStep(2)} className="text-xs text-amber-600">編集</button>
          </div>
          <p className="text-sm">
            {formData.purposeType
              ? `${PURPOSE_SECTION_INFO[formData.purposeType as PurposeType]?.sectionNumber || ''}．入力済み`
              : '(未選択)'}
          </p>
        </div>

        {/* (2) 工事内容記述プレビュー */}
        <div className="bg-stone-50 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">(2) 実施した工事の内容</h3>
            <button type="button" onClick={() => goToStep(3)} className="text-xs text-amber-600">編集</button>
          </div>
          {formData.workDescriptions['_all'] ? (
            <p className="text-sm whitespace-pre-wrap">{formData.workDescriptions['_all']}</p>
          ) : (
            <p className="text-sm text-stone-500">(未入力)</p>
          )}
        </div>

        {/* (3) 費用サマリープレビュー */}
        <div className="bg-stone-50 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">(3) 工事の費用の額</h3>
            <button type="button" onClick={() => goToStep(4)} className="text-xs text-amber-600">編集</button>
          </div>
          {(formData.purposeType === 'housing_loan' || formData.purposeType === 'resale') ? (
            (() => {
              const hlCost = formData.housingLoanCost;
              const sub = hlCost.hasSubsidy ? hlCost.subsidyAmount : 0;
              const deductible = Math.max(0, hlCost.totalCost - sub);
              return hlCost.totalCost > 0 ? (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-600">① 費用の額:</span>
                    <span>{hlCost.totalCost.toLocaleString()}円</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">② 補助金:</span>
                    <span>{hlCost.hasSubsidy ? `${sub.toLocaleString()}円` : 'なし'}</span>
                  </div>
                  <div className="pt-2 border-t font-semibold flex justify-between">
                    <span>③ 控除対象額:</span>
                    <span>{deductible.toLocaleString()}円</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-stone-500">(費用データなし)</p>
              );
            })()
          ) : formData.purposeType === 'reform_tax' ? (
            (() => {
              const rc = formData.reformTaxCost;
              const wt = formData.reformTaxWorkTypes;
              const hasSolar = rc.energySaving.hasSolarPower || (wt.energySaving.equipmentTypes.solarPower !== '');

              const calcCat = (cat: { totalAmount: number; hasSubsidy: boolean; subsidyAmount: number }, limit: number, needOver50: boolean) => {
                const sub = cat.hasSubsidy ? cat.subsidyAmount : 0;
                const afterSub = cat.totalAmount - sub;
                const ded = needOver50 ? (afterSub > 500_000 ? afterSub : 0) : Math.max(0, afterSub);
                const maxD = limit > 0 ? Math.min(ded, limit) : ded;
                return { total: cat.totalAmount, maxDed: maxD };
              };

              const cats: { label: string; result: { total: number; maxDed: number } }[] = [];
              if (rc.seismic.totalAmount > 0) cats.push({ label: '① 住宅耐震改修', result: calcCat(rc.seismic, 2_500_000, false) });
              if (rc.barrierFree.totalAmount > 0) cats.push({ label: '② 高齢者等居住改修工事等', result: calcCat(rc.barrierFree, 2_000_000, true) });
              if (rc.energySaving.totalAmount > 0) cats.push({ label: '③ 一般断熱改修工事等', result: calcCat(rc.energySaving, hasSolar ? 3_500_000 : 2_500_000, true) });
              if (rc.cohabitation.totalAmount > 0) cats.push({ label: '④ 多世帯同居改修工事等', result: calcCat(rc.cohabitation, 2_500_000, true) });
              // ⑤ (OR)
              {
                const lt5t = rc.longTermOr.baseTotalAmount + rc.longTermOr.durabilityTotalAmount;
                if (lt5t > 0) {
                  const lt5Limit = hasSolar ? 3_500_000 : 2_500_000;
                  const lt5BaseSub = rc.longTermOr.baseHasSubsidy ? rc.longTermOr.baseSubsidyAmount : 0;
                  const lt5BaseDed = (rc.longTermOr.baseTotalAmount - lt5BaseSub) > 500_000 ? (rc.longTermOr.baseTotalAmount - lt5BaseSub) : 0;
                  const lt5DurSub = rc.longTermOr.durabilityHasSubsidy ? rc.longTermOr.durabilitySubsidyAmount : 0;
                  const lt5DurDed = (rc.longTermOr.durabilityTotalAmount - lt5DurSub) > 500_000 ? (rc.longTermOr.durabilityTotalAmount - lt5DurSub) : 0;
                  const lt5Ki = lt5BaseDed + lt5DurDed;
                  cats.push({ label: '⑤ 耐久性向上(OR)', result: { total: lt5t, maxDed: Math.min(lt5Ki, lt5Limit) } });
                }
              }
              // ⑥ (AND)
              {
                const lt6t = rc.longTermAnd.seismicTotalAmount + rc.longTermAnd.energyTotalAmount + rc.longTermAnd.durabilityTotalAmount;
                if (lt6t > 0) {
                  const lt6Limit = hasSolar ? 6_000_000 : 5_000_000;
                  const lt6SesSub = rc.longTermAnd.seismicHasSubsidy ? rc.longTermAnd.seismicSubsidyAmount : 0;
                  const lt6SesAfterP = rc.longTermAnd.seismicTotalAmount - lt6SesSub;
                  const lt6SesDed = lt6SesAfterP > 500_000 ? lt6SesAfterP : 0;
                  const lt6EnSub = rc.longTermAnd.energyHasSubsidy ? rc.longTermAnd.energySubsidyAmount : 0;
                  const lt6EnDed = (rc.longTermAnd.energyTotalAmount - lt6EnSub) > 500_000 ? (rc.longTermAnd.energyTotalAmount - lt6EnSub) : 0;
                  const lt6DurSub = rc.longTermAnd.durabilityHasSubsidy ? rc.longTermAnd.durabilitySubsidyAmount : 0;
                  const lt6DurDed = (rc.longTermAnd.durabilityTotalAmount - lt6DurSub) > 500_000 ? (rc.longTermAnd.durabilityTotalAmount - lt6DurSub) : 0;
                  const lt6Ko = lt6SesDed + lt6EnDed + lt6DurDed;
                  cats.push({ label: '⑥ 耐久性向上(AND)', result: { total: lt6t, maxDed: Math.min(lt6Ko, lt6Limit) } });
                }
              }
              if (rc.childcare.totalAmount > 0) cats.push({ label: '⑦ 子育て対応改修工事等', result: calcCat(rc.childcare, 2_500_000, true) });
              if (rc.otherRenovation.totalAmount > 0) {
                const orSub = rc.otherRenovation.hasSubsidy ? rc.otherRenovation.subsidyAmount : 0;
                const orAfter = Math.max(0, rc.otherRenovation.totalAmount - orSub);
                cats.push({ label: '⑳ 第1号～第6号工事', result: { total: rc.otherRenovation.totalAmount, maxDed: orAfter } });
              }

              return cats.length > 0 ? (
                <div className="space-y-1 text-sm">
                  {cats.map(c => (
                    <div key={c.label} className="flex justify-between">
                      <span className="text-stone-600">{c.label}:</span>
                      <span>ア {c.result.total.toLocaleString()}円 → エ {c.result.maxDed.toLocaleString()}円</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t font-semibold flex justify-between">
                    <span>ア合計:</span>
                    <span>{cats.reduce((s, c) => s + c.result.total, 0).toLocaleString()}円</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-stone-500">(費用データなし)</p>
              );
            })()
          ) : (
            (() => {
              const costSummary = getCostSummary();
              return costSummary.totalAmount > 0 ? (
                <div className="space-y-1 text-sm">
                  {costSummary.details.map(d => (
                    <div key={d.label} className="flex justify-between">
                      <span className="text-stone-600">{d.label}:</span>
                      <span>{d.total.toLocaleString()}円{d.subsidy > 0 ? ` (補助金: ${d.subsidy.toLocaleString()}円)` : ''}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t font-semibold flex justify-between">
                    <span>合計:</span>
                    <span>{costSummary.totalAmount.toLocaleString()}円</span>
                  </div>
                  {costSummary.totalSubsidy > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>補助金合計:</span>
                      <span>{costSummary.totalSubsidy.toLocaleString()}円</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-stone-500">(費用データなし)</p>
              );
            })()
          )}
        </div>

        {/* 証明者情報プレビュー */}
        <div className="bg-stone-50 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">証明者情報</h3>
            <button type="button" onClick={() => goToStep(5)} className="text-xs text-amber-600">編集</button>
          </div>
          <p className="text-sm">
            {formData.issuerInfo?.organizationType
              ? `${(formData.issuerInfo as any).architectName || '(氏名未入力)'} / ${formData.issueDate || '(日付未入力)'}`
              : '(未入力)'}
          </p>
        </div>

        {/* 保存ボタン */}
        <div className="flex gap-3 pt-4 border-t border-stone-200">
          <button onClick={() => saveCertificate('draft')} disabled={isSaving}
            className="flex-1 px-4 py-3 bg-stone-200 text-stone-700 rounded-full hover:bg-stone-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors">
            {isSaving ? '保存中...' : '下書き保存'}
          </button>
          <button onClick={() => saveCertificate('completed')} disabled={isSaving}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-700 to-stone-700 hover:from-amber-800 hover:to-stone-800 text-white rounded-full shadow-xl shadow-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all hover:scale-105 disabled:hover:scale-100">
            {isSaving ? '保存中...' : '保存して完了'}
          </button>
        </div>

        <div className="text-xs text-amber-800 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 rounded-2xl border-2 border-amber-200">
          保存後、証明書の詳細画面から工事データの入力・PDF生成ができます。
          データはお使いのブラウザ内に保存されます。
        </div>
      </div>
    </div>
  );
}
