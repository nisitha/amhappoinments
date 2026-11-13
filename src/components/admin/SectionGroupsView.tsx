'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Specialty, CORE_SPECIALTIES } from '@/lib/algorithms';
import { SpecialtyBadge } from '../common/SpecialtyBadge';
import {
  Layers,
  Calendar,
  Printer,
  Users,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  Stethoscope,
  Activity,
  HeartPulse,
  Sparkles,
  RotateCcw
} from 'lucide-react';

interface SectionGroupsViewProps {
  onNavigateTab?: (tab: string) => void;
}

type PeriodFilter = 'H1' | 'H2' | 'both';

interface SpecialtyCardConfig {
  name: Specialty;
  code: string;
  groupLabel: 'Medical (Group A)' | 'Surgical (Group B)';
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  borderClass: string;
  headerBg: string;
}

const SPECIALTY_CONFIGS: Record<Specialty, SpecialtyCardConfig> = {
  Medicine: {
    name: 'Medicine',
    code: 'MED',
    groupLabel: 'Medical (Group A)',
    icon: Stethoscope,
    accentColor: '#3B5BDB',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    borderClass: 'border-indigo-200',
    headerBg: 'bg-indigo-50/60'
  },
  Surgery: {
    name: 'Surgery',
    code: 'SURG',
    groupLabel: 'Surgical (Group B)',
    icon: Activity,
    accentColor: '#E11D48',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    borderClass: 'border-rose-200',
    headerBg: 'bg-rose-50/60'
  },
  Pediatrics: {
    name: 'Pediatrics',
    code: 'PED',
    groupLabel: 'Medical (Group A)',
    icon: HeartPulse,
    accentColor: '#059669',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    borderClass: 'border-emerald-200',
    headerBg: 'bg-emerald-50/60'
  },
  'Gyn & Obs': {
    name: 'Gyn & Obs',
    code: 'OG',
    groupLabel: 'Surgical (Group B)',
    icon: Sparkles,
    accentColor: '#D97706',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    borderClass: 'border-amber-200',
    headerBg: 'bg-amber-50/60'
  }
};

export const SectionGroupsView: React.FC<SectionGroupsViewProps> = ({ onNavigateTab }) => {
  const {
    hoSummary,
    candidates,
    quotas,
    activeIntake,
    rotationMilestones,
    runHOAllocation,
    resetAllocations,
    showToast
  } = useApp();

  const [period, setPeriod] = useState<PeriodFilter>('H1');

  // Candidate phone number map
  const candidatePhoneMap = useMemo(() => {
    const map = new Map<string, string>();
    candidates.forEach((c) => {
      if (c.mobileNumber) map.set(c.id, c.mobileNumber);
    });
    return map;
  }, [candidates]);

  // Action required (alternative available) count
  const actionRequiredCount = useMemo(() => {
    return hoSummary?.results.filter((r) => r.status === 'ALTERNATIVES_AVAILABLE').length || 0;
  }, [hoSummary]);

  // Group doctors by specialty for each half
  const groupedData = useMemo(() => {
    const emptyGroup = (): Record<Specialty, typeof hoSummary extends null ? never : NonNullable<typeof hoSummary>['results']> => ({
      Medicine: [],
      Surgery: [],
      Pediatrics: [],
      'Gyn & Obs': []
    });

    const h1Groups = emptyGroup();
    const h2Groups = emptyGroup();

    if (!hoSummary) return { h1Groups, h2Groups };

    hoSummary.results.forEach((res) => {
      if (res.status === 'GRANTED' && res.assignedPair) {
        if (res.assignedPair.h1 in h1Groups) {
          h1Groups[res.assignedPair.h1].push(res);
        }
        if (res.assignedPair.h2 in h2Groups) {
          h2Groups[res.assignedPair.h2].push(res);
        }
      }
    });

    // Sort strictly by merit rank ascending
    (Object.keys(h1Groups) as Specialty[]).forEach((spec) => {
      h1Groups[spec].sort((a, b) => a.meritRank - b.meritRank);
    });
    (Object.keys(h2Groups) as Specialty[]).forEach((spec) => {
      h2Groups[spec].sort((a, b) => a.meritRank - b.meritRank);
    });

    return { h1Groups, h2Groups };
  }, [hoSummary]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleGenerate = () => {
    runHOAllocation();
    showToast('Official allocations generated across all 4 clinical sections!', 'success');
  };

  // If allocations haven't been generated yet
  if (!hoSummary) {
    return (
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#3B5BDB] border border-[#C5D2FB]">
                Clinical Sections
              </span>
              <span className="text-xs text-slate-500">• {activeIntake.name}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Clinical Section Group Rosters
            </h2>
            <p className="text-xs text-slate-500 max-w-xl">
              Inspect House Officers allocated to each of the 4 clinical disciplines (Medicine, Surgery, Pediatrics, Gyn &amp; Obs) for Section 1 (H1) and Section 2 (H2).
            </p>
          </div>

          <button
            onClick={handleGenerate}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-lg bg-[#3B5BDB] hover:bg-[#2B4ACB] text-white text-xs font-semibold shadow-xs transition shrink-0"
          >
            <Zap className="w-4 h-4 fill-current text-white" />
            <span>Generate Allocations Now</span>
          </button>
        </div>

        {/* Empty State Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Section Groups Pending Allocation
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Allocations have not been executed for <strong className="text-slate-800">{activeIntake.name}</strong> yet. Click the button below to assign all registered doctors according to All-Island ERPM merit ranking.
          </p>
          <div className="pt-2">
            <button
              onClick={handleGenerate}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#3B5BDB] hover:bg-[#2B4ACB] text-white text-xs font-semibold shadow-xs transition"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-white" />
              <span>Generate Allocations Now</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* =========================================================================
          PERIOD SWITCHER HEADER & ACTIONS
      ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                Section Roster Active
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-700">
                {activeIntake.name} (N = {activeIntake.totalHOs})
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Hospital Clinical Section Rosters
            </h2>
            <p className="text-xs text-slate-500">
              Official House Officer distribution grouped by clinical department. Organized for hospital notice boards, ward assignments, and duty rosters.
            </p>
          </div>

          {/* Action Buttons (Print + Reset) */}
          <div className="flex items-center gap-2 shrink-0 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
              title="Print or export PDF of section rosters"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>Print Section Lists</span>
            </button>

            <button
              type="button"
              onClick={resetAllocations}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium shadow-xs transition"
              title="Reset allocations"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Warning pill if any doctors require alternative selection */}
        {actionRequiredCount > 0 && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs print:hidden">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong className="font-semibold">{actionRequiredCount} candidate{actionRequiredCount > 1 ? 's' : ''}</strong> could not be granted preferred choices due to quota saturation and require alternative selection.
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab?.('candidates')}
              className="font-bold underline text-amber-900 hover:text-amber-950 shrink-0 flex items-center gap-1"
            >
              <span>Inspect in Registered HOs</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Segmented Period Switcher */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPeriod('H1')}
              className={`px-3.5 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                period === 'H1'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-[#3B5BDB]" />
              <span>1st 6 Months (H1)</span>
              <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                ({rotationMilestones.h1.startFormatted} – {rotationMilestones.h1.endFormatted})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPeriod('H2')}
              className={`px-3.5 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                period === 'H2'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>2nd 6 Months (H2)</span>
              <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                ({rotationMilestones.h2.startFormatted} – {rotationMilestones.h2.endFormatted})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPeriod('both')}
              className={`px-3.5 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                period === 'both'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-600" />
              <span>Both Halves (Full Year)</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Active Filter:{' '}
            <strong className="text-slate-900 font-semibold">
              {period === 'H1' && `1st 6 Months • ${rotationMilestones.h1.startFormatted} to ${rotationMilestones.h1.endFormatted}`}
              {period === 'H2' && `2nd 6 Months • ${rotationMilestones.h2.startFormatted} to ${rotationMilestones.h2.endFormatted}`}
              {period === 'both' && `Full Academic Year • 2x 6-Month Rotations`}
            </strong>
          </div>
        </div>
      </div>

      {/* Printable Hospital Notice Header (Only Visible When Printing) */}
      <div className="hidden print:block mb-6 text-center border-b pb-4">
        <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
          Ashraff Memorial Hospital • Kalmunai
        </h1>
        <p className="text-xs font-medium text-slate-600">
          Ministry of Health — Sri Lanka • House Officer Clinical Section Placement Notice
        </p>
        <p className="text-xs font-semibold text-slate-800 mt-1">
          Intake: {activeIntake.name} • Academic Year: 2026/2027 • Total HOs: {activeIntake.totalHOs}
        </p>
        <p className="text-[11px] font-mono text-slate-500 mt-0.5">
          {period === 'H1' && `Period: 1st 6 Months (H1) • ${rotationMilestones.h1.startFormatted} to ${rotationMilestones.h1.endFormatted}`}
          {period === 'H2' && `Period: 2nd 6 Months (H2) • ${rotationMilestones.h2.startFormatted} to ${rotationMilestones.h2.endFormatted}`}
          {period === 'both' && `Period: Full Year (H1 & H2) • Starts ${rotationMilestones.appointmentFormatted}`}
        </p>
      </div>

      {/* =========================================================================
          4 CLINICAL SECTION GROUP CARDS (2x2 GRID)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
        {CORE_SPECIALTIES.map((spec) => {
          const config = SPECIALTY_CONFIGS[spec];
          const IconComp = config.icon;

          // Compute lists for active period
          const h1List = groupedData.h1Groups[spec] || [];
          const h2List = groupedData.h2Groups[spec] || [];

          // Quota capacities
          const h1Quota = quotas.h1[spec];
          const h2Quota = quotas.h2[spec];

          return (
            <div
              key={spec}
              className={`bg-white rounded-xl border ${config.borderClass} shadow-xs overflow-hidden flex flex-col justify-between print:border-slate-300 print:break-inside-avoid`}
            >
              {/* Card Header */}
              <div>
                <div className={`p-4 ${config.headerBg} border-b ${config.borderClass} flex items-center justify-between gap-3`}>
                  <div className="flex items-center space-x-2.5">
                    <div
                      className="w-9 h-9 rounded-lg bg-white shadow-2xs border border-slate-200/80 flex items-center justify-center shrink-0"
                      style={{ color: config.accentColor }}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                          {config.name}
                        </h3>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${config.badgeBg} ${config.badgeText} uppercase`}>
                          {config.code}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {config.groupLabel}
                      </span>
                    </div>
                  </div>

                  {/* Period Dates & Capacity Pill */}
                  <div className="text-right space-y-1">
                    {period === 'H1' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-white text-slate-800 border border-slate-200 font-mono shadow-2xs">
                        {h1List.length} / {h1Quota} Filled
                      </span>
                    )}
                    {period === 'H2' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-white text-slate-800 border border-slate-200 font-mono shadow-2xs">
                        {h2List.length} / {h2Quota} Filled
                      </span>
                    )}
                    {period === 'both' && (
                      <div className="flex items-center gap-1 text-[10px] font-mono font-bold">
                        <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          H1: {h1List.length}/{h1Quota}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          H2: {h2List.length}/{h2Quota}
                        </span>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500 font-mono">
                      {period === 'H1' && `${rotationMilestones.h1.startFormatted} – ${rotationMilestones.h1.endFormatted}`}
                      {period === 'H2' && `${rotationMilestones.h2.startFormatted} – ${rotationMilestones.h2.endFormatted}`}
                      {period === 'both' && `Full Rotation Year`}
                    </div>
                  </div>
                </div>

                {/* Card Body: Doctor List */}
                <div className="p-4 space-y-4">
                  {/* Period H1 List */}
                  {(period === 'H1' || period === 'both') && (
                    <div className="space-y-2">
                      {period === 'both' && (
                        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3B5BDB]" />
                            Section 1 (H1) • Months 1–6
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {rotationMilestones.h1.startFormatted} – {rotationMilestones.h1.endFormatted}
                          </span>
                        </div>
                      )}

                      {h1List.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2 text-center">
                          No doctors placed in this section for H1.
                        </p>
                      ) : (
                        <ul className="divide-y divide-slate-100">
                          {h1List.map((doc) => {
                            const phone = candidatePhoneMap.get(doc.candidateId);
                            const pairedH2 = doc.assignedPair?.h2;

                            return (
                              <li
                                key={`h1-${doc.candidateId}`}
                                className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 rounded px-1.5 transition"
                              >
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  {/* Merit Rank */}
                                  <span className="px-2 py-0.5 rounded bg-[#EEF2FF] text-[#3B5BDB] font-mono font-bold text-xs tabular-nums shrink-0">
                                    #{doc.meritRank}
                                  </span>

                                  {/* Doctor Name & Phone */}
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-slate-900 truncate">
                                      {doc.candidateName}
                                    </h4>
                                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 tabular-nums">
                                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span>{phone || 'No phone recorded'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Paired Other Half Badge */}
                                <div className="shrink-0 text-right">
                                  {pairedH2 && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">
                                        Next:
                                      </span>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                        <span>H2: {pairedH2}</span>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Period H2 List */}
                  {(period === 'H2' || period === 'both') && (
                    <div className="space-y-2">
                      {period === 'both' && (
                        <div className="flex items-center justify-between pb-1 pt-2 border-b border-slate-100">
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                            Section 2 (H2) • Months 7–12
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {rotationMilestones.h2.startFormatted} – {rotationMilestones.h2.endFormatted}
                          </span>
                        </div>
                      )}

                      {h2List.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2 text-center">
                          No doctors placed in this section for H2.
                        </p>
                      ) : (
                        <ul className="divide-y divide-slate-100">
                          {h2List.map((doc) => {
                            const phone = candidatePhoneMap.get(doc.candidateId);
                            const pairedH1 = doc.assignedPair?.h1;

                            return (
                              <li
                                key={`h2-${doc.candidateId}`}
                                className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 rounded px-1.5 transition"
                              >
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  {/* Merit Rank */}
                                  <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-mono font-bold text-xs tabular-nums shrink-0">
                                    #{doc.meritRank}
                                  </span>

                                  {/* Doctor Name & Phone */}
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-slate-900 truncate">
                                      {doc.candidateName}
                                    </h4>
                                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 tabular-nums">
                                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span>{phone || 'No phone recorded'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Paired Other Half Badge */}
                                <div className="shrink-0 text-right">
                                  {pairedH1 && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">
                                        Prior:
                                      </span>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                        <span>H1: {pairedH1}</span>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-medium">
                  {period === 'H1' && `Total Assigned (H1): ${h1List.length}`}
                  {period === 'H2' && `Total Assigned (H2): ${h2List.length}`}
                  {period === 'both' && `Total H1 + H2: ${h1List.length + h2List.length} Placements`}
                </span>
                <span className="font-mono text-slate-400 text-[10px]">
                  AMH Kalmunai • Clinical Ward
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
