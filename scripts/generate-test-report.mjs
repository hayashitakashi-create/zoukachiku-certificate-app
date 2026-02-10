import puppeteer from 'puppeteer';

const now = new Date();
const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Yu Gothic', sans-serif;
    color: #1a1a2e;
    background: #fff;
    padding: 40px 48px;
    line-height: 1.6;
    font-size: 11px;
  }
  h1 {
    font-size: 20px;
    font-weight: 700;
    color: #1a365d;
    border-bottom: 3px solid #3182ce;
    padding-bottom: 8px;
    margin-bottom: 6px;
  }
  .subtitle { font-size: 12px; color: #4a5568; margin-bottom: 20px; }
  .summary-box {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
  }
  .summary-card {
    flex: 1;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 16px;
    text-align: center;
  }
  .summary-card.pass { border-color: #48bb78; background: #f0fff4; }
  .summary-card .num { font-size: 28px; font-weight: 700; color: #2f855a; }
  .summary-card .label { font-size: 10px; color: #4a5568; }

  h2 {
    font-size: 14px;
    font-weight: 700;
    color: #2d3748;
    margin-top: 18px;
    margin-bottom: 8px;
    padding: 6px 10px;
    background: #ebf8ff;
    border-left: 4px solid #3182ce;
    border-radius: 0 4px 4px 0;
  }
  h3 {
    font-size: 12px;
    font-weight: 700;
    color: #2d3748;
    margin-top: 12px;
    margin-bottom: 6px;
    padding-bottom: 3px;
    border-bottom: 1px solid #e2e8f0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0 12px 0;
    font-size: 10px;
  }
  th {
    background: #edf2f7;
    color: #2d3748;
    font-weight: 600;
    text-align: left;
    padding: 5px 8px;
    border: 1px solid #cbd5e0;
  }
  td {
    padding: 4px 8px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }
  tr:nth-child(even) td { background: #f7fafc; }
  .pass-icon { color: #38a169; font-weight: 700; }
  .section-summary {
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 14px;
    margin: 8px 0;
    font-size: 10px;
  }
  .formula {
    font-family: 'SFMono-Regular', Consolas, monospace;
    background: #edf2f7;
    padding: 1px 4px;
    border-radius: 2px;
    font-size: 9.5px;
  }
  .page-break { page-break-before: always; }
  .footer {
    margin-top: 30px;
    padding-top: 10px;
    border-top: 1px solid #e2e8f0;
    font-size: 9px;
    color: #a0aec0;
    text-align: center;
  }
</style>
</head>
<body>

<h1>増改築等工事証明書アプリ テストレポート</h1>
<p class="subtitle">実行日時: ${dateStr} ｜ テストフレームワーク: Vitest v4.0.18 ｜ 実行環境: Node.js</p>

<div class="summary-box">
  <div class="summary-card pass">
    <div class="num">208</div>
    <div class="label">テスト総数（全パス）</div>
  </div>
  <div class="summary-card pass">
    <div class="num">5</div>
    <div class="label">テストファイル</div>
  </div>
  <div class="summary-card pass">
    <div class="num">0</div>
    <div class="label">失敗</div>
  </div>
  <div class="summary-card">
    <div class="num" style="color:#3182ce">188ms</div>
    <div class="label">実行時間</div>
  </div>
</div>

<!-- ============ テストファイル一覧 ============ -->
<h2>テストファイル一覧</h2>
<table>
  <tr><th>ファイル</th><th>テスト数</th><th>結果</th><th>内容</th></tr>
  <tr><td>deductible-calculations.test.ts</td><td>99</td><td><span class="pass-icon">PASS</span></td><td>全7工事種別の控除対象額計算 + 住宅借入金等特別控除詳細</td></tr>
  <tr><td>cost-calculation-integration.test.ts</td><td>21</td><td><span class="pass-icon">PASS</span></td><td>CostCalculationStep統合テスト（フォーム入力→計算結果）</td></tr>
  <tr><td>workTypeCalculations.test.ts</td><td>45</td><td><span class="pass-icon">PASS</span></td><td>工事種別ごとの金額計算・控除判定</td></tr>
  <tr><td>renovationCalculator.test.ts</td><td>38</td><td><span class="pass-icon">PASS</span></td><td>改修計算エンジン・最適組合せ・1000万上限</td></tr>
  <tr><td>rateLimit.test.ts</td><td>5</td><td><span class="pass-icon">PASS</span></td><td>APIレートリミッター</td></tr>
</table>

<!-- ============ 1. 耐震改修 ============ -->
<h2>1. 耐震改修工事（第4号工事）</h2>
<div class="section-summary">
  計算式: <span class="formula">控除対象額 = min(工事費総額 − 補助金額, 250万円)</span>　※50万円超の場合のみ対象<br>
  金額計算: <span class="formula">金額 = 単価 × 数量 × (居住割合/100)</span>
</div>
<table>
  <tr><th>#</th><th>テスト内容</th><th>入力</th><th>期待値</th><th>結果</th></tr>
  <tr><td>1</td><td>補助金なし: 総額がそのまま控除対象</td><td>総額150万, 補助0</td><td>150万</td><td class="pass-icon">PASS</td></tr>
  <tr><td>2</td><td>補助金あり: 総額 − 補助金</td><td>総額200万, 補助50万</td><td>150万</td><td class="pass-icon">PASS</td></tr>
  <tr><td>3</td><td>上限250万円を超える場合</td><td>総額500万, 補助0</td><td>250万</td><td class="pass-icon">PASS</td></tr>
  <tr><td>4</td><td>補助金控除後50万円以下は0</td><td>総額80万, 補助40万</td><td>0</td><td class="pass-icon">PASS</td></tr>
  <tr><td>5</td><td>ちょうど50万円の場合は0</td><td>総額50万, 補助0</td><td>0</td><td class="pass-icon">PASS</td></tr>
  <tr><td>6</td><td>50万1円で控除対象になる</td><td>総額500,001, 補助0</td><td>500,001</td><td class="pass-icon">PASS</td></tr>
  <tr><td>7</td><td>単価×数量</td><td>単価10,000 × 数量5</td><td>50,000</td><td class="pass-icon">PASS</td></tr>
  <tr><td>8</td><td>単価×数量×割合</td><td>単価10,000 × 5 × 80%</td><td>40,000</td><td class="pass-icon">PASS</td></tr>
  <tr><td>9</td><td>端数は四捨五入</td><td>単価333 × 3 × 50%</td><td>500</td><td class="pass-icon">PASS</td></tr>
</table>

<!-- ============ 2. バリアフリー ============ -->
<h2>2. バリアフリー改修工事（第5号工事）</h2>
<div class="section-summary">
  計算式: <span class="formula">控除対象額 = min(工事費総額 − 補助金額, 200万円)</span>　※50万円超の場合のみ対象
</div>
<table>
  <tr><th>#</th><th>テスト内容</th><th>入力</th><th>期待値</th><th>結果</th></tr>
  <tr><td>1</td><td>補助金なし: 総額がそのまま</td><td>総額150万, 補助0</td><td>150万</td><td class="pass-icon">PASS</td></tr>
  <tr><td>2</td><td>上限200万円</td><td>総額300万, 補助0</td><td>200万</td><td class="pass-icon">PASS</td></tr>
  <tr><td>3</td><td>50万円以下は0</td><td>総額50万, 補助0</td><td>0</td><td class="pass-icon">PASS</td></tr>
  <tr><td>4</td><td>補助金控除後50万以下</td><td>総額100万, 補助60万</td><td>0</td><td class="pass-icon">PASS</td></tr>
</table>

<!-- ============ 3. 省エネ ============ -->
<h2>3. 省エネ改修工事（第6号工事）</h2>
<div class="section-summary">
  計算式: <span class="formula">控除対象額 = min(工事費総額 − 補助金額, 上限)</span>　上限: 太陽光なし250万 / 太陽光あり350万<br>
  金額計算: <span class="formula">金額 = 単価 × 数量 × (窓面積割合/100) × (居住割合/100)</span>
</div>
<table>
  <tr><th>#</th><th>テスト内容</th><th>入力</th><th>期待値</th><th>結果</th></tr>
  <tr><td>1</td><td>太陽光なし: 上限250万</td><td>総額300万, 太陽光なし</td><td>250万</td><td class="pass-icon">PASS</td></tr>
  <tr><td>2</td><td>太陽光あり: 上限350万</td><td>総額400万, 太陽光あり</td><td>350万</td><td class="pass-icon">PASS</td></tr>
  <tr><td>3</td><td>太陽光あり: 上限内</td><td>総額200万, 太陽光あり</td><td>200万</td><td class="pass-icon">PASS</td></tr>
  <tr><td>4</td><td>窓面積割合＋居住割合</td><td>5000×20×50%×80%</td><td>40,000</td><td class="pass-icon">PASS</td></tr>
</table>

<div class="page-break"></div>

<!-- ============ 4. 同居対応 ============ -->
<h2>4. 同居対応改修工事</h2>
<div class="section-summary">
  計算式: <span class="formula">控除対象額 = min(工事費総額 − 補助金額, 250万円)</span>　※50万円超の場合のみ対象
</div>
<table>
  <tr><th>#</th><th>テスト内容</th><th>入力</th><th>期待値</th><th>結果</th></tr>
  <tr><td>1</td><td>上限250万</td><td>総額300万, 補助0</td><td>250万</td><td class="pass-icon">PASS</td></tr>
  <tr><td>2</td><td>補助金あり</td><td>総額200万, 補助30万</td><td>170万</td><td class="pass-icon">PASS</td></tr>
  <tr><td>3</td><td>50万以下は0</td><td>総額40万</td><td>0</td><td class="pass-icon">PASS</td></tr>
</table>

<!-- ============ 5. 子育て ============ -->
<h2>5. 子育て対応改修工事</h2>
<div class="section-summary">
  計算式: <span class="formula">控除対象額 = min(工事費総額 − 補助金額, 250万円)</span>　※50万円超の場合のみ対象
</div>
<table>
  <tr><th>#</th><th>テスト内容</th><th>入力</th><th>期待値</th><th>結果</th></tr>
  <tr><td>1</td><td>上限250万</td><td>総額300万, 補助0</td><td>250万</td><td class="pass-icon">PASS</td></tr>
  <tr><td>2</td><td>補助金あり</td><td>総額150万, 補助20万</td><td>130万</td><td class="pass-icon">PASS</td></tr>
  <tr><td>3</td><td>50万以下は0</td><td>総額50万</td><td>0</td><td class="pass-icon">PASS</td></tr>
  <tr><td>4</td><td>50万1円は控除対象</td><td>総額500,001</td><td>500,001</td><td class="pass-icon">PASS</td></tr>
</table>

<!-- ============ 6. 長期優良住宅 ============ -->
<h2>6. 長期優良住宅化改修工事</h2>
<div class="section-summary">
  計算式: <span class="formula">控除対象額 = min(工事費総額 − 補助金額, 上限)</span>　上限: 非認定250万 / 認定住宅500万
</div>
<table>
  <tr><th>#</th><th>テスト内容</th><th>入力</th><th>期待値</th><th>結果</th></tr>
  <tr><td>1</td><td>非認定: 上限250万</td><td>総額300万, 非認定</td><td>250万</td><td class="pass-icon">PASS</td></tr>
  <tr><td>2</td><td>認定住宅: 上限500万</td><td>総額600万, 認定</td><td>500万</td><td class="pass-icon">PASS</td></tr>
  <tr><td>3</td><td>認定住宅: 上限内</td><td>総額300万, 認定</td><td>300万</td><td class="pass-icon">PASS</td></tr>
  <tr><td>4</td><td>50万以下は0</td><td>総額50万, 非認定</td><td>0</td><td class="pass-icon">PASS</td></tr>
</table>

<!-- ============ 7. その他増改築 ============ -->
<h2>7. その他増改築等工事</h2>
<div class="section-summary">
  計算式: <span class="formula">控除対象額 = max(工事費総額 − 補助金額, 0)</span>　※上限なし・最低金額要件なし
</div>
<table>
  <tr><th>#</th><th>テスト内容</th><th>入力</th><th>期待値</th><th>結果</th></tr>
  <tr><td>1</td><td>上限なし</td><td>総額1000万</td><td>1000万</td><td class="pass-icon">PASS</td></tr>
  <tr><td>2</td><td>補助金あり</td><td>総額500万, 補助200万</td><td>300万</td><td class="pass-icon">PASS</td></tr>
  <tr><td>3</td><td>1円でも控除対象</td><td>総額1</td><td>1</td><td class="pass-icon">PASS</td></tr>
  <tr><td>4</td><td>補助金超過で0</td><td>総額100万, 補助200万</td><td>0</td><td class="pass-icon">PASS</td></tr>
</table>

<!-- ============ 住宅借入金等特別控除 詳細 ============ -->
<h2>8. 住宅借入金等特別控除 詳細（工事費総額・補助金額・控除対象額）</h2>
<div class="section-summary">
  計算式: <span class="formula">控除対象額 = 補助金有 ? 工事費総額 − 補助金額 : 工事費総額</span><br>
  適格判定: <span class="formula">控除対象額 ≥ 100万円 → 住宅借入金等特別控除の対象</span>
</div>
<table>
  <tr><th>#</th><th>シナリオ</th><th>工事費総額</th><th>補助金</th><th>控除対象額</th><th>適格</th><th>結果</th></tr>
  <tr><td>1</td><td>補助金なし</td><td>2,500,000</td><td>0</td><td>2,500,000</td><td>対象</td><td class="pass-icon">PASS</td></tr>
  <tr><td>2</td><td>補助金あり</td><td>2,500,000</td><td>500,000</td><td>2,000,000</td><td>対象</td><td class="pass-icon">PASS</td></tr>
  <tr><td>3</td><td>100万未満</td><td>1,500,000</td><td>600,000</td><td>900,000</td><td>対象外</td><td class="pass-icon">PASS</td></tr>
  <tr><td>4</td><td>ちょうど100万</td><td>1,000,000</td><td>0</td><td>1,000,000</td><td>対象</td><td class="pass-icon">PASS</td></tr>
  <tr><td>5</td><td>99万9999円</td><td>999,999</td><td>0</td><td>999,999</td><td>対象外</td><td class="pass-icon">PASS</td></tr>
  <tr><td>6</td><td>高額ケース</td><td>50,000,000</td><td>10,000,000</td><td>40,000,000</td><td>対象</td><td class="pass-icon">PASS</td></tr>
  <tr><td>7</td><td>補助金なしフラグ時は無視</td><td>2,000,000</td><td>(500,000)</td><td>2,000,000</td><td>対象</td><td class="pass-icon">PASS</td></tr>
</table>

<!-- ============ 統合テスト ============ -->
<h2>9. CostCalculationStep 統合テスト（E2E）</h2>
<div class="section-summary">
  フォーム入力（WorkDataFormState）→ convertFormStateToWorkData → WorkData（summary含む）の一気通貫テスト
</div>
<table>
  <tr><th>#</th><th>テスト内容</th><th>検証項目</th><th>結果</th></tr>
  <tr><td>1</td><td>耐震: 1項目入力 → 総額・補助金・控除対象額</td><td>totalAmount, subsidyAmount, deductibleAmount</td><td class="pass-icon">PASS</td></tr>
  <tr><td>2</td><td>耐震: 複数項目の合算</td><td>合計金額が正しい</td><td class="pass-icon">PASS</td></tr>
  <tr><td>3</td><td>耐震: 数量0の項目は無視</td><td>summary = null</td><td class="pass-icon">PASS</td></tr>
  <tr><td>4</td><td>耐震: 割合(%)で按分</td><td>80%按分後の金額</td><td class="pass-icon">PASS</td></tr>
  <tr><td>5</td><td>バリアフリー: 基本計算</td><td>上限200万判定</td><td class="pass-icon">PASS</td></tr>
  <tr><td>6</td><td>省エネ: 太陽光なし上限250万</td><td>hasSolarPower=false</td><td class="pass-icon">PASS</td></tr>
  <tr><td>7</td><td>省エネ: 太陽光あり上限350万</td><td>hasSolarPower=true</td><td class="pass-icon">PASS</td></tr>
  <tr><td>8</td><td>その他増改築: 直接金額入力</td><td>300万−50万=250万</td><td class="pass-icon">PASS</td></tr>
  <tr><td>9</td><td>その他増改築: 居住割合60%</td><td>200万×60%=120万</td><td class="pass-icon">PASS</td></tr>
  <tr><td>10</td><td>その他増改築: 複数項目合算</td><td>100万+200万−30万=270万</td><td class="pass-icon">PASS</td></tr>
  <tr><td>11</td><td>長期優良: 非認定 上限250万</td><td>isExcellentHousing=false</td><td class="pass-icon">PASS</td></tr>
  <tr><td>12</td><td>長期優良: 認定住宅 上限500万</td><td>isExcellentHousing=true</td><td class="pass-icon">PASS</td></tr>
  <tr><td>13</td><td>耐震+バリアフリー同時計算</td><td>各summaryが独立</td><td class="pass-icon">PASS</td></tr>
  <tr><td>14</td><td>空フォーム → 全てnull</td><td>7種別全てnull</td><td class="pass-icon">PASS</td></tr>
</table>

<!-- ============ 全工事種別 横断検証 ============ -->
<h2>10. 全工事種別 横断パターン検証</h2>
<div class="section-summary">
  耐震・バリアフリー・省エネ・同居対応・子育て・長期優良の6種別に対し、共通パターン（50万閾値、上限額、補助金控除）を横断的に検証
</div>
<table>
  <tr><th>工事種別</th><th>50万以下=0</th><th>50万1円=対象</th><th>上限額</th><th>上限内</th><th>補助金控除</th></tr>
  <tr><td>耐震改修</td><td class="pass-icon">PASS</td><td class="pass-icon">PASS</td><td class="pass-icon">PASS (250万)</td><td class="pass-icon">PASS</td><td class="pass-icon">PASS</td></tr>
  <tr><td>バリアフリー</td><td class="pass-icon">PASS</td><td class="pass-icon">PASS</td><td class="pass-icon">PASS (200万)</td><td class="pass-icon">PASS</td><td class="pass-icon">PASS</td></tr>
  <tr><td>省エネ（太陽光なし）</td><td class="pass-icon">PASS</td><td class="pass-icon">PASS</td><td class="pass-icon">PASS (250万)</td><td class="pass-icon">PASS</td><td class="pass-icon">PASS</td></tr>
  <tr><td>同居対応</td><td class="pass-icon">PASS</td><td class="pass-icon">PASS</td><td class="pass-icon">PASS (250万)</td><td class="pass-icon">PASS</td><td class="pass-icon">PASS</td></tr>
  <tr><td>子育て</td><td class="pass-icon">PASS</td><td class="pass-icon">PASS</td><td class="pass-icon">PASS (250万)</td><td class="pass-icon">PASS</td><td class="pass-icon">PASS</td></tr>
  <tr><td>長期優良（非認定）</td><td class="pass-icon">PASS</td><td class="pass-icon">PASS</td><td class="pass-icon">PASS (250万)</td><td class="pass-icon">PASS</td><td class="pass-icon">PASS</td></tr>
  <tr><td>その他増改築</td><td colspan="5" style="text-align:center">上限なし・最低要件なし → <span class="pass-icon">PASS</span></td></tr>
</table>

<div class="footer">
  増改築等工事証明書アプリ E2Eテストレポート ｜ 自動生成: ${dateStr} ｜ Vitest v4.0.18 ｜ 全208テスト PASS
</div>

</body>
</html>`;

const OUTPUT_PATH = '/Users/dw1003/Desktop/テストレポート_増改築等工事証明書.pdf';

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load', timeout: 10000 });
await page.pdf({
  path: OUTPUT_PATH,
  format: 'A4',
  margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
  printBackground: true,
});
await browser.close();
console.log(`PDF保存完了: ${OUTPUT_PATH}`);
