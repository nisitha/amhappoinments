'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { DoctorAuthCard } from '@/components/student/DoctorAuthCard';
import { DoctorMobileApp } from '@/components/student/DoctorMobileApp';
import { CheckCircle2 } from 'lucide-react';

export default function DoctorPortalPage() {
  const { currentStudent, toastMessage } = useApp();

  if (!currentStudent) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-center items-center p-4 selection:bg-[#3B5BDB] selection:text-white">
        <div className="w-full max-w-md my-auto">
          <DoctorAuthCard />
        </div>

        {/* Mobile-Friendly Toast Notification */}
        {toastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-full bg-white border border-slate-200 text-slate-900 text-xs font-semibold shadow-md animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
            <span className="truncate max-w-[280px]">{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-[#3B5BDB] selection:text-white">
      <DoctorMobileApp />

      {/* Mobile-Friendly Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-full bg-white border border-slate-200 text-slate-900 text-xs font-semibold shadow-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
          <span className="truncate max-w-[280px]">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
