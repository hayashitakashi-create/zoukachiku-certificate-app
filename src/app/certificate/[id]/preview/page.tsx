'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { calculateOptimalCombination, decimalToNumber } from '@/lib/renovationCalculator';

interface Certificate {
  id: string;
  applicantName: string;
  applicantAddress: string;
  propertyNumber: string | null;
  propertyAddress: string;
  completionDate: string;
  purposeType: string;
  subsidyAmount: number;
  status: string;
  issuerName: string | null;
  issuerOfficeName: string | null;
  issueDate: string | null;
  issuerOrganizationType: string | null;
  issuerQualificationNumber: string | null;
}

interface HousingLoanDetail {
  workTypes: any;
  workDescription: string | null;
  totalCost: number;
  hasSubsidy: boolean;
  subsidyAmount: number;
  deductibleAmount: number;
}

interface RenovationSummary {
  totalAmount: number;
  subsidyAmount: number;
  deductibleAmount: number;
  hasSolarPower?: boolean;
}

interface RenovationData {
  works: any[];
  summary: RenovationSummary | null;
}

export default function CertificatePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const certificateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [housingLoanDetail, setHousingLoanDetail] = useState<HousingLoanDetail | null>(null);
  const [seismicData, setSeismicData] = useState<RenovationData | null>(null);
  const [barrierFreeData, setBarrierFreeData] = useState<RenovationData | null>(null);
  const [energyData, setEnergyData] = useState<RenovationData | null>(null);
  const [cohabitationData, setCohabitationData] = useState<RenovationData | null>(null);
  const [childcareData, setChildcareData] = useState<RenovationData | null>(null);
  const [otherData, setOtherData] = useState<RenovationData | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 証明書基本情報
        const certResponse = await fetch(`/api/certificates/${certificateId}`);
        const certResult = await certResponse.json();
        if (certResult.success) {
          setCertificate(certResult.data);
        }

        // 住宅借入金等特別控除詳細
        const housingLoanResponse = await fetch(`/api/certificates/${certificateId}/housing-loan`);
        const housingLoanResult = await housingLoanResponse.json();
        if (housingLoanResult.success) {
          setHousingLoanDetail(housingLoanResult.data);
        }

        // 各改修工事データを並列取得
        const [seismic, barrierFree, energy, cohabitation, childcare, other] = await Promise.all([
          fetch(`/api/certificates/${certificateId}/seismic`).then(r => r.json()),
          fetch(`/api/certificates/${certificateId}/barrier-free`).then(r => r.json()),
          fetch(`/api/certificates/${certificateId}/energy-saving`).then(r => r.json()),
          fetch(`/api/certificates/${certificateId}/cohabitation`).then(r => r.json()),
          fetch(`/api/certificates/${certificateId}/childcare`).then(r => r.json()),
          fetch(`/api/certificates/${certificateId}/other-renovation`).then(r => r.json()),
        ]);

        if (seismic.success) setSeismicData(seismic.data);
        if (barrierFree.success) setBarrierFreeData(barrierFree.data);
        if (energy.success) setEnergyData(energy.data);
        if (cohabitation.success) setCohabitationData(cohabitation.data);
        if (childcare.success) setChildcareData(childcare.data);
        if (other.success) setOtherData(other.data);

      } catch (error) {
        console.error('Failed to fetch certificate data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [certificateId]);

  // 用途タイプの表示名
  const getPurposeTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      housing_loan: '住宅借入金等特別控除',
      reform_tax: '住宅借入金等特別税額控除',
      resale: '既存住宅売買瑕疵保険加入用',
      property_tax: '固定資産税減額用',
    };
    return labels[type] || type;
  };

  // 統合計算結果を計算
  const calculateCombinedResult = () => {
    if (!seismicData && !barrierFreeData && !energyData && !cohabitationData && !childcareData) {
      return null;
    }

    return calculateOptimalCombination({
      seismic: seismicData?.summary ? {
        deductibleAmount: decimalToNumber(seismicData.summary.deductibleAmount),
        maxDeduction: Math.min(decimalToNumber(seismicData.summary.deductibleAmount), 2_500_000),
        excessAmount: Math.max(0, decimalToNumber(seismicData.summary.deductibleAmount) - 2_500_000),
      } : undefined,
      barrierFree: barrierFreeData?.summary ? {
        deductibleAmount: decimalToNumber(barrierFreeData.summary.deductibleAmount),
        maxDeduction: Math.min(decimalToNumber(barrierFreeData.summary.deductibleAmount), 2_000_000),
        excessAmount: Math.max(0, decimalToNumber(barrierFreeData.summary.deductibleAmount) - 2_000_000),
      } : undefined,
      energy: energyData?.summary ? {
        deductibleAmount: decimalToNumber(energyData.summary.deductibleAmount),
        maxDeduction: Math.min(
          decimalToNumber(energyData.summary.deductibleAmount),
          energyData.summary.hasSolarPower ? 3_500_000 : 2_500_000
        ),
        excessAmount: Math.max(
          0,
          decimalToNumber(energyData.summary.deductibleAmount) - (energyData.summary.hasSolarPower ? 3_500_000 : 2_500_000)
        ),
      } : undefined,
      cohabitation: cohabitationData?.summary ? {
        deductibleAmount: decimalToNumber(cohabitationData.summary.deductibleAmount),
        maxDeduction: Math.min(decimalToNumber(cohabitationData.summary.deductibleAmount), 2_500_000),
        excessAmount: Math.max(0, decimalToNumber(cohabitationData.summary.deductibleAmount) - 2_500_000),
      } : undefined,
      childcare: childcareData?.summary ? {
        deductibleAmount: decimalToNumber(childcareData.summary.deductibleAmount),
        maxDeduction: Math.min(decimalToNumber(childcareData.summary.deductibleAmount), 2_500_000),
        excessAmount: Math.max(0, decimalToNumber(childcareData.summary.deductibleAmount) - 2_500_000),
      } : undefined,
      other: otherData?.summary ? {
        deductibleAmount: decimalToNumber(otherData.summary.deductibleAmount),
        maxDeduction: decimalToNumber(otherData.summary.deductibleAmount),
        excessAmount: 0,
      } : undefined,
    });
  };

  const combinedResult = calculateCombinedResult();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">証明書が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6 no-print">
          <h1 className="text-3xl font-bold text-gray-900">増改築等工事証明書 プレビュー</h1>
          <Link
            href={`/certificate/${certificateId}`}
            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
          >
            ← 証明書詳細へ戻る
          </Link>
        </div>

        {/* 証明書本体 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-center mb-8 border-b-2 border-gray-300 pb-4">
            増改築等工事証明書
          </h2>

          {/* 基本情報セクション */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4 bg-gray-100 p-3 rounded">基本情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
              <div>
                <span className="font-medium text-gray-700">証明申請者:</span>
                <span className="ml-2">{certificate.applicantName}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">住所:</span>
                <span className="ml-2">{certificate.applicantAddress}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">家屋番号:</span>
                <span className="ml-2">{certificate.propertyNumber || '（未記入）'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">物件所在地:</span>
                <span className="ml-2">{certificate.propertyAddress}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">工事完了年月日:</span>
                <span className="ml-2">{new Date(certificate.completionDate).toLocaleDateString('ja-JP')}</span>
              </div>
            </div>
          </section>

          {/* 証明書の用途 */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4 bg-indigo-100 p-3 rounded">（１）証明書の用途</h3>
            <div className="pl-4">
              <div className="text-lg font-medium text-indigo-900 mb-4">
                {getPurposeTypeLabel(certificate.purposeType)}
              </div>

              {/* 用途詳細 */}
              <div className="mt-4 space-y-4">
                {/* reform_tax */}
                {certificate.purposeType === 'reform_tax' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">制度概要</h4>
                      <p className="text-sm text-gray-700">
                        住宅ローンを利用せず、自己資金で特定の改修工事（バリアフリー、省エネ、同居対応、子育て対応）を行った場合に、標準的な工事費用相当額の10%を所得税額から控除できる制度（投資型減税）です。
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">適用要件</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>特定改修工事の標準的な工事費用相当額が50万円を超えること</li>
                        <li>自己の居住用住宅であること</li>
                        <li>工事後6か月以内に居住を開始すること</li>
                        <li>床面積が50㎡以上であること</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">控除額</h4>
                      <p className="text-sm text-gray-700">
                        標準的な工事費用相当額（上限1,000万円）の10%を、その年の所得税額から控除できます。
                      </p>
                    </div>
                  </div>
                )}

                {/* housing_loan */}
                {certificate.purposeType === 'housing_loan' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">制度概要</h4>
                      <p className="text-sm text-gray-700">
                        住宅ローンを利用して一定の増改築等工事を行った場合に、年末の住宅ローン残高の一定割合を所得税額から控除できる制度です。
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">適用要件</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>工事費用が100万円を超えること</li>
                        <li>10年以上のローンを利用すること</li>
                        <li>自己の居住用住宅であること</li>
                        <li>床面積が50㎡以上であること</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* resale */}
                {certificate.purposeType === 'resale' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">制度概要</h4>
                      <p className="text-sm text-gray-700">
                        中古住宅の売買において、既存住宅売買瑕疵保険に加入するために必要な証明書です。住宅の性能が一定の基準を満たしていることを証明します。
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">活用目的</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>既存住宅売買瑕疵保険の加入</li>
                        <li>住宅ローン減税の適用（築年数要件の緩和）</li>
                        <li>登録免許税・不動産取得税の軽減</li>
                        <li>贈与税の非課税枠拡大</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* property_tax */}
                {certificate.purposeType === 'property_tax' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">制度概要</h4>
                      <p className="text-sm text-gray-700">
                        耐震改修工事を行った住宅について、固定資産税を一定期間減額する制度です。
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">適用要件</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>昭和57年1月1日以前から存在する住宅であること</li>
                        <li>現行の耐震基準に適合する耐震改修を行うこと</li>
                        <li>工事費用が50万円を超えること</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">減額内容</h4>
                      <p className="text-sm text-gray-700">
                        家屋の固定資産税額（120㎡相当分まで）の2分の1を、改修後一定期間減額します。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 住宅借入金等特別控除の詳細 */}
          {certificate.purposeType === 'housing_loan' && housingLoanDetail && (
            <section className="mb-8">
              <h3 className="text-lg font-semibold mb-4 bg-blue-100 p-3 rounded">
                住宅借入金等特別控除 詳細情報
              </h3>

              {/* (1) 実施した工事の種別 */}
              <div className="mb-6 bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="text-xl font-semibold mb-4 text-blue-900">(1) 実施した工事の種別</h4>

                {/* 第1号工事 */}
                {housingLoanDetail.workTypes?.work1 && (housingLoanDetail.workTypes.work1.extension ||
                  housingLoanDetail.workTypes.work1.renovation ||
                  housingLoanDetail.workTypes.work1.majorRepair ||
                  housingLoanDetail.workTypes.work1.majorRemodeling) && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h5 className="font-bold text-base mb-2 text-blue-800">第1号工事</h5>
                    <div className="space-y-1 ml-4">
                      {housingLoanDetail.workTypes.work1.extension && <p className="text-sm">✓ 1 増築</p>}
                      {housingLoanDetail.workTypes.work1.renovation && <p className="text-sm">✓ 2 改築</p>}
                      {housingLoanDetail.workTypes.work1.majorRepair && <p className="text-sm">✓ 3 大規模の修繕</p>}
                      {housingLoanDetail.workTypes.work1.majorRemodeling && <p className="text-sm">✓ 4 大規模の模様替</p>}
                    </div>
                  </div>
                )}

                {/* 第2号工事 */}
                {housingLoanDetail.workTypes?.work2 && (housingLoanDetail.workTypes.work2.floorOverHalf ||
                  housingLoanDetail.workTypes.work2.stairOverHalf ||
                  housingLoanDetail.workTypes.work2.partitionOverHalf ||
                  housingLoanDetail.workTypes.work2.wallOverHalf) && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h5 className="font-bold text-base mb-2 text-blue-800">第2号工事</h5>
                    <p className="text-xs text-gray-600 mb-2">
                      1棟の家屋でその構造上区分された数個の部分を独立して住居その他の用途に供することができるもののうちその者が区分所有する部分について行う次のいずれかに該当する修繕又は模様替
                    </p>
                    <div className="space-y-1 ml-4">
                      {housingLoanDetail.workTypes.work2.floorOverHalf && <p className="text-sm">✓ 1 床の過半の修繕又は模様替</p>}
                      {housingLoanDetail.workTypes.work2.stairOverHalf && <p className="text-sm">✓ 2 階段の過半の修繕又は模様替</p>}
                      {housingLoanDetail.workTypes.work2.partitionOverHalf && <p className="text-sm">✓ 3 間仕切壁の過半の修繕又は模様替</p>}
                      {housingLoanDetail.workTypes.work2.wallOverHalf && <p className="text-sm">✓ 4 壁の過半の修繕又は模様替</p>}
                    </div>
                  </div>
                )}

                {/* 第3号工事 */}
                {housingLoanDetail.workTypes?.work3 && (housingLoanDetail.workTypes.work3.livingRoom ||
                  housingLoanDetail.workTypes.work3.kitchen ||
                  housingLoanDetail.workTypes.work3.bathroom ||
                  housingLoanDetail.workTypes.work3.toilet ||
                  housingLoanDetail.workTypes.work3.washroom ||
                  housingLoanDetail.workTypes.work3.storage ||
                  housingLoanDetail.workTypes.work3.entrance ||
                  housingLoanDetail.workTypes.work3.corridor) && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h5 className="font-bold text-base mb-2 text-blue-800">第3号工事</h5>
                    <p className="text-xs text-gray-600 mb-2">
                      次のいずれか一室の床又は壁の全部の修繕又は模様替
                    </p>
                    <div className="grid grid-cols-2 gap-1 ml-4">
                      {housingLoanDetail.workTypes.work3.livingRoom && <p className="text-sm">✓ 1 居室</p>}
                      {housingLoanDetail.workTypes.work3.kitchen && <p className="text-sm">✓ 2 調理室</p>}
                      {housingLoanDetail.workTypes.work3.bathroom && <p className="text-sm">✓ 3 浴室</p>}
                      {housingLoanDetail.workTypes.work3.toilet && <p className="text-sm">✓ 4 便所</p>}
                      {housingLoanDetail.workTypes.work3.washroom && <p className="text-sm">✓ 5 洗面所</p>}
                      {housingLoanDetail.workTypes.work3.storage && <p className="text-sm">✓ 6 納戸</p>}
                      {housingLoanDetail.workTypes.work3.entrance && <p className="text-sm">✓ 7 玄関</p>}
                      {housingLoanDetail.workTypes.work3.corridor && <p className="text-sm">✓ 8 廊下</p>}
                    </div>
                  </div>
                )}

                {/* 第4号工事 */}
                {housingLoanDetail.workTypes?.work4 && (housingLoanDetail.workTypes.work4.buildingStandard ||
                  housingLoanDetail.workTypes.work4.earthquakeSafety) && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h5 className="font-bold text-base mb-2 text-blue-800">第4号工事（耐震改修工事）</h5>
                    <p className="text-xs text-gray-600 mb-2">
                      次の規定又は基準に適合させるための修繕又は模様替
                    </p>
                    <div className="space-y-1 ml-4">
                      {housingLoanDetail.workTypes.work4.buildingStandard && <p className="text-sm">✓ 1 建築基準法施行令第3章及び第5章の4の規定</p>}
                      {housingLoanDetail.workTypes.work4.earthquakeSafety && <p className="text-sm">✓ 2 地震に対する安全性に係る基準</p>}
                    </div>
                  </div>
                )}

                {/* 第5号工事 */}
                {housingLoanDetail.workTypes?.work5 && (housingLoanDetail.workTypes.work5.pathwayExpansion ||
                  housingLoanDetail.workTypes.work5.stairSlope ||
                  housingLoanDetail.workTypes.work5.bathroomImprovement ||
                  housingLoanDetail.workTypes.work5.toiletImprovement ||
                  housingLoanDetail.workTypes.work5.handrails ||
                  housingLoanDetail.workTypes.work5.stepElimination ||
                  housingLoanDetail.workTypes.work5.doorImprovement ||
                  housingLoanDetail.workTypes.work5.floorSlipPrevention) && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h5 className="font-bold text-base mb-2 text-blue-800">第5号工事（バリアフリー改修工事）</h5>
                    <p className="text-xs text-gray-600 mb-2">
                      高齢者等が自立した日常生活を営むのに必要な構造及び設備の基準に適合させるための次のいずれかに該当する修繕又は模様替
                    </p>
                    <div className="grid grid-cols-2 gap-1 ml-4">
                      {housingLoanDetail.workTypes.work5.pathwayExpansion && <p className="text-sm">✓ 1 通路又は出入口の拡幅</p>}
                      {housingLoanDetail.workTypes.work5.stairSlope && <p className="text-sm">✓ 2 階段の勾配の緩和</p>}
                      {housingLoanDetail.workTypes.work5.bathroomImprovement && <p className="text-sm">✓ 3 浴室の改良</p>}
                      {housingLoanDetail.workTypes.work5.toiletImprovement && <p className="text-sm">✓ 4 便所の改良</p>}
                      {housingLoanDetail.workTypes.work5.handrails && <p className="text-sm">✓ 5 手すりの設置</p>}
                      {housingLoanDetail.workTypes.work5.stepElimination && <p className="text-sm">✓ 6 床の段差の解消</p>}
                      {housingLoanDetail.workTypes.work5.doorImprovement && <p className="text-sm">✓ 7 出入口戸の改良</p>}
                      {housingLoanDetail.workTypes.work5.floorSlipPrevention && <p className="text-sm">✓ 8 床材の滑り改良</p>}
                    </div>
                  </div>
                )}

                {/* 第6号工事 */}
                {housingLoanDetail.workTypes?.work6 && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h5 className="font-bold text-base mb-2 text-blue-800">第6号工事（省エネ改修工事）</h5>
                    <p className="text-sm text-gray-600 ml-4">※ 省エネ改修工事が選択されています</p>
                  </div>
                )}
              </div>

              {/* (2) 実施した工事の内容 */}
              {housingLoanDetail.workDescription && (
                <div className="mb-6 bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="text-xl font-semibold mb-4 text-blue-900">(2) 実施した工事の内容</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{housingLoanDetail.workDescription}</p>
                  </div>
                </div>
              )}

              {/* (3) 実施した工事の費用の概要 */}
              <div className="mb-6 bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="text-xl font-semibold mb-4 text-blue-900">(3) 実施した工事の費用の概要</h4>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 mb-1">① 第1号工事〜第6号工事に要した費用の額</p>
                    <p className="text-2xl font-bold text-gray-900">¥{housingLoanDetail.totalCost.toLocaleString()}</p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 mb-1">② 補助金等の交付</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {housingLoanDetail.hasSubsidy ? '有' : '無'}
                    </p>
                    {housingLoanDetail.hasSubsidy && (
                      <p className="text-xl font-bold text-red-600 mt-1">
                        - ¥{housingLoanDetail.subsidyAmount.toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                    <p className="text-sm text-blue-700 mb-1">③ 控除対象額（①から②を差し引いた額）</p>
                    <p className="text-3xl font-bold text-blue-600">¥{housingLoanDetail.deductibleAmount.toLocaleString()}</p>
                    {housingLoanDetail.deductibleAmount >= 1_000_000 ? (
                      <p className="text-sm text-green-700 mt-2">✓ 控除対象額が100万円以上です</p>
                    ) : (
                      <p className="text-sm text-red-700 mt-2">⚠ 控除対象額が100万円未満です</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* （３）実施した工事の費用の額等 */}
          {(seismicData || barrierFreeData || energyData || cohabitationData || childcareData || otherData) && (
            <section className="mb-8">
              <h3 className="text-lg font-semibold mb-4 bg-green-100 p-3 rounded">
                （３）実施した工事の費用の額等
              </h3>

              {/* ① 耐震改修 */}
              {seismicData?.summary && (
                <div className="mb-6 pl-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-red-600">🏗️</span>
                    ① 耐震改修
                  </h4>
                  <div className="bg-red-50 p-4 rounded space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">ア: 工事費総額</span>
                        <div className="font-semibold">¥{decimalToNumber(seismicData.summary.totalAmount).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">イ: 補助金額</span>
                        <div className="font-semibold">¥{decimalToNumber(seismicData.summary.subsidyAmount).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">ウ: 補助金差引後</span>
                        <div className="font-semibold">¥{decimalToNumber(seismicData.summary.deductibleAmount).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">エ: 上限適用後（250万円）</span>
                        <div className="font-bold text-red-700">
                          ¥{Math.min(decimalToNumber(seismicData.summary.deductibleAmount), 2_500_000).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">オ: 超過額</span>
                        <div className="font-semibold">
                          ¥{Math.max(0, decimalToNumber(seismicData.summary.deductibleAmount) - 2_500_000).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ② バリアフリー改修 */}
              {barrierFreeData?.summary && (
                <div className="mb-6 pl-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-purple-600">♿</span>
                    ② バリアフリー改修
                  </h4>
                  <div className="bg-purple-50 p-4 rounded space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">ア: 工事費総額</span>
                        <div className="font-semibold">¥{decimalToNumber(barrierFreeData.summary.totalAmount).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">イ: 補助金額</span>
                        <div className="font-semibold">¥{decimalToNumber(barrierFreeData.summary.subsidyAmount).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">ウ: 補助金差引後（50万円超の場合のみ）</span>
                        <div className="font-semibold">¥{decimalToNumber(barrierFreeData.summary.deductibleAmount).toLocaleString()}</div>
                        {decimalToNumber(barrierFreeData.summary.deductibleAmount) === 0 &&
                         decimalToNumber(barrierFreeData.summary.totalAmount) > 0 && (
                          <div className="text-xs text-yellow-600 mt-1">⚠️ 50万円以下のため控除対象外</div>
                        )}
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">エ: 上限適用後（200万円）</span>
                        <div className="font-bold text-purple-700">
                          ¥{Math.min(decimalToNumber(barrierFreeData.summary.deductibleAmount), 2_000_000).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">オ: 超過額</span>
                        <div className="font-semibold">
                          ¥{Math.max(0, decimalToNumber(barrierFreeData.summary.deductibleAmount) - 2_000_000).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ③ 省エネ改修 */}
              {energyData?.summary && (
                <div className="mb-6 pl-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-green-600">🌱</span>
                    ③ 省エネ改修
                    {energyData.summary.hasSolarPower && (
                      <span className="text-xs bg-yellow-200 px-2 py-1 rounded">太陽光発電設備有り</span>
                    )}
                  </h4>
                  <div className="bg-green-50 p-4 rounded space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">ア: 工事費総額</span>
                        <div className="font-semibold">¥{decimalToNumber(energyData.summary.totalAmount).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">イ: 補助金額</span>
                        <div className="font-semibold">¥{decimalToNumber(energyData.summary.subsidyAmount).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">ウ: 補助金差引後（50万円超の場合のみ）</span>
                        <div className="font-semibold">¥{decimalToNumber(energyData.summary.deductibleAmount).toLocaleString()}</div>
                        {decimalToNumber(energyData.summary.deductibleAmount) === 0 &&
                         decimalToNumber(energyData.summary.totalAmount) > 0 && (
                          <div className="text-xs text-yellow-600 mt-1">⚠️ 50万円以下のため控除対象外</div>
                        )}
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">
                          エ: 上限適用後（{energyData.summary.hasSolarPower ? '350万円' : '250万円'}）
                        </span>
                        <div className="font-bold text-green-700">
                          ¥{Math.min(
                            decimalToNumber(energyData.summary.deductibleAmount),
                            energyData.summary.hasSolarPower ? 3_500_000 : 2_500_000
                          ).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">オ: 超過額</span>
                        <div className="font-semibold">
                          ¥{Math.max(
                            0,
                            decimalToNumber(energyData.summary.deductibleAmount) - (energyData.summary.hasSolarPower ? 3_500_000 : 2_500_000)
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ④ 同居対応改修 */}
              {cohabitationData?.summary && (
                <div className="mb-6 pl-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-blue-600">👨‍👩‍👧‍👦</span>
                    ④ 同居対応改修
                  </h4>
                  <div className="bg-blue-50 p-4 rounded space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">ア: 工事費総額</span>
                        <div className="font-semibold">¥{decimalToNumber(cohabitationData.summary.totalAmount).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">イ: 補助金額</span>
                        <div className="font-semibold">¥{decimalToNumber(cohabitationData.summary.subsidyAmount).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">ウ: 補助金差引後（50万円超の場合のみ）</span>
                        <div className="font-semibold">¥{decimalToNumber(cohabitationData.summary.deductibleAmount).toLocaleString()}</div>
                        {decimalToNumber(cohabitationData.summary.deductibleAmount) === 0 &&
                         decimalToNumber(cohabitationData.summary.totalAmount) > 0 && (
                          <div className="text-xs text-yellow-600 mt-1">⚠️ 50万円以下のため控除対象外</div>
                        )}
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">エ: 上限適用後（250万円）</span>
                        <div className="font-bold text-blue-700">
                          ¥{Math.min(decimalToNumber(cohabitationData.summary.deductibleAmount), 2_500_000).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">オ: 超過額</span>
                        <div className="font-semibold">
                          ¥{Math.max(0, decimalToNumber(cohabitationData.summary.deductibleAmount) - 2_500_000).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ⑦ 子育て対応改修 */}
              {childcareData?.summary && (
                <div className="mb-6 pl-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-pink-600">👶</span>
                    ⑦ 子育て対応改修
                  </h4>
                  <div className="bg-pink-50 p-4 rounded space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">ア: 工事費総額</span>
                        <div className="font-semibold">¥{decimalToNumber(childcareData.summary.totalAmount).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">イ: 補助金額</span>
                        <div className="font-semibold">¥{decimalToNumber(childcareData.summary.subsidyAmount).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">ウ: 補助金差引後（50万円超の場合のみ）</span>
                        <div className="font-semibold">¥{decimalToNumber(childcareData.summary.deductibleAmount).toLocaleString()}</div>
                        {decimalToNumber(childcareData.summary.deductibleAmount) === 0 &&
                         decimalToNumber(childcareData.summary.totalAmount) > 0 && (
                          <div className="text-xs text-yellow-600 mt-1">⚠️ 50万円以下のため控除対象外</div>
                        )}
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">エ: 上限適用後（250万円）</span>
                        <div className="font-bold text-pink-700">
                          ¥{Math.min(decimalToNumber(childcareData.summary.deductibleAmount), 2_500_000).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">オ: 超過額</span>
                        <div className="font-semibold">
                          ¥{Math.max(0, decimalToNumber(childcareData.summary.deductibleAmount) - 2_500_000).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 統合計算結果 */}
              {combinedResult && (
                <div className="mb-6 pl-4">
                  <h4 className="font-semibold text-gray-800 mb-3">複数制度の組み合わせ計算</h4>
                  <div className="bg-indigo-50 p-4 rounded space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">⑰ 最大控除額（10%控除分）</span>
                        <div className="font-bold text-xl text-indigo-700">
                          ¥{combinedResult.maxControlAmount.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">⑱ 最大工事費</span>
                        <div className="font-semibold">¥{combinedResult.totalDeductible.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">⑲ 超過額</span>
                        <div className="font-semibold">¥{combinedResult.excessAmount.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">㉒ 残り控除可能枠（1,000万円上限）</span>
                        <div className="font-semibold text-green-700">¥{combinedResult.remaining.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ⑳ その他増改築 */}
              {otherData?.summary && (
                <div className="mb-6 pl-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-gray-600">🔨</span>
                    ⑳ その他増改築等工事
                  </h4>
                  <div className="bg-gray-50 p-4 rounded space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">⑳ア: 工事費総額</span>
                        <div className="font-semibold">¥{decimalToNumber(otherData.summary.totalAmount).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">⑳イ: 補助金額</span>
                        <div className="font-semibold">¥{decimalToNumber(otherData.summary.subsidyAmount).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">⑳ウ: 補助金差引後</span>
                        <div className="font-bold text-gray-700">
                          ¥{decimalToNumber(otherData.summary.deductibleAmount).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ㉑ 最終控除対象額 */}
              {combinedResult && otherData?.summary && (
                <div className="mb-6 pl-4">
                  <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-4 rounded-lg">
                    <div className="text-center">
                      <span className="text-sm text-gray-700 block mb-2">㉑ 最終控除対象額（⑱ + ⑳ウ）</span>
                      <div className="font-bold text-3xl text-indigo-900">
                        ¥{combinedResult.finalDeductible.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 発行者情報 */}
          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4 bg-gray-100 p-3 rounded">証明書発行者情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
              <div>
                <span className="font-medium text-gray-700">発行者氏名:</span>
                <span className="ml-2">{certificate.issuerName || '（未記入）'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">事務所名:</span>
                <span className="ml-2">{certificate.issuerOfficeName || '（未記入）'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">組織種別:</span>
                <span className="ml-2">{certificate.issuerOrganizationType || '（未記入）'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">資格番号:</span>
                <span className="ml-2">{certificate.issuerQualificationNumber || '（未記入）'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">発行日:</span>
                <span className="ml-2">
                  {certificate.issueDate ? new Date(certificate.issueDate).toLocaleDateString('ja-JP') : '（未記入）'}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-4 justify-center no-print">
          <Link
            href={`/certificate/${certificateId}`}
            className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 transition-colors"
          >
            ← 詳細ページへ戻る
          </Link>
          <button
            onClick={() => window.print()}
            className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition-colors"
          >
            🖨️ 印刷
          </button>
        </div>
      </div>

      {/* 印刷用CSS */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            background: white !important;
          }
          .bg-gradient-to-br,
          .bg-gray-50 {
            background: white !important;
          }
          .shadow,
          .shadow-sm,
          .shadow-md,
          .shadow-lg {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
