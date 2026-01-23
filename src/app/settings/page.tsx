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
          // 旧形式のデータの場合、デフォルトで登録建築士事務所として扱う
          const migratedData: Partial<IssuerInfo> = {
            organizationType: 'registered_architect_office',
            architectName: parsed.issuerName || '',
            officeName: parsed.issuerOfficeName || '',
            architectRegistrationNumber: parsed.issuerQualificationNumber || '',
          } as any;
          setIssuerInfo(migratedData);
          console.log('Migrated old issuer settings to new format:', migratedData);
        } else {
          setIssuerInfo(parsed);
          console.log('Loaded issuer settings from localStorage:', parsed);
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
      console.log('Saved issuer settings to localStorage:', issuerInfo);
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
      console.log('Cleared issuer settings');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">設定</h1>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              ← トップに戻る
            </Link>
          </div>
          <p className="text-gray-600">
            証明書作成時に使用するデフォルトの証明者情報を設定できます。
          </p>
        </div>

        {/* 成功メッセージ */}
        {showSuccessMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              ✅ 設定を保存しました。証明書作成時に自動的に反映されます。
            </p>
          </div>
        )}

        {/* 設定フォーム */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">証明者情報を編集</h2>

          <IssuerInfoForm
            issuerInfo={issuerInfo}
            onChange={(newInfo) => setIssuerInfo(newInfo)}
          />

          {/* 注意事項 */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-semibold text-blue-900 mb-2">💡 使い方</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• ここで設定した情報は、証明書作成時に自動的に入力されます</li>
              <li>• 設定はブラウザのローカルストレージに保存されます</li>
              <li>• 証明書作成時に個別に変更することもできます</li>
            </ul>
          </div>

          {/* ボタン */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSaving ? '保存中...' : '💾 設定を保存'}
            </button>
            <button
              onClick={handleClear}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              🗑️ クリア
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
