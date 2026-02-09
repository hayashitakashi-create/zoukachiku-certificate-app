import { auth } from '@/auth';
import { getUsers } from '@/lib/admin-queries';
import UserTable from './UserTable';

type Props = {
  searchParams: Promise<{ search?: string; page?: string }>;
};

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const session = await auth();
  const currentUserId = session?.user?.id ?? '';

  const search = params.search || '';
  const page = parseInt(params.page || '1', 10);

  const { users, total, totalPages, currentPage } = await getUsers({
    search: search || undefined,
    page,
    perPage: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: '#1D1D1F' }}>
          ユーザー管理
        </h1>
        <p className="text-sm" style={{ color: '#86868B' }}>
          {total}件のユーザー
        </p>
      </div>

      <UserTable
        users={users}
        currentUserId={currentUserId}
        search={search}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}
