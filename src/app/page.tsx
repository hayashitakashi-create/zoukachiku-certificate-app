'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Home,
  FileText,
  Settings,
  Plus,
  TrendingUp,
  Calendar,
  CheckCircle,
  Edit3,
  Search,
  X,
} from 'lucide-react';

type Certificate = {
  id: string;
  applicantName: string;
  propertyAddress: string;
  purposeType: string;
  issueDate: string | null;
  status: string;
  createdAt: string;
};

// ステータスカラー定義
const statusColors = {
  blue: {
    bg: '#EFF6FF',
    text: '#2563EB',
    border: '#DBEAFE',
    gradient: 'linear-gradient(135deg, rgba(96,165,250,0.15) 0%, rgba(59,130,246,0.15) 100%)',
    icon: '#60A5FA',
  },
  indigo: {
    bg: '#EEF2FF',
    text: '#4F46E5',
    border: '#E0E7FF',
    gradient: 'linear-gradient(135deg, rgba(129,140,248,0.15) 0%, rgba(99,102,241,0.15) 100%)',
    icon: '#818CF8',
  },
  green: {
    bg: '#ECFDF5',
    text: '#059669',
    border: '#D1FAE5',
    gradient: 'linear-gradient(135deg, rgba(52,211,153,0.15) 0%, rgba(16,185,129,0.15) 100%)',
    icon: '#34D399',
  },
  amber: {
    bg: '#FFFBEB',
    text: '#D97706',
    border: '#FEF3C7',
    gradient: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(245,158,11,0.15) 100%)',
    icon: '#FBBF24',
  },
  slate: {
    bg: '#F8FAFC',
    text: '#475569',
    border: '#F1F5F9',
    gradient: 'linear-gradient(135deg, rgba(148,163,184,0.15) 0%, rgba(100,116,139,0.15) 100%)',
    icon: '#94A3B8',
  },
};

// サマリーカードコンポーネント
function SummaryCard({
  icon: Icon,
  title,
  value,
  badge,
  color,
  delay = 0
}: {
  icon: any;
  title: string;
  value: number;
  badge?: string;
  color: keyof typeof statusColors;
  delay?: number;
}) {
  const config = statusColors[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className="relative bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.08)]"
      style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: config.bg,
            color: config.text,
          }}
        >
          <Icon className="w-5 h-5" />
        </div>
        {badge && (
          <div className="flex items-center gap-1 text-xs font-bold" style={{ color: '#059669' }}>
            <TrendingUp className="w-3 h-3" />
            {badge}
          </div>
        )}
      </div>
      <div className="text-4xl font-bold mb-1" style={{ color: '#1D1D1F' }}>
        {value}
      </div>
      <div className="text-base font-medium" style={{ color: '#86868B' }}>
        {title}
      </div>
    </motion.div>
  );
}

// ステータスバッジコンポーネント
function StatusBadge({ status, label }: { status: keyof typeof statusColors; label: string }) {
  const config = statusColors[status];

  return (
    <div
      className="inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-md border"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        borderColor: config.border,
      }}
    >
      {label}
    </div>
  );
}

// データカード（証明書行）コンポーネント
function CertificateRow({ cert, index }: { cert: Certificate; index: number }) {
  const getStatusConfig = (status: string): keyof typeof statusColors => {
    if (status === 'draft') return 'amber';
    if (status === 'issued') return 'green';
    if (status === 'completed') return 'slate';
    return 'blue';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: '下書き',
      issued: '発行済み',
      completed: '完了',
    };
    return labels[status] || status;
  };

  const getPurposeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      housing_loan: '住宅借入金等特別控除',
      reform_tax: '住宅借入金等特別税額控除',
      resale: '既存住宅売買瑕疵保険加入用',
      property_tax: '固定資産税減額用',
    };
    return labels[type] || type;
  };

  const statusConfig = getStatusConfig(cert.status);
  const config = statusColors[statusConfig];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      onClick={() => window.location.href = `/certificate/${cert.id}`}
      className="group relative bg-white rounded-2xl p-5 border border-[rgba(0,0,0,0.08)] cursor-pointer overflow-hidden"
      style={{
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* レイヤー1: グラデーショングロー */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: config.gradient,
          filter: 'blur(60px)',
          zIndex: 0,
        }}
      />

      {/* レイヤー2: ネオンボーダー */}
      <div
        className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          inset: '-1px',
          borderRadius: 'inherit',
          background: config.gradient,
          filter: 'blur(20px)',
          zIndex: -1,
        }}
      />

      {/* レイヤー3: トップアクセント */}
      <div
        className="absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          height: '4px',
          background: config.gradient,
          borderRadius: 'inherit',
        }}
      />

      {/* レイヤー4: コンテンツ */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1" style={{ color: '#1D1D1F' }}>
              {cert.applicantName}
            </h3>
            <p className="text-base mb-2" style={{ color: '#86868B' }}>
              {cert.propertyAddress}
            </p>
          </div>
          <StatusBadge status={statusConfig} label={getStatusLabel(cert.status)} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: '#86868B' }}>用途</p>
            <p className="text-base font-medium" style={{ color: '#1D1D1F' }}>
              {getPurposeTypeLabel(cert.purposeType)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: '#86868B' }}>発行日</p>
            <p className="text-base font-medium" style={{ color: '#1D1D1F' }}>
              {cert.issueDate
                ? new Date(cert.issueDate).toLocaleDateString('ja-JP')
                : '-'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: '#86868B' }}>
            作成日: {new Date(cert.createdAt).toLocaleDateString('ja-JP')}
          </p>
          <Link
            href={`/certificate/${cert.id}`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[rgba(0,0,0,0.05)]"
            style={{ color: '#007AFF' }}
            onClick={(e) => e.stopPropagation()}
          >
            詳細
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeMenu, setActiveMenu] = useState('home');

  // 検索フィルター
  const [searchName, setSearchName] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [searchPurpose, setSearchPurpose] = useState('all');

  useEffect(() => {
    fetchCertificates();
  }, [statusFilter]);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'all'
        ? '/api/certificates'
        : `/api/certificates?status=${statusFilter}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setCertificates(result.data.certificates);
      }
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  // フィルタリング処理
  const filteredCertificates = certificates.filter(cert => {
    // 氏名検索
    if (searchName && !cert.applicantName.toLowerCase().includes(searchName.toLowerCase())) {
      return false;
    }
    // 住所検索
    if (searchAddress && !cert.propertyAddress.toLowerCase().includes(searchAddress.toLowerCase())) {
      return false;
    }
    // 用途検索
    if (searchPurpose !== 'all' && cert.purposeType !== searchPurpose) {
      return false;
    }
    return true;
  });

  // 統計計算
  const totalCount = certificates.length;
  const draftCount = certificates.filter(c => c.status === 'draft').length;
  const issuedCount = certificates.filter(c => c.status === 'issued').length;
  const thisMonthCount = certificates.filter(c => {
    const created = new Date(c.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const menuItems = [
    { id: 'home', icon: Home, label: 'ダッシュボード' },
    { id: 'certificates', icon: FileText, label: '証明書一覧' },
    { id: 'settings', icon: Settings, label: '設定' },
  ];

  return (
    <div
      style={{
        background: 'linear-gradient(to bottom right, #F8F9FA 0%, #E8EAF6 50%, #F3E5F5 100%)',
        minHeight: '100vh'
      }}
    >
      {/* サイドバー */}
      <aside
        style={{
          width: '280px',
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(12px)',
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          padding: '24px',
          zIndex: 40,
        }}
      >
        {/* ロゴエリア */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold whitespace-nowrap" style={{ color: '#1D1D1F' }}>
            増改築等工事証明書
          </h1>
          <p className="text-base mt-1" style={{ color: '#86868B' }}>
            管理システム
          </p>
        </div>

        {/* メニュー */}
        <nav className="space-y-1 mb-8">
          {menuItems.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => {
                setActiveMenu(item.id);
                if (item.id === 'settings') {
                  window.location.href = '/settings';
                } else if (item.id === 'certificates') {
                  // 証明書一覧セクションにスクロール
                  const certificateSection = document.querySelector('main');
                  certificateSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-lg font-medium transition-all duration-200"
              style={{
                backgroundColor: activeMenu === item.id ? '#007AFF' : 'transparent',
                color: activeMenu === item.id ? '#FFFFFF' : '#86868B',
                boxShadow: activeMenu === item.id ? '0 4px 12px rgba(0, 122, 255, 0.2)' : 'none',
              }}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </motion.button>
          ))}
        </nav>

        {/* ユーザー情報エリア */}
        <div className="border-t pt-4" style={{ borderColor: 'rgba(0, 0, 0, 0.08)' }}>
          <p className="text-xs font-medium" style={{ color: '#86868B' }}>
            © 2024 証明書管理システム
          </p>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <div style={{ marginLeft: '280px' }}>
        {/* ヘッダー */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            height: '64px',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            padding: '0 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 40,
          }}
        >
          <h2 className="text-2xl font-semibold" style={{ color: '#1D1D1F' }}>
            ダッシュボード
          </h2>
          <Link
            href="/certificate/create"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-medium transition-all duration-200"
            style={{
              backgroundColor: '#007AFF',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)',
            }}
          >
            <Plus className="w-5 h-5" />
            新規証明書を作成
          </Link>
        </header>

        {/* コンテンツ */}
        <main style={{ padding: '32px' }}>
          {/* サマリーカード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <SummaryCard
              icon={FileText}
              title="総証明書数"
              value={totalCount}
              color="blue"
              delay={0}
            />
            <SummaryCard
              icon={Edit3}
              title="下書き"
              value={draftCount}
              color="amber"
              delay={0.05}
            />
            <SummaryCard
              icon={CheckCircle}
              title="発行済み"
              value={issuedCount}
              color="green"
              delay={0.1}
            />
            <SummaryCard
              icon={Calendar}
              title="今月の発行数"
              value={thisMonthCount}
              color="indigo"
              delay={0.15}
            />
          </div>

          {/* 証明書一覧 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold" style={{ color: '#1D1D1F' }}>
                証明書一覧
              </h3>

              {/* ステータスフィルター */}
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className="px-5 py-2.5 rounded-lg text-base font-medium transition-all duration-200"
                  style={{
                    backgroundColor: statusFilter === 'all' ? '#007AFF' : 'transparent',
                    color: statusFilter === 'all' ? '#FFFFFF' : '#86868B',
                    boxShadow: statusFilter === 'all' ? '0 4px 12px rgba(0, 122, 255, 0.2)' : 'none',
                  }}
                >
                  すべて
                </button>
                <button
                  onClick={() => setStatusFilter('draft')}
                  className="px-5 py-2.5 rounded-lg text-base font-medium transition-all duration-200 hover:bg-[rgba(0,0,0,0.05)]"
                  style={{
                    backgroundColor: statusFilter === 'draft' ? '#007AFF' : 'transparent',
                    color: statusFilter === 'draft' ? '#FFFFFF' : '#86868B',
                    boxShadow: statusFilter === 'draft' ? '0 4px 12px rgba(0, 122, 255, 0.2)' : 'none',
                  }}
                >
                  下書き
                </button>
                <button
                  onClick={() => setStatusFilter('issued')}
                  className="px-5 py-2.5 rounded-lg text-base font-medium transition-all duration-200 hover:bg-[rgba(0,0,0,0.05)]"
                  style={{
                    backgroundColor: statusFilter === 'issued' ? '#007AFF' : 'transparent',
                    color: statusFilter === 'issued' ? '#FFFFFF' : '#86868B',
                    boxShadow: statusFilter === 'issued' ? '0 4px 12px rgba(0, 122, 255, 0.2)' : 'none',
                  }}
                >
                  発行済み
                </button>
              </div>
            </div>

            {/* 検索フィルター */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-2xl p-6 mb-6 border border-[rgba(0,0,0,0.08)]"
              style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-5 h-5" style={{ color: '#86868B' }} />
                <h4 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>
                  検索フィルター
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 氏名検索 */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#86868B' }}>
                    氏名
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      placeholder="氏名で検索..."
                      className="w-full px-4 py-2.5 rounded-lg border border-[rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent transition-all text-base"
                      style={{ color: '#1D1D1F' }}
                    />
                    {searchName && (
                      <button
                        onClick={() => setSearchName('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 住所検索 */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#86868B' }}>
                    住所
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchAddress}
                      onChange={(e) => setSearchAddress(e.target.value)}
                      placeholder="住所で検索..."
                      className="w-full px-4 py-2.5 rounded-lg border border-[rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent transition-all text-base"
                      style={{ color: '#1D1D1F' }}
                    />
                    {searchAddress && (
                      <button
                        onClick={() => setSearchAddress('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 用途検索 */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#86868B' }}>
                    用途
                  </label>
                  <select
                    value={searchPurpose}
                    onChange={(e) => setSearchPurpose(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[rgba(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent transition-all text-base"
                    style={{ color: '#1D1D1F' }}
                  >
                    <option value="all">すべて</option>
                    <option value="housing_loan">住宅借入金等特別控除</option>
                    <option value="reform_tax">住宅借入金等特別税額控除</option>
                    <option value="resale">既存住宅売買瑕疵保険加入用</option>
                    <option value="property_tax">固定資産税減額用</option>
                  </select>
                </div>
              </div>

              {/* 検索結果数 */}
              {(searchName || searchAddress || searchPurpose !== 'all') && (
                <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.08)]">
                  <p className="text-sm" style={{ color: '#86868B' }}>
                    {filteredCertificates.length}件の証明書が見つかりました
                  </p>
                </div>
              )}
            </motion.div>

            {loading ? (
              <div className="text-center py-12 text-base" style={{ color: '#86868B' }}>
                読み込み中...
              </div>
            ) : certificates.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-12 text-center border border-[rgba(0,0,0,0.08)]"
                style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)' }}
              >
                <div className="text-6xl mb-4">📋</div>
                <p className="text-lg mb-2" style={{ color: '#1D1D1F' }}>
                  証明書がまだありません
                </p>
                <p className="text-base mb-4" style={{ color: '#86868B' }}>
                  新規証明書作成ボタンから最初の証明書を作成しましょう
                </p>
                <Link
                  href="/certificate/create"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-base font-medium transition-all duration-200"
                  style={{
                    backgroundColor: '#007AFF',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)',
                  }}
                >
                  <Plus className="w-5 h-5" />
                  最初の証明書を作成する
                </Link>
              </motion.div>
            ) : filteredCertificates.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-12 text-center border border-[rgba(0,0,0,0.08)]"
                style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)' }}
              >
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-lg mb-2" style={{ color: '#1D1D1F' }}>
                  該当する証明書が見つかりません
                </p>
                <p className="text-base" style={{ color: '#86868B' }}>
                  検索条件を変更してみてください
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCertificates.map((cert, index) => (
                  <CertificateRow key={cert.id} cert={cert} index={index} />
                ))}
              </div>
            )}
          </div>

          {/* 注意事項 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-[rgba(0,0,0,0.08)]"
            style={{ boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)' }}
          >
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: '#D97706' }}>
              <span>⚠️</span>
              注意事項
            </h3>
            <ul className="space-y-2 text-base list-disc list-inside" style={{ color: '#86868B' }}>
              <li>本ツールの計算結果はあくまで目安です</li>
              <li>実際の控除額は、工事の内容や条件により異なる場合があります</li>
              <li>正式な証明書の発行には、建築士等の専門家による確認が必要です</li>
              <li>標準単価は国土交通省の定める基準に基づいています</li>
              <li>補助金を受けた場合は、その金額を差し引いた額が控除対象となります</li>
            </ul>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
