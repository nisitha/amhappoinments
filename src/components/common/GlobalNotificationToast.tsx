'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const GlobalNotificationToast: React.FC = () => {
  const { activeToast, dismissToast } = useApp();
  const [showDetails, setShowDetails] = useState(false);

  if (!activeToast) return null;

  const isError = activeToast.type === 'error';
  const isWarning = activeToast.type === 'warning';
  const isSuccess = activeToast.type === 'success';

  return (
    <aside
      aria-label="Notification"
      className="fixed bottom-6 right-6 z-50 max-w-sm sm:max-w-md w-full animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div
        className={`rounded-xl border shadow-xl p-4 bg-white transition-all ${
          isError
            ? 'border-red-300 ring-1 ring-red-200'
            : isWarning
            ? 'border-amber-300 ring-1 ring-amber-200'
            : isSuccess
            ? 'border-emerald-300 ring-1 ring-emerald-200'
            : 'border-slate-200 ring-1 ring-slate-100'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {isError && <AlertCircle className="w-5 h-5 text-red-600" />}
            {isWarning && <AlertTriangle className="w-5 h-5 text-amber-600" />}
            {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {!isError && !isWarning && !isSuccess && <Info className="w-5 h-5 text-blue-600" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                {activeToast.title}
              </h4>
              <button
                onClick={dismissToast}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-1 leading-relaxed break-words">
              {activeToast.message}
            </p>

            {activeToast.technicalDetails && (
              <div className="mt-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#3B5BDB] hover:text-[#2B4ACB] transition"
                >
                  <span>{showDetails ? 'Hide Technical Details' : 'View Details'}</span>
                  {showDetails ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                {showDetails && (
                  <pre className="mt-2 p-2.5 rounded-lg bg-slate-900 text-red-300 text-[11px] font-mono leading-normal overflow-x-auto max-h-48 whitespace-pre-wrap select-all border border-slate-800">
                    {activeToast.technicalDetails}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
