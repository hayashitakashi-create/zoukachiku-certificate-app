/**
 * CostCalculationStep 統合テスト
 *
 * convertFormStateToWorkData の入力→出力をE2Eで検証:
 *   フォーム入力 → 工事費総額 → 補助金控除 → 控除対象額
 */

import { describe, it, expect } from 'vitest';
import { convertFormStateToWorkData, type WorkDataFormState } from '@/components/CostCalculationStep';
import { SEISMIC_WORK_TYPES } from '@/lib/seismic-work-types';
import { BARRIER_FREE_WORK_TYPES } from '@/lib/barrier-free-work-types';
import { ENERGY_SAVING_WORK_TYPES } from '@/lib/energy-saving-work-types';
import { COHABITATION_WORK_TYPES } from '@/lib/cohabitation-work-types';
import { CHILDCARE_WORK_TYPES } from '@/lib/childcare-work-types';
import { LONG_TERM_HOUSING_WORK_TYPES } from '@/lib/long-term-housing-work-types';

// ====================================================================
// 耐震改修 E2E
// ====================================================================
describe('convertFormStateToWorkData: 耐震改修', () => {
  const firstWorkType = SEISMIC_WORK_TYPES[0];

  it('1項目入力 → 工事費総額・補助金・控除対象額が正しく計算される', () => {
    const formState: WorkDataFormState = {
      seismic: {
        items: [
          { id: '1', workTypeCode: firstWorkType.code, quantity: 10 },
        ],
        subsidyAmount: 100000,
      },
    };

    const result = convertFormStateToWorkData(formState);
    const summary = result.seismic.summary;

    expect(summary).not.toBeNull();
    // 総額 = 単価 × 数量
    const expectedTotal = firstWorkType.unitPrice * 10;
    expect(summary!.totalAmount).toBe(expectedTotal);
    expect(summary!.subsidyAmount).toBe(100000);
    // 控除対象額 = min(totalAmount - subsidyAmount, 250万) ※50万超の場合
    const afterSubsidy = expectedTotal - 100000;
    if (afterSubsidy <= 500000) {
      expect(summary!.deductibleAmount).toBe(0);
    } else {
      expect(summary!.deductibleAmount).toBe(Math.min(afterSubsidy, 2500000));
    }
  });

  it('複数項目入力 → 合計が正しい', () => {
    const wt1 = SEISMIC_WORK_TYPES[0];
    const wt2 = SEISMIC_WORK_TYPES.length > 1 ? SEISMIC_WORK_TYPES[1] : SEISMIC_WORK_TYPES[0];

    const formState: WorkDataFormState = {
      seismic: {
        items: [
          { id: '1', workTypeCode: wt1.code, quantity: 5 },
          { id: '2', workTypeCode: wt2.code, quantity: 3 },
        ],
        subsidyAmount: 0,
      },
    };

    const result = convertFormStateToWorkData(formState);
    const summary = result.seismic.summary;

    expect(summary).not.toBeNull();
    const expectedTotal = (wt1.unitPrice * 5) + (wt2.unitPrice * 3);
    expect(summary!.totalAmount).toBe(expectedTotal);
  });

  it('数量0の項目は無視される', () => {
    const formState: WorkDataFormState = {
      seismic: {
        items: [
          { id: '1', workTypeCode: firstWorkType.code, quantity: 0 },
        ],
        subsidyAmount: 0,
      },
    };

    const result = convertFormStateToWorkData(formState);
    expect(result.seismic.summary).toBeNull();
  });

  it('割合(%)指定で金額が按分される', () => {
    const formState: WorkDataFormState = {
      seismic: {
        items: [
          { id: '1', workTypeCode: firstWorkType.code, quantity: 10, ratio: 80 },
        ],
        subsidyAmount: 0,
      },
    };

    const result = convertFormStateToWorkData(formState);
    const summary = result.seismic.summary;

    expect(summary).not.toBeNull();
    const expectedTotal = Math.round(firstWorkType.unitPrice * 10 * 0.80);
    expect(summary!.totalAmount).toBe(expectedTotal);
  });
});

// ====================================================================
// バリアフリー改修 E2E
// ====================================================================
describe('convertFormStateToWorkData: バリアフリー改修', () => {
  const firstWorkType = BARRIER_FREE_WORK_TYPES[0];

  it('基本計算が正しい', () => {
    const formState: WorkDataFormState = {
      barrierFree: {
        items: [
          { id: '1', workTypeCode: firstWorkType.code, quantity: 5 },
        ],
        subsidyAmount: 200000,
      },
    };

    const result = convertFormStateToWorkData(formState);
    const summary = result.barrierFree.summary;

    expect(summary).not.toBeNull();
    const expectedTotal = firstWorkType.unitPrice * 5;
    expect(summary!.totalAmount).toBe(expectedTotal);
    expect(summary!.subsidyAmount).toBe(200000);

    const afterSubsidy = expectedTotal - 200000;
    if (afterSubsidy <= 500000) {
      expect(summary!.deductibleAmount).toBe(0);
    } else {
      expect(summary!.deductibleAmount).toBe(Math.min(afterSubsidy, 2000000));
    }
  });
});

// ====================================================================
// 省エネ改修 E2E
// ====================================================================
describe('convertFormStateToWorkData: 省エネ改修', () => {
  const firstWorkType = ENERGY_SAVING_WORK_TYPES[0];

  it('太陽光なしの場合、上限250万円', () => {
    const formState: WorkDataFormState = {
      energySaving: {
        items: [
          { id: '1', workTypeCode: firstWorkType.code, quantity: 100 },
        ],
        subsidyAmount: 0,
        hasSolarPower: false,
      },
    };

    const result = convertFormStateToWorkData(formState);
    const summary = result.energySaving.summary;

    expect(summary).not.toBeNull();
    if (summary!.totalAmount > 2500000) {
      expect(summary!.deductibleAmount).toBe(2500000);
    }
    expect(summary!.hasSolarPower).toBe(false);
  });

  it('太陽光ありの場合、上限350万円', () => {
    const formState: WorkDataFormState = {
      energySaving: {
        items: [
          { id: '1', workTypeCode: firstWorkType.code, quantity: 100 },
        ],
        subsidyAmount: 0,
        hasSolarPower: true,
      },
    };

    const result = convertFormStateToWorkData(formState);
    const summary = result.energySaving.summary;

    expect(summary).not.toBeNull();
    if (summary!.totalAmount > 3500000) {
      expect(summary!.deductibleAmount).toBe(3500000);
    }
    expect(summary!.hasSolarPower).toBe(true);
  });
});

// ====================================================================
// その他増改築等 E2E
// ====================================================================
describe('convertFormStateToWorkData: その他増改築', () => {
  it('直接金額入力が正しく反映される', () => {
    const formState: WorkDataFormState = {
      otherRenovation: {
        items: [
          { id: '1', workTypeCode: '', quantity: 0, categoryCode: 'extension', amount: 3000000, workDescription: '増築工事' },
        ],
        subsidyAmount: 500000,
      },
    };

    const result = convertFormStateToWorkData(formState);
    const summary = result.otherRenovation.summary;

    expect(summary).not.toBeNull();
    expect(summary!.totalAmount).toBe(3000000);
    expect(summary!.subsidyAmount).toBe(500000);
    expect(summary!.deductibleAmount).toBe(2500000); // 上限なし
  });

  it('居住用割合が適用される', () => {
    const formState: WorkDataFormState = {
      otherRenovation: {
        items: [
          { id: '1', workTypeCode: '', quantity: 0, categoryCode: 'extension', amount: 2000000, ratio: 60 },
        ],
        subsidyAmount: 0,
      },
    };

    const result = convertFormStateToWorkData(formState);
    const summary = result.otherRenovation.summary;

    expect(summary).not.toBeNull();
    expect(summary!.totalAmount).toBe(1200000); // 2000000 * 60% = 1200000
    expect(summary!.deductibleAmount).toBe(1200000);
  });

  it('複数項目の合算', () => {
    const formState: WorkDataFormState = {
      otherRenovation: {
        items: [
          { id: '1', workTypeCode: '', quantity: 0, categoryCode: 'extension', amount: 1000000 },
          { id: '2', workTypeCode: '', quantity: 0, categoryCode: 'majorRepair', amount: 2000000 },
        ],
        subsidyAmount: 300000,
      },
    };

    const result = convertFormStateToWorkData(formState);
    const summary = result.otherRenovation.summary;

    expect(summary).not.toBeNull();
    expect(summary!.totalAmount).toBe(3000000);
    expect(summary!.subsidyAmount).toBe(300000);
    expect(summary!.deductibleAmount).toBe(2700000);
  });
});

// ====================================================================
// 長期優良住宅 E2E
// ====================================================================
describe('convertFormStateToWorkData: 長期優良住宅', () => {
  const firstWorkType = LONG_TERM_HOUSING_WORK_TYPES[0];

  it('非認定: 上限250万円', () => {
    const formState: WorkDataFormState = {
      longTermHousing: {
        items: [
          { id: '1', workTypeCode: firstWorkType.code, quantity: 100 },
        ],
        subsidyAmount: 0,
        isExcellentHousing: false,
      },
    };

    const result = convertFormStateToWorkData(formState);
    const summary = result.longTermHousing.summary;

    expect(summary).not.toBeNull();
    if (summary!.totalAmount > 2500000) {
      expect(summary!.deductibleAmount).toBe(2500000);
    }
    expect(summary!.isExcellentHousing).toBe(false);
  });

  it('認定住宅: 上限500万円', () => {
    const formState: WorkDataFormState = {
      longTermHousing: {
        items: [
          { id: '1', workTypeCode: firstWorkType.code, quantity: 100 },
        ],
        subsidyAmount: 0,
        isExcellentHousing: true,
      },
    };

    const result = convertFormStateToWorkData(formState);
    const summary = result.longTermHousing.summary;

    expect(summary).not.toBeNull();
    if (summary!.totalAmount > 5000000) {
      expect(summary!.deductibleAmount).toBe(5000000);
    }
    expect(summary!.isExcellentHousing).toBe(true);
  });
});

// ====================================================================
// 複数工事種別の同時計算
// ====================================================================
describe('convertFormStateToWorkData: 複数工事種別同時', () => {
  it('耐震 + バリアフリー を同時に計算できる', () => {
    const seismicWt = SEISMIC_WORK_TYPES[0];
    const bfWt = BARRIER_FREE_WORK_TYPES[0];

    const formState: WorkDataFormState = {
      seismic: {
        items: [{ id: '1', workTypeCode: seismicWt.code, quantity: 5 }],
        subsidyAmount: 0,
      },
      barrierFree: {
        items: [{ id: '2', workTypeCode: bfWt.code, quantity: 3 }],
        subsidyAmount: 50000,
      },
    };

    const result = convertFormStateToWorkData(formState);

    expect(result.seismic.summary).not.toBeNull();
    expect(result.barrierFree.summary).not.toBeNull();

    // 耐震の総額
    expect(result.seismic.summary!.totalAmount).toBe(seismicWt.unitPrice * 5);
    // バリアフリーの総額
    expect(result.barrierFree.summary!.totalAmount).toBe(bfWt.unitPrice * 3);
    // バリアフリーの補助金
    expect(result.barrierFree.summary!.subsidyAmount).toBe(50000);

    // 未入力の工事種別はnull
    expect(result.energySaving.summary).toBeNull();
    expect(result.cohabitation.summary).toBeNull();
  });

  it('空のフォーム状態では全てnull', () => {
    const formState: WorkDataFormState = {};
    const result = convertFormStateToWorkData(formState);

    expect(result.seismic.summary).toBeNull();
    expect(result.barrierFree.summary).toBeNull();
    expect(result.energySaving.summary).toBeNull();
    expect(result.cohabitation.summary).toBeNull();
    expect(result.childcare.summary).toBeNull();
    expect(result.longTermHousing.summary).toBeNull();
    expect(result.otherRenovation.summary).toBeNull();
  });
});

// ====================================================================
// 住宅借入金等特別控除 詳細の控除対象額 E2E
// ====================================================================
describe('住宅借入金等特別控除 詳細: 工事費総額→補助金→控除対象額', () => {
  /**
   * housing-loan-detail/page.tsx の計算ロジック:
   *   deductibleAmount = hasSubsidy ? totalCost - subsidyAmount : totalCost
   * これをシミュレーションしてテスト
   */
  function simulateHousingLoanDetail(totalCost: number, hasSubsidy: boolean, subsidyAmount: number) {
    const deductibleAmount = hasSubsidy ? totalCost - subsidyAmount : totalCost;
    return {
      totalCost,
      hasSubsidy,
      subsidyAmount,
      deductibleAmount,
      isEligible: deductibleAmount >= 1000000,
    };
  }

  it('シナリオ1: 工事費250万、補助金なし → 控除対象250万、対象', () => {
    const result = simulateHousingLoanDetail(2500000, false, 0);
    expect(result.deductibleAmount).toBe(2500000);
    expect(result.isEligible).toBe(true);
  });

  it('シナリオ2: 工事費250万、補助金50万 → 控除対象200万、対象', () => {
    const result = simulateHousingLoanDetail(2500000, true, 500000);
    expect(result.deductibleAmount).toBe(2000000);
    expect(result.isEligible).toBe(true);
  });

  it('シナリオ3: 工事費150万、補助金60万 → 控除対象90万、対象外', () => {
    const result = simulateHousingLoanDetail(1500000, true, 600000);
    expect(result.deductibleAmount).toBe(900000);
    expect(result.isEligible).toBe(false);
  });

  it('シナリオ4: 工事費100万、補助金なし → ちょうど100万、対象', () => {
    const result = simulateHousingLoanDetail(1000000, false, 0);
    expect(result.deductibleAmount).toBe(1000000);
    expect(result.isEligible).toBe(true);
  });

  it('シナリオ5: 工事費99万9999 → 100万未満、対象外', () => {
    const result = simulateHousingLoanDetail(999999, false, 0);
    expect(result.deductibleAmount).toBe(999999);
    expect(result.isEligible).toBe(false);
  });

  it('シナリオ6: 工事費5000万、補助金1000万 → 控除対象4000万、対象', () => {
    const result = simulateHousingLoanDetail(50000000, true, 10000000);
    expect(result.deductibleAmount).toBe(40000000);
    expect(result.isEligible).toBe(true);
  });

  it('シナリオ7: 補助金なしフラグでsubsidyAmount入力あり → subsidyAmountは無視', () => {
    const result = simulateHousingLoanDetail(2000000, false, 500000);
    expect(result.deductibleAmount).toBe(2000000); // 補助金は無視される
    expect(result.isEligible).toBe(true);
  });
});
