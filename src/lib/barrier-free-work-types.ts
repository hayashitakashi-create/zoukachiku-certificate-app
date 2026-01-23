// バリアフリー改修工事の標準単価マスターデータ

export type BarrierFreeWorkType = {
  code: string;
  name: string;
  unitPrice: number; // 円
  unit: string; // 単位（㎡、箇所、m など）
  category: string; // カテゴリ（通路拡幅、階段、浴室など）
  description: string;
};

export const BARRIER_FREE_WORK_TYPES: BarrierFreeWorkType[] = [
  // ① 通路又は出入口の拡幅
  {
    code: 'bf_passage_expansion',
    name: '通路の幅を拡張するもの',
    unitPrice: 166100,
    unit: '㎡',
    category: '通路・出入口拡幅',
    description: '介助用の車いすで容易に移動するために通路の幅を拡張する工事',
  },
  {
    code: 'bf_doorway_expansion',
    name: '出入り口の幅を拡張するもの',
    unitPrice: 189200,
    unit: '箇所',
    category: '通路・出入口拡幅',
    description: '介助用の車いすで容易に移動するために出入口の幅を拡張する工事',
  },

  // ② 階段の勾配緩和
  {
    code: 'bf_stair_gradient',
    name: '階段の設置又は改良によりその勾配を緩和する工事',
    unitPrice: 585000,
    unit: '箇所',
    category: '階段',
    description: '階段の設置（既存の階段の撤去を伴うものに限る）又は改良により勾配を緩和',
  },

  // ③ 浴室改良
  {
    code: 'bf_bathroom_area_increase',
    name: '入浴又はその介助を容易に行うために浴室の床面積を増加させる工事',
    unitPrice: 471700,
    unit: '㎡',
    category: '浴室',
    description: '浴室の床面積を増加させる工事',
  },
  {
    code: 'bf_bathtub_low_height',
    name: '浴槽をまたぎの高さの低いものに取り替える工事',
    unitPrice: 529100,
    unit: '箇所',
    category: '浴室',
    description: '浴槽をまたぎの高さの低いものに取り替える',
  },
  {
    code: 'bf_bathtub_transfer_equipment',
    name: '固定式の移乗台、踏み台その他の高齢者等の浴槽の出入りを容易にする設備を設置する工事',
    unitPrice: 27700,
    unit: '箇所',
    category: '浴室',
    description: '移乗台、踏み台等の設備設置',
  },
  {
    code: 'bf_bathroom_faucet',
    name: '高齢者等の身体の洗浄を容易にする水栓器具を設置し又は同器具に取り替える工事',
    unitPrice: 56900,
    unit: '箇所',
    category: '浴室',
    description: '洗浄を容易にする水栓器具の設置・取替',
  },

  // ④ 便所改良
  {
    code: 'bf_toilet_area_increase',
    name: '排泄又はその介助を容易に行うために便所の床面積を増加させる工事',
    unitPrice: 260600,
    unit: '㎡',
    category: '便所',
    description: '便所の床面積を増加させる工事',
  },
  {
    code: 'bf_toilet_western_style',
    name: '便器を座便式のものに取り替える工事',
    unitPrice: 359700,
    unit: '箇所',
    category: '便所',
    description: '便器を座便式に取り替える',
  },
  {
    code: 'bf_toilet_seat_height',
    name: '座便式の便器の座高を高くする工事',
    unitPrice: 298900,
    unit: '箇所',
    category: '便所',
    description: '座便式便器の座高を高くする',
  },

  // ⑤ 手すり取付
  {
    code: 'bf_handrail_long',
    name: '長さが150㎝以上の手すりを取り付けるもの',
    unitPrice: 19600,
    unit: 'm',
    category: '手すり',
    description: '便所、浴室、脱衣室、居室、玄関等に150cm以上の手すりを取付',
  },
  {
    code: 'bf_handrail_short',
    name: '長さが150㎝未満の手すりを取り付けるもの',
    unitPrice: 32800,
    unit: '箇所',
    category: '手すり',
    description: '150cm未満の手すりを取付',
  },

  // ⑥ 段差解消
  {
    code: 'bf_step_entrance',
    name: '玄関等段差解消等工事',
    unitPrice: 43900,
    unit: '箇所',
    category: '段差解消',
    description: '玄関、勝手口等の段差を解消・小さくする工事',
  },
  {
    code: 'bf_step_bathroom',
    name: '浴室段差解消等工事',
    unitPrice: 96000,
    unit: '㎡',
    category: '段差解消',
    description: '浴室出入口の段差を解消・小さくする工事',
  },
  {
    code: 'bf_step_other',
    name: '玄関等段差解消等工事及び浴室段差解消等工事以外のもの',
    unitPrice: 35100,
    unit: '㎡',
    category: '段差解消',
    description: 'その他の段差解消工事',
  },

  // ⑦ 戸の改良
  {
    code: 'bf_door_sliding',
    name: '開戸を引戸、折戸等に取り替える工事',
    unitPrice: 149700,
    unit: '箇所',
    category: '戸の改良',
    description: '開戸を引戸、折戸等に取り替える',
  },
  {
    code: 'bf_door_lever',
    name: '開戸のドアノブをレバーハンドル等に取り替える工事',
    unitPrice: 13800,
    unit: '箇所',
    category: '戸の改良',
    description: 'ドアノブをレバーハンドル等に取り替える',
  },
  {
    code: 'bf_door_power',
    name: '戸に開閉のための動力装置を設置する工事',
    unitPrice: 447500,
    unit: '箇所',
    category: '戸の改良',
    description: '戸に開閉のための動力装置を設置',
  },
  {
    code: 'bf_door_hanging',
    name: '戸を吊戸方式に変更する工事',
    unitPrice: 134600,
    unit: '箇所',
    category: '戸の改良',
    description: '戸を吊戸方式に変更',
  },
  {
    code: 'bf_door_other',
    name: '戸に戸車を設置する工事その他',
    unitPrice: 26400,
    unit: '箇所',
    category: '戸の改良',
    description: '戸車設置等の工事',
  },

  // ⑧ 床材取替
  {
    code: 'bf_floor_material',
    name: '床の材料を滑りにくいものに取り替える工事',
    unitPrice: 19800,
    unit: '㎡',
    category: '床材',
    description: '便所、浴室、脱衣室、居室、玄関等の床材を滑りにくいものに取替',
  },
];

/**
 * バリアフリー改修工事の金額を計算
 * @param unitPrice 標準単価
 * @param quantity 数量
 * @param ratio 割合（0-100、居住用部分の割合）
 * @returns 計算金額
 */
export function calculateBarrierFreeAmount(
  unitPrice: number,
  quantity: number,
  ratio?: number
): number {
  if (ratio !== undefined && ratio !== null && ratio > 0) {
    // 割合が指定されている場合
    return Math.round(unitPrice * quantity * (ratio / 100));
  }
  // 通常の計算
  return Math.round(unitPrice * quantity);
}

/**
 * バリアフリー改修工事の合計金額を計算
 * @param works 工事データの配列
 * @returns 合計金額
 */
export function calculateBarrierFreeTotal(
  works: Array<{
    unitPrice: number;
    quantity: number;
    ratio?: number;
  }>
): number {
  return works.reduce((sum, work) => {
    return sum + calculateBarrierFreeAmount(work.unitPrice, work.quantity, work.ratio);
  }, 0);
}

/**
 * 控除対象額を計算（合計金額 - 補助金、最大200万円）
 * @param totalAmount 合計金額
 * @param subsidyAmount 補助金額
 * @returns 控除対象額
 */
export function calculateBarrierFreeDeductibleAmount(
  totalAmount: number,
  subsidyAmount: number = 0
): number {
  const afterSubsidy = totalAmount - subsidyAmount;
  const BARRIER_FREE_LIMIT = 2000000; // バリアフリー改修の上限：200万円

  // 50万円超の場合のみ控除対象
  if (afterSubsidy <= 500000) {
    return 0;
  }

  // 上限適用
  return Math.min(afterSubsidy, BARRIER_FREE_LIMIT);
}

/**
 * カテゴリ別に工事種別を取得
 */
export function getBarrierFreeWorkTypesByCategory(): Map<string, BarrierFreeWorkType[]> {
  const categoryMap = new Map<string, BarrierFreeWorkType[]>();

  BARRIER_FREE_WORK_TYPES.forEach((workType) => {
    const existing = categoryMap.get(workType.category) || [];
    existing.push(workType);
    categoryMap.set(workType.category, existing);
  });

  return categoryMap;
}
