/**
 * 住宅借入金等特別控除用PDF生成器（pdf-lib版）
 * 公式の増改築等工事証明書テンプレート（23ページ）を使用
 *
 * テンプレートPDF構造（23ページ）:
 *   ページ1  : 基本情報 + 工事種別（第1号～第6号） + セクションI
 *   ページ2  : 第6号工事詳細（省エネ・断熱等性能等級）
 *   ページ3  : 費用の額等（①費用額 ②補助金 ③控除対象額）+ 工事内容
 *   ページ4-6: セクションII（5年以上の住宅借入金等）
 *   ページ7-16: セクションIII（住宅耐震改修等）
 *   ページ17-19: セクションIV（固定資産税関連）
 *   ページ20-21: 固定資産税の減額
 *   ページ22 : 証明者情報（建築士事務所に属する建築士 / 指定確認検査機関）
 *   ページ23 : 証明者情報（登録住宅性能評価機関 / 住宅瑕疵担保責任保険法人）
 *
 * 座標系: pdf-lib は左下原点（x右方向, y上方向）、単位はpt（1pt ≈ 0.353mm）
 * テンプレートサイズ: A4 = 595pt x 842pt
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

interface CertificateData {
  id: string;
  applicantName: string;
  applicantAddress: string;
  propertyNumber: string | null;
  propertyAddress: string;
  completionDate: string;
  purposeType: string;
  subsidyAmount: number;
  issuerName: string | null;
  issuerOfficeName: string | null;
  issuerOrganizationType: string | null;
  issuerQualificationNumber: string | null;
  issueDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  housingLoanDetail?: {
    id: string;
    workTypes: any;
    workDescription: string | null;
    totalCost: number;
    hasSubsidy: boolean;
    subsidyAmount: number;
    deductibleAmount: number;
  } | null;
}

/**
 * テンプレートPDFの実測座標定義
 * PyMuPDF (fitz) で実測した値を pdf-lib座標系（左下原点）に変換済み
 *
 * 変換式: pdf-lib_y = 842 - pymupdf_y
 */
const COORDS = {
  // ===== ページ1（pages[0]）: 基本情報 =====
  // ページサイズ: 595.2 x 841.7 pt
  page1: {
    // 証明申請者 - 住所（ラベル baseline pdflib_y=742.8, セル入力欄 x=160~506）
    applicantAddress: { x: 163, y: 743 },
    // 証明申請者 - 氏名（ラベル baseline pdflib_y=722.9）
    applicantName: { x: 163, y: 723 },
    // 家屋番号及び所在地（ラベル baseline pdflib_y=703.0, セル入力欄 x=160~506）
    propertyAddress: { x: 163, y: 703 },
    // 工事完了年月日（ラベル baseline pdflib_y=683.0）
    completionDate: { x: 163, y: 683 },

    // チェックボックス座標（テンプレートの「□」記号の位置に合わせる）
    // □のpymupdf bbox上端 → pdflib_y = 841.7 - pymupdf_y_bottom
    // 第1号工事（□ pymupdf_y=244.1~253.5 → pdflib_y=588~598）
    work1: {
      extension:       { x: 142, y: 592 },  // □１ 増築 (pymupdf x=141.9)
      renovation:      { x: 205, y: 592 },  // □２ 改築 (pymupdf x=204.5)
      majorRepair:     { x: 279, y: 592 },  // □３ 大規模の修繕 (text x=278.7)
      majorRemodeling: { x: 370, y: 592 },  // □４ 大規模の模様替 (text x=369.9)
    },
    // 第2号工事（□ pymupdf_y=306~316 → pdflib_y=526~536）
    work2: {
      floorOverHalf:     { x: 142, y: 530 },  // □１ 床の過半 (pymupdf x=141.9,y=306.0)
      stairOverHalf:     { x: 301, y: 530 },  // □２ 階段の過半 (text x=301.5,y=306.5)
      partitionOverHalf: { x: 142, y: 517 },  // □３ 間仕切壁の過半 (pymupdf x=141.9,y=319.4)
      wallOverHalf:      { x: 324, y: 517 },  // □４ 壁の過半 (text x=324.3,y=319.8)
    },
    // 第3号工事（□ pymupdf_y=352.6~362 → pdflib_y=480~489）
    work3: {
      livingRoom: { x: 142, y: 484 },  // □１ 居室 (pymupdf □x=141.9,y=352.6)
      kitchen:    { x: 194, y: 484 },  // □２ 調理室 (pymupdf □x=194.1,y=353.1)
      bathroom:   { x: 267, y: 484 },  // □３ 浴室 (pymupdf □x=267.3,y=353.1)
      toilet:     { x: 324, y: 484 },  // □４ 便所 (pymupdf □x=324.3,y=353.1)
      washroom:   { x: 382, y: 484 },  // □５ 洗面所 (pymupdf □x=381.7,y=353.1)
      storage:    { x: 450, y: 484 },  // □６ 納戸 (pymupdf □x=450.1,y=353.1)
      entrance:   { x: 142, y: 472 },  // □７ 玄関 (pymupdf □x=141.9,y=365.1)
      corridor:   { x: 194, y: 472 },  // □８ 廊下 (pymupdf □x=194.1,y=365.1)
    },
    // 第4号工事（耐震改修）（□ pymupdf_y=406.8~416.2 → pdflib_y=426~435）
    work4: {
      buildingStandard:  { x: 142, y: 430 },  // □１ 建築基準法施行令 (pymupdf x=141.9,y=406.8)
      earthquakeSafety:  { x: 142, y: 416 },  // □２ 地震に対する安全性 (pymupdf x=141.9,y=420.4)
    },
    // 第5号工事（バリアフリー）（□ pymupdf_y=474.1~483.4 → pdflib_y=359~368）
    work5: {
      pathwayExpansion:    { x: 142, y: 363 },  // □１ 通路又は出入口の拡幅 (pymupdf x=141.9,y=474.1)
      stairSlope:          { x: 279, y: 363 },  // □２ 階段の勾配の緩和 (text x=278.7,y=474.1)
      bathroomImprovement: { x: 393, y: 363 },  // □３ 浴室の改良 (text x=393.1,y=474.1)
      toiletImprovement:   { x: 142, y: 351 },  // □４ 便所の改良 (pymupdf x=141.9,y=485.5)
      handrails:           { x: 279, y: 351 },  // □５ 手すりの取付 (text x=278.7,y=485.9)
      stepElimination:     { x: 393, y: 351 },  // □６ 床の段差の解消 (text x=393.1,y=485.9)
      doorImprovement:     { x: 142, y: 339 },  // □７ 出入口の戸の改良 (pymupdf x=141.9,y=497.9)
      floorSlipPrevention: { x: 279, y: 339 },  // □８ 床材の取替 (text x=278.7,y=497.8)
    },
    // 第6号工事（省エネ）
    work6: {
      // □ pymupdf_y=550.9~560.2 → pdflib_y=282~291
      allWindowsInsulation:      { x: 205, y: 286 },  // □１ 全ての窓の断熱性を高める工事 (pymupdf x=204.5,y=550.9)
      allRoomsWindowsInsulation: { x: 205, y: 275 },  // □２ 相当程度高める (pymupdf x=204.5,y=561.3)
      highInsulation:            { x: 205, y: 265 },  // □３ 著しく高める (pymupdf x=204.5,y=571.9)
      // □ pymupdf_y=626.1~635.5 → pdflib_y=207~216
      ceilingInsulation:         { x: 205, y: 210 },  // □４ 天井等 (pymupdf x=204.5,y=626.1)
      wallInsulation:            { x: 370, y: 210 },  // □５ 壁の断熱性 (text x=369.9,y=626.6)
      floorInsulation:           { x: 205, y: 197 },  // □６ 床等 (pymupdf x=204.5,y=639.5)
      // 地域区分（□ pymupdf_y=661.3~670.7 → pdflib_y=171~181）
      region1: { x: 267, y: 175 },  // □１地域 (text x=267.3,y=661.3)
      region2: { x: 324, y: 175 },  // □２地域 (text x=324.3,y=661.3)
      region3: { x: 382, y: 175 },  // □３地域 (text x=381.7,y=661.3)
      region4: { x: 439, y: 175 },  // □４地域 (text x=438.7,y=661.3)
      region5: { x: 267, y: 165 },  // □５地域 (text x=267.3,y=671.7)
      region6: { x: 324, y: 165 },  // □６地域 (text x=324.3,y=671.7)
      region7: { x: 382, y: 165 },  // □７地域 (text x=381.7,y=671.7)
      region8: { x: 439, y: 165 },  // □８地域 (text x=438.7,y=671.7)
      // 等級（□ pymupdf_y=709.4~718.9 → pdflib_y=123~133）
      grade1: { x: 267, y: 127 },  // □１ 等級１ (text x=267.3,y=709.4)
      grade2: { x: 336, y: 127 },  // □２ 等級２ (text x=335.7,y=709.4)
      grade3: { x: 404, y: 127 },  // □３ 等級３ (text x=404.5,y=709.4)
    },
  },

  // ===== ページ3（pages[2]）: 費用の額等 =====
  page3: {
    // ① 第１号工事～第６号工事に要した費用の額
    // ラベル pymupdf_y=590.1~599.5 → pdflib_y=242~252; 「円」pymupdf x=490,y=590→pdflib_y=252
    totalCost: { x: 420, y: 247 },
    // ② 補助金等の交付の有無
    // □有 pymupdf x=427.3,y=612.7~622.1 → pdflib_y=220~229
    subsidyYes: { x: 427, y: 224 },   // □有
    subsidyNo:  { x: 473, y: 224 },   // □無 (pymupdf x=472.9,y=612.7)
    // 交付される補助金等の額（「円」pymupdf x=490,y=632→pdflib_y=210）
    subsidyAmount: { x: 420, y: 205 },
    // ③ ①から②を差し引いた額（「円」pymupdf x=490,y=652→pdflib_y=190）
    deductibleAmount: { x: 420, y: 185 },
    // (2) 実施した工事の内容（ラベル pymupdf_y=199.8→pdflib_y=642, ラベル下端pdflib_y=632）
    // セル範囲: pdflib_y=631（上辺）～299（下辺）、ラベルの下から書き始める
    workDescription: { x: 63, y: 618 },
  },

  // ===== ページ22（pages[21]）: 証明者情報 =====
  page22: {
    // 証明年月日（テンプレート「____年____月____日」pymupdf_y=115.2 → pdflib_y=726.5）
    // 年: pymupdf x=196.8~206.2, 月: x=243.6~253.0, 日: x=290.4~299.8
    // 数値を各漢字の直前に右寄せ配置する
    issueDateYear:  { x: 170, y: 717 },  // 年号の直前（年char x=196.8）
    issueDateMonth: { x: 225, y: 717 },  // 月の直前（月char x=243.6）
    issueDateDay:   { x: 271, y: 717 },  // 日の直前（日char x=290.4）
    // (1) 証明者が建築士事務所に属する建築士の場合
    // 建築士 氏名（ラベル「氏　名」pymupdf x=148+212,y=195.6 → pdflib_y=637~646）
    issuerName: { x: 230, y: 640 },
    // 一級/二級/木造建築士の別（ラベル pymupdf x=148,y=246.4~276.1 → pdflib_y=566~595）
    architectType: { x: 230, y: 580 },
    // 登録番号（ラベル pymupdf x=336,y=231.0 → pdflib_y=601~611）
    registrationNumber: { x: 450, y: 605 },
    // 登録を受けた都道府県名（ラベル pymupdf x=336,y=260.8~290.6 → pdflib_y=551~581）
    registrationPrefecture: { x: 450, y: 565 },
    // 事務所 名称（ラベル「名　称」pymupdf x=148+212,y=306.4 → pdflib_y=526~535）
    officeName: { x: 230, y: 530 },
    // 事務所 所在地（ラベル「所在地」pymupdf x=148+180+212,y=330.8 → pdflib_y=502~511）
    officeAddress: { x: 230, y: 506 },
    // 事務所の別（一級/二級/木造建築士事務所）
    // ラベルは左半分セル(x=148~380)に配置済み
    // 右半分セル: x=380~506, pdflib_y=456~491 ← ここに入力値を配置
    officeType: { x: 385, y: 470 },
    // 登録年月日及び登録番号（ラベル pymupdf x=148,y=392.7 → pdflib_y=440~449）
    officeRegistration: { x: 230, y: 444 },
  },
} as const;

/**
 * 公式テンプレートPDFに情報を記入して生成
 */
export async function generateHousingLoanPDF(
  certificate: CertificateData
): Promise<Buffer> {
  try {
    // 公式テンプレートPDFを読み込み
    const publicDir = path.join(process.cwd(), 'public');

    const templatePath = path.join(
      publicDir,
      'templates',
      'housing-loan-certificate-template.pdf'
    );

    console.log('Loading PDF template from:', templatePath);
    console.log('File exists:', fs.existsSync(templatePath));

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template PDF not found at: ${templatePath}`);
    }

    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);

    // fontkit登録（日本語フォント使用のため）
    pdfDoc.registerFontkit(fontkit);

    // 日本語フォント読み込み
    const fontPath = path.join(publicDir, 'fonts', 'NotoSansJP.ttf');

    console.log('Loading font from:', fontPath);
    console.log('Font file exists:', fs.existsSync(fontPath));

    if (!fs.existsSync(fontPath)) {
      throw new Error(`Font file not found at: ${fontPath}`);
    }

    const fontBytes = fs.readFileSync(fontPath);
    const font = await pdfDoc.embedFont(fontBytes);

    console.log('Font embedded successfully');

    // ページ取得
    const pages = pdfDoc.getPages();
    const page1 = pages[0];   // 1ページ目: 基本情報 + 工事種別
    const page3 = pages[2];   // 3ページ目: 費用の額等
    const page22 = pages[21]; // 22ページ目: 証明者情報

    // =======================================
    // 1ページ目：基本情報の記入
    // =======================================

    // 証明申請者 - 住所
    page1.drawText(certificate.applicantAddress, {
      x: COORDS.page1.applicantAddress.x,
      y: COORDS.page1.applicantAddress.y,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    // 証明申請者 - 氏名
    page1.drawText(certificate.applicantName, {
      x: COORDS.page1.applicantName.x,
      y: COORDS.page1.applicantName.y,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    // 家屋番号及び所在地
    const propertyText = certificate.propertyNumber
      ? `${certificate.propertyNumber}　${certificate.propertyAddress}`
      : certificate.propertyAddress;
    page1.drawText(propertyText, {
      x: COORDS.page1.propertyAddress.x,
      y: COORDS.page1.propertyAddress.y,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    // 工事完了年月日
    const completionDate = new Date(certificate.completionDate);
    const completionStr = `${completionDate.getFullYear()}年${completionDate.getMonth() + 1}月${completionDate.getDate()}日`;
    page1.drawText(completionStr, {
      x: COORDS.page1.completionDate.x,
      y: COORDS.page1.completionDate.y,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    // =======================================
    // 1ページ目：チェックボックスのマーク（工事種別）
    // =======================================
    if (certificate.housingLoanDetail?.workTypes) {
      const workTypes = certificate.housingLoanDetail.workTypes;

      // 第1号工事のチェック
      if (workTypes.work1) {
        if (workTypes.work1.extension) {
          drawCheckmark(page1, COORDS.page1.work1.extension, font);
        }
        if (workTypes.work1.renovation) {
          drawCheckmark(page1, COORDS.page1.work1.renovation, font);
        }
        if (workTypes.work1.majorRepair) {
          drawCheckmark(page1, COORDS.page1.work1.majorRepair, font);
        }
        if (workTypes.work1.majorRemodeling) {
          drawCheckmark(page1, COORDS.page1.work1.majorRemodeling, font);
        }
      }

      // 第2号工事のチェック
      if (workTypes.work2) {
        if (workTypes.work2.floorOverHalf) {
          drawCheckmark(page1, COORDS.page1.work2.floorOverHalf, font);
        }
        if (workTypes.work2.stairOverHalf) {
          drawCheckmark(page1, COORDS.page1.work2.stairOverHalf, font);
        }
        if (workTypes.work2.partitionOverHalf) {
          drawCheckmark(page1, COORDS.page1.work2.partitionOverHalf, font);
        }
        if (workTypes.work2.wallOverHalf) {
          drawCheckmark(page1, COORDS.page1.work2.wallOverHalf, font);
        }
      }

      // 第3号工事のチェック
      if (workTypes.work3) {
        if (workTypes.work3.livingRoom) {
          drawCheckmark(page1, COORDS.page1.work3.livingRoom, font);
        }
        if (workTypes.work3.kitchen) {
          drawCheckmark(page1, COORDS.page1.work3.kitchen, font);
        }
        if (workTypes.work3.bathroom) {
          drawCheckmark(page1, COORDS.page1.work3.bathroom, font);
        }
        if (workTypes.work3.toilet) {
          drawCheckmark(page1, COORDS.page1.work3.toilet, font);
        }
        if (workTypes.work3.washroom) {
          drawCheckmark(page1, COORDS.page1.work3.washroom, font);
        }
        if (workTypes.work3.storage) {
          drawCheckmark(page1, COORDS.page1.work3.storage, font);
        }
        if (workTypes.work3.entrance) {
          drawCheckmark(page1, COORDS.page1.work3.entrance, font);
        }
        if (workTypes.work3.corridor) {
          drawCheckmark(page1, COORDS.page1.work3.corridor, font);
        }
      }

      // 第4号工事のチェック（耐震改修）
      if (workTypes.work4) {
        if (workTypes.work4.buildingStandard) {
          drawCheckmark(page1, COORDS.page1.work4.buildingStandard, font);
        }
        if (workTypes.work4.earthquakeSafety) {
          drawCheckmark(page1, COORDS.page1.work4.earthquakeSafety, font);
        }
      }

      // 第5号工事のチェック（バリアフリー）
      if (workTypes.work5) {
        if (workTypes.work5.pathwayExpansion) {
          drawCheckmark(page1, COORDS.page1.work5.pathwayExpansion, font);
        }
        if (workTypes.work5.stairSlope) {
          drawCheckmark(page1, COORDS.page1.work5.stairSlope, font);
        }
        if (workTypes.work5.bathroomImprovement) {
          drawCheckmark(page1, COORDS.page1.work5.bathroomImprovement, font);
        }
        if (workTypes.work5.toiletImprovement) {
          drawCheckmark(page1, COORDS.page1.work5.toiletImprovement, font);
        }
        if (workTypes.work5.handrails) {
          drawCheckmark(page1, COORDS.page1.work5.handrails, font);
        }
        if (workTypes.work5.stepElimination) {
          drawCheckmark(page1, COORDS.page1.work5.stepElimination, font);
        }
        if (workTypes.work5.doorImprovement) {
          drawCheckmark(page1, COORDS.page1.work5.doorImprovement, font);
        }
        if (workTypes.work5.floorSlipPrevention) {
          drawCheckmark(page1, COORDS.page1.work5.floorSlipPrevention, font);
        }
      }

      // 第6号工事のチェック（省エネ）
      if (workTypes.work6?.energyEfficiency) {
        const ee = workTypes.work6.energyEfficiency;

        if (ee.allWindowsInsulation) {
          drawCheckmark(page1, COORDS.page1.work6.allWindowsInsulation, font);
        }
        if (ee.allRoomsWindowsInsulation) {
          drawCheckmark(page1, COORDS.page1.work6.allRoomsWindowsInsulation, font);
        }
        if (ee.highInsulation) {
          drawCheckmark(page1, COORDS.page1.work6.highInsulation, font);
        }
        if (ee.ceilingInsulation) {
          drawCheckmark(page1, COORDS.page1.work6.ceilingInsulation, font);
        }
        if (ee.wallInsulation) {
          drawCheckmark(page1, COORDS.page1.work6.wallInsulation, font);
        }
        if (ee.floorInsulation) {
          drawCheckmark(page1, COORDS.page1.work6.floorInsulation, font);
        }

        // 地域区分
        if (ee.region1) drawCheckmark(page1, COORDS.page1.work6.region1, font);
        if (ee.region2) drawCheckmark(page1, COORDS.page1.work6.region2, font);
        if (ee.region3) drawCheckmark(page1, COORDS.page1.work6.region3, font);
        if (ee.region4) drawCheckmark(page1, COORDS.page1.work6.region4, font);
        if (ee.region5) drawCheckmark(page1, COORDS.page1.work6.region5, font);
        if (ee.region6) drawCheckmark(page1, COORDS.page1.work6.region6, font);
        if (ee.region7) drawCheckmark(page1, COORDS.page1.work6.region7, font);
        if (ee.region8) drawCheckmark(page1, COORDS.page1.work6.region8, font);

        // 等級
        if (ee.grade1) drawCheckmark(page1, COORDS.page1.work6.grade1, font);
        if (ee.grade2) drawCheckmark(page1, COORDS.page1.work6.grade2, font);
        if (ee.grade3) drawCheckmark(page1, COORDS.page1.work6.grade3, font);
      }
    }

    // =======================================
    // 3ページ目：費用概要の記入
    // =======================================
    if (certificate.housingLoanDetail) {
      const detail = certificate.housingLoanDetail;

      // ① 第1号工事～第6号工事に要した費用の額
      page3.drawText(`${detail.totalCost.toLocaleString()}`, {
        x: COORDS.page3.totalCost.x,
        y: COORDS.page3.totalCost.y,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });

      // ② 補助金等の交付の有無
      if (detail.hasSubsidy) {
        drawCheckmark(page3, COORDS.page3.subsidyYes, font);

        // 交付される補助金等の額
        page3.drawText(`${detail.subsidyAmount.toLocaleString()}`, {
          x: COORDS.page3.subsidyAmount.x,
          y: COORDS.page3.subsidyAmount.y,
          size: 9,
          font: font,
          color: rgb(0, 0, 0),
        });
      } else {
        drawCheckmark(page3, COORDS.page3.subsidyNo, font);
      }

      // ③ ①から②を差し引いた額（控除対象額）
      page3.drawText(`${detail.deductibleAmount.toLocaleString()}`, {
        x: COORDS.page3.deductibleAmount.x,
        y: COORDS.page3.deductibleAmount.y,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    // =======================================
    // 3ページ目：工事内容の記入
    // =======================================
    if (certificate.housingLoanDetail?.workDescription) {
      const description = certificate.housingLoanDetail.workDescription;

      // 工事内容を複数行に分けて記入
      const lines = description.split('\n');
      let yPos = COORDS.page3.workDescription.y;

      for (const line of lines) {
        if (yPos < COORDS.page3.deductibleAmount.y + 30) break; // 費用欄に被らないよう停止

        if (line.trim() === '') {
          yPos -= 10;
          continue;
        }

        // 長い行は折り返す（1行約70文字程度）
        const maxCharsPerLine = 70;
        let remaining = line;
        while (remaining.length > 0) {
          const chunk = remaining.substring(0, maxCharsPerLine);
          remaining = remaining.substring(maxCharsPerLine);

          if (yPos < COORDS.page3.deductibleAmount.y + 30) break;

          page3.drawText(chunk, {
            x: COORDS.page3.workDescription.x,
            y: yPos,
            size: 8,
            font: font,
            color: rgb(0, 0, 0),
          });
          yPos -= 11;
        }
      }
    }

    // =======================================
    // 22ページ目：証明者情報の記入
    // =======================================

    // 証明年月日（テンプレートの「____年____月____日」に合わせて分割配置）
    if (certificate.issueDate) {
      const issueDate = new Date(certificate.issueDate);
      const yearStr = `${issueDate.getFullYear()}`;
      const monthStr = `${issueDate.getMonth() + 1}`;
      const dayStr = `${issueDate.getDate()}`;

      page22.drawText(yearStr, {
        x: COORDS.page22.issueDateYear.x,
        y: COORDS.page22.issueDateYear.y,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
      page22.drawText(monthStr, {
        x: COORDS.page22.issueDateMonth.x,
        y: COORDS.page22.issueDateMonth.y,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
      page22.drawText(dayStr, {
        x: COORDS.page22.issueDateDay.x,
        y: COORDS.page22.issueDateDay.y,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    // 建築士 氏名
    if (certificate.issuerName) {
      page22.drawText(certificate.issuerName, {
        x: COORDS.page22.issuerName.x,
        y: COORDS.page22.issuerName.y,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    // 登録番号
    if (certificate.issuerQualificationNumber) {
      page22.drawText(certificate.issuerQualificationNumber, {
        x: COORDS.page22.registrationNumber.x,
        y: COORDS.page22.registrationNumber.y,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    // 建築士事務所 名称
    if (certificate.issuerOfficeName) {
      page22.drawText(certificate.issuerOfficeName, {
        x: COORDS.page22.officeName.x,
        y: COORDS.page22.officeName.y,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    // 建築士事務所の種別（一級/二級/木造）
    if (certificate.issuerOrganizationType) {
      page22.drawText(certificate.issuerOrganizationType, {
        x: COORDS.page22.officeType.x,
        y: COORDS.page22.officeType.y,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    // PDFをバイト配列として保存
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('PDF生成に失敗しました: ' + (error as Error).message);
  }
}

/**
 * チェックボックスにチェックマークを描画
 * テンプレートの「□」記号の上にレ点を重ねる
 */
function drawCheckmark(
  page: any,
  pos: { x: number; y: number },
  font: any
) {
  page.drawText('✓', {
    x: pos.x + 1,
    y: pos.y - 2,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
}
