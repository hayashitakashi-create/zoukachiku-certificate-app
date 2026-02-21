/**
 * データストア公開API
 *
 * 使い方:
 *   import { certificateStore, type Certificate } from '@/lib/store';
 *
 *   const certs = await certificateStore.listCertificates();
 *   const cert = await certificateStore.createCertificate('housing_loan');
 */

// 型エクスポート
export type {
  Certificate,
  WorkData,
  WorkSummary,
  StandardWorkItem,
  OtherRenovationItem,
  HousingLoanDetail,
  WorkCategory,
  PurposeType,
  CertificateStatus,
  ExportData,
} from './types';

// ファクトリ関数
export {
  createNewCertificate,
  createEmptyWorkData,
  createEmptyHousingLoanDetail,
} from './types';

// データストア操作
import * as certificateStore from './certificate-store';
export { certificateStore };

// DB直接参照（特殊用途向け）
export { db } from './db';
