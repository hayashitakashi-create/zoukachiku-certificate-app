/**
 * 住宅借入金等特別控除用の増改築等工事証明書PDF生成
 *
 * 国土交通省の公式フォーマットに準拠したPDF生成
 * https://www.mlit.go.jp/jutakukentiku/house/jutakukentiku_house_tk4_000149.html
 */

import jsPDF from 'jspdf';
import { calculateCertificateCost, getWorkTypeBreakdown } from './certificateCostCalculator';
import type { WorkData } from './certificateCostCalculator';
import type { HousingLoanWorkTypes } from '@/types/housingLoanDetail';

interface HousingLoanDetail {
  id: string;
  workTypes: HousingLoanWorkTypes;
  workDescription: string | null;
  totalCost: number;
  hasSubsidy: boolean;
  subsidyAmount: number;
  deductibleAmount: number;
}

interface CertificateData {
  id: string;
  applicantName: string;
  applicantAddress: string;
  propertyNumber: string | null;
  propertyAddress: string;
  completionDate: string;
  subsidyAmount: number;
  issuerName: string | null;
  issuerOfficeName: string | null;
  issuerOrganizationType: string | null;
  issuerQualificationNumber: string | null;
  issueDate: string | null;
  works?: WorkData;
  housingLoanDetail?: HousingLoanDetail | null;
}

/**
 * HousingLoanDetail から工事種別の表示用データを生成
 */
function getHousingLoanWorkBreakdown(housingLoanDetail: HousingLoanDetail | null | undefined) {
  const breakdown: Array<{
    classificationNumber: number;
    classification: string;
    label: string;
    hasWork: boolean;
  }> = [];

  if (!housingLoanDetail || !housingLoanDetail.workTypes) {
    // デフォルトで全ての工事種別を空で返す
    return [
      { classificationNumber: 1, classification: '第1号', label: '増築、改築、大規模の修繕、大規模の模様替', hasWork: false },
      { classificationNumber: 2, classification: '第2号', label: '区分所有建物の過半の修繕又は模様替', hasWork: false },
      { classificationNumber: 3, classification: '第3号', label: '一室の床又は壁の全部の修繕又は模様替', hasWork: false },
      { classificationNumber: 4, classification: '第4号', label: '耐震改修工事', hasWork: false },
      { classificationNumber: 5, classification: '第5号', label: 'バリアフリー改修工事', hasWork: false },
      { classificationNumber: 6, classification: '第6号', label: '省エネ改修等その他の増改築等工事', hasWork: false },
    ];
  }

  const { workTypes } = housingLoanDetail;

  // 第1号工事
  const hasWork1 = workTypes.work1 && Object.values(workTypes.work1).some(v => v === true);
  breakdown.push({
    classificationNumber: 1,
    classification: '第1号',
    label: '増築、改築、大規模の修繕、大規模の模様替',
    hasWork: hasWork1 || false,
  });

  // 第2号工事
  const hasWork2 = workTypes.work2 && Object.values(workTypes.work2).some(v => v === true);
  breakdown.push({
    classificationNumber: 2,
    classification: '第2号',
    label: '区分所有建物の過半の修繕又は模様替',
    hasWork: hasWork2 || false,
  });

  // 第3号工事
  const hasWork3 = workTypes.work3 && Object.values(workTypes.work3).some(v => v === true);
  breakdown.push({
    classificationNumber: 3,
    classification: '第3号',
    label: '一室の床又は壁の全部の修繕又は模様替',
    hasWork: hasWork3 || false,
  });

  // 第4号工事
  const hasWork4 = workTypes.work4 && Object.values(workTypes.work4).some(v => v === true);
  breakdown.push({
    classificationNumber: 4,
    classification: '第4号',
    label: '耐震改修工事',
    hasWork: hasWork4 || false,
  });

  // 第5号工事
  const hasWork5 = workTypes.work5 && Object.values(workTypes.work5).some(v => v === true);
  breakdown.push({
    classificationNumber: 5,
    classification: '第5号',
    label: 'バリアフリー改修工事',
    hasWork: hasWork5 || false,
  });

  // 第6号工事
  const hasWork6 = workTypes.work6 && (
    (workTypes.work6.energyEfficiency && Object.values(workTypes.work6.energyEfficiency).some(v => v === true)) ||
    workTypes.work6.lowCarbonCert !== undefined ||
    workTypes.work6.perfCert !== undefined ||
    workTypes.work6.energyEfficiency2 !== undefined
  );
  breakdown.push({
    classificationNumber: 6,
    classification: '第6号',
    label: '省エネ改修等その他の増改築等工事',
    hasWork: hasWork6 || false,
  });

  return breakdown;
}

/**
 * 住宅借入金等特別控除用の証明書PDFを生成
 */
export function generateHousingLoanCertificatePDF(certificate: CertificateData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // 日本語フォント設定（簡易的な対応）
  doc.setFont('helvetica');

  let yPos = 20;

  // ===== ヘッダー =====
  doc.setFontSize(10);
  doc.text('Betsuhyo Dai-ni (Attachment 2)', 15, yPos);
  yPos += 10;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Zokaichiku-to Koji Shomeisho', 105, yPos, { align: 'center' });
  yPos += 6;
  doc.setFontSize(14);
  doc.text('(Certificate of Renovation Work)', 105, yPos, { align: 'center' });
  yPos += 15;

  // ===== 証明申請者情報 =====
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text('Shomei Shinseisha (Applicant)', 15, yPos);
  yPos += 7;

  doc.text(`Jusho (Address): ${certificate.applicantAddress}`, 20, yPos);
  yPos += 7;

  doc.text(`Shimei (Name): ${certificate.applicantName}`, 20, yPos);
  yPos += 10;

  // ===== 家屋情報 =====
  doc.text('Kaoku Bango oyobi Shozaichi (Property Number and Address)', 15, yPos);
  yPos += 7;

  if (certificate.propertyNumber) {
    doc.text(`Kaoku Bango (Property Number): ${certificate.propertyNumber}`, 20, yPos);
    yPos += 7;
  }

  doc.text(`Shozaichi (Address): ${certificate.propertyAddress}`, 20, yPos);
  yPos += 10;

  // ===== 工事完了年月日 =====
  const completionDate = new Date(certificate.completionDate);
  const jpDate = `${completionDate.getFullYear()}年${completionDate.getMonth() + 1}月${completionDate.getDate()}日`;
  doc.text(`Koji Kanryo Nengappi (Completion Date): ${jpDate}`, 15, yPos);
  yPos += 12;

  // ===== セクションI: 所得税額の特別控除 =====
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('I. Shotokuzei-gaku no Tokubetsu Kojo (Special Tax Deduction)', 15, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    '1. Hensai Kikan ga 10-nen Ijo no Jutaku Kariirekin-to wo Riyo shite',
    18,
    yPos
  );
  yPos += 5;
  doc.text('   Zokaichiku-to wo Shita Baai', 18, yPos);
  yPos += 5;
  doc.text(
    '   (Housing Loan Special Tax Deduction - 10+ Year Repayment Period)',
    18,
    yPos
  );
  yPos += 10;

  // ===== 工事種別（第1号〜第6号） =====
  doc.setFontSize(10);
  doc.text('(1) Jisshi shita Koji no Shubetsu (Types of Work Performed):', 20, yPos);
  yPos += 8;

  // HousingLoanDetail がある場合はそちらを使用、ない場合は旧形式
  let workBreakdown;
  let totalCost = 0;
  let subsidyAmount = certificate.subsidyAmount;
  let deductibleAmount = 0;
  let meetsRequirement = false;

  if (certificate.housingLoanDetail) {
    // 新形式: HousingLoanDetail を使用
    workBreakdown = getHousingLoanWorkBreakdown(certificate.housingLoanDetail);
    totalCost = certificate.housingLoanDetail.totalCost;
    subsidyAmount = certificate.housingLoanDetail.subsidyAmount;
    deductibleAmount = certificate.housingLoanDetail.deductibleAmount;
    meetsRequirement = deductibleAmount >= 1000000;
  } else {
    // 旧形式: calculateCertificateCost を使用（後方互換性のため）
    const calculation = calculateCertificateCost(certificate.works || {}, certificate.subsidyAmount);
    workBreakdown = getWorkTypeBreakdown(calculation);
    totalCost = calculation.totalWorkCost;
    subsidyAmount = calculation.subsidyAmount;
    deductibleAmount = calculation.deductibleAmount;
    meetsRequirement = calculation.meetsHousingLoanRequirement;
  }

  // 第1号〜第6号の工事種別をチェックボックス形式で表示
  workBreakdown.forEach((work: any) => {
    const checkbox = work.hasWork ? '[✓]' : '[ ]';
    doc.text(`${checkbox} Dai ${work.classificationNumber}-go Koji: ${work.label}`, 25, yPos);
    yPos += 6;

    // 旧形式の場合のみ金額を表示（新形式では金額情報がないため）
    if (!certificate.housingLoanDetail && work.hasWork && work.amount > 0) {
      doc.setFontSize(9);
      doc.text(`    Kingaku (Amount): ¥${work.amount.toLocaleString()}`, 30, yPos);
      yPos += 5;
      doc.setFontSize(10);
    }

    // 第6号工事の場合、サブ項目を表示（旧形式のみ）
    if (!certificate.housingLoanDetail && work.classificationNumber === 6 && work.subItems) {
      doc.setFontSize(9);
      work.subItems.forEach((subItem: any) => {
        if (subItem.amount > 0) {
          doc.text(`    - ${subItem.label}: ¥${subItem.amount.toLocaleString()}`, 35, yPos);
          yPos += 5;
        }
      });
      doc.setFontSize(10);
    }
  });

  yPos += 5;

  // ===== (2) 実施した工事の内容 =====
  if (certificate.housingLoanDetail && certificate.housingLoanDetail.workDescription) {
    // 新しいページが必要な場合
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('(2) Jisshi shita Koji no Naiyo (Work Description):', 20, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    // workDescriptionを行に分割して表示（改行文字で分割）
    const descriptionLines = certificate.housingLoanDetail.workDescription.split('\n');
    const maxWidth = 170; // 最大幅（mm）

    descriptionLines.forEach((line) => {
      if (line.trim() === '') {
        // 空行の場合は少しスペースを追加
        yPos += 4;
        return;
      }

      // 長い行は自動的に折り返す
      const wrappedLines = doc.splitTextToSize(line, maxWidth);
      wrappedLines.forEach((wrappedLine: string) => {
        // ページ境界チェック
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(wrappedLine, 22, yPos);
        yPos += 4;
      });
    });

    yPos += 8;
    doc.setFontSize(10);
  }

  // 新しいページが必要な場合
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  // ===== (3) 実施した工事の費用の概要 =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('(3) Jisshi shita Koji no Hiyo no Gaiyo (Cost Overview):', 20, yPos);
  yPos += 8;

  // ===== (3)-① 工事費用合計 =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`1) Dai 1-go ~ Dai 6-go Koji ni Yosu Hiyo (Total Work Cost):`, 22, yPos);
  yPos += 6;
  doc.text(`¥${totalCost.toLocaleString()}`, 140, yPos);
  yPos += 10;

  // ===== (3)-② 補助金額 =====
  doc.setFont('helvetica', 'normal');
  doc.text(`2) Hojokingaku (Subsidy Amount):`, 22, yPos);
  yPos += 6;
  doc.text(`¥${subsidyAmount.toLocaleString()}`, 140, yPos);
  yPos += 10;

  // ===== (3)-③ 控除対象額 =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`3) Kojo Taisho-gaku (Deductible Amount):`, 22, yPos);
  yPos += 6;
  doc.text(`¥${deductibleAmount.toLocaleString()}`, 140, yPos);
  doc.setFontSize(10);
  yPos += 10;

  // ===== 要件チェック =====
  if (meetsRequirement) {
    doc.setFont('helvetica', 'normal');
    doc.text('✓ Yoken wo Mitashite Imasu (Meets the requirement: ¥1,000,000+)', 20, yPos);
  } else {
    doc.setTextColor(255, 0, 0);
    doc.text(
      '⚠ Chui: Kojo Taisho-gaku ga 100-man Yen Miman desu',
      20,
      yPos
    );
    doc.setFontSize(9);
    yPos += 6;
    doc.text(
      '  (Warning: Deductible amount is less than ¥1,000,000)',
      20,
      yPos
    );
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
  }
  yPos += 15;

  // 新しいページが必要な場合
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }

  // ===== 証明年月日 =====
  doc.setFont('helvetica', 'bold');
  doc.text('Shomei Nengappi (Certification Date)', 15, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  if (certificate.issueDate) {
    const issueDate = new Date(certificate.issueDate);
    const jpIssueDate = `${issueDate.getFullYear()}年${issueDate.getMonth() + 1}月${issueDate.getDate()}日`;
    doc.text(jpIssueDate, 20, yPos);
  } else {
    doc.text('(Not issued yet)', 20, yPos);
  }
  yPos += 12;

  // ===== 証明者情報 =====
  doc.setFont('helvetica', 'bold');
  doc.text('Shomei wo Okonatta Kenchikushi (Certifying Architect)', 15, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  if (certificate.issuerName) {
    doc.text(`Shimei (Name): ${certificate.issuerName}`, 20, yPos);
    yPos += 7;

    if (certificate.issuerQualificationNumber) {
      doc.text(
        `Kenchikushi Toroku Bango (Registration No.): ${certificate.issuerQualificationNumber}`,
        20,
        yPos
      );
      yPos += 7;
    }
  } else {
    doc.text('(Issuer information not provided)', 20, yPos);
    yPos += 7;
  }

  yPos += 5;

  // ===== 所属事務所情報 =====
  doc.setFont('helvetica', 'bold');
  doc.text(
    'Shomei wo Okonatta Kenchikushi no Zokusuru Jimusho',
    15,
    yPos
  );
  yPos += 5;
  doc.text('(Architect Office)', 15, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  if (certificate.issuerOfficeName) {
    if (certificate.issuerOrganizationType) {
      doc.text(`Soshiki Shubetsu (Type): ${certificate.issuerOrganizationType}`, 20, yPos);
      yPos += 7;
    }

    doc.text(`Meisho (Name): ${certificate.issuerOfficeName}`, 20, yPos);
    yPos += 7;
  } else {
    doc.text('(Office information not provided)', 20, yPos);
    yPos += 7;
  }

  yPos += 10;

  // ===== フッター =====
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Certificate ID: ${certificate.id}`, 15, 285);
  doc.text(
    `Generated: ${new Date().toLocaleDateString('ja-JP')} ${new Date().toLocaleTimeString('ja-JP')}`,
    105,
    285,
    { align: 'center' }
  );
  doc.text('Page 1 of 1', 195, 285, { align: 'right' });

  // ===== ファイル名生成とダウンロード =====
  const fileName = `certificate_housing-loan_${certificate.id}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
