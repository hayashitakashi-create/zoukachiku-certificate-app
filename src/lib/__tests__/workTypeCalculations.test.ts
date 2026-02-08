import { describe, it, expect } from 'vitest';

import {
  calculateSeismicAmount,
  calculateSeismicTotal,
  calculateDeductibleAmount,
} from '../seismic-work-types';

import {
  calculateBarrierFreeAmount,
  calculateBarrierFreeTotal,
  calculateBarrierFreeDeductibleAmount,
} from '../barrier-free-work-types';

import {
  calculateEnergySavingAmount,
  calculateEnergySavingTotal,
  calculateEnergySavingDeductibleAmount,
  hasSolarPowerWork,
} from '../energy-saving-work-types';

import {
  calculateCohabitationAmount,
  calculateCohabitationTotal,
  calculateCohabitationDeductibleAmount,
} from '../cohabitation-work-types';

import {
  calculateChildcareAmount,
  calculateChildcareTotal,
  calculateChildcareDeductibleAmount,
} from '../childcare-work-types';

import {
  calculateOtherRenovationAmount,
  calculateOtherRenovationTotal,
  calculateOtherRenovationDeductibleAmount,
} from '../other-renovation-work-types';

import {
  calculateLongTermHousingAmount,
  calculateLongTermHousingTotal,
  calculateLongTermHousingDeductibleAmount,
} from '../long-term-housing-work-types';

import {
  calculateCertificateCost,
  validateHousingLoanEligibility,
  formatAmountInManYen,
  formatAmountInYen,
} from '../certificateCostCalculator';

// =============================================
// 耐震改修 work-types
// =============================================
describe('seismic-work-types', () => {
  describe('calculateSeismicAmount', () => {
    it('単価 x 数量', () => {
      expect(calculateSeismicAmount(15400, 10)).toBe(154000);
    });

    it('居住割合を適用（%表記）', () => {
      // ratio は 0-100 のパーセント
      expect(calculateSeismicAmount(10000, 100, 80)).toBe(800000);
    });

    it('居住割合なし', () => {
      expect(calculateSeismicAmount(10000, 5)).toBe(50000);
    });
  });

  describe('calculateSeismicTotal', () => {
    it('複数工事の合計', () => {
      const works = [
        { unitPrice: 15400, quantity: 10 },
        { unitPrice: 20000, quantity: 5 },
      ];
      expect(calculateSeismicTotal(works)).toBe(254000);
    });
  });

  describe('calculateDeductibleAmount', () => {
    it('250万円上限適用', () => {
      expect(calculateDeductibleAmount(4000000, 0)).toBe(2500000);
    });

    it('50万円超で控除対象', () => {
      expect(calculateDeductibleAmount(600000, 0)).toBe(600000);
    });

    it('50万円以下で控除対象外', () => {
      expect(calculateDeductibleAmount(500000, 0)).toBe(0);
    });

    it('補助金差引後の判定', () => {
      expect(calculateDeductibleAmount(1000000, 600000)).toBe(0); // 40万 ≤ 50万
      expect(calculateDeductibleAmount(1000000, 400000)).toBe(600000); // 60万 > 50万
    });
  });
});

// =============================================
// バリアフリー改修 work-types
// =============================================
describe('barrier-free-work-types', () => {
  describe('calculateBarrierFreeAmount', () => {
    it('単価 x 数量', () => {
      expect(calculateBarrierFreeAmount(10000, 10)).toBe(100000);
    });

    it('居住割合を適用', () => {
      expect(calculateBarrierFreeAmount(10000, 10, 50)).toBe(50000);
    });
  });

  describe('calculateBarrierFreeDeductibleAmount', () => {
    it('200万円上限適用', () => {
      expect(calculateBarrierFreeDeductibleAmount(3000000, 0)).toBe(2000000);
    });

    it('50万円以下で控除対象外', () => {
      expect(calculateBarrierFreeDeductibleAmount(500000, 0)).toBe(0);
    });
  });
});

// =============================================
// 省エネ改修 work-types
// =============================================
describe('energy-saving-work-types', () => {
  describe('calculateEnergySavingAmount', () => {
    it('単価 x 数量', () => {
      expect(calculateEnergySavingAmount(10000, 10)).toBe(100000);
    });

    it('窓面積割合と居住割合を適用', () => {
      expect(calculateEnergySavingAmount(10000, 10, 50, 80)).toBe(40000);
    });
  });

  describe('calculateEnergySavingDeductibleAmount', () => {
    it('太陽光なし: 250万円上限', () => {
      expect(calculateEnergySavingDeductibleAmount(4000000, 0, false)).toBe(2500000);
    });

    it('太陽光あり: 350万円上限', () => {
      expect(calculateEnergySavingDeductibleAmount(4000000, 0, true)).toBe(3500000);
    });

    it('50万円以下で控除対象外', () => {
      expect(calculateEnergySavingDeductibleAmount(500000, 0, false)).toBe(0);
    });
  });

  describe('hasSolarPowerWork', () => {
    it('太陽光工事コードを検出', () => {
      expect(hasSolarPowerWork(['es_solar_power'])).toBe(true);
      expect(hasSolarPowerWork(['es_solar_panel'])).toBe(true);
    });

    it('太陽光工事コードなし', () => {
      expect(hasSolarPowerWork(['es_glass_all_regions'])).toBe(false);
      expect(hasSolarPowerWork([])).toBe(false);
    });
  });
});

// =============================================
// 同居対応改修 work-types
// =============================================
describe('cohabitation-work-types', () => {
  describe('calculateCohabitationAmount', () => {
    it('単価 x 数量', () => {
      expect(calculateCohabitationAmount(476100, 2)).toBe(952200);
    });

    it('居住割合を適用', () => {
      expect(calculateCohabitationAmount(476100, 1, 50)).toBe(238050);
    });
  });

  describe('calculateCohabitationDeductibleAmount', () => {
    it('250万円上限適用', () => {
      expect(calculateCohabitationDeductibleAmount(3000000, 0)).toBe(2500000);
    });

    it('50万円以下で控除対象外', () => {
      expect(calculateCohabitationDeductibleAmount(500000, 0)).toBe(0);
    });
  });
});

// =============================================
// 子育て対応改修 work-types
// =============================================
describe('childcare-work-types', () => {
  describe('calculateChildcareAmount', () => {
    it('単価 x 数量', () => {
      expect(calculateChildcareAmount(100000, 3)).toBe(300000);
    });
  });

  describe('calculateChildcareDeductibleAmount', () => {
    it('250万円上限適用', () => {
      expect(calculateChildcareDeductibleAmount(3000000, 0)).toBe(2500000);
    });

    it('50万円以下で控除対象外', () => {
      expect(calculateChildcareDeductibleAmount(500000, 0)).toBe(0);
    });
  });
});

// =============================================
// その他増改築 work-types
// =============================================
describe('other-renovation-work-types', () => {
  describe('calculateOtherRenovationAmount', () => {
    it('金額をそのまま返す', () => {
      expect(calculateOtherRenovationAmount(1000000)).toBe(1000000);
    });

    it('居住割合を適用', () => {
      expect(calculateOtherRenovationAmount(1000000, 80)).toBe(800000);
    });
  });

  describe('calculateOtherRenovationDeductibleAmount', () => {
    it('上限なし', () => {
      expect(calculateOtherRenovationDeductibleAmount(20000000, 0)).toBe(20000000);
    });

    it('補助金差引', () => {
      expect(calculateOtherRenovationDeductibleAmount(1000000, 300000)).toBe(700000);
    });

    it('補助金超過で0', () => {
      expect(calculateOtherRenovationDeductibleAmount(500000, 600000)).toBe(0);
    });
  });
});

// =============================================
// 長期優良住宅化改修 work-types
// =============================================
describe('long-term-housing-work-types', () => {
  describe('calculateLongTermHousingAmount', () => {
    it('単価 x 数量', () => {
      expect(calculateLongTermHousingAmount(10000, 50)).toBe(500000);
    });

    it('居住割合を適用', () => {
      expect(calculateLongTermHousingAmount(10000, 100, 80)).toBe(800000);
    });
  });

  describe('calculateLongTermHousingDeductibleAmount', () => {
    it('通常型: 250万円上限', () => {
      expect(calculateLongTermHousingDeductibleAmount(4000000, 0, false)).toBe(2500000);
    });

    it('優良住宅型: 500万円上限', () => {
      expect(calculateLongTermHousingDeductibleAmount(6000000, 0, true)).toBe(5000000);
    });

    it('50万円以下で控除対象外', () => {
      expect(calculateLongTermHousingDeductibleAmount(500000, 0, false)).toBe(0);
    });
  });
});

// =============================================
// certificateCostCalculator
// =============================================
describe('certificateCostCalculator', () => {
  describe('calculateCertificateCost', () => {
    it('空のデータで計算', () => {
      const result = calculateCertificateCost({});
      expect(result.totalWorkCost).toBe(0);
      expect(result.deductibleAmount).toBe(0);
    });

    it('耐震改修工事のみ', () => {
      const result = calculateCertificateCost({
        seismic: [{ calculatedAmount: 1500000 }],
      });
      expect(result.seismicTotal).toBe(1500000);
      expect(result.totalWorkCost).toBe(1500000);
    });

    it('複数工事種別の合算', () => {
      const result = calculateCertificateCost({
        seismic: [{ calculatedAmount: 1000000 }],
        barrierFree: [{ calculatedAmount: 800000 }],
      });
      expect(result.totalWorkCost).toBe(1800000);
    });

    it('補助金差引', () => {
      const result = calculateCertificateCost(
        { seismic: [{ calculatedAmount: 2000000 }] },
        500000
      );
      expect(result.totalWorkCost).toBe(2000000);
      expect(result.subsidyAmount).toBe(500000);
      expect(result.deductibleAmount).toBe(1500000);
    });

    it('住宅借入金等特別控除の要件チェック', () => {
      const eligible = calculateCertificateCost({
        seismic: [{ calculatedAmount: 1500000 }],
      });
      expect(eligible.meetsHousingLoanRequirement).toBe(true);

      const notEligible = calculateCertificateCost({
        seismic: [{ calculatedAmount: 500000 }],
      });
      expect(notEligible.meetsHousingLoanRequirement).toBe(false);
    });
  });

  describe('validateHousingLoanEligibility', () => {
    it('100万円以上で適格', () => {
      const result = calculateCertificateCost({
        seismic: [{ calculatedAmount: 1500000 }],
      });
      expect(validateHousingLoanEligibility(result)).toBeNull();
    });

    it('100万円未満で不適格', () => {
      const result = calculateCertificateCost({
        seismic: [{ calculatedAmount: 500000 }],
      });
      const error = validateHousingLoanEligibility(result);
      expect(error).toBeTruthy();
      expect(error).toContain('100');
    });
  });

  describe('formatAmountInManYen', () => {
    it('万円表記に変換', () => {
      expect(formatAmountInManYen(2500000)).toContain('250');
    });
  });

  describe('formatAmountInYen', () => {
    it('カンマ区切りで表示', () => {
      const formatted = formatAmountInYen(2500000);
      expect(formatted).toContain('2,500,000');
    });
  });
});
