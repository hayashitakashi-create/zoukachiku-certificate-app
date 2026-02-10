'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { IssuerInfo } from '@/types/issuer';
import IssuerInfoForm from '@/components/IssuerInfoForm';

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">設定</h1>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            &larr; 一覧へ戻る
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-sm text-gray-600 mb-6">
          証明書作成時に使用するデフォルトの証明者情報を設定できます。
        </p>

        {/* 成功メッセージ */}
        {showSuccessMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-700">
              設定を保存しました。証明書作成時に自動的に反映されます。
            </p>
          </div>
        )}

        {/* 設定フォーム */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            証明者情報を編集
          </h2>

          <IssuerInfoForm
            issuerInfo={issuerInfo}
            onChange={(newInfo) => setIssuerInfo(newInfo)}
          />

          {/* 注意事項 */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-700 mb-2">使い方</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>- ここで設定した情報は、証明書作成時に自動的に入力されます</li>
              <li>- 設定はアカウントに紐づけて保存され、別のブラウザや端末でも利用できます</li>
              <li>- 証明書作成時に個別に変更することもできます</li>
            </ul>
          </div>

          {/* ボタン */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700
                         disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {isSaving ? '保存中...' : '設定を保存'}
            </button>
            <button
              onClick={handleClear}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300
                         font-medium transition-colors"
            >
              クリア
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
