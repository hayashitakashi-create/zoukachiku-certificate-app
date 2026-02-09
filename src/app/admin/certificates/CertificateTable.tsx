'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import EmptyState from '../components/EmptyState';

type Certificate = {
  id: string;
  applicantName: string;
  propertyAddress: string;
  purposeType: string;
  status: string;
  completionDate: Date;
  createdAt: Date;
  user: { name: string | null; email: string | null } | null;
};

type CertificateTableProps = {
  certificates: Certificate[];
  search: string;
  statusFilter: string;
  purposeTypeFilter: string;
  currentPage: number;
  totalPages: number;
};

const statusOptions = [
  { value: 'all', label: '全て' },
  { value: 'draft', label: '下書き' },
  { value: 'completed', label: '完了' },
  { value: 'issued', label: '発行済み' },
];

const purposeOptions = [
  { value: 'all', label: '全て' },
  { value: 'housing_loan', label: '住宅ローン' },
  { value: 'reform_tax', label: '特別税額' },
  { value: 'resale', label: '譲渡所得' },
  { value: 'property_tax', label: '固定資産税' },
];

const purposeLabels: Record<string, string> = {
  housing_loan: '住宅ローン',
  reform_tax: '特別税額',
  resale: '譲渡所得',
  property_tax: '固定資産税',
};

const statusLabels: Record<string, string> = {
  draft: '下書き',
  completed: '完了',
  issued: '発行済み',
};

export default function CertificateTable({
  certificates,
  search,
  statusFilter,
  purposeTypeFilter,
  currentPage,
  totalPages,
}: CertificateTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(search);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value && value !== 'all' && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    params.delete('page');
    router.push(`/admin/certificates?${params.toString()}`);
  };

  const handleSearch = () => {
    updateParams({ search: searchValue });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/admin/certificates?${params.toString()}`);
  };

  const hasNoData = certificates.length === 0 && !search && statusFilter === 'all' && purposeTypeFilter === 'all';

  return (
    <>
      {/* フィルター */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: '#86868B' }}
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="申請者名または住所で検索..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors focus:border-indigo-400"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderColor: 'rgba(0, 0, 0, 0.1)',
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => updateParams({ status: e.target.value })}
          className="px-3 py-2.5 rounded-lg border text-sm outline-none"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'rgba(0, 0, 0, 0.1)',
            color: '#1D1D1F',
          }}
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={purposeTypeFilter}
          onChange={(e) => updateParams({ purposeType: e.target.value })}
          className="px-3 py-2.5 rounded-lg border text-sm outline-none"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'rgba(0, 0, 0, 0.1)',
            color: '#1D1D1F',
          }}
        >
          {purposeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleSearch}
          className="px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: '#6366F1' }}
        >
          検索
        </button>
      </div>

      {/* 空状態（データベースにデータなし） */}
      {hasNoData ? (
        <div
          className="rounded-xl border p-8"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(8px)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
          }}
        >
          <EmptyState
            iconName="database"
            title="証明書データなし"
            description="現在、データベースに証明書は保存されていません。証明書データはユーザーのブラウザに保存されています。"
            subDescription="サーバー連携機能が実装されると、ここにデータが表示されます。"
          />
        </div>
      ) : (
        <>
          {/* テーブル */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(8px)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                    {['申請者名', '物件住所', '用途', 'ステータス', '作成者', '工事完了日', '作成日'].map(
                      (header) => (
                        <th
                          key={header}
                          className="text-left text-xs font-medium px-4 py-3"
                          style={{ color: '#86868B' }}
                        >
                          {header}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((cert) => (
                    <tr
                      key={cert.id}
                      className="transition-colors hover:bg-white/50"
                      style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.03)' }}
                    >
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: '#1D1D1F' }}>
                        {cert.applicantName}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#86868B' }}>
                        {cert.propertyAddress}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            color: '#6366F1',
                          }}
                        >
                          {purposeLabels[cert.purposeType] || cert.purposeType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{
                            backgroundColor:
                              cert.status === 'issued'
                                ? 'rgba(16, 185, 129, 0.1)'
                                : cert.status === 'completed'
                                  ? 'rgba(59, 130, 246, 0.1)'
                                  : 'rgba(156, 163, 175, 0.1)',
                            color:
                              cert.status === 'issued'
                                ? '#10B981'
                                : cert.status === 'completed'
                                  ? '#3B82F6'
                                  : '#9CA3AF',
                          }}
                        >
                          {statusLabels[cert.status] || cert.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#86868B' }}>
                        {cert.user?.name || cert.user?.email || '不明'}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#86868B' }}>
                        {new Date(cert.completionDate).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#86868B' }}>
                        {new Date(cert.createdAt).toLocaleDateString('ja-JP')}
                      </td>
                    </tr>
                  ))}
                  {certificates.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-sm"
                        style={{ color: '#86868B' }}
                      >
                        条件に一致する証明書が見つかりません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 rounded-lg transition-colors hover:bg-white/50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" style={{ color: '#86868B' }} />
              </button>
              <span className="text-sm px-3" style={{ color: '#86868B' }}>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-lg transition-colors hover:bg-white/50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" style={{ color: '#86868B' }} />
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
