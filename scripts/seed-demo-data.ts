import * as dotenv from 'dotenv';
import { resolve } from 'path';

// 環境変数を読み込む
dotenv.config({ path: resolve(__dirname, '../.env') });

import { prisma } from '../src/lib/prisma';

// 大分県の住所データ
const oitaAddresses = [
  { city: '大分市', area: '中央町', detail: '1-2-3' },
  { city: '別府市', area: '北浜', detail: '2-5-10' },
  { city: '中津市', area: '中央町', detail: '3-1-8' },
  { city: '日田市', area: '三本松', detail: '4-6-2' },
  { city: '佐伯市', area: '中村南町', detail: '5-3-15' },
  { city: '臼杵市', area: '臼杵', detail: '6-7-4' },
  { city: '津久見市', area: '中央町', detail: '7-2-9' },
  { city: '竹田市', area: '竹田', detail: '8-4-6' },
  { city: '豊後高田市', area: '玉津', detail: '9-1-12' },
  { city: '杵築市', area: '杵築', detail: '10-8-3' },
];

// 人名データ
const names = [
  '田中 太郎',
  '佐藤 花子',
  '鈴木 一郎',
  '高橋 美咲',
  '渡辺 健太',
  '伊藤 由美',
  '山本 大輔',
  '中村 愛子',
  '小林 隆',
  '加藤 さくら',
];

async function main() {
  console.log('🌱 デモデータの作成を開始します...');

  // 既存のデータをクリア（開発環境のみ）
  console.log('📝 既存のデータをクリアしています...');
  await prisma.seismicWork.deleteMany();
  await prisma.seismicSummary.deleteMany();
  await prisma.barrierFreeWork.deleteMany();
  await prisma.barrierFreeSummary.deleteMany();
  await prisma.energySavingWork.deleteMany();
  await prisma.energySavingSummary.deleteMany();
  await prisma.cohabitationWork.deleteMany();
  await prisma.cohabitationSummary.deleteMany();
  await prisma.childcareWork.deleteMany();
  await prisma.childcareSummary.deleteMany();
  await prisma.otherRenovationWork.deleteMany();
  await prisma.otherRenovationSummary.deleteMany();
  await prisma.certificate.deleteMany();

  const certificates = [];

  for (let i = 0; i < 10; i++) {
    const address = oitaAddresses[i];
    const fullAddress = `大分県${address.city}${address.area}${address.detail}`;

    console.log(`\n📋 証明書 ${i + 1}/10 を作成中...`);

    // 証明書基本情報を作成
    const certificate = await prisma.certificate.create({
      data: {
        applicantName: names[i],
        applicantAddress: fullAddress,
        propertyNumber: `OIT-${String(i + 1).padStart(4, '0')}`,
        propertyAddress: fullAddress,
        completionDate: new Date(2024, 9 + (i % 3), 15 + i),
        purposeType: 'reform_tax',
        subsidyAmount: i * 50000,
        issuerName: '建築士事務所 大分',
        issuerOfficeName: '株式会社大分設計',
        issuerOrganizationType: '一級建築士事務所',
        issuerQualificationNumber: `OIT-${String(123456 + i).padStart(6, '0')}`,
        issueDate: new Date(),
        status: i < 8 ? 'issued' : 'draft',
      },
    });

    certificates.push(certificate);

    // パターンによって異なる改修工事を追加
    const pattern = i % 6;

    // パターン0: 耐震改修のみ
    if (pattern === 0) {
      console.log('  🏗️  耐震改修工事を追加');
      await prisma.seismicWork.create({
        data: {
          certificateId: certificate.id,
          workTypeCode: 'seismic_wall_strengthen',
          workName: '壁の補強',
          unitPrice: 200000,
          unit: '箇所',
          quantity: 3,
          ratio: null,
          calculatedAmount: 200000 * 3 * 1,
        },
      });

      await prisma.seismicSummary.create({
        data: {
          certificateId: certificate.id,
          totalAmount: 600000,
          subsidyAmount: i * 50000,
          deductibleAmount: 600000 - (i * 50000),
        },
      });
    }

    // パターン1: バリアフリー改修
    if (pattern === 1) {
      console.log('  ♿ バリアフリー改修工事を追加');
      await prisma.barrierFreeWork.create({
        data: {
          certificateId: certificate.id,
          workTypeCode: 'bf_corridor_width',
          workName: '廊下の拡幅',
          unitPrice: 35000,
          unit: 'm',
          quantity: 10,
          ratio: null,
          calculatedAmount: 35000 * 10 * 1,
        },
      });

      await prisma.barrierFreeWork.create({
        data: {
          certificateId: certificate.id,
          workTypeCode: 'bf_handrail_hallway',
          workName: '廊下の手すり設置',
          unitPrice: 6000,
          unit: 'm',
          quantity: 8,
          ratio: null,
          calculatedAmount: 6000 * 8 * 1,
        },
      });

      await prisma.barrierFreeSummary.create({
        data: {
          certificateId: certificate.id,
          totalAmount: 398000,
          subsidyAmount: i * 50000,
          // バリアフリーは50万円超の場合のみ控除対象
          deductibleAmount: (398000 - (i * 50000)) > 500000 ? (398000 - (i * 50000)) : 0,
        },
      });
    }

    // パターン2: 省エネ改修（太陽光あり）
    if (pattern === 2) {
      console.log('  🌱 省エネ改修工事を追加（太陽光あり）');
      await prisma.energySavingWork.create({
        data: {
          certificateId: certificate.id,
          workTypeCode: 'es_window_all_6_1',
          workName: '窓の断熱改修（6地域・等級1）',
          category: '窓の断熱改修',
          regionCode: '6',
          unitPrice: 28000,
          unit: '㎡',
          quantity: 15,
          windowRatio: 12.5,
          residentRatio: null,
          calculatedAmount: 28000 * 15 * 1,
        },
      });

      await prisma.energySavingWork.create({
        data: {
          certificateId: certificate.id,
          workTypeCode: 'es_solar_power',
          workName: '太陽光発電設備設置',
          category: '太陽光発電設備',
          regionCode: null,
          unitPrice: 650000,
          unit: 'kW',
          quantity: 4,
          windowRatio: null,
          residentRatio: null,
          calculatedAmount: 650000 * 4 * 1,
        },
      });

      await prisma.energySavingSummary.create({
        data: {
          certificateId: certificate.id,
          totalAmount: 3020000,
          subsidyAmount: i * 50000,
          // 省エネは50万円超の場合のみ控除対象
          deductibleAmount: (3020000 - (i * 50000)) > 500000 ? (3020000 - (i * 50000)) : 0,
          hasSolarPower: true,
        },
      });
    }

    // パターン3: 同居対応改修
    if (pattern === 3) {
      console.log('  👨‍👩‍👧‍👦 同居対応改修工事を追加');
      await prisma.cohabitationWork.create({
        data: {
          certificateId: certificate.id,
          workTypeCode: 'cohab_kitchen',
          workName: '調理室の増設',
          category: '調理室の増設',
          unitPrice: 900000,
          unit: '箇所',
          quantity: 1,
          residentRatio: null,
          calculatedAmount: 900000 * 1 * 1,
        },
      });

      await prisma.cohabitationWork.create({
        data: {
          certificateId: certificate.id,
          workTypeCode: 'cohab_toilet',
          workName: '便所の増設',
          category: '便所の増設',
          unitPrice: 350000,
          unit: '箇所',
          quantity: 1,
          residentRatio: null,
          calculatedAmount: 350000 * 1 * 1,
        },
      });

      await prisma.cohabitationSummary.create({
        data: {
          certificateId: certificate.id,
          totalAmount: 1250000,
          subsidyAmount: i * 50000,
          // 同居対応は50万円超の場合のみ控除対象
          deductibleAmount: (1250000 - (i * 50000)) > 500000 ? (1250000 - (i * 50000)) : 0,
        },
      });
    }

    // パターン4: 子育て対応改修
    if (pattern === 4) {
      console.log('  👶 子育て対応改修工事を追加');
      await prisma.childcareWork.create({
        data: {
          certificateId: certificate.id,
          workTypeCode: 'child_space_child',
          workName: '子ども部屋の増設',
          category: '子育て用スペースの確保',
          unitPrice: 1200000,
          unit: '室',
          quantity: 1,
          residentRatio: null,
          calculatedAmount: 1200000 * 1 * 1,
        },
      });

      await prisma.childcareWork.create({
        data: {
          certificateId: certificate.id,
          workTypeCode: 'child_safety_window',
          workName: '窓の安全対策',
          category: '転落・転倒防止対策',
          unitPrice: 25000,
          unit: '箇所',
          quantity: 4,
          residentRatio: null,
          calculatedAmount: 25000 * 4 * 1,
        },
      });

      await prisma.childcareSummary.create({
        data: {
          certificateId: certificate.id,
          totalAmount: 1300000,
          subsidyAmount: i * 50000,
          // 子育て対応は50万円超の場合のみ控除対象
          deductibleAmount: (1300000 - (i * 50000)) > 500000 ? (1300000 - (i * 50000)) : 0,
        },
      });
    }

    // パターン5: 複数種類の改修（耐震+バリアフリー+省エネ）
    if (pattern === 5) {
      console.log('  🏗️  耐震改修工事を追加');
      await prisma.seismicWork.create({
        data: {
          certificateId: certificate.id,
          workTypeCode: 'seismic_foundation',
          workName: '基礎の補強',
          unitPrice: 400000,
          unit: '箇所',
          quantity: 2,
          ratio: null,
          calculatedAmount: 400000 * 2 * 1,
        },
      });

      await prisma.seismicSummary.create({
        data: {
          certificateId: certificate.id,
          totalAmount: 800000,
          subsidyAmount: i * 20000,
          deductibleAmount: 800000 - (i * 20000),
        },
      });

      console.log('  ♿ バリアフリー改修工事を追加');
      await prisma.barrierFreeWork.create({
        data: {
          certificateId: certificate.id,
          workTypeCode: 'bf_handrail_stair',
          workName: '階段の手すり設置',
          unitPrice: 8000,
          unit: 'm',
          quantity: 6,
          ratio: null,
          calculatedAmount: 8000 * 6 * 1,
        },
      });

      await prisma.barrierFreeSummary.create({
        data: {
          certificateId: certificate.id,
          totalAmount: 548000,
          subsidyAmount: i * 10000,
          // バリアフリーは50万円超の場合のみ控除対象
          deductibleAmount: (548000 - (i * 10000)) > 500000 ? (548000 - (i * 10000)) : 0,
        },
      });

      console.log('  🌱 省エネ改修工事を追加');
      await prisma.energySavingWork.create({
        data: {
          certificateId: certificate.id,
          workTypeCode: 'es_ceiling_1',
          workName: '天井の断熱改修（等級1）',
          category: '天井の断熱改修',
          regionCode: null,
          unitPrice: 8500,
          unit: '㎡',
          quantity: 50,
          windowRatio: null,
          residentRatio: null,
          calculatedAmount: 8500 * 50 * 1,
        },
      });

      await prisma.energySavingSummary.create({
        data: {
          certificateId: certificate.id,
          totalAmount: 425000,
          subsidyAmount: i * 20000,
          // 省エネは50万円超の場合のみ控除対象
          deductibleAmount: (425000 - (i * 20000)) > 500000 ? (425000 - (i * 20000)) : 0,
          hasSolarPower: false,
        },
      });

      console.log('  🔨 その他増改築工事を追加');
      await prisma.otherRenovationWork.create({
        data: {
          certificateId: certificate.id,
          categoryCode: 'other_large_repair',
          categoryName: '大規模な修繕',
          workDescription: '外壁の全面改修工事',
          amount: 2500000,
          residentRatio: null,
          calculatedAmount: 2500000 * 1,
        },
      });

      await prisma.otherRenovationSummary.create({
        data: {
          certificateId: certificate.id,
          totalAmount: 2500000,
          subsidyAmount: 0,
          deductibleAmount: 2500000,
        },
      });
    }
  }

  console.log('\n✅ デモデータの作成が完了しました！');
  console.log(`📊 作成した証明書: ${certificates.length}件`);
  console.log('\n📝 作成パターン:');
  console.log('  - 証明書1: 耐震改修のみ');
  console.log('  - 証明書2: バリアフリー改修');
  console.log('  - 証明書3: 省エネ改修（太陽光あり）');
  console.log('  - 証明書4: 同居対応改修');
  console.log('  - 証明書5: 子育て対応改修');
  console.log('  - 証明書6: 複数改修の組み合わせ（耐震+バリアフリー+省エネ+その他）');
  console.log('  - 証明書7-10: 上記パターンの繰り返し');
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
