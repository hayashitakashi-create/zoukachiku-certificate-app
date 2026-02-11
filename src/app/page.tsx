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
  group: string;
  purposeTypes: string[];
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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/30">
      {/* ヘッダー */}
      <header className="bg-white/90 border-b border-stone-200 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between">
            {/* 左側：ロゴ */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-700 to-stone-700 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-900/10 rotate-3 group-hover:rotate-0 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-stone-800 to-amber-900 bg-clip-text text-transparent">
                増改築等工事証明書
              </h1>
            </Link>

            {/* 右側：アイコンボタン群 */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleImport}
                className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full h-12 w-12 flex items-center justify-center transition-colors"
                title="インポート"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </button>
              <button
                onClick={handleExport}
                className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full h-12 w-12 flex items-center justify-center transition-colors"
                title="エクスポート"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              <Link
                href="/settings"
                className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full h-12 w-12 flex items-center justify-center transition-colors"
                title="設定"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
              {session?.user ? (
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full h-12 w-12 flex items-center justify-center transition-colors"
                  title="ログアウト"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full h-12 w-12 flex items-center justify-center transition-colors"
                  title="ログイン"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* 新規作成ボタン */}
        <div className="mb-8">
          <Link
            href="/certificate/create"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-700 to-stone-700 hover:from-amber-800 hover:to-stone-800 text-white shadow-xl shadow-amber-900/20 transition-all h-12 px-6 sm:h-14 sm:px-8 rounded-full text-sm sm:text-base font-semibold hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            新しい証明書を作成
          </Link>
        </div>

        {/* 用途フィルタ */}
        {certificates.length > 0 && (
          <section className="mb-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-4 sm:p-6 md:p-8 transition-all hover:shadow-2xl hover:shadow-stone-300/50">
              <h2 className="text-sm font-bold text-stone-700 mb-5 flex items-center gap-2">
                <span className="text-xl">&#128269;</span>
                証明書の用途で絞り込み
              </h2>
              <div className="space-y-4">
                {/* Ⅰ グループ */}
                <div>
                  <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full animate-pulse"></span>
                    <span>Ⅰ．所得税額の特別控除</span>
                  </h3>
                  <div className="flex flex-wrap gap-2 ml-0 sm:ml-4">
                    {FILTER_OPTIONS.filter(o => o.group === 'Ⅰ').map(option => {
                      const count = certificates.filter(c => option.purposeTypes.includes(c.purposeType)).length;
                      const isSelected = activeFilter === option.key;
                      return (
                        <button
                          key={option.key}
                          onClick={() => setActiveFilter(option.key)}
                          className={`px-4 py-2 rounded-full text-xs font-medium transition-all transform hover:scale-105 ${
                            isSelected
                              ? 'bg-gradient-to-r from-amber-700 to-stone-700 text-white shadow-lg shadow-amber-900/30'
                              : 'bg-white text-stone-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-stone-50 border-2 border-stone-200 hover:border-amber-300'
                          }`}
                        >
                          {option.label}
                          <span className={`ml-1.5 ${isSelected ? 'text-amber-100' : 'text-stone-400'}`}>({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ⅱ グループ */}
                <div>
                  <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full animate-pulse"></span>
                    <span>Ⅱ．固定資産税の減額</span>
                  </h3>
                  <div className="flex flex-wrap gap-2 ml-0 sm:ml-4">
                    {FILTER_OPTIONS.filter(o => o.group === 'Ⅱ').map(option => {
                      const count = certificates.filter(c => option.purposeTypes.includes(c.purposeType)).length;
                      const isSelected = activeFilter === option.key;
                      return (
                        <button
                          key={option.key}
                          onClick={() => setActiveFilter(option.key)}
                          className={`px-4 py-2 rounded-full text-xs font-medium transition-all transform hover:scale-105 ${
                            isSelected
                              ? 'bg-gradient-to-r from-amber-700 to-stone-700 text-white shadow-lg shadow-amber-900/30'
                              : 'bg-white text-stone-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-stone-50 border-2 border-stone-200 hover:border-amber-300'
                          }`}
                        >
                          {option.label}
                          <span className={`ml-1.5 ${isSelected ? 'text-amber-100' : 'text-stone-400'}`}>({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* すべてボタン */}
                <div className="pt-3 border-t border-stone-100">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${
                      activeFilter === 'all'
                        ? 'bg-gradient-to-r from-amber-700 to-stone-700 text-white shadow-lg shadow-amber-900/30'
                        : 'bg-white text-stone-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-stone-50 border-2 border-stone-200 hover:border-amber-300'
                    }`}
                  >
                    すべて表示
                    <span className={`ml-1.5 ${activeFilter === 'all' ? 'text-amber-100' : 'text-stone-400'}`}>({certificates.length})</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 証明書一覧 */}
        <section>
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2 mb-6">
            <span className="text-2xl">&#128203;</span>
            保存済み証明書
            {certificates.length > 0 && (
              <span className="text-sm font-normal text-stone-500 ml-1">
                {activeFilter !== 'all'
                  ? `(${filteredCertificates.length}件 / 全${certificates.length}件)`
                  : `(${certificates.length}件)`
                }
              </span>
            )}
          </h2>

          {loading ? (
            <div className="text-center py-16 text-stone-500">読み込み中...</div>
          ) : certificates.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-8 sm:p-16 text-center">
              <p className="text-stone-500 mb-2">保存済みの証明書はありません</p>
              <p className="text-sm text-stone-400">
                「新しい証明書を作成」ボタンから始めましょう
              </p>
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-8 sm:p-16 text-center">
              <p className="text-stone-500 mb-3">該当する証明書はありません</p>
              <button
                onClick={() => setActiveFilter('all')}
                className="text-sm text-amber-700 hover:text-amber-800 font-semibold underline underline-offset-2"
              >
                フィルタを解除
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCertificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-4 sm:p-7 transition-all hover:shadow-2xl hover:shadow-stone-300/50 hover:scale-[1.01] group"
                >
                  <div className="flex items-start justify-between">
                    <Link
                      href={`/certificate/${cert.id}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                        <h3 className="font-bold text-stone-800 truncate text-base">
                          {cert.applicantName || '(未入力)'}
                        </h3>
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
                            cert.status === 'completed'
                              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-amber-600/20'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {cert.status === 'completed' ? '&#10003; ' : ''}{STATUS_LABELS[cert.status] || cert.status}
                        </span>
                      </div>
                      <p className="text-sm text-stone-500 truncate mb-2">
                        {cert.propertyAddress || '(住所未入力)'}
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full">
                          <svg className="w-3.5 h-3.5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-amber-800 font-medium">{PURPOSE_LABELS[cert.purposeType] || cert.purposeType}</span>
                        </span>
                        <span className="flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-full">
                          <svg className="w-3.5 h-3.5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-stone-600 font-medium">更新: {new Date(cert.updatedAt).toLocaleDateString('ja-JP')}</span>
                        </span>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 ml-2 sm:ml-4 shrink-0">
                      <Link
                        href={`/certificate/${cert.id}`}
                        className="h-11 w-11 text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
                        title="編集"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDelete(cert.id, cert.applicantName)}
                        className="h-11 w-11 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
                        title="削除"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 注意事項 */}
        <section className="mt-12">
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl sm:rounded-3xl border-2 border-amber-200 p-4 sm:p-6 md:p-8 shadow-xl shadow-amber-200/50">
            <h3 className="text-base font-bold text-amber-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">&#9888;&#65039;</span>
              注意事項
            </h3>
            <ul className="space-y-3 text-sm text-amber-800">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span className="font-medium">データはお使いのブラウザ内に保存されます（サーバーには送信されません）</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span className="font-medium">ブラウザのデータ消去や端末変更でデータが失われます</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span className="font-medium">定期的に「エクスポート」でバックアップを取ることをお勧めします</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span className="font-medium">本ツールの計算結果はあくまで参考値です</span>
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
