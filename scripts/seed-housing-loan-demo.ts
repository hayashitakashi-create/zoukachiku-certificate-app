/**
 * 住宅借入金等特別控除のデモデータを投入するスクリプト
 */

const certificateId = 'f49be437-5564-49b9-a0a2-9795ce80aa09';

const demoData = {
  certificateId: certificateId,
  workTypes: {
    work1: {
      extension: true,
      renovation: false,
      majorRepair: false,
      majorRemodeling: false,
    },
    work3: {
      livingRoom: true,
      kitchen: false,
      bathroom: true,
      toilet: false,
      washroom: false,
      storage: false,
      entrance: false,
      corridor: false,
    },
    work5: {
      pathwayExpansion: false,
      stairSlope: false,
      bathroomImprovement: true,
      toiletImprovement: false,
      handrails: true,
      stepElimination: true,
      doorImprovement: false,
      floorSlipPrevention: false,
    },
  },
  workDescription: `既存住宅の増築及びバリアフリー対応改修工事を実施しました。

【主な工事内容】
1. 増築工事（1階部分に6畳の居室を増築）
2. 浴室の全面改修（段差解消、手すり設置、床材の滑り止め加工）
3. 居室の床・壁の全面改修
4. 廊下及び階段への手すり設置
5. 玄関から居室までの段差解消工事

高齢者の安全性と快適性を考慮した改修を行い、長期優良住宅の基準を満たす工事を実施しました。`,
  totalCost: 3500000,
  hasSubsidy: true,
  subsidyAmount: 500000,
  deductibleAmount: 3000000,
};

async function seedHousingLoanDemo() {
  try {
    console.log('住宅借入金等特別控除のデモデータを投入します...');
    console.log('Certificate ID:', certificateId);

    const response = await fetch('http://localhost:3000/api/housing-loan-detail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(demoData),
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ デモデータの投入に成功しました！');
      console.log('データ:', result.data);
    } else {
      console.error('❌ デモデータの投入に失敗しました:', result.error);
    }
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

seedHousingLoanDemo();
