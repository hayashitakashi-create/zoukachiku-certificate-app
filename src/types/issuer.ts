// 建築士の資格種別
export type ArchitectQualification = 'first_class' | 'second_class' | 'wooden';

// 建築基準適合判定資格者の種別
export type BuildingStandardCertifier = 'first_class' | 'general' | 'none';

// （1）登録建築士事務所に属する建築士の場合
export type RegisteredArchitectOfficeIssuer = {
  organizationType: 'registered_architect_office';

  // 建築士個人情報
  architectName: string;
  architectQualification: ArchitectQualification; // 一級/二級/木造
  architectRegistrationNumber: string; // 登録番号
  architectRegistrationPrefecture?: string; // 登録都道府県名（二級/木造の場合）

  // 事務所情報
  officeName: string; // 名称
  officeAddress: string; // 所在地
  officeType: 'first_class' | 'second_class' | 'wooden'; // 一級/二級/木造建築士事務所
  officeRegistrationDate?: string; // 登録年月日
  officeRegistrationNumber?: string; // 登録番号
};

// （2）指定確認検査機関の場合
export type DesignatedInspectionAgencyIssuer = {
  organizationType: 'designated_inspection_agency';

  // 機関情報
  agencyName: string; // 名称
  agencyAddress: string; // 住所
  agencyDesignationDate?: string; // 指定年月日
  agencyDesignationNumber?: string; // 指定番号
  agencyDesignator: string; // 指定をした者

  // 調査を行った建築士
  architectName: string;
  architectQualification: ArchitectQualification;
  architectRegistrationNumber: string;
  architectRegistrationPrefecture?: string;

  // 建築基準適合判定資格者の場合
  buildingStandardCertifier: BuildingStandardCertifier;
  certifierRegistrationNumber?: string; // 登録番号
  certifierRegistrationAuthority?: string; // 登録を受けた地方整備局等名
};

// （3）登録住宅性能評価機関の場合
export type RegisteredEvaluationAgencyIssuer = {
  organizationType: 'registered_evaluation_agency';

  // 機関情報
  agencyName: string;
  agencyAddress: string;
  agencyRegistrationDate?: string; // 登録年月日
  agencyRegistrationNumber?: string; // 指定番号
  agencyRegistrar: string; // 登録をした者

  // 調査を行った建築士
  architectName: string;
  architectQualification: ArchitectQualification;
  architectRegistrationNumber: string;
  architectRegistrationPrefecture?: string;

  // 建築基準適合判定資格者の場合
  buildingStandardCertifier: BuildingStandardCertifier;
  certifierRegistrationNumber?: string;
  certifierRegistrationAuthority?: string;
};

// （4）住宅瑕疵担保責任保険法人の場合
export type WarrantyInsuranceCorporationIssuer = {
  organizationType: 'warranty_insurance_corporation';

  // 法人情報
  corporationName: string; // 名称
  corporationAddress: string; // 住所
  corporationDesignationDate?: string; // 指定年月日

  // 調査を行った建築士
  architectName: string;
  architectQualification: ArchitectQualification;
  architectRegistrationNumber: string;
  architectRegistrationPrefecture?: string;

  // 建築基準適合判定資格者の場合
  buildingStandardCertifier: BuildingStandardCertifier;
  certifierRegistrationNumber?: string;
  certifierRegistrationAuthority?: string;
};

// 証明者情報の統合型
export type IssuerInfo =
  | RegisteredArchitectOfficeIssuer
  | DesignatedInspectionAgencyIssuer
  | RegisteredEvaluationAgencyIssuer
  | WarrantyInsuranceCorporationIssuer;

// ヘルパー関数：組織種別の日本語名を取得
export function getOrganizationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    registered_architect_office: '登録建築士事務所',
    designated_inspection_agency: '指定確認検査機関',
    registered_evaluation_agency: '登録住宅性能評価機関',
    warranty_insurance_corporation: '住宅瑕疵担保責任保険法人',
  };
  return labels[type] || '';
}

// 事務所種別の日本語名を取得
export function getOfficeTypeLabel(officeType: string): string {
  const labels: Record<string, string> = {
    first_class: '一級建築士事務所',
    second_class: '二級建築士事務所',
    wooden: '木造建築士事務所',
  };
  return labels[officeType] || '';
}

// 建築士資格種別の日本語名を取得
export function getArchitectQualificationLabel(qualification: ArchitectQualification): string {
  const labels: Record<ArchitectQualification, string> = {
    first_class: '一級建築士',
    second_class: '二級建築士',
    wooden: '木造建築士',
  };
  return labels[qualification];
}

// 建築基準適合判定資格者の日本語名を取得
export function getBuildingStandardCertifierLabel(certifier: BuildingStandardCertifier): string {
  const labels: Record<BuildingStandardCertifier, string> = {
    first_class: '一級建築基準適合判定資格者',
    general: '建築基準適合判定資格者',
    none: 'なし',
  };
  return labels[certifier];
}
