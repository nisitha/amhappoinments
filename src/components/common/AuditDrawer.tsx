import React from 'react';
import { HOAllocationResult, pairToString } from '@/lib/algorithms';
import { SpecialtyBadge } from './SpecialtyBadge';
import { X, Award } from 'lucide-react';

interface AuditDrawerProps {
  candidate: HOAllocationResult | null;
  onClose: () => void;
}

export const AuditDrawer: React.FC<AuditDrawerProps> = ({ candidate, onClose }) => {
  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity">
      <div className="relative w-full max-w-xl h-full bg-white p-6 sm:p-8 overflow-y-auto shadow-xl flex flex-col justify-between border-l border-slate-200">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 tabular-nums">
                  Merit Rank #{candidate.meritRank}
                </span>
                <h2 className="text-lg font-bold text-slate-900">{candidate.candidateName}</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Official ERPM Merit Decision &amp; Feasibility Audit Record
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Assigned Result Highlight */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Allocated 12-Month Rotation
              </span>
              {candidate.choiceRank && (
                <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <Award className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Awarded Choice #{candidate.choiceRank}
                </span>
              )}
            </div>

            {candidate.assignedPair ? (
              <div className="flex items-center space-x-3 mt-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-medium mb-1">Section 1 (H1)</span>
                  <SpecialtyBadge specialty={candidate.assignedPair.h1} size="md" showGroup={true} />
                </div>
                <span className="text-slate-400 font-bold text-base mt-3">→</span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-medium mb-1">Section 2 (H2)</span>
                  <SpecialtyBadge specialty={candidate.assignedPair.h2} size="md" showGroup={true} />
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                Requested choices filled — Available alternatives offered.
              </div>
            )}
          </div>

          {/* Summary Explanation */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-900 block mb-1">Audit Summary:</span>
            <p className="text-xs text-slate-500 leading-relaxed">
              {candidate.summaryExplanation}
            </p>
          </div>

          {/* Sequential Decision Steps */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
              Step-by-Step Merit Allocation Log
            </h3>
            <div className="space-y-2">
              {candidate.auditTrail.map((entry, idx) => {
                const isAccepted = entry.status === 'ACCEPTED';
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs transition ${
                      isAccepted
                        ? 'bg-emerald-50/60 border-emerald-200 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900">
                          Choice #{entry.preferenceRank}:
                        </span>
                        <span className="font-medium text-slate-700">
                          {pairToString(entry.testedPair)}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isAccepted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isAccepted ? 'GRANTED' : 'REJECTED'}
                      </span>
                    </div>
                    <p className="text-[11px] mt-1 text-slate-500">
                      {entry.reason}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
          >
            Close Audit View
          </button>
        </div>
      </div>
    </div>
  );
};
