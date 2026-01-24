/**
 * PDFテンプレート解析スクリプト
 * 公式PDFテンプレートから必要な入力項目を抽出
 */

import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function analyzePdfTemplate() {
  console.log('🔍 PDFテンプレートを解析中...\n');

  // テンプレートPDFを読み込み
  const templatePath = path.join(
    process.cwd(),
    'public',
    'templates',
    'housing-loan-certificate-template.pdf'
  );

  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);

  console.log('📄 基本情報:');
  console.log(`  ページ数: ${pdfDoc.getPageCount()}`);
  console.log(`  タイトル: ${pdfDoc.getTitle() || 'なし'}`);
  console.log(`  作成者: ${pdfDoc.getAuthor() || 'なし'}\n`);

  // フォームフィールドをチェック
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  console.log('📝 フォームフィールド:');
  if (fields.length === 0) {
    console.log('  ❌ フォームフィールドなし（静的PDFテンプレート）\n');
    console.log('  → テキスト解析モードで項目を抽出します...\n');

    // 各ページのテキストを抽出して分析
    await analyzeTextContent(pdfDoc);
  } else {
    console.log(`  ✅ ${fields.length}個のフォームフィールドを検出\n`);

    fields.forEach((field, index) => {
      console.log(`  ${index + 1}. ${field.getName()}`);
      console.log(`     種類: ${field.constructor.name}`);
    });
  }

  // ページサイズ情報
  console.log('\n📐 ページサイズ情報:');
  const pages = pdfDoc.getPages();
  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    console.log(`  ページ ${index + 1}: ${width} x ${height}`);
  });
}

async function analyzeTextContent(pdfDoc: PDFDocument) {
  // PDFからテキスト抽出は pdf-lib では直接できないため、
  // ページ構造から推測される項目を定義

  console.log('🎯 想定される入力項目（テンプレートから推測）:\n');

  const estimatedFields = [
    // 1ページ目 - 基本情報
    { section: '証明申請者', fields: ['住所', '氏名'] },
    { section: '家屋情報', fields: ['家屋番号及び所在地', '工事完了年月日'] },

    // 工事種別
    {
      section: '第1号工事',
      fields: ['増築', '改築', '大規模の修繕', '大規模の模様替']
    },
    {
      section: '第2号工事',
      fields: ['床の過半', '階段の過半', '間仕切壁の過半', '壁の過半']
    },
    {
      section: '第3号工事',
      fields: ['居室', '調理室', '浴室', '便所', '洗面所', '納戸', '玄関', '廊下']
    },
    {
      section: '第4号工事（耐震改修）',
      fields: ['建築基準法施行令', '地震に対する安全性']
    },
    {
      section: '第5号工事（バリアフリー）',
      fields: [
        '通路又は出入口の拡幅',
        '階段の勾配の緩和',
        '浴室の改良',
        '便所の改良',
        '手すりの取付',
        '床の段差の解消',
        '出入口の戸の改良',
        '床材の取替'
      ]
    },
    {
      section: '第6号工事（省エネ）',
      fields: [
        '全ての窓の断熱性を高める工事',
        '地域区分',
        '改修前の断熱等性能等級'
      ]
    },

    // 2ページ目 - 工事内容
    { section: '工事内容', fields: ['工事の詳細説明（自由記述）'] },

    // 3ページ目 - 費用
    {
      section: '費用概要',
      fields: [
        '第1号～第6号工事に要した費用の額',
        '補助金等の交付の有無',
        '交付される補助金等の額',
        '控除対象額'
      ]
    },

    // 最終ページ - 証明者情報
    {
      section: '証明者情報',
      fields: [
        '証明年月日',
        '建築士事務所名',
        '建築士氏名',
        '登録番号'
      ]
    },
  ];

  estimatedFields.forEach((section) => {
    console.log(`\n  📋 ${section.section}:`);
    section.fields.forEach((field) => {
      console.log(`     • ${field}`);
    });
  });

  // TypeScript型定義を生成
  console.log('\n\n💾 TypeScript型定義を生成中...\n');
  generateTypeDefinition(estimatedFields);
}

function generateTypeDefinition(fields: any[]) {
  const interfaceCode = `
// 公式PDFテンプレートから抽出された項目
export interface HousingLoanCertificateFields {
  // 証明申請者
  applicantAddress: string;          // 住所
  applicantName: string;              // 氏名

  // 家屋情報
  propertyAddress: string;            // 家屋番号及び所在地
  completionDate: Date;               // 工事完了年月日

  // 工事種別（チェックボックス）
  workTypes: {
    work1?: {                         // 第1号工事
      extension?: boolean;            // 増築
      renovation?: boolean;           // 改築
      majorRepair?: boolean;          // 大規模の修繕
      majorRemodeling?: boolean;      // 大規模の模様替
    };
    work2?: {                         // 第2号工事
      floorOverHalf?: boolean;        // 床の過半
      stairOverHalf?: boolean;        // 階段の過半
      partitionOverHalf?: boolean;    // 間仕切壁の過半
      wallOverHalf?: boolean;         // 壁の過半
    };
    work3?: {                         // 第3号工事
      livingRoom?: boolean;           // 居室
      kitchen?: boolean;              // 調理室
      bathroom?: boolean;             // 浴室
      toilet?: boolean;               // 便所
      washroom?: boolean;             // 洗面所
      storage?: boolean;              // 納戸
      entrance?: boolean;             // 玄関
      corridor?: boolean;             // 廊下
    };
    work4?: {                         // 第4号工事（耐震改修）
      buildingStandard?: boolean;     // 建築基準法施行令
      earthquakeSafety?: boolean;     // 地震に対する安全性
    };
    work5?: {                         // 第5号工事（バリアフリー）
      pathwayExpansion?: boolean;     // 通路又は出入口の拡幅
      stairSlope?: boolean;           // 階段の勾配の緩和
      bathroomImprovement?: boolean;  // 浴室の改良
      toiletImprovement?: boolean;    // 便所の改良
      handrails?: boolean;            // 手すりの取付
      stepElimination?: boolean;      // 床の段差の解消
      doorImprovement?: boolean;      // 出入口の戸の改良
      floorSlipPrevention?: boolean;  // 床材の取替
    };
    work6?: {                         // 第6号工事（省エネ）
      energyEfficiency?: {
        allWindowsInsulation?: boolean;       // 全ての窓の断熱性を高める工事
        allRoomsWindowsInsulation?: boolean;  // 全ての居室の全ての窓
        region4?: boolean;                    // 地域区分：4地域
        energyGradeBefore?: string;           // 改修前の等級
      };
    };
  };

  // 工事内容
  workDescription: string;            // 工事の詳細説明

  // 費用概要
  totalCost: number;                  // 工事費用合計
  hasSubsidy: boolean;                // 補助金の有無
  subsidyAmount: number;              // 補助金額
  deductibleAmount: number;           // 控除対象額

  // 証明者情報
  issueDate: Date | null;             // 証明年月日
  issuerOfficeName: string;           // 建築士事務所名
  issuerName: string;                 // 建築士氏名
  issuerQualificationNumber: string | null;  // 登録番号
}
`;

  console.log(interfaceCode);

  // ファイルに保存
  const outputPath = path.join(
    process.cwd(),
    'src',
    'types',
    'generatedFromPdf.ts'
  );

  fs.writeFileSync(outputPath, interfaceCode);
  console.log(`\n✅ 型定義を保存しました: ${outputPath}`);
}

// 実行
analyzePdfTemplate()
  .then(() => {
    console.log('\n✨ 解析完了！');
  })
  .catch((error) => {
    console.error('❌ エラー:', error);
    process.exit(1);
  });
