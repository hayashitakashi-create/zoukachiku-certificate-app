/**
 * テスト現場10件を登録し、各画面のスクリーンショットを撮影
 */
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'https://zoukachiku-certificate-app.vercel.app';
const OUTPUT_DIR = path.join(process.env.HOME, 'Desktop', 'テスト現場スクリーンショット');

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function screenshot(page, filename, desc) {
  const filepath = path.join(OUTPUT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`  [OK] ${desc}`);
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const f of fs.readdirSync(OUTPUT_DIR)) fs.unlinkSync(path.join(OUTPUT_DIR, f));

  console.log('テスト現場10件の登録とスクリーンショット撮影を開始...\n');

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 900 },
    args: ['--no-sandbox'],
    protocolTimeout: 120000,
  });
  const page = await browser.newPage();

  // ゲストモードcookie設定
  await page.setCookie({
    name: 'guest-mode', value: 'true',
    domain: new URL(BASE_URL).hostname, path: '/',
  });

  // === 1. Seedページにアクセスして10件登録 ===
  console.log('=== テストデータ登録 ===');
  await page.goto(`${BASE_URL}/seed`, { waitUntil: 'networkidle0', timeout: 30000 });
  await delay(3000);
  await screenshot(page, '01_seed登録完了.png', 'Seedページ: 10件登録完了');

  // === 2. トップページ（証明書一覧） ===
  console.log('\n=== トップページ ===');
  await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await delay(2000);
  await screenshot(page, '02_トップページ_一覧上部.png', 'トップページ: 証明書一覧（上部）');

  await page.evaluate(() => window.scrollTo(0, 500));
  await delay(300);
  await screenshot(page, '02_トップページ_一覧中部.png', 'トップページ: 証明書一覧（中部）');

  await page.evaluate(() => window.scrollTo(0, 99999));
  await delay(300);
  await screenshot(page, '02_トップページ_一覧下部.png', 'トップページ: 証明書一覧（下部）');

  // === 3. 各証明書の詳細ページ ===
  console.log('\n=== 証明書詳細ページ ===');

  // ページからカード要素のリンクを取得
  const certLinks = await page.evaluate(() => {
    const links = [];
    const anchors = document.querySelectorAll('a[href*="/certificate/"]');
    anchors.forEach(a => {
      const href = a.getAttribute('href');
      if (href && href.match(/^\/certificate\/[a-f0-9-]+$/)) {
        // テキストから名前を取得
        const text = a.textContent || '';
        links.push({ href, text: text.substring(0, 30) });
      }
    });
    // 重複除去
    const unique = [];
    const seen = new Set();
    for (const l of links) {
      if (!seen.has(l.href)) {
        seen.add(l.href);
        unique.push(l);
      }
    }
    return unique;
  });

  console.log(`  証明書リンク: ${certLinks.length}件検出`);

  for (let i = 0; i < Math.min(certLinks.length, 10); i++) {
    const link = certLinks[i];
    const num = String(i + 1).padStart(2, '0');
    console.log(`\n  --- 現場${i + 1}: ${link.text} ---`);

    // 詳細ページ
    await page.goto(`${BASE_URL}${link.href}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await delay(2000);

    await page.evaluate(() => window.scrollTo(0, 0));
    await delay(300);
    await screenshot(page, `${num}_詳細_上部.png`, `現場${i + 1} 詳細（上部）`);

    await page.evaluate(() => window.scrollTo(0, 500));
    await delay(300);
    await screenshot(page, `${num}_詳細_中部.png`, `現場${i + 1} 詳細（中部）`);

    await page.evaluate(() => window.scrollTo(0, 99999));
    await delay(300);
    await screenshot(page, `${num}_詳細_下部.png`, `現場${i + 1} 詳細（下部）`);

    // プレビューページがあれば
    try {
      await page.goto(`${BASE_URL}${link.href}/preview`, { waitUntil: 'networkidle0', timeout: 15000 });
      await delay(2000);

      await page.evaluate(() => window.scrollTo(0, 0));
      await delay(300);
      await screenshot(page, `${num}_プレビュー_上部.png`, `現場${i + 1} プレビュー（上部）`);

      await page.evaluate(() => window.scrollTo(0, 99999));
      await delay(300);
      await screenshot(page, `${num}_プレビュー_下部.png`, `現場${i + 1} プレビュー（下部）`);
    } catch {
      console.log(`    プレビューページなし`);
    }
  }

  // === 4. 新規作成画面（各用途のStep1） ===
  console.log('\n=== 新規作成画面（Step1: 用途選択後） ===');
  const purposes = [
    { id: 'housing_loan', label: '住宅借入金等特別控除' },
    { id: 'reform_tax', label: '住宅特定改修特別税額控除' },
    { id: 'resale', label: '買取再販住宅' },
    { id: 'property_tax', label: '固定資産税の減額' },
  ];

  for (const purpose of purposes) {
    await page.goto(`${BASE_URL}/certificate/create`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluate(() => { localStorage.removeItem('certificate-form-data'); });
    await page.reload({ waitUntil: 'networkidle0', timeout: 30000 });
    await delay(2000);

    // 用途を選択
    await page.evaluate((purposeId) => {
      const radio = document.querySelector(`input[name="purposeType"][value="${purposeId}"]`);
      if (radio) radio.click();
    }, purpose.id);
    await delay(500);

    // スクロールして工事種別部分を見せる
    await page.evaluate(() => window.scrollTo(0, 400));
    await delay(300);
    await screenshot(page, `新規_${purpose.id}_用途選択後.png`, `新規作成: ${purpose.label} 選択後`);
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
