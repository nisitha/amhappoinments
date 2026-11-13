'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { SpecialtyBadge } from '../common/SpecialtyBadge';
import { AuditDrawer } from '../common/AuditDrawer';
import {
  PlayCircle,
  Search,
  Download,
  Eye,
  CheckCircle2,
  Award,
  AlertTriangle
} from 'lucide-react';

export const AllocationRunner: React.FC = () => {
  const {
    hoSummary,
    runHOAllocation,
    selectedAuditCandidate,
    setSelectedAuditCandidate
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all');

  const filteredResults = (hoSummary?.results || []).filter((r) => {
    const matchesSearch =
      r.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.meritRank.toString() === searchQuery;

    if (!matchesSearch) return false;

    if (filterSpecialty === 'all') return true;
    return (
      r.assignedPair?.h1 === filterSpecialty || r.assignedPair?.h2 === filterSpecialty
    );
  });

  const exportAllocationCSV = () => {
    if (!hoSummary) return;
    const header = 'MeritRank,DoctorName,H1_Specialty,H2_Specialty,ChoiceAwarded,AuditVerdict\n';
    const rows = hoSummary.results
      .map(
        (r) =>
          `${r.meritRank},"${r.candidateName}",${r.assignedPair?.h1 || 'N/A'},${
            r.assignedPair?.h2 || 'N/A'
          },${r.choiceRank || 'N/A'},"${r.summaryExplanation.replace(/"/g, '""')}"`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AMH_Kalmunai_HO_Allocations_Official.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              Merit-Order Allocator
            </span>
            <span className="text-xs text-slate-500">Section Capacity Balanced</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1.5">
            Stage 1: HO Year Rotation Allocations &amp; Audit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Iterates strictly in Merit Order from Rank 1 to N. Tests requested choices against clinical section capacity. If requested choices are exhausted, offers feasible alternatives.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          {hoSummary && (
            <button
              onClick={exportAllocationCSV}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition border border-slate-200 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Official CSV</span>
            </button>
          )}

          <button
            onClick={runHOAllocation}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#3B5BDB] hover:bg-[#2B4ACB] text-white text-xs font-semibold shadow-xs transition"
          >
            <PlayCircle className="w-3.5 h-3.5 text-white" />
            <span>Execute Allocation</span>
          </button>
        </div>
      </div>

      {!hoSummary ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 mx-auto mb-3">
            <PlayCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Allocation Pending Execution</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Click &quot;Execute Allocation&quot; above to assign rotations to all registered candidates based on official merit order.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Total Processed</span>
              <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
                {hoSummary.totalStudents}
              </div>
              <span className="text-[11px] text-emerald-700 font-medium flex items-center mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                100% Resolved
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Granted Choices</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1 font-mono tabular-nums">
                {hoSummary.grantedCount}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block tabular-nums">
                {Math.round((hoSummary.grantedCount / hoSummary.totalStudents) * 100)}% Choice Rate
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Alternatives Available</span>
              <div className="text-2xl font-bold text-amber-700 mt-1 font-mono tabular-nums">
                {hoSummary.alternativesAvailableCount}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Offered feasible slots
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Clashes &amp; Duplicate Halves</span>
              <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
                {hoSummary.clashesCount}
              </div>
              <span className="text-[11px] text-emerald-700 font-medium flex items-center mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                0% Clash Guarantee
              </span>
            </div>
          </div>

          {/* Allocation Results Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Table Filter Toolbar */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
              <div className="relative max-w-sm w-full">
                <input
                  type="text"
                  placeholder="Filter by name or rank..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-600 transition"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2 pointer-events-none" />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-slate-500">Filter Specialty:</span>
                <select
                  value={filterSpecialty}
                  onChange={(e) => setFilterSpecialty(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-teal-600"
                >
                  <option value="all">All Specialties</option>
                  <option value="Medicine">Medicine</option>
                  <option value="Surgery">Surgery</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Gyn & Obs">Gyn &amp; Obs</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Doctor Name</th>
                    <th className="py-3 px-4">Section 1 (H1)</th>
                    <th className="py-3 px-4">Section 2 (H2)</th>
                    <th className="py-3 px-4">Choice Rank</th>
                    <th className="py-3 px-4">Audit Decision Summary</th>
                    <th className="py-3 px-4 text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResults.map((res) => (
                    <tr key={res.candidateId} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900 tabular-nums">
                        #{res.meritRank}
                      </td>

                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900">{res.candidateName}</div>
                      </td>

                      <td className="py-2.5 px-4">
                        {res.assignedPair ? (
                          <SpecialtyBadge specialty={res.assignedPair.h1} size="sm" showGroup={true} />
                        ) : (
                          <span className="text-slate-400 italic">Pending Alternative</span>
                        )}
                      </td>

                      <td className="py-2.5 px-4">
                        {res.assignedPair ? (
                          <SpecialtyBadge specialty={res.assignedPair.h2} size="sm" showGroup={true} />
                        ) : (
                          <span className="text-slate-400 italic">Pending Alternative</span>
                        )}
                      </td>

                      <td className="py-2.5 px-4">
                        {res.choiceRank ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Award className="w-3 h-3 mr-1 text-emerald-600" />
                            Choice #{res.choiceRank}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Alternative
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 max-w-xs text-slate-500 truncate">
                        {res.summaryExplanation}
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedAuditCandidate(res)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium text-xs transition shadow-xs"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>Audit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Audit Drawer Modal */}
      <AuditDrawer
        candidate={selectedAuditCandidate}
        onClose={() => setSelectedAuditCandidate(null)}
      />
    </div>
  );
};
