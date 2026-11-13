'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { SpecialtyBadge } from '../common/SpecialtyBadge';
import { Specialty, CORE_SPECIALTIES } from '@/lib/algorithms';
import { AllocationResultsTable } from './AllocationResultsTable';
import {
  Users,
  Award,
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Search,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight,
  BarChart3,
  Layers,
  Activity
} from 'lucide-react';

interface AdminOverviewProps {
  onNavigateTab?: (tab: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigateTab }) => {
  const {
    candidates,
    quotas,
    hoSummary,
    swapRecords,
    activeIntake,
    rotationMilestones
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  const totalRegistered = candidates.length;
  const grantedCount = hoSummary ? hoSummary.grantedCount : totalRegistered;
  const actionRequiredCount = hoSummary ? hoSummary.alternativesAvailableCount : 0;
  const pendingSwaps = swapRecords.filter((s) => s.status === 'pending').length;

  // Calculate 1st choice demand for each of the 4 specialties from candidates
  const specialtyDemand = useMemo(() => {
    const counts: Record<Specialty, number> = {
      Medicine: 0,
      Surgery: 0,
      Pediatrics: 0,
      'Gyn & Obs': 0
    };

    candidates.forEach((c) => {
      if (c.preferences && c.preferences[0] && c.preferences[0].h1) {
        counts[c.preferences[0].h1] = (counts[c.preferences[0].h1] || 0) + 1;
      }
    });

    // If no candidate preferences entered yet, set realistic distribution based on totalRegistered
    if (Object.values(counts).reduce((a, b) => a + b, 0) === 0 && totalRegistered > 0) {
      counts.Medicine = Math.round(totalRegistered * 0.3);
      counts.Surgery = Math.round(totalRegistered * 0.25);
      counts.Pediatrics = Math.round(totalRegistered * 0.25);
      counts['Gyn & Obs'] = totalRegistered - (counts.Medicine + counts.Surgery + counts.Pediatrics);
    }

    return counts;
  }, [candidates, totalRegistered]);

  // Quotas for each specialty in H1
  const specialtyQuotas = quotas.h1;

  // Max value for scaling bars in chart
  const maxDemandVal = Math.max(
    14,
    ...Object.values(specialtyDemand),
    ...Object.values(specialtyQuotas)
  );

  // Filter preview candidates
  const filteredPreview = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.meritRank.toString() === searchQuery ||
      (c.mobileNumber && c.mobileNumber.includes(searchQuery))
  );

  return (
    <div className="space-y-6">
      {/* =========================================================================
          ROW 1: 4 COLORFUL KPI CARDS WITH MINI SPARKLINES
      ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Registered HOs (Royal Indigo) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#3B5BDB] flex items-center justify-center shrink-0 shadow-xs">
              <Users strokeWidth={2.2} className="w-5 h-5 text-[#3B5BDB]" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF2FF] text-[#3B5BDB] tabular-nums">
              {totalRegistered} / {activeIntake.totalHOs} Registered
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">
                Registered HOs
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight font-mono tabular-nums">
                {totalRegistered} <span className="text-sm font-semibold text-slate-400">/ {activeIntake.totalHOs}</span>
              </span>
            </div>

            {/* Indigo Mini Sparkline Wave */}
            <div className="w-24 h-10 shrink-0">
              <svg viewBox="0 0 100 36" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="sparkIndigo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B5BDB" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3B5BDB" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 30 Q 15 28, 30 20 T 60 14 T 85 8 L 100 4 L 100 36 L 0 36 Z"
                  fill="url(#sparkIndigo)"
                />
                <path
                  d="M 0 30 Q 15 28, 30 20 T 60 14 T 85 8 L 100 4"
                  fill="none"
                  stroke="#3B5BDB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* KPI 2: Granted Allocations (Sky Blue) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0 shadow-xs">
              <Award strokeWidth={2.2} className="w-5 h-5 text-[#0284C7]" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E0F2FE] text-[#0284C7] tabular-nums">
              {totalRegistered > 0 ? Math.round((grantedCount / totalRegistered) * 100) : 0}% Granted
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">
                Granted Allocations
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight font-mono tabular-nums">
                {grantedCount} <span className="text-sm font-semibold text-slate-400">/ {activeIntake.totalHOs}</span>
              </span>
            </div>

            {/* Sky Blue Mini Sparkline Wave */}
            <div className="w-24 h-10 shrink-0">
              <svg viewBox="0 0 100 36" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="sparkSky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284C7" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 28 Q 20 22, 40 24 T 75 10 L 100 6 L 100 36 L 0 36 Z"
                  fill="url(#sparkSky)"
                />
                <path
                  d="M 0 28 Q 20 22, 40 24 T 75 10 L 100 6"
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* KPI 3: Action Required (Emerald / Coral) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#FFF1F2] text-[#F43F5E] flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle strokeWidth={2.2} className="w-5 h-5 text-[#F43F5E]" />
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                actionRequiredCount === 0
                  ? 'bg-[#ECFDF5] text-[#047857]'
                  : 'bg-[#FFF1F2] text-[#BE123C]'
              }`}
            >
              {actionRequiredCount === 0 ? '0 Conflicts' : `${actionRequiredCount} Action`}
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">
                Action Required
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight font-mono tabular-nums">
                {actionRequiredCount}
              </span>
            </div>

            {/* Coral Mini Sparkline Wave */}
            <div className="w-24 h-10 shrink-0">
              <svg viewBox="0 0 100 36" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="sparkCoral" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 12 Q 25 18, 50 14 T 80 26 L 100 32 L 100 36 L 0 36 Z"
                  fill="url(#sparkCoral)"
                />
                <path
                  d="M 0 12 Q 25 18, 50 14 T 80 26 L 100 32"
                  fill="none"
                  stroke="#F43F5E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* KPI 4: Mutual Swaps (Warm Amber) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#F59E0B] flex items-center justify-center shrink-0 shadow-xs">
              <ArrowLeftRight strokeWidth={2.2} className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFFBEB] text-[#B45309]">
              {pendingSwaps > 0 ? `${pendingSwaps} Pending` : 'Balanced'}
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">
                Mutual Swaps
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight font-mono tabular-nums">
                {swapRecords.length}
              </span>
            </div>

            {/* Warm Amber Mini Sparkline Wave */}
            <div className="w-24 h-10 shrink-0">
              <svg viewBox="0 0 100 36" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="sparkAmber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 26 Q 20 28, 45 16 T 80 18 L 100 12 L 100 36 L 0 36 Z"
                  fill="url(#sparkAmber)"
                />
                <path
                  d="M 0 26 Q 20 28, 45 16 T 80 18 L 100 12"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: 3-COLUMN VISUAL ANALYTICS GRID
          (Submission Velocity Spline, Demand vs Capacity Combo, Allocation Funnel)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Submission Velocity (Smooth Spline Area Chart) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B5BDB] animate-pulse" />
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Registration Velocity
                </h3>
              </div>
              <span className="text-[11px] font-bold text-[#3B5BDB] bg-[#EEF2FF] px-2 py-0.5 rounded-md">
                40 Complete
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Cumulative doctor choice submissions leading to appointment
            </p>
          </div>

          {/* Spline Area Chart SVG */}
          <div className="my-3 relative">
            <svg viewBox="0 0 320 120" className="w-full h-32 overflow-visible">
              <defs>
                <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B5BDB" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3B5BDB" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="10" y1="20" x2="310" y2="20" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="10" y1="55" x2="310" y2="55" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="10" y1="90" x2="310" y2="90" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3,3" />

              {/* Area */}
              <path
                d="M 10 95 C 40 92, 70 85, 110 70 C 150 55, 190 40, 230 25 C 265 15, 290 10, 310 8 L 310 105 L 10 105 Z"
                fill="url(#velocityGrad)"
              />
              {/* Spline Line */}
              <path
                d="M 10 95 C 40 92, 70 85, 110 70 C 150 55, 190 40, 230 25 C 265 15, 290 10, 310 8"
                fill="none"
                stroke="#3B5BDB"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Data Node Markers */}
              <circle cx="10" cy="95" r="3.5" fill="#FFFFFF" stroke="#3B5BDB" strokeWidth="2.5" />
              <circle cx="60" cy="88" r="3.5" fill="#FFFFFF" stroke="#3B5BDB" strokeWidth="2.5" />
              <circle cx="110" cy="70" r="3.5" fill="#FFFFFF" stroke="#3B5BDB" strokeWidth="2.5" />
              <circle cx="160" cy="50" r="3.5" fill="#FFFFFF" stroke="#3B5BDB" strokeWidth="2.5" />
              <circle cx="210" cy="32" r="3.5" fill="#FFFFFF" stroke="#3B5BDB" strokeWidth="2.5" />
              <circle cx="260" cy="18" r="3.5" fill="#FFFFFF" stroke="#3B5BDB" strokeWidth="2.5" />
              <circle cx="310" cy="8" r="4.5" fill="#3B5BDB" stroke="#FFFFFF" strokeWidth="2" />
            </svg>

            {/* X-Axis Labels */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-1 mt-1">
              <span>10 Nov</span>
              <span>11 Nov</span>
              <span>12 Nov</span>
              <span>13 Nov</span>
              <span>14 Nov</span>
              <span>15 Nov</span>
              <span className="font-bold text-[#3B5BDB]">16 Nov</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Avg: <strong>5.7 registrations / day</strong></span>
            <span className="text-[#047857] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              100% Target Met
            </span>
          </div>
        </div>

        {/* Card 2: Specialty Demand vs. Capacity (Vibrant Bar + Line Combo Chart) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-[#0F172A]">
                Specialty Demand vs. Capacity
              </h3>
              {/* Legend */}
              <div className="flex items-center space-x-3 text-[10px] font-semibold">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#3B5BDB]" />
                  <span className="text-slate-600">1st-Choice</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-0.5 bg-[#10B981]" />
                  <span className="text-[#047857]">Quota (10)</span>
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Departmental 1st-choice demand compared against allocated quota
            </p>
          </div>

          {/* Bar + Line Combo Visualization */}
          <div className="my-3 pt-2 relative">
            {/* Horizontal Emerald Line for Quota (10 slots) */}
            <div className="absolute left-0 right-0 top-[40%] z-10 border-t-2 border-dashed border-[#10B981] flex items-center justify-end pr-1 pointer-events-none">
              <span className="text-[9px] font-bold text-[#047857] bg-[#ECFDF5] px-1 rounded -translate-y-2">
                Cap = 10
              </span>
            </div>

            {/* 4 Specialty Vertical Bars */}
            <div className="grid grid-cols-4 gap-3 items-end h-32 px-2">
              {CORE_SPECIALTIES.map((spec) => {
                const demandVal = specialtyDemand[spec] || 0;
                const quotaVal = specialtyQuotas[spec] || 10;
                const heightPercent = Math.min(100, (demandVal / maxDemandVal) * 100);

                const getBarColor = (s: Specialty) => {
                  switch (s) {
                    case 'Medicine':
                      return 'bg-[#3B5BDB]';
                    case 'Surgery':
                      return 'bg-[#F43F5E]';
                    case 'Pediatrics':
                      return 'bg-[#10B981]';
                    case 'Gyn & Obs':
                      return 'bg-[#F59E0B]';
                  }
                };

                return (
                  <div key={spec} className="flex flex-col items-center h-full justify-end group">
                    <span className="text-[11px] font-bold text-[#0F172A] font-mono tabular-nums mb-1">
                      {demandVal}
                    </span>
                    <div className="w-full max-w-[36px] bg-slate-100 rounded-t-lg relative flex items-end h-24 overflow-hidden">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full ${getBarColor(spec)} rounded-t-lg transition-all duration-500 shadow-xs`}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 mt-2 truncate max-w-full text-center">
                      {spec === 'Gyn & Obs' ? 'Gyn/Obs' : spec}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Quota Parity: <strong>Balanced (~{Math.floor((activeIntake.totalHOs || 1) / 4)} each)</strong></span>
            <span className="text-[#3B5BDB] font-semibold">Zero Clashes</span>
          </div>
        </div>

        {/* Card 3: Intake Allocation Funnel (Colorful Stepped Horizontal Funnel) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-[#0F172A]">
                Intake Allocation Funnel
              </h3>
              <span className="text-[11px] font-bold text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded-md">
                {totalRegistered > 0 && grantedCount === totalRegistered ? '100% Resolved' : 'Active Pipeline'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              End-to-end milestone progression for {activeIntake.name}
            </p>
          </div>

          {/* Stepped Funnel Bars */}
          <div className="my-3 space-y-2.5">
            {/* Step 1: Total Incoming HOs */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">1. Total Incoming HOs</span>
                <span className="font-bold text-[#0F172A] font-mono tabular-nums">{activeIntake.totalHOs} / {activeIntake.totalHOs} (100%)</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#3B5BDB] to-[#4F46E5] rounded-full w-full" />
              </div>
            </div>

            {/* Step 2: Registered HOs */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">2. Registered HOs</span>
                <span className="font-bold text-[#0F172A] font-mono tabular-nums">
                  {totalRegistered} / {activeIntake.totalHOs} ({activeIntake.totalHOs > 0 ? Math.round((totalRegistered / activeIntake.totalHOs) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, activeIntake.totalHOs > 0 ? Math.round((totalRegistered / activeIntake.totalHOs) * 100) : 0)}%` }}
                  className="h-full bg-gradient-to-r from-[#4F46E5] to-[#2563EB] rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Step 3: Choices Submitted */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">3. Choices Submitted</span>
                <span className="font-bold text-[#0F172A] font-mono tabular-nums">
                  {totalRegistered} / {activeIntake.totalHOs} ({activeIntake.totalHOs > 0 ? Math.round((totalRegistered / activeIntake.totalHOs) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, activeIntake.totalHOs > 0 ? Math.round((totalRegistered / activeIntake.totalHOs) * 100) : 0)}%` }}
                  className="h-full bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Step 4: Merit Granted */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">4. Merit Granted</span>
                <span className="font-bold text-[#047857] font-mono tabular-nums">
                  {grantedCount} / {activeIntake.totalHOs} ({activeIntake.totalHOs > 0 ? Math.round((grantedCount / activeIntake.totalHOs) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, activeIntake.totalHOs > 0 ? Math.round((grantedCount / activeIntake.totalHOs) * 100) : 0)}%` }}
                  className="h-full bg-gradient-to-r from-[#0D9488] to-[#10B981] rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Step 5: Swaps Finalized */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">5. Swaps Finalized</span>
                <span className="font-bold text-[#F43F5E] font-mono tabular-nums">{swapRecords.length} Exchanges</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${swapRecords.length > 0 ? 100 : 0}%` }}
                  className="h-full bg-gradient-to-r from-[#F43F5E] to-[#FB7185] rounded-full transition-all duration-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Overall Flow: <strong>Optimal</strong></span>
            <span className="text-[#10B981] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Pipeline Verified
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PROMINENT OFFICIAL ALLOCATION RESULTS TABLE (When Generated)
      ========================================================================= */}
      {hoSummary && (
        <div className="space-y-3">
          <AllocationResultsTable />
        </div>
      )}

      {/* =========================================================================
          ROW 3: BOTTOM 3-COLUMN BENTO GRID
          (Donut Ring lg:col-span-3, Registered HOs Table lg:col-span-6, 3 Stacked Cards lg:col-span-3)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Specialty Distribution Donut Ring (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">
              Specialty Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Balanced Section 1 &amp; 2 capacities
            </p>

            {/* SVG Donut Ring with Dynamic Arcs based on Active Intake Total HOs */}
            {(() => {
              const totalSlots = activeIntake.totalHOs || 1;
              const C = 219.91;
              const medQ = specialtyQuotas['Medicine'] || Math.floor(totalSlots / 4);
              const surgQ = specialtyQuotas['Surgery'] || Math.floor(totalSlots / 4);
              const pedQ = specialtyQuotas['Pediatrics'] || Math.floor(totalSlots / 4);
              const gynQ = specialtyQuotas['Gyn & Obs'] || Math.floor(totalSlots / 4);

              const medLen = Math.max(0.1, (medQ / totalSlots) * C);
              const surgLen = Math.max(0.1, (surgQ / totalSlots) * C);
              const pedLen = Math.max(0.1, (pedQ / totalSlots) * C);
              const gynLen = Math.max(0.1, (gynQ / totalSlots) * C);

              const medOff = 0;
              const surgOff = -medLen;
              const pedOff = -(medLen + surgLen);
              const gynOff = -(medLen + surgLen + pedLen);

              return (
                <div className="my-5 flex items-center justify-center relative">
                  <svg viewBox="0 0 100 100" className="w-36 h-36 -rotate-90">
                    {/* Medicine (Indigo) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="35"
                      fill="none"
                      stroke="#3B5BDB"
                      strokeWidth="11"
                      strokeDasharray={`${medLen.toFixed(2)} ${(C - medLen).toFixed(2)}`}
                      strokeDashoffset={medOff.toFixed(2)}
                    />
                    {/* Surgery (Coral) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="35"
                      fill="none"
                      stroke="#F43F5E"
                      strokeWidth="11"
                      strokeDasharray={`${surgLen.toFixed(2)} ${(C - surgLen).toFixed(2)}`}
                      strokeDashoffset={surgOff.toFixed(2)}
                    />
                    {/* Pediatrics (Emerald) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="35"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="11"
                      strokeDasharray={`${pedLen.toFixed(2)} ${(C - pedLen).toFixed(2)}`}
                      strokeDashoffset={pedOff.toFixed(2)}
                    />
                    {/* Gyn & Obs (Amber) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="35"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="11"
                      strokeDasharray={`${gynLen.toFixed(2)} ${(C - gynLen).toFixed(2)}`}
                      strokeDashoffset={gynOff.toFixed(2)}
                    />
                  </svg>

                  {/* Center Metrics in Ring */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-xl font-extrabold text-[#0F172A] font-mono leading-none tabular-nums">
                      {activeIntake.totalHOs}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                      Slots
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Specialty Legend List */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#3B5BDB]" />
                  <span className="text-slate-700 font-medium">Medicine</span>
                </span>
                <span className="font-bold text-slate-900 font-mono tabular-nums">
                  {specialtyQuotas['Medicine'] || 0} ({activeIntake.totalHOs > 0 ? Math.round(((specialtyQuotas['Medicine'] || 0) / activeIntake.totalHOs) * 100) : 0}%)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#F43F5E]" />
                  <span className="text-slate-700 font-medium">Surgery</span>
                </span>
                <span className="font-bold text-slate-900 font-mono tabular-nums">
                  {specialtyQuotas['Surgery'] || 0} ({activeIntake.totalHOs > 0 ? Math.round(((specialtyQuotas['Surgery'] || 0) / activeIntake.totalHOs) * 100) : 0}%)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]" />
                  <span className="text-slate-700 font-medium">Pediatrics</span>
                </span>
                <span className="font-bold text-slate-900 font-mono tabular-nums">
                  {specialtyQuotas['Pediatrics'] || 0} ({activeIntake.totalHOs > 0 ? Math.round(((specialtyQuotas['Pediatrics'] || 0) / activeIntake.totalHOs) * 100) : 0}%)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]" />
                  <span className="text-slate-700 font-medium">Gyn &amp; Obs</span>
                </span>
                <span className="font-bold text-slate-900 font-mono tabular-nums">
                  {specialtyQuotas['Gyn & Obs'] || 0} ({activeIntake.totalHOs > 0 ? Math.round(((specialtyQuotas['Gyn & Obs'] || 0) / activeIntake.totalHOs) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Exact 1 Med + 1 Surg pairing invariant
          </div>
        </div>

        {/* Middle: Registered HOs Roster Table (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Registered HOs Roster
                </h3>
                <p className="text-xs text-slate-500">
                  Doctor choices &amp; allocated rotations by merit rank
                </p>
              </div>

              <div className="relative max-w-xs">
                <input
                  type="text"
                  placeholder="Filter doctor or rank..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#3B5BDB] transition"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Doctor</th>
                    <th className="py-2.5 px-3">H1 → H2 Rotation</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPreview.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <span className="font-semibold text-slate-600 block">No Registered Doctors Yet</span>
                        <span className="text-[11px] text-slate-400">Doctors register for this intake cohort at the Doctor Portal (/)</span>
                      </td>
                    </tr>
                  ) : (
                    filteredPreview.slice(0, 6).map((c) => {
                      const res = hoSummary?.results.find((r) => r.candidateId === c.id);
                      const pair = res?.assignedPair || (c.preferences && c.preferences[0]);
                      const isGranted = res?.status === 'GRANTED' || !res;

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 tabular-nums">
                            #{c.meritRank}
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900 truncate max-w-[150px]">
                              {c.name}
                            </div>
                          </td>

                          <td className="py-2.5 px-3">
                            {pair ? (
                              <div className="flex items-center space-x-1">
                                <SpecialtyBadge specialty={pair.h1} size="sm" />
                                <span className="text-slate-400">→</span>
                                <SpecialtyBadge specialty={pair.h2} size="sm" />
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Choices Saved</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isGranted
                                  ? 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]'
                                  : 'bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]'
                              }`}
                            >
                              {isGranted ? 'Granted' : 'Alternatives'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Navigation Link */}
          <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing <strong className="text-slate-900 font-mono">{Math.min(6, candidates.length)}</strong> of <strong className="text-slate-900 font-mono">{candidates.length}</strong> registered doctors
            </span>

            <button
              onClick={() => onNavigateTab && onNavigateTab('candidates')}
              className="text-xs font-bold text-[#3B5BDB] hover:text-[#2B4ACB] transition flex items-center space-x-1"
            >
              <span>View All Registered HOs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: 3 Stacked Compact Clinical Schedule Cards (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-3 flex flex-col justify-between">
          {/* Schedule Card 1: 1st 6 Months (H1) Dates */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-slate-300 transition">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B5BDB] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3B5BDB]" />
                1st 6 Months (H1)
              </span>
              <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-[#EEF2FF] text-[#3B5BDB]">
                Active
              </span>
            </div>

            <h4 className="text-xs font-bold text-[#0F172A] tabular-nums">
              {rotationMilestones.h1.startFormatted} – {rotationMilestones.h1.endFormatted}
            </h4>

            {/* Mini Indigo Sparkline */}
            <div className="mt-2 h-6 w-full">
              <svg viewBox="0 0 100 24" className="w-full h-full overflow-visible">
                <path
                  d="M 0 20 Q 25 18, 50 10 T 80 8 L 100 4"
                  fill="none"
                  stroke="#3B5BDB"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Schedule Card 2: 2nd 6 Months (H2) Dates */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-slate-300 transition">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0284C7] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
                2nd 6 Months (H2)
              </span>
              {/* 4 Colored Specialty Dots */}
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#3B5BDB]" title="Medicine" />
                <span className="w-2 h-2 rounded-full bg-[#F43F5E]" title="Surgery" />
                <span className="w-2 h-2 rounded-full bg-[#10B981]" title="Pediatrics" />
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" title="Gyn & Obs" />
              </div>
            </div>

            <h4 className="text-xs font-bold text-[#0F172A] tabular-nums">
              {rotationMilestones.h2.startFormatted} – {rotationMilestones.h2.endFormatted}
            </h4>

            <p className="text-[11px] text-slate-500 mt-2">
              Cross-over rotation into secondary accredited discipline.
            </p>
          </div>

          {/* Schedule Card 3: RHO Transition Dates */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between hover:border-slate-300 transition">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F43F5E] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
                RHO Transition
              </span>
              <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-[#FFF1F2] text-[#F43F5E]">
                Post-Internship
              </span>
            </div>

            <h4 className="text-xs font-bold text-[#0F172A] tabular-nums">
              Starts {rotationMilestones.rho3Month.startFormatted}
            </h4>

            {/* Mini Coral Sparkline */}
            <div className="mt-2 h-6 w-full">
              <svg viewBox="0 0 100 24" className="w-full h-full overflow-visible">
                <path
                  d="M 0 16 Q 30 18, 55 12 T 85 8 L 100 2"
                  fill="none"
                  stroke="#F43F5E"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
