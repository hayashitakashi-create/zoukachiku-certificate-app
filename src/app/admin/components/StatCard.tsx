'use client';

import { motion } from 'framer-motion';
import { Users, Shield, FileText, UserPlus } from 'lucide-react';

const iconMap = {
  users: Users,
  shield: Shield,
  fileText: FileText,
  userPlus: UserPlus,
} as const;

type StatCardProps = {
  iconName: keyof typeof iconMap;
  label: string;
  value: number;
  color?: string;
};

export default function StatCard({
  iconName,
  label,
  value,
  color = '#6366F1',
}: StatCardProps) {
  const Icon = iconMap[iconName];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border p-6"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(8px)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <p className="text-sm font-medium" style={{ color: '#86868B' }}>
          {label}
        </p>
      </div>
      <p className="text-3xl font-bold" style={{ color: '#1D1D1F' }}>
        {value.toLocaleString()}
      </p>
    </motion.div>
  );
}
