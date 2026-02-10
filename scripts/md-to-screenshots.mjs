import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import puppeteer from 'puppeteer';

const md = readFileSync('docs/操作説明書.md', 'utf-8');

// marked CLIでHTML変換
const html = execSync('npx --yes marked', { input: md, encoding: 'utf-8' });

// セクションごとに分割（h2で区切る）
const sections = [];
const parts = html.split(/(?=<h2)/);
for (const part of parts) {
  const trimmed = part.trim();
  if (!trimmed) continue;

  // セクションタイトルを抽出
  const titleMatch = trimmed.match(/<h2[^>]*>(.*?)<\/h2>/);
  let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '表紙';
  // ファイル名用にサニタイズ
  const fileName = title
    .replace(/[^\w\u3000-\u9FFF\u30A0-\u30FF\u3040-\u309F]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  sections.push({ title, fileName, html: trimmed });
}

// 共通HTMLテンプレート
function wrapHtml(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Yu Gothic', sans-serif;
    color: #1a1a2e;
    background: #f8f9fa;
    padding: 48px;
    line-height: 1.8;
    max-width: 960px;
    margin: 0 auto;
  }
  h1 {
    font-size: 28px;
    font-weight: 700;
    color: #1a365d;
    border-bottom: 3px solid #3182ce;
    padding-bottom: 12px;
    margin-bottom: 32px;
  }
  h2 {
    font-size: 22px;
    font-weight: 700;
    color: #2d3748;
    margin-top: 36px;
    margin-bottom: 16px;
    padding: 10px 16px;
    background: #ebf8ff;
    border-left: 4px solid #3182ce;
    border-radius: 0 6px 6px 0;
  }
  h3 {
    font-size: 17px;
    font-weight: 700;
    color: #2d3748;
    margin-top: 28px;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid #e2e8f0;
  }
  h4 {
    font-size: 15px;
    font-weight: 700;
    color: #4a5568;
    margin-top: 20px;
    margin-bottom: 8px;
  }
  p { margin-bottom: 12px; font-size: 14.5px; }
  ul, ol { margin-bottom: 14px; padding-left: 24px; font-size: 14.5px; }
  li { margin-bottom: 4px; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 13.5px;
  }
  th {
    background: #edf2f7;
    color: #2d3748;
    font-weight: 600;
    text-align: left;
    padding: 10px 14px;
    border: 1px solid #cbd5e0;
  }
  td {
    padding: 9px 14px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }
  tr:nth-child(even) td { background: #f7fafc; }
  code {
    background: #edf2f7;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 13px;
    font-family: 'SFMono-Regular', Consolas, monospace;
  }
  pre {
    background: #2d3748;
    color: #e2e8f0;
    padding: 18px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 16px 0;
    font-size: 13px;
    line-height: 1.6;
  }
  pre code { background: none; padding: 0; color: inherit; }
  blockquote {
    border-left: 4px solid #ed8936;
    background: #fffaf0;
    padding: 12px 18px;
    margin: 14px 0;
    border-radius: 0 6px 6px 0;
    font-size: 14px;
  }
  blockquote p { margin-bottom: 0; }
  strong { color: #2d3748; }
  hr {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 32px 0;
  }
  a { color: #3182ce; text-decoration: none; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

const OUTPUT_DIR = '/Users/dw1003/Desktop/操作説明書スクショ';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1024, height: 800, deviceScaleFactor: 2 });

for (let i = 0; i < sections.length; i++) {
  const { title, fileName, html: sectionHtml } = sections[i];
  const num = String(i).padStart(2, '0');
  const fullHtml = wrapHtml(sectionHtml);

  await page.setContent(fullHtml, { waitUntil: 'load', timeout: 10000 });

  // ページ全体の高さを取得
  const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewport({ width: 1024, height: bodyHeight + 96, deviceScaleFactor: 2 });
  await page.setContent(fullHtml, { waitUntil: 'load', timeout: 10000 });

  const outputPath = `${OUTPUT_DIR}/${num}_${fileName}.png`;
  await page.screenshot({ path: outputPath, fullPage: true });
  console.log(`${num} ${title} -> ${outputPath}`);
}

await browser.close();
console.log(`\n完了: ${sections.length}枚のスクリーンショットを保存しました`);
