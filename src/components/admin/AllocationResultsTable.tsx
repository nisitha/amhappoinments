'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { SpecialtyBadge } from '../common/SpecialtyBadge';
import { Specialty } from '@/lib/algorithms';
import {
  CheckCircle2,
  AlertTriangle,
  Award,
  Search,
  Download,
  Calendar,
  Sparkles,
  RotateCcw,
  Info
} from 'lucide-react';

interface AllocationResultsTableProps {
  onReset?: () => void;
  showCardHeader?: boolean;
}

export const AllocationResultsTable: React.FC<AllocationResultsTableProps> = ({
  onReset,
  showCardHeader = true
}) => {
  const {
    hoSummary,
    candidates,
    activeIntake,
    rotationMilestones,
    resetAllocations,
    showToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all');
  const [filterChoice, setFilterChoice] = useState<string>('all');

  const results = hoSummary?.results || [];
  const total = results.length;
  const grantedCount = results.filter((r) => r.status === 'GRANTED').length;
  const firstChoiceCount = results.filter((r) => r.choiceRank === 1).length;
  const firstChoiceRate = total > 0 ? Math.round((firstChoiceCount / total) * 100) : 0;
  const alternativesCount = results.filter((r) => r.status === 'ALTERNATIVES_AVAILABLE').length;

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.candidateName.toLowerCase().includes(q) ||
        r.meritRank.toString().includes(q);

      if (!matchesSearch) return false;

      if (filterSpecialty !== 'all') {
        const matchesSpec =
          r.assignedPair?.h1 === filterSpecialty ||
          r.assignedPair?.h2 === filterSpecialty;
        if (!matchesSpec) return false;
      }

      if (filterChoice !== 'all') {
        if (filterChoice === '1' && r.choiceRank !== 1) return false;
        if (filterChoice === '2' && r.choiceRank !== 2) return false;
        if (filterChoice === '3' && r.choiceRank !== 3) return false;
        if (filterChoice === 'alt' && r.status !== 'ALTERNATIVES_AVAILABLE') return false;
      }

      return true;
    });
  }, [results, searchQuery, filterSpecialty, filterChoice]);

  const handleExportCSV = () => {
    if (!hoSummary) return;
    const header = 'MeritRank,DoctorName,Section1_H1,H1_Dates,Section2_H2,H2_Dates,PreferenceMatch,Status,AuditDecision\n';
    const rows = hoSummary.results
      .map((r) => {
        const match = r.choiceRank ? `${r.choiceRank} Choice` : 'Alternative Required';
        const h1Dates = `${rotationMilestones.h1.startFormatted} to ${rotationMilestones.h1.endFormatted}`;
        const h2Dates = `${rotationMilestones.h2.startFormatted} to ${rotationMilestones.h2.endFormatted}`;
        return `${r.meritRank},"${r.candidateName}",${r.assignedPair?.h1 || 'N/A'},"${h1Dates}",${r.assignedPair?.h2 || 'N/A'},"${h2Dates}",${match},${r.status},"${(r.summaryExplanation || '').replace(/"/g, '""')}"`;
      })
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AMH_Kalmunai_Official_Allocation_${activeIntake.name.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Official Allocation CSV Export downloaded.');
  };

  if (!hoSummary) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-xs">
        <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
        <h3 className="text-base font-bold text-slate-800">
          Official Allocations Not Yet Generated
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Click &ldquo;Generate Allocations&rdquo; in the top navigation bar to execute the official merit-order matching algorithm for {activeIntake.name}.
        </p>
      </div>
    );
  }

  return (
    <div id="official-allocation-results" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden scroll-mt-20">
      {/* Table Executive Card Header */}
      {showCardHeader && (
        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                Official Allocation Complete
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-700">
                {activeIntake.name} Cohort (N = {activeIntake.totalHOs})
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Official Merit-Order Rotation Allocation Results
            </h3>
            <p className="text-xs text-slate-500">
              Granted clinical sections adhering strictly to All-Island ERPM merit ranking and 1 Medical + 1 Surgical pairing constraints.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={onReset || resetAllocations}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium shadow-xs transition"
              title="Reset allocations to open status"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* Summary KPI Pills Strip */}
      <div className="p-4 bg-slate-50/70 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-3 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Total Processed</span>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            {total} <span className="text-xs font-normal text-slate-400">Doctors</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-medium text-emerald-700 block">Granted Choices</span>
          <div className="text-xl font-bold text-emerald-700 font-mono tabular-nums mt-0.5">
            {grantedCount} <span className="text-xs font-normal text-emerald-600/80">/ {total}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-medium text-[#3B5BDB] block">1st Choice Rate</span>
          <div className="text-xl font-bold text-[#3B5BDB] font-mono tabular-nums mt-0.5">
            {firstChoiceRate}%
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-medium text-amber-700 block">Action Required</span>
          <div className="text-xl font-bold text-amber-700 font-mono tabular-nums mt-0.5">
            {alternativesCount} <span className="text-xs font-normal text-amber-600/80">Alt. Slots</span>
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="p-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div className="relative max-w-sm w-full">
          <input
            type="text"
            placeholder="Search by doctor name or merit rank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#3B5BDB] transition"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Specialty:</span>
            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-[#3B5BDB]"
            >
              <option value="all">All Specialties</option>
              <option value="Medicine">Medicine</option>
              <option value="Surgery">Surgery</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Gyn & Obs">Gyn &amp; Obs</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Match:</span>
            <select
              value={filterChoice}
              onChange={(e) => setFilterChoice(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-[#3B5BDB]"
            >
              <option value="all">All Matches</option>
              <option value="1">1st Choice</option>
              <option value="2">2nd Choice</option>
              <option value="3">3rd Choice</option>
              <option value="alt">Action Required</option>
            </select>
          </div>
        </div>
      </div>

      {/* Allocation Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4 w-20">Merit Rank</th>
              <th className="py-3 px-4 min-w-[180px]">Doctor Name</th>
              <th className="py-3 px-4 min-w-[200px]">1st 6 Months (H1) Granted</th>
              <th className="py-3 px-4 min-w-[200px]">2nd 6 Months (H2) Granted</th>
              <th className="py-3 px-4 w-32">Preference Match</th>
              <th className="py-3 px-4 w-28 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-xs text-slate-400">
                  <Info className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                  <span>No allocation results matching current filters.</span>
                </td>
              </tr>
            ) : (
              filteredResults.map((row) => {
                const isGranted = row.status === 'GRANTED';
                const pair = row.assignedPair;

                return (
                  <tr key={row.candidateId} className="hover:bg-slate-50/70 transition">
                    {/* 1. Merit Rank */}
                    <td className="py-3 px-4 font-mono font-bold text-[#3B5BDB] tabular-nums text-sm">
                      #{row.meritRank}
                    </td>

                    {/* 2. Doctor Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 text-xs">
                        {row.candidateName}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        ID: <span className="font-mono">{row.candidateId}</span>
                      </div>
                    </td>

                    {/* 3. 1st 6 Months (H1) Granted Section */}
                    <td className="py-3 px-4">
                      {pair?.h1 ? (
                        <div className="space-y-1">
                          <SpecialtyBadge specialty={pair.h1} size="md" />
                          <div className="text-[10px] text-slate-500 font-mono tabular-nums flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              {rotationMilestones.h1.startFormatted} – {rotationMilestones.h1.endFormatted}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Pending Selection</span>
                      )}
                    </td>

                    {/* 4. 2nd 6 Months (H2) Granted Section */}
                    <td className="py-3 px-4">
                      {pair?.h2 ? (
                        <div className="space-y-1">
                          <SpecialtyBadge specialty={pair.h2} size="md" />
                          <div className="text-[10px] text-slate-500 font-mono tabular-nums flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              {rotationMilestones.h2.startFormatted} – {rotationMilestones.h2.endFormatted}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Pending Selection</span>
                      )}
                    </td>

                    {/* 5. Preference Match Badge */}
                    <td className="py-3 px-4">
                      {row.choiceRank === 1 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                          <Award className="w-3 h-3 text-[#10B981]" />
                          1st Choice
                        </span>
                      )}
                      {row.choiceRank === 2 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          2nd Choice
                        </span>
                      )}
                      {row.choiceRank === 3 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          3rd Choice
                        </span>
                      )}
                      {row.choiceRank && row.choiceRank > 3 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {row.choiceRank}th Choice
                        </span>
                      )}
                      {!row.choiceRank && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Alternative Required
                        </span>
                      )}
                    </td>

                    {/* 6. Status Badge */}
                    <td className="py-3 px-4 text-right">
                      {isGranted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                          Granted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
                          Action Required
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing <strong className="text-slate-900 font-mono">{filteredResults.length}</strong> of{' '}
          <strong className="text-slate-900 font-mono">{results.length}</strong> official allocations
        </span>
        <span className="text-[11px] text-slate-400">
          MOH Sri Lanka • AMH Kalmunai Clinical Portal
        </span>
      </div>
    </div>
  );
};