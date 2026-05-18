import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const variants = {
  success: {
    icon: CheckCircle2,
    accent: 'from-emerald-500 to-emerald-600',
    iconBg: 'bg-emerald-50 text-emerald-600',
    button: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
  },
  error: {
    icon: AlertTriangle,
    accent: 'from-rose-500 to-rose-600',
    iconBg: 'bg-rose-50 text-rose-600',
    button: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
  },
  info: {
    icon: Info,
    accent: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-50 text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  },
  confirm: {
    icon: AlertTriangle,
    accent: 'from-amber-500 to-amber-600',
    iconBg: 'bg-amber-50 text-amber-600',
    button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
  },
};

export default function MessagePopup({
  open,
  title,
  message,
  variant = 'success',
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  onClose,
}) {
  if (!open) {
    return null;
  }

  const config = variants[variant] || variants.success;
  const Icon = config.icon;
  const isConfirmation = variant === 'confirm';

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    if (onClose) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    if (onClose) {
      onClose();
    }
  };

  const handleCloseButton = () => {
    if (isConfirmation) {
      handleConfirm();
    } else {
      handleCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className={`h-2 bg-gradient-to-r ${config.accent}`} />
        <button
          type="button"
          aria-label="Close popup"
          onClick={handleCloseButton}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="p-6 sm:p-7">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${config.iconBg}`}>
            <Icon className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
          <div className="mt-7 flex justify-end gap-3">
            {isConfirmation && (
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 shadow-lg shadow-slate-200 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                {cancelLabel}
              </button>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.button}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
