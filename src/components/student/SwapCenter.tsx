'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { SpecialtyBadge } from '../common/SpecialtyBadge';
import { validateMutualSwap, pairToString } from '@/lib/algorithms';
import {
  ArrowLeftRight,
  ShieldAlert,
  CheckCircle2,
  Send,
  Check,
  X
} from 'lucide-react';

export const SwapCenter: React.FC = () => {
  const {
    candidates,
    currentStudent,
    currentStudentResult,
    hoSummary,
    swapRecords,
    submitSwapRequest,
    respondToSwap
  } = useApp();

  const [swapType, setSwapType] = useState<'full' | 'h1_only' | 'h2_only'>('full');
  const [targetStudentId, setTargetStudentId] = useState<string>(() => {
    const other = candidates.find((c) => c.id !== currentStudent?.id);
    return other ? other.id : '';
  });

  const targetCandidate = useMemo(() => {
    return candidates.find((c) => c.id === targetStudentId);
  }, [candidates, targetStudentId]);

  const targetResult = useMemo(() => {
    return hoSummary?.results.find((r) => r.candidateId === targetStudentId);
  }, [hoSummary, targetStudentId]);

  // Live Pre-validation computation
  const livePreValidation = useMemo(() => {
    if (!currentStudentResult?.assignedPair || !targetResult?.assignedPair) {
      return null;
    }

    return validateMutualSwap({
      type: swapType,
      studentA: {
        id: currentStudentResult.candidateId,
        name: currentStudentResult.candidateName,
        currentPair: currentStudentResult.assignedPair
      },
      studentB: {
        id: targetResult.candidateId,
        name: targetResult.candidateName,
        currentPair: targetResult.assignedPair
      }
    });
  }, [currentStudentResult, targetResult, swapType]);

  const handleSendProposal = () => {
    if (!targetStudentId) return;
    submitSwapRequest(swapType, targetStudentId);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl shadow-xs p-5 sm:p-6 border border-slate-200">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#3B5BDB] uppercase tracking-wider mb-1.5">
          <ArrowLeftRight className="w-4 h-4 text-[#3B5BDB]" />
          <span>Post-Allocation Mutual Swap Window</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Peer Rotation Exchange Portal
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Propose full-year or single-section rotation exchanges with colleagues in your intake. The system ensures every doctor completes accredited Medical and Surgical rotations without duplicate terms.
        </p>
      </div>

      {/* Propose a Swap Panel */}
      <div className="bg-white rounded-2xl shadow-xs p-5 sm:p-6 border border-slate-200 space-y-6">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Create New Swap Proposal
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Swap Type */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              Select Swap Scope
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSwapType('full')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  swapType === 'full'
                    ? 'bg-[#EEF2FF] border-[#3B5BDB] text-[#3B5BDB] font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                Full Year
              </button>

              <button
                type="button"
                onClick={() => setSwapType('h1_only')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  swapType === 'h1_only'
                    ? 'bg-[#EEF2FF] border-[#3B5BDB] text-[#3B5BDB] font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                H1 Only
              </button>

              <button
                type="button"
                onClick={() => setSwapType('h2_only')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  swapType === 'h2_only'
                    ? 'bg-[#EEF2FF] border-[#3B5BDB] text-[#3B5BDB] font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                H2 Only
              </button>
            </div>
          </div>

          {/* Target Student */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              Select Target Peer Doctor
            </label>
            <select
              value={targetStudentId}
              onChange={(e) => setTargetStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-[#3B5BDB]"
            >
              {candidates
                .filter((c) => c.id !== currentStudent?.id)
                .map((c) => {
                  const res = hoSummary?.results.find((r) => r.candidateId === c.id);
                  const pairStr = res?.assignedPair ? pairToString(res.assignedPair) : 'Unassigned';
                  return (
                    <option key={c.id} value={c.id}>
                      #{c.meritRank} - {c.name} [{pairStr}]
                    </option>
                  );
                })}
            </select>
          </div>
        </div>

        {/* Comparison Cards: You vs Target (Clean grid-cols-1 md:grid-cols-2 with flex-wrap) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current You */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Your Current Allocation (You)
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900">{currentStudent?.name}</span>
              <span className="font-mono text-[#3B5BDB] text-xs font-bold">
                (Rank #{currentStudent?.meritRank})
              </span>
            </div>
            {currentStudentResult?.assignedPair ? (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <SpecialtyBadge specialty={currentStudentResult.assignedPair.h1} size="sm" showGroup={false} />
                <span className="text-slate-400 text-xs font-bold">→</span>
                <SpecialtyBadge specialty={currentStudentResult.assignedPair.h2} size="sm" showGroup={false} />
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic block pt-1">No active slot assigned</span>
            )}
          </div>

          {/* Current Peer */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Peer Current Allocation
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900">{targetCandidate?.name || 'Selected Peer'}</span>
              {targetCandidate && (
                <span className="font-mono text-[#3B5BDB] text-xs font-bold">
                  (Rank #{targetCandidate.meritRank})
                </span>
              )}
            </div>
            {targetResult?.assignedPair ? (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <SpecialtyBadge specialty={targetResult.assignedPair.h1} size="sm" showGroup={false} />
                <span className="text-slate-400 text-xs font-bold">→</span>
                <SpecialtyBadge specialty={targetResult.assignedPair.h2} size="sm" showGroup={false} />
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic block pt-1">No active slot assigned</span>
            )}
          </div>
        </div>

        {/* Live Pre-validation Outcome Alert */}
        {livePreValidation && (
          <div
            className={`p-4 rounded-xl border transition ${
              livePreValidation.isValid
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-slate-900'
                : 'bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C]'
            }`}
          >
            <div className="flex items-start space-x-3 text-xs">
              {livePreValidation.isValid ? (
                <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-[#F43F5E] shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-bold">
                  {livePreValidation.isValid ? 'Pre-Validation Passed: ' : 'Swap Rule Violation: '}
                </span>
                <span>{livePreValidation.reason}</span>

                {livePreValidation.isValid && livePreValidation.studentANewPair && livePreValidation.studentBNewPair && (
                  <div className="mt-3 pt-3 border-t border-[#A7F3D0] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">Your New Rotation: </span>
                      <strong className="text-slate-900">
                        {pairToString(livePreValidation.studentANewPair)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Peer&apos;s New Rotation: </span>
                      <strong className="text-slate-900">
                        {pairToString(livePreValidation.studentBNewPair)}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Propose Action Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSendProposal}
            disabled={!livePreValidation?.isValid}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-semibold transition shadow-xs ${
              livePreValidation?.isValid
                ? 'bg-[#3B5BDB] hover:bg-[#2B4ACB] text-white shadow-xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Send Mutual Swap Proposal</span>
          </button>
        </div>
      </div>

      {/* Active Swap Proposals Feed */}
      <div className="bg-white rounded-2xl shadow-xs p-5 sm:p-6 border border-slate-200 space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Swap Request Activity ({swapRecords.length})
        </h3>

        {swapRecords.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No active swap proposals recorded for this batch yet.
          </div>
        ) : (
          <div className="space-y-3">
            {swapRecords.map((record) => {
              const isTarget = record.studentB.id === currentStudent?.id;
              const isPending = record.status === 'pending';

              return (
                <div
                  key={record.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 font-mono border border-slate-200">
                        {record.type.toUpperCase()}
                      </span>
                      <span className="font-bold text-slate-900">
                        {record.studentA.name} ↔ {record.studentB.name}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          record.status === 'approved'
                            ? 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]'
                            : record.status === 'rejected'
                            ? 'bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]'
                            : 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]'
                        }`}
                      >
                        {record.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500">{record.auditReason}</p>
                    <span className="text-[10px] text-slate-400 block">{record.createdAt}</span>
                  </div>

                  {/* Actions if pending and user is target */}
                  {isPending && isTarget && (
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => respondToSwap(record.id, true)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#047857] hover:bg-[#065F46] text-white font-semibold transition shadow-xs text-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Swap</span>
                      </button>

                      <button
                        onClick={() => respondToSwap(record.id, false)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-[#BE123C] border border-slate-200 transition text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
