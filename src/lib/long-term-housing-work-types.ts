// 耐久性向上改修工事（長期優良住宅化リフォーム）の標準単価マスターデータ
// 公式Excelに基づく29項目・11カテゴリ

export type LongTermHousingWorkType = {
  code: string;
  name: string;
  unitPrice: number;
  unit: string;
  category: string;
  description: string;
};

export const LONG_TERM_HOUSING_WORK_TYPES: LongTermHousingWorkType[] = [
  // ─── 小屋裏の換気工事 ───
  {
    code: 'lth_attic_wall_vent',
    name: '小屋裏壁の換気口取付工事',
    unitPrice: 20900,
    unit: '箇所',
    category: '小屋裏の換気工事',
    description: '小屋裏壁に換気口を取り付ける工事',
  },
  {
    code: 'lth_eave_vent',
    name: '軒裏換気口取付工事（有孔ボード以外）',
    unitPrice: 7800,
    unit: '箇所',
    category: '小屋裏の換気工事',
    description: '軒裏に換気口を取り付ける工事（有孔ボード以外）',
  },
  {
    code: 'lth_eave_perforated_board',
    name: '軒裏有孔ボード取付工事',
    unitPrice: 5900,
    unit: '㎡',
    category: '小屋裏の換気工事',
    description: '軒裏に有孔ボードを取り付ける工事',
  },
  {
    code: 'lth_attic_ridge_vent',
    name: '小屋裏頂部排気口取付工事',
    unitPrice: 47400,
    unit: '箇所',
    category: '小屋裏の換気工事',
    description: '小屋裏頂部に排気口を取り付ける工事',
  },

  // ─── 小屋裏点検口の取付工事 ───
  {
    code: 'lth_attic_inspection_hatch',
    name: '小屋裏点検口の取付工事',
    unitPrice: 18300,
    unit: '箇所',
    category: '小屋裏点検口の取付工事',
    description: '小屋裏の点検口を取り付ける工事',
  },

  // ─── 外壁の通気構造等工事 ───
  {
    code: 'lth_exterior_wall_ventilation',
    name: '外壁通気構造等工事',
    unitPrice: 14200,
    unit: '㎡',
    category: '外壁の通気構造等工事',
    description: '外壁の通気構造等に関する工事',
  },

  // ─── 浴室又は脱衣室の防水工事 ───
  {
    code: 'lth_bathroom_unit_bath',
    name: '浴室のユニットバス化',
    unitPrice: 896900,
    unit: '箇所',
    category: '浴室又は脱衣室の防水工事',
    description: '浴室をユニットバスに改修する工事',
  },
  {
    code: 'lth_dressing_wall_waterproof_other',
    name: '脱衣室の壁の防水措置（ビニルクロス以外）',
    unitPrice: 12800,
    unit: '㎡',
    category: '浴室又は脱衣室の防水工事',
    description: '脱衣室の壁にビニルクロス以外の防水措置を施す工事',
  },
  {
    code: 'lth_dressing_wall_waterproof_vinyl',
    name: '脱衣室の壁の防水措置（ビニルクロス）',
    unitPrice: 5400,
    unit: '㎡',
    category: '浴室又は脱衣室の防水工事',
    description: '脱衣室の壁にビニルクロスによる防水措置を施す工事',
  },
  {
    code: 'lth_dressing_floor_waterproof_other',
    name: '脱衣室の床の防水措置（耐水フローリング以外）',
    unitPrice: 6600,
    unit: '㎡',
    category: '浴室又は脱衣室の防水工事',
    description: '脱衣室の床に耐水フローリング以外の防水措置を施す工事',
  },
  {
    code: 'lth_dressing_floor_waterproof_flooring',
    name: '脱衣室の床の防水措置（耐水フローリング）',
    unitPrice: 12000,
    unit: '㎡',
    category: '浴室又は脱衣室の防水工事',
    description: '脱衣室の床に耐水フローリングによる防水措置を施す工事',
  },

  // ─── 土台の防腐・防蟻工事 ───
  {
    code: 'lth_sill_preservative_termite',
    name: '土台の防腐・防蟻処理',
    unitPrice: 2100,
    unit: '㎡',
    category: '土台の防腐・防蟻工事',
    description: '土台に防腐・防蟻処理を施す工事',
  },
  {
    code: 'lth_sill_water_cut',
    name: '土台の水切り取付工事',
    unitPrice: 2400,
    unit: 'm',
    category: '土台の防腐・防蟻工事',
    description: '土台に水切りを取り付ける工事',
  },

  // ─── 外壁の軸組等の防腐・防蟻工事 ───
  {
    code: 'lth_wall_frame_preservative_termite',
    name: '外壁の軸組等の防腐・防蟻処理',
    unitPrice: 2100,
    unit: '㎡',
    category: '外壁の軸組等の防腐・防蟻工事',
    description: '外壁の軸組等に防腐・防蟻処理を施す工事',
  },

  // ─── 床下の防湿工事 ───
  {
    code: 'lth_underfloor_concrete',
    name: '床下のコンクリート打設',
    unitPrice: 12700,
    unit: '㎡',
    category: '床下の防湿工事',
    description: '床下にコンクリートを打設する防湿工事',
  },
  {
    code: 'lth_underfloor_moisture_film',
    name: '床下の防湿フィルム敷設',
    unitPrice: 1300,
    unit: '㎡',
    category: '床下の防湿工事',
    description: '床下に防湿フィルムを敷設する工事',
  },

  // ─── 床下点検口の取付工事 ───
  {
    code: 'lth_underfloor_inspection_hatch',
    name: '床下点検口の取付工事',
    unitPrice: 27800,
    unit: '箇所',
    category: '床下点検口の取付工事',
    description: '床下の点検口を取り付ける工事',
  },

  // ─── 雨どいの取付工事 ───
  {
    code: 'lth_rain_gutter',
    name: '雨どいの取付工事',
    unitPrice: 3900,
    unit: '㎡(屋根の水平投影面積)',
    category: '雨どいの取付工事',
    description: '雨どいを取り付ける工事（屋根の水平投影面積あたり）',
  },

  // ─── 地盤の防蟻工事 ───
  {
    code: 'lth_soil_termite_treatment',
    name: '土壌への防蟻処理',
    unitPrice: 3100,
    unit: '㎡',
    category: '地盤の防蟻工事',
    description: '土壌に防蟻処理を施す工事',
  },
  {
    code: 'lth_ground_concrete',
    name: '地盤のコンクリート打設',
    unitPrice: 12700,
    unit: '㎡',
    category: '地盤の防蟻工事',
    description: '地盤にコンクリートを打設する防蟻工事',
  },

  // ─── 給水管・給湯管又は排水管の維持管理又は更新の容易化工事 ───
  {
    code: 'lth_private_water_pipe_replacement',
    name: '専用給水湯管の取替工事',
    unitPrice: 9500,
    unit: 'm',
    category: '給水管・給湯管又は排水管の維持管理又は更新の容易化工事',
    description: '専用の給水管・給湯管を取り替える工事',
  },
  {
    code: 'lth_common_water_pipe_replacement',
    name: '共用給水管の取替工事',
    unitPrice: 22600,
    unit: 'm',
    category: '給水管・給湯管又は排水管の維持管理又は更新の容易化工事',
    description: '共用の給水管を取り替える工事',
  },
  {
    code: 'lth_detached_drain_pipe_replacement',
    name: '戸建住宅排水管の取替工事',
    unitPrice: 9800,
    unit: 'm',
    category: '給水管・給湯管又は排水管の維持管理又は更新の容易化工事',
    description: '戸建住宅の排水管を取り替える工事',
  },
  {
    code: 'lth_common_drain_pipe_replacement',
    name: '共用排水管の取替工事（共用部）',
    unitPrice: 16800,
    unit: 'm',
    category: '給水管・給湯管又は排水管の維持管理又は更新の容易化工事',
    description: '共用部の排水管を取り替える工事',
  },
  {
    code: 'lth_private_drain_pipe_no_other',
    name: '専用排水管の取替工事（他の住戸に配管がないもの）',
    unitPrice: 15600,
    unit: 'm',
    category: '給水管・給湯管又は排水管の維持管理又は更新の容易化工事',
    description: '他の住戸に配管がない専用排水管を取り替える工事',
  },
  {
    code: 'lth_private_drain_pipe_with_other',
    name: '専用排水管の取替工事（他の住戸に配管があるもの）',
    unitPrice: 176000,
    unit: 'm',
    category: '給水管・給湯管又は排水管の維持管理又は更新の容易化工事',
    description: '他の住戸に配管がある専用排水管を取り替える工事',
  },
  {
    code: 'lth_maintenance_opening_floor',
    name: '維持管理のための点検開口（専用部の床）',
    unitPrice: 25000,
    unit: '箇所',
    category: '給水管・給湯管又は排水管の維持管理又は更新の容易化工事',
    description: '専用部の床に維持管理のための点検開口を設ける工事',
  },
  {
    code: 'lth_maintenance_opening_wall_ceiling',
    name: '維持管理のための点検開口（専用部の壁又は天井）',
    unitPrice: 17700,
    unit: '箇所',
    category: '給水管・給湯管又は排水管の維持管理又は更新の容易化工事',
    description: '専用部の壁又は天井に維持管理のための点検開口を設ける工事',
  },
  {
    code: 'lth_maintenance_opening_common',
    name: '維持管理のための点検開口（共用部）',
    unitPrice: 132300,
    unit: '箇所',
    category: '給水管・給湯管又は排水管の維持管理又は更新の容易化工事',
    description: '共用部に維持管理のための点検開口を設ける工事',
  },
];

/**
 * 長期優良住宅化改修工事の金額を計算
 * @param unitPrice 標準単価
 * @param quantity 数量
 * @param residentRatio 居住用割合（0-100、必要な場合のみ）
 * @returns 計算金額
 */
export function calculateLongTermHousingAmount(
  unitPrice: number,
  quantity: number,
  residentRatio?: number
): number {
  let amount = unitPrice * quantity;

  // 居住用割合を適用
  if (residentRatio !== undefined && residentRatio !== null && residentRatio > 0) {
    amount = amount * (residentRatio / 100);
  }

  return Math.round(amount);
}

/**
 * 長期優良住宅化改修工事の合計金額を計算
 */
export function calculateLongTermHousingTotal(
  works: Array<{
    unitPrice: number;
    quantity: number;
    residentRatio?: number;
  }>
): number {
  return works.reduce((sum, work) => {
    return sum + calculateLongTermHousingAmount(
      work.unitPrice,
      work.quantity,
      work.residentRatio
    );
  }, 0);
}

/**
 * 控除対象額を計算（合計金額 - 補助金、最大250万円 or 500万円）
 * @param totalAmount 合計金額
 * @param subsidyAmount 補助金額
 * @param isExcellentHousing 長期優良住宅認定を取得しているか
 * @returns 控除対象額
 */
export function calculateLongTermHousingDeductibleAmount(
  totalAmount: number,
  subsidyAmount: number = 0,
  isExcellentHousing: boolean = false
): number {
  const afterSubsidy = totalAmount - subsidyAmount;

  // 長期優良住宅認定の場合は500万円、それ以外は250万円
  const LONG_TERM_LIMIT = isExcellentHousing ? 5000000 : 2500000;

  // 50万円超の場合のみ控除対象
  if (afterSubsidy <= 500000) {
    return 0;
  }

  // 上限適用
  return Math.min(afterSubsidy, LONG_TERM_LIMIT);
}

/**
 * カテゴリ別に工事種別を取得
 */
export function getLongTermHousingWorkTypesByCategory(): Map<string, LongTermHousingWorkType[]> {
  const categoryMap = new Map<string, LongTermHousingWorkType[]>();

  LONG_TERM_HOUSING_WORK_TYPES.forEach((workType) => {
    const existing = categoryMap.get(workType.category) || [];
    existing.push(workType);
    categoryMap.set(workType.category, existing);
  });

  return categoryMap;
}
