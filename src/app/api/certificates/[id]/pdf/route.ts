import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateHousingLoanPDF } from '@/lib/housingLoanPdfGeneratorV2';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/certificates/:id/pdf
 * 証明書PDFをダウンロード
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 証明書データを取得
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        housingLoanDetail: true,
      },
    });

    if (!certificate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Certificate not found',
        },
        { status: 404 }
      );
    }

    // PDFを生成
    const pdfBuffer = await generateHousingLoanPDF({
      ...certificate,
      completionDate: certificate.completionDate.toISOString(),
      createdAt: certificate.createdAt.toISOString(),
      updatedAt: certificate.updatedAt.toISOString(),
      issueDate: certificate.issueDate?.toISOString() || null,
      subsidyAmount: Number(certificate.subsidyAmount),
      housingLoanDetail: certificate.housingLoanDetail ? {
        ...certificate.housingLoanDetail,
        totalCost: Number(certificate.housingLoanDetail.totalCost),
        subsidyAmount: Number(certificate.housingLoanDetail.subsidyAmount),
        deductibleAmount: Number(certificate.housingLoanDetail.deductibleAmount),
      } : null,
    });

    // ファイル名生成
    const fileName = `certificate_housing-loan_${id}_${new Date().toISOString().slice(0, 10)}.pdf`;

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
        error: 'Failed to generate PDF: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
