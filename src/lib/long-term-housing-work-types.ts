// 長期優良住宅化改修工事の標準単価マスターデータ

export type LongTermHousingWorkType = {
  code: string;
  name: string;
  unitPrice: number;
  unit: string;
  category: string;
  description: string;
};

export const LONG_TERM_HOUSING_WORK_TYPES: LongTermHousingWorkType[] = [
  // 劣化対策（防腐・防蟻）
  {
    code: 'lth_antiseptic_treatment',
    name: '防腐・防蟻処理',
    unitPrice: 3850,
    unit: '㎡',
    category: '劣化対策',
    description: '土台・床組等の木部の防腐・防蟻処理',
  },
  {
    code: 'lth_foundation_ventilation',
    name: '床下換気設備',
    unitPrice: 38500,
    unit: '箇所',
    category: '劣化対策',
    description: '床下の換気設備の設置',
  },
  {
    code: 'lth_underfloor_moisture_proof',
    name: '床下防湿',
    unitPrice: 3300,
    unit: '㎡',
    category: '劣化対策',
    description: '床下の防湿措置',
  },

  // 劣化対策（防水）
  {
    code: 'lth_roof_waterproof',
    name: '屋根防水',
    unitPrice: 11000,
    unit: '㎡',
    category: '劣化対策',
    description: '屋根の防水工事',
  },
  {
    code: 'lth_external_wall_waterproof',
    name: '外壁防水',
    unitPrice: 5500,
    unit: '㎡',
    category: '劣化対策',
    description: '外壁の防水工事',
  },
  {
    code: 'lth_balcony_waterproof',
    name: 'バルコニー防水',
    unitPrice: 8800,
    unit: '㎡',
    category: '劣化対策',
    description: 'バルコニーの防水工事',
  },

  // 耐震性
  {
    code: 'lth_seismic_wall',
    name: '耐力壁の設置',
    unitPrice: 154000,
    unit: '箇所',
    category: '耐震性',
    description: '耐力壁の新設',
  },
  {
    code: 'lth_column_beam_reinforcement',
    name: '柱・梁の補強',
    unitPrice: 110000,
    unit: '箇所',
    category: '耐震性',
    description: '柱・梁の接合部補強',
  },
  {
    code: 'lth_foundation_reinforcement',
    name: '基礎の補強',
    unitPrice: 66000,
    unit: 'm',
    category: '耐震性',
    description: '基礎の補強工事',
  },

  // 維持管理・更新の容易性（給排水管）
  {
    code: 'lth_water_pipe_renewal',
    name: '給水管の更新',
    unitPrice: 16500,
    unit: 'm',
    category: '維持管理',
    description: '給水管の更新工事',
  },
  {
    code: 'lth_drainage_pipe_renewal',
    name: '排水管の更新',
    unitPrice: 22000,
    unit: 'm',
    category: '維持管理',
    description: '排水管の更新工事',
  },
  {
    code: 'lth_inspection_opening',
    name: '点検口の設置',
    unitPrice: 33000,
    unit: '箇所',
    category: '維持管理',
    description: '配管点検のための点検口設置',
  },

  // 省エネルギー性（断熱）
  {
    code: 'lth_roof_insulation',
    name: '屋根断熱',
    unitPrice: 5500,
    unit: '㎡',
    category: '省エネルギー性',
    description: '屋根の断熱工事',
  },
  {
    code: 'lth_wall_insulation',
    name: '外壁断熱',
    unitPrice: 8800,
    unit: '㎡',
    category: '省エネルギー性',
    description: '外壁の断熱工事',
  },
  {
    code: 'lth_floor_insulation',
    name: '床断熱',
    unitPrice: 4400,
    unit: '㎡',
    category: '省エネルギー性',
    description: '床の断熱工事',
  },
  {
    code: 'lth_insulated_window',
    name: '断熱サッシ',
    unitPrice: 66000,
    unit: '㎡',
    category: '省エネルギー性',
    description: '断熱性能の高いサッシへの交換',
  },

  // 省エネルギー性（設備）
  {
    code: 'lth_efficient_water_heater',
    name: '高効率給湯器',
    unitPrice: 220000,
    unit: '台',
    category: '省エネルギー性',
    description: '高効率給湯器の設置',
  },
  {
    code: 'lth_led_lighting',
    name: 'LED照明',
    unitPrice: 5500,
    unit: '箇所',
    category: '省エネルギー性',
    description: 'LED照明への交換',
  },
  {
    code: 'lth_solar_panel',
    name: '太陽光発電設備',
    unitPrice: 275000,
    unit: 'kW',
    category: '省エネルギー性',
    description: '太陽光発電設備の設置',
  },

  // 維持管理（外装）
  {
    code: 'lth_external_wall_material',
    name: '外壁材の張替え',
    unitPrice: 16500,
    unit: '㎡',
    category: '維持管理',
    description: '耐久性の高い外壁材への張替え',
  },
  {
    code: 'lth_roofing_material',
    name: '屋根材の張替え',
    unitPrice: 11000,
    unit: '㎡',
    category: '維持管理',
    description: '耐久性の高い屋根材への張替え',
  },

  // 可変性
  {
    code: 'lth_movable_partition',
    name: '可動間仕切り',
    unitPrice: 44000,
    unit: '㎡',
    category: '可変性',
    description: '間取り変更を容易にする可動間仕切りの設置',
  },
  {
    code: 'lth_universal_space',
    name: '多目的スペース',
    unitPrice: 220000,
    unit: '㎡',
    category: '可変性',
    description: '用途変更可能な多目的スペースの確保',
  },

  // バリアフリー性
  {
    code: 'lth_step_free',
    name: '段差解消',
    unitPrice: 88000,
    unit: '箇所',
    category: 'バリアフリー性',
    description: '室内の段差解消工事',
  },
  {
    code: 'lth_corridor_width',
    name: '廊下幅の拡張',
    unitPrice: 165000,
    unit: 'm',
    category: 'バリアフリー性',
    description: '廊下幅を78cm以上に拡張',
  },
  {
    code: 'lth_handrail',
    name: '手すりの設置',
    unitPrice: 22000,
    unit: 'm',
    category: 'バリアフリー性',
    description: '手すりの設置',
  },
  {
    code: 'lth_accessible_toilet',
    name: 'バリアフリートイレ',
    unitPrice: 440000,
    unit: '箇所',
    category: 'バリアフリー性',
    description: 'バリアフリー対応トイレへの改修',
  },
  {
    code: 'lth_accessible_bathroom',
    name: 'バリアフリー浴室',
    unitPrice: 880000,
    unit: '箇所',
    category: 'バリアフリー性',
    description: 'バリアフリー対応浴室への改修',
  },

  // 居住環境
  {
    code: 'lth_ventilation_system',
    name: '換気システム',
    unitPrice: 330000,
    unit: '式',
    category: '居住環境',
    description: '24時間換気システムの設置',
  },
  {
    code: 'lth_soundproof_window',
    name: '防音サッシ',
    unitPrice: 88000,
    unit: '㎡',
    category: '居住環境',
    description: '防音性能の高いサッシへの交換',
  },
  {
    code: 'lth_security_equipment',
    name: '防犯設備',
    unitPrice: 110000,
    unit: '式',
    category: '居住環境',
    description: '防犯カメラ・センサー等の設置',
  },

  // 構造補強
  {
    code: 'lth_steel_reinforcement',
    name: '鉄骨補強',
    unitPrice: 165000,
    unit: '箇所',
    category: '構造補強',
    description: '鉄骨による構造補強',
  },
  {
    code: 'lth_carbon_fiber_reinforcement',
    name: 'カーボン繊維補強',
    unitPrice: 88000,
    unit: '㎡',
    category: '構造補強',
    description: 'カーボン繊維による補強',
  },

  // 設備更新
  {
    code: 'lth_electric_panel_renewal',
    name: '電気配線盤の更新',
    unitPrice: 165000,
    unit: '箇所',
    category: '設備更新',
    description: '電気配線盤の更新',
  },
  {
    code: 'lth_gas_equipment_renewal',
    name: 'ガス設備の更新',
    unitPrice: 110000,
    unit: '箇所',
    category: '設備更新',
    description: 'ガス設備の更新',
  },

  // その他
  {
    code: 'lth_fire_alarm',
    name: '火災警報器',
    unitPrice: 16500,
    unit: '箇所',
    category: 'その他',
    description: '火災警報器の設置',
  },
  {
    code: 'lth_storage_space',
    name: '収納スペース',
    unitPrice: 110000,
    unit: '㎡',
    category: 'その他',
    description: '収納スペースの確保',
  },
  {
    code: 'lth_rainwater_drainage',
    name: '雨水排水設備',
    unitPrice: 55000,
    unit: '箇所',
    category: 'その他',
    description: '雨水排水設備の設置',
  },
  {
    code: 'lth_termite_barrier',
    name: 'シロアリバリア',
    unitPrice: 5500,
    unit: '㎡',
    category: 'その他',
    description: 'シロアリ被害防止措置',
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
