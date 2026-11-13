'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { SpecialtyBadge } from '../common/SpecialtyBadge';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react';

export const RotationTimelineCard: React.FC = () => {
  const { currentStudent, currentStudentResult, currentStudentMilestones } = useApp();

  const assigned = currentStudentResult?.assignedPair;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 space-y-5">
      {/* Header with Official Appointment Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <span className="text-[11px] font-bold text-[#3B5BDB] uppercase tracking-wider block">
            Official Rotation Schedule
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
            My Rotation Timeline
          </h2>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          <Calendar className="w-4 h-4 text-[#3B5BDB]" />
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-none">
              Appointment Date
            </span>
            <span className="text-xs font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
              {currentStudentMilestones.appointmentFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* 2-Section 12-Month Cards */}
      <div className="space-y-3.5">
        {/* Section 1 (H1) */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 relative transition hover:bg-slate-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-[#3B5BDB] text-white font-black text-xs flex items-center justify-center shadow-xs">
                1
              </span>
              <span className="text-xs font-bold text-slate-900">
                1st 6 Months (Section 1)
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 tabular-nums self-start sm:self-auto">
              {currentStudentMilestones.h1.startFormatted} → {currentStudentMilestones.h1.endFormatted}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            {assigned ? (
              <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                <SpecialtyBadge specialty={assigned.h1} size="md" showGroup={false} />
                <span className="text-xs font-semibold text-[#047857] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-full flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#10B981]" />
                  Confirmed Slot
                </span>
              </div>
            ) : currentStudent?.preferences[0] ? (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 font-medium">Requested 1st Choice:</span>
                <SpecialtyBadge specialty={currentStudent.preferences[0].h1} size="sm" showGroup={false} />
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic">Preferences not submitted</span>
            )}
          </div>
        </div>

        {/* Section 2 (H2) */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 relative transition hover:bg-slate-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-[#0284C7] text-white font-black text-xs flex items-center justify-center shadow-xs">
                2
              </span>
              <span className="text-xs font-bold text-slate-900">
                2nd 6 Months (Section 2)
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 tabular-nums self-start sm:self-auto">
              {currentStudentMilestones.h2.startFormatted} → {currentStudentMilestones.h2.endFormatted}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            {assigned ? (
              <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                <SpecialtyBadge specialty={assigned.h2} size="md" showGroup={false} />
                <span className="text-xs font-semibold text-[#047857] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-full flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#10B981]" />
                  Confirmed Slot
                </span>
              </div>
            ) : currentStudent?.preferences[0] ? (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 font-medium">Requested 1st Choice:</span>
                <SpecialtyBadge specialty={currentStudent.preferences[0].h2} size="sm" showGroup={false} />
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic">Preferences not submitted</span>
            )}
          </div>
        </div>
      </div>

      {/* RHO Subsequent Terms Bar */}
      <div className="p-4 rounded-xl bg-[#EEF2FF]/60 border border-[#C5D2FB] space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900 flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-[#3B5BDB]" />
            <span>Post-Internship RHO Milestone Dates</span>
          </span>
          <span className="text-[10px] text-[#3B5BDB] font-bold uppercase bg-white px-2 py-0.5 rounded-md border border-[#C5D2FB]">
            Year 2 Training
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              RHO Initial 3 Months
            </span>
            <span className="font-bold text-slate-900 font-mono tabular-nums block">
              {currentStudentMilestones.rho3Month.startFormatted} – {currentStudentMilestones.rho3Month.endFormatted}
            </span>
            <span className="text-slate-400 text-[11px] block">
              Eligible uncompleted specialty rotation
            </span>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              RHO Hospital Unit
            </span>
            <span className="font-bold text-slate-900 font-mono tabular-nums block">
              Starts {currentStudentMilestones.rhoUnit.startFormatted}
            </span>
            <span className="text-slate-400 text-[11px] block">
              Unit Consultant Term (Stage 3 Posting)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
