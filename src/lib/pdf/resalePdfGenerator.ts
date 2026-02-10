/**
 * 買取再販住宅の取得に係る住宅借入金等特別税額控除用PDF生成器
 *
 * 償還期間が10年以上の住宅借入金等を利用して特定の増改築等がされた
 * 住宅用家屋を取得した場合（Ⅰ-4）
 *
 * テンプレート使用ページ:
 *   ページ1  : 基本情報 + 工事種別（第1号～第6号）チェックボックス
 *   ページ3  : 費用概要（①工事費総額 ②補助金 ③控除対象額）+ 工事内容説明
 *   ページ22 : 証明者情報
 *
 * housing_loan と同じテンプレートページ（1, 3, 22）を使用
 */

import { rgb } from 'pdf-lib';
import {
  loadTemplateWithFont,
  fillBasicInfo,
  fillIssuerInfo,
  drawCheckmark,
  drawAmount,
  drawMultilineText,
  savePdfToBytes,
  type CertificateBaseData,
} from './pdfTemplateUtils';

/**
 * 買取再販住宅用の追加データ
 */
export interface ResaleData extends CertificateBaseData {
  /** 工事費総額 */
  totalWorkCost: number;
  /** 補助金の有無 */
  hasSubsidy: boolean;
  /** 補助金額 */
  subsidyAmount: number;
  /** 控除対象額（工事費 - 補助金） */
  deductibleAmount: number;
  /** 工事の説明 */
  workDescription?: string;
  /** 住宅ローン詳細（工事種別チェックボックス + 費用） */
  housingLoanDetail?: {
    workTypes: any;
    workDescription: string | null;
    totalCost: number;
    hasSubsidy: boolean;
    subsidyAmount: number;
    deductibleAmount: number;
  } | null;
}

/**
 * ページ1: 工事種別チェックボックスの座標（housing_loanと同一）
 */
const PAGE1_COORDS = {
  work1: {
    extension:       { x: 142, y: 592 },
    renovation:      { x: 205, y: 592 },
    majorRepair:     { x: 279, y: 592 },
    majorRemodeling: { x: 370, y: 592 },
  },
  work2: {
    floorOverHalf:     { x: 142, y: 530 },
    stairOverHalf:     { x: 301, y: 530 },
    partitionOverHalf: { x: 142, y: 517 },
    wallOverHalf:      { x: 324, y: 517 },
  },
  work3: {
    livingRoom: { x: 142, y: 484 },
    kitchen:    { x: 194, y: 484 },
    bathroom:   { x: 267, y: 484 },
    toilet:     { x: 324, y: 484 },
    washroom:   { x: 382, y: 484 },
    storage:    { x: 450, y: 484 },
    entrance:   { x: 142, y: 472 },
    corridor:   { x: 194, y: 472 },
  },
  work4: {
    buildingStandard:  { x: 142, y: 430 },
    earthquakeSafety:  { x: 142, y: 416 },
  },
  work5: {
    pathwayExpansion:    { x: 142, y: 363 },
    stairSlope:          { x: 279, y: 363 },
    bathroomImprovement: { x: 393, y: 363 },
    toiletImprovement:   { x: 142, y: 351 },
    handrails:           { x: 279, y: 351 },
    stepElimination:     { x: 393, y: 351 },
    doorImprovement:     { x: 142, y: 339 },
    floorSlipPrevention: { x: 279, y: 339 },
  },
  work6: {
    allWindowsInsulation:      { x: 205, y: 286 },
    allRoomsWindowsInsulation: { x: 205, y: 275 },
    highInsulation:            { x: 205, y: 265 },
    ceilingInsulation:         { x: 205, y: 210 },
    wallInsulation:            { x: 370, y: 210 },
    floorInsulation:           { x: 205, y: 197 },
  },
} as const;

/**
 * ページ3: 費用概要の座標
 */
const PAGE3_COORDS = {
  totalCost:        { x: 420, y: 247 },
  subsidyYes:       { x: 427, y: 224 },
  subsidyNo:        { x: 473, y: 224 },
  subsidyAmount:    { x: 420, y: 205 },
  deductibleAmount: { x: 420, y: 185 },
  workDescription:  { x: 63,  y: 618 },
} as const;

/**
 * チェックボックスにチェックマーク描画
 */
function drawCheck(page: any, pos: { x: number; y: number }, font: any) {
  page.drawText('\u2713', {
    x: pos.x + 1,
    y: pos.y - 2,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
}

/**
 * 買取再販住宅用PDF生成
 */
export async function generateResalePDF(
  data: ResaleData
): Promise<Uint8Array> {
  try {
    const { pdfDoc, pages, font } = await loadTemplateWithFont();

    const page1  = pages[0];   // 基本情報 + 工事種別
    const page3  = pages[2];   // 費用概要
    const page22 = pages[21];  // 証明者情報

    // =======================================
    // 1ページ目：基本情報（共通）
    // =======================================
    fillBasicInfo(page1, data, font);

    // =======================================
    // 1ページ目：工事種別チェックボックス（第1号～第6号）
    // =======================================
    if (data.housingLoanDetail?.workTypes) {
      const wt = data.housingLoanDetail.workTypes;

      // 第1号工事
      if (wt.work1) {
        if (wt.work1.extension) drawCheck(page1, PAGE1_COORDS.work1.extension, font);
        if (wt.work1.renovation) drawCheck(page1, PAGE1_COORDS.work1.renovation, font);
        if (wt.work1.majorRepair) drawCheck(page1, PAGE1_COORDS.work1.majorRepair, font);
        if (wt.work1.majorRemodeling) drawCheck(page1, PAGE1_COORDS.work1.majorRemodeling, font);
      }
      // 第2号工事
      if (wt.work2) {
        if (wt.work2.floorOverHalf) drawCheck(page1, PAGE1_COORDS.work2.floorOverHalf, font);
        if (wt.work2.stairOverHalf) drawCheck(page1, PAGE1_COORDS.work2.stairOverHalf, font);
        if (wt.work2.partitionOverHalf) drawCheck(page1, PAGE1_COORDS.work2.partitionOverHalf, font);
        if (wt.work2.wallOverHalf) drawCheck(page1, PAGE1_COORDS.work2.wallOverHalf, font);
      }
      // 第3号工事
      if (wt.work3) {
        if (wt.work3.livingRoom) drawCheck(page1, PAGE1_COORDS.work3.livingRoom, font);
        if (wt.work3.kitchen) drawCheck(page1, PAGE1_COORDS.work3.kitchen, font);
        if (wt.work3.bathroom) drawCheck(page1, PAGE1_COORDS.work3.bathroom, font);
        if (wt.work3.toilet) drawCheck(page1, PAGE1_COORDS.work3.toilet, font);
        if (wt.work3.washroom) drawCheck(page1, PAGE1_COORDS.work3.washroom, font);
        if (wt.work3.storage) drawCheck(page1, PAGE1_COORDS.work3.storage, font);
        if (wt.work3.entrance) drawCheck(page1, PAGE1_COORDS.work3.entrance, font);
        if (wt.work3.corridor) drawCheck(page1, PAGE1_COORDS.work3.corridor, font);
      }
      // 第4号工事
      if (wt.work4) {
        if (wt.work4.buildingStandard) drawCheck(page1, PAGE1_COORDS.work4.buildingStandard, font);
        if (wt.work4.earthquakeSafety) drawCheck(page1, PAGE1_COORDS.work4.earthquakeSafety, font);
      }
      // 第5号工事
      if (wt.work5) {
        if (wt.work5.pathwayExpansion) drawCheck(page1, PAGE1_COORDS.work5.pathwayExpansion, font);
        if (wt.work5.stairSlope) drawCheck(page1, PAGE1_COORDS.work5.stairSlope, font);
        if (wt.work5.bathroomImprovement) drawCheck(page1, PAGE1_COORDS.work5.bathroomImprovement, font);
        if (wt.work5.toiletImprovement) drawCheck(page1, PAGE1_COORDS.work5.toiletImprovement, font);
        if (wt.work5.handrails) drawCheck(page1, PAGE1_COORDS.work5.handrails, font);
        if (wt.work5.stepElimination) drawCheck(page1, PAGE1_COORDS.work5.stepElimination, font);
        if (wt.work5.doorImprovement) drawCheck(page1, PAGE1_COORDS.work5.doorImprovement, font);
        if (wt.work5.floorSlipPrevention) drawCheck(page1, PAGE1_COORDS.work5.floorSlipPrevention, font);
      }
      // 第6号工事（省エネ）
      if (wt.work6?.energyEfficiency) {
        const ee = wt.work6.energyEfficiency;
        if (ee.allWindowsInsulation) drawCheck(page1, PAGE1_COORDS.work6.allWindowsInsulation, font);
        if (ee.allRoomsWindowsInsulation) drawCheck(page1, PAGE1_COORDS.work6.allRoomsWindowsInsulation, font);
        if (ee.highInsulation) drawCheck(page1, PAGE1_COORDS.work6.highInsulation, font);
        if (ee.ceilingInsulation) drawCheck(page1, PAGE1_COORDS.work6.ceilingInsulation, font);
        if (ee.wallInsulation) drawCheck(page1, PAGE1_COORDS.work6.wallInsulation, font);
        if (ee.floorInsulation) drawCheck(page1, PAGE1_COORDS.work6.floorInsulation, font);
      }
    }

    // =======================================
    // 3ページ目：費用概要
    // =======================================
    // ① 工事費総額
    drawAmount(page3, data.totalWorkCost, PAGE3_COORDS.totalCost, font);

    // ② 補助金等の交付の有無
    if (data.hasSubsidy) {
      drawCheckmark(page3, PAGE3_COORDS.subsidyYes, font);
      drawAmount(page3, data.subsidyAmount, PAGE3_COORDS.subsidyAmount, font);
    } else {
      drawCheckmark(page3, PAGE3_COORDS.subsidyNo, font);
    }

    // ③ 控除対象額
    drawAmount(page3, data.deductibleAmount, PAGE3_COORDS.deductibleAmount, font);

    // 工事内容の説明
    if (data.workDescription) {
      drawMultilineText(page3, data.workDescription, PAGE3_COORDS.workDescription, font, {
        size: 8,
        lineHeight: 11,
        maxCharsPerLine: 70,
        minY: PAGE3_COORDS.deductibleAmount.y + 30,
      });
    }

    // =======================================
    // 22ページ目：証明者情報（共通）
    // =======================================
    fillIssuerInfo(page22, data, font);

    return await savePdfToBytes(pdfDoc);
  } catch (error) {
    console.error('買取再販住宅PDF生成エラー:', error);
    throw new Error('買取再販住宅用PDF生成に失敗しました: ' + (error as Error).message);
  }
}
