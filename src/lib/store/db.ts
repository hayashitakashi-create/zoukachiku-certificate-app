/**
 * Dexie.js IndexedDB データベース定義
 *
 * 証明書データをブラウザローカルに保存する。
 * サーバーDB不要でオフラインでも動作する。
 *
 * スキーマ設計:
 *   - certificates テーブル: 証明書1件 = 1レコード（工事データもJSON内包）
 *   - Prismaのように7テーブルに正規化せず、1ドキュメントに集約（IndexedDB向き）
 *
 * バージョン管理:
 *   - Dexie の version() で管理。将来フィールド追加時はバージョンを上げる。
 */

import Dexie, { type EntityTable } from 'dexie';
import type { Certificate } from './types';

const DB_NAME = 'zoukachiku-certificate-db';

/**
 * アプリケーションデータベース
 */
class AppDatabase extends Dexie {
  certificates!: EntityTable<Certificate, 'id'>;

  constructor() {
    super(DB_NAME);

    // v1: 初期スキーマ
    // IndexedDB のインデックス定義のみ。全フィールドは自動保存される。
    this.version(1).stores({
      certificates: 'id, status, purposeType, updatedAt, createdAt',
    });
  }
}

/** シングルトン DB インスタンス */
export const db = new AppDatabase();
