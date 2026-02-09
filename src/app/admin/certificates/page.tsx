import { getCertificates } from '@/lib/admin-queries';
import CertificateTable from './CertificateTable';

type Props = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    purposeType?: string;
    page?: string;
  }>;
};

export default async function AdminCertificatesPage({ searchParams }: Props) {
  const params = await searchParams;

  const search = params.search || '';
  const status = params.status || 'all';
  const purposeType = params.purposeType || 'all';
  const page = parseInt(params.page || '1', 10);

  const { certificates, total, totalPages, currentPage } = await getCertificates({
    search: search || undefined,
    status: status !== 'all' ? status : undefined,
    purposeType: purposeType !== 'all' ? purposeType : undefined,
    page,
    perPage: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: '#1D1D1F' }}>
          証明書管理
        </h1>
        <p className="text-sm" style={{ color: '#86868B' }}>
          {total}件の証明書
        </p>
      </div>

      <CertificateTable
        certificates={certificates}
        search={search}
        statusFilter={status}
        purposeTypeFilter={purposeType}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}
