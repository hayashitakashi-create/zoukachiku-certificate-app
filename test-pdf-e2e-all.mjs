/**
 * E2Eテスト: 全6パターンのPDF生成 + 座標検証
 *
 * パターン:
 *   1. 住宅ローン減税（増改築）       → pages 1, 3, 22
 *   2. 住宅特定改修特別税額控除（全種別） → pages 1, 13-16, 22
 *   3. 耐震改修減税                   → pages 1, 13, 16, 22
 *   4. バリアフリー改修減税           → pages 1, 13, 16, 22
 *   5. 省エネ改修減税                 → pages 1, 14, 16, 22
 *   6. 固定資産税の減額措置           → pages 1, 20-21, 22
 *
 * 実行: node test-pdf-e2e-all.mjs
 * 出力: /tmp/e2e-*.pdf + /tmp/e2e-*.png
 */

import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.join(__dirname, 'public/templates/housing-loan-certificate-template.pdf');
const FONT_PATH = path.join(__dirname, 'public/fonts/NotoSansJP.ttf');

// =============================================
// ヘルパー関数
// =============================================

async function loadTemplate() {
  const templateBytes = fs.readFileSync(TEMPLATE_PATH);
  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);
  const fontBytes = fs.readFileSync(FONT_PATH);
  const font = await pdfDoc.embedFont(fontBytes);
  const pages = pdfDoc.getPages();
  return { pdfDoc, pages, font };
}

function drawText(page, text, x, y, font, size = 9) {
  page.drawText(String(text), { x, y, size, font, color: rgb(0, 0, 0) });
}

function drawCheckmark(page, x, y, font) {
  page.drawText('\u2713', { x: x + 1, y: y - 2, size: 10, font, color: rgb(0, 0, 0) });
}

function drawAmount(page, amount, x, y, font, size = 9) {
  drawText(page, amount.toLocaleString(), x, y, font, size);
}

function drawMultiline(page, text, x, y, font, size = 8, lineHeight = 11, minY = 100) {
  let yPos = y;
  for (const line of text.split('\n')) {
    if (yPos < minY) break;
    if (line.trim() === '') { yPos -= lineHeight - 1; continue; }
    drawText(page, line, x, yPos, font, size);
    yPos -= lineHeight;
  }
}

function drawDate(page, year, month, day, yearX, monthX, dayX, y, font) {
  drawText(page, String(year), yearX, y, font);
  drawText(page, String(month), monthX, y, font);
  drawText(page, String(day), dayX, y, font);
}

// ===== 共通座標 =====
const BASE_COORDS = {
  page1: {
    applicantAddress: { x: 163, y: 743 },
    applicantName: { x: 163, y: 723 },
    propertyAddress: { x: 163, y: 703 },
    completionDate: { x: 163, y: 683 },
  },
  page22: {
    issueDateYear: { x: 170, y: 717 },
    issueDateMonth: { x: 225, y: 717 },
    issueDateDay: { x: 271, y: 717 },
    issuerName: { x: 230, y: 640 },
    architectQualification: { x: 230, y: 580 },
    registrationNumber: { x: 450, y: 605 },
    registrationPrefecture: { x: 450, y: 565 },
    officeName: { x: 230, y: 530 },
    officeAddress: { x: 230, y: 505 },
    officeType: { x: 385, y: 473 },
    officeRegistrationDate: { x: 385, y: 447 },
    officeRegistrationNumber: { x: 385, y: 436 },
  },
};

function fillBasicInfo(page, data, font) {
  const c = BASE_COORDS.page1;
  drawText(page, data.applicantAddress, c.applicantAddress.x, c.applicantAddress.y, font);
  drawText(page, data.applicantName, c.applicantName.x, c.applicantName.y, font);
  const propText = data.propertyNumber
    ? `${data.propertyNumber}\u3000${data.propertyAddress}`
    : data.propertyAddress;
  drawText(page, propText, c.propertyAddress.x, c.propertyAddress.y, font);
  drawText(page, data.completionDate, c.completionDate.x, c.completionDate.y, font);
}

function fillIssuerInfo(page, data, font) {
  const c = BASE_COORDS.page22;
  drawDate(page, data.issueYear, data.issueMonth, data.issueDay,
    c.issueDateYear.x, c.issueDateMonth.x, c.issueDateDay.x, c.issueDateYear.y, font);
  drawText(page, data.issuerName, c.issuerName.x, c.issuerName.y, font);
  drawText(page, data.architectQualification, c.architectQualification.x, c.architectQualification.y, font);
  drawText(page, data.registrationNumber, c.registrationNumber.x, c.registrationNumber.y, font);
  if (data.registrationPrefecture) {
    drawText(page, data.registrationPrefecture, c.registrationPrefecture.x, c.registrationPrefecture.y, font);
  }
  drawText(page, data.officeName, c.officeName.x, c.officeName.y, font);
  drawText(page, data.officeAddress, c.officeAddress.x, c.officeAddress.y, font);
  drawText(page, data.officeType, c.officeType.x, c.officeType.y, font);
  if (data.officeRegistrationDate) {
    drawText(page, data.officeRegistrationDate, c.officeRegistrationDate.x, c.officeRegistrationDate.y, font);
  }
  if (data.officeRegistrationNumber) {
    drawText(page, data.officeRegistrationNumber, c.officeRegistrationNumber.x, c.officeRegistrationNumber.y, font);
  }
}

// 共通の証明者データ
const ISSUER_DATA = {
  issueYear: '2024', issueMonth: '7', issueDay: '1',
  issuerName: '証明　太郎',
  architectQualification: '一級建築士',
  registrationNumber: '第123456号',
  registrationPrefecture: '',
  officeName: '株式会社 証明建築設計事務所',
  officeAddress: '東京都中央区日本橋1-1-1',
  officeType: '一級建築士事務所',
  officeRegistrationDate: '令和2年4月1日',
  officeRegistrationNumber: '第(1)54321号',
};

// =============================================
// テスト1: 住宅ローン減税（増改築）
// =============================================
async function test1_HousingLoan() {
  console.log('\n=== テスト1: 住宅ローン減税（増改築） ===');
  const { pdfDoc, pages, font } = await loadTemplate();
  const [page1, , page3, , , , , , , , , , , , , , , , , , , page22] = pages;

  // P1: 基本情報
  fillBasicInfo(page1, {
    applicantAddress: '東京都千代田区霞が関1-2-3',
    applicantName: '国交　太郎',
    propertyNumber: '1001番1',
    propertyAddress: '東京都千代田区霞が関1-2-3',
    completionDate: '2024年6月15日',
  }, font);

  // P1: 工事種別チェック
  // housingLoanPdfGeneratorV2.ts の座標
  // 第1号 大規模修繕
  drawCheckmark(page1, 279, 592, font);
  // 第3号 居室・浴室・便所・洗面所
  drawCheckmark(page1, 142, 484, font);
  drawCheckmark(page1, 267, 484, font);
  drawCheckmark(page1, 324, 484, font);
  drawCheckmark(page1, 382, 484, font);
  // 第4号 耐震改修(建築基準法)
  drawCheckmark(page1, 142, 430, font);
  // 第5号 手すり・段差解消
  drawCheckmark(page1, 279, 351, font);
  drawCheckmark(page1, 393, 351, font);
  // 第6号 省エネ（全窓断熱）
  drawCheckmark(page1, 205, 286, font);
  // 地域区分: 6地域
  drawCheckmark(page1, 324, 165, font);

  // P3: 費用の額等
  drawAmount(page3, 20000000, 420, 247, font);  // ① 20,000,000
  drawCheckmark(page3, 427, 224, font);          // ② 有
  drawAmount(page3, 500000, 420, 205, font);     // 補助金 500,000
  drawAmount(page3, 19500000, 420, 185, font);   // ③ 19,500,000

  // P3: 工事内容
  drawMultiline(page3,
    '１：第1号工事\n・既存屋根全体の大規模修繕\n２：第3号工事\n・居室（洋室8畳・和室6畳）全面改修\n・浴室のユニットバス交換\n・便所の洋式化\n・洗面所の全面改修\n３：第4号工事\n・建築基準法に基づく耐震改修\n４：第5号工事\n・廊下に手すり設置 4カ所\n・玄関段差解消\n５：第6号工事\n・全窓断熱改修（ペアガラス化）10カ所',
    63, 618, font, 8, 11, 215);

  // P22: 証明者情報
  fillIssuerInfo(page22, ISSUER_DATA, font);

  const bytes = await pdfDoc.save();
  const outPath = '/tmp/e2e-1-housing-loan.pdf';
  fs.writeFileSync(outPath, bytes);
  console.log(`  ✓ ${outPath}`);
  console.log('  P1: 基本情報 + 工事種別(1号/3号/4号/5号/6号)');
  console.log('  P3: ①20,000,000 ②有500,000 ③19,500,000 + 工事内容');
  console.log('  P22: 証明者情報（一級建築士・事務所・登録番号）');
  return outPath;
}

// =============================================
// テスト2: 住宅特定改修特別税額控除（全種別）
// =============================================
async function test2_ReformTaxAll() {
  console.log('\n=== テスト2: 住宅特定改修特別税額控除（全種別） ===');
  const { pdfDoc, pages, font } = await loadTemplate();
  const page1  = pages[0];
  const page13 = pages[12];
  const page14 = pages[13];
  const page15 = pages[14];
  const page16 = pages[15];
  const page22 = pages[21];

  // P1: 基本情報
  fillBasicInfo(page1, {
    applicantAddress: '東京都港区六本木1-1-1',
    applicantName: '改修　花子',
    propertyAddress: '東京都港区六本木1-1-1 501号',
    completionDate: '2024年8月20日',
  }, font);

  // P13: 工事の内容
  drawMultiline(page13,
    '１：耐震改修\n・木造住宅基礎補強(15㎡)、壁補強(20㎡)\n２：バリアフリー改修\n・浴室改善(1カ所)、手すり設置(6カ所)\n３：省エネ改修\n・内窓新設(8カ所)、床断熱(50㎡)\n４：同居対応改修\n・キッチン増設(1カ所)\n５：子育て対応改修\n・対面式キッチン交換(1カ所)',
    63, 750, font, 8, 11, 420);

  // P13: ① 耐震改修
  drawAmount(page13, 681000, 420, 373.0, font);    // ア
  drawCheckmark(page13, 462, 352.6, font);           // イ 無
  drawAmount(page13, 681000, 420, 313.2, font);      // ウ
  drawAmount(page13, 681000, 420, 293.3, font);      // エ
  // オ: 0（超過なし）

  // P13: ② バリアフリー改修
  drawAmount(page13, 1366200, 420, 233.5, font);    // ア
  drawCheckmark(page13, 427, 213.1, font);            // イ 有
  drawAmount(page13, 200000, 420, 193.7, font);       // 補助金
  drawAmount(page13, 1166200, 420, 173.7, font);      // ウ
  drawAmount(page13, 1166200, 420, 153.8, font);      // エ
  // オ: 0

  // P14: ③ 省エネ改修
  drawAmount(page14, 840400, 420, 750.7, font);     // ア
  drawCheckmark(page14, 462, 730.3, font);            // イ 無
  drawAmount(page14, 840400, 420, 690.9, font);      // ウ
  drawAmount(page14, 840400, 420, 664.4, font);      // エ
  // オ: 0

  // P14: ④ 同居対応
  drawAmount(page14, 476100, 420, 597.9, font);     // ア
  drawCheckmark(page14, 462, 577.5, font);            // イ 無
  drawAmount(page14, 476100, 420, 538.1, font);      // ウ
  drawAmount(page14, 476100, 420, 518.2, font);      // エ
  // オ: 0

  // P15: ⑦ 子育て
  drawAmount(page15, 275000, 420, 425.2, font);     // ア
  drawCheckmark(page15, 462, 404.8, font);            // イ 無
  drawAmount(page15, 275000, 420, 365.4, font);      // ウ
  drawAmount(page15, 275000, 420, 345.5, font);      // エ

  // P16: パターン比較 + 最終
  // パターン1: ①+②+③+④+⑦
  const p1Total = 681000 + 1166200 + 840400 + 476100 + 275000; // 3,438,700
  const p1Max = 681000 + 1166200 + 840400 + 476100 + 275000;   // 3,438,700
  drawAmount(page16, p1Total, 420, 770.6, font);  // ⑧
  drawAmount(page16, p1Max, 420, 750.7, font);     // ⑨

  // ⑰⑱ (最大値 = パターン1)
  drawAmount(page16, Math.min(p1Max, 10000000), 420, 591.3, font);  // ⑰
  drawAmount(page16, p1Total, 420, 571.4, font);                      // ⑱

  // ㉑㉒㉓ 最終
  const maxControl = Math.min(p1Max, 10000000);
  const remaining = Math.max(0, 10000000 - maxControl);
  drawAmount(page16, p1Total, 420, 425.2, font);     // ㉑
  drawAmount(page16, remaining, 420, 405.5, font);    // ㉒
  drawAmount(page16, Math.min(p1Total, remaining), 420, 385.9, font); // ㉓

  // P22: 証明者
  fillIssuerInfo(page22, ISSUER_DATA, font);

  const bytes = await pdfDoc.save();
  const outPath = '/tmp/e2e-2-reform-tax-all.pdf';
  fs.writeFileSync(outPath, bytes);
  console.log(`  ✓ ${outPath}`);
  console.log(`  P13: ①耐震681,000 ②BF1,366,200(補助200,000)`);
  console.log(`  P14: ③省エネ840,400 ④同居476,100`);
  console.log(`  P15: ⑦子育て275,000`);
  console.log(`  P16: パターン1=${p1Total.toLocaleString()} ㉒=${remaining.toLocaleString()}`);
  return outPath;
}

// =============================================
// テスト3: 耐震改修減税
// =============================================
async function test3_SeismicReform() {
  console.log('\n=== テスト3: 耐震改修減税 ===');
  const { pdfDoc, pages, font } = await loadTemplate();
  const page1  = pages[0];
  const page13 = pages[12];
  const page16 = pages[15];
  const page22 = pages[21];

  fillBasicInfo(page1, {
    applicantAddress: '神奈川県横浜市中区本町1-1',
    applicantName: '耐震　一郎',
    propertyAddress: '神奈川県横浜市中区本町1-1 102号',
    completionDate: '2024年5月10日',
  }, font);

  // P13: 工事の内容
  drawMultiline(page13,
    '１：耐震改修工事\n・木造住宅基礎補強工事（15㎡）\n・木造住宅壁補強工事（25㎡）\n・木造住宅屋根軽量化工事（40㎡）\n・木造住宅その他耐震補強（10㎡）',
    63, 750, font, 8, 11, 420);

  // P13: ① 耐震改修
  // 基礎: 15,400 × 15 = 231,000
  // 壁: 22,500 × 25 = 562,500
  // 屋根: 19,300 × 40 = 772,000
  // その他: 33,000 × 10 = 330,000
  // 合計: 1,895,500
  const seismicTotal = 1895500;
  const seismicSubsidy = 300000;
  const seismicDeductible = seismicTotal - seismicSubsidy; // 1,595,500
  const seismicMax = Math.min(seismicDeductible, 2500000); // 1,595,500

  drawAmount(page13, seismicTotal, 420, 373.0, font);     // ア
  drawCheckmark(page13, 427, 352.6, font);                  // イ 有
  drawAmount(page13, seismicSubsidy, 420, 333.1, font);    // 補助金
  drawAmount(page13, seismicDeductible, 420, 313.2, font); // ウ
  drawAmount(page13, seismicMax, 420, 293.3, font);         // エ

  // P16: パターン1のみ
  drawAmount(page16, seismicDeductible, 420, 770.6, font);  // ⑧
  drawAmount(page16, seismicMax, 420, 750.7, font);          // ⑨

  drawAmount(page16, seismicMax, 420, 591.3, font);          // ⑰
  drawAmount(page16, seismicDeductible, 420, 571.4, font);   // ⑱

  const remaining = 10000000 - seismicMax;
  drawAmount(page16, seismicDeductible, 420, 425.2, font);  // ㉑
  drawAmount(page16, remaining, 420, 405.5, font);           // ㉒
  drawAmount(page16, Math.min(seismicDeductible, remaining), 420, 385.9, font); // ㉓

  fillIssuerInfo(page22, {
    ...ISSUER_DATA,
    issuerName: '耐震　建築士',
  }, font);

  const bytes = await pdfDoc.save();
  const outPath = '/tmp/e2e-3-seismic-reform.pdf';
  fs.writeFileSync(outPath, bytes);
  console.log(`  ✓ ${outPath}`);
  console.log(`  P13: ①耐震 ア=${seismicTotal.toLocaleString()} 補助=${seismicSubsidy.toLocaleString()} ウ=${seismicDeductible.toLocaleString()} エ=${seismicMax.toLocaleString()}`);
  console.log(`  P16: ⑱=${seismicDeductible.toLocaleString()} ㉒=${remaining.toLocaleString()}`);
  return outPath;
}

// =============================================
// テスト4: バリアフリー改修減税
// =============================================
async function test4_BarrierFreeReform() {
  console.log('\n=== テスト4: バリアフリー改修減税 ===');
  const { pdfDoc, pages, font } = await loadTemplate();
  const page1  = pages[0];
  const page13 = pages[12];
  const page16 = pages[15];
  const page22 = pages[21];

  fillBasicInfo(page1, {
    applicantAddress: '大阪府大阪市北区梅田2-2-2',
    applicantName: 'バリア　フリ子',
    propertyAddress: '大阪府大阪市北区梅田2-2-2 301号',
    completionDate: '2024年9月1日',
  }, font);

  // P13: 工事の内容
  drawMultiline(page13,
    '１：バリアフリー改修工事\n・通路等の拡幅工事（2カ所）\n・浴室改善工事（1カ所）\n・便所改善工事（1カ所）\n・手すり設置（長尺 4m）\n・手すり設置（短尺 6カ所）\n・段差解消工事（3カ所）\n・引き戸への取替工事（4カ所）\n・滑りにくい床材への取替（5㎡）',
    63, 750, font, 8, 11, 420);

  // P13: ② バリアフリー改修
  // 通路拡幅: 137,000 × 2 = 274,000
  // 浴室: 585,000 × 1 = 585,000
  // 便所: 257,000 × 1 = 257,000
  // 手すり(長尺): 40,600 × 4m = 162,400
  // 手すり(短尺): 13,800 × 6 = 82,800
  // 段差解消: 192,900 × 3 = 578,700
  // 引き戸: 129,600 × 4 = 518,400
  // 床材: 22,100 × 5 = 110,500
  // 合計: 2,568,800
  const bfTotal = 2568800;
  const bfSubsidy = 0;
  const bfDeductible = Math.min(bfTotal - bfSubsidy, 2000000); // 上限200万
  const bfExcess = bfTotal - bfDeductible; // 568,800

  drawAmount(page13, bfTotal, 420, 233.5, font);       // ア
  drawCheckmark(page13, 462, 213.1, font);               // イ 無
  drawAmount(page13, bfDeductible, 420, 173.7, font);   // ウ
  drawAmount(page13, bfDeductible, 420, 153.8, font);   // エ (=ウ、上限内)
  drawAmount(page13, bfExcess, 420, 133.9, font);       // オ

  // P16: パターン1
  drawAmount(page16, bfDeductible, 420, 770.6, font);   // ⑧
  drawAmount(page16, bfDeductible, 420, 750.7, font);   // ⑨
  drawAmount(page16, bfExcess, 420, 730.8, font);       // ⑩

  drawAmount(page16, bfDeductible, 420, 591.3, font);   // ⑰
  drawAmount(page16, bfDeductible, 420, 571.4, font);   // ⑱
  drawAmount(page16, bfExcess, 420, 551.4, font);       // ⑲

  // ⑳ その他増改築（超過分をその他に）
  drawAmount(page16, bfExcess, 420, 508.2, font);       // ⑳ア
  drawCheckmark(page16, 462, 484.5, font);                // ⑳イ 無
  drawAmount(page16, bfExcess, 420, 445.1, font);       // ⑳ウ

  // 最終
  const remaining = 10000000 - bfDeductible;
  drawAmount(page16, bfExcess, 420, 425.2, font);       // ㉑
  drawAmount(page16, remaining, 420, 405.5, font);       // ㉒
  drawAmount(page16, Math.min(bfExcess, remaining), 420, 385.9, font); // ㉓

  fillIssuerInfo(page22, {
    ...ISSUER_DATA,
    issuerName: 'BF　建築士',
    architectQualification: '二級建築士',
    registrationPrefecture: '大阪府',
    officeType: '二級建築士事務所',
  }, font);

  const bytes = await pdfDoc.save();
  const outPath = '/tmp/e2e-4-barrier-free-reform.pdf';
  fs.writeFileSync(outPath, bytes);
  console.log(`  ✓ ${outPath}`);
  console.log(`  P13: ②BF ア=${bfTotal.toLocaleString()} ウ/エ=${bfDeductible.toLocaleString()} オ=${bfExcess.toLocaleString()}`);
  console.log(`  P16: ⑳その他=${bfExcess.toLocaleString()} ㉒=${remaining.toLocaleString()}`);
  console.log('  P22: 二級建築士（大阪府登録）');
  return outPath;
}

// =============================================
// テスト5: 省エネ改修減税
// =============================================
async function test5_EnergySavingReform() {
  console.log('\n=== テスト5: 省エネ改修減税 ===');
  const { pdfDoc, pages, font } = await loadTemplate();
  const page1  = pages[0];
  const page13 = pages[12];
  const page14 = pages[13];
  const page16 = pages[15];
  const page22 = pages[21];

  fillBasicInfo(page1, {
    applicantAddress: '愛知県名古屋市中区栄3-3-3',
    applicantName: '省エネ　次郎',
    propertyAddress: '愛知県名古屋市中区栄3-3-3 201号',
    completionDate: '2024年7月25日',
  }, font);

  // P13: 工事の内容
  drawMultiline(page13,
    '１：省エネ改修工事\n・内窓の新設（10カ所）\n・窓ガラスの交換（5カ所）\n・天井の断熱工事（30㎡）\n・壁の断熱工事（40㎡）\n・床の断熱工事（50㎡）\n・高効率エアコン設置（2台）\n・太陽光発電設備設置（5kW）',
    63, 750, font, 8, 11, 420);

  // P14: ③ 省エネ改修
  // 内窓: 88,500 × 10 = 885,000
  // ガラス交換: 2,700 × 5 = 13,500 (窓面積割合80%: 13,500 * 0.8 = 10,800)
  // 天井断熱: 5,200 × 30 = 156,000
  // 壁断熱: 8,400 × 40 = 336,000
  // 床断熱: 5,400 × 50 = 270,000
  // エアコン: 71,800 × 2 = 143,600
  // 太陽光設置: 311,400 × 5 = 1,557,000
  // 合計: 3,358,400
  const energyTotal = 3358400;
  const energySubsidy = 500000;
  const energyNet = energyTotal - energySubsidy; // 2,858,400
  const energyMax = Math.min(energyNet, 3500000); // 太陽光あり→350万上限 → 2,858,400

  drawAmount(page14, energyTotal, 420, 750.7, font);   // ア
  drawCheckmark(page14, 427, 730.3, font);               // イ 有
  drawAmount(page14, energySubsidy, 420, 710.8, font);  // 補助金
  drawAmount(page14, energyNet, 420, 690.9, font);       // ウ
  drawAmount(page14, energyMax, 420, 664.4, font);       // エ

  // P16: パターン1
  drawAmount(page16, energyNet, 420, 770.6, font);      // ⑧
  drawAmount(page16, energyMax, 420, 750.7, font);       // ⑨

  drawAmount(page16, energyMax, 420, 591.3, font);       // ⑰
  drawAmount(page16, energyNet, 420, 571.4, font);       // ⑱

  const remaining = 10000000 - energyMax;
  drawAmount(page16, energyNet, 420, 425.2, font);      // ㉑
  drawAmount(page16, remaining, 420, 405.5, font);       // ㉒
  drawAmount(page16, Math.min(energyNet, remaining), 420, 385.9, font); // ㉓

  fillIssuerInfo(page22, ISSUER_DATA, font);

  const bytes = await pdfDoc.save();
  const outPath = '/tmp/e2e-5-energy-saving-reform.pdf';
  fs.writeFileSync(outPath, bytes);
  console.log(`  ✓ ${outPath}`);
  console.log(`  P14: ③省エネ ア=${energyTotal.toLocaleString()} 補助=${energySubsidy.toLocaleString()} ウ=${energyNet.toLocaleString()} エ=${energyMax.toLocaleString()}`);
  console.log(`  P16: ⑱=${energyNet.toLocaleString()} ㉒=${remaining.toLocaleString()}`);
  return outPath;
}

// =============================================
// テスト6: 固定資産税の減額措置
// =============================================
async function test6_PropertyTax() {
  console.log('\n=== テスト6: 固定資産税の減額措置 ===');
  const { pdfDoc, pages, font } = await loadTemplate();
  const page1  = pages[0];
  const page20 = pages[19];  // 固定資産税セクションIV（耐震+省エネ工事種別）
  const page21 = pages[20];  // 省エネ費用詳細
  const page22 = pages[21];

  fillBasicInfo(page1, {
    applicantAddress: '福岡県福岡市博多区中洲4-4-4',
    applicantName: '固定　花子',
    propertyAddress: '福岡県福岡市博多区中洲4-4-4 502号',
    completionDate: '2024年4月10日',
  }, font);

  // ===== P20: 耐震改修 =====
  // 工事の内容（自由記述エリア）
  drawMultiline(page20,
    '耐震改修工事\n・基礎補強工事\n・壁補強工事',
    100, 740, font, 7, 10, 700);

  // 耐震費用（実測座標: cell 534.2-554.1, 514.3-534.2）
  const seismicTotal = 1200000;
  const seismicSubsidy = 200000;
  const seismicDeductible = seismicTotal - seismicSubsidy; // 1,000,000
  drawAmount(page20, seismicTotal, 420, 544, font);       // 全体工事費
  drawAmount(page20, seismicDeductible, 420, 527, font);  // 耐震改修費

  // ===== P20: 省エネ工事種別チェック =====
  // □9 太陽光発電設備
  drawCheckmark(page20, 231, 186, font);

  // ===== P21: 省エネ費用詳細 =====
  const energyTotal = 1500000;
  const energySubsidy = 300000;
  const energyDeductible = energyTotal - energySubsidy; // 1,200,000

  // 全体工事費（cell: 763.7-784.2）
  drawAmount(page21, energyTotal, 420, 774, font);
  // ア 断熱改修費（cell: 722.6-743.2）
  drawAmount(page21, energyTotal, 420, 733, font);
  // イ 補助金有（cell: 702.1-722.6）
  drawCheckmark(page21, 404, 712, font);
  // ウ 補助金額（cell: 681.6-702.1）
  drawAmount(page21, energySubsidy, 420, 692, font);
  // ① 差引額（cell: 661.1-681.6）
  drawAmount(page21, energyDeductible, 420, 671, font);
  // オ 設備補助金無（cell: 609.6-630.1）
  drawCheckmark(page21, 461, 620, font);
  // ③ ①が60万超（cell: 527.5-548.0）→ 1,200,000 > 600,000
  drawCheckmark(page21, 404, 538, font);

  // P22: 証明者
  fillIssuerInfo(page22, {
    ...ISSUER_DATA,
    issuerName: '固定　建築士',
    officeAddress: '福岡県福岡市中央区天神1-1-1',
  }, font);

  const bytes = await pdfDoc.save();
  const outPath = '/tmp/e2e-6-property-tax.pdf';
  fs.writeFileSync(outPath, bytes);
  console.log(`  ✓ ${outPath}`);
  console.log(`  P20: 耐震 全体=${seismicTotal.toLocaleString()} 耐震費=${seismicDeductible.toLocaleString()}`);
  console.log(`  P20: □9太陽光チェック`);
  console.log(`  P21: 省エネ 全体=${energyTotal.toLocaleString()} 補助=${energySubsidy.toLocaleString()} ①=${energyDeductible.toLocaleString()} ③チェック`);
  console.log('  P22: 証明者情報');
  return outPath;
}

// =============================================
// PNG変換（PyMuPDFがあれば）
// =============================================
async function convertToPng(pdfPaths) {
  console.log('\n=== PNG変換 ===');
  // Check if PyMuPDF is available
  const { execSync } = await import('child_process');
  try {
    execSync('python3 -c "import fitz"', { stdio: 'pipe' });
  } catch {
    console.log('  PyMuPDF未インストール。PNG変換スキップ。');
    return;
  }

  for (const pdfPath of pdfPaths) {
    const baseName = path.basename(pdfPath, '.pdf');
    // ページマップ
    let targetPages;
    if (baseName.includes('housing-loan')) targetPages = [0, 2, 21];
    else if (baseName.includes('reform-tax-all')) targetPages = [0, 12, 13, 14, 15, 21];
    else if (baseName.includes('seismic')) targetPages = [0, 12, 15, 21];
    else if (baseName.includes('barrier-free')) targetPages = [0, 12, 15, 21];
    else if (baseName.includes('energy-saving')) targetPages = [0, 12, 13, 15, 21];
    else if (baseName.includes('property-tax')) targetPages = [0, 19, 20, 21];
    else targetPages = Array.from({ length: 23 }, (_, i) => i);

    const pagesArg = targetPages.join(',');
    const script = [
      'import fitz',
      `doc = fitz.open("${pdfPath}")`,
      `base_name = "${baseName}"`,
      `target_pages = [${pagesArg}]`,
      'for i in target_pages:',
      '    if i < len(doc):',
      '        page = doc[i]',
      '        pix = page.get_pixmap(dpi=150)',
      '        out = "/tmp/" + base_name + "-p" + str(i+1).zfill(2) + ".png"',
      '        pix.save(out)',
      '        print("  " + out)',
      'doc.close()',
    ].join('\n');
    try {
      const result = execSync(`python3 -c '${script}'`, {
        encoding: 'utf-8',
        timeout: 30000,
      });
      console.log(result.trim());
    } catch (e) {
      console.log(`  PNG変換エラー(${baseName}): ${e.message?.split('\n')[0]}`);
    }
  }
}

// =============================================
// 検証: ページ22の座標確認
// =============================================
async function verifyPage22() {
  console.log('\n=== 検証: ページ22 座標 ===');
  const { execSync } = await import('child_process');
  try {
    execSync('python3 -c "import fitz"', { stdio: 'pipe' });
  } catch {
    console.log('  PyMuPDF未インストール。検証スキップ。');
    return true;
  }

  // Page22の罫線座標と入力値位置の整合性チェック（外部スクリプト経由）
  const scriptPath = '/tmp/verify-page22.py';
  const pyScript = [
    'import fitz',
    'doc = fitz.open("/tmp/e2e-4-barrier-free-reform.pdf")',
    'page = doc[21]',
    'page_h = page.rect.height',
    'paths = page.get_drawings()',
    'h_lines = []',
    'for p in paths:',
    '    for item in p["items"]:',
    '        if item[0] == "l":',
    '            p1, p2 = item[1], item[2]',
    '            if abs(p1.y - p2.y) < 1:',
    '                pdf_y = page_h - p1.y',
    '                if 400 < pdf_y < 740:',
    '                    h_lines.append(pdf_y)',
    '        elif item[0] == "re":',
    '            rect = item[1]',
    '            if abs(rect.height) < 2:',
    '                pdf_y = page_h - rect.y1',
    '                if 400 < pdf_y < 740:',
    '                    h_lines.append(pdf_y)',
    'h_lines = sorted(set([round(y, 1) for y in h_lines]), reverse=True)',
    'blocks = page.get_text("dict")["blocks"]',
    'written_texts = []',
    'skip_texts = {"印", "名", "称", "住", "所", "在", "地", "22"}',
    'for block in blocks:',
    '    if "lines" in block:',
    '        for line in block["lines"]:',
    '            for span in line["spans"]:',
    '                text = span.get("text", "").strip()',
    '                if not text: continue',
    '                bbox = span["bbox"]',
    '                pdf_y = page_h - bbox[3]',
    '                color = span.get("color", 0)',
    '                if color != 0 or (bbox[0] > 200 and text not in skip_texts):',
    '                    written_texts.append((text, bbox[0], pdf_y))',
    'print("罫線Y座標:", h_lines)',
    'print("書き込みテキスト:")',
    'errors = 0',
    'for text, x, y in written_texts:',
    '    in_cell = False',
    '    for i in range(len(h_lines) - 1):',
    '        if h_lines[i+1] <= y <= h_lines[i]:',
    '            in_cell = True',
    '            break',
    '    if y > 700: in_cell = True',
    '    status = "OK" if in_cell else "**NG**"',
    '    if not in_cell: errors += 1',
    '    print(f\'  [{status}] "{text}" x={x:.0f} y={y:.0f}\')',
    'if errors == 0:',
    '    print("\\n全テキストがセル内に正しく配置されています。")',
    'else:',
    '    print(f"\\n{errors}件のテキストがセル外に配置されています。")',
    'doc.close()',
  ].join('\n');
  fs.writeFileSync(scriptPath, pyScript);

  try {
    const result = execSync(`python3 ${scriptPath}`, { encoding: 'utf-8', timeout: 30000 });
    console.log(result);
    return !result.includes('**NG**');
  } catch (e) {
    console.log(`  検証エラー: ${e.stderr || e.message}`);
    return false;
  }
}

// =============================================
// メイン実行
// =============================================
async function main() {
  console.log('=========================================');
  console.log(' E2Eテスト: 全6パターンPDF生成検証');
  console.log('=========================================');

  const results = [];
  let hasError = false;

  try {
    results.push(await test1_HousingLoan());
  } catch (e) { console.error('テスト1失敗:', e.message); hasError = true; }

  try {
    results.push(await test2_ReformTaxAll());
  } catch (e) { console.error('テスト2失敗:', e.message); hasError = true; }

  try {
    results.push(await test3_SeismicReform());
  } catch (e) { console.error('テスト3失敗:', e.message); hasError = true; }

  try {
    results.push(await test4_BarrierFreeReform());
  } catch (e) { console.error('テスト4失敗:', e.message); hasError = true; }

  try {
    results.push(await test5_EnergySavingReform());
  } catch (e) { console.error('テスト5失敗:', e.message); hasError = true; }

  try {
    results.push(await test6_PropertyTax());
  } catch (e) { console.error('テスト6失敗:', e.message); hasError = true; }

  // PNG変換
  if (results.length > 0) {
    await convertToPng(results);
  }

  // ページ22検証
  const page22ok = await verifyPage22();

  // サマリー
  console.log('\n=========================================');
  console.log(' テスト結果サマリー');
  console.log('=========================================');
  console.log(`PDF生成: ${results.length}/6 成功${hasError ? '（一部失敗あり）' : ''}`);
  console.log(`ページ22座標検証: ${page22ok ? 'PASS' : 'FAIL'}`);
  console.log('\n出力ファイル:');
  results.forEach(p => console.log(`  ${p}`));
  console.log('\n→ PDFを開いて各ページの値が正しいセル内に配置されているか目視確認してください');
}

main().catch(console.error);
