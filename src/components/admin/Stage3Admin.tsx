'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { SpecialtyBadge } from '../common/SpecialtyBadge';
import { PlayCircle, ExternalLink, Copy, Check } from 'lucide-react';

export const Stage3Admin: React.FC = () => {
  const {
    units,
    consultantPrefs,
    rhoUnitSummary,
    runRHOUnitMatching,
    showToast
  } = useApp();

  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  const handleCopyLink = (pin: string, unitName: string) => {
    if (typeof window === 'undefined') return;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const url = `${window.location.origin}${basePath}/consultant?token=${pin}`;
    navigator.clipboard.writeText(url);
    setCopiedPin(pin);
    showToast(`Copied direct portal link for ${unitName}`);
    setTimeout(() => setCopiedPin(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              Two-Sided Matching
            </span>
            <span className="text-xs text-slate-500">Stage 3 Unit Matching</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1.5">
            Stage 3: RHO Hospital Unit &amp; Consultant Matching
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Matches mutual preferences first. Ties and oversubscribed units are resolved strictly by RHO Official Merit Order.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/consultant"
            target="_blank"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
            title="Open Consultant Portal landing page"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Consultant Portal</span>
          </Link>

          <button
            onClick={runRHOUnitMatching}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#3B5BDB] hover:bg-[#2B4ACB] text-white text-xs font-semibold shadow-xs transition"
          >
            <PlayCircle className="w-3.5 h-3.5 text-white" />
            <span>Execute Unit Matching</span>
          </button>
        </div>
      </div>

      {/* Hospital Units Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Configured Hospital Units &amp; Departmental Access PINs
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Distribute magic PINs or direct URLs to supervising consultants to submit candidate rankings.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {units.map((unit) => {
            return (
              <div
                key={unit.unitId}
                className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <SpecialtyBadge specialty={unit.specialty} size="sm" />
                    <span className="text-[10px] font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      PIN: {unit.magicPin}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900">{unit.unitName}</h4>
                  <p className="text-[11px] text-slate-500">{unit.consultantName}</p>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Capacity:</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {unit.capacity} RHOs
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(unit.magicPin, unit.unitName)}
                      className="flex-1 py-1.5 px-2 rounded-md text-slate-600 hover:text-[#3B5BDB] hover:bg-[#EEF2FF] bg-white border border-slate-200 hover:border-[#C5D2FB] transition flex items-center justify-center gap-1 text-[11px] font-semibold"
                      title={`Copy Direct Access Link: /consultant?token=${unit.magicPin}`}
                    >
                      {copiedPin === unit.magicPin ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <Link
                      href={`/consultant?token=${unit.magicPin}`}
                      target="_blank"
                      className="py-1.5 px-2.5 rounded-md text-[#3B5BDB] hover:text-white bg-[#EEF2FF] hover:bg-[#3B5BDB] border border-[#C5D2FB] hover:border-[#3B5BDB] transition flex items-center justify-center gap-1 text-[11px] font-semibold"
                      title={`Open Consultant Portal for ${unit.unitName}`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Matching Results */}
      {rhoUnitSummary && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Unit Matching Results ({rhoUnitSummary.allocatedCount} Matched)
            </h3>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Stable Matching Satisfied
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Candidate</th>
                  <th className="py-2.5 px-3">Assigned Hospital Unit</th>
                  <th className="py-2.5 px-3">Consultant</th>
                  <th className="py-2.5 px-3">Match Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rhoUnitSummary.results.slice(0, 10).map((r) => (
                  <tr key={r.candidateId} className="hover:bg-slate-50/70 transition">
                    <td className="py-2 px-3 font-mono font-bold text-slate-900 tabular-nums">
                      #{r.meritRank}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {r.candidateName}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900">
                      {r.assignedUnitName}
                    </td>
                    <td className="py-2 px-3 text-slate-500">
                      {r.consultantName || '—'}
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {r.matchType === 'MUTUAL_TOP' ? 'Mutual Top Pick' : 'Merit Filled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
