'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { certificateStore, type Certificate } from '@/lib/store';

// 用途ラベル（カード表示用・短縮版）
const PURPOSE_LABELS: Record<string, string> = {
  housing_loan: 'Ⅰ-1 住宅借入金等特別控除',
  reform_tax: 'Ⅰ-3 住宅特定改修特別税額控除',
  resale: 'Ⅰ-4 買取再販住宅',
  property_tax: 'Ⅱ 固定資産税の減額',
};

// フィルタ定義
type FilterKey = 'all' | 'housing_loan' | 'reform_tax' | 'resale' | 'property_tax';

interface FilterOption {
  key: FilterKey;
  label: string;
  group: string;       // Ⅰ or Ⅱ
  purposeTypes: string[]; // マッチする purposeType 一覧
}

const FILTER_OPTIONS: FilterOption[] = [
  { key: 'all', label: 'すべて', group: '', purposeTypes: [] },
  { key: 'housing_loan', label: '１．住宅借入金等特別控除', group: 'Ⅰ', purposeTypes: ['housing_loan'] },
  { key: 'reform_tax', label: '３．住宅耐震改修特別税額控除／住宅特定改修特別税額控除', group: 'Ⅰ', purposeTypes: ['reform_tax'] },
  { key: 'resale', label: '４．買取再販住宅', group: 'Ⅰ', purposeTypes: ['resale'] },
  { key: 'property_tax', label: '固定資産税の減額（1-1 耐震／1-2 認定長期優良／2 熱損失防止）', group: 'Ⅱ', purposeTypes: ['property_tax'] },
];

// ステータスラベル
const STATUS_LABELS: Record<string, string> = {
  draft: '下書き',
  completed: '完了',
};

export default function HomePage() {
  const { data: session } = useSession();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const userId = session?.user?.id;

  // フィルタ適用後の証明書一覧
  const filteredCertificates = activeFilter === 'all'
    ? certificates
    : certificates.filter(cert => {
        const option = FILTER_OPTIONS.find(o => o.key === activeFilter);
        return option ? option.purposeTypes.includes(cert.purposeType) : true;
      });

  const loadCertificates = useCallback(async () => {
    try {
      const certs = await certificateStore.listCertificates(userId);
      setCertificates(certs);
    } catch (error) {
      console.error('Failed to load certificates:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name || '無題'}」を削除しますか？\nこの操作は取り消せません。`)) return;
    await certificateStore.deleteCertificate(id);
    await loadCertificates();
  };

  const handleExport = async () => {
    try {
      const data = await certificateStore.exportAllCertificates();
      certificateStore.downloadExportFile(data);
    } catch (error) {
      console.error('Export failed:', error);
      alert('エクスポートに失敗しました');
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const result = await certificateStore.importCertificates(data);
        alert(`インポート完了: ${result.imported}件追加、${result.skipped}件スキップ`);
        await loadCertificates();
      } catch (error) {
        console.error('Import failed:', error);
        alert('インポートに失敗しました。ファイル形式を確認してください。');
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors">
            増改築等工事証明書
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="text-sm text-gray-500 hover:text-gray-700"
              title="バックアップ"
            >
              エクスポート
            </button>
            <button
              onClick={handleImport}
              className="text-sm text-gray-500 hover:text-gray-700"
              title="復元"
            >
              インポート
            </button>
            <Link
              href="/settings"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              設定
            </Link>
            {session?.user ? (
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ログアウト
              </button>
            ) : (
              <Link
                href="/login"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ログイン
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* 新規作成ボタン */}
        <div className="mb-8">
          <Link
            href="/certificate/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white
                       rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新しい証明書を作成
          </Link>
        </div>

        {/* 用途フィルタ */}
        {certificates.length > 0 && (
          <section className="mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">証明書の用途で絞り込み</h3>
              <div className="space-y-2">
                {/* Ⅰ グループ */}
                <div>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded mr-2">Ⅰ．所得税額の特別控除</span>
                </div>
                <div className="flex flex-wrap gap-2 ml-4">
                  {FILTER_OPTIONS.filter(o => o.group === 'Ⅰ').map(option => {
                    const count = certificates.filter(c => option.purposeTypes.includes(c.purposeType)).length;
                    return (
                      <button
                        key={option.key}
                        onClick={() => setActiveFilter(option.key)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          activeFilter === option.key
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                        }`}
                      >
                        {option.label}
                        <span className="ml-1 opacity-70">({count})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Ⅱ グループ */}
                <div className="mt-3">
                  <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded mr-2">Ⅱ．固定資産税の減額</span>
                </div>
                <div className="flex flex-wrap gap-2 ml-4">
                  {FILTER_OPTIONS.filter(o => o.group === 'Ⅱ').map(option => {
                    const count = certificates.filter(c => option.purposeTypes.includes(c.purposeType)).length;
                    return (
                      <button
                        key={option.key}
                        onClick={() => setActiveFilter(option.key)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          activeFilter === option.key
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-green-400 hover:text-green-600'
                        }`}
                      >
                        {option.label}
                        <span className="ml-1 opacity-70">({count})</span>
                      </button>
                    );
                  })}
                </div>

                {/* すべてボタン */}
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      activeFilter === 'all'
                        ? 'bg-gray-700 text-white border-gray-700'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                    }`}
                  >
                    すべて表示
                    <span className="ml-1 opacity-70">({certificates.length})</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 証明書一覧 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            保存済み証明書
            {certificates.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                {activeFilter !== 'all'
                  ? `(${filteredCertificates.length}件 / 全${certificates.length}件)`
                  : `(${certificates.length}件)`
                }
              </span>
            )}
          </h2>

          {loading ? (
            <div className="text-center py-12 text-gray-500">読み込み中...</div>
          ) : certificates.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500 mb-2">保存済みの証明書はありません</p>
              <p className="text-sm text-gray-400">
                「新しい証明書を作成」ボタンから始めましょう
              </p>
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <p className="text-gray-500 mb-2">該当する証明書はありません</p>
              <button
                onClick={() => setActiveFilter('all')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                フィルタを解除
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCertificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300
                             transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <Link
                      href={`/certificate/${cert.id}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {cert.applicantName || '(未入力)'}
                        </h3>
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                            cert.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {STATUS_LABELS[cert.status] || cert.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {cert.propertyAddress || '(住所未入力)'}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        <span>{PURPOSE_LABELS[cert.purposeType] || cert.purposeType}</span>
                        <span>
                          更新: {new Date(cert.updatedAt).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <Link
                        href={`/certificate/${cert.id}`}
                        className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        編集
                      </Link>
                      <button
                        onClick={() => handleDelete(cert.id, cert.applicantName)}
                        className="px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 注意事項 */}
        <section className="mt-12 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">注意事項</h3>
          <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
            <li>データはお使いのブラウザ内に保存されます（サーバーには送信されません）</li>
            <li>ブラウザのデータ消去や端末変更でデータが失われます</li>
            <li>定期的に「エクスポート」でバックアップを取ることをお勧めします</li>
            <li>本ツールの計算結果はあくまで参考値です</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
