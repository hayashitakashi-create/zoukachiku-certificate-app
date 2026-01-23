import { z } from 'zod';

/**
 * 証明書作成・更新リクエストスキーマ
 */
export const createCertificateRequestSchema = z.object({
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

  // 証明者情報
  issuerName: z.string().min(1, '証明者氏名は必須です'),
  issuerOfficeName: z.string().min(1, '所属事務所名は必須です'),
  issuerOrganizationType: z.string().min(1, '組織種別は必須です'),
  issuerQualificationNumber: z.string().optional(),
  issueDate: z.string().min(1, '発行日は必須です'),

  // ステータス
  status: z.enum(['draft', 'completed', 'issued']).default('draft'),
});

export type CreateCertificateRequest = z.infer<typeof createCertificateRequestSchema>;

/**
 * 証明書更新リクエストスキーマ
 */
export const updateCertificateRequestSchema = createCertificateRequestSchema.partial();

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
