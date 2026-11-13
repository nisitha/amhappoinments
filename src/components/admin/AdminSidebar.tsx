'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard,
  Users,
  Sliders,
  ArrowLeftRight,
  Sparkles,
  FlaskConical,
  Stethoscope,
  LogOut,
  X,
  Calendar,
  Settings2
} from 'lucide-react';

export type AdminNavigationTab =
  | 'overview'
  | 'candidates'
  | 'quotas'
  | 'swaps'
  | 'rho'
  | 'simulator';

interface AdminSidebarProps {
  activeTab: AdminNavigationTab;
  onSelectTab: (tab: AdminNavigationTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
  onOpenIntakeConfig?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  onLogout,
  onOpenIntakeConfig
}) => {
  const { candidates, swapRecords, activeIntake, rotationMilestones, getRegistrationCountdown } = useApp();

  const countdown = getRegistrationCountdown(activeIntake?.registrationClosesAt);

  const pendingSwaps = swapRecords.filter((s) => s.status === 'pending').length;

  const navItems: Array<{
    id: AdminNavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    badge?: string | number | null;
    badgeColor?: string;
  }> = [
    {
      id: 'overview',
      label: 'Overview & Intakes',
      icon: LayoutDashboard
    },
    {
      id: 'candidates',
      label: 'Registered HOs',
      icon: Users,
      badge: candidates.length > 0 ? candidates.length : null,
      badgeColor: 'bg-[#EEF2FF] text-[#3B5BDB]'
    },
    {
      id: 'quotas',
      label: 'Section Quotas',
      icon: Sliders
    },
    {
      id: 'swaps',
      label: 'Mutual Swaps',
      icon: ArrowLeftRight,
      badge: pendingSwaps > 0 ? `${pendingSwaps} pending` : swapRecords.length > 0 ? swapRecords.length : null,
      badgeColor: pendingSwaps > 0 ? 'bg-[#FFFBEB] text-[#F59E0B] border border-[#FDE68A]' : 'bg-[#ECFDF5] text-[#047857]'
    },
    {
      id: 'rho',
      label: 'RHO Rotations',
      icon: Sparkles
    },
    {
      id: 'simulator',
      label: 'Batch Simulator',
      icon: FlaskConical
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0 shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* =========================================================================
            TOP: Brand Header
        ========================================================================= */}
        <div>
          <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              {/* Rounded Royal Indigo Square Icon */}
              <div className="w-9 h-9 rounded-xl bg-[#3B5BDB] text-white flex items-center justify-center shadow-xs shrink-0">
                <Stethoscope strokeWidth={2.2} className="w-5 h-5 text-white" />
              </div>

              <div className="min-w-0 leading-tight">
                <h2 className="text-sm font-bold text-[#0F172A] tracking-tight truncate">
                  AMH Kalmunai
                </h2>
                <p className="text-xs text-[#64748B] font-medium truncate">
                  Rotation Portal
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* =========================================================================
              NAVIGATION ITEMS
          ========================================================================= */}
          <div className="px-3 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-340px)]">
            <span className="px-3 text-[10px] font-bold text-[#8F9BBA] uppercase tracking-wider block mb-2">
              Menu Navigation
            </span>

            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full px-3 py-2.5 rounded-lg flex items-center justify-between text-left transition group ${
                    isActive
                      ? 'border-l-4 border-[#3B5BDB] bg-[#EEF2FF]/60 text-[#3B5BDB] font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`transition shrink-0 ${
                        isActive ? 'text-[#3B5BDB]' : 'text-slate-400 group-hover:text-slate-700'
                      }`}
                    >
                      <IconComponent strokeWidth={isActive ? 2.25 : 1.75} className="w-4 h-4" />
                    </div>

                    <span
                      className={`text-xs block truncate ${
                        isActive ? 'text-[#3B5BDB] font-semibold' : 'text-slate-700 font-medium'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>

                  {/* Right Badge */}
                  {item.badge !== undefined && item.badge !== null && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tabular-nums shrink-0 ml-2 ${
                        item.badgeColor || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            BOTTOM: Gradient Intake Setup Card & Admin Profile Row
        ========================================================================= */}
        <div className="p-3 border-t border-slate-200 bg-white space-y-3">
          {/* Vibrant Royal Indigo-to-Purple Gradient Quick-Action Card */}
          <div className="bg-gradient-to-br from-[#3B5BDB] to-[#5C7CFA] text-white rounded-xl p-3.5 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-white/90" />
                Active Intake
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-white/20 text-white uppercase tracking-wider">
                {activeIntake.status === 'open'
                  ? countdown.isExpired
                    ? 'Locked (48h)'
                    : 'Open'
                  : 'Closed'}
              </span>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white truncate">
                {activeIntake.name}
              </h4>
              <p className="text-[11px] text-white/85 mt-0.5 tabular-nums">
                Starts: {rotationMilestones.appointmentFormatted}
              </p>
            </div>

            <button
              onClick={() => {
                if (onOpenIntakeConfig) {
                  onOpenIntakeConfig();
                } else {
                  onSelectTab('overview');
                }
                onCloseMobile();
              }}
              className="w-full py-1.5 px-3 rounded-lg bg-white text-[#3B5BDB] text-xs font-bold shadow-xs hover:bg-slate-50 transition flex items-center justify-center space-x-1.5"
            >
              <Settings2 className="w-3.5 h-3.5 text-[#3B5BDB]" />
              <span>Configure Intake / Dates</span>
            </button>
          </div>

          {/* Admin Profile Row */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-md bg-[#3B5BDB] text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-xs">
                AMH
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-900 block truncate">
                  AMH Coordinator
                </span>
                <span className="text-[10px] text-emerald-700 font-medium flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Authorized Session</span>
                </span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Lock / Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
