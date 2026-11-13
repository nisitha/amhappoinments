'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { CandidateReviewTable } from '@/components/admin/CandidateReviewTable';
import { QuotaSetup } from '@/components/admin/QuotaSetup';
import { AllocationRunner } from '@/components/admin/AllocationRunner';
import { SimulatorTab } from '@/components/admin/SimulatorTab';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { AdminSidebar, AdminNavigationTab } from '@/components/admin/AdminSidebar';
import { AdminSwapReview } from '@/components/admin/AdminSwapReview';
import { RhoRotationsAdmin } from '@/components/admin/RhoRotationsAdmin';
import { AMH_HOSPITAL_DETAILS, calculateRotationDates } from '@/lib/utils/rotationDates';
import {
  Lock,
  Unlock,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  Bell,
  Menu,
  ShieldAlert,
  Search,
  Download,
  Calendar,
  X,
  Zap,
  Settings2,
  Plus,
  Trash2,
  AlertTriangle,
  Clock
} from 'lucide-react';

const CONFIGURED_ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || '2026';

type AdminTab = AdminNavigationTab | 'allocator';

export default function AdminPortalPage() {
  const {
    candidates,
    hoSummary,
    runHOAllocation,
    resetAllocations,
    isAllocated,
    showToast,
    toastMessage,
    intakes,
    activeIntakeId,
    activeIntake,
    switchIntake,
    toggleIntakeStatus,
    updateActiveIntake,
    createIntake,
    deleteIntake,
    isLiveSyncing,
    getRegistrationCountdown
  } = useApp();

  const [isAdminAuth, setIsAdminAuth] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [headerSearch, setHeaderSearch] = useState<string>('');
  const [showIntakeConfigModal, setShowIntakeConfigModal] = useState<boolean>(false);
  const [intakeModalMode, setIntakeModalMode] = useState<'edit' | 'new'>('edit');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Form state for Intake Config modal
  const [intakeName, setIntakeName] = useState(activeIntake.name);
  const [intakeDate, setIntakeDate] = useState(activeIntake.appointmentStartDate);
  const [intakeCapacity, setIntakeCapacity] = useState(activeIntake.totalHOs);
  const [intakeStatus, setIntakeStatus] = useState(activeIntake.status);

  // Sync modal state when active intake changes (during render without useEffect cascading renders)
  const [prevSyncedIntakeId, setPrevSyncedIntakeId] = useState(activeIntake.id);
  if (activeIntake.id !== prevSyncedIntakeId) {
    setPrevSyncedIntakeId(activeIntake.id);
    setIntakeName(activeIntake.name);
    setIntakeDate(activeIntake.appointmentStartDate);
    setIntakeCapacity(activeIntake.totalHOs);
    setIntakeStatus(activeIntake.status);
    setIntakeModalMode('edit');
  }

  // Instant Live Date Recalculation bound directly to modal's local intakeDate state
  const modalMilestones = useMemo(() => {
    return calculateRotationDates(intakeDate);
  }, [intakeDate]);

  // Live registration countdown for active intake
  const registrationCountdown = useMemo(() => {
    return getRegistrationCountdown(activeIntake?.registrationClosesAt);
  }, [getRegistrationCountdown, activeIntake?.registrationClosesAt]);

  // Check existing session (asynchronous notification to avoid react-hooks/set-state-in-effect)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('erpm_admin_session');
      if (stored === 'true') {
        requestAnimationFrame(() => setIsAdminAuth(true));
      }
    }
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    if (pinInput.trim() === CONFIGURED_ADMIN_PIN) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('erpm_admin_session', 'true');
      }
      setIsAdminAuth(true);
      showToast('Admin Coordinator session verified.');
    } else {
      setPinError('Access Denied: Invalid Administrative PIN. Please verify your coordinator credentials.');
    }
  };

  const handleAdminLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('erpm_admin_session');
    }
    setIsAdminAuth(false);
    setPinInput('');
    showToast('Admin session locked.');
  };

  // CSV Export utility
  const handleExportCSV = () => {
    const header = 'MeritRank,DoctorName,Section1_H1,Section2_H2,Status,AuditDecision\n';
    let rows = '';

    if (hoSummary && hoSummary.results.length > 0) {
      rows = hoSummary.results
        .map(
          (r) =>
            `${r.meritRank},"${r.candidateName}",${r.assignedPair?.h1 || 'N/A'},${
              r.assignedPair?.h2 || 'N/A'
            },${r.status},"${(r.summaryExplanation || '').replace(/"/g, '""')}"`
        )
        .join('\n');
    } else {
      rows = candidates
        .map(
          (c) =>
            `${c.meritRank},"${c.name}",${c.preferences?.[0]?.h1 || 'N/A'},${
              c.preferences?.[0]?.h2 || 'N/A'
            },Registered,"Choices recorded"`
        )
        .join('\n');
    }

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AMH_Kalmunai_${activeIntake.name.replace(/\s+/g, '_')}_Official.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Official CSV Export downloaded.');
  };

  const handleSaveIntakeConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (intakeModalMode === 'new') {
      const created = createIntake(
        intakeName.trim() || `Intake Starting ${intakeDate}`,
        intakeDate,
        Number(intakeCapacity),
        intakeStatus
      );
      setShowIntakeConfigModal(false);
      showToast(`Created & switched to new intake: "${created.name}" (N = ${intakeCapacity}).`);
    } else {
      updateActiveIntake({
        name: intakeName.trim(),
        appointmentStartDate: intakeDate,
        totalHOs: Number(intakeCapacity),
        status: intakeStatus
      });
      setShowIntakeConfigModal(false);
      showToast('Intake parameters & appointment schedule updated.');
    }
  };

  const handleConfirmDeleteIntake = () => {
    const res = deleteIntake(activeIntake.id);
    setShowDeleteConfirm(false);

    if (res.remainingCount === 0) {
      setIntakeModalMode('new');
      setIntakeName('');
      setIntakeDate('2027-01-15');
      setIntakeCapacity(12);
      setIntakeStatus('open');
      setShowIntakeConfigModal(true);
    } else {
      setShowIntakeConfigModal(false);
    }
  };

  // Case 1: Unauthenticated Admin PIN Gate
  if (!isAdminAuth) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between selection:bg-[#3B5BDB] selection:text-white">
        <main className="flex-1 max-w-md w-full mx-auto px-4 py-16 flex flex-col justify-center">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#3B5BDB] text-white shadow-xs mb-4">
              <Lock strokeWidth={2.2} className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EEF2FF] text-[#3B5BDB] border border-[#C5D2FB]">
                Ashraff Memorial Hospital, Kalmunai
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Hospital Admin Gate
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Ministry of Health — Sri Lanka • House Officer &amp; RHO Rotation Coordinator
            </p>
          </div>

          <div className="rounded-xl bg-white border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <form onSubmit={handleAdminLogin} className="space-y-4">
              {pinError && (
                <div className="p-3 rounded-lg bg-[#FFF1F2] border border-[#FECDD3] flex items-start space-x-2 text-xs text-[#BE123C] font-medium">
                  <ShieldAlert className="w-4 h-4 text-[#F43F5E] shrink-0 mt-0.5" />
                  <span>{pinError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Coordinator Master PIN
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={10}
                    required
                    placeholder="Enter Master PIN"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full text-center text-lg font-mono tracking-widest px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#3B5BDB] font-bold transition"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Default PIN: 2026</span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[#3B5BDB] hover:bg-[#2B4ACB] text-white text-xs font-semibold transition shadow-xs flex items-center justify-center space-x-2"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock Central Dashboard</span>
              </button>
            </form>

            <div className="pt-3 border-t border-slate-200 text-center text-[11px] text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Hospital Administration:</p>
              <p>
                Telephone:{' '}
                <a href="tel:0672229496" className="text-[#3B5BDB] font-semibold hover:underline">
                  067 222 9496
                </a>{' '}
                •{' '}
                <a href="tel:0672222261" className="text-[#3B5BDB] font-semibold hover:underline">
                  067 222 2261
                </a>
              </p>
              <p>
                Email:{' '}
                <a href="mailto:info@amhkalmunai.lk" className="text-[#3B5BDB] hover:underline">
                  info@amhkalmunai.lk
                </a>
              </p>
            </div>
          </div>
        </main>

        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>{AMH_HOSPITAL_DETAILS.name} • {AMH_HOSPITAL_DETAILS.address}</span>
            <span>Ministry of Health — Sri Lanka</span>
          </div>
        </footer>
      </div>
    );
  }

  // Case 2: Authenticated Vibrant Executive Admin Portal
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex selection:bg-[#3B5BDB] selection:text-white">
      {/* =========================================================================
          LEFT SIDEBAR (w-64 bg-white border-r border-slate-200)
      ========================================================================= */}
      <AdminSidebar
        activeTab={activeTab === 'allocator' ? 'overview' : (activeTab as AdminNavigationTab)}
        onSelectTab={(tab) => setActiveTab(tab)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onLogout={handleAdminLogout}
        onOpenIntakeConfig={() => setShowIntakeConfigModal(true)}
      />

      {/* =========================================================================
          MAIN ADMIN WORKSPACE & HEADER
      ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-xs">
          {/* Left: Mobile Trigger + Bold Title + Intake Selector Pill + Registration Status Toggle */}
          <div className="flex items-center space-x-3 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition shrink-0"
              title="Open navigation menu"
              aria-label="Open navigation menu"
            >
              <Menu strokeWidth={2} className="w-4 h-4 text-slate-700" />
            </button>

            {/* Page Title */}
            <h1 className="text-base font-bold text-[#0F172A] hidden sm:block">
              {activeTab === 'overview' && 'Overview'}
              {activeTab === 'candidates' && 'Registered HOs'}
              {activeTab === 'quotas' && 'Section Quotas'}
              {activeTab === 'swaps' && 'Mutual Swaps'}
              {activeTab === 'rho' && 'RHO Rotations'}
              {activeTab === 'allocator' && 'Allocation Audit'}
              {activeTab === 'simulator' && 'Batch Simulator'}
            </h1>

            <span className="text-slate-300 hidden sm:inline">•</span>

            {/* Compact Intake Selector Pill */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 shrink-0">
              <select
                value={activeIntakeId}
                onChange={(e) => switchIntake(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#0F172A] focus:outline-none cursor-pointer pr-1"
              >
                {intakes.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Registration Status Toggle Pill */}
            <button
              onClick={() => toggleIntakeStatus(activeIntakeId)}
              title={`Click to ${activeIntake.status === 'open' ? 'close' : 'open'} candidate registration`}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition shadow-2xs ${
                activeIntake.status === 'open'
                  ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0] hover:bg-[#D1FAE5]'
                  : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] hover:bg-[#FEF3C7]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  activeIntake.status === 'open' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                }`}
              />
              <span className="capitalize">{activeIntake.status === 'open' ? 'Gate Open' : 'Gate Closed'}</span>
            </button>

            {/* Live Auto-Lock Countdown Badge */}
            {activeIntake.status === 'open' && (
              <div
                className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition shadow-2xs ${
                  registrationCountdown.isExpired
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
                title={
                  registrationCountdown.isExpired
                    ? 'Registration has auto-locked because the 48-hour registration window has elapsed.'
                    : `Registration auto-locks at ${
                        activeIntake.registrationClosesAt
                          ? new Date(activeIntake.registrationClosesAt).toLocaleString()
                          : '48h from creation'
                      }`
                }
              >
                {registrationCountdown.isExpired ? (
                  <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                ) : (
                  <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                )}
                <span className="truncate max-w-[200px]">
                  {registrationCountdown.text}
                </span>
              </div>
            )}

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
              <span className="hidden md:inline">{isLiveSyncing ? 'Live Sync' : 'Connecting'}</span>
            </div>
          </div>

          {/* Center/Right: Search + Notification Bell + Export CSV + Primary Royal Indigo Generate */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Search Input */}
            <div className="relative hidden xl:block w-56">
              <input
                type="text"
                placeholder="Search doctor or merit rank..."
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#3B5BDB] transition"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
            </div>

            {/* Notification Bell with Coral Dot */}
            <button
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-900 transition relative"
              title="Notifications"
            >
              <Bell strokeWidth={1.8} className="w-4 h-4 text-slate-500" />
              <span className="w-2 h-2 rounded-full bg-[#F43F5E] absolute top-1.5 right-1.5 ring-2 ring-white" />
            </button>

            {/* Export CSV Secondary Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {/* Primary Royal Indigo Generate Button (#3B5BDB) */}
            <button
              onClick={runHOAllocation}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#3B5BDB] hover:bg-[#2B4ACB] text-white text-xs font-semibold shadow-xs transition"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-white" />
              <span className="hidden sm:inline">Generate Allocations</span>
              <span className="sm:hidden">Generate</span>
            </button>

            {/* Reset Button (If Allocated) */}
            {isAllocated && (
              <button
                onClick={resetAllocations}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-xs transition"
                title="Reset allocations to open choices"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </header>

        {/* Workspace Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'overview' && (
            <AdminOverview
              onNavigateTab={(tab) => {
                if (tab === 'stage2' || tab === 'stage3') {
                  setActiveTab('rho');
                } else if (tab === 'swaps') {
                  setActiveTab('swaps');
                } else if (tab === 'candidates') {
                  setActiveTab('candidates');
                } else if (tab === 'quotas') {
                  setActiveTab('quotas');
                } else {
                  setActiveTab(tab as AdminTab);
                }
              }}
            />
          )}
          {activeTab === 'candidates' && <CandidateReviewTable />}
          {activeTab === 'quotas' && <QuotaSetup />}
          {activeTab === 'swaps' && <AdminSwapReview />}
          {activeTab === 'rho' && <RhoRotationsAdmin />}
          {activeTab === 'allocator' && <AllocationRunner />}
          {activeTab === 'simulator' && <SimulatorTab />}
        </main>

        {/* Clean Hairline Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>{AMH_HOSPITAL_DETAILS.name} • {AMH_HOSPITAL_DETAILS.address}</span>
            <div className="flex items-center space-x-3">
              <span>Admin: <a href="tel:0672229496" className="font-semibold text-slate-900 hover:underline">067 222 9496</a></span>
              <span className="text-slate-300">•</span>
              <span><a href="mailto:info@amhkalmunai.lk" className="text-[#3B5BDB] hover:underline font-medium">info@amhkalmunai.lk</a></span>
            </div>
          </div>
        </footer>
      </div>

      {/* =========================================================================
          INTAKE & APPOINTMENT SETUP MODAL / DRAWER
      ========================================================================= */}
      {showIntakeConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#3B5BDB] flex items-center justify-center">
                  <Settings2 className="w-4 h-4 text-[#3B5BDB]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Configure Active Intake &amp; Dates
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official Appointment Start Date &amp; Clinical Milestones
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIntakeConfigModal(false)}
                className="text-slate-400 hover:text-slate-900 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Mode Switcher: Edit vs New */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setIntakeModalMode('edit');
                  setIntakeName(activeIntake.name);
                  setIntakeDate(activeIntake.appointmentStartDate);
                  setIntakeCapacity(activeIntake.totalHOs);
                  setIntakeStatus(activeIntake.status);
                }}
                className={`py-1.5 px-3 rounded-md transition text-center truncate ${
                  intakeModalMode === 'edit'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Edit Current Intake
              </button>
              <button
                type="button"
                onClick={() => {
                  setIntakeModalMode('new');
                  setIntakeName('');
                  setIntakeDate('2027-01-15');
                  setIntakeCapacity(12);
                  setIntakeStatus('open');
                }}
                className={`py-1.5 px-3 rounded-md transition flex items-center justify-center gap-1.5 ${
                  intakeModalMode === 'new'
                    ? 'bg-[#3B5BDB] text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Intake</span>
              </button>
            </div>

            <form onSubmit={handleSaveIntakeConfig} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Intake Title / Cohort Name
                </label>
                <input
                  type="text"
                  required
                  placeholder={intakeModalMode === 'new' ? 'e.g. 2027 January Intake' : 'Intake Name'}
                  value={intakeName}
                  onChange={(e) => setIntakeName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-[#3B5BDB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5 leading-normal pt-1">
                    Official Appointment Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={intakeDate}
                    onChange={(e) => setIntakeDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono focus:outline-hidden focus:border-[#3B5BDB]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5 leading-normal pt-1">
                    Total Incoming HOs
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    required
                    value={intakeCapacity}
                    onChange={(e) => setIntakeCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-[#3B5BDB]"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Registration Gate Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIntakeStatus('open')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                      intakeStatus === 'open'
                        ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0] shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                    <span>Open (Accepting Registrations)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIntakeStatus('closed')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                      intakeStatus === 'closed'
                        ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                    <span>Closed (Registration Locked)</span>
                  </button>
                </div>
              </div>

              {/* Calculated Rotation Dates Preview (Live Recalculation bound to modalMilestones) */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#3B5BDB]" />
                    <span>Calculated Milestone Schedule (Live Preview)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Starts: <strong className="text-slate-900 tabular-nums">{modalMilestones.appointmentFormatted}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {/* H1 Box */}
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#3B5BDB]" />
                        1st 6 Months (H1)
                      </span>
                      <span className="text-[9px] font-bold text-[#3B5BDB] bg-[#EEF2FF] px-1.5 py-0.2 rounded">Section 1</span>
                    </div>
                    <span className="font-bold text-slate-900 font-mono block tabular-nums">
                      {modalMilestones.h1.startFormatted} – {modalMilestones.h1.endFormatted}
                    </span>
                  </div>

                  {/* H2 Box */}
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
                        2nd 6 Months (H2)
                      </span>
                      <span className="text-[9px] font-bold text-[#0284C7] bg-[#E0F2FE] px-1.5 py-0.2 rounded">Section 2</span>
                    </div>
                    <span className="font-bold text-slate-900 font-mono block tabular-nums">
                      {modalMilestones.h2.startFormatted} – {modalMilestones.h2.endFormatted}
                    </span>
                  </div>

                  {/* RHO Initial 3 Months */}
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                        RHO Initial 3 Months
                      </span>
                      <span className="text-[9px] font-bold text-[#047857] bg-[#ECFDF5] px-1.5 py-0.2 rounded">Stage 2</span>
                    </div>
                    <span className="font-bold text-slate-900 font-mono block tabular-nums">
                      {modalMilestones.rho3Month.startFormatted} – {modalMilestones.rho3Month.endFormatted}
                    </span>
                  </div>

                  {/* RHO Unit Posting */}
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
                        RHO Unit Posting
                      </span>
                      <span className="text-[9px] font-bold text-[#BE123C] bg-[#FFF1F2] px-1.5 py-0.2 rounded">Stage 3</span>
                    </div>
                    <span className="font-bold text-slate-900 font-mono block tabular-nums">
                      Starts {modalMilestones.rhoUnit.startFormatted}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {intakeModalMode === 'edit' ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Intake</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowIntakeConfigModal(false)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#3B5BDB] hover:bg-[#2B4ACB] text-white text-xs font-semibold shadow-xs transition"
                  >
                    {intakeModalMode === 'new' ? '+ Create Intake & Set Quotas' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Intake Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Intake?
                </h3>
                <p className="text-xs text-slate-500">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
              <p className="font-semibold text-rose-950">
                You are about to delete <span className="font-bold underline">{activeIntake.name}</span>.
              </p>
              <div className="space-y-1.5 text-rose-800">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>
                    <strong>{candidates.length}</strong> registered House Officer(s) will be permanently removed.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>All submitted rotation choices, allocations, and mutual swaps will be purged.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>Clinical section quotas and appointment schedule will be deleted.</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteIntake}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete Intake</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-3.5 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold shadow-md animate-bounce border border-slate-800">
          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
