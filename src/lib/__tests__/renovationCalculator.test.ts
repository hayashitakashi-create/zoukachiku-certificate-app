import { describe, it, expect } from 'vitest';
import {
  calculateSeismicRenovation,
  calculateBarrierFreeRenovation,
  calculateEnergyRenovation,
  calculateCohabitationRenovation,
  calculateChildcareRenovation,
  calculateLongTermHousingRenovation,
  calculateOtherRenovation,
  calculateOptimalCombination,
  decimalToNumber,
  type WorkItem,
  type CombinedRenovations,
} from '../renovationCalculator';

// =============================================
// 耐震改修
// =============================================
describe('calculateSeismicRenovation', () => {
  it('基本的な計算: 単価 x 数量', () => {
    const items: WorkItem[] = [
      { unitPrice: 15400, quantity: 10 },
    ];
    const result = calculateSeismicRenovation(items, 0);
    expect(result.totalCost).toBe(154000);
    expect(result.afterSubsidy).toBe(154000);
    expect(result.deductibleAmount).toBe(154000);
    expect(result.maxDeduction).toBe(154000);
    expect(result.excessAmount).toBe(0);
  });

  it('居住割合を適用', () => {
    const items: WorkItem[] = [
      { unitPrice: 10000, quantity: 100, residentRatio: 0.8 },
    ];
    const result = calculateSeismicRenovation(items, 0);
    expect(result.totalCost).toBe(800000);
  });

  it('補助金差引', () => {
    const items: WorkItem[] = [
      { unitPrice: 10000, quantity: 200 },
    ];
    const result = calculateSeismicRenovation(items, 500000);
    expect(result.totalCost).toBe(2000000);
    expect(result.afterSubsidy).toBe(1500000);
    expect(result.deductibleAmount).toBe(1500000);
  });

  it('250万円上限を適用', () => {
    const items: WorkItem[] = [
      { unitPrice: 10000, quantity: 400 },
    ];
    const result = calculateSeismicRenovation(items, 0);
    expect(result.totalCost).toBe(4000000);
    expect(result.deductibleAmount).toBe(4000000);
    expect(result.maxDeduction).toBe(2500000);
    expect(result.excessAmount).toBe(1500000);
  });

  it('補助金が工事費を超える場合はdeductibleAmount=0', () => {
    const items: WorkItem[] = [
      { unitPrice: 10000, quantity: 10 },
    ];
    const result = calculateSeismicRenovation(items, 200000);
    expect(result.deductibleAmount).toBe(0);
  });

  it('複数工事項目の合計', () => {
    const items: WorkItem[] = [
      { unitPrice: 15400, quantity: 10 },
      { unitPrice: 20000, quantity: 5, residentRatio: 0.5 },
    ];
    const result = calculateSeismicRenovation(items, 0);
    expect(result.totalCost).toBe(154000 + 50000);
  });
});

// =============================================
// バリアフリー改修
// =============================================
describe('calculateBarrierFreeRenovation', () => {
  it('50万円超で控除対象', () => {
    const items: WorkItem[] = [
      { unitPrice: 10000, quantity: 60 },
    ];
    const result = calculateBarrierFreeRenovation(items, 0);
    expect(result.totalCost).toBe(600000);
    expect(result.deductibleAmount).toBe(600000);
    expect(result.maxDeduction).toBe(600000);
  });

  it('50万円以下で控除対象外', () => {
    const items: WorkItem[] = [
      { unitPrice: 10000, quantity: 50 },
    ];
    const result = calculateBarrierFreeRenovation(items, 0);
    expect(result.totalCost).toBe(500000);
    expect(result.deductibleAmount).toBe(0);
    expect(result.maxDeduction).toBe(0);
  });

  it('ちょうど50万円は控除対象外（50万円「超」）', () => {
    const items: WorkItem[] = [
      { unitPrice: 500000, quantity: 1 },
    ];
    const result = calculateBarrierFreeRenovation(items, 0);
    expect(result.deductibleAmount).toBe(0);
  });

  it('200万円上限を適用', () => {
    const items: WorkItem[] = [
      { unitPrice: 10000, quantity: 300 },
    ];
    const result = calculateBarrierFreeRenovation(items, 0);
    expect(result.deductibleAmount).toBe(3000000);
    expect(result.maxDeduction).toBe(2000000);
    expect(result.excessAmount).toBe(1000000);
  });
});

// =============================================
// 省エネ改修
// =============================================
describe('calculateEnergyRenovation', () => {
  it('50万円超で控除対象（太陽光なし）', () => {
    const items: WorkItem[] = [
      { unitPrice: 10000, quantity: 60 },
    ];
    const result = calculateEnergyRenovation(items, 0, false);
    expect(result.deductibleAmount).toBe(600000);
  });

  it('50万円以下で控除対象外', () => {
    const items: WorkItem[] = [
      { unitPrice: 10000, quantity: 50 },
    ];
    const result = calculateEnergyRenovation(items, 0, false);
    expect(result.deductibleAmount).toBe(0);
  });

  it('太陽光なし: 250万円上限', () => {
    const items: WorkItem[] = [
      { unitPrice: 10000, quantity: 400 },
    ];
    const result = calculateEnergyRenovation(items, 0, false);
    expect(result.maxDeduction).toBe(2500000);
    expect(result.excessAmount).toBe(1500000);
  });

  it('太陽光あり: 350万円上限', () => {
    const items: WorkItem[] = [
      { unitPrice: 10000, quantity: 400 },
    ];
    const result = calculateEnergyRenovation(items, 0, true);
    expect(result.maxDeduction).toBe(3500000);
    expect(result.excessAmount).toBe(500000);
  });

  it('窓面積割合を考慮', () => {
    const items: WorkItem[] = [
      { unitPrice: 10000, quantity: 100, windowAreaRatio: 0.5, residentRatio: 0.8 },
    ];
    const result = calculateEnergyRenovation(items, 0, false);
    expect(result.totalCost).toBe(10000 * 100 * 0.8 * 0.5);
  });
});

// =============================================
// 同居対応改修
// =============================================
describe('calculateCohabitationRenovation', () => {
  it('50万円超で控除対象', () => {
    const items: WorkItem[] = [
      { unitPrice: 476100, quantity: 2 },
    ];
    const result = calculateCohabitationRenovation(items, 0);
    expect(result.deductibleAmount).toBe(952200);
  });

  it('250万円上限を適用', () => {
    const items: WorkItem[] = [
      { unitPrice: 1622000, quantity: 2 },
    ];
    const result = calculateCohabitationRenovation(items, 0);
    expect(result.deductibleAmount).toBe(3244000);
    expect(result.maxDeduction).toBe(2500000);
    expect(result.excessAmount).toBe(744000);
  });
});

// =============================================
// 子育て対応改修
// =============================================
describe('calculateChildcareRenovation', () => {
  it('50万円超で控除対象', () => {
    const items: WorkItem[] = [
      { unitPrice: 100000, quantity: 6 },
    ];
    const result = calculateChildcareRenovation(items, 0);
    expect(result.deductibleAmount).toBe(600000);
  });

  it('50万円以下で控除対象外', () => {
    const items: WorkItem[] = [
      { unitPrice: 100000, quantity: 4 },
    ];
    const result = calculateChildcareRenovation(items, 0);
    expect(result.deductibleAmount).toBe(0);
  });

  it('250万円上限を適用', () => {
    const items: WorkItem[] = [
      { unitPrice: 100000, quantity: 30 },
    ];
    const result = calculateChildcareRenovation(items, 0);
    expect(result.maxDeduction).toBe(2500000);
    expect(result.excessAmount).toBe(500000);
  });
});

// =============================================
// 長期優良住宅化改修
// =============================================
describe('calculateLongTermHousingRenovation', () => {
  it('OR型（耐震又は省エネ）、太陽光なし: 250万円上限', () => {
    const items: WorkItem[] = [
      { unitPrice: 10000, quantity: 400 },
    ];
    const result = calculateLongTermHousingRenovation(items, 0, 'or', false);
    expect(result.maxDeduction).toBe(2500000);
    expect(result.excessAmount).toBe(1500000);
  });

  it('OR型（耐震又は省エネ）、太陽光あり: 350万円上限', () => {
    const items: WorkItem[] = [
      { unitPrice: 10000, quantity: 400 },
    ];
    const result = calculateLongTermHousingRenovation(items, 0, 'or', true);
    expect(result.maxDeduction).toBe(3500000);
    expect(result.excessAmount).toBe(500000);
  });

  it('AND型（耐震及び省エネ）、太陽光なし: 500万円上限', () => {
    const items: WorkItem[] = [
      { unitPrice: 10000, quantity: 600 },
    ];
    const result = calculateLongTermHousingRenovation(items, 0, 'and', false);
    expect(result.maxDeduction).toBe(5000000);
    expect(result.excessAmount).toBe(1000000);
  });

  it('AND型（耐震及び省エネ）、太陽光あり: 600万円上限', () => {
    const items: WorkItem[] = [
      { unitPrice: 10000, quantity: 700 },
    ];
    const result = calculateLongTermHousingRenovation(items, 0, 'and', true);
    expect(result.maxDeduction).toBe(6000000);
    expect(result.excessAmount).toBe(1000000);
  });

  it('50万円以下で控除対象外', () => {
    const items: WorkItem[] = [
      { unitPrice: 10000, quantity: 50 },
    ];
    const result = calculateLongTermHousingRenovation(items, 0, 'or', false);
    expect(result.deductibleAmount).toBe(0);
  });
});

// =============================================
// その他増改築
// =============================================
describe('calculateOtherRenovation', () => {
  it('基本的な計算', () => {
    const result = calculateOtherRenovation(1000000, 200000);
    expect(result.totalCost).toBe(1000000);
    expect(result.afterSubsidy).toBe(800000);
    expect(result.deductibleAmount).toBe(800000);
    expect(result.maxDeduction).toBe(800000);
    expect(result.excessAmount).toBe(0);
  });

  it('個別上限なし（高額でもそのまま）', () => {
    const result = calculateOtherRenovation(20000000, 0);
    expect(result.maxDeduction).toBe(20000000);
    expect(result.excessAmount).toBe(0);
  });

  it('補助金が工事費を超える場合', () => {
    const result = calculateOtherRenovation(500000, 600000);
    expect(result.deductibleAmount).toBe(0);
  });
});

// =============================================
// 最適組み合わせ計算
// =============================================
describe('calculateOptimalCombination', () => {
  it('パターン1のみ（長期優良住宅化なし）', () => {
    const renovations: CombinedRenovations = {
      seismic: {
        totalCost: 2000000, afterSubsidy: 2000000,
        deductibleAmount: 2000000, maxDeduction: 2000000, excessAmount: 0,
      },
      barrierFree: {
        totalCost: 800000, afterSubsidy: 800000,
        deductibleAmount: 800000, maxDeduction: 800000, excessAmount: 0,
      },
    };

    const result = calculateOptimalCombination(renovations);
    expect(result.maxControlAmount).toBe(2800000); // ⑨ = 2000000 + 800000
    expect(result.totalDeductible).toBe(2800000);  // ⑧ = 2000000 + 800000
    expect(result.excessAmount).toBe(0);
  });

  it('パターン2が最大の場合（長期優良住宅化OR）', () => {
    // パターン1: バリアフリー200万のみ → max=200万
    // パターン2: バリアフリー200万 + 長期優良OR 250万 → max=450万（こちらが大きい）
    const renovations: CombinedRenovations = {
      barrierFree: {
        totalCost: 2000000, afterSubsidy: 2000000,
        deductibleAmount: 2000000, maxDeduction: 2000000, excessAmount: 0,
      },
      longTermHousingOr: {
        totalCost: 3000000, afterSubsidy: 3000000,
        deductibleAmount: 3000000, maxDeduction: 2500000, excessAmount: 500000,
      },
    };

    const result = calculateOptimalCombination(renovations);
    // パターン2: 200万 + 250万 = 450万
    expect(result.maxControlAmount).toBe(4500000);
  });

  it('パターン3が最大の場合（長期優良住宅化AND）', () => {
    const renovations: CombinedRenovations = {
      barrierFree: {
        totalCost: 2000000, afterSubsidy: 2000000,
        deductibleAmount: 2000000, maxDeduction: 2000000, excessAmount: 0,
      },
      longTermHousingAnd: {
        totalCost: 6000000, afterSubsidy: 6000000,
        deductibleAmount: 6000000, maxDeduction: 5000000, excessAmount: 1000000,
      },
    };

    const result = calculateOptimalCombination(renovations);
    // パターン3: 200万 + 500万 = 700万
    expect(result.maxControlAmount).toBe(7000000);
  });

  it('1000万円上限を適用', () => {
    const renovations: CombinedRenovations = {
      seismic: {
        totalCost: 3000000, afterSubsidy: 3000000,
        deductibleAmount: 3000000, maxDeduction: 2500000, excessAmount: 500000,
      },
      barrierFree: {
        totalCost: 3000000, afterSubsidy: 3000000,
        deductibleAmount: 3000000, maxDeduction: 2000000, excessAmount: 1000000,
      },
      energy: {
        totalCost: 4000000, afterSubsidy: 4000000,
        deductibleAmount: 4000000, maxDeduction: 3500000, excessAmount: 500000,
      },
      cohabitation: {
        totalCost: 3000000, afterSubsidy: 3000000,
        deductibleAmount: 3000000, maxDeduction: 2500000, excessAmount: 500000,
      },
    };

    const result = calculateOptimalCombination(renovations);
    // ⑨ = 250+200+350+250 = 1050万 → 上限1000万
    expect(result.maxControlAmount).toBe(10000000);
    expect(result.remaining).toBe(0);
  });

  it('残り控除可能額を正しく計算', () => {
    const renovations: CombinedRenovations = {
      seismic: {
        totalCost: 1000000, afterSubsidy: 1000000,
        deductibleAmount: 1000000, maxDeduction: 1000000, excessAmount: 0,
      },
    };

    const result = calculateOptimalCombination(renovations);
    expect(result.maxControlAmount).toBe(1000000);
    expect(result.remaining).toBe(9000000); // 1000万 - 100万 = 900万
  });

  it('その他増改築との合算（㉑ = MIN(⑱, ⑲+⑳ウ)）', () => {
    const renovations: CombinedRenovations = {
      seismic: {
        totalCost: 3000000, afterSubsidy: 3000000,
        deductibleAmount: 3000000, maxDeduction: 2500000, excessAmount: 500000,
      },
      other: {
        totalCost: 2000000, afterSubsidy: 2000000,
        deductibleAmount: 2000000, maxDeduction: 2000000, excessAmount: 0,
      },
    };

    const result = calculateOptimalCombination(renovations);
    // ⑱ = 3000000
    // ⑲ = 500000
    // ⑳ウ = 2000000
    // ㉑ = MIN(3000000, 500000 + 2000000) = MIN(3000000, 2500000) = 2500000
    expect(result.finalDeductible).toBe(2500000);
  });

  it('データなしの場合', () => {
    const result = calculateOptimalCombination({});
    expect(result.maxControlAmount).toBe(0);
    expect(result.totalDeductible).toBe(0);
    expect(result.excessAmount).toBe(0);
    expect(result.remaining).toBe(10000000);
    expect(result.finalDeductible).toBe(0);
  });
});

// =============================================
// ヘルパー関数
// =============================================
describe('decimalToNumber', () => {
  it('numberをそのまま返す', () => {
    expect(decimalToNumber(123)).toBe(123);
    expect(decimalToNumber(0)).toBe(0);
  });

  it('null/undefinedを0に変換', () => {
    expect(decimalToNumber(null)).toBe(0);
    expect(decimalToNumber(undefined)).toBe(0);
  });

  it('Decimal互換オブジェクトを変換', () => {
    const decimal = { toString: () => '12345.67' };
    expect(decimalToNumber(decimal)).toBe(12345.67);
  });
});
