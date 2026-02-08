/**
 * 住宅借入金等特別控除 詳細入力のE2Eテスト
 *
 * 使用方法:
 * npx tsx scripts/test-housing-loan-e2e.ts
 */

interface Certificate {
  id: string;
  ownerName: string;
  address: string;
  purposeType: string;
}

interface HousingLoanDetailData {
  certificateId: string;
  workTypes: {
    type1?: { items: string[] };
    type2?: { items: string[] };
    type3?: { items: string[] };
    type4?: { items: string[]; energyRating?: string };
    type5?: { items: string[]; lowCarbon?: boolean; longTerm?: boolean };
    type6?: { items: string[] };
  };
  workDescription?: string;
  totalCost: number;
  hasSubsidy: boolean;
  subsidyAmount: number;
  deductibleAmount: number;
}

const BASE_URL = process.env.BASE_URL || 'https://zoukachiku-certificate-app.vercel.app';

async function testHousingLoanE2E() {
  console.log('🚀 住宅借入金等特別控除 E2Eテスト開始\n');
  console.log(`テスト対象: ${BASE_URL}\n`);

  let testCertificateId: string;

  try {
    // ステップ1: テスト用証明書を作成
    console.log('📝 ステップ1: テスト用証明書を作成');
    const certificateResponse = await fetch(`${BASE_URL}/api/certificates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicantName: 'E2Eテスト太郎',
        applicantAddress: '東京都渋谷区テスト1-2-3',
        propertyAddress: '東京都渋谷区テスト物件1-2-3',
        completionDate: '2025-12-15',
        purposeType: 'housing_loan',
        selectedWorkTypes: ['type1', 'type3'],
        subsidyAmount: 0,
        status: 'draft',
      }),
    });

    if (!certificateResponse.ok) {
      throw new Error(`証明書作成失敗: ${certificateResponse.status} ${await certificateResponse.text()}`);
    }

    const certificateData = await certificateResponse.json();
    testCertificateId = certificateData.data.id;
    console.log(`✅ 証明書作成成功 (ID: ${testCertificateId})\n`);

    // ステップ2: 住宅借入金等詳細データを保存
    console.log('📝 ステップ2: 住宅借入金等詳細データを保存');
    const testData: HousingLoanDetailData = {
      certificateId: testCertificateId,
      workTypes: {
        type1: {
          items: ['増築'],
        },
        type3: {
          items: ['居室'],
        },
      },
      workDescription: 'リビングの増築工事を実施。\n既存の居室の床と壁の全面改修を実施。',
      totalCost: 2500000,
      hasSubsidy: true,
      subsidyAmount: 300000,
      deductibleAmount: 2200000,
    };

    const saveResponse = await fetch(`${BASE_URL}/api/housing-loan-detail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    });

    if (!saveResponse.ok) {
      const errorText = await saveResponse.text();
      throw new Error(`データ保存失敗: ${saveResponse.status} ${errorText}`);
    }

    const saveResult = await saveResponse.json();
    console.log(`✅ データ保存成功`);
    console.log(`   控除対象額: ¥${saveResult.data.deductibleAmount.toLocaleString()}\n`);

    // ステップ3: 保存したデータを取得して検証
    console.log('📝 ステップ3: 保存したデータを取得して検証');
    const getResponse = await fetch(
      `${BASE_URL}/api/housing-loan-detail?certificateId=${testCertificateId}`
    );

    if (!getResponse.ok) {
      throw new Error(`データ取得失敗: ${getResponse.status} ${await getResponse.text()}`);
    }

    const getData = await getResponse.json();
    const savedDetail = getData.data;

    console.log('✅ データ取得成功');
    console.log(`   証明書ID: ${savedDetail.certificateId}`);
    console.log(`   総費用: ¥${savedDetail.totalCost.toLocaleString()}`);
    console.log(`   補助金: ¥${savedDetail.subsidyAmount.toLocaleString()}`);
    console.log(`   控除対象額: ¥${savedDetail.deductibleAmount.toLocaleString()}\n`);

    // ステップ4: データ整合性を検証
    console.log('📝 ステップ4: データ整合性を検証');
    const assertions = [
      {
        name: '証明書IDが一致',
        condition: savedDetail.certificateId === testCertificateId,
        actual: savedDetail.certificateId,
        expected: testCertificateId,
      },
      {
        name: '総費用が一致',
        condition: Number(savedDetail.totalCost) === testData.totalCost,
        actual: Number(savedDetail.totalCost),
        expected: testData.totalCost,
      },
      {
        name: '補助金額が一致',
        condition: Number(savedDetail.subsidyAmount) === testData.subsidyAmount,
        actual: Number(savedDetail.subsidyAmount),
        expected: testData.subsidyAmount,
      },
      {
        name: '控除対象額が一致',
        condition: Number(savedDetail.deductibleAmount) === testData.deductibleAmount,
        actual: Number(savedDetail.deductibleAmount),
        expected: testData.deductibleAmount,
      },
      {
        name: '工事内容が一致',
        condition: savedDetail.workDescription === testData.workDescription,
        actual: savedDetail.workDescription,
        expected: testData.workDescription,
      },
      {
        name: '補助金フラグが一致',
        condition: savedDetail.hasSubsidy === testData.hasSubsidy,
        actual: savedDetail.hasSubsidy,
        expected: testData.hasSubsidy,
      },
    ];

    let allPassed = true;
    for (const assertion of assertions) {
      if (assertion.condition) {
        console.log(`✅ ${assertion.name}`);
      } else {
        console.log(`❌ ${assertion.name}`);
        console.log(`   期待値: ${assertion.expected}`);
        console.log(`   実際値: ${assertion.actual}`);
        allPassed = false;
      }
    }

    // ステップ5: データ更新テスト
    console.log('\n📝 ステップ5: データ更新テスト');
    const updatedData: HousingLoanDetailData = {
      ...testData,
      totalCost: 3000000,
      subsidyAmount: 500000,
      deductibleAmount: 2500000,
    };

    const updateResponse = await fetch(`${BASE_URL}/api/housing-loan-detail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    });

    if (!updateResponse.ok) {
      throw new Error(`データ更新失敗: ${updateResponse.status} ${await updateResponse.text()}`);
    }

    const updateResult = await updateResponse.json();
    console.log(`✅ データ更新成功`);
    console.log(`   更新後の控除対象額: ¥${updateResult.data.deductibleAmount.toLocaleString()}\n`);

    // ステップ6: 更新後のデータを確認
    console.log('📝 ステップ6: 更新後のデータを確認');
    const verifyResponse = await fetch(
      `${BASE_URL}/api/housing-loan-detail?certificateId=${testCertificateId}`
    );

    if (!verifyResponse.ok) {
      throw new Error(`更新後データ取得失敗: ${verifyResponse.status}`);
    }

    const verifyData = await verifyResponse.json();
    const updatedDetail = verifyData.data;

    if (Number(updatedDetail.deductibleAmount) === updatedData.deductibleAmount) {
      console.log(`✅ 更新後のデータが正しく保存されている`);
      console.log(`   控除対象額: ¥${Number(updatedDetail.deductibleAmount).toLocaleString()}\n`);
    } else {
      console.log(`❌ 更新後のデータが正しく保存されていない`);
      console.log(`   期待値: ¥${updatedData.deductibleAmount.toLocaleString()}`);
      console.log(`   実際値: ¥${Number(updatedDetail.deductibleAmount).toLocaleString()}\n`);
      allPassed = false;
    }

    // テスト結果サマリー
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      console.log('✅ すべてのテストが成功しました！');
    } else {
      console.log('❌ 一部のテストが失敗しました');
    }
    console.log('='.repeat(60));

    console.log(`\n📊 テストデータ:`);
    console.log(`   証明書ID: ${testCertificateId}`);
    console.log(`   テスト用URL: ${BASE_URL}/certificate/preview/${testCertificateId}`);

  } catch (error) {
    console.error('\n❌ テスト実行中にエラーが発生しました:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.stack) {
        console.error('\nスタックトレース:');
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// テスト実行
testHousingLoanE2E();
