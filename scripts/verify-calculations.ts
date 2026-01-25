import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('📊 全証明書の統合計算結果を確認します...\n');

  const certificates = await prisma.certificate.findMany({
    orderBy: { createdAt: 'asc' },
  });

  for (const cert of certificates) {
    console.log(`\n📋 証明書: ${cert.applicantName} (${cert.propertyAddress})`);
    console.log(`   ID: ${cert.id}`);

    // 各種サマリーを取得
    const [seismic, barrierFree, energy, cohabitation, childcare, other] = await Promise.all([
      prisma.seismicSummary.findUnique({ where: { certificateId: cert.id } }),
      prisma.barrierFreeSummary.findUnique({ where: { certificateId: cert.id } }),
      prisma.energySavingSummary.findUnique({ where: { certificateId: cert.id } }),
      prisma.cohabitationSummary.findUnique({ where: { certificateId: cert.id } }),
      prisma.childcareSummary.findUnique({ where: { certificateId: cert.id } }),
      prisma.otherRenovationSummary.findUnique({ where: { certificateId: cert.id } }),
    ]);

    if (seismic) {
      console.log(`   🏗️  耐震: ${Number(seismic.deductibleAmount).toLocaleString()}円`);
    }
    if (barrierFree) {
      const amount = Number(barrierFree.deductibleAmount);
      console.log(`   ♿ バリアフリー: ${amount.toLocaleString()}円${amount === 0 ? ' (50万円以下)' : ''}`);
    }
    if (energy) {
      const amount = Number(energy.deductibleAmount);
      const hasSolar = energy.hasSolarPower ? ' (太陽光あり)' : '';
      console.log(`   🌱 省エネ: ${amount.toLocaleString()}円${amount === 0 ? ' (50万円以下)' : hasSolar}`);
    }
    if (cohabitation) {
      const amount = Number(cohabitation.deductibleAmount);
      console.log(`   👨‍👩‍👧‍👦 同居: ${amount.toLocaleString()}円${amount === 0 ? ' (50万円以下)' : ''}`);
    }
    if (childcare) {
      const amount = Number(childcare.deductibleAmount);
      console.log(`   👶 子育て: ${amount.toLocaleString()}円${amount === 0 ? ' (50万円以下)' : ''}`);
    }
    if (other) {
      console.log(`   🔨 その他: ${Number(other.deductibleAmount).toLocaleString()}円`);
    }

    // 統合計算（簡易版）
    const totalSpecial =
      Number(seismic?.deductibleAmount ?? 0) +
      Number(barrierFree?.deductibleAmount ?? 0) +
      Number(energy?.deductibleAmount ?? 0) +
      Number(cohabitation?.deductibleAmount ?? 0) +
      Number(childcare?.deductibleAmount ?? 0);

    const otherAmount = Number(other?.deductibleAmount ?? 0);
    const finalDeductible = totalSpecial + otherAmount;

    console.log(`   ✅ 改修工事合計: ${totalSpecial.toLocaleString()}円`);
    if (otherAmount > 0) {
      console.log(`   ✅ その他増改築: ${otherAmount.toLocaleString()}円`);
      console.log(`   📊 最終控除対象額: ${finalDeductible.toLocaleString()}円`);
    }
    console.log(`   🎯 残り控除可能枠: ${(10_000_000 - Math.min(totalSpecial, 10_000_000)).toLocaleString()}円`);
  }

  console.log('\n\n✅ 計算式検証完了！');
}

main()
  .catch((e) => {
    console.error('❌ エラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
