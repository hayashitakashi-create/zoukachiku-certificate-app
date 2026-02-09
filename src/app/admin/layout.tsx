import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AdminSidebar from './components/AdminSidebar';

export const metadata = {
  title: '管理パネル | 増改築等工事証明書',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // 二重チェック: 未認証またはadmin以外はリダイレクト
  if (!session?.user) {
    redirect('/login');
  }
  if ((session.user as { role?: string }).role !== 'admin') {
    redirect('/');
  }

  return (
    <div
      style={{
        background: 'linear-gradient(to bottom right, #F0F4FF 0%, #E0E7FF 50%, #EDE9FE 100%)',
        minHeight: '100vh',
      }}
    >
      <AdminSidebar userName={session.user.name} />
      <div style={{ marginLeft: '280px' }}>
        <main style={{ padding: '32px' }}>{children}</main>
      </div>
    </div>
  );
}
