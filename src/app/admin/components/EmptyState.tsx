'use client';

import { FileText, Database } from 'lucide-react';

const iconMap = {
  fileText: FileText,
  database: Database,
} as const;

type EmptyStateProps = {
  iconName: keyof typeof iconMap;
  title: string;
  description: string;
  subDescription?: string;
};

export default function EmptyState({
  iconName,
  title,
  description,
  subDescription,
}: EmptyStateProps) {
  const Icon = iconMap[iconName];

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
      >
        <Icon className="w-8 h-8" style={{ color: '#6366F1' }} />
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: '#1D1D1F' }}>
        {title}
      </h3>
      <p className="text-sm max-w-md" style={{ color: '#86868B' }}>
        {description}
      </p>
      {subDescription && (
        <p className="text-sm mt-2 max-w-md" style={{ color: '#A0A0A5' }}>
          {subDescription}
        </p>
      )}
    </div>
  );
}
