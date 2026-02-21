import { auth } from '@/auth';
import { notFound } from 'next/navigation';
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

  // 防御層: ミドルウェアに加えてレイアウトでもadminロールを検証
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== 'admin') {
    notFound();
  }

  const userName = session.user.name || 'ゲスト';

  return (
    <div
      style={{
        background: 'linear-gradient(to bottom right, #F0F4FF 0%, #E0E7FF 50%, #EDE9FE 100%)',
        minHeight: '100vh',
      }}
    >
      <AdminSidebar userName={userName} />
      <div style={{ marginLeft: '280px' }}>
        <main style={{ padding: '32px' }}>{children}</main>
      </div>
    </div>
  );
}
