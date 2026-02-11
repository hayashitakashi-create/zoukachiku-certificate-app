'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { certificateStore, type Certificate } from '@/lib/store';

export default function CertificatePreviewPage() {
  const params = useParams();
  const certificateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<Certificate | null>(null);

  useEffect(() => {
    const loadCertificate = async () => {
      try {
        const cert = await certificateStore.getCertificate(certificateId);
        setCertificate(cert || null);
      } catch (error) {
        console.error('Failed to load certificate:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCertificate();
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

  // 統合計算結果を計算（Excel Row 442-461 準拠）
  const calculateCombinedResult = () => {
    if (!certificate) return null;

    const { seismic, barrierFree, energySaving, cohabitation, childcare, otherRenovation, longTermHousing } = certificate.works;

    // いずれかの工事データがあるかチェック
    if (!seismic?.summary && !barrierFree?.summary && !energySaving?.summary &&
        !cohabitation?.summary && !childcare?.summary && !longTermHousing?.summary) {
      return null;
    }

    const hasSolar = energySaving?.summary?.hasSolarPower || false;

    // ====== 各工事の ウ(deductibleAmount), エ(maxDeduction), オ(excessAmount) ======

    // ① 耐震: 上限250万, 50万超要件なし
    const s_ウ = seismic?.summary?.deductibleAmount ?? 0;
    const s_エ = Math.min(s_ウ, 2_500_000);
    const s_オ = Math.max(0, s_ウ - s_エ);

    // ② バリアフリー: 上限200万, 50万超要件
    const bf_ウ = barrierFree?.summary?.deductibleAmount ?? 0;
    const bf_エ = Math.min(bf_ウ, 2_000_000);
    const bf_オ = Math.max(0, bf_ウ - bf_エ);

    // ③ 省エネ: 上限250/350万(太陽光), 50万超要件
    const e_ウ = energySaving?.summary?.deductibleAmount ?? 0;
    const e_limit = hasSolar ? 3_500_000 : 2_500_000;
    const e_エ = Math.min(e_ウ, e_limit);
    const e_オ = Math.max(0, e_ウ - e_エ);

    // ④ 同居対応: 上限250万, 50万超要件
    const co_ウ = cohabitation?.summary?.deductibleAmount ?? 0;
    const co_エ = Math.min(co_ウ, 2_500_000);
    const co_オ = Math.max(0, co_ウ - co_エ);

    // ⑦ 子育て: 上限250万, 50万超要件
    const cc_ウ = childcare?.summary?.deductibleAmount ?? 0;
    const cc_エ = Math.min(cc_ウ, 2_500_000);
    const cc_オ = Math.max(0, cc_ウ - cc_エ);

    // ⑤ 長期優良OR: 太陽光無=250万, 太陽光有=350万
    const ltSummary = longTermHousing?.summary;
    const isExcellent = ltSummary?.isExcellentHousing || false;
    const ltOr_ウ = (!isExcellent && ltSummary) ? ltSummary.deductibleAmount : 0;
    const ltOr_limit = hasSolar ? 3_500_000 : 2_500_000;
    const ltOr_エ = Math.min(ltOr_ウ, ltOr_limit);
    const ltOr_オ = Math.max(0, ltOr_ウ - ltOr_エ);

    // ⑥ 長期優良AND: 太陽光無=500万, 太陽光有=600万
    const ltAnd_ウ = (isExcellent && ltSummary) ? ltSummary.deductibleAmount : 0;
    const ltAnd_limit = hasSolar ? 6_000_000 : 5_000_000;
    const ltAnd_エ = Math.min(ltAnd_ウ, ltAnd_limit);
    const ltAnd_オ = Math.max(0, ltAnd_ウ - ltAnd_エ);

    // ====== パターン比較（Excel Row 442-453） ======

    // パターン1: ⑧=①ウ+②ウ+③ウ+④ウ+⑦ウ, ⑨=①エ+②エ+③エ+④エ+⑦エ, ⑩=①オ+②オ+③オ+④オ+⑦オ
    const p1_ウ = s_ウ + bf_ウ + e_ウ + co_ウ + cc_ウ;
    const p1_エ = s_エ + bf_エ + e_エ + co_エ + cc_エ;
    const p1_オ = s_オ + bf_オ + e_オ + co_オ + cc_オ;

    // パターン2: ⑪=②ウ+④ウ+⑤ウ+⑦ウ, ⑫=②エ+④エ+⑤エ+⑦エ, ⑬=②オ+④オ+⑤オ+⑦オ
    const p2_ウ = bf_ウ + co_ウ + ltOr_ウ + cc_ウ;
    const p2_エ = bf_エ + co_エ + ltOr_エ + cc_エ;
    const p2_オ = bf_オ + co_オ + ltOr_オ + cc_オ;

    // パターン3: ⑭=②ウ+④ウ+⑥ウ+⑦ウ, ⑮=②エ+④エ+⑥エ+⑦エ, ⑯=②オ+④オ+⑥オ+⑦オ
    const p3_ウ = bf_ウ + co_ウ + ltAnd_ウ + cc_ウ;
    const p3_エ = bf_エ + co_エ + ltAnd_エ + cc_エ;
    const p3_オ = bf_オ + co_オ + ltAnd_オ + cc_オ;

    // ⑰ = MAX(⑨, ⑫, ⑮): 最大控除額（10%控除分）
    let maxControlAmount = Math.max(p1_エ, p2_エ, p3_エ);

    // ⑱ = MAX(⑧, ⑪, ⑭): 最大工事費
    const totalDeductible = Math.max(p1_ウ, p2_ウ, p3_ウ);

    // ⑲: ⑱に対応するパターンの超過額（⑱の金額に係る額）
    let excessAmount: number;
    if (totalDeductible === p3_ウ && p3_ウ > 0) {
      excessAmount = p3_オ;
    } else if (totalDeductible === p2_ウ && p2_ウ > 0) {
      excessAmount = p2_オ;
    } else {
      excessAmount = p1_オ;
    }

    // ⑰は1,000万円上限
    const TOTAL_LIMIT = 10_000_000;
    if (maxControlAmount > TOTAL_LIMIT) {
      maxControlAmount = TOTAL_LIMIT;
    }

    // ⑳ウ: その他増改築の控除対象額
    const otherAmount = otherRenovation?.summary?.deductibleAmount ?? 0;

    // ㉑: 5%控除の基礎額（公式記入例準拠）
    // ⑲+⑳ウ > 0 の場合: MIN(⑱, ⑲+⑳ウ)
    // ⑲+⑳ウ = 0 の場合: ⑱（全額が5%控除の基礎）
    let finalDeductible: number;
    if (totalDeductible <= 0) {
      finalDeductible = 0;
    } else if (excessAmount + otherAmount > 0) {
      finalDeductible = Math.min(totalDeductible, excessAmount + otherAmount);
    } else {
      finalDeductible = totalDeductible;
    }

    // ㉒ = MAX(0, 1,000万 - ⑰): 残り控除可能枠
    const remaining = Math.max(0, TOTAL_LIMIT - maxControlAmount);

    // ㉓ = MIN(㉑, ㉒): 5%控除分
    const fivePercentDeductible = Math.min(finalDeductible, remaining);

    // 採用パターン判定
    let bestPattern = 1;
    if (maxControlAmount === p3_エ && p3_エ > 0) bestPattern = 3;
    else if (maxControlAmount === p2_エ && p2_エ > 0) bestPattern = 2;

    return {
      // パターン個別値
      p1_ウ, p1_エ, p1_オ,
      p2_ウ, p2_エ, p2_オ,
      p3_ウ, p3_エ, p3_オ,
      bestPattern,
      // 最終値
      maxControlAmount,     // ⑰
      totalDeductible,      // ⑱
      excessAmount,         // ⑲
      finalDeductible,      // ㉑
      remaining,            // ㉒
      fivePercentDeductible,// ㉓
    };
  };

  const combinedResult = calculateCombinedResult();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/30 flex items-center justify-center">
        <div className="text-lg text-stone-600">読み込み中...</div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/30 flex items-center justify-center">
        <div className="text-lg text-red-600">証明書が見つかりません</div>
      </div>
    );
  }

  const { works, housingLoanDetail } = certificate;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/30">
      {/* ヘッダー */}
      <header className="bg-white/90 border-b border-stone-200 sticky top-0 z-50 backdrop-blur-xl no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-stone-800 to-amber-900 bg-clip-text text-transparent">増改築等工事証明書 プレビュー</h1>
          <Link
            href={`/certificate/${certificateId}`}
            className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full h-10 px-4 flex items-center transition-colors text-sm font-medium"
          >
            &larr; 証明書詳細へ戻る
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* 証明書本体 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-4 sm:p-6 md:p-8 mb-6 transition-all hover:shadow-2xl hover:shadow-stone-300/50">
          <h2 className="text-2xl font-bold text-center mb-8 border-b-2 border-stone-200 pb-4 text-stone-800">
            増改築等工事証明書
          </h2>

          {/* 基本情報セクション */}
          <section className="mb-8">
            <h3 className="text-lg font-bold text-stone-800 mb-4 bg-gradient-to-r from-amber-50 to-stone-50 p-4 rounded-2xl">基本情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
              <div>
                <span className="text-sm font-semibold text-stone-500">証明申請者:</span>
                <span className="ml-2 text-stone-900">{certificate.applicantName}</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-stone-500">住所:</span>
                <span className="ml-2 text-stone-900">{certificate.applicantAddress}</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-stone-500">家屋番号:</span>
                <span className="ml-2 text-stone-900">{certificate.propertyNumber || '（未記入）'}</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-stone-500">物件所在地:</span>
                <span className="ml-2 text-stone-900">{certificate.propertyAddress}</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-stone-500">工事完了年月日:</span>
                <span className="ml-2 text-stone-900">{new Date(certificate.completionDate).toLocaleDateString('ja-JP')}</span>
              </div>
            </div>
          </section>

          {/* 証明書の用途 */}
          <section className="mb-8">
            <h3 className="text-lg font-bold text-stone-800 mb-4 bg-gradient-to-r from-amber-50 to-stone-50 p-4 rounded-2xl">（１）証明書の用途</h3>
            <div className="pl-4">
              <div className="text-lg font-medium text-stone-800 mb-4">
                {getPurposeTypeLabel(certificate.purposeType)}
              </div>

              {/* 用途詳細 */}
              <div className="mt-4 space-y-4">
                {/* reform_tax */}
                {certificate.purposeType === 'reform_tax' && (
                  <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-4 space-y-3">
                    <div>
                      <h4 className="font-semibold text-stone-800 mb-2">制度概要</h4>
                      <p className="text-sm text-stone-600">
                        住宅ローンを利用せず、自己資金で特定の改修工事（バリアフリー、省エネ、同居対応、子育て対応）を行った場合に、標準的な工事費用相当額の10%を所得税額から控除できる制度（投資型減税）です。
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-stone-800 mb-2">適用要件</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-stone-600">
                        <li>特定改修工事の標準的な工事費用相当額が50万円を超えること</li>
                        <li>自己の居住用住宅であること</li>
                        <li>工事後6か月以内に居住を開始すること</li>
                        <li>床面積が50㎡以上であること</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-stone-800 mb-2">控除額</h4>
                      <p className="text-sm text-stone-600">
                        標準的な工事費用相当額（上限1,000万円）の10%を、その年の所得税額から控除できます。
                      </p>
                    </div>
                  </div>
                )}

                {/* housing_loan */}
                {certificate.purposeType === 'housing_loan' && (
                  <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-4 space-y-3">
                    <div>
                      <h4 className="font-semibold text-stone-800 mb-2">制度概要</h4>
                      <p className="text-sm text-stone-600">
                        住宅ローンを利用して一定の増改築等工事を行った場合に、年末の住宅ローン残高の一定割合を所得税額から控除できる制度です。
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-stone-800 mb-2">適用要件</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-stone-600">
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
                  <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-4 space-y-3">
                    <div>
                      <h4 className="font-semibold text-stone-800 mb-2">制度概要</h4>
                      <p className="text-sm text-stone-600">
                        中古住宅の売買において、既存住宅売買瑕疵保険に加入するために必要な証明書です。住宅の性能が一定の基準を満たしていることを証明します。
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-stone-800 mb-2">活用目的</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-stone-600">
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
                  <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-4 space-y-3">
                    <div>
                      <h4 className="font-semibold text-stone-800 mb-2">制度概要</h4>
                      <p className="text-sm text-stone-600">
                        耐震改修工事を行った住宅について、固定資産税を一定期間減額する制度です。
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-stone-800 mb-2">適用要件</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-stone-600">
                        <li>昭和57年1月1日以前から存在する住宅であること</li>
                        <li>現行の耐震基準に適合する耐震改修を行うこと</li>
                        <li>工事費用が50万円を超えること</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-stone-800 mb-2">減額内容</h4>
                      <p className="text-sm text-stone-600">
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
              <h3 className="text-lg font-bold text-stone-800 mb-4 bg-gradient-to-r from-amber-50 to-stone-50 p-4 rounded-2xl">
                住宅借入金等特別控除 詳細情報
              </h3>

              {/* (1) 実施した工事の種別 */}
              <div className="mb-6 bg-white border-2 border-stone-200 rounded-2xl p-5">
                <h4 className="text-xl font-semibold mb-4 text-stone-800">(1) 実施した工事の種別</h4>

                {(() => {
                  const workTypeLabels: Record<string, string> = {
                    work1: '第1号工事（増築・改築・大規模修繕・大規模模様替）',
                    work2: '第2号工事（区分所有部分の修繕又は模様替）',
                    work3: '第3号工事（一室の床又は壁の全部の修繕又は模様替）',
                    work4: '第4号工事（耐震改修工事）',
                    work5: '第5号工事（バリアフリー改修工事）',
                    work6: '第6号工事（省エネ改修工事）',
                  };
                  const selectedWorks = Object.entries(housingLoanDetail.workTypes)
                    .filter(([, v]) => v?.selected)
                    .map(([k]) => k);

                  return selectedWorks.length > 0 ? (
                    <div className="space-y-2">
                      {selectedWorks.map((key) => (
                        <div key={key} className="p-3 bg-gradient-to-r from-amber-50 to-stone-50 rounded-2xl">
                          <p className="text-sm font-medium text-stone-800">
                            {workTypeLabels[key] || key}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-stone-500">工事種別が選択されていません</p>
                  );
                })()}
              </div>

              {/* (2) 実施した工事の内容 */}
              {housingLoanDetail.workDescription && (
                <div className="mb-6 bg-white border-2 border-stone-200 rounded-2xl p-5">
                  <h4 className="text-xl font-semibold mb-4 text-stone-800">(2) 実施した工事の内容</h4>
                  <div className="p-3 bg-gradient-to-r from-amber-50 to-stone-50 rounded-2xl">
                    <p className="text-sm whitespace-pre-wrap text-stone-800">{housingLoanDetail.workDescription}</p>
                  </div>
                </div>
              )}

              {/* (3) 実施した工事の費用の概要 */}
              <div className="mb-6 bg-white border-2 border-stone-200 rounded-2xl p-5">
                <h4 className="text-xl font-semibold mb-4 text-stone-800">(3) 実施した工事の費用の概要</h4>
                <div className="space-y-4">
                  <div className="p-3 bg-gradient-to-r from-amber-50 to-stone-50 rounded-2xl">
                    <p className="text-sm text-stone-600 mb-1">① 第1号工事〜第6号工事に要した費用の額</p>
                    <p className="text-2xl font-bold text-stone-900">{housingLoanDetail.totalCost.toLocaleString()}円</p>
                  </div>

                  <div className="p-3 bg-gradient-to-r from-amber-50 to-stone-50 rounded-2xl">
                    <p className="text-sm text-stone-600 mb-1">② 補助金等の交付</p>
                    <p className="text-lg font-semibold text-stone-900">
                      {housingLoanDetail.hasSubsidy ? '有' : '無'}
                    </p>
                    {housingLoanDetail.hasSubsidy && (
                      <p className="text-xl font-bold text-red-600 mt-1">
                        - {housingLoanDetail.subsidyAmount.toLocaleString()}円
                      </p>
                    )}
                  </div>

                  <div className="p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl border-2 border-amber-200">
                    <p className="text-sm text-stone-600 mb-1">③ 控除対象額（①から②を差し引いた額）</p>
                    <p className="text-3xl font-bold text-amber-800">{housingLoanDetail.deductibleAmount.toLocaleString()}円</p>
                    {housingLoanDetail.deductibleAmount >= 1_000_000 ? (
                      <p className="text-sm text-green-700 mt-2">控除対象額が100万円以上です</p>
                    ) : (
                      <p className="text-sm text-red-700 mt-2">控除対象額が100万円未満です</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* （３）実施した工事の費用の額等 */}
          {(works.seismic?.summary || works.barrierFree?.summary || works.energySaving?.summary ||
            works.cohabitation?.summary || works.childcare?.summary || works.otherRenovation?.summary) && (
            <section className="mb-8">
              <h3 className="text-lg font-bold text-stone-800 mb-4 bg-gradient-to-r from-amber-50 to-stone-50 p-4 rounded-2xl">
                （３）実施した工事の費用の額等
              </h3>

              {/* ① 耐震改修 */}
              {works.seismic?.summary && (
                <div className="mb-6 pl-4">
                  <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                    ① 耐震改修
                  </h4>
                  <div className="bg-stone-50 p-4 rounded-2xl space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-semibold text-stone-500">ア: 工事費総額</span>
                        <div className="font-semibold text-stone-800">{works.seismic.summary.totalAmount.toLocaleString()}円</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">イ: 補助金額</span>
                        <div className="font-semibold text-stone-800">{works.seismic.summary.subsidyAmount.toLocaleString()}円</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">ウ: 補助金差引後</span>
                        <div className="font-semibold text-stone-800">{works.seismic.summary.deductibleAmount.toLocaleString()}円</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">エ: 上限適用後（250万円）</span>
                        <div className="font-bold text-amber-800">
                          {Math.min(works.seismic.summary.deductibleAmount, 2_500_000).toLocaleString()}円
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">オ: 超過額</span>
                        <div className="font-semibold text-stone-800">
                          {Math.max(0, works.seismic.summary.deductibleAmount - 2_500_000).toLocaleString()}円
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ② バリアフリー改修 */}
              {works.barrierFree?.summary && (
                <div className="mb-6 pl-4">
                  <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                    ② バリアフリー改修
                  </h4>
                  <div className="bg-stone-50 p-4 rounded-2xl space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-semibold text-stone-500">ア: 工事費総額</span>
                        <div className="font-semibold text-stone-800">{works.barrierFree.summary.totalAmount.toLocaleString()}円</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">イ: 補助金額</span>
                        <div className="font-semibold text-stone-800">{works.barrierFree.summary.subsidyAmount.toLocaleString()}円</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">ウ: 補助金差引後（50万円超の場合のみ）</span>
                        <div className="font-semibold text-stone-800">{works.barrierFree.summary.deductibleAmount.toLocaleString()}円</div>
                        {works.barrierFree.summary.deductibleAmount === 0 &&
                         works.barrierFree.summary.totalAmount > 0 && (
                          <div className="text-xs text-amber-600 mt-1">50万円以下のため控除対象外</div>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">エ: 上限適用後（200万円）</span>
                        <div className="font-bold text-amber-800">
                          {Math.min(works.barrierFree.summary.deductibleAmount, 2_000_000).toLocaleString()}円
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">オ: 超過額</span>
                        <div className="font-semibold text-stone-800">
                          {Math.max(0, works.barrierFree.summary.deductibleAmount - 2_000_000).toLocaleString()}円
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ③ 省エネ改修 */}
              {works.energySaving?.summary && (
                <div className="mb-6 pl-4">
                  <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                    ③ 省エネ改修
                    {works.energySaving.summary.hasSolarPower && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">太陽光発電設備有り</span>
                    )}
                  </h4>
                  <div className="bg-stone-50 p-4 rounded-2xl space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-semibold text-stone-500">ア: 工事費総額</span>
                        <div className="font-semibold text-stone-800">{works.energySaving.summary.totalAmount.toLocaleString()}円</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">イ: 補助金額</span>
                        <div className="font-semibold text-stone-800">{works.energySaving.summary.subsidyAmount.toLocaleString()}円</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">ウ: 補助金差引後（50万円超の場合のみ）</span>
                        <div className="font-semibold text-stone-800">{works.energySaving.summary.deductibleAmount.toLocaleString()}円</div>
                        {works.energySaving.summary.deductibleAmount === 0 &&
                         works.energySaving.summary.totalAmount > 0 && (
                          <div className="text-xs text-amber-600 mt-1">50万円以下のため控除対象外</div>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">
                          エ: 上限適用後（{works.energySaving.summary.hasSolarPower ? '350万円' : '250万円'}）
                        </span>
                        <div className="font-bold text-amber-800">
                          {Math.min(
                            works.energySaving.summary.deductibleAmount,
                            works.energySaving.summary.hasSolarPower ? 3_500_000 : 2_500_000
                          ).toLocaleString()}円
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">オ: 超過額</span>
                        <div className="font-semibold text-stone-800">
                          {Math.max(
                            0,
                            works.energySaving.summary.deductibleAmount - (works.energySaving.summary.hasSolarPower ? 3_500_000 : 2_500_000)
                          ).toLocaleString()}円
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ④ 同居対応改修 */}
              {works.cohabitation?.summary && (
                <div className="mb-6 pl-4">
                  <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                    ④ 同居対応改修
                  </h4>
                  <div className="bg-stone-50 p-4 rounded-2xl space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-semibold text-stone-500">ア: 工事費総額</span>
                        <div className="font-semibold text-stone-800">{works.cohabitation.summary.totalAmount.toLocaleString()}円</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">イ: 補助金額</span>
                        <div className="font-semibold text-stone-800">{works.cohabitation.summary.subsidyAmount.toLocaleString()}円</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">ウ: 補助金差引後（50万円超の場合のみ）</span>
                        <div className="font-semibold text-stone-800">{works.cohabitation.summary.deductibleAmount.toLocaleString()}円</div>
                        {works.cohabitation.summary.deductibleAmount === 0 &&
                         works.cohabitation.summary.totalAmount > 0 && (
                          <div className="text-xs text-amber-600 mt-1">50万円以下のため控除対象外</div>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">エ: 上限適用後（250万円）</span>
                        <div className="font-bold text-amber-800">
                          {Math.min(works.cohabitation.summary.deductibleAmount, 2_500_000).toLocaleString()}円
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">オ: 超過額</span>
                        <div className="font-semibold text-stone-800">
                          {Math.max(0, works.cohabitation.summary.deductibleAmount - 2_500_000).toLocaleString()}円
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ⑦ 子育て対応改修 */}
              {works.childcare?.summary && (
                <div className="mb-6 pl-4">
                  <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                    ⑦ 子育て対応改修
                  </h4>
                  <div className="bg-stone-50 p-4 rounded-2xl space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-semibold text-stone-500">ア: 工事費総額</span>
                        <div className="font-semibold text-stone-800">{works.childcare.summary.totalAmount.toLocaleString()}円</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">イ: 補助金額</span>
                        <div className="font-semibold text-stone-800">{works.childcare.summary.subsidyAmount.toLocaleString()}円</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">ウ: 補助金差引後（50万円超の場合のみ）</span>
                        <div className="font-semibold text-stone-800">{works.childcare.summary.deductibleAmount.toLocaleString()}円</div>
                        {works.childcare.summary.deductibleAmount === 0 &&
                         works.childcare.summary.totalAmount > 0 && (
                          <div className="text-xs text-amber-600 mt-1">50万円以下のため控除対象外</div>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">エ: 上限適用後（250万円）</span>
                        <div className="font-bold text-amber-800">
                          {Math.min(works.childcare.summary.deductibleAmount, 2_500_000).toLocaleString()}円
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">オ: 超過額</span>
                        <div className="font-semibold text-stone-800">
                          {Math.max(0, works.childcare.summary.deductibleAmount - 2_500_000).toLocaleString()}円
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ⑤ 長期優良住宅化（耐震又は省エネ） */}
              {works.longTermHousing?.summary && !(works.longTermHousing.summary.isExcellentHousing) && (
                <div className="mb-6 pl-4">
                  <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                    ⑤ 長期優良住宅化（耐震又は省エネ）
                  </h4>
                  <div className="bg-stone-50 p-4 rounded-2xl space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-semibold text-stone-500">ア: 工事費総額</span>
                        <div className="font-semibold text-stone-800">{works.longTermHousing.summary.totalAmount.toLocaleString()}円</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">イ: 補助金額</span>
                        <div className="font-semibold text-stone-800">{works.longTermHousing.summary.subsidyAmount.toLocaleString()}円</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">ウ: 補助金差引後</span>
                        <div className="font-semibold text-stone-800">{works.longTermHousing.summary.deductibleAmount.toLocaleString()}円</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">
                          エ: 上限適用後（{works.energySaving?.summary?.hasSolarPower ? '350万円' : '250万円'}）
                        </span>
                        <div className="font-bold text-amber-800">
                          {Math.min(
                            works.longTermHousing.summary.deductibleAmount,
                            works.energySaving?.summary?.hasSolarPower ? 3_500_000 : 2_500_000
                          ).toLocaleString()}円
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">オ: 超過額</span>
                        <div className="font-semibold text-stone-800">
                          {Math.max(0,
                            works.longTermHousing.summary.deductibleAmount -
                            (works.energySaving?.summary?.hasSolarPower ? 3_500_000 : 2_500_000)
                          ).toLocaleString()}円
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ⑥ 長期優良住宅化（耐震及び省エネ） */}
              {works.longTermHousing?.summary && works.longTermHousing.summary.isExcellentHousing && (
                <div className="mb-6 pl-4">
                  <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                    ⑥ 長期優良住宅化（耐震及び省エネ）
                  </h4>
                  <div className="bg-stone-50 p-4 rounded-2xl space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-semibold text-stone-500">ア: 工事費総額</span>
                        <div className="font-semibold text-stone-800">{works.longTermHousing.summary.totalAmount.toLocaleString()}円</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">イ: 補助金額</span>
                        <div className="font-semibold text-stone-800">{works.longTermHousing.summary.subsidyAmount.toLocaleString()}円</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">ウ: 補助金差引後</span>
                        <div className="font-semibold text-stone-800">{works.longTermHousing.summary.deductibleAmount.toLocaleString()}円</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">
                          エ: 上限適用後（{works.energySaving?.summary?.hasSolarPower ? '600万円' : '500万円'}）
                        </span>
                        <div className="font-bold text-amber-800">
                          {Math.min(
                            works.longTermHousing.summary.deductibleAmount,
                            works.energySaving?.summary?.hasSolarPower ? 6_000_000 : 5_000_000
                          ).toLocaleString()}円
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">オ: 超過額</span>
                        <div className="font-semibold text-stone-800">
                          {Math.max(0,
                            works.longTermHousing.summary.deductibleAmount -
                            (works.energySaving?.summary?.hasSolarPower ? 6_000_000 : 5_000_000)
                          ).toLocaleString()}円
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 統合計算結果（パターン比較） */}
              {combinedResult && (
                <div className="mb-6 pl-4">
                  <h4 className="font-semibold text-stone-800 mb-3">複数制度の組み合わせ計算</h4>

                  {/* パターン比較表 */}
                  <div className="bg-gradient-to-r from-amber-50 to-stone-50 p-4 rounded-2xl space-y-4 mb-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-stone-200">
                            <th className="text-left py-2 px-2 text-stone-500 font-semibold">パターン</th>
                            <th className="text-right py-2 px-2 text-stone-500 font-semibold">ウ合計</th>
                            <th className="text-right py-2 px-2 text-stone-500 font-semibold">エ合計(上限後)</th>
                            <th className="text-right py-2 px-2 text-stone-500 font-semibold">オ合計(超過)</th>
                            <th className="text-center py-2 px-2 text-stone-500 font-semibold">採用</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className={`border-b border-stone-100 ${combinedResult.bestPattern === 1 ? 'bg-amber-100/50 font-semibold' : ''}`}>
                            <td className="py-2 px-2 text-stone-800">P1: ①+②+③+④+⑦</td>
                            <td className="text-right py-2 px-2 text-stone-800">{combinedResult.p1_ウ.toLocaleString()}円</td>
                            <td className="text-right py-2 px-2 text-stone-800">{combinedResult.p1_エ.toLocaleString()}円</td>
                            <td className="text-right py-2 px-2 text-stone-800">{combinedResult.p1_オ.toLocaleString()}円</td>
                            <td className="text-center py-2 px-2 text-amber-700">{combinedResult.bestPattern === 1 ? '★' : ''}</td>
                          </tr>
                          <tr className={`border-b border-stone-100 ${combinedResult.bestPattern === 2 ? 'bg-amber-100/50 font-semibold' : ''}`}>
                            <td className="py-2 px-2 text-stone-800">P2: ②+④+⑤+⑦</td>
                            <td className="text-right py-2 px-2 text-stone-800">{combinedResult.p2_ウ.toLocaleString()}円</td>
                            <td className="text-right py-2 px-2 text-stone-800">{combinedResult.p2_エ.toLocaleString()}円</td>
                            <td className="text-right py-2 px-2 text-stone-800">{combinedResult.p2_オ.toLocaleString()}円</td>
                            <td className="text-center py-2 px-2 text-amber-700">{combinedResult.bestPattern === 2 ? '★' : ''}</td>
                          </tr>
                          <tr className={`${combinedResult.bestPattern === 3 ? 'bg-amber-100/50 font-semibold' : ''}`}>
                            <td className="py-2 px-2 text-stone-800">P3: ②+④+⑥+⑦</td>
                            <td className="text-right py-2 px-2 text-stone-800">{combinedResult.p3_ウ.toLocaleString()}円</td>
                            <td className="text-right py-2 px-2 text-stone-800">{combinedResult.p3_エ.toLocaleString()}円</td>
                            <td className="text-right py-2 px-2 text-stone-800">{combinedResult.p3_オ.toLocaleString()}円</td>
                            <td className="text-center py-2 px-2 text-amber-700">{combinedResult.bestPattern === 3 ? '★' : ''}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 最終計算値 */}
                  <div className="bg-gradient-to-r from-amber-50 to-stone-50 p-4 rounded-2xl space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-semibold text-stone-500">⑰ 最大控除額 = MAX(⑨,⑫,⑮)</span>
                        <div className="font-bold text-xl text-amber-800">
                          {combinedResult.maxControlAmount.toLocaleString()}円
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">⑱ 最大工事費 = MAX(⑧,⑪,⑭)</span>
                        <div className="font-semibold text-stone-800">{combinedResult.totalDeductible.toLocaleString()}円</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">⑲ 対応超過額</span>
                        <div className="font-semibold text-stone-800">{combinedResult.excessAmount.toLocaleString()}円</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">㉒ 残り控除可能枠 = MAX(0, 1000万-⑰)</span>
                        <div className="font-semibold text-green-700">{combinedResult.remaining.toLocaleString()}円</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ⑳ その他増改築 */}
              {works.otherRenovation?.summary && (
                <div className="mb-6 pl-4">
                  <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
                    ⑳ その他増改築等工事
                  </h4>
                  <div className="bg-stone-50 p-4 rounded-2xl space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-semibold text-stone-500">⑳ア: 工事費総額</span>
                        <div className="font-semibold text-stone-800">{works.otherRenovation.summary.totalAmount.toLocaleString()}円</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">⑳イ: 補助金額</span>
                        <div className="font-semibold text-stone-800">{works.otherRenovation.summary.subsidyAmount.toLocaleString()}円</div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-stone-500">⑳ウ: 補助金差引後</span>
                        <div className="font-bold text-stone-800">
                          {works.otherRenovation.summary.deductibleAmount.toLocaleString()}円
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ㉑㉒㉓ 最終控除計算 */}
              {combinedResult && (
                <div className="mb-6 pl-4">
                  <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-4 space-y-4">
                    <div className="text-center">
                      <span className="text-sm text-stone-600 block mb-2">㉑ 最終控除対象額 = MIN(⑱, ⑲+⑳ウ)</span>
                      <div className="font-bold text-2xl text-amber-900">
                        {combinedResult.finalDeductible.toLocaleString()}円
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-amber-200 pt-3">
                      <div className="text-center">
                        <span className="text-sm text-stone-600 block mb-1">㉒ 残り = MAX(0, 1000万-⑰)</span>
                        <div className="font-semibold text-lg text-green-700">
                          {combinedResult.remaining.toLocaleString()}円
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-sm text-stone-600 block mb-1">㉓ 5%控除分 = MIN(㉑, ㉒)</span>
                        <div className="font-bold text-lg text-amber-800">
                          {combinedResult.fivePercentDeductible.toLocaleString()}円
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-amber-200 pt-3 text-center">
                      <span className="text-xs text-stone-500 block mb-1">税額控除見込み</span>
                      <div className="text-sm text-stone-700">
                        10%控除分: {combinedResult.maxControlAmount.toLocaleString()}円 x 10% = <span className="font-bold">{Math.floor(combinedResult.maxControlAmount * 0.1).toLocaleString()}円</span>
                        {combinedResult.fivePercentDeductible > 0 && (
                          <span className="ml-4">
                            5%控除分: {combinedResult.fivePercentDeductible.toLocaleString()}円 x 5% = <span className="font-bold">{Math.floor(combinedResult.fivePercentDeductible * 0.05).toLocaleString()}円</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 発行者情報 */}
          <section className="mb-8">
            <h3 className="text-lg font-bold text-stone-800 mb-4 bg-gradient-to-r from-amber-50 to-stone-50 p-4 rounded-2xl">証明書発行者情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
              <div>
                <span className="text-sm font-semibold text-stone-500">発行者氏名:</span>
                <span className="ml-2 text-stone-900">{certificate.issuerName || '（未記入）'}</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-stone-500">事務所名:</span>
                <span className="ml-2 text-stone-900">{certificate.issuerOfficeName || '（未記入）'}</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-stone-500">組織種別:</span>
                <span className="ml-2 text-stone-900">{certificate.issuerOrganizationType || '（未記入）'}</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-stone-500">資格番号:</span>
                <span className="ml-2 text-stone-900">{certificate.issuerQualificationNumber || '（未記入）'}</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-stone-500">発行日:</span>
                <span className="ml-2 text-stone-900">
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
            className="bg-stone-200 text-stone-700 hover:bg-stone-300 rounded-full px-5 py-2 text-sm font-semibold transition-all"
          >
            &larr; 詳細ページへ戻る
          </Link>
          <button
            onClick={() => window.print()}
            className="bg-gradient-to-r from-amber-700 to-stone-700 hover:from-amber-800 hover:to-stone-800 text-white shadow-lg shadow-amber-900/20 rounded-full px-5 py-2 text-sm font-semibold transition-all hover:scale-105"
          >
            印刷
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
          .bg-gradient-to-r,
          .from-stone-50 {
            background: white !important;
          }
          .shadow,
          .shadow-sm,
          .shadow-md,
          .shadow-lg,
          .shadow-xl,
          .shadow-2xl {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
