/**
 * クライアント側データモデル型定義
 *
 * IndexedDB (Dexie.js) に保存する証明書・工事データの型。
 * サーバーDB (Prisma) には依存せず、ブラウザ内で完結する。
 */

import type { IssuerInfo } from '@/types/issuer';

// =============================================
// 共通
// =============================================

/** 工事種別の識別子 */
export type WorkCategory =
  | 'seismic'
  | 'barrierFree'
  | 'energySaving'
  | 'cohabitation'
  | 'childcare'
  | 'longTermHousing'
  | 'otherRenovation';

/** 証明書の用途 */
export type PurposeType = 'housing_loan' | 'reform_tax' | 'resale' | 'property_tax';

/** 証明書のステータス */
export type CertificateStatus = 'draft' | 'completed';

// =============================================
// 工事明細
// =============================================

/** 標準工事（単価 x 数量 x 割合） */
export interface StandardWorkItem {
  id: string;
  workTypeCode: string;
  workName: string;
  category: string;
  unitPrice: number;
  unit: string;
  quantity: number;
  residentRatio: number;       // 0-100
  calculatedAmount: number;
  // 省エネ固有
  regionCode?: string;
  windowAreaRatio?: number;    // 0-100
}

/** その他増改築工事（直接金額入力） */
export interface OtherRenovationItem {
  id: string;
  categoryCode: string;
  categoryName: string;
  workDescription: string;
  amount: number;
  residentRatio: number;       // 0-100
  calculatedAmount: number;
}

/** 工事サマリー（種別ごとの集計） */
export interface WorkSummary {
  totalAmount: number;
  subsidyAmount: number;
  deductibleAmount: number;
  // 省エネ固有
  hasSolarPower?: boolean;
  // 長期優良固有
  isExcellentHousing?: boolean;
}

/** 工事データ（種別別にまとめたもの） */
export interface WorkData {
  seismic: { items: StandardWorkItem[]; summary: WorkSummary | null };
  barrierFree: { items: StandardWorkItem[]; summary: WorkSummary | null };
  energySaving: { items: StandardWorkItem[]; summary: WorkSummary | null };
  cohabitation: { items: StandardWorkItem[]; summary: WorkSummary | null };
  childcare: { items: StandardWorkItem[]; summary: WorkSummary | null };
  longTermHousing: { items: StandardWorkItem[]; summary: WorkSummary | null };
  otherRenovation: { items: OtherRenovationItem[]; summary: WorkSummary | null };
}

// =============================================
// 住宅借入金等特別控除 詳細
// =============================================

export interface HousingLoanWorkType {
  selected: boolean;
  description?: string;
}

export interface HousingLoanDetail {
  workTypes: {
    work1?: HousingLoanWorkType; // 第1号工事（増築等）
    work2?: HousingLoanWorkType; // 第2号工事（耐震）
    work3?: HousingLoanWorkType; // 第3号工事（バリアフリー）
    work4?: HousingLoanWorkType; // 第4号工事（省エネ）
    work5?: HousingLoanWorkType; // 第5号工事（同居対応）
    work6?: HousingLoanWorkType; // 第6号工事（長期優良住宅化）
  };
  workDescription: string;
  totalCost: number;
  hasSubsidy: boolean;
  subsidyAmount: number;
  deductibleAmount: number;
}

// =============================================
// 証明書（メインエンティティ）
// =============================================

export interface Certificate {
  /** UUID (crypto.randomUUID()) */
  id: string;

  /** 所有ユーザーID（認証済みの場合） */
  userId?: string;

  // 基本情報
  applicantName: string;
  applicantAddress: string;
  propertyNumber: string;
  propertyAddress: string;
  completionDate: string;          // ISO 8601 (YYYY-MM-DD)

  // 用途区分
  purposeType: PurposeType;

  // 発行者情報
  issuerName: string;
  issuerOfficeName: string;
  issueDate: string;               // ISO 8601 (YYYY-MM-DD)
  issuerOrganizationType: string;
  issuerQualificationNumber: string;

  // 発行者情報（リッチデータ）
  issuerInfo?: IssuerInfo | null;

  // 補助金
  subsidyAmount: number;

  // ステータス
  status: CertificateStatus;

  // 工事データ（ネストして1レコードに保存）
  works: WorkData;

  // 実施した工事の内容（工事種別ごとの説明テキスト）
  workDescriptions?: Record<string, string>;

  // 住宅ローン詳細（housing_loan の場合のみ）
  housingLoanDetail: HousingLoanDetail | null;

  // タイムスタンプ
  createdAt: string;               // ISO 8601
  updatedAt: string;               // ISO 8601
}

// =============================================
// エクスポート/インポート用
// =============================================

export interface ExportData {
  version: number;
  exportedAt: string;
  certificates: Certificate[];
}

// =============================================
// 空オブジェクトファクトリ
// =============================================

export function createEmptyWorkData(): WorkData {
  return {
    seismic: { items: [], summary: null },
    barrierFree: { items: [], summary: null },
    energySaving: { items: [], summary: null },
    cohabitation: { items: [], summary: null },
    childcare: { items: [], summary: null },
    longTermHousing: { items: [], summary: null },
    otherRenovation: { items: [], summary: null },
  };
}

export function createEmptyHousingLoanDetail(): HousingLoanDetail {
  return {
    workTypes: {},
    workDescription: '',
    totalCost: 0,
    hasSubsidy: false,
    subsidyAmount: 0,
    deductibleAmount: 0,
  };
}

export function createNewCertificate(purposeType: PurposeType = 'housing_loan'): Certificate {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    applicantName: '',
    applicantAddress: '',
    propertyNumber: '',
    propertyAddress: '',
    completionDate: '',
    purposeType,
    issuerName: '',
    issuerOfficeName: '',
    issueDate: '',
    issuerOrganizationType: '',
    issuerQualificationNumber: '',
    issuerInfo: null,
    subsidyAmount: 0,
    status: 'draft',
    works: createEmptyWorkData(),
    housingLoanDetail: purposeType === 'housing_loan' ? createEmptyHousingLoanDetail() : null,
    createdAt: now,
    updatedAt: now,
  };
}
