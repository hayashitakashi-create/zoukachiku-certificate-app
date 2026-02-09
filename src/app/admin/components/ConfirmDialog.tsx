'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '削除',
  cancelLabel = 'キャンセル',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-sm rounded-2xl p-6 shadow-xl"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                >
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>
                  {title}
                </h3>
              </div>

              <p className="text-sm mb-6" style={{ color: '#86868B' }}>
                {message}
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
                  style={{ color: '#86868B' }}
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#EF4444' }}
                >
                  {loading ? '処理中...' : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
