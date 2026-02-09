'use client';

import { FileText } from 'lucide-react';

type Certificate = {
  id: string;
  applicantName: string;
  propertyAddress: string;
  status: string;
};

export default function RecentCertificates({ certificates }: { certificates: Certificate[] }) {
  return (
    <div
      className="rounded-xl border p-6"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(8px)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
      }}
    >
      <h2 className="text-lg font-semibold mb-4" style={{ color: '#1D1D1F' }}>
        最近の証明書
      </h2>
      {certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
          >
            <FileText className="w-8 h-8" style={{ color: '#6366F1' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#1D1D1F' }}>
            証明書なし
          </h3>
          <p className="text-sm max-w-md" style={{ color: '#86868B' }}>
            データベースに証明書はまだ保存されていません。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="flex items-center justify-between py-2 border-b last:border-0"
              style={{ borderColor: 'rgba(0, 0, 0, 0.05)' }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: '#1D1D1F' }}>
                  {cert.applicantName}
                </p>
                <p className="text-xs" style={{ color: '#86868B' }}>
                  {cert.propertyAddress}
                </p>
              </div>
              <span
                className="text-xs px-2 py-1 rounded-full font-medium"
                style={{
                  backgroundColor:
                    cert.status === 'issued'
                      ? 'rgba(16, 185, 129, 0.1)'
                      : cert.status === 'completed'
                        ? 'rgba(59, 130, 246, 0.1)'
                        : 'rgba(156, 163, 175, 0.1)',
                  color:
                    cert.status === 'issued'
                      ? '#10B981'
                      : cert.status === 'completed'
                        ? '#3B82F6'
                        : '#9CA3AF',
                }}
              >
                {cert.status === 'issued' ? '発行済み' : cert.status === 'completed' ? '完了' : '下書き'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
