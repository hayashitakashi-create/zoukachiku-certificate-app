'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Trash2 } from 'lucide-react';
import type { IssuerInfo } from '@/types/issuer';
import IssuerInfoForm from '@/components/IssuerInfoForm';
import Layout from '@/components/Layout';

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
    <Layout title="設定">
      <div className="max-w-4xl">
        {/* 説明 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <p className="text-base" style={{ color: '#86868B' }}>
            証明書作成時に使用するデフォルトの証明者情報を設定できます。
          </p>
        </motion.div>

        {/* 成功メッセージ */}
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-white border rounded-xl"
            style={{
              borderColor: '#D1FAE5',
              backgroundColor: '#ECFDF5',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
            }}
          >
            <p className="text-base font-medium" style={{ color: '#059669' }}>
              ✅ 設定を保存しました。証明書作成時に自動的に反映されます。
            </p>
          </motion.div>
        )}

        {/* 設定フォーム */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-2xl p-8 border border-[rgba(0,0,0,0.08)]"
          style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)' }}
        >
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#1D1D1F' }}>
            証明者情報を編集
          </h2>

          <IssuerInfoForm
            issuerInfo={issuerInfo}
            onChange={(newInfo) => setIssuerInfo(newInfo)}
          />

          {/* 注意事項 */}
          <div
            className="mt-8 p-5 rounded-xl border"
            style={{
              backgroundColor: '#EFF6FF',
              borderColor: '#DBEAFE',
            }}
          >
            <h4 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: '#2563EB' }}>
              <span>💡</span>
              使い方
            </h4>
            <ul className="text-base space-y-2" style={{ color: '#1D1D1F' }}>
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
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-base font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#007AFF',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)',
              }}
            >
              <Save className="w-5 h-5" />
              {isSaving ? '保存中...' : '設定を保存'}
            </button>
            <button
              onClick={handleClear}
              className="px-6 py-3 rounded-lg text-base font-medium transition-all duration-200 flex items-center gap-2"
              style={{
                backgroundColor: '#F1F5F9',
                color: '#475569',
              }}
            >
              <Trash2 className="w-5 h-5" />
              クリア
            </button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
