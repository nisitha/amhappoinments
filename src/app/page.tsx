'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { DoctorAuthCard } from '@/components/student/DoctorAuthCard';
import { DoctorMobileApp } from '@/components/student/DoctorMobileApp';
import { GlobalNotificationToast } from '@/components/common/GlobalNotificationToast';

export default function DoctorPortalPage() {
  const { currentStudent } = useApp();

  if (!currentStudent) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-center items-center p-4 selection:bg-[#3B5BDB] selection:text-white">
        <div className="w-full max-w-md my-auto">
          <DoctorAuthCard />
        </div>

        <GlobalNotificationToast />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-[#3B5BDB] selection:text-white">
      <DoctorMobileApp />

      <GlobalNotificationToast />
    </div>
  );
}
