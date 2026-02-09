'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, FileText, ArrowLeft } from 'lucide-react';

type AdminSidebarProps = {
  userName?: string | null;
};

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'ダッシュボード', href: '/admin' },
  { id: 'users', icon: Users, label: 'ユーザー管理', href: '/admin/users' },
  { id: 'certificates', icon: FileText, label: '証明書管理', href: '/admin/certificates' },
];

export default function AdminSidebar({ userName }: AdminSidebarProps) {
  const pathname = usePathname();

  const getActiveId = () => {
    if (pathname === '/admin') return 'dashboard';
    if (pathname?.startsWith('/admin/users')) return 'users';
    if (pathname?.startsWith('/admin/certificates')) return 'certificates';
    return 'dashboard';
  };

  const activeId = getActiveId();

  return (
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
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ロゴエリア */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="text-2xl font-bold whitespace-nowrap block hover:opacity-70 transition-opacity"
          style={{ color: '#1D1D1F' }}
        >
          管理パネル
        </Link>
        <p className="text-base mt-1" style={{ color: '#86868B' }}>
          ダンドリワーク
        </p>
      </div>

      {/* メニュー */}
      <nav className="space-y-1 mb-8 flex-1">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Link
              href={item.href}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-lg font-medium transition-all duration-200"
              style={{
                backgroundColor: activeId === item.id ? '#6366F1' : 'transparent',
                color: activeId === item.id ? '#FFFFFF' : '#86868B',
                boxShadow: activeId === item.id ? '0 4px 12px rgba(99, 102, 241, 0.2)' : 'none',
              }}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          </motion.div>
        ))}
      </nav>

      {/* 下部: ユーザー名 + サイトへ戻る */}
      <div className="border-t pt-4 space-y-3" style={{ borderColor: 'rgba(0, 0, 0, 0.08)' }}>
        {userName && (
          <p className="text-sm font-medium truncate" style={{ color: '#1D1D1F' }}>
            {userName}
          </p>
        )}
        <Link
          href="/"
          className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
          style={{ color: '#6366F1' }}
        >
          <ArrowLeft className="w-4 h-4" />
          サイトへ戻る
        </Link>
      </div>
    </aside>
  );
}
