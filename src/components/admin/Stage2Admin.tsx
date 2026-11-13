'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { SpecialtyBadge } from '../common/SpecialtyBadge';
import { CORE_SPECIALTIES, Specialty } from '@/lib/algorithms';
import { PlayCircle } from 'lucide-react';

export const Stage2Admin: React.FC = () => {
  const {
    rhoCandidates,
    rhoQuotas,
    setRhoQuotas,
    rhoSummary,
    runRHO3MonthAllocation,
    showToast
  } = useApp();

  const [localQuotas, setLocalQuotas] = useState(rhoQuotas);

  const totalQuota =
    localQuotas.Medicine +
    localQuotas.Surgery +
    localQuotas.Pediatrics +
    localQuotas['Gyn & Obs'];

  const handleUpdate = (spec: Specialty, val: number) => {
    setLocalQuotas((prev) => ({
      ...prev,
      [spec]: Math.max(0, isNaN(val) ? 0 : val)
    }));
  };

  const handleSaveAndRun = () => {
    if (totalQuota !== rhoCandidates.length) {
      showToast(`Total 3-Month quotas (${totalQuota}) must equal candidate count (${rhoCandidates.length}).`);
      return;
    }
    setRhoQuotas(localQuotas);
    runRHO3MonthAllocation();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              Uncompleted Specialty Exclusion
            </span>
            <span className="text-xs text-slate-500">Stage 2 Rotation</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1.5">
            Stage 2: RHO Initial Rotation (First 3 Months)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Doctors rotate strictly into 1 of the 2 uncompleted specialties from their Stage 1 HO Year.
          </p>
        </div>

        <button
          onClick={handleSaveAndRun}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#3B5BDB] hover:bg-[#2B4ACB] text-white text-xs font-semibold shadow-xs transition shrink-0"
        >
          <PlayCircle className="w-3.5 h-3.5 text-white" />
          <span>Allocate Stage 2 RHO</span>
        </button>
      </div>

      {/* 3-Month Section Quotas */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Departmental 3-Month Slot Capacities
          </h3>
          <span className="text-xs text-slate-500">
            Total Quota: <strong className="text-slate-900 tabular-nums">{totalQuota}</strong> / <span className="tabular-nums">{rhoCandidates.length}</span> Candidates
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {CORE_SPECIALTIES.map((spec) => (
            <div key={spec} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <SpecialtyBadge specialty={spec} size="sm" />
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-500">Quota:</span>
                <input
                  type="number"
                  min={0}
                  value={localQuotas[spec]}
                  onChange={(e) => handleUpdate(spec, parseInt(e.target.value))}
                  className="w-16 px-2 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono font-bold text-center text-slate-900 tabular-nums focus:outline-hidden focus:border-teal-600"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Results View */}
      {rhoSummary && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Stage 2 Allocation Roster ({rhoSummary.allocatedCount} Allocated)
            </h3>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Zero Clash
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Candidate</th>
                  <th className="py-2.5 px-3">Completed HO Year (Excluded)</th>
                  <th className="py-2.5 px-3">Assigned 3-Month RHO</th>
                  <th className="py-2.5 px-3">Choice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rhoSummary.results.slice(0, 10).map((r) => (
                  <tr key={r.candidateId} className="hover:bg-slate-50/70 transition">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900 tabular-nums">
                      #{r.meritRank}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {r.candidateName}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-1">
                        <SpecialtyBadge specialty={r.eligibleSpecialties[0]} size="sm" />
                        <span className="text-slate-400">&amp;</span>
                        <SpecialtyBadge specialty={r.eligibleSpecialties[1]} size="sm" />
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      {r.assignedSpecialty ? (
                        <SpecialtyBadge specialty={r.assignedSpecialty} size="sm" />
                      ) : (
                        <span className="text-slate-400">Unallocated</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-semibold text-emerald-700">Choice #{r.choiceRank}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
