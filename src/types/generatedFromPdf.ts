
// 公式PDFテンプレートから抽出された項目
export interface HousingLoanCertificateFields {
  // 証明申請者
  applicantAddress: string;          // 住所
  applicantName: string;              // 氏名

  // 家屋情報
  propertyAddress: string;            // 家屋番号及び所在地
  completionDate: Date;               // 工事完了年月日

  // 工事種別（チェックボックス）
  workTypes: {
    work1?: {                         // 第1号工事
      extension?: boolean;            // 増築
      renovation?: boolean;           // 改築
      majorRepair?: boolean;          // 大規模の修繕
      majorRemodeling?: boolean;      // 大規模の模様替
    };
    work2?: {                         // 第2号工事
      floorOverHalf?: boolean;        // 床の過半
      stairOverHalf?: boolean;        // 階段の過半
      partitionOverHalf?: boolean;    // 間仕切壁の過半
      wallOverHalf?: boolean;         // 壁の過半
    };
    work3?: {                         // 第3号工事
      livingRoom?: boolean;           // 居室
      kitchen?: boolean;              // 調理室
      bathroom?: boolean;             // 浴室
      toilet?: boolean;               // 便所
      washroom?: boolean;             // 洗面所
      storage?: boolean;              // 納戸
      entrance?: boolean;             // 玄関
      corridor?: boolean;             // 廊下
    };
    work4?: {                         // 第4号工事（耐震改修）
      buildingStandard?: boolean;     // 建築基準法施行令
      earthquakeSafety?: boolean;     // 地震に対する安全性
    };
    work5?: {                         // 第5号工事（バリアフリー）
      pathwayExpansion?: boolean;     // 通路又は出入口の拡幅
      stairSlope?: boolean;           // 階段の勾配の緩和
      bathroomImprovement?: boolean;  // 浴室の改良
      toiletImprovement?: boolean;    // 便所の改良
      handrails?: boolean;            // 手すりの取付
      stepElimination?: boolean;      // 床の段差の解消
      doorImprovement?: boolean;      // 出入口の戸の改良
      floorSlipPrevention?: boolean;  // 床材の取替
    };
    work6?: {                         // 第6号工事（省エネ）
      energyEfficiency?: {
        allWindowsInsulation?: boolean;       // 全ての窓の断熱性を高める工事
        allRoomsWindowsInsulation?: boolean;  // 全ての居室の全ての窓
        region4?: boolean;                    // 地域区分：4地域
        energyGradeBefore?: string;           // 改修前の等級
      };
    };
  };

  // 工事内容
  workDescription: string;            // 工事の詳細説明

  // 費用概要
  totalCost: number;                  // 工事費用合計
  hasSubsidy: boolean;                // 補助金の有無
  subsidyAmount: number;              // 補助金額
  deductibleAmount: number;           // 控除対象額

  // 証明者情報
  issueDate: Date | null;             // 証明年月日
  issuerOfficeName: string;           // 建築士事務所名
  issuerName: string;                 // 建築士氏名
  issuerQualificationNumber: string | null;  // 登録番号
}
