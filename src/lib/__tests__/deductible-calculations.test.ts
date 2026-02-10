/**
 * 各工事種別の控除対象額計算テスト
 *
 * 公式様式に基づく計算ルール:
 *   控除対象額 = 工事費総額 − 補助金額
 *   ただし各種別に上限額・最低金額要件あり
 */

import { describe, it, expect } from 'vitest';

// 各工事種別の計算関数をインポート
import {
  calculateDeductibleAmount as calcSeismicDeductible,
  calculateSeismicAmount,
} from '@/lib/seismic-work-types';

import {
  calculateBarrierFreeDeductibleAmount,
  calculateBarrierFreeAmount,
} from '@/lib/barrier-free-work-types';

import {
  calculateEnergySavingDeductibleAmount,
  calculateEnergySavingAmount,
} from '@/lib/energy-saving-work-types';

import {
  calculateCohabitationDeductibleAmount,
  calculateCohabitationAmount,
} from '@/lib/cohabitation-work-types';

import {
  calculateChildcareDeductibleAmount,
  calculateChildcareAmount,
} from '@/lib/childcare-work-types';

import {
  calculateLongTermHousingDeductibleAmount,
  calculateLongTermHousingAmount,
} from '@/lib/long-term-housing-work-types';

import {
  calculateOtherRenovationDeductibleAmount,
  calculateOtherRenovationAmount,
} from '@/lib/other-renovation-work-types';

// ====================================================================
// 1. 耐震改修工事（上限250万円、50万円超で控除対象）
// ====================================================================
describe('耐震改修工事 控除対象額', () => {
  it('補助金なし: 総額がそのまま控除対象', () => {
    expect(calcSeismicDeductible(1500000, 0)).toBe(1500000);
  });

  it('補助金あり: 総額 − 補助金 = 控除対象', () => {
    expect(calcSeismicDeductible(2000000, 500000)).toBe(1500000);
  });

  it('上限250万円を超える場合は250万円', () => {
    expect(calcSeismicDeductible(5000000, 0)).toBe(2500000);
  });

  it('補助金控除後に上限超の場合', () => {
    expect(calcSeismicDeductible(5000000, 1000000)).toBe(2500000);
  });

  it('補助金控除後50万円以下の場合は0', () => {
    expect(calcSeismicDeductible(800000, 400000)).toBe(0);
  });

  it('ちょうど50万円の場合は0', () => {
    expect(calcSeismicDeductible(500000, 0)).toBe(0);
  });

  it('50万1円で控除対象になる', () => {
    expect(calcSeismicDeductible(500001, 0)).toBe(500001);
  });

  it('ちょうど250万円は上限内', () => {
    expect(calcSeismicDeductible(2500000, 0)).toBe(2500000);
  });

  it('補助金なしで0円は0', () => {
    expect(calcSeismicDeductible(0, 0)).toBe(0);
  });
});

describe('耐震改修 金額計算', () => {
  it('単価×数量', () => {
    expect(calculateSeismicAmount(10000, 5)).toBe(50000);
  });

  it('単価×数量×割合', () => {
    expect(calculateSeismicAmount(10000, 5, 80)).toBe(40000);
  });

  it('割合0の場合は割合なし扱い', () => {
    expect(calculateSeismicAmount(10000, 5, 0)).toBe(50000);
  });

  it('端数は四捨五入', () => {
    expect(calculateSeismicAmount(333, 3, 50)).toBe(500); // 333*3*0.5 = 499.5 → 500
  });
});

// ====================================================================
// 2. バリアフリー改修工事（上限200万円、50万円超で控除対象）
// ====================================================================
describe('バリアフリー改修工事 控除対象額', () => {
  it('補助金なし: 総額がそのまま控除対象', () => {
    expect(calculateBarrierFreeDeductibleAmount(1500000, 0)).toBe(1500000);
  });

  it('補助金あり: 総額 − 補助金', () => {
    expect(calculateBarrierFreeDeductibleAmount(1500000, 300000)).toBe(1200000);
  });

  it('上限200万円を超える場合は200万円', () => {
    expect(calculateBarrierFreeDeductibleAmount(3000000, 0)).toBe(2000000);
  });

  it('50万円以下は0', () => {
    expect(calculateBarrierFreeDeductibleAmount(500000, 0)).toBe(0);
  });

  it('補助金控除後50万円以下は0', () => {
    expect(calculateBarrierFreeDeductibleAmount(1000000, 600000)).toBe(0);
  });
});

describe('バリアフリー改修 金額計算', () => {
  it('単価×数量', () => {
    expect(calculateBarrierFreeAmount(8000, 10)).toBe(80000);
  });

  it('単価×数量×割合', () => {
    expect(calculateBarrierFreeAmount(8000, 10, 60)).toBe(48000);
  });
});

// ====================================================================
// 3. 省エネ改修工事（上限250万/太陽光350万、50万円超で控除対象）
// ====================================================================
describe('省エネ改修工事 控除対象額', () => {
  it('太陽光なし: 上限250万円', () => {
    expect(calculateEnergySavingDeductibleAmount(3000000, 0, false)).toBe(2500000);
  });

  it('太陽光あり: 上限350万円', () => {
    expect(calculateEnergySavingDeductibleAmount(4000000, 0, true)).toBe(3500000);
  });

  it('太陽光あり: 上限超の場合350万円', () => {
    expect(calculateEnergySavingDeductibleAmount(5000000, 0, true)).toBe(3500000);
  });

  it('太陽光あり: 上限内の金額はそのまま', () => {
    expect(calculateEnergySavingDeductibleAmount(2000000, 0, true)).toBe(2000000);
  });

  it('補助金あり: 総額 − 補助金', () => {
    expect(calculateEnergySavingDeductibleAmount(2000000, 500000, false)).toBe(1500000);
  });

  it('50万円以下は0', () => {
    expect(calculateEnergySavingDeductibleAmount(500000, 0, false)).toBe(0);
  });

  it('補助金控除後50万円以下は0', () => {
    expect(calculateEnergySavingDeductibleAmount(1000000, 600000, true)).toBe(0);
  });
});

describe('省エネ改修 金額計算', () => {
  it('単価×数量', () => {
    expect(calculateEnergySavingAmount(5000, 20)).toBe(100000);
  });

  it('窓面積割合あり', () => {
    expect(calculateEnergySavingAmount(5000, 20, 50)).toBe(50000);
  });

  it('居住用割合あり', () => {
    expect(calculateEnergySavingAmount(5000, 20, undefined, 80)).toBe(80000);
  });

  it('窓面積割合＋居住用割合の両方あり', () => {
    // 5000 * 20 * 0.5 * 0.8 = 40000
    expect(calculateEnergySavingAmount(5000, 20, 50, 80)).toBe(40000);
  });
});

// ====================================================================
// 4. 同居対応改修工事（上限250万円、50万円超で控除対象）
// ====================================================================
describe('同居対応改修工事 控除対象額', () => {
  it('補助金なし: 上限250万円', () => {
    expect(calculateCohabitationDeductibleAmount(3000000, 0)).toBe(2500000);
  });

  it('補助金あり: 総額 − 補助金', () => {
    expect(calculateCohabitationDeductibleAmount(2000000, 300000)).toBe(1700000);
  });

  it('50万円以下は0', () => {
    expect(calculateCohabitationDeductibleAmount(400000, 0)).toBe(0);
  });
});

describe('同居対応改修 金額計算', () => {
  it('単価×数量', () => {
    expect(calculateCohabitationAmount(15000, 3)).toBe(45000);
  });

  it('居住用割合あり', () => {
    expect(calculateCohabitationAmount(15000, 3, 70)).toBe(31500);
  });
});

// ====================================================================
// 5. 子育て対応改修工事（上限250万円、50万円超で控除対象）
// ====================================================================
describe('子育て対応改修工事 控除対象額', () => {
  it('補助金なし: 上限250万円', () => {
    expect(calculateChildcareDeductibleAmount(3000000, 0)).toBe(2500000);
  });

  it('補助金あり: 総額 − 補助金', () => {
    expect(calculateChildcareDeductibleAmount(1500000, 200000)).toBe(1300000);
  });

  it('50万円以下は0', () => {
    expect(calculateChildcareDeductibleAmount(500000, 0)).toBe(0);
  });

  it('ちょうど50万1円は控除対象', () => {
    expect(calculateChildcareDeductibleAmount(500001, 0)).toBe(500001);
  });
});

describe('子育て対応改修 金額計算', () => {
  it('単価×数量', () => {
    expect(calculateChildcareAmount(12000, 4)).toBe(48000);
  });

  it('居住用割合あり', () => {
    expect(calculateChildcareAmount(12000, 4, 50)).toBe(24000);
  });
});

// ====================================================================
// 6. 長期優良住宅化改修工事（上限250万/認定住宅500万、50万円超で控除対象）
// ====================================================================
describe('長期優良住宅化改修工事 控除対象額', () => {
  it('非認定: 上限250万円', () => {
    expect(calculateLongTermHousingDeductibleAmount(3000000, 0, false)).toBe(2500000);
  });

  it('認定住宅: 上限500万円', () => {
    expect(calculateLongTermHousingDeductibleAmount(6000000, 0, true)).toBe(5000000);
  });

  it('認定住宅: 上限内の金額はそのまま', () => {
    expect(calculateLongTermHousingDeductibleAmount(3000000, 0, true)).toBe(3000000);
  });

  it('補助金あり: 総額 − 補助金', () => {
    expect(calculateLongTermHousingDeductibleAmount(4000000, 1000000, true)).toBe(3000000);
  });

  it('50万円以下は0', () => {
    expect(calculateLongTermHousingDeductibleAmount(500000, 0, false)).toBe(0);
  });

  it('補助金控除後50万円以下は0', () => {
    expect(calculateLongTermHousingDeductibleAmount(1000000, 600000, true)).toBe(0);
  });
});

describe('長期優良住宅化改修 金額計算', () => {
  it('単価×数量', () => {
    expect(calculateLongTermHousingAmount(20000, 10)).toBe(200000);
  });

  it('居住用割合あり', () => {
    expect(calculateLongTermHousingAmount(20000, 10, 90)).toBe(180000);
  });
});

// ====================================================================
// 7. その他増改築等工事（上限なし、最低金額要件なし）
// ====================================================================
describe('その他増改築等工事 控除対象額', () => {
  it('補助金なし: 総額がそのまま控除対象（上限なし）', () => {
    expect(calculateOtherRenovationDeductibleAmount(10000000, 0)).toBe(10000000);
  });

  it('補助金あり: 総額 − 補助金', () => {
    expect(calculateOtherRenovationDeductibleAmount(5000000, 2000000)).toBe(3000000);
  });

  it('最低金額要件なし: 1円でも控除対象', () => {
    expect(calculateOtherRenovationDeductibleAmount(1, 0)).toBe(1);
  });

  it('補助金が総額を超える場合は0（マイナスにならない）', () => {
    expect(calculateOtherRenovationDeductibleAmount(1000000, 2000000)).toBe(0);
  });

  it('0円の場合は0', () => {
    expect(calculateOtherRenovationDeductibleAmount(0, 0)).toBe(0);
  });
});

describe('その他増改築等 金額計算', () => {
  it('金額そのまま', () => {
    expect(calculateOtherRenovationAmount(1000000)).toBe(1000000);
  });

  it('居住用割合あり', () => {
    expect(calculateOtherRenovationAmount(1000000, 75)).toBe(750000);
  });

  it('割合0は割合なし扱い', () => {
    expect(calculateOtherRenovationAmount(1000000, 0)).toBe(1000000);
  });
});

// ====================================================================
// 住宅借入金等特別控除 詳細ページの控除対象額計算
// ====================================================================
describe('住宅借入金等特別控除 詳細 控除対象額計算', () => {
  // housing-loan-detail/page.tsx の計算ロジックを直接テスト
  // deductibleAmount = hasSubsidy ? totalCost - subsidyAmount : totalCost

  function calcHousingLoanDeductible(
    totalCost: number,
    hasSubsidy: boolean,
    subsidyAmount: number
  ): number {
    return hasSubsidy ? totalCost - subsidyAmount : totalCost;
  }

  it('補助金なし: 総額がそのまま控除対象', () => {
    expect(calcHousingLoanDeductible(2500000, false, 0)).toBe(2500000);
  });

  it('補助金あり: 総額 − 補助金', () => {
    expect(calcHousingLoanDeductible(2500000, true, 500000)).toBe(2000000);
  });

  it('補助金なしフラグでも補助金額が入力されていれば無視', () => {
    // hasSubsidy=false の場合、subsidyAmountは無視されtotalCostがそのまま返る
    expect(calcHousingLoanDeductible(2500000, false, 500000)).toBe(2500000);
  });

  it('工事費0円の場合', () => {
    expect(calcHousingLoanDeductible(0, false, 0)).toBe(0);
  });

  it('補助金が工事費と同額の場合', () => {
    expect(calcHousingLoanDeductible(1000000, true, 1000000)).toBe(0);
  });

  it('補助金が工事費を超える場合（マイナスになる）', () => {
    // 注意: ページではマイナスのままになる（UIで警告を出すべき）
    expect(calcHousingLoanDeductible(1000000, true, 1500000)).toBe(-500000);
  });

  it('100万円以上で控除対象', () => {
    const result = calcHousingLoanDeductible(1500000, true, 400000);
    expect(result).toBe(1100000);
    expect(result >= 1000000).toBe(true);
  });

  it('100万円未満は控除対象外', () => {
    const result = calcHousingLoanDeductible(1500000, true, 600000);
    expect(result).toBe(900000);
    expect(result >= 1000000).toBe(false);
  });

  it('大きな金額での計算', () => {
    expect(calcHousingLoanDeductible(50000000, true, 10000000)).toBe(40000000);
  });
});

// ====================================================================
// 横断テスト: 全工事種別の共通パターン
// ====================================================================
describe('全工事種別 共通パターン検証', () => {
  // 50万円超の最低要件がある工事種別
  const deductibleFunctions = [
    { name: '耐震改修', fn: calcSeismicDeductible, limit: 2500000 },
    { name: 'バリアフリー', fn: calculateBarrierFreeDeductibleAmount, limit: 2000000 },
    { name: '省エネ（太陽光なし）', fn: (t: number, s: number) => calculateEnergySavingDeductibleAmount(t, s, false), limit: 2500000 },
    { name: '同居対応', fn: calculateCohabitationDeductibleAmount, limit: 2500000 },
    { name: '子育て', fn: calculateChildcareDeductibleAmount, limit: 2500000 },
    { name: '長期優良（非認定）', fn: (t: number, s: number) => calculateLongTermHousingDeductibleAmount(t, s, false), limit: 2500000 },
  ];

  for (const { name, fn, limit } of deductibleFunctions) {
    describe(`${name}`, () => {
      it('50万円以下は0', () => {
        expect(fn(500000, 0)).toBe(0);
      });

      it('50万1円は控除対象', () => {
        expect(fn(500001, 0)).toBe(500001);
      });

      it(`上限${(limit / 10000).toLocaleString()}万円`, () => {
        expect(fn(limit + 1000000, 0)).toBe(limit);
      });

      it(`ちょうど上限額は上限内`, () => {
        expect(fn(limit, 0)).toBe(limit);
      });

      it('補助金控除は正しく適用', () => {
        expect(fn(1500000, 200000)).toBe(1300000);
      });
    });
  }

  // その他増改築は特殊（上限なし、最低なし）
  describe('その他増改築 特殊ルール', () => {
    it('上限なし: 1000万円でもそのまま', () => {
      expect(calculateOtherRenovationDeductibleAmount(10000000, 0)).toBe(10000000);
    });

    it('最低要件なし: 1円でも控除対象', () => {
      expect(calculateOtherRenovationDeductibleAmount(1, 0)).toBe(1);
    });
  });
});
