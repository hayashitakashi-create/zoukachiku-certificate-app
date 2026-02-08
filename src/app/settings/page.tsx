'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { IssuerInfo } from '@/types/issuer';
import IssuerInfoForm from '@/components/IssuerInfoForm';

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [issuerInfo, setIssuerInfo] = useState<Partial<IssuerInfo> | null>(null);

  // ローカルストレージから設定を読み込む
  useEffect(() => {
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
  }, []);

  // 設定を保存
  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('issuer-settings', JSON.stringify(issuerInfo));
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to save issuer settings:', error);
      alert('設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 設定をクリア
  const handleClear = () => {
    if (confirm('証明者情報の設定をクリアしますか？')) {
      localStorage.removeItem('issuer-settings');
      setIssuerInfo(null);
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
              <li>- 設定はブラウザのローカルストレージに保存されます</li>
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
