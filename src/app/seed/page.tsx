'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/store/db';
import type {
  Certificate,
  WorkData,
  HousingLoanDetail,
  StandardWorkItem,
  OtherRenovationItem,
  WorkSummary,
  PurposeType,
  CertificateStatus,
} from '@/lib/store/types';
import type { IssuerInfo } from '@/types/issuer';
import { createEmptyWorkData, createEmptyHousingLoanDetail } from '@/lib/store/types';

// =============================================
// ヘルパー
// =============================================

function workItem(overrides: Partial<StandardWorkItem> & { id: string; workTypeCode: string; workName: string }): StandardWorkItem {
  return {
    category: '',
    unitPrice: 0,
    unit: '㎡',
    quantity: 0,
    residentRatio: 100,
    calculatedAmount: 0,
    ...overrides,
  };
}

function otherItem(overrides: Partial<OtherRenovationItem> & { id: string }): OtherRenovationItem {
  return {
    categoryCode: 'other',
    categoryName: 'その他',
    workDescription: '',
    amount: 0,
    residentRatio: 100,
    calculatedAmount: 0,
    ...overrides,
  };
}

function summary(total: number, subsidy: number = 0, extra?: Partial<WorkSummary>): WorkSummary {
  return {
    totalAmount: total,
    subsidyAmount: subsidy,
    deductibleAmount: total - subsidy,
    ...extra,
  };
}

// =============================================
// 10件のテストデータ（工事・証明者情報入り）
// =============================================

function buildCertificates(): Certificate[] {
  const certs: Certificate[] = [];

  // --- 1. 田中太郎: 住宅ローン / 完了 / 耐震+バリアフリー工事あり ---
  {
    const works = createEmptyWorkData();
    works.seismic = {
      items: [
        workItem({ id: 's1', workTypeCode: 'seismic_wood_foundation', workName: '木造住宅:基礎に係る耐震改修', category: '木造', unitPrice: 15400, unit: '㎡', quantity: 60, residentRatio: 100, calculatedAmount: 924000 }),
        workItem({ id: 's2', workTypeCode: 'seismic_wood_wall', workName: '木造住宅:壁に係る耐震改修', category: '木造', unitPrice: 22500, unit: '㎡', quantity: 80, residentRatio: 100, calculatedAmount: 1800000 }),
      ],
      summary: summary(2724000, 0),
    };
    works.barrierFree = {
      items: [
        workItem({ id: 'bf1', workTypeCode: 'bf_handrail_bathroom', workName: '浴室に手すりを取り付ける工事', category: '手すり', unitPrice: 37200, unit: '箇所', quantity: 2, residentRatio: 100, calculatedAmount: 74400 }),
      ],
      summary: summary(74400, 0),
    };
    const hl = createEmptyHousingLoanDetail();
    hl.totalCost = 2798400;
    hl.hasSubsidy = false;
    hl.subsidyAmount = 0;
    hl.deductibleAmount = 2500000;
    hl.workDescription = '木造2階建て住宅の基礎・壁の耐震補強工事、浴室手すり設置';
    hl.workTypes = { work1: { selected: true, description: '耐震改修' }, work3: { selected: true, description: 'バリアフリー' } };

    certs.push(makeCert({
      applicantName: '田中太郎', applicantAddress: '東京都新宿区西新宿1-1-1',
      propertyAddress: '東京都新宿区西新宿1-1-1', propertyNumber: '1234-5',
      completionDate: '2025-06-15', purposeType: 'housing_loan', status: 'completed',
      issuerName: '山田一郎', issuerOfficeName: '山田一級建築士事務所',
      issuerOrganizationType: 'registered_architect_office',
      issuerQualificationNumber: '東京都知事登録 第12345号',
      issuerInfo: {
        organizationType: 'registered_architect_office',
        architectName: '山田一郎',
        architectQualification: 'first_class',
        architectRegistrationNumber: '第123456号',
        officeName: '山田一級建築士事務所',
        officeAddress: '東京都新宿区西新宿2-8-1',
        officeType: 'first_class',
        officeRegistrationDate: '2015-04-01',
        officeRegistrationNumber: '東京都知事登録 第12345号',
      },
      issueDate: '2025-07-01', subsidyAmount: 0, works, housingLoanDetail: hl,
    }, 0));
  }

  // --- 2. 佐藤花子: 住宅ローン / 下書き / 省エネ工事あり ---
  {
    const works = createEmptyWorkData();
    works.energySaving = {
      items: [
        workItem({ id: 'es1', workTypeCode: 'es_glass_all_regions', workName: 'ガラスの交換(1から8地域まで)', category: '窓', unitPrice: 6300, unit: '㎡', quantity: 120, residentRatio: 100, calculatedAmount: 756000, windowAreaRatio: 15 }),
        workItem({ id: 'es2', workTypeCode: 'es_ceiling_insulation', workName: '天井等の断熱性を高める工事', category: '断熱', unitPrice: 2700, unit: '㎡', quantity: 65, residentRatio: 100, calculatedAmount: 175500 }),
      ],
      summary: summary(931500, 500000, { hasSolarPower: false }),
    };
    const hl = createEmptyHousingLoanDetail();
    hl.totalCost = 931500;
    hl.hasSubsidy = true;
    hl.subsidyAmount = 500000;
    hl.deductibleAmount = 431500;
    hl.workDescription = '全窓ガラス交換による断熱性能向上、天井断熱改修';
    hl.workTypes = { work4: { selected: true, description: '省エネ改修' } };

    certs.push(makeCert({
      applicantName: '佐藤花子', applicantAddress: '大阪府大阪市北区梅田2-2-2',
      propertyAddress: '大阪府大阪市北区梅田2-2-2', propertyNumber: '5678-9',
      completionDate: '2025-08-20', purposeType: 'housing_loan', status: 'draft',
      issuerName: '鈴木次郎', issuerOfficeName: '鈴木設計事務所',
      issuerOrganizationType: 'registered_architect_office',
      issuerQualificationNumber: '大阪府知事登録 第67890号',
      issuerInfo: {
        organizationType: 'registered_architect_office',
        architectName: '鈴木次郎',
        architectQualification: 'first_class',
        architectRegistrationNumber: '第234567号',
        officeName: '鈴木設計事務所',
        officeAddress: '大阪府大阪市北区梅田3-1-1',
        officeType: 'first_class',
        officeRegistrationDate: '2018-06-15',
        officeRegistrationNumber: '大阪府知事登録 第67890号',
      },
      issueDate: '', subsidyAmount: 500000, works, housingLoanDetail: hl,
    }, 1));
  }

  // --- 3. 鈴木一郎: 固定資産税 / 完了 / 耐震工事あり ---
  {
    const works = createEmptyWorkData();
    works.seismic = {
      items: [
        workItem({ id: 's3', workTypeCode: 'seismic_nonwood_wall', workName: '非木造住宅:壁に係る耐震改修', category: '非木造', unitPrice: 50400, unit: '㎡', quantity: 45, residentRatio: 100, calculatedAmount: 2268000 }),
      ],
      summary: summary(2268000, 200000),
    };

    certs.push(makeCert({
      applicantName: '鈴木一郎', applicantAddress: '愛知県名古屋市中区栄3-3-3',
      propertyAddress: '愛知県名古屋市中区栄3-3-3', propertyNumber: '2468-0',
      completionDate: '2025-05-10', purposeType: 'property_tax', status: 'completed',
      issuerName: '高橋三郎', issuerOfficeName: '高橋建築設計事務所',
      issuerOrganizationType: 'registered_architect_office',
      issuerQualificationNumber: '愛知県知事登録 第11111号',
      issuerInfo: {
        organizationType: 'registered_architect_office',
        architectName: '高橋三郎',
        architectQualification: 'first_class',
        architectRegistrationNumber: '第345678号',
        officeName: '高橋建築設計事務所',
        officeAddress: '愛知県名古屋市中区栄4-5-6',
        officeType: 'first_class',
        officeRegistrationDate: '2010-09-01',
        officeRegistrationNumber: '愛知県知事登録 第11111号',
      },
      issueDate: '2025-06-01', subsidyAmount: 200000, works, housingLoanDetail: null,
    }, 2));
  }

  // --- 4. 高橋美咲: 住宅ローン / 下書き / 同居対応工事あり ---
  {
    const works = createEmptyWorkData();
    works.cohabitation = {
      items: [
        workItem({ id: 'co1', workTypeCode: 'cohab_kitchen_full', workName: '調理室増設（ミニキッチン以外のキッチンの設置）', category: '調理室の増設', unitPrice: 1622000, unit: '箇所', quantity: 1, residentRatio: 100, calculatedAmount: 1622000 }),
        workItem({ id: 'co2', workTypeCode: 'cohab_bath_with_heater', workName: '浴室増設（給湯設備の設置又は取替えを伴う浴槽の設置）', category: '浴室の増設', unitPrice: 1373800, unit: '箇所', quantity: 1, residentRatio: 100, calculatedAmount: 1373800 }),
      ],
      summary: summary(2995800, 0),
    };
    const hl = createEmptyHousingLoanDetail();
    hl.totalCost = 2995800;
    hl.hasSubsidy = false;
    hl.subsidyAmount = 0;
    hl.deductibleAmount = 2500000;
    hl.workDescription = '二世帯同居のためのキッチン・浴室増設工事';
    hl.workTypes = { work5: { selected: true, description: '同居対応改修' } };

    certs.push(makeCert({
      applicantName: '高橋美咲', applicantAddress: '福岡県福岡市博多区博多駅前4-4-4',
      propertyAddress: '福岡県福岡市博多区博多駅前4-4-4', propertyNumber: '1357-2',
      completionDate: '2025-09-01', purposeType: 'housing_loan', status: 'draft',
      issuerName: '佐々木四郎', issuerOfficeName: '佐々木建築事務所',
      issuerOrganizationType: 'registered_architect_office',
      issuerQualificationNumber: '福岡県知事登録 第22222号',
      issuerInfo: {
        organizationType: 'registered_architect_office',
        architectName: '佐々木四郎',
        architectQualification: 'second_class',
        architectRegistrationNumber: '第456789号',
        architectRegistrationPrefecture: '福岡県',
        officeName: '佐々木建築事務所',
        officeAddress: '福岡県福岡市博多区博多駅前5-1-1',
        officeType: 'second_class',
        officeRegistrationDate: '2020-03-15',
        officeRegistrationNumber: '福岡県知事登録 第22222号',
      },
      issueDate: '', subsidyAmount: 0, works, housingLoanDetail: hl,
    }, 3));
  }

  // --- 5. 渡辺健太: 特別税額控除 / 完了 / 省エネ+その他工事 ---
  {
    const works = createEmptyWorkData();
    works.energySaving = {
      items: [
        workItem({ id: 'es3', workTypeCode: 'es_sash_glass_567', workName: 'サッシ及びガラスの交換(5,6及び7地域)', category: '窓', unitPrice: 15000, unit: '㎡', quantity: 90, residentRatio: 100, calculatedAmount: 1350000, windowAreaRatio: 20 }),
      ],
      summary: summary(1350000, 300000, { hasSolarPower: false }),
    };
    works.otherRenovation = {
      items: [
        otherItem({ id: 'or1', categoryCode: 'interior', categoryName: '内装工事', workDescription: 'リビング・廊下のフローリング張替え', amount: 850000, residentRatio: 100, calculatedAmount: 850000 }),
        otherItem({ id: 'or2', categoryCode: 'plumbing', categoryName: '給排水設備工事', workDescription: '給水管・排水管の更新', amount: 620000, residentRatio: 100, calculatedAmount: 620000 }),
      ],
      summary: summary(1470000, 0),
    };

    certs.push(makeCert({
      applicantName: '渡辺健太', applicantAddress: '北海道札幌市中央区大通西5-5-5',
      propertyAddress: '北海道札幌市中央区大通西5-5-5', propertyNumber: '9876-1',
      completionDate: '2025-04-25', purposeType: 'reform_tax', status: 'completed',
      issuerName: '中村五郎', issuerOfficeName: '中村一級建築士事務所',
      issuerOrganizationType: 'registered_architect_office',
      issuerQualificationNumber: '北海道知事登録 第33333号',
      issuerInfo: {
        organizationType: 'registered_architect_office',
        architectName: '中村五郎',
        architectQualification: 'first_class',
        architectRegistrationNumber: '第567890号',
        officeName: '中村一級建築士事務所',
        officeAddress: '北海道札幌市中央区大通西6-2-3',
        officeType: 'first_class',
        officeRegistrationDate: '2012-07-01',
        officeRegistrationNumber: '北海道知事登録 第33333号',
      },
      issueDate: '2025-05-15', subsidyAmount: 300000, works, housingLoanDetail: null,
    }, 4));
  }

  // --- 6. 伊藤直美: 住宅ローン / 下書き / バリアフリー工事 ---
  {
    const works = createEmptyWorkData();
    works.barrierFree = {
      items: [
        workItem({ id: 'bf2', workTypeCode: 'bf_passage_expansion', workName: '通路の幅を拡張するもの', category: '通路・出入口拡幅', unitPrice: 166100, unit: '㎡', quantity: 3, residentRatio: 100, calculatedAmount: 498300 }),
        workItem({ id: 'bf3', workTypeCode: 'bf_step_elimination', workName: '床の段差を解消する工事', category: '段差解消', unitPrice: 76400, unit: '箇所', quantity: 5, residentRatio: 100, calculatedAmount: 382000 }),
        workItem({ id: 'bf4', workTypeCode: 'bf_handrail_corridor', workName: '廊下に手すりを取り付ける工事', category: '手すり', unitPrice: 12800, unit: 'm', quantity: 8, residentRatio: 100, calculatedAmount: 102400 }),
      ],
      summary: summary(982700, 100000),
    };
    const hl = createEmptyHousingLoanDetail();
    hl.totalCost = 982700;
    hl.hasSubsidy = true;
    hl.subsidyAmount = 100000;
    hl.deductibleAmount = 882700;
    hl.workDescription = '高齢者対応のための通路拡幅、段差解消、手すり設置工事';
    hl.workTypes = { work3: { selected: true, description: 'バリアフリー改修' } };

    certs.push(makeCert({
      applicantName: '伊藤直美', applicantAddress: '宮城県仙台市青葉区一番町6-6-6',
      propertyAddress: '宮城県仙台市青葉区一番町6-6-6', propertyNumber: '4321-8',
      completionDate: '2025-10-10', purposeType: 'housing_loan', status: 'draft',
      issuerName: '小林六郎', issuerOfficeName: '小林設計事務所',
      issuerOrganizationType: 'registered_architect_office',
      issuerQualificationNumber: '宮城県知事登録 第44444号',
      issuerInfo: {
        organizationType: 'registered_architect_office',
        architectName: '小林六郎',
        architectQualification: 'wooden',
        architectRegistrationNumber: '第678901号',
        architectRegistrationPrefecture: '宮城県',
        officeName: '小林設計事務所',
        officeAddress: '宮城県仙台市青葉区一番町7-3-2',
        officeType: 'wooden',
        officeRegistrationDate: '2019-11-01',
        officeRegistrationNumber: '宮城県知事登録 第44444号',
      },
      issueDate: '', subsidyAmount: 100000, works, housingLoanDetail: hl,
    }, 5));
  }

  // --- 7. 山本大輔: 固定資産税 / 完了 / 省エネ（太陽光）+長期優良 ---
  {
    const works = createEmptyWorkData();
    works.energySaving = {
      items: [
        workItem({ id: 'es4', workTypeCode: 'es_wall_insulation', workName: '壁の断熱性を高める工事', category: '断熱', unitPrice: 5600, unit: '㎡', quantity: 110, residentRatio: 100, calculatedAmount: 616000 }),
        workItem({ id: 'es5', workTypeCode: 'es_solar_power', workName: '太陽光発電設備設置工事', category: '太陽光発電', unitPrice: 326000, unit: 'kW', quantity: 5, residentRatio: 100, calculatedAmount: 1630000 }),
      ],
      summary: summary(2246000, 0, { hasSolarPower: true }),
    };
    works.longTermHousing = {
      items: [
        workItem({ id: 'lh1', workTypeCode: 'lth_bathroom_unit_bath', workName: '浴室のユニットバス化', category: '浴室又は脱衣室の防水工事', unitPrice: 896900, unit: '箇所', quantity: 2, residentRatio: 100, calculatedAmount: 1793800 }),
        workItem({ id: 'lh2', workTypeCode: 'lth_underfloor_concrete', workName: '床下のコンクリート打設', category: '床下の防湿工事', unitPrice: 12700, unit: '㎡', quantity: 50, residentRatio: 100, calculatedAmount: 635000 }),
      ],
      summary: summary(2428800, 0, { isExcellentHousing: true }),
    };

    certs.push(makeCert({
      applicantName: '山本大輔', applicantAddress: '広島県広島市中区紙屋町7-7-7',
      propertyAddress: '広島県広島市中区紙屋町7-7-7', propertyNumber: '6543-3',
      completionDate: '2025-03-30', purposeType: 'property_tax', status: 'completed',
      issuerName: '加藤七郎', issuerOfficeName: '加藤建築士事務所',
      issuerOrganizationType: 'registered_architect_office',
      issuerQualificationNumber: '広島県知事登録 第55555号',
      issuerInfo: {
        organizationType: 'registered_architect_office',
        architectName: '加藤七郎',
        architectQualification: 'first_class',
        architectRegistrationNumber: '第789012号',
        officeName: '加藤建築士事務所',
        officeAddress: '広島県広島市中区紙屋町8-1-5',
        officeType: 'first_class',
        officeRegistrationDate: '2008-05-20',
        officeRegistrationNumber: '広島県知事登録 第55555号',
      },
      issueDate: '2025-04-10', subsidyAmount: 0, works, housingLoanDetail: null,
    }, 6));
  }

  // --- 8. 中村さくら: 住宅ローン / 下書き / 子育て工事 ---
  {
    const works = createEmptyWorkData();
    works.childcare = {
      items: [
        workItem({ id: 'cc1', workTypeCode: 'childcare_child_fence_prefab', workName: 'チャイルドフェンスの設置工事（既製品の取付け）', category: '子どもの事故を防止するための工事', unitPrice: 15000, unit: '箇所', quantity: 3, residentRatio: 100, calculatedAmount: 45000 }),
        workItem({ id: 'cc2', workTypeCode: 'childcare_door_finger_guard', workName: '室内ドアの指の挟み込み防止措置工事', category: '子どもの事故を防止するための工事', unitPrice: 104500, unit: '箇所', quantity: 6, residentRatio: 100, calculatedAmount: 627000 }),
      ],
      summary: summary(672000, 0),
    };
    const hl = createEmptyHousingLoanDetail();
    hl.totalCost = 672000;
    hl.hasSubsidy = false;
    hl.subsidyAmount = 0;
    hl.deductibleAmount = 672000;
    hl.workDescription = '子育て環境改善のためのチャイルドフェンス・ドア安全装置設置';
    hl.workTypes = { work6: { selected: true, description: '子育て対応改修' } };

    certs.push(makeCert({
      applicantName: '中村さくら', applicantAddress: '京都府京都市左京区下鴨8-8-8',
      propertyAddress: '京都府京都市左京区下鴨8-8-8', propertyNumber: '7890-4',
      completionDate: '2025-11-20', purposeType: 'housing_loan', status: 'draft',
      issuerName: '松本八郎', issuerOfficeName: '松本建築設計事務所',
      issuerOrganizationType: 'registered_architect_office',
      issuerQualificationNumber: '京都府知事登録 第66666号',
      issuerInfo: {
        organizationType: 'registered_architect_office',
        architectName: '松本八郎',
        architectQualification: 'second_class',
        architectRegistrationNumber: '第890123号',
        architectRegistrationPrefecture: '京都府',
        officeName: '松本建築設計事務所',
        officeAddress: '京都府京都市左京区下鴨9-2-1',
        officeType: 'second_class',
        officeRegistrationDate: '2021-01-10',
        officeRegistrationNumber: '京都府知事登録 第66666号',
      },
      issueDate: '', subsidyAmount: 0, works, housingLoanDetail: hl,
    }, 7));
  }

  // --- 9. 小林誠: 既存住宅売買瑕疵保険 / 完了 / 耐震+省エネ+その他 ---
  {
    const works = createEmptyWorkData();
    works.seismic = {
      items: [
        workItem({ id: 's4', workTypeCode: 'seismic_wood_roof', workName: '木造住宅:屋根に係る耐震改修', category: '木造', unitPrice: 19300, unit: '㎡', quantity: 70, residentRatio: 100, calculatedAmount: 1351000 }),
      ],
      summary: summary(1351000, 0),
    };
    works.energySaving = {
      items: [
        workItem({ id: 'es6', workTypeCode: 'es_floor_insulation', workName: '床の断熱性を高める工事', category: '断熱', unitPrice: 3400, unit: '㎡', quantity: 70, residentRatio: 100, calculatedAmount: 238000 }),
      ],
      summary: summary(238000, 0),
    };
    works.otherRenovation = {
      items: [
        otherItem({ id: 'or3', categoryCode: 'exterior', categoryName: '外装工事', workDescription: '外壁塗装・防水工事', amount: 1200000, residentRatio: 100, calculatedAmount: 1200000 }),
      ],
      summary: summary(1200000, 150000),
    };

    certs.push(makeCert({
      applicantName: '小林誠', applicantAddress: '神奈川県横浜市西区みなとみらい9-9-9',
      propertyAddress: '神奈川県横浜市西区みなとみらい9-9-9', propertyNumber: '1111-1',
      completionDate: '2025-07-05', purposeType: 'resale', status: 'completed',
      issuerName: '吉田九郎', issuerOfficeName: '吉田総合設計事務所',
      issuerOrganizationType: 'designated_inspection_agency',
      issuerQualificationNumber: '国土交通大臣指定 第77777号',
      issuerInfo: {
        organizationType: 'designated_inspection_agency',
        agencyName: '吉田総合設計事務所',
        agencyAddress: '神奈川県横浜市西区みなとみらい10-1-1',
        agencyDesignationDate: '2005-04-01',
        agencyDesignationNumber: '国土交通大臣指定 第77777号',
        agencyDesignator: '国土交通大臣',
        architectName: '吉田九郎',
        architectQualification: 'first_class',
        architectRegistrationNumber: '第901234号',
        buildingStandardCertifier: 'none',
      },
      issueDate: '2025-08-01', subsidyAmount: 150000, works, housingLoanDetail: null,
    }, 8));
  }

  // --- 10. 加藤裕子: 住宅ローン / 下書き / 耐震+バリアフリー+省エネ+その他 ---
  {
    const works = createEmptyWorkData();
    works.seismic = {
      items: [
        workItem({ id: 's5', workTypeCode: 'seismic_wood_wall', workName: '木造住宅:壁に係る耐震改修', category: '木造', unitPrice: 22500, unit: '㎡', quantity: 95, residentRatio: 100, calculatedAmount: 2137500 }),
      ],
      summary: summary(2137500, 0),
    };
    works.barrierFree = {
      items: [
        workItem({ id: 'bf5', workTypeCode: 'bf_bathtub_low_height', workName: '浴槽をまたぎの高さの低いものに取り替える工事', category: '浴室', unitPrice: 529100, unit: '箇所', quantity: 1, residentRatio: 100, calculatedAmount: 529100 }),
      ],
      summary: summary(529100, 0),
    };
    works.energySaving = {
      items: [
        workItem({ id: 'es7', workTypeCode: 'es_inner_window_467', workName: '内窓の新設(4,5,6及び7地域)', category: '窓', unitPrice: 8100, unit: '㎡', quantity: 100, residentRatio: 100, calculatedAmount: 810000, windowAreaRatio: 18 }),
      ],
      summary: summary(810000, 0),
    };
    works.otherRenovation = {
      items: [
        otherItem({ id: 'or4', categoryCode: 'kitchen', categoryName: 'キッチン工事', workDescription: 'システムキッチン交換', amount: 1500000, residentRatio: 100, calculatedAmount: 1500000 }),
        otherItem({ id: 'or5', categoryCode: 'bathroom', categoryName: '浴室工事', workDescription: 'ユニットバス交換', amount: 1200000, residentRatio: 100, calculatedAmount: 1200000 }),
      ],
      summary: summary(2700000, 800000),
    };
    const hl = createEmptyHousingLoanDetail();
    hl.totalCost = 6176600;
    hl.hasSubsidy = true;
    hl.subsidyAmount = 800000;
    hl.deductibleAmount = 5376600;
    hl.workDescription = '耐震補強（壁）、浴槽交換（バリアフリー）、内窓設置（省エネ）、キッチン・浴室リフォーム';
    hl.workTypes = {
      work1: { selected: true, description: '耐震改修' },
      work3: { selected: true, description: 'バリアフリー' },
      work4: { selected: true, description: '省エネ改修' },
    };

    certs.push(makeCert({
      applicantName: '加藤裕子', applicantAddress: '兵庫県神戸市中央区三宮町10-10-10',
      propertyAddress: '兵庫県神戸市中央区三宮町10-10-10', propertyNumber: '2222-2',
      completionDate: '2025-12-01', purposeType: 'housing_loan', status: 'draft',
      issuerName: '田中十郎', issuerOfficeName: '田中建築設計事務所',
      issuerOrganizationType: 'registered_architect_office',
      issuerQualificationNumber: '兵庫県知事登録 第88888号',
      issuerInfo: {
        organizationType: 'registered_architect_office',
        architectName: '田中十郎',
        architectQualification: 'first_class',
        architectRegistrationNumber: '第012345号',
        officeName: '田中建築設計事務所',
        officeAddress: '兵庫県神戸市中央区三宮町11-5-3',
        officeType: 'first_class',
        officeRegistrationDate: '2016-08-01',
        officeRegistrationNumber: '兵庫県知事登録 第88888号',
      },
      issueDate: '', subsidyAmount: 800000, works, housingLoanDetail: hl,
    }, 9));
  }

  return certs;
}

interface CertInput {
  applicantName: string;
  applicantAddress: string;
  propertyAddress: string;
  propertyNumber: string;
  completionDate: string;
  purposeType: PurposeType;
  status: CertificateStatus;
  issuerName: string;
  issuerOfficeName: string;
  issuerOrganizationType: string;
  issuerQualificationNumber: string;
  issuerInfo?: IssuerInfo | null;
  issueDate: string;
  subsidyAmount: number;
  works: WorkData;
  housingLoanDetail: HousingLoanDetail | null;
}

function makeCert(input: CertInput, index: number): Certificate {
  const now = new Date();
  now.setMinutes(now.getMinutes() - (10 - index) * 30);
  return {
    id: crypto.randomUUID(),
    ...input,
    createdAt: now.toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// =============================================
// ページ
// =============================================

export default function SeedPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // セッション読み込み中は待機
    if (sessionStatus === 'loading') return;
    // 既に実行済みなら再実行しない
    if (status !== 'idle') return;

    async function seed() {
      setStatus('loading');
      try {
        // 既存データをクリア
        await db.certificates.clear();

        const userId = session?.user?.id;
        const certs = buildCertificates();
        for (const cert of certs) {
          // ログイン中のユーザーIDを設定（一覧に表示されるようにする）
          if (userId) {
            cert.userId = userId;
          }
          await db.certificates.add(cert);
        }

        const userInfo = userId ? `（ユーザーID: ${userId}）` : '（ゲストモード）';
        setMessage(`${certs.length}件の証明書を登録しました${userInfo}。3秒後にトップページへ移動します。`);
        setStatus('done');

        // ゲストモードcookieもセット
        document.cookie = 'guest-mode=true; path=/; max-age=2592000; SameSite=Lax';

        setTimeout(() => router.push('/'), 3000);
      } catch (error) {
        console.error('Seed error:', error);
        setMessage(`エラー: ${(error as Error).message}`);
        setStatus('error');
      }
    }

    seed();
  }, [sessionStatus, session, router, status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/30 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-700 to-stone-700 rounded-3xl shadow-xl shadow-amber-900/20 mb-4 rotate-3 hover:rotate-0 transition-transform">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-stone-800 to-amber-900 bg-clip-text text-transparent mb-2">
            テストデータ登録
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-5 sm:p-8 transition-all hover:shadow-2xl hover:shadow-stone-300/50 text-center">
          {status === 'loading' && (
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-50 rounded-full">
                <svg className="w-6 h-6 text-amber-700 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-stone-500 text-sm font-medium">登録中...</p>
            </div>
          )}
          {status === 'done' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4">
                <p className="text-green-700 font-medium text-sm flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {message}
                </p>
              </div>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">
                {message}
              </div>
              <button
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-amber-700 to-stone-700 hover:from-amber-800 hover:to-stone-800 text-white shadow-xl shadow-amber-900/20 transition-all h-12 px-6 sm:h-14 sm:px-8 rounded-full text-base font-semibold hover:scale-105"
              >
                トップページへ
              </button>
            </div>
          )}
          {status === 'idle' && (
            <p className="text-stone-500 text-sm font-medium">準備中...</p>
          )}
        </div>
      </div>
    </div>
  );
}
