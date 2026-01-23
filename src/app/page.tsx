import Link from 'next/link';

export default function HomePage() {
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
        {/* 概要セクション */}
        <div className="mb-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            このツールについて
          </h2>
          <div className="space-y-3 text-gray-700">
            <p>
              増改築等工事証明書は、住宅の増改築等を行った場合に、所得税の特別控除や固定資産税の減額措置を受けるために必要な証明書です。
            </p>
            <p>
              本ツールでは、各種改修工事の標準単価を用いて、控除対象額を自動計算します。
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <p className="text-sm font-medium text-blue-900">
                💡 使い方
              </p>
              <ol className="mt-2 text-sm text-blue-800 list-decimal list-inside space-y-1">
                <li>実施する改修工事の種類を選択</li>
                <li>工事内容と数量を入力</li>
                <li>補助金額を入力（該当する場合）</li>
                <li>「金額を計算」ボタンをクリック</li>
              </ol>
            </div>
          </div>
        </div>

        {/* 証明書作成ボタン */}
        <div className="mb-12">
          <Link
            href="/certificate/create"
            className="block bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
          >
            <div className="p-8 text-center">
              <div className="text-5xl mb-4">📝</div>
              <h2 className="text-2xl font-bold mb-2">増改築等工事証明書を作成する</h2>
              <p className="text-blue-100">
                複数の工事種別を統合して、正式な証明書を作成・PDF出力できます
              </p>
            </div>
          </Link>
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
