import { getDashboardStats, getRecentUsers, getRecentCertificates } from '@/lib/admin-queries';
import StatCard from './components/StatCard';
import RecentCertificates from './components/RecentCertificates';

export default async function AdminDashboardPage() {
  const [stats, recentUsers, recentCertificates] = await Promise.all([
    getDashboardStats(),
    getRecentUsers(10),
    getRecentCertificates(5),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold" style={{ color: '#1D1D1F' }}>
        ダッシュボード
      </h1>

      {/* 統計カード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard iconName="users" label="ユーザー数" value={stats.totalUsers} />
        <StatCard iconName="shield" label="管理者数" value={stats.adminUsers} color="#8B5CF6" />
        <StatCard iconName="fileText" label="証明書数" value={stats.totalCertificates} color="#10B981" />
        <StatCard iconName="userPlus" label="今月の新規登録" value={stats.newUsersThisMonth} color="#F59E0B" />
      </div>

      {/* 最近のアクティビティ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近のユーザー登録 */}
        <div
          className="rounded-xl border p-6"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(8px)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
          }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#1D1D1F' }}>
            最近のユーザー登録
          </h2>
          {recentUsers.length === 0 ? (
            <p className="text-sm py-4" style={{ color: '#86868B' }}>
              ユーザーが登録されていません
            </p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                  style={{ borderColor: 'rgba(0, 0, 0, 0.05)' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1D1D1F' }}>
                      {user.name || '名前未設定'}
                    </p>
                    <p className="text-xs" style={{ color: '#86868B' }}>
                      {user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: user.role === 'admin' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                        color: user.role === 'admin' ? '#8B5CF6' : '#6366F1',
                      }}
                    >
                      {user.role === 'admin' ? '管理者' : '建築士'}
                    </span>
                    <span className="text-xs" style={{ color: '#A0A0A5' }}>
                      {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 最近の証明書 */}
        <RecentCertificates certificates={recentCertificates} />
      </div>
    </div>
  );
}
