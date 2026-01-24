/**
 * 住宅借入金等特別控除用の増改築等工事証明書PDF生成
 *
 * 国土交通省の公式フォーマットに準拠したPDF生成
 * https://www.mlit.go.jp/jutakukentiku/house/jutakukentiku_house_tk4_000149.html
 */

import jsPDF from 'jspdf';
import { calculateCertificateCost, getWorkTypeBreakdown } from './certificateCostCalculator';
import type { WorkData } from './certificateCostCalculator';

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

  // 工事費用計算
  const calculation = calculateCertificateCost(certificate.works || {}, certificate.subsidyAmount);
  const workBreakdown = getWorkTypeBreakdown(calculation);

  // 第1号〜第6号の工事種別をチェックボックス形式で表示
  workBreakdown.forEach((work) => {
    const checkbox = work.hasWork ? '[✓]' : '[ ]';
    doc.text(`${checkbox} Dai ${work.classificationNumber}-go Koji: ${work.label}`, 25, yPos);
    yPos += 6;

    if (work.hasWork && work.amount > 0) {
      doc.setFontSize(9);
      doc.text(`    Kingaku (Amount): ¥${work.amount.toLocaleString()}`, 30, yPos);
      yPos += 5;
      doc.setFontSize(10);
    }

    // 第6号工事の場合、サブ項目を表示
    if (work.classificationNumber === 6 && work.subItems) {
      doc.setFontSize(9);
      work.subItems.forEach((subItem) => {
        if (subItem.amount > 0) {
          doc.text(`    - ${subItem.label}: ¥${subItem.amount.toLocaleString()}`, 35, yPos);
          yPos += 5;
        }
      });
      doc.setFontSize(10);
    }
  });

  yPos += 5;

  // ===== 工事費用合計 =====
  doc.setFont('helvetica', 'bold');
  doc.text(`(2) Koji Hiyo Gokei (Total Work Cost):`, 20, yPos);
  doc.text(`¥${calculation.totalWorkCost.toLocaleString()}`, 140, yPos);
  yPos += 8;

  // ===== 補助金額 =====
  doc.setFont('helvetica', 'normal');
  doc.text(`(3) Hojokingaku (Subsidy Amount):`, 20, yPos);
  doc.text(`¥${calculation.subsidyAmount.toLocaleString()}`, 140, yPos);
  yPos += 8;

  // ===== 控除対象額 =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`(4) Kojo Taisho-gaku (Deductible Amount):`, 20, yPos);
  doc.text(`¥${calculation.deductibleAmount.toLocaleString()}`, 140, yPos);
  doc.setFontSize(10);
  yPos += 10;

  // ===== 要件チェック =====
  if (calculation.meetsHousingLoanRequirement) {
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
