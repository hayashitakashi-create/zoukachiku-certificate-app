/**
 * E2Eテスト: 全4用途のPDF生成 + 座標検証
 *
 * 実行: node test-pdf-e2e.mjs
 * 出力: /tmp/e2e-test-*.pdf
 */

import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ファイルパス
const TEMPLATE_PATH = path.join(__dirname, 'public/templates/housing-loan-certificate-template.pdf');
const FONT_PATH = path.join(__dirname, 'public/fonts/NotoSansJP.ttf');

async function loadTemplate() {
  const templateBytes = fs.readFileSync(TEMPLATE_PATH);
  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);
  const fontBytes = fs.readFileSync(FONT_PATH);
  const font = await pdfDoc.embedFont(fontBytes);
  const pages = pdfDoc.getPages();
  console.log(`Template loaded: ${pages.length} pages`);
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

// =============================================
// テスト1: 住宅ローン減税（増改築）
// =============================================
async function testHousingLoan() {
  console.log('\n=== テスト1: 住宅ローン減税（増改築） ===');
  const { pdfDoc, pages, font } = await loadTemplate();

  const page1 = pages[0];
  const page3 = pages[2];
  const page22 = pages[21];

  // P1: 基本情報
  drawText(page1, '東京都千代田区霞が関０-０-０', 163, 743, font);
  drawText(page1, '国交　太郎', 163, 723, font);
  drawText(page1, '東京都千代田区霞が関０-０-０ 1001番1', 163, 703, font);
  drawText(page1, '2024年6月15日', 163, 683, font);

  // P1: 工事種別チェック（第1号・第3号・第5号）
  // 第1号: 大規模修繕
  drawCheckmark(page1, 279, 592, font);
  // 第3号: 居室・浴室・便所・洗面所
  drawCheckmark(page1, 142, 484, font);
  drawCheckmark(page1, 267, 484, font);
  drawCheckmark(page1, 324, 484, font);
  drawCheckmark(page1, 382, 484, font);
  // 第5号: 手すり
  drawCheckmark(page1, 279, 351, font);

  // P3: 費用の額等
  drawAmount(page3, 20000000, 420, 247, font);  // ① 20,000,000
  drawCheckmark(page3, 427, 224, font);           // ② 有
  drawAmount(page3, 500000, 420, 205, font);      // 補助金 500,000
  drawAmount(page3, 19500000, 420, 185, font);    // ③ 19,500,000

  // P3: 工事内容
  const desc = '１：第1号工事\n・既存屋根全体の耐震改修\n２：第3号工事\n①居室（洋室8畳、和室4.5畳）全面改修\n３：第5号工事\n・廊下に手すり設置 2カ所';
  let yPos = 618;
  for (const line of desc.split('\n')) {
    drawText(page3, line, 63, yPos, font, 8);
    yPos -= 11;
  }

  // P22: 証明者情報
  drawText(page22, '2024', 170, 717, font);
  drawText(page22, '7', 225, 717, font);
  drawText(page22, '1', 271, 717, font);
  drawText(page22, '証明　家子', 230, 640, font);
  drawText(page22, '株式会社　証明建築士事務所', 230, 530, font);
  drawText(page22, '東京都中央区 0-00-000', 230, 510, font);
  drawText(page22, '一級建築士', 385, 470, font);

  const bytes = await pdfDoc.save();
  const outPath = '/tmp/e2e-test-housing-loan.pdf';
  fs.writeFileSync(outPath, bytes);
  console.log(`✓ 出力: ${outPath}`);
  console.log('  P1: 基本情報 + 工事種別(1号/3号/5号)');
  console.log('  P3: ①20,000,000 ②有500,000 ③19,500,000 + 工事内容');
  console.log('  P22: 証明者情報');
  return outPath;
}

// =============================================
// テスト2: リフォーム促進税制（省エネ+子育て）
// =============================================
async function testReformTax() {
  console.log('\n=== テスト2: リフォーム促進税制（省エネ+子育て） ===');
  const { pdfDoc, pages, font } = await loadTemplate();

  const page1 = pages[0];
  const page13 = pages[12];
  const page14 = pages[13];
  const page15 = pages[14];
  const page16 = pages[15];
  const page22 = pages[21];

  // P1: 基本情報
  drawText(page1, '東京都千代田区霞が関０-０-０', 163, 743, font);
  drawText(page1, '住宅　太郎', 163, 723, font);
  drawText(page1, '東京都千代田区霞が関０-０-０ 1001番1', 163, 703, font);
  drawText(page1, '2024年6月15日', 163, 683, font);

  // P13: 工事内容
  const desc = '１：一般断熱改修\n①内窓の新設（10カ所）\n②床等の断熱性を高める工事（100㎡）\n③高効率エアコンの設置（１台）\n\n２：子育て対応改修\n①対面式キッチンへの交換（1カ所）\n②チャイルドフェンスを取り付ける工事';
  let yPos = 750;
  for (const line of desc.split('\n')) {
    if (line.trim() === '') { yPos -= 10; continue; }
    drawText(page13, line, 63, yPos, font, 8);
    yPos -= 11;
  }

  // P14: ③ 省エネ改修
  drawAmount(page14, 840400, 420, 750.7, font);   // ア
  drawCheckmark(page14, 427, 730.3, font);          // イ 有
  drawAmount(page14, 200000, 420, 710.8, font);     // 補助金
  drawAmount(page14, 640400, 420, 690.9, font);     // ウ
  drawAmount(page14, 640400, 420, 664.4, font);     // エ

  // P15: ⑦ 子育て対応改修
  drawAmount(page15, 1507200, 420, 425.2, font);   // ア
  drawCheckmark(page15, 462, 404.8, font);           // イ 無
  drawAmount(page15, 1507200, 420, 365.4, font);    // ウ
  drawAmount(page15, 1507200, 420, 345.5, font);    // エ

  // P16: パターン比較 + 最終計算
  // ⑧⑨
  drawAmount(page16, 2147600, 420, 770.6, font);  // ⑧
  drawAmount(page16, 2147600, 420, 750.7, font);  // ⑨
  // ⑪⑫
  drawAmount(page16, 1507200, 420, 710.8, font);  // ⑪
  drawAmount(page16, 1507200, 420, 690.9, font);  // ⑫
  // ⑭⑮
  drawAmount(page16, 1507200, 420, 651.1, font);  // ⑭
  drawAmount(page16, 1507200, 420, 631.1, font);  // ⑮
  // ⑰⑱
  drawAmount(page16, 2147600, 420, 591.3, font);  // ⑰
  drawAmount(page16, 2147600, 420, 571.4, font);  // ⑱
  // ㉑㉒㉓
  drawAmount(page16, 2147600, 420, 425.2, font);  // ㉑
  drawAmount(page16, 7852400, 420, 405.5, font);  // ㉒
  drawAmount(page16, 2147600, 420, 385.9, font);  // ㉓

  // P22: 証明者情報
  drawText(page22, '2024', 170, 717, font);
  drawText(page22, '7', 225, 717, font);
  drawText(page22, '1', 271, 717, font);
  drawText(page22, '証明　家子', 230, 640, font);
  drawText(page22, '株式会社　証明建築士事務所', 230, 530, font);

  const bytes = await pdfDoc.save();
  const outPath = '/tmp/e2e-test-reform-tax.pdf';
  fs.writeFileSync(outPath, bytes);
  console.log(`✓ 出力: ${outPath}`);
  console.log('  P1: 基本情報');
  console.log('  P13: 工事内容');
  console.log('  P14: ③省エネ(840,400/200,000/640,400)');
  console.log('  P15: ⑦子育て(1,507,200/無/1,507,200)');
  console.log('  P16: ⑧-⑱ + ㉑=2,147,600 ㉒=7,852,400 ㉓=2,147,600');
  return outPath;
}

// =============================================
// テスト3: 既存住宅売買瑕疵保険加入用
// =============================================
async function testResale() {
  console.log('\n=== テスト3: 既存住宅売買瑕疵保険加入用 ===');
  const { pdfDoc, pages, font } = await loadTemplate();

  const page1 = pages[0];
  const page3 = pages[2];
  const page22 = pages[21];

  // P1: 基本情報
  drawText(page1, '東京都新宿区西新宿1-1-1', 163, 743, font);
  drawText(page1, '売買　太郎', 163, 723, font);
  drawText(page1, '東京都新宿区西新宿1-1-1 201号', 163, 703, font);
  drawText(page1, '2024年5月20日', 163, 683, font);

  // P3: 費用概要（resale uses same page3 coords as housing_loan）
  drawAmount(page3, 5000000, 420, 247, font);    // ① 5,000,000
  drawCheckmark(page3, 473, 224, font);            // ② 無
  drawAmount(page3, 5000000, 420, 185, font);     // ③ 5,000,000

  // P22: 証明者
  drawText(page22, '2024', 170, 717, font);
  drawText(page22, '6', 225, 717, font);
  drawText(page22, '1', 271, 717, font);
  drawText(page22, 'テスト　建築士', 230, 640, font);

  const bytes = await pdfDoc.save();
  const outPath = '/tmp/e2e-test-resale.pdf';
  fs.writeFileSync(outPath, bytes);
  console.log(`✓ 出力: ${outPath}`);
  console.log('  P1: 基本情報');
  console.log('  P3: ①5,000,000 ②無 ③5,000,000');
  console.log('  P22: 証明者情報');
  return outPath;
}

// =============================================
// テスト4: 固定資産税減額用
// =============================================
async function testPropertyTax() {
  console.log('\n=== テスト4: 固定資産税減額用 ===');
  const { pdfDoc, pages, font } = await loadTemplate();

  const page1 = pages[0];
  const page3 = pages[2];
  const page22 = pages[21];

  // P1: 基本情報
  drawText(page1, '東京都渋谷区恵比寿2-2-2', 163, 743, font);
  drawText(page1, '固定　花子', 163, 723, font);
  drawText(page1, '東京都渋谷区恵比寿2-2-2 302号', 163, 703, font);
  drawText(page1, '2024年4月10日', 163, 683, font);

  // P3: 費用概要
  drawAmount(page3, 8000000, 420, 247, font);    // ① 8,000,000
  drawCheckmark(page3, 427, 224, font);            // ② 有
  drawAmount(page3, 300000, 420, 205, font);       // 補助金 300,000
  drawAmount(page3, 7700000, 420, 185, font);      // ③ 7,700,000

  // P22: 証明者
  drawText(page22, '2024', 170, 717, font);
  drawText(page22, '5', 225, 717, font);
  drawText(page22, '15', 271, 717, font);
  drawText(page22, '固定　建築士', 230, 640, font);

  const bytes = await pdfDoc.save();
  const outPath = '/tmp/e2e-test-property-tax.pdf';
  fs.writeFileSync(outPath, bytes);
  console.log(`✓ 出力: ${outPath}`);
  console.log('  P1: 基本情報');
  console.log('  P3: ①8,000,000 ②有300,000 ③7,700,000');
  console.log('  P22: 証明者情報');
  return outPath;
}

// =============================================
// メイン実行
// =============================================
async function main() {
  console.log('========== E2Eテスト: PDF生成検証 ==========');

  const paths = [];
  paths.push(await testHousingLoan());
  paths.push(await testReformTax());
  paths.push(await testResale());
  paths.push(await testPropertyTax());

  console.log('\n========== 全テスト完了 ==========');
  console.log('出力ファイル:');
  paths.forEach(p => console.log(`  ${p}`));
  console.log('\n→ 次のステップ: PDFを画像に変換して座標を目視確認');
}

main().catch(console.error);
