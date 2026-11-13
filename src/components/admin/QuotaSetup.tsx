'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { CORE_SPECIALTIES, Specialty, HOQuotas, validateBipartiteQuotas, calculateAutoQuotas } from '@/lib/algorithms';
import { SpecialtyBadge } from '../common/SpecialtyBadge';
import { AlertCircle, CheckCircle2, RotateCcw, Save, Wand2, ShieldCheck } from 'lucide-react';

export const QuotaSetup: React.FC = () => {
  const { quotas, setQuotas, activeIntake, candidates, runHOAllocation, showToast } = useApp();
  const [localQuotas, setLocalQuotas] = useState<HOQuotas>(quotas);
  const [batchSizeInput, setBatchSizeInput] = useState<number>(activeIntake.totalHOs);

  // Sync with intake quotas when active intake or quotas change
  const [prevQuotas, setPrevQuotas] = useState(quotas);
  if (quotas !== prevQuotas) {
    setPrevQuotas(quotas);
    setLocalQuotas(quotas);
    setBatchSizeInput(activeIntake.totalHOs);
  }

  const targetCapacity = activeIntake.totalHOs;
  const totalStudents = targetCapacity;

  const sumH1 = Object.values(localQuotas.h1).reduce((a, b) => a + b, 0);
  const sumH2 = Object.values(localQuotas.h2).reduce((a, b) => a + b, 0);

  const h1GroupA = localQuotas.h1.Medicine + localQuotas.h1.Pediatrics;
  const h2GroupB = localQuotas.h2.Surgery + localQuotas.h2['Gyn & Obs'];
  const h1GroupB = localQuotas.h1.Surgery + localQuotas.h1['Gyn & Obs'];
  const h2GroupA = localQuotas.h2.Medicine + localQuotas.h2.Pediatrics;

  const isBipartite1Balanced = h1GroupA === h2GroupB;
  const isBipartite2Balanced = h1GroupB === h2GroupA;

  const validation = validateBipartiteQuotas(localQuotas, totalStudents);

  const handleUpdate = (half: 'h1' | 'h2', specialty: Specialty, value: number) => {
    const val = Math.max(0, isNaN(value) ? 0 : value);
    setLocalQuotas((prev) => ({
      ...prev,
      [half]: {
        ...prev[half],
        [specialty]: val
      }
    }));
  };

  const handleAutoCalculate = () => {
    const n = Math.max(1, batchSizeInput);
    const auto = calculateAutoQuotas(n);
    setLocalQuotas(auto);
    showToast(`Auto-Calculated balanced quotas for N = ${n} (Base floor(N/4), remainder to Med & Surg).`);
  };

  const handleSaveAndReallocate = () => {
    if (!validation.valid) {
      showToast(`Cannot save: ${validation.error}`);
      return;
    }
    setQuotas(localQuotas);
    runHOAllocation();
    showToast('Quotas updated and allocation re-executed successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card & Auto Calculator */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                Capacity Calculator
              </span>
              <span className="text-xs text-slate-500">Clinical Workload Parity</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1.5">
              Clinical Section Quotas Management
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              Evenly balances clinical slot capacities across all 4 core departments. Ensures Section 1 and Section 2 maintain exact clinical training parity.
            </p>
          </div>

          {/* Quick Auto-Calculator Control */}
          <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 shrink-0">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Intake Cohort (N)</span>
              <input
                type="number"
                min={1}
                value={batchSizeInput}
                onChange={(e) => setBatchSizeInput(parseInt(e.target.value) || 0)}
                className="w-20 px-2 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900 tabular-nums focus:outline-hidden focus:border-teal-600"
              />
            </div>

            <button
              onClick={handleAutoCalculate}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#3B5BDB] hover:bg-[#2B4ACB] text-white text-xs font-semibold shadow-xs transition"
            >
              <Wand2 className="w-3.5 h-3.5 text-white" />
              <span>Balance Quotas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Invariant Check Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Workload Parity Verification
            </h3>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
              validation.valid
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
            }`}
          >
            {validation.valid ? 'Balanced Capacity (Zero Clashes Guaranteed)' : 'Capacity Unbalanced'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-1 font-medium">Total Incoming HOs</span>
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700">Sec 1 &amp; Sec 2 Total</span>
              <span className={`font-mono font-bold tabular-nums ${sumH1 === sumH2 && sumH1 === totalStudents ? 'text-emerald-700' : 'text-rose-600'}`}>
                {sumH1} / {sumH2} (Target {totalStudents})
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-1 font-medium">Medical (Sec 1) to Surgical (Sec 2)</span>
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700">Cross-Section Balance</span>
              <span className={`font-mono font-bold tabular-nums ${isBipartite1Balanced ? 'text-emerald-700' : 'text-rose-600'}`}>
                {h1GroupA} slots == {h2GroupB} slots
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block mb-1 font-medium">Surgical (Sec 1) to Medical (Sec 2)</span>
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700">Cross-Section Balance</span>
              <span className={`font-mono font-bold tabular-nums ${isBipartite2Balanced ? 'text-emerald-700' : 'text-rose-600'}`}>
                {h1GroupB} slots == {h2GroupA} slots
              </span>
            </div>
          </div>
        </div>

        {!validation.valid && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center space-x-2 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{validation.error}</span>
          </div>
        )}
      </div>

      {/* Side-by-Side Quota Editors: H1 vs H2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Month 1 - 6 (H1) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider block">
                Section 1 (Month 1 – 6)
              </span>
              <h3 className="text-sm font-bold text-slate-900">First 6 Months Allocation</h3>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500">Total Sec 1 Slots</span>
              <div className="text-base font-mono font-bold text-slate-900 tabular-nums">{sumH1}</div>
            </div>
          </div>

          <div className="space-y-2">
            {CORE_SPECIALTIES.map((spec) => (
              <div
                key={spec}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200"
              >
                <div className="flex items-center space-x-2">
                  <SpecialtyBadge specialty={spec} size="sm" showGroup={true} />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">Slots:</span>
                  <input
                    type="number"
                    min={0}
                    value={localQuotas.h1[spec]}
                    onChange={(e) => handleUpdate('h1', spec, parseInt(e.target.value))}
                    className="w-16 px-2 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono font-bold text-center text-slate-900 tabular-nums focus:outline-hidden focus:border-teal-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Month 7 - 12 (H2) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider block">
                Section 2 (Month 7 – 12)
              </span>
              <h3 className="text-sm font-bold text-slate-900">Second 6 Months Allocation</h3>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500">Total Sec 2 Slots</span>
              <div className="text-base font-mono font-bold text-slate-900 tabular-nums">{sumH2}</div>
            </div>
          </div>

          <div className="space-y-2">
            {CORE_SPECIALTIES.map((spec) => (
              <div
                key={spec}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200"
              >
                <div className="flex items-center space-x-2">
                  <SpecialtyBadge specialty={spec} size="sm" showGroup={true} />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">Slots:</span>
                  <input
                    type="number"
                    min={0}
                    value={localQuotas.h2[spec]}
                    onChange={(e) => handleUpdate('h2', spec, parseInt(e.target.value))}
                    className="w-16 px-2 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono font-bold text-center text-slate-900 tabular-nums focus:outline-hidden focus:border-teal-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-xs text-slate-500">
          Updating section quotas automatically triggers lookahead feasibility re-verification.
        </span>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setLocalQuotas(quotas)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleSaveAndReallocate}
            disabled={!validation.valid}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs ${
              validation.valid
                ? 'bg-[#3B5BDB] hover:bg-[#2B4ACB] text-white'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <Save className="w-3.5 h-3.5 text-white" />
            <span>Save &amp; Re-Allocate</span>
          </button>
        </div>
      </div>
    </div>
  );
};
