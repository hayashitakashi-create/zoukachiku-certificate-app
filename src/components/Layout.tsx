'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, FileText, Settings } from 'lucide-react';

type LayoutProps = {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
};

export default function Layout({ children, title, actions }: LayoutProps) {
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState(() => {
    if (pathname === '/') return 'home';
    if (pathname === '/settings') return 'settings';
    if (pathname?.startsWith('/certificate')) return 'certificates';
    return 'home';
  });

  const menuItems = [
    { id: 'home', icon: Home, label: 'ダッシュボード', href: '/' },
    { id: 'certificates', icon: FileText, label: '証明書一覧', href: '/' },
    { id: 'settings', icon: Settings, label: '設定', href: '/settings' },
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
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                onClick={() => setActiveMenu(item.id)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-lg font-medium transition-all duration-200"
                style={{
                  backgroundColor: activeMenu === item.id ? '#007AFF' : 'transparent',
                  color: activeMenu === item.id ? '#FFFFFF' : '#86868B',
                  boxShadow: activeMenu === item.id ? '0 4px 12px rgba(0, 122, 255, 0.2)' : 'none',
                }}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            </motion.div>
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
            zIndex: 30,
          }}
        >
          <h2 className="text-2xl font-semibold" style={{ color: '#1D1D1F' }}>
            {title || 'ページ'}
          </h2>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </header>

        {/* コンテンツ */}
        <main style={{ padding: '32px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
