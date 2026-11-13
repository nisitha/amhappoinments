'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { calculateRotationDates } from '@/lib/utils/rotationDates';
import { Calendar, Users, Plus, Check, Clock, ChevronRight } from 'lucide-react';

export const IntakeSetupCard: React.FC = () => {
  const {
    activeIntake,
    updateActiveIntake,
    rotationMilestones,
    createIntake,
    intakes,
    switchIntake,
    toggleIntakeStatus
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);

  // Form state for active intake editing
  const [name, setName] = useState(activeIntake.name);
  const [startDate, setStartDate] = useState(activeIntake.appointmentStartDate);
  const [totalHOs, setTotalHOs] = useState(activeIntake.totalHOs);
  const [status, setStatus] = useState<'open' | 'closed'>(activeIntake.status);

  // Form state for creating new intake
  const [newName, setNewName] = useState('');
  const [newStartDate, setNewStartDate] = useState('2027-05-15');
  const [newTotalHOs, setNewTotalHOs] = useState(40);
  const [newStatus, setNewStatus] = useState<'open' | 'closed'>('open');

  // Instant Live Recalculation bound to startDate input
  const editingMilestones = useMemo(() => {
    return calculateRotationDates(startDate);
  }, [startDate]);

  const handleSaveActive = (e: React.FormEvent) => {
    e.preventDefault();
    updateActiveIntake({
      name: name.trim(),
      appointmentStartDate: startDate,
      totalHOs: Number(totalHOs),
      status
    });
    setIsEditing(false);
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createIntake(newName, newStartDate, Number(newTotalHOs), newStatus);
    setShowNewModal(false);
    setNewName('');
  };

  const isOpen = activeIntake.status === 'open';

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Top Header Row */}
      <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {activeIntake.name}
            </h2>

            {/* Subtle Clinical Status Dot Indicator */}
            {isOpen ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Open for HO Registration</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Registration Closed</span>
              </span>
            )}

            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">
              MOH Sri Lanka • AMH Kalmunai
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Appointment:</span>
              <strong className="text-slate-900 font-semibold tabular-nums">
                {rotationMilestones.appointmentFormatted}
              </strong>
            </span>

            <span>•</span>

            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Total Incoming HOs:</span>
              <strong className="text-slate-900 font-semibold tabular-nums">
                {activeIntake.totalHOs} Doctors
              </strong>
              <span className="text-slate-400">({Math.floor(activeIntake.totalHOs / 4)}/dept)</span>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => toggleIntakeStatus(activeIntake.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isOpen
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}
          >
            {isOpen ? 'Close Registration' : 'Open Registration'}
          </button>

          <button
            onClick={() => {
              setName(activeIntake.name);
              setStartDate(activeIntake.appointmentStartDate);
              setTotalHOs(activeIntake.totalHOs);
              setStatus(activeIntake.status);
              setIsEditing(!isEditing);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition"
          >
            {isEditing ? 'Cancel' : 'Edit Parameters'}
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Intake</span>
          </button>
        </div>
      </div>

      {/* Inline Editing Drawer */}
      {isEditing && (
        <form onSubmit={handleSaveActive} className="p-5 border-t border-slate-200 bg-slate-50/70">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Intake Title
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Appointment Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Total Incoming HOs
              </label>
              <input
                type="number"
                min="4"
                max="200"
                required
                value={totalHOs}
                onChange={(e) => setTotalHOs(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Registration Access
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'open' | 'closed')}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="open">Open for HO Registration</option>
                <option value="closed">Closed / Post-Registration</option>
              </select>
            </div>
          </div>

          {/* Live Milestone Preview in inline drawer */}
          <div className="mb-3 p-3 rounded-lg bg-white border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>Live Milestone Preview</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Appointment: <strong className="text-slate-900">{editingMilestones.appointmentFormatted}</strong>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 block">H1 (1st 6M)</span>
                <span className="font-bold text-slate-900 font-mono block tabular-nums">
                  {editingMilestones.h1.startFormatted} – {editingMilestones.h1.endFormatted}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 block">H2 (2nd 6M)</span>
                <span className="font-bold text-slate-900 font-mono block tabular-nums">
                  {editingMilestones.h2.startFormatted} – {editingMilestones.h2.endFormatted}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 block">RHO 3-Month</span>
                <span className="font-bold text-slate-900 font-mono block tabular-nums">
                  {editingMilestones.rho3Month.startFormatted} – {editingMilestones.rho3Month.endFormatted}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 block">RHO Unit Posting</span>
                <span className="font-bold text-slate-900 font-mono block tabular-nums">
                  Starts {editingMilestones.rhoUnit.startFormatted}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs"
            >
              Save Parameters
            </button>
          </div>
        </form>
      )}

      {/* 4-Column Structured Clinical Timeline Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 border-t border-slate-200 bg-slate-50/40">
        {/* Section 1 */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Section 1 (H1)
            </span>
            <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
              Months 1–6
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-900 tabular-nums mt-0.5">
            {rotationMilestones.h1.startFormatted} → {rotationMilestones.h1.endFormatted}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            1st Mandatory Clinical Discipline
          </p>
        </div>

        {/* Section 2 */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Section 2 (H2)
            </span>
            <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
              Months 7–12
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-900 tabular-nums mt-0.5">
            {rotationMilestones.h2.startFormatted} → {rotationMilestones.h2.endFormatted}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            2nd Mandatory Clinical Discipline
          </p>
        </div>

        {/* RHO 3-Month */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              RHO Initial Term
            </span>
            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
              Months 13–15
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-900 tabular-nums mt-0.5">
            {rotationMilestones.rho3Month.startFormatted} → {rotationMilestones.rho3Month.endFormatted}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Accredited Post-HO 3-Month Term
          </p>
        </div>

        {/* RHO Unit Term */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              RHO Unit Posting
            </span>
            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
              Month 16+
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-900 tabular-nums mt-0.5">
            Starts {rotationMilestones.rhoUnit.startFormatted}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Hospital Unit Placement Term
          </p>
        </div>
      </div>

      {/* Modal for Creating New Intake */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-md w-full border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Create New Appointment Intake
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Add a new incoming cohort for Ashraff Memorial Hospital (AMH), Kalmunai.
            </p>

            <form onSubmit={handleCreateNew} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Intake Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2027 May Intake"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Appointment Start Date
                </label>
                <input
                  type="date"
                  required
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Total Incoming HOs (N)
                </label>
                <input
                  type="number"
                  min="4"
                  max="200"
                  required
                  value={newTotalHOs}
                  onChange={(e) => setNewTotalHOs(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Registration Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as 'open' | 'closed')}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="open">Open Immediately for HO Registration</option>
                  <option value="closed">Keep Closed (Configure First)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs"
                >
                  Create &amp; Switch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
