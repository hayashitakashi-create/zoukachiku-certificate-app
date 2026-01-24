import { z } from 'zod';

/**
 * 基本スキーマ（refinement適用前）
 */
const baseCertificateSchema = z.object({
  // 基本情報
  applicantName: z.string().min(1, '申請者氏名は必須です'),
  applicantAddress: z.string().min(1, '申請者住所は必須です'),
  propertyNumber: z.string().optional(),
  propertyAddress: z.string().min(1, '物件所在地は必須です'),
  completionDate: z.string().min(1, '工事完了年月日は必須です'),

  // 用途区分
  purposeType: z.enum(['housing_loan', 'reform_tax', 'resale', 'property_tax']),

  // 選択された工事種別
  selectedWorkTypes: z.array(z.string()),

  // 補助金額
  subsidyAmount: z.number().min(0).default(0),

  // 証明者情報（draft時は任意、issued時は必須）
  issuerName: z.string().optional(),
  issuerOfficeName: z.string().optional(),
  issuerOrganizationType: z.string().optional(),
  issuerQualificationNumber: z.string().optional(),
  issueDate: z.string().optional(),

  // ステータス
  status: z.enum(['draft', 'completed', 'issued']).default('draft'),
});

/**
 * 証明書作成リクエストスキーマ（refinement適用）
 */
export const createCertificateRequestSchema = baseCertificateSchema.refine((data) => {
  // issued または completed の場合は証明者情報が必須
  if (data.status === 'issued' || data.status === 'completed') {
    return (
      data.issuerName &&
      data.issuerName.length > 0 &&
      data.issuerOfficeName &&
      data.issuerOfficeName.length > 0 &&
      data.issuerOrganizationType &&
      data.issuerOrganizationType.length > 0 &&
      data.issueDate &&
      data.issueDate.length > 0
    );
  }
  return true;
}, {
  message: '証明書を発行する場合は証明者情報と発行日が必須です',
  path: ['issuerName'],
});

export type CreateCertificateRequest = z.infer<typeof createCertificateRequestSchema>;

/**
 * 証明書更新リクエストスキーマ（全フィールドオプショナル）
 */
export const updateCertificateRequestSchema = baseCertificateSchema.partial();

export type UpdateCertificateRequest = z.infer<typeof updateCertificateRequestSchema>;

/**
 * 証明書レスポンス型
 */
export interface CertificateResponse {
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
}

/**
 * 証明書一覧レスポンス型
 */
export interface CertificateListResponse {
  certificates: CertificateResponse[];
  total: number;
}
