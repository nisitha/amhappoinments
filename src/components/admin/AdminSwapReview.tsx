'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { pairToString } from '@/lib/algorithms';
import {
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';

export const AdminSwapReview: React.FC = () => {
  const { swapRecords, respondToSwap, activeIntake } = useApp();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filteredSwaps = swapRecords.filter((s) => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  const pendingCount = swapRecords.filter((s) => s.status === 'pending').length;
  const approvedCount = swapRecords.filter((s) => s.status === 'approved').length;

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              Peer Exchanges
            </span>
            <span className="text-xs text-slate-500 font-medium">{activeIntake.name}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1.5">
            Mutual Swap Requests &amp; Approvals
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Inspect and review mutual rotation exchanges submitted by doctors. All proposals have been verified against accredited Medical and Surgical rotation pairing rules.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All ({swapRecords.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center space-x-1 ${
              filter === 'pending'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Pending</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 tabular-nums">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              filter === 'approved'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Approved ({approvedCount})
          </button>
        </div>
      </div>

      {/* Swap List */}
      {filteredSwaps.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs space-y-2">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 mx-auto">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Mutual Swap Proposals</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No rotation exchange proposals matching this filter have been submitted for {activeIntake.name}. Doctors can initiate mutual swaps from their mobile portal.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSwaps.map((swap) => {
            const isPending = swap.status === 'pending';
            const isApproved = swap.status === 'approved';
            const isRejected = swap.status === 'rejected';

            return (
              <div
                key={swap.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 transition hover:border-slate-300"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                      {swap.type === 'full' ? 'Full-Year Swap' : swap.type === 'h1_only' ? 'Section 1 Only' : 'Section 2 Only'}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center space-x-1 tabular-nums">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{swap.createdAt}</span>
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                      isApproved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isRejected
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                    {isRejected && <XCircle className="w-3 h-3 text-rose-600" />}
                    {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                    <span className="capitalize">{swap.status}</span>
                  </span>
                </div>

                {/* Candidate Comparison Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Doctor A */}
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-md bg-slate-900 text-teal-400 font-bold text-xs flex items-center justify-center">
                          A
                        </span>
                        <div>
                          <span className="text-xs font-semibold text-slate-900 block">{swap.studentA.name}</span>
                          <span className="text-[10px] text-slate-500 tabular-nums">Rank #{swap.studentA.meritRank}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">Proposer</span>
                    </div>

                    <div className="pt-1 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Current:</span>
                        <span className="font-medium text-slate-700">{pairToString(swap.studentA.currentPair)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-teal-700 font-semibold">Proposed:</span>
                        <span className="font-semibold text-teal-800">{pairToString(swap.proposedANewPair)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Doctor B */}
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center">
                          B
                        </span>
                        <div>
                          <span className="text-xs font-semibold text-slate-900 block">{swap.studentB.name}</span>
                          <span className="text-[10px] text-slate-500 tabular-nums">Rank #{swap.studentB.meritRank}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">Recipient</span>
                    </div>

                    <div className="pt-1 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Current:</span>
                        <span className="font-medium text-slate-700">{pairToString(swap.studentB.currentPair)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-teal-700 font-semibold">Proposed:</span>
                        <span className="font-semibold text-teal-800">{pairToString(swap.proposedBNewPair)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Validation Note & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
                  <div className="flex items-center space-x-1.5 text-emerald-700 font-medium">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Rotation Rule Verified: 1 Medical + 1 Surgical discipline strictly maintained</span>
                  </div>

                  {isPending && (
                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <button
                        onClick={() => respondToSwap(swap.id, false)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-300 text-rose-700 font-medium transition text-xs shadow-xs"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => respondToSwap(swap.id, true)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#3B5BDB] hover:bg-[#2B4ACB] text-white font-semibold transition text-xs shadow-xs flex items-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span>Approve Exchange</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
