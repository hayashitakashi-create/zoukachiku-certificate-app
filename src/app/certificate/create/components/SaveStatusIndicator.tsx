'use client';

import type { SaveStatus } from '../hooks/useAutoSaveDraft';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
}

export default function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  if (status === 'idle') return null;

  const config: Record<Exclude<SaveStatus, 'idle'>, { text: string; color: string }> = {
    saving: { text: '保存中...', color: 'text-amber-600' },
    saved: { text: '下書き保存済み', color: 'text-emerald-600' },
    error: { text: '保存エラー', color: 'text-red-600' },
  };

  const { text, color } = config[status];

  return (
    <span className={`text-xs font-medium ${color} flex items-center gap-1`}>
      {status === 'saving' && (
        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {status === 'saved' && (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      {status === 'error' && (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )}
      {text}
    </span>
  );
}
