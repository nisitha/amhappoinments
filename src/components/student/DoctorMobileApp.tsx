'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { RotationTimelineCard } from './RotationTimelineCard';
import { StudentResultCard } from './StudentResultCard';
import { TwoTapChoiceRanker } from './TwoTapChoiceRanker';
import { SwapCenter } from './SwapCenter';
import { RhoAndHelpSheet } from './RhoAndHelpSheet';
import {
  LayoutDashboard,
  Sliders,
  ArrowLeftRight,
  Building2,
  LogOut,
  Calendar,
  Award,
  Stethoscope,
  CheckCircle2,
  UserCheck,
  Lock
} from 'lucide-react';

type DoctorTab = 'home' | 'choices' | 'swaps' | 'help';

export const DoctorMobileApp: React.FC = () => {
  const { currentStudent, logoutStudent, activeIntake, currentStudentMilestones, isLiveSyncing } = useApp();
  const [activeTab, setActiveTab] = useState<DoctorTab>('home');

  if (!currentStudent) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between selection:bg-[#3B5BDB] selection:text-white">
      {/* =========================================================================
          1. TOP NAVIGATION HEADER
      ========================================================================= */}

      {/* --- DESKTOP TOP HEADER (hidden on mobile) --- */}
      <header className="hidden md:block sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo & Intake */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0D5C3A] to-[#107C41] flex items-center justify-center text-white font-black text-xs shadow-xs ring-1 ring-emerald-600/30">
              AMH
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                  AMH Kalmunai
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-medium">Rotation Portal</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                  HO
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium block truncate max-w-[200px]">
                {activeIntake.name}
              </span>
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'home'
                  ? 'bg-white text-[#3B5BDB] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Overview &amp; Timeline</span>
            </button>

            <button
              onClick={() => setActiveTab('choices')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'choices'
                  ? 'bg-white text-[#3B5BDB] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Rotation Choices</span>
              {currentStudent.isLocked && (
                <Lock className="w-3 h-3 text-emerald-600 ml-0.5" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('swaps')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'swaps'
                  ? 'bg-white text-[#3B5BDB] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Mutual Swaps</span>
            </button>

            <button
              onClick={() => setActiveTab('help')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'help'
                  ? 'bg-white text-[#3B5BDB] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>RHO &amp; Hospital Info</span>
            </button>
          </nav>

          {/* Right Doctor Identity & Logout */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Live Sync Status Indicator */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition shadow-2xs ${
                isLiveSyncing
                  ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                  : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
              }`}
              title={isLiveSyncing ? 'Realtime database synchronization active' : 'Connecting to database...'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isLiveSyncing ? 'bg-[#10B981] animate-pulse' : 'bg-[#F59E0B]'
                }`}
              />
              <span className="hidden lg:inline">{isLiveSyncing ? 'Live Sync' : 'Connecting'}</span>
            </div>

            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-900">{currentStudent.name}</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-bold text-[#3B5BDB] font-mono">
                Rank #{currentStudent.meritRank}
              </span>
            </div>

            <button
              onClick={logoutStudent}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition flex items-center gap-1.5"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- MOBILE COMPACT TOP HEADER (hidden on desktop) --- */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0D5C3A] to-[#107C41] flex items-center justify-center text-white font-black text-xs shadow-xs">
              AMH
            </div>
            <div>
              <div className="flex items-center space-x-1.5 leading-none">
                <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                  AMH Kalmunai
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                  HO
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[140px] mt-0.5">
                {activeIntake.name}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Mobile Live Sync Pill */}
            <div
              className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                isLiveSyncing
                  ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                  : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
              }`}
              title={isLiveSyncing ? 'Live Sync Active' : 'Connecting...'}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isLiveSyncing ? 'bg-[#10B981] animate-pulse' : 'bg-[#F59E0B]'
                }`}
              />
              <span>Live</span>
            </div>

            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#EEF2FF] border border-[#C5D2FB] text-[#3B5BDB] font-bold text-xs font-mono">
              <Award className="w-3.5 h-3.5 text-[#3B5BDB]" />
              <span>#{currentStudent.meritRank}</span>
            </div>

            <button
              onClick={logoutStudent}
              className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. MAIN CONTENT (FULL-WIDTH CONTAINER ON DESKTOP, STACKED ON MOBILE)
      ========================================================================= */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-8 space-y-6 pb-24 md:pb-8">
        {/* Compact & Clean Doctor Hero Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#3B5BDB] border border-[#C5D2FB]">
                Medical Officer Portal
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {activeIntake.name}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Appointment: <strong className="text-slate-800 font-mono tabular-nums">{currentStudentMilestones.appointmentFormatted}</strong>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {currentStudent.name}
            </h1>

            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
              <span>{currentStudent.mobileNumber ? `Mobile: ${currentStudent.mobileNumber}` : 'SLMC Verified Doctor'}</span>
              <span>•</span>
              <span className="text-[#047857] font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                Ministry of Health Sri Lanka Verified
              </span>
            </div>
          </div>

          {/* Merit Rank Right Pill (Clean & Non-overlapping) */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#3B5BDB] text-white flex items-center justify-center font-bold shadow-xs">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  All-Island Merit Rank
                </span>
                <span className="text-lg font-extrabold text-[#3B5BDB] font-mono leading-none tabular-nums">
                  #{currentStudent.meritRank}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TAB 1: OVERVIEW & TIMELINE (2-Column Desktop Grid) */}
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <RotationTimelineCard />
            </div>
            <div className="lg:col-span-5 space-y-6">
              <StudentResultCard />
            </div>
          </div>
        )}

        {/* TAB 2: ROTATION CHOICES */}
        {activeTab === 'choices' && (
          <div className="space-y-6">
            <TwoTapChoiceRanker />
          </div>
        )}

        {/* TAB 3: MUTUAL SWAPS */}
        {activeTab === 'swaps' && (
          <div className="space-y-6">
            <SwapCenter />
          </div>
        )}

        {/* TAB 4: RHO & HOSPITAL INFO */}
        {activeTab === 'help' && (
          <div className="space-y-6">
            <RhoAndHelpSheet />
          </div>
        )}
      </main>

      {/* =========================================================================
          3. FIXED BOTTOM NAVIGATION BAR ON MOBILE (HIDDEN ON DESKTOP)
      ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 z-50 shadow-[0_-4px_20px_rgba(15,23,42,0.08)]">
        <div className="grid grid-cols-4 gap-1">
          {/* TAB 1: Overview */}
          <button
            onClick={() => setActiveTab('home')}
            className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center transition ${
              activeTab === 'home'
                ? 'text-[#3B5BDB] font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'home' ? 'bg-[#EEF2FF]' : ''}`}>
              <LayoutDashboard strokeWidth={activeTab === 'home' ? 2.25 : 1.75} className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5">Overview</span>
          </button>

          {/* TAB 2: Choices */}
          <button
            onClick={() => setActiveTab('choices')}
            className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center transition ${
              activeTab === 'choices'
                ? 'text-[#3B5BDB] font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg relative ${activeTab === 'choices' ? 'bg-[#EEF2FF]' : ''}`}>
              <Sliders strokeWidth={activeTab === 'choices' ? 2.25 : 1.75} className="w-4 h-4" />
              {currentStudent.isLocked && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -top-0.5 -right-0.5" />
              )}
            </div>
            <span className="text-[10px] mt-0.5">Choices</span>
          </button>

          {/* TAB 3: Swaps */}
          <button
            onClick={() => setActiveTab('swaps')}
            className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center transition ${
              activeTab === 'swaps'
                ? 'text-[#3B5BDB] font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'swaps' ? 'bg-[#EEF2FF]' : ''}`}>
              <ArrowLeftRight strokeWidth={activeTab === 'swaps' ? 2.25 : 1.75} className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5">Swaps</span>
          </button>

          {/* TAB 4: RHO & Info */}
          <button
            onClick={() => setActiveTab('help')}
            className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center transition ${
              activeTab === 'help'
                ? 'text-[#3B5BDB] font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'help' ? 'bg-[#EEF2FF]' : ''}`}>
              <Building2 strokeWidth={activeTab === 'help' ? 2.25 : 1.75} className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5">RHO &amp; Info</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
