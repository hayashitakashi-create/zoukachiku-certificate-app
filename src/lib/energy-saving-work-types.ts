// 省エネ改修工事の標準単価マスターデータ

export type EnergySavingWorkType = {
  code: string;
  name: string;
  unitPrice: number;
  unit: string;
  category: string;
  regionCode?: string; // 地域区分（1-8地域、該当する場合のみ）
  needsWindowRatio?: boolean; // 窓面積割合が必要か
  description: string;
};

export const ENERGY_SAVING_WORK_TYPES: EnergySavingWorkType[] = [
  // 窓の断熱性を高める工事
  {
    code: 'es_glass_all_regions',
    name: 'ガラスの交換（1から8地域まで）',
    unitPrice: 6300,
    unit: '㎡',
    category: '窓',
    needsWindowRatio: true,
    description: '家屋の床面積の合計 × 窓面積割合',
  },
  {
    code: 'es_inner_window_123',
    name: '内窓の新設又は交換（1，2及び3地域）',
    unitPrice: 11300,
    unit: '㎡',
    category: '窓',
    regionCode: '1-3',
    needsWindowRatio: true,
    description: '家屋の床面積の合計 × 窓面積割合',
  },
  {
    code: 'es_inner_window_467',
    name: '内窓の新設（4，5，6及び7地域）',
    unitPrice: 8100,
    unit: '㎡',
    category: '窓',
    regionCode: '4-7',
    needsWindowRatio: true,
    description: '家屋の床面積の合計 × 窓面積割合',
  },
  {
    code: 'es_sash_glass_1234',
    name: 'サッシ及びガラスの交換（1，2，3及び4地域）',
    unitPrice: 19000,
    unit: '㎡',
    category: '窓',
    regionCode: '1-4',
    needsWindowRatio: true,
    description: '家屋の床面積の合計 × 窓面積割合',
  },
  {
    code: 'es_sash_glass_567',
    name: 'サッシ及びガラスの交換（5，6及び7地域）',
    unitPrice: 15000,
    unit: '㎡',
    category: '窓',
    regionCode: '5-7',
    needsWindowRatio: true,
    description: '家屋の床面積の合計 × 窓面積割合',
  },

  // 断熱工事
  {
    code: 'es_ceiling_insulation',
    name: '天井等の断熱性を高める工事（1から8地域まで）',
    unitPrice: 2700,
    unit: '㎡',
    category: '断熱',
    description: '当該工事に係る部分の床面積の合計',
  },
  {
    code: 'es_wall_insulation',
    name: '壁の断熱性を高める工事（1から8地域まで）',
    unitPrice: 19400,
    unit: '㎡',
    category: '断熱',
    description: '当該工事に係る部分の床面積の合計',
  },
  {
    code: 'es_floor_insulation_123',
    name: '床等の断熱性を高める工事（1，2及び3地域）',
    unitPrice: 5800,
    unit: '㎡',
    category: '断熱',
    regionCode: '1-3',
    description: '当該工事に係る部分の床面積の合計',
  },
  {
    code: 'es_floor_insulation_4567',
    name: '床等の断熱性を高める工事（4，5，6及び7地域）',
    unitPrice: 4600,
    unit: '㎡',
    category: '断熱',
    regionCode: '4-7',
    description: '当該工事に係る部分の床面積の合計',
  },

  // 設備機器
  {
    code: 'es_solar_heat_cooling',
    name: '太陽熱利用冷温熱装置（冷暖房等及び給湯の用）',
    unitPrice: 151600,
    unit: '㎡',
    category: '設備',
    description: '集熱器面積',
  },
  {
    code: 'es_solar_heat_water',
    name: '太陽熱利用冷温熱装置（給湯の用）',
    unitPrice: 365400,
    unit: '台',
    category: '設備',
    description: '台数',
  },
  {
    code: 'es_latent_heat_recovery',
    name: '潜熱回収型給湯器',
    unitPrice: 49700,
    unit: '台',
    category: '設備',
    description: '台数',
  },
  {
    code: 'es_heat_pump_water_heater',
    name: 'ヒートポンプ式電気給湯器',
    unitPrice: 412200,
    unit: '台',
    category: '設備',
    description: '台数',
  },
  {
    code: 'es_fuel_cell',
    name: '燃料電池コージェネレーションシステム',
    unitPrice: 789800,
    unit: '台',
    category: '設備',
    description: '台数',
  },
  {
    code: 'es_air_conditioner',
    name: 'エアコンディショナー',
    unitPrice: 134400,
    unit: '台',
    category: '設備',
    description: '台数',
  },

  // 太陽光発電
  {
    code: 'es_solar_power',
    name: '太陽光発電設備の設置工事',
    unitPrice: 425500,
    unit: 'kW',
    category: '太陽光発電',
    description: '太陽電池モジュールの出力数',
  },
  {
    code: 'es_solar_safety',
    name: '特殊工事：安全対策工事',
    unitPrice: 37600,
    unit: 'kW',
    category: '太陽光発電',
    description: '太陽電池モジュールの出力数',
  },
  {
    code: 'es_solar_waterproof',
    name: '特殊工事：陸屋根防水基礎工事',
    unitPrice: 55500,
    unit: 'kW',
    category: '太陽光発電',
    description: '太陽電池モジュールの出力数',
  },
  {
    code: 'es_solar_snow',
    name: '特殊工事：積雪対策工事',
    unitPrice: 27800,
    unit: 'kW',
    category: '太陽光発電',
    description: '太陽電池モジュールの出力数',
  },
  {
    code: 'es_solar_salt',
    name: '特殊工事：塩害対策工事',
    unitPrice: 9000,
    unit: 'kW',
    category: '太陽光発電',
    description: '太陽電池モジュールの出力数',
  },
  {
    code: 'es_solar_power_line',
    name: '特殊工事：幹線増強工事',
    unitPrice: 106800,
    unit: '件',
    category: '太陽光発電',
    description: '件数',
  },
];

/**
 * 省エネ改修工事の金額を計算
 * @param unitPrice 標準単価
 * @param quantity 数量
 * @param windowRatio 窓面積割合（0-100、窓工事の場合のみ）
 * @param residentRatio 居住用割合（0-100、必要な場合のみ）
 * @returns 計算金額
 */
export function calculateEnergySavingAmount(
  unitPrice: number,
  quantity: number,
  windowRatio?: number,
  residentRatio?: number
): number {
  let amount = unitPrice * quantity;

  // 窓面積割合を適用
  if (windowRatio !== undefined && windowRatio !== null && windowRatio > 0) {
    amount = amount * (windowRatio / 100);
  }

  // 居住用割合を適用
  if (residentRatio !== undefined && residentRatio !== null && residentRatio > 0) {
    amount = amount * (residentRatio / 100);
  }

  return Math.round(amount);
}

/**
 * 省エネ改修工事の合計金額を計算
 */
export function calculateEnergySavingTotal(
  works: Array<{
    unitPrice: number;
    quantity: number;
    windowRatio?: number;
    residentRatio?: number;
  }>
): number {
  return works.reduce((sum, work) => {
    return sum + calculateEnergySavingAmount(
      work.unitPrice,
      work.quantity,
      work.windowRatio,
      work.residentRatio
    );
  }, 0);
}

/**
 * 控除対象額を計算（合計金額 - 補助金、最大250万円 or 350万円）
 * @param totalAmount 合計金額
 * @param subsidyAmount 補助金額
 * @param hasSolarPower 太陽光発電を併設しているか
 * @returns 控除対象額
 */
export function calculateEnergySavingDeductibleAmount(
  totalAmount: number,
  subsidyAmount: number = 0,
  hasSolarPower: boolean = false
): number {
  const afterSubsidy = totalAmount - subsidyAmount;

  // 太陽光発電併設の場合は350万円、それ以外は250万円
  const ENERGY_LIMIT = hasSolarPower ? 3500000 : 2500000;

  // 50万円超の場合のみ控除対象
  if (afterSubsidy <= 500000) {
    return 0;
  }

  // 上限適用
  return Math.min(afterSubsidy, ENERGY_LIMIT);
}

/**
 * カテゴリ別に工事種別を取得
 */
export function getEnergySavingWorkTypesByCategory(): Map<string, EnergySavingWorkType[]> {
  const categoryMap = new Map<string, EnergySavingWorkType[]>();

  ENERGY_SAVING_WORK_TYPES.forEach((workType) => {
    const existing = categoryMap.get(workType.category) || [];
    existing.push(workType);
    categoryMap.set(workType.category, existing);
  });

  return categoryMap;
}

/**
 * 太陽光発電工事が含まれているかチェック
 */
export function hasSolarPowerWork(workCodes: string[]): boolean {
  return workCodes.some(code =>
    code === 'es_solar_power' ||
    code.startsWith('es_solar_')
  );
}
