/**
 * 住宅借入金等特別控除用PDF生成器（pdf-lib版）
 * 公式の増改築等工事証明書テンプレートを使用
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

interface CertificateData {
  id: string;
  applicantName: string;
  applicantAddress: string;
  propertyNumber: string | null;
  propertyAddress: string;
  completionDate: string;
  purposeType: string;
  subsidyAmount: number;
  issuerName: string | null;
  issuerOfficeName: string | null;
  issuerOrganizationType: string | null;
  issuerQualificationNumber: string | null;
  issueDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  housingLoanDetail?: {
    id: string;
    workTypes: any;
    workDescription: string | null;
    totalCost: number;
    hasSubsidy: boolean;
    subsidyAmount: number;
    deductibleAmount: number;
  } | null;
}

/**
 * 公式テンプレートPDFに情報を記入して生成
 */
export async function generateHousingLoanPDF(
  certificate: CertificateData
): Promise<Buffer> {
  try {
    // 公式テンプレートPDFを読み込み
    const templatePath = path.join(
      process.cwd(),
      'public',
      'templates',
      'housing-loan-certificate-template.pdf'
    );

    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);

    // fontkit登録（日本語フォント使用のため）
    pdfDoc.registerFontkit(fontkit);

    // 日本語フォント読み込み
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansJP.ttf');
    const fontBytes = fs.readFileSync(fontPath);
    const font = await pdfDoc.embedFont(fontBytes);
    const boldFont = font; // 同じフォントを使用（太字は後で対応可能）

    // ページ取得
    const pages = pdfDoc.getPages();
    const firstPage = pages[0]; // 1ページ目
    const thirdPage = pages[2]; // 3ページ目（費用概要）

    // PDFのサイズ取得
    const { height } = firstPage.getSize();

    // =======================================
    // 1ページ目：基本情報の記入
    // =======================================

    // 証明申請者 - 住所
    firstPage.drawText(certificate.applicantAddress, {
      x: 150,
      y: height - 85,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    // 証明申請者 - 氏名
    firstPage.drawText(certificate.applicantName, {
      x: 150,
      y: height - 105,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    // 家屋番号及び所在地
    firstPage.drawText(certificate.propertyAddress, {
      x: 150,
      y: height - 125,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    // 工事完了年月日
    const completionDate = new Date(certificate.completionDate);
    const completionStr = `${completionDate.getFullYear()}年${completionDate.getMonth() + 1}月${completionDate.getDate()}日`;
    firstPage.drawText(completionStr, {
      x: 150,
      y: height - 145,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    });

    // =======================================
    // チェックボックスのマーク（工事種別）
    // =======================================
    if (certificate.housingLoanDetail?.workTypes) {
      const workTypes = certificate.housingLoanDetail.workTypes;

      // 第1号工事のチェック
      if (workTypes.work1) {
        if (workTypes.work1.extension) {
          drawCheckbox(firstPage, 50, height - 200, font); // 増築
        }
        if (workTypes.work1.renovation) {
          drawCheckbox(firstPage, 120, height - 200, font); // 改築
        }
        if (workTypes.work1.majorRepair) {
          drawCheckbox(firstPage, 190, height - 200, font); // 大規模の修繕
        }
        if (workTypes.work1.majorRemodeling) {
          drawCheckbox(firstPage, 290, height - 200, font); // 大規模の模様替
        }
      }

      // 第2号工事のチェック
      if (workTypes.work2) {
        if (workTypes.work2.floorOverHalf) {
          drawCheckbox(firstPage, 50, height - 230, font); // 床の過半
        }
        if (workTypes.work2.stairOverHalf) {
          drawCheckbox(firstPage, 150, height - 230, font); // 階段の過半
        }
        if (workTypes.work2.partitionOverHalf) {
          drawCheckbox(firstPage, 50, height - 250, font); // 間仕切壁の過半
        }
        if (workTypes.work2.wallOverHalf) {
          drawCheckbox(firstPage, 200, height - 250, font); // 壁の過半
        }
      }

      // 第3号工事のチェック
      if (workTypes.work3) {
        let yPos = height - 280;
        if (workTypes.work3.livingRoom) {
          drawCheckbox(firstPage, 50, yPos, font); // 居室
        }
        if (workTypes.work3.kitchen) {
          drawCheckbox(firstPage, 120, yPos, font); // 調理室
        }
        if (workTypes.work3.bathroom) {
          drawCheckbox(firstPage, 190, yPos, font); // 浴室
        }
        if (workTypes.work3.toilet) {
          drawCheckbox(firstPage, 260, yPos, font); // 便所
        }
      }

      // 第4号工事のチェック（耐震改修）
      if (workTypes.work4) {
        if (workTypes.work4.buildingStandard) {
          drawCheckbox(firstPage, 50, height - 310, font);
        }
        if (workTypes.work4.earthquakeSafety) {
          drawCheckbox(firstPage, 50, height - 330, font);
        }
      }

      // 第5号工事のチェック（バリアフリー）
      if (workTypes.work5) {
        let yPos = height - 360;
        if (workTypes.work5.pathwayExpansion) drawCheckbox(firstPage, 50, yPos, font);
        if (workTypes.work5.stairSlope) drawCheckbox(firstPage, 180, yPos, font);
        if (workTypes.work5.bathroomImprovement) drawCheckbox(firstPage, 310, yPos, font);

        yPos -= 20;
        if (workTypes.work5.toiletImprovement) drawCheckbox(firstPage, 50, yPos, font);
        if (workTypes.work5.handrails) drawCheckbox(firstPage, 180, yPos, font);
        if (workTypes.work5.stepElimination) drawCheckbox(firstPage, 310, yPos, font);
      }

      // 第6号工事のチェック（省エネ）
      if (workTypes.work6?.energyEfficiency) {
        const ee = workTypes.work6.energyEfficiency;
        let yPos = height - 420;

        if (ee.allWindowsInsulation) drawCheckbox(firstPage, 60, yPos, font);
        if (ee.allRoomsWindowsInsulation) drawCheckbox(firstPage, 60, yPos - 20, font);

        // 地域区分
        if (ee.region4) {
          drawCheckbox(firstPage, 200, height - 480, font); // 4地域
        }
      }
    }

    // =======================================
    // 3ページ目：費用概要の記入
    // =======================================
    if (certificate.housingLoanDetail) {
      const detail = certificate.housingLoanDetail;

      // (1) 第1号工事～第6号工事に要した費用の額
      thirdPage.drawText(`${detail.totalCost.toLocaleString()}`, {
        x: 450,
        y: height - 650,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });

      // (2) 補助金等の交付の有無
      if (detail.hasSubsidy) {
        drawCheckbox(thirdPage, 410, height - 675, font); // 有

        // 交付される補助金等の額
        thirdPage.drawText(`${detail.subsidyAmount.toLocaleString()}`, {
          x: 450,
          y: height - 700,
          size: 10,
          font: font,
          color: rgb(0, 0, 0),
        });
      } else {
        drawCheckbox(thirdPage, 460, height - 675, font); // 無
      }

      // (3) ①から②を差し引いた額（控除対象額）
      thirdPage.drawText(`${detail.deductibleAmount.toLocaleString()}`, {
        x: 450,
        y: height - 725,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
    }

    // =======================================
    // 2ページ目：工事内容の記入
    // =======================================
    if (certificate.housingLoanDetail?.workDescription) {
      const secondPage = pages[1];
      const description = certificate.housingLoanDetail.workDescription;

      // 工事内容を複数行に分けて記入
      const lines = description.split('\n');
      let yPos = height - 100;

      for (const line of lines) {
        if (yPos < 50) break; // ページ下部に達したら終了

        secondPage.drawText(line.substring(0, 80), { // 80文字まで
          x: 50,
          y: yPos,
          size: 8,
          font: font,
          color: rgb(0, 0, 0),
        });
        yPos -= 12;
      }
    }

    // =======================================
    // 最終ページ：証明者情報の記入
    // =======================================
    const lastPage = pages[pages.length - 1];

    // 証明年月日
    if (certificate.issueDate) {
      const issueDate = new Date(certificate.issueDate);
      const issueDateStr = `${issueDate.getFullYear()}年${issueDate.getMonth() + 1}月${issueDate.getDate()}日`;
      lastPage.drawText(issueDateStr, {
        x: 150,
        y: height - 50,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    // 建築士事務所名
    if (certificate.issuerOfficeName) {
      lastPage.drawText(certificate.issuerOfficeName, {
        x: 150,
        y: height - 180,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    // 建築士氏名
    if (certificate.issuerName) {
      lastPage.drawText(certificate.issuerName, {
        x: 150,
        y: height - 220,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    // 登録番号
    if (certificate.issuerQualificationNumber) {
      lastPage.drawText(certificate.issuerQualificationNumber, {
        x: 300,
        y: height - 260,
        size: 9,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    // PDFをバイト配列として保存
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('PDF生成に失敗しました: ' + (error as Error).message);
  }
}

/**
 * チェックボックスにチェックマークを描画
 */
function drawCheckbox(page: any, x: number, y: number, font: any) {
  // チェックマーク（✓）を描画
  page.drawText('✓', {
    x: x,
    y: y,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });
}
