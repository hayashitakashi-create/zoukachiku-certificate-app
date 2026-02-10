/**
 * E2Eスクリーンショット撮影スクリプト
 * 各登録画面（ウィザード全ステップ × 用途別）をスクリーンショットに保存
 */
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'https://zoukachiku-certificate-app.vercel.app';
const OUTPUT_DIR = path.join(process.env.HOME, 'Desktop', 'E2Eスクリーンショット');

const PURPOSES = [
  { id: 'housing_loan', label: '住宅借入金等特別控除', workTypes: ['耐震改修工事', 'バリアフリー改修工事', '省エネ改修工事'] },
  { id: 'reform_tax', label: '住宅特定改修特別税額控除', workTypes: ['バリアフリー改修工事', '省エネ改修工事', '長期優良住宅化改修工事'] },
  { id: 'resale', label: '買取再販住宅', workTypes: ['耐震改修工事', '省エネ改修工事', 'その他増改築等工事'] },
  { id: 'property_tax', label: '固定資産税の減額', workTypes: ['耐震改修工事', '省エネ改修工事'] },
];

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function screenshot(page, filename, desc) {
  const filepath = path.join(OUTPUT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`  [OK] ${desc} → ${filename}`);
}

async function clickNextButton(page) {
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '次へ' && !b.disabled);
    if (btn) btn.click();
  });
  await delay(1500);
}

async function captureAllSteps(page, purpose) {
  const p = purpose.id;
  console.log(`\n=== ${purpose.label} (${p}) ===`);

  // localStorageクリアして新規開始
  await page.goto(`${BASE_URL}/certificate/create`, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle0', timeout: 30000 });
  await delay(2000);

  // === Step 1: 基本情報入力 ===
  // 氏名入力
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="text"]');
    if (inputs[0]) { inputs[0].value = 'テスト 太郎'; inputs[0].dispatchEvent(new Event('input', { bubbles: true })); inputs[0].dispatchEvent(new Event('change', { bubbles: true })); }
  });

  // 住所（直接設定）
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="text"]');
    if (inputs[2]) { inputs[2].value = '東京都千代田区千代田1-1-1'; inputs[2].dispatchEvent(new Event('input', { bubbles: true })); inputs[2].dispatchEvent(new Event('change', { bubbles: true })); }
    if (inputs[4]) { inputs[4].value = '東京都渋谷区渋谷2-2-2'; inputs[4].dispatchEvent(new Event('input', { bubbles: true })); inputs[4].dispatchEvent(new Event('change', { bubbles: true })); }
  });

  // 工事完了日
  await page.evaluate(() => {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    if (dateInputs[0]) {
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(dateInputs[0], '2025-06-15');
      dateInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      dateInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  // 用途を選択
  await page.evaluate((purposeId) => {
    const radio = document.querySelector(`input[name="purposeType"][value="${purposeId}"]`);
    if (radio) { radio.click(); }
  }, purpose.id);
  await delay(500);

  // 工事種別をチェック
  for (const wtLabel of purpose.workTypes) {
    await page.evaluate((label) => {
      const labels = document.querySelectorAll('label');
      for (const lbl of labels) {
        const cb = lbl.querySelector('input[type="checkbox"]');
        if (cb && lbl.textContent.includes(label)) {
          cb.click();
          break;
        }
      }
    }, wtLabel);
    await delay(200);
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await delay(300);
  await screenshot(page, `${p}_step1_基本情報_上部.png`, 'Step1: 基本情報（上部）');

  await page.evaluate(() => window.scrollTo(0, 600));
  await delay(300);
  await screenshot(page, `${p}_step1_基本情報_下部.png`, 'Step1: 基本情報（下部 - 用途・工事種別）');

  // === Step 2: (1) 実施した工事の種別 ===
  await clickNextButton(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await delay(300);
  await screenshot(page, `${p}_step2_工事種別_上.png`, 'Step2: (1) 工事の種別（上）');

  await page.evaluate(() => window.scrollTo(0, 500));
  await delay(300);
  await screenshot(page, `${p}_step2_工事種別_中.png`, 'Step2: (1) 工事の種別（中）');

  await page.evaluate(() => window.scrollTo(0, 99999));
  await delay(300);
  await screenshot(page, `${p}_step2_工事種別_下.png`, 'Step2: (1) 工事の種別（下）');

  // 固定資産税の場合: 入力してキャプチャ
  if (purpose.id === 'property_tax') {
    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(300);
    // 耐震の増築チェック
    await page.evaluate(() => {
      const sections = document.querySelectorAll('.p-4.border');
      if (sections[0]) {
        const cbs = sections[0].querySelectorAll('input[type="checkbox"]');
        if (cbs[0]) cbs[0].click(); // 増築
        if (cbs[2]) cbs[2].click(); // 大規模修繕
      }
    });
    // テキスト入力
    await page.evaluate(() => {
      const tas = document.querySelectorAll('textarea');
      if (tas[0]) { tas[0].value = '耐震補強金物設置、筋交い増設'; tas[0].dispatchEvent(new Event('input', {bubbles:true})); tas[0].dispatchEvent(new Event('change', {bubbles:true})); }
    });
    // 数値入力
    await page.evaluate(() => {
      const numinputs = document.querySelectorAll('input[type="number"]');
      const set = (el, val) => {
        const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(el, val);
        el.dispatchEvent(new Event('input', {bubbles:true}));
        el.dispatchEvent(new Event('change', {bubbles:true}));
      };
      if (numinputs[0]) set(numinputs[0], '3000000');
      if (numinputs[1]) set(numinputs[1], '2500000');
    });
    await delay(500);
    await screenshot(page, `${p}_step2_1-1耐震入力済.png`, 'Step2: 1-1 耐震改修（入力済み）');

    // 省エネ部分へスクロール
    await page.evaluate(() => window.scrollTo(0, 99999));
    await delay(500);
    await screenshot(page, `${p}_step2_2省エネ下部.png`, 'Step2: 2 熱損失防止改修（下部）');
  }

  // === Step 3: (2) 実施した工事の内容 ===
  await clickNextButton(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await delay(300);
  await screenshot(page, `${p}_step3_工事内容.png`, 'Step3: (2) 実施した工事の内容');

  // === Step 4: (3) 実施した工事の費用の額等 ===
  await clickNextButton(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await delay(300);
  await screenshot(page, `${p}_step4_費用の額_上.png`, 'Step4: (3) 費用の額等（上）');

  await page.evaluate(() => window.scrollTo(0, 99999));
  await delay(300);
  await screenshot(page, `${p}_step4_費用の額_下.png`, 'Step4: (3) 費用の額等（下）');

  // === Step 5: 証明者情報 ===
  await clickNextButton(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await delay(300);
  await screenshot(page, `${p}_step5_証明者情報.png`, 'Step5: 証明者情報');

  // === Step 6: 確認・保存 ===
  await clickNextButton(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await delay(300);
  await screenshot(page, `${p}_step6_確認保存.png`, 'Step6: 確認・保存');
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  // 既存ファイルをクリア
  for (const f of fs.readdirSync(OUTPUT_DIR)) fs.unlinkSync(path.join(OUTPUT_DIR, f));

  console.log('E2Eスクリーンショット撮影を開始...');
  console.log(`出力先: ${OUTPUT_DIR}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 900 },
    args: ['--no-sandbox'],
    protocolTimeout: 120000,
  });
  const page = await browser.newPage();

  // ゲストモードcookieを設定
  await page.setCookie({
    name: 'guest-mode', value: 'true',
    domain: new URL(BASE_URL).hostname, path: '/',
  });

  // === 共通ページ ===
  console.log('=== 共通ページ ===');
  await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await delay(1000);
  await screenshot(page, '00_トップページ.png', 'トップページ');

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0', timeout: 30000 });
  await delay(1000);
  await screenshot(page, '00_ログインページ.png', 'ログインページ');

  await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle0', timeout: 30000 });
  await delay(1000);
  await screenshot(page, '00_ユーザー登録.png', 'ユーザー登録ページ');

  await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle0', timeout: 30000 });
  await delay(1000);
  await screenshot(page, '00_設定ページ.png', '設定ページ');

  // === 各用途のウィザード全ステップ ===
  for (const purpose of PURPOSES) {
    try {
      await captureAllSteps(page, purpose);
    } catch (error) {
      console.error(`  [ERROR] ${purpose.label}: ${error.message}`);
      try { await screenshot(page, `${purpose.id}_ERROR.png`, 'エラー時画面'); } catch {}
    }
  }

  await browser.close();

  const files = fs.readdirSync(OUTPUT_DIR).sort();
  console.log(`\n========================================`);
  console.log(`撮影完了: ${files.length}枚`);
  console.log(`保存先: ${OUTPUT_DIR}`);
  console.log(`========================================`);
  files.forEach(f => console.log(`  ${f}`));
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
