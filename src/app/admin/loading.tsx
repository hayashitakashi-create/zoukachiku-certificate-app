export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* タイトルスケルトン */}
      <div className="h-8 w-48 bg-white/40 rounded-lg animate-pulse" />

      {/* 統計カードスケルトン */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-6 animate-pulse"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
          >
            <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
            <div className="h-8 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* テーブルスケルトン */}
      <div
        className="rounded-xl p-6 animate-pulse"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
      >
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
