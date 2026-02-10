/**
 * 証明書データストア（IndexedDB操作の抽象レイヤー）
 *
 * 全ページからこのモジュール経由でデータにアクセスする。
 * 将来SaaS化する場合、このインターフェースの裏側をAPI版に差し替えるだけで移行可能。
 */

import { db } from './db';
import type {
  Certificate,
  CertificateStatus,
  PurposeType,
  WorkCategory,
  WorkData,
  WorkSummary,
  StandardWorkItem,
  OtherRenovationItem,
  HousingLoanDetail,
  ExportData,
} from './types';
import { createNewCertificate } from './types';

// =============================================
// 証明書 CRUD
// =============================================

/** 証明書を取得（更新日時の降順）。userId指定時はそのユーザーの証明書のみ返す */
export async function listCertificates(userId?: string): Promise<Certificate[]> {
  if (userId) {
    return db.certificates
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('updatedAt');
  }
  return db.certificates.orderBy('updatedAt').reverse().toArray();
}

/** ステータスで絞り込み */
export async function listCertificatesByStatus(status: CertificateStatus): Promise<Certificate[]> {
  return db.certificates
    .where('status')
    .equals(status)
    .reverse()
    .sortBy('updatedAt');
}

/** 証明書を1件取得 */
export async function getCertificate(id: string): Promise<Certificate | undefined> {
  return db.certificates.get(id);
}

/** 新規証明書を作成して返す */
export async function createCertificate(purposeType: PurposeType = 'housing_loan', userId?: string): Promise<Certificate> {
  const cert = createNewCertificate(purposeType);
  if (userId) {
    cert.userId = userId;
  }
  await db.certificates.add(cert);
  return cert;
}

/** 証明書を更新（部分更新対応） */
export async function updateCertificate(
  id: string,
  updates: Partial<Omit<Certificate, 'id' | 'createdAt'>>
): Promise<void> {
  await db.certificates.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/** 証明書を削除 */
export async function deleteCertificate(id: string): Promise<void> {
  await db.certificates.delete(id);
}

// =============================================
// 工事データ操作
// =============================================

/** 特定種別の工事データを保存 */
export async function saveWorks(
  certificateId: string,
  category: WorkCategory,
  items: StandardWorkItem[] | OtherRenovationItem[],
  summary: WorkSummary
): Promise<void> {
  const cert = await db.certificates.get(certificateId);
  if (!cert) throw new Error(`Certificate not found: ${certificateId}`);

  const updatedWorks: WorkData = {
    ...cert.works,
    [category]: { items, summary },
  };

  await db.certificates.update(certificateId, {
    works: updatedWorks,
    updatedAt: new Date().toISOString(),
  });
}

/** 特定種別の工事データをクリア */
export async function clearWorks(
  certificateId: string,
  category: WorkCategory
): Promise<void> {
  const cert = await db.certificates.get(certificateId);
  if (!cert) throw new Error(`Certificate not found: ${certificateId}`);

  const updatedWorks: WorkData = {
    ...cert.works,
    [category]: { items: [], summary: null },
  };

  await db.certificates.update(certificateId, {
    works: updatedWorks,
    updatedAt: new Date().toISOString(),
  });
}

// =============================================
// 住宅ローン詳細
// =============================================

/** 住宅ローン詳細を保存 */
export async function saveHousingLoanDetail(
  certificateId: string,
  detail: HousingLoanDetail
): Promise<void> {
  await db.certificates.update(certificateId, {
    housingLoanDetail: detail,
    updatedAt: new Date().toISOString(),
  });
}

// =============================================
// エクスポート / インポート
// =============================================

const EXPORT_VERSION = 1;

/** 全証明書をJSON形式でエクスポート */
export async function exportAllCertificates(): Promise<ExportData> {
  const certificates = await db.certificates.toArray();
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    certificates,
  };
}

/** JSONファイルからインポート（既存データとマージ） */
export async function importCertificates(data: ExportData): Promise<{ imported: number; skipped: number }> {
  if (!data.version || !data.certificates || !Array.isArray(data.certificates)) {
    throw new Error('無効なエクスポートファイルです');
  }

  let imported = 0;
  let skipped = 0;

  for (const cert of data.certificates) {
    const existing = await db.certificates.get(cert.id);
    if (existing) {
      // 既存の方が新しい場合はスキップ
      if (existing.updatedAt >= cert.updatedAt) {
        skipped++;
        continue;
      }
    }
    await db.certificates.put(cert);
    imported++;
  }

  return { imported, skipped };
}

/** JSONファイルとしてダウンロード */
export function downloadExportFile(data: ExportData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `zoukachiku-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// =============================================
// ストレージ管理
// =============================================

/** ストレージ使用量を取得 */
export async function getStorageEstimate(): Promise<{ used: number; quota: number } | null> {
  if (!navigator.storage?.estimate) return null;
  const estimate = await navigator.storage.estimate();
  return {
    used: estimate.usage ?? 0,
    quota: estimate.quota ?? 0,
  };
}

/** 永続化ストレージをリクエスト（eviction防止） */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false;
  return navigator.storage.persist();
}

/** 証明書の件数を取得 */
export async function getCertificateCount(): Promise<number> {
  return db.certificates.count();
}
