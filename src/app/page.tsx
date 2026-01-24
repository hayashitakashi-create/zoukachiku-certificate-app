'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Certificate = {
  id: string;
  applicantName: string;
  propertyAddress: string;
  issueDate: string | null;
  status: string;
  createdAt: string;
};

export default function HomePage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 証明書一覧を取得
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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: '下書き',
      issued: '発行済み',
      completed: '完了',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      issued: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const menuItems = [
    {
      title: '耐震改修工事',
      description: '住宅の耐震性を高める改修工事の計算',
      href: '/seismic-reform',
      color: 'bg-blue-500 hover:bg-blue-600',
      icon: '🏗️',
      items: '9種類',
    },
    {
      title: 'バリアフリー改修工事',
      description: '高齢者等の移動を容易にする改修工事の計算',
      href: '/barrier-free-reform',
      color: 'bg-green-500 hover:bg-green-600',
      icon: '♿',
      items: '21種類',
    },
    {
      title: '省エネ改修工事',
      description: '住宅の省エネルギー性能を高める改修工事の計算',
      href: '/energy-saving-reform',
      color: 'bg-orange-500 hover:bg-orange-600',
      icon: '☀️',
      items: '21種類',
    },
    {
      title: '同居対応改修工事',
      description: '多世帯同居に必要な設備の設置工事の計算',
      href: '/cohabitation-reform',
      color: 'bg-purple-500 hover:bg-purple-600',
      icon: '👨‍👩‍👧‍👦',
      items: '8種類',
    },
    {
      title: '子育て対応改修工事',
      description: '子育てしやすい環境にする改修工事の計算',
      href: '/childcare-reform',
      color: 'bg-teal-500 hover:bg-teal-600',
      icon: '👶',
      items: '25種類',
    },
    {
      title: 'その他増改築等工事',
      description: '大規模な修繕・模様替え・増築等の工事の計算',
      href: '/other-renovation',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      icon: '🔨',
      items: '6カテゴリ',
    },
    {
      title: '長期優良住宅化改修工事',
      description: '長期優良住宅の認定基準を満たす改修工事の計算',
      href: '/long-term-housing',
      color: 'bg-rose-500 hover:bg-rose-600',
      icon: '⭐',
      items: '40種類',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                増改築等工事証明書 計算ツール
              </h1>
              <p className="mt-2 text-gray-600">
                各種改修工事の標準単価による控除対象額を計算します
              </p>
            </div>
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              ⚙️ 設定
            </Link>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* 証明書一覧セクション */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">証明書一覧</h2>
            <Link
              href="/certificate/create"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <span>📝</span>
              新規証明書を作成
            </Link>
          </div>

          {/* ステータスフィルター */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-md transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setStatusFilter('draft')}
              className={`px-4 py-2 rounded-md transition-colors ${
                statusFilter === 'draft'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              下書き
            </button>
            <button
              onClick={() => setStatusFilter('issued')}
              className={`px-4 py-2 rounded-md transition-colors ${
                statusFilter === 'issued'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              発行済み
            </button>
          </div>

          {/* 証明書リスト */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500">
                読み込み中...
              </div>
            ) : certificates.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-gray-600 mb-4">
                  {statusFilter === 'all'
                    ? '証明書がまだありません'
                    : `${getStatusLabel(statusFilter)}の証明書がありません`}
                </p>
                <Link
                  href="/certificate/create"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  最初の証明書を作成する
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申請者名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      物件所在地
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      発行日
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      作成日
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {certificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {cert.applicantName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {cert.propertyAddress}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {cert.issueDate
                            ? new Date(cert.issueDate).toLocaleDateString('ja-JP')
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            cert.status
                          )}`}
                        >
                          {getStatusLabel(cert.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(cert.createdAt).toLocaleDateString('ja-JP')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/certificate/${cert.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          詳細
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 工事種別一覧 */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            個別工事の金額計算（参考用）
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${item.color} text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-4xl">{item.icon}</span>
                    <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                      {item.items}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-sm opacity-90">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 注意事項 */}
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">
            ⚠️ 注意事項
          </h3>
          <ul className="space-y-2 text-sm text-yellow-800 list-disc list-inside">
            <li>本ツールの計算結果はあくまで目安です</li>
            <li>実際の控除額は、工事の内容や条件により異なる場合があります</li>
            <li>正式な証明書の発行には、建築士等の専門家による確認が必要です</li>
            <li>標準単価は国土交通省の定める基準に基づいています</li>
            <li>補助金を受けた場合は、その金額を差し引いた額が控除対象となります</li>
          </ul>
        </div>

        {/* フッター情報 */}
        <div className="mt-12 text-center text-gray-600 text-sm">
          <p>
            © 2024 増改築等工事証明書 計算ツール
          </p>
          <p className="mt-2">
            本システムは税制優遇措置の申請をサポートするツールです
          </p>
        </div>
      </div>
    </div>
  );
}
