import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import { pdfLimiter, getClientIP } from '@/lib/rate-limit';
import { generateHousingLoanPDF } from '@/lib/housingLoanPdfGeneratorV2';
import { generatePropertyTaxPDF } from '@/lib/pdf/propertyTaxPdfGenerator';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/certificates/:id/pdf
 * 証明書PDFをダウンロード（認証必須・レートリミット付き）
 * purposeType に応じて適切なPDFジェネレーターを使用
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    // レートリミット（PDF生成は負荷が高い）
    const ip = getClientIP(request);
    const rateLimitResult = await pdfLimiter.check(ip);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'PDF生成のリクエストが多すぎます。しばらく待ってから再試行してください。' },
        { status: 429 }
      );
    }

    const { id } = await params;

    // 証明書データを取得（全リレーション含む）
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        housingLoanDetail: true,
        seismicWorks: true,
        barrierFreeWorks: true,
        energySavingWorks: true,
        cohabitationWorks: true,
        childcareWorks: true,
        otherRenovationWorks: true,
        longTermHousingWorks: true,
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { success: false, error: 'Certificate not found' },
        { status: 404 }
      );
    }

    // アクセス制御
    if (authResult.role !== 'admin' && certificate.userId !== authResult.userId) {
      return NextResponse.json(
        { success: false, error: 'この証明書へのアクセス権がありません' },
        { status: 403 }
      );
    }

    // 共通データ変換
    const baseData = {
      ...certificate,
      completionDate: certificate.completionDate.toISOString(),
      createdAt: certificate.createdAt.toISOString(),
      updatedAt: certificate.updatedAt.toISOString(),
      issueDate: certificate.issueDate?.toISOString() || null,
      subsidyAmount: Number(certificate.subsidyAmount),
    };

    let pdfBuffer: Buffer;
    let filePrefix: string;

    switch (certificate.purposeType) {
      case 'housing_loan': {
        // 住宅借入金等特別控除
        pdfBuffer = await generateHousingLoanPDF({
          ...baseData,
          housingLoanDetail: certificate.housingLoanDetail ? {
            ...certificate.housingLoanDetail,
            totalCost: Number(certificate.housingLoanDetail.totalCost),
            subsidyAmount: Number(certificate.housingLoanDetail.subsidyAmount),
            deductibleAmount: Number(certificate.housingLoanDetail.deductibleAmount),
          } : null,
        });
        filePrefix = 'housing-loan';
        break;
      }

      case 'property_tax': {
        // 固定資産税減額用
        // サマリーデータを取得
        const [seismicSummary, barrierFreeSummary, energySummary, longTermSummary] = await Promise.all([
          prisma.seismicSummary.findUnique({ where: { certificateId: id } }),
          prisma.barrierFreeSummary.findUnique({ where: { certificateId: id } }),
          prisma.energySavingSummary.findUnique({ where: { certificateId: id } }),
          prisma.longTermHousingSummary.findUnique({ where: { certificateId: id } }),
        ]);

        pdfBuffer = await generatePropertyTaxPDF({
          ...baseData,
          seismic: seismicSummary ? {
            totalAmount: Number(seismicSummary.totalAmount),
            subsidyAmount: Number(seismicSummary.subsidyAmount),
            deductibleAmount: Number(seismicSummary.deductibleAmount),
          } : undefined,
          barrierFree: barrierFreeSummary ? {
            totalAmount: Number(barrierFreeSummary.totalAmount),
            subsidyAmount: Number(barrierFreeSummary.subsidyAmount),
            deductibleAmount: Number(barrierFreeSummary.deductibleAmount),
          } : undefined,
          energySaving: energySummary ? {
            totalAmount: Number(energySummary.totalAmount),
            subsidyAmount: Number(energySummary.subsidyAmount),
            deductibleAmount: Number(energySummary.deductibleAmount),
            hasSolarPower: energySummary.hasSolarPower,
          } : undefined,
          longTermHousing: longTermSummary ? {
            totalAmount: Number(longTermSummary.totalAmount),
            subsidyAmount: Number(longTermSummary.subsidyAmount),
            deductibleAmount: Number(longTermSummary.deductibleAmount),
            isExcellentHousing: longTermSummary.isExcellentHousing,
          } : undefined,
        });
        filePrefix = 'property-tax';
        break;
      }

      case 'reform_tax':
      case 'resale':
        // 未実装の証明書タイプ
        return NextResponse.json(
          {
            success: false,
            error: `「${certificate.purposeType}」タイプのPDF生成は現在準備中です`,
          },
          { status: 501 }
        );

      default:
        return NextResponse.json(
          {
            success: false,
            error: `不明な証明書タイプ: ${certificate.purposeType}`,
          },
          { status: 400 }
        );
    }

    // ファイル名生成
    const fileName = `certificate_${filePrefix}_${id}_${new Date().toISOString().slice(0, 10)}.pdf`;

    // PDFレスポンスを返す
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'PDF生成に失敗しました',
      },
      { status: 500 }
    );
  }
}
