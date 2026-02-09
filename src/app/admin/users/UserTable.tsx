'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { updateUserRole, deleteUser } from '../actions/user-actions';
import ConfirmDialog from '../components/ConfirmDialog';

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
  accounts: { provider: string }[];
};

type UserTableProps = {
  users: User[];
  currentUserId: string;
  search: string;
  currentPage: number;
  totalPages: number;
};

export default function UserTable({
  users,
  currentUserId,
  search,
  currentPage,
  totalPages,
}: UserTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(search);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchValue) {
      params.set('search', searchValue);
    } else {
      params.delete('search');
    }
    params.delete('page');
    router.push(`/admin/users?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleRoleToggle = (userId: string, currentRole: string) => {
    setActionError(null);
    const newRole = currentRole === 'admin' ? 'architect' : 'admin';
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (result.error) {
        setActionError(result.error);
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setActionError(null);
    startTransition(async () => {
      const result = await deleteUser(deleteTarget.id);
      if (result.error) {
        setActionError(result.error);
      }
      setDeleteTarget(null);
    });
  };

  const getAuthMethod = (user: User) => {
    if (user.accounts.length > 0) {
      return user.accounts.map((a) => a.provider).join(', ');
    }
    return 'メール/パスワード';
  };

  return (
    <>
      {/* 検索 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: '#86868B' }}
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="名前またはメールで検索..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors focus:border-indigo-400"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderColor: 'rgba(0, 0, 0, 0.1)',
            }}
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: '#6366F1' }}
        >
          検索
        </button>
      </div>

      {/* エラーメッセージ */}
      {actionError && (
        <div
          className="px-4 py-3 rounded-lg text-sm"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}
        >
          {actionError}
        </div>
      )}

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
                {['名前', 'メール', 'ロール', '登録日', '認証方法', '操作'].map(
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
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                return (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-white/50"
                    style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.03)' }}
                  >
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: '#1D1D1F' }}>
                      {user.name || '名前未設定'}
                      {isSelf && (
                        <span className="ml-2 text-xs text-indigo-500">(自分)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#86868B' }}>
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{
                          backgroundColor:
                            user.role === 'admin'
                              ? 'rgba(139, 92, 246, 0.1)'
                              : 'rgba(99, 102, 241, 0.1)',
                          color: user.role === 'admin' ? '#8B5CF6' : '#6366F1',
                        }}
                      >
                        {user.role === 'admin' ? '管理者' : '建築士'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#86868B' }}>
                      {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#86868B' }}>
                      {getAuthMethod(user)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRoleToggle(user.id, user.role)}
                          disabled={isSelf || isPending}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40"
                          style={{
                            backgroundColor: isSelf
                              ? 'rgba(0,0,0,0.05)'
                              : 'rgba(99, 102, 241, 0.1)',
                            color: isSelf ? '#A0A0A5' : '#6366F1',
                          }}
                        >
                          {user.role === 'admin' ? '建築士に変更' : '管理者に変更'}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          disabled={isSelf || isPending}
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-50 disabled:opacity-40"
                          title={isSelf ? '自分は削除できません' : 'ユーザーを削除'}
                        >
                          <Trash2
                            className="w-4 h-4"
                            style={{ color: isSelf ? '#A0A0A5' : '#EF4444' }}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm"
                    style={{ color: '#86868B' }}
                  >
                    ユーザーが見つかりません
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

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="ユーザーを削除"
        message={`「${deleteTarget?.name || deleteTarget?.email}」を削除しますか？この操作は取り消せません。`}
        confirmLabel="削除する"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={isPending}
      />
    </>
  );
}
