'use client';

import React, { useState } from 'react';
import { Stage2Admin } from './Stage2Admin';
import { Stage3Admin } from './Stage3Admin';
import { Building2, Clock } from 'lucide-react';

export const RhoRotationsAdmin: React.FC<{ initialSubTab?: 'stage2' | 'stage3' }> = ({
  initialSubTab = 'stage2'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'stage2' | 'stage3'>(initialSubTab);

  return (
    <div className="space-y-6">
      {/* Sub-navigation Switcher Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider block">
            Post-Internship RHO Placement
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            RHO Rotations &amp; Unit Placements
          </h2>
        </div>

        <div className="flex items-center space-x-1.5 p-1 rounded-lg bg-slate-100 border border-slate-200">
          <button
            onClick={() => setActiveSubTab('stage2')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeSubTab === 'stage2'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Stage 2: 3-Month Term</span>
          </button>

          <button
            onClick={() => setActiveSubTab('stage3')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeSubTab === 'stage3'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Stage 3: Unit Matching</span>
          </button>
        </div>
      </div>

      {/* Render Active Sub-Stage */}
      {activeSubTab === 'stage2' ? <Stage2Admin /> : <Stage3Admin />}
    </div>
  );
};
