import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCertificateRequestSchema } from './types';
import type { CertificateResponse, CertificateListResponse } from './types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/certificates
 * 証明書一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // フィルタ条件
    const where: any = {};
    if (status) {
      where.status = status;
    }

    // 証明書一覧を取得
    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.certificate.count({ where }),
    ]);

    const response: CertificateListResponse = {
      certificates: certificates.map((cert) => ({
        id: cert.id,
        applicantName: cert.applicantName,
        applicantAddress: cert.applicantAddress,
        propertyNumber: cert.propertyNumber,
        propertyAddress: cert.propertyAddress,
        completionDate: cert.completionDate.toISOString(),
        purposeType: cert.purposeType,
        subsidyAmount: Number(cert.subsidyAmount),
        issuerName: cert.issuerName,
        issuerOfficeName: cert.issuerOfficeName,
        issuerOrganizationType: cert.issuerOrganizationType,
        issuerQualificationNumber: cert.issuerQualificationNumber,
        issueDate: cert.issueDate?.toISOString() || null,
        status: cert.status,
        createdAt: cert.createdAt.toISOString(),
        updatedAt: cert.updatedAt.toISOString(),
      })),
      total,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch certificates',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/certificates
 * 新規証明書を作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const validationResult = createCertificateRequestSchema.safeParse(body);
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

    // 証明書を作成
    const certificate = await prisma.certificate.create({
      data: {
        applicantName: data.applicantName,
        applicantAddress: data.applicantAddress,
        propertyNumber: data.propertyNumber || null,
        propertyAddress: data.propertyAddress,
        completionDate: new Date(data.completionDate),
        purposeType: data.purposeType,
        subsidyAmount: data.subsidyAmount,
        issuerName: data.issuerName || null,
        issuerOfficeName: data.issuerOfficeName || null,
        issuerOrganizationType: data.issuerOrganizationType || null,
        issuerQualificationNumber: data.issuerQualificationNumber || null,
        issueDate: data.issueDate ? new Date(data.issueDate) : null,
        status: data.status,
      },
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

    return NextResponse.json(
      {
        success: true,
        data: response,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating certificate:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create certificate',
      },
      { status: 500 }
    );
  }
}
