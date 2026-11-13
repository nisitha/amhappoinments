'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { SpecialtyBadge } from '../common/SpecialtyBadge';
import { pairToString } from '@/lib/algorithms';
import {
  ShieldCheck,
  Award,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Eye,
  ArrowRight,
  X,
  Clock
} from 'lucide-react';

export const StudentResultCard: React.FC = () => {
  const {
    currentStudent,
    currentStudentResult,
    claimAlternative
  } = useApp();

  const [showAuditModal, setShowAuditModal] = useState(false);

  if (!currentStudentResult) {
    return (
      <div className="bg-white rounded-2xl shadow-xs p-8 sm:p-10 border border-slate-200 text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] flex items-center justify-center mx-auto">
          <Clock className="w-6 h-6 text-[#F59E0B]" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Allocation Outcome Pending</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Your rotation choices are recorded. Hospital administration will publish the official central merit-order rotation results soon.
        </p>
      </div>
    );
  }

  const isGranted = currentStudentResult.status === 'GRANTED';
  const hasAlternatives = currentStudentResult.status === 'ALTERNATIVES_AVAILABLE';
  const assigned = currentStudentResult.assignedPair;
  const choiceRank = currentStudentResult.choiceRank;

  return (
    <div className="space-y-6">
      {/* =========================================================================
          CASE 1: GRANTED -> Confirmed Card
      ========================================================================= */}
      {isGranted && assigned && (
        <div className="bg-white rounded-2xl shadow-xs p-5 sm:p-6 border border-slate-200 space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                  CONFIRMED ALLOCATION
                </span>
                <span className="text-xs text-slate-400">ERPM Cohort</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                Granted Rotation Posting
              </h3>
            </div>

            <div className="self-start sm:self-auto">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-xs font-bold shadow-2xs">
                <Award className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Awarded Choice #{choiceRank}</span>
              </span>
            </div>
          </div>

          {/* 12-Month Rotation Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Half 1 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  First 6 Months (H1)
                </span>
                <span className="text-[11px] font-mono font-bold text-[#3B5BDB] bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  Month 1–6
                </span>
              </div>

              <div className="py-1">
                <SpecialtyBadge specialty={assigned.h1} size="md" showGroup={false} />
              </div>

              <span className="text-[11px] text-slate-500 block">
                Full-time clinical internship rotation
              </span>
            </div>

            {/* Half 2 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Second 6 Months (H2)
                </span>
                <span className="text-[11px] font-mono font-bold text-[#0284C7] bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  Month 7–12
                </span>
              </div>

              <div className="py-1">
                <SpecialtyBadge specialty={assigned.h2} size="md" showGroup={false} />
              </div>

              <span className="text-[11px] text-slate-500 block">
                Accredited clinical rotation block
              </span>
            </div>
          </div>

          {/* Audit Explanation Bar */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-slate-600">
              <strong className="text-slate-900">Allocation Verdict: </strong>
              <span>{currentStudentResult.summaryExplanation}</span>
            </div>

            <button
              onClick={() => setShowAuditModal(true)}
              className="shrink-0 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-[#3B5BDB] border border-slate-200 font-semibold text-xs transition"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Audit Details</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          CASE 2: ALTERNATIVES_AVAILABLE -> Clean Card with Action Required
      ========================================================================= */}
      {hasAlternatives && (
        <div className="bg-white rounded-2xl shadow-xs p-5 sm:p-6 border border-slate-200 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]">
                  ACTION REQUIRED
                </span>
                <span className="text-xs text-slate-400">Merit Rank #{currentStudent?.meritRank}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                Requested Choices Filled — Claim Available Alternative
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentStudentResult.summaryExplanation}
              </p>
            </div>

            <button
              onClick={() => setShowAuditModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 self-start sm:self-auto transition"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Audit Details</span>
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Available Clinical Rotations ({currentStudentResult.availableAlternatives.length})
              </span>
              <span className="text-[11px] text-[#3B5BDB] font-semibold">
                Tap to claim slot
              </span>
            </div>

            {currentStudentResult.availableAlternatives.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                No remaining feasible alternatives available at this moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentStudentResult.availableAlternatives.map((alt, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (currentStudent) {
                        claimAlternative(currentStudent.id, alt);
                      }
                    }}
                    className="p-3.5 rounded-xl bg-white hover:bg-[#EEF2FF]/40 border border-slate-200 hover:border-[#3B5BDB] cursor-pointer transition flex items-center justify-between group shadow-2xs"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">
                        Alternative #{idx + 1}
                      </span>
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <SpecialtyBadge specialty={alt.h1} size="sm" showGroup={false} />
                        <span className="text-slate-400 font-bold text-xs">→</span>
                        <SpecialtyBadge specialty={alt.h2} size="sm" showGroup={false} />
                      </div>
                    </div>

                    <button className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#3B5BDB] group-hover:bg-[#2B4ACB] text-white text-xs font-semibold transition shadow-xs shrink-0">
                      <span>Claim</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          DOCTOR PERSONAL AUDIT MODAL
      ========================================================================= */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#3B5BDB]" />
                <h3 className="text-base font-bold text-slate-900">Allocation Audit Record</h3>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-500">
              <strong className="text-slate-900">{currentStudent?.name}</strong> • Merit Rank #{currentStudent?.meritRank}
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {currentStudentResult.auditTrail.map((step, idx) => {
                const isAccepted = step.status === 'ACCEPTED';
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs transition ${
                      isAccepted
                        ? 'bg-[#ECFDF5] border-[#A7F3D0]'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">
                        Preference #{step.preferenceRank}: {pairToString(step.testedPair)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isAccepted
                            ? 'bg-white text-[#047857] border border-[#A7F3D0]'
                            : 'bg-white text-[#BE123C] border border-[#FECDD3]'
                        }`}
                      >
                        {isAccepted ? 'GRANTED' : 'UNAVAILABLE'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">{step.reason}</p>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 text-right border-t border-slate-200">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 rounded-lg bg-[#3B5BDB] hover:bg-[#2B4ACB] text-xs font-semibold text-white shadow-xs transition"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
