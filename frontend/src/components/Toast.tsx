import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-3.5 rounded-xl shadow-md border transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-white text-slate-800 border-emerald-200'
              : toast.type === 'error'
              ? 'bg-white text-slate-800 border-rose-200'
              : 'bg-white text-slate-800 border-slate-200'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />}
          
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-slate-900">{toast.title}</h4>
            {toast.description && <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{toast.description}</p>}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
