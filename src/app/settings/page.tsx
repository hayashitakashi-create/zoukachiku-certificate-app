'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { IssuerInfo } from '@/types/issuer';
import IssuerInfoForm from '@/components/issuer/IssuerInfoForm';

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [issuerInfo, setIssuerInfo] = useState<Partial<IssuerInfo> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // APIから証明者情報を読み込み（未認証時のみlocalStorageフォールバック）
  useEffect(() => {
    const loadIssuerInfo = async () => {
      try {
        const res = await fetch('/api/issuer-settings');
        if (res.ok) {
          // 認証済み → DB結果を信頼（nullでもlocalStorageにフォールバックしない）
          const data = await res.json();
          if (data.issuerInfo) {
            setIssuerInfo(data.issuerInfo);
          }
          // 他ユーザーのデータ漏洩防止のためlocalStorageをクリア
          localStorage.removeItem('issuer-settings');
          setIsLoading(false);
          return;
        }
        if (res.status !== 401) {
          // 401以外のエラー（500等）→ フォールバックせず終了
          setIsLoading(false);
          return;
        }
        // 401（未認証）→ 下のlocalStorageフォールバックへ
      } catch {
        // ネットワークエラー → 下のlocalStorageフォールバックへ
      }

      // 未認証またはネットワークエラー時のみlocalStorageから読み込み
      const savedSettings = localStorage.getItem('issuer-settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);

          // 旧データ形式から新形式への移行
          if (parsed.issuerName && !parsed.organizationType) {
            const migratedData: Partial<IssuerInfo> = {
              organizationType: 'registered_architect_office',
              architectName: parsed.issuerName || '',
              officeName: parsed.issuerOfficeName || '',
              architectRegistrationNumber: parsed.issuerQualificationNumber || '',
            } as any;
            setIssuerInfo(migratedData);
          } else {
            setIssuerInfo(parsed);
          }
        } catch (error) {
          console.error('Failed to parse saved issuer settings:', error);
        }
      }
      setIsLoading(false);
    };

    loadIssuerInfo();
  }, []);

  // 設定を保存（API優先、フォールバックlocalStorage）
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/issuer-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issuerInfo }),
      });

      if (res.ok) {
        // DB保存成功 → localStorageをクリア（移行完了）
        localStorage.removeItem('issuer-settings');
      } else if (res.status === 401) {
        // 未認証 → localStorageにフォールバック
        localStorage.setItem('issuer-settings', JSON.stringify(issuerInfo));
      } else {
        throw new Error('API error');
      }

      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      // APIエラー時はlocalStorageにフォールバック
      try {
        localStorage.setItem('issuer-settings', JSON.stringify(issuerInfo));
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      } catch (lsError) {
        console.error('Failed to save issuer settings:', lsError);
        alert('設定の保存に失敗しました');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // 設定をクリア
  const handleClear = async () => {
    if (confirm('証明者情報の設定をクリアしますか？')) {
      localStorage.removeItem('issuer-settings');
      setIssuerInfo(null);
      // APIからもクリア
      try {
        await fetch('/api/issuer-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ issuerInfo: null }),
        });
      } catch {
        // 未認証・エラー時は無視（localStorageは既にクリア済み）
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/30">
      {/* Header */}
      <header className="bg-white/90 border-b border-stone-200 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-700 to-stone-700 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-900/10">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-stone-800 to-amber-900 bg-clip-text text-transparent">
                設定
              </h1>
            </div>
            <Link
              href="/"
              className="text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full h-10 px-4 flex items-center transition-colors text-sm font-medium gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              一覧へ戻る
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <p className="text-sm text-stone-600 mb-8">
          証明書作成時に使用するデフォルトの証明者情報を設定できます。
        </p>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4">
            <p className="text-sm font-medium text-green-700 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              設定を保存しました。証明書作成時に自動的に反映されます。
            </p>
          </div>
        )}

        {/* Settings Form Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-200 p-4 sm:p-6 md:p-8 transition-all hover:shadow-2xl hover:shadow-stone-300/50 mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            証明者情報を編集
          </h2>

          <IssuerInfoForm
            issuerInfo={issuerInfo}
            onChange={(newInfo) => setIssuerInfo(newInfo)}
          />

          {/* Info Box */}
          <div className="mt-8 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl sm:rounded-3xl border-2 border-amber-200 p-4 sm:p-6 shadow-lg shadow-amber-200/30">
            <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              使い方
            </h4>
            <ul className="space-y-2 text-sm text-amber-800">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span className="font-medium">ここで設定した情報は、証明書作成時に自動的に入力されます</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span className="font-medium">設定はアカウントに紐づけて保存され、別のブラウザや端末でも利用できます</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span className="font-medium">証明書作成時に個別に変更することもできます</span>
              </li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-amber-700 to-stone-700 hover:from-amber-800 hover:to-stone-800 text-white shadow-xl shadow-amber-900/20 transition-all h-12 sm:h-14 rounded-full text-base font-semibold hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                '保存中...'
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  設定を保存
                </>
              )}
            </button>
            <button
              onClick={handleClear}
              className="bg-stone-200 text-stone-700 hover:bg-stone-300 rounded-full h-12 px-6 sm:h-14 sm:px-8 font-semibold transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              クリア
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
