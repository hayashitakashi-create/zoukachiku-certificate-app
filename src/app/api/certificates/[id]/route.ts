import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateCertificateRequestSchema } from '../types';
import type { CertificateResponse } from '../types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/certificates/:id
 * 特定の証明書を取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
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
        {
          success: false,
          error: 'Certificate not found',
        },
        { status: 404 }
      );
    }

    const response: CertificateResponse & { works?: any } = {
      id: certificate.id,
      applicantName: certificate.applicantName,
      applicantAddress: certificate.applicantAddress,
      propertyNumber: certificate.propertyNumber,
      propertyAddress: certificate.propertyAddress,
      completionDate: certificate.completionDate.toISOString(),
      purposeType: certificate.purposeType,
      subsidyAmount: Number(certificate.subsidyAmount),
      issuerName: certificate.issuerName,
      issuerOfficeName: certificate.issuerOfficeName,
      issuerOrganizationType: certificate.issuerOrganizationType,
      issuerQualificationNumber: certificate.issuerQualificationNumber,
      issueDate: certificate.issueDate?.toISOString() || null,
      status: certificate.status,
      createdAt: certificate.createdAt.toISOString(),
      updatedAt: certificate.updatedAt.toISOString(),
      works: {
        seismic: certificate.seismicWorks.map((work) => ({
          ...work,
          unitPrice: Number(work.unitPrice),
          quantity: Number(work.quantity),
          ratio: work.ratio ? Number(work.ratio) : null,
          calculatedAmount: Number(work.calculatedAmount),
        })),
        barrierFree: certificate.barrierFreeWorks.map((work) => ({
          ...work,
          unitPrice: Number(work.unitPrice),
          quantity: Number(work.quantity),
          ratio: work.ratio ? Number(work.ratio) : null,
          calculatedAmount: Number(work.calculatedAmount),
        })),
        energySaving: certificate.energySavingWorks.map((work) => ({
          ...work,
          unitPrice: Number(work.unitPrice),
          quantity: Number(work.quantity),
          windowRatio: work.windowRatio ? Number(work.windowRatio) : null,
          residentRatio: work.residentRatio ? Number(work.residentRatio) : null,
          calculatedAmount: Number(work.calculatedAmount),
        })),
        cohabitation: certificate.cohabitationWorks.map((work) => ({
          ...work,
          unitPrice: Number(work.unitPrice),
          quantity: Number(work.quantity),
          residentRatio: work.residentRatio ? Number(work.residentRatio) : null,
          calculatedAmount: Number(work.calculatedAmount),
        })),
        childcare: certificate.childcareWorks.map((work) => ({
          ...work,
          unitPrice: Number(work.unitPrice),
          quantity: Number(work.quantity),
          residentRatio: work.residentRatio ? Number(work.residentRatio) : null,
          calculatedAmount: Number(work.calculatedAmount),
        })),
        otherRenovation: certificate.otherRenovationWorks.map((work) => ({
          ...work,
          amount: Number(work.amount),
          residentRatio: work.residentRatio ? Number(work.residentRatio) : null,
          calculatedAmount: Number(work.calculatedAmount),
        })),
        longTermHousing: certificate.longTermHousingWorks.map((work) => ({
          ...work,
          unitPrice: Number(work.unitPrice),
          quantity: Number(work.quantity),
          residentRatio: work.residentRatio ? Number(work.residentRatio) : null,
          calculatedAmount: Number(work.calculatedAmount),
        })),
      },
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch certificate',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/certificates/:id
 * 証明書を更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // バリデーション
    const validationResult = updateCertificateRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 証明書が存在するか確認
    const existingCertificate = await prisma.certificate.findUnique({
      where: { id },
    });

    if (!existingCertificate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Certificate not found',
        },
        { status: 404 }
      );
    }

    // 更新データを準備
    const updateData: any = {};
    if (data.applicantName) updateData.applicantName = data.applicantName;
    if (data.applicantAddress) updateData.applicantAddress = data.applicantAddress;
    if (data.propertyNumber !== undefined) updateData.propertyNumber = data.propertyNumber || null;
    if (data.propertyAddress) updateData.propertyAddress = data.propertyAddress;
    if (data.completionDate) updateData.completionDate = new Date(data.completionDate);
    if (data.purposeType) updateData.purposeType = data.purposeType;
    if (data.subsidyAmount !== undefined) updateData.subsidyAmount = data.subsidyAmount;
    if (data.issuerName) updateData.issuerName = data.issuerName;
    if (data.issuerOfficeName) updateData.issuerOfficeName = data.issuerOfficeName;
    if (data.issuerOrganizationType) updateData.issuerOrganizationType = data.issuerOrganizationType;
    if (data.issuerQualificationNumber !== undefined) {
      updateData.issuerQualificationNumber = data.issuerQualificationNumber || null;
    }
    if (data.issueDate) updateData.issueDate = new Date(data.issueDate);
    if (data.status) updateData.status = data.status;

    // 証明書を更新
    const certificate = await prisma.certificate.update({
      where: { id },
      data: updateData,
    });

    const response: CertificateResponse = {
      id: certificate.id,
      applicantName: certificate.applicantName,
      applicantAddress: certificate.applicantAddress,
      propertyNumber: certificate.propertyNumber,
      propertyAddress: certificate.propertyAddress,
      completionDate: certificate.completionDate.toISOString(),
      purposeType: certificate.purposeType,
      subsidyAmount: Number(certificate.subsidyAmount),
      issuerName: certificate.issuerName,
      issuerOfficeName: certificate.issuerOfficeName,
      issuerOrganizationType: certificate.issuerOrganizationType,
      issuerQualificationNumber: certificate.issuerQualificationNumber,
      issueDate: certificate.issueDate?.toISOString() || null,
      status: certificate.status,
      createdAt: certificate.createdAt.toISOString(),
      updatedAt: certificate.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error updating certificate:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update certificate',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/certificates/:id
 * 証明書を削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 証明書が存在するか確認
    const existingCertificate = await prisma.certificate.findUnique({
      where: { id },
    });

    if (!existingCertificate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Certificate not found',
        },
        { status: 404 }
      );
    }

    // 証明書を削除（カスケード削除により関連する工事データも削除される）
    await prisma.certificate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Certificate deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete certificate',
      },
      { status: 500 }
    );
  }
}
