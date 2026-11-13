'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConsultantPortal } from '@/components/consultant/ConsultantPortal';

function ConsultantContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || undefined;

  return (
    <div className="min-h-screen bg-[#F4F7FE] text-[#1B2559] flex flex-col justify-between selection:bg-[#5A9BF6] selection:text-white">
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <ConsultantPortal initialPin={token} />
      </main>

      <footer className="border-t border-[#E2E8F0] bg-white py-6 text-center text-xs text-[#8F9BBA]">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Sri Lanka Medical Council (SLMC) • Hospital Departmental Portal</span>
          <span>Stage 3 Two-Sided Matching • Frictionless PIN Access</span>
        </div>
      </footer>
    </div>
  );
}

export default function ConsultantPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center p-8 text-center text-xs text-[#8F9BBA]">
          <div className="animate-pulse font-semibold">Loading Departmental Access...</div>
        </div>
      }
    >
      <ConsultantContent />
    </Suspense>
  );
}

