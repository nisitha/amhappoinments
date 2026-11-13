'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Specialty,
  CORE_SPECIALTIES,
  HOPair,
  ALL_8_HO_PAIRS,
  getPermittedH2Specialties,
  getSpecialtyGroup
} from '@/lib/algorithms';
import { SpecialtyBadge } from '../common/SpecialtyBadge';
import {
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Info,
  Phone,
  Check,
  X,
  Plus,
  Trash2,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface ChoiceSlot {
  h1: Specialty;
  h2: Specialty | null;
}

// Visual color mapping for specialty buttons
const SPECIALTY_COLOR_STYLES: Record<
  Specialty,
  {
    active: string;
    inactive: string;
    dot: string;
  }
> = {
  Medicine: {
    active: 'bg-[#3B5BDB] text-white border-[#3B5BDB] shadow-xs font-bold',
    inactive: 'bg-white text-slate-700 border-slate-200 hover:border-[#3B5BDB]/50 hover:bg-[#EEF2FF]/40',
    dot: 'bg-[#3B5BDB]'
  },
  Surgery: {
    active: 'bg-[#F43F5E] text-white border-[#F43F5E] shadow-xs font-bold',
    inactive: 'bg-white text-slate-700 border-slate-200 hover:border-[#F43F5E]/50 hover:bg-[#FFF1F2]/40',
    dot: 'bg-[#F43F5E]'
  },
  Pediatrics: {
    active: 'bg-[#10B981] text-white border-[#10B981] shadow-xs font-bold',
    inactive: 'bg-white text-slate-700 border-slate-200 hover:border-[#10B981]/50 hover:bg-[#ECFDF5]/40',
    dot: 'bg-[#10B981]'
  },
  'Gyn & Obs': {
    active: 'bg-[#F59E0B] text-white border-[#F59E0B] shadow-xs font-bold',
    inactive: 'bg-white text-slate-700 border-slate-200 hover:border-[#F59E0B]/50 hover:bg-[#FFFBEB]/40',
    dot: 'bg-[#F59E0B]'
  }
};

export const TwoTapChoiceRanker: React.FC = () => {
  const { currentStudent, submitAndLockPreferences, showToast } = useApp();

  // Local choices state: starts with 3 cards minimum, flexible up to all 8
  const [choices, setChoices] = useState<ChoiceSlot[]>(() => {
    if (currentStudent?.preferences && currentStudent.preferences.length >= 3) {
      return currentStudent.preferences.slice(0, 8);
    }
    return [
      { h1: 'Medicine', h2: 'Surgery' },
      { h1: 'Surgery', h2: 'Medicine' },
      { h1: 'Pediatrics', h2: 'Gyn & Obs' }
    ];
  });

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronize choices when student or preferences update in database
  useEffect(() => {
    if (currentStudent?.preferences && currentStudent.preferences.length >= 3) {
      setChoices(currentStudent.preferences.slice(0, 8));
    }
  }, [currentStudent?.preferences, currentStudent?.id]);

  const isLocked = Boolean(currentStudent?.isLocked);

  // Helper map: for a given card index, returns a map of `${h1}->${h2}` to the other card's 1-indexed number
  const getOtherUsedPairsMap = (cardIdx: number) => {
    const map = new Map<string, number>();
    choices.forEach((c, idx) => {
      if (idx !== cardIdx && c.h1 && c.h2) {
        map.set(`${c.h1}->${c.h2}`, idx + 1);
      }
    });
    return map;
  };

  // Distinct completed pairs configured across all choice cards
  const configuredPairs = useMemo(() => {
    const set = new Set<string>();
    choices.forEach((c) => {
      if (c.h1 && c.h2) {
        set.add(`${c.h1}->${c.h2}`);
      }
    });
    return set;
  }, [choices]);

  // Number of valid unranked combinations remaining out of 8
  const remainingCombinationsCount = Math.max(0, 8 - configuredPairs.size);
  const completedChoicesCount = choices.filter((c) => c.h1 && c.h2 !== null).length;
  const incompleteCardIndex = choices.findIndex((c) => !c.h2);

  // Duplicate checks across all ranked choices
  const duplicateWarnings = useMemo(() => {
    const warnings: string[] = [];
    const pairCounts = new Map<string, number[]>();

    choices.forEach((c, idx) => {
      if (c.h1 && c.h2) {
        const key = `${c.h1}->${c.h2}`;
        const list = pairCounts.get(key) || [];
        list.push(idx + 1);
        pairCounts.set(key, list);
      }
    });

    pairCounts.forEach((ranks, key) => {
      if (ranks.length > 1) {
        warnings.push(
          `Choices #${ranks.join(', #')} have identical rotation pairing (${key.replace('->', ' → ')}). Each preference must be a unique combination.`
        );
      }
    });

    return warnings;
  }, [choices]);

  // Helper to check if a specific card's choice was already picked in an earlier card
  const getDuplicateOfEarlierRank = (idx: number): number | null => {
    const current = choices[idx];
    if (!current || !current.h2) return null;
    const currentStr = `${current.h1}->${current.h2}`;
    for (let i = 0; i < idx; i++) {
      if (choices[i] && choices[i].h2 && `${choices[i].h1}->${choices[i].h2}` === currentStr) {
        return i + 1; // 1-indexed earlier rank
      }
    }
    return null;
  };

  const hasDuplicates = duplicateWarnings.length > 0;
  const allChoicesComplete =
    choices.length >= 3 && choices.length <= 8 && choices.every((c) => c.h1 && c.h2 !== null);
  const canSubmit = !isLocked && !hasDuplicates && allChoicesComplete;
  const canAddMore = !isLocked && choices.length < 8 && remainingCombinationsCount > 0;

  // Handle selecting H1 in Card index with smart dead-end avoidance and conflict auto-resolution
  const handleSelectH1 = (choiceIdx: number, spec: Specialty) => {
    if (isLocked) return;
    const updated = [...choices];
    const currentPair = updated[choiceIdx];
    const permittedH2 = getPermittedH2Specialties(spec);
    const otherMap = getOtherUsedPairsMap(choiceIdx);

    // Available H2 options for this new H1 that aren't already used in other cards
    const availableH2 = permittedH2.filter((h2) => !otherMap.has(`${spec}->${h2}`));

    let newH2: Specialty | null = currentPair.h2;

    // If current H2 is null, not permitted for this new H1, or already used in another card:
    if (!newH2 || !permittedH2.includes(newH2) || otherMap.has(`${spec}->${newH2}`)) {
      // Pick the first available H2, or null if both are already taken
      newH2 = availableH2.length > 0 ? availableH2[0] : null;
    }

    updated[choiceIdx] = { h1: spec, h2: newH2 };

    // Conflict auto-resolution: If (spec, newH2) matches any other card, clear that other card's H2
    if (newH2) {
      const pairKey = `${spec}->${newH2}`;
      for (let i = 0; i < updated.length; i++) {
        if (
          i !== choiceIdx &&
          updated[i].h1 &&
          updated[i].h2 &&
          `${updated[i].h1}->${updated[i].h2}` === pairKey
        ) {
          updated[i] = { ...updated[i], h2: null };
        }
      }
    }

    setChoices(updated);
  };

  // Handle selecting H2 in Card index with conflict auto-resolution
  const handleSelectH2 = (choiceIdx: number, spec: Specialty) => {
    if (isLocked) return;
    const updated = [...choices];
    const currentPair = updated[choiceIdx];
    const permittedH2 = getPermittedH2Specialties(currentPair.h1);
    if (!permittedH2.includes(spec)) return;

    const otherMap = getOtherUsedPairsMap(choiceIdx);
    const pairKey = `${currentPair.h1}->${spec}`;
    if (otherMap.has(pairKey)) {
      // Already taken in another card
      return;
    }

    updated[choiceIdx] = { ...currentPair, h2: spec };

    // Conflict auto-resolution: If any other card had this exact pair, clear its H2
    for (let i = 0; i < updated.length; i++) {
      if (
        i !== choiceIdx &&
        updated[i].h1 &&
        updated[i].h2 &&
        `${updated[i].h1}->${updated[i].h2}` === pairKey
      ) {
        updated[i] = { ...updated[i], h2: null };
      }
    }

    setChoices(updated);
  };

  // Add a new choice card (Up to 8)
  const handleAddChoice = () => {
    if (!canAddMore) return;

    // Pick first combination from ALL_8_HO_PAIRS not yet in configuredPairs
    const nextAvailable = ALL_8_HO_PAIRS.find((p) => !configuredPairs.has(`${p.h1}->${p.h2}`));

    if (nextAvailable) {
      setChoices((prev) => [...prev, { h1: nextAvailable.h1, h2: nextAvailable.h2 }]);
      showToast(`Added Choice #${choices.length + 1}: ${nextAvailable.h1} → ${nextAvailable.h2}`);
    }
  };

  // Remove a choice card (Allowed only for Choice #4 through #8)
  const handleRemoveChoice = (indexToRemove: number) => {
    if (isLocked || choices.length <= 3) return;
    setChoices((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    showToast(`Removed Choice #${indexToRemove + 1}.`);
  };

  // Open confirmation modal
  const handleOpenConfirmModal = () => {
    if (isLocked) return;
    if (incompleteCardIndex !== -1) {
      showToast(`Choice #${incompleteCardIndex + 1} requires a 2nd 6 Months (Month 7–12) specialty selection.`);
      return;
    }
    if (hasDuplicates) {
      showToast(duplicateWarnings[0]);
      return;
    }
    setIsConfirmModalOpen(true);
  };

  // Confirm and permanently lock choices
  const handleConfirmLock = async () => {
    if (!currentStudent || isLocked || !allChoicesComplete) return;
    setIsSubmitting(true);
    try {
      const res = await submitAndLockPreferences(currentStudent.id, choices as HOPair[]);
      if (res.success) {
        setIsConfirmModalOpen(false);
        confetti({
          particleCount: 130,
          spread: 85,
          origin: { y: 0.6 }
        });
      } else {
        showToast(res.error || 'Failed to lock preferences.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedSubmittedAt = currentStudent?.submittedAt
    ? new Date(currentStudent.submittedAt).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  return (
    <div className="space-y-6">
      {/* =========================================================================
          1. HEADER BANNER OR PERMANENT LOCKED NOTICE
      ========================================================================= */}
      {isLocked ? (
        <div className="bg-[#ECFDF5] border-2 border-[#10B981]/40 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#10B981] text-white shadow-xs">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Preferences Submitted &amp; Locked</span>
                </span>
                {formattedSubmittedAt && (
                  <span className="text-xs text-emerald-800 font-medium">
                    Recorded on {formattedSubmittedAt}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-emerald-950 tracking-tight">
                Your Official Rotation Preferences Are Sealed ({choices.length} Choices Ranked)
              </h2>
              <p className="text-xs text-emerald-800 leading-relaxed max-w-2xl">
                Your {choices.length} ranked preferences below are permanently locked for the official merit-order allocation run. If an emergency change is required prior to the allocation deadline, please contact AMH Kalmunai Administration.
              </p>
            </div>

            <div className="shrink-0 flex items-center space-x-2 bg-white/80 backdrop-blur-xs border border-emerald-200 px-3.5 py-2 rounded-xl text-xs text-emerald-900 font-semibold shadow-2xs">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Admin: 067 222 9496</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs p-5 sm:p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#3B5BDB] border border-[#C5D2FB]">
                Choice Selection
              </span>
              <span className="text-xs text-slate-500 font-medium font-mono">
                All-Island Rank #{currentStudent?.meritRank}
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-700">
                {completedChoicesCount} of 8 Choices Ranked
              </span>
              <span className="text-xs text-slate-300">•</span>
              {remainingCombinationsCount > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                  {remainingCombinationsCount} of 8 combinations remaining
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-[#10B981]" />
                  All 8 valid combinations ranked
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Select &amp; Rank Your Rotation Preferences
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Configure your preferences directly inside each card below (minimum 3, up to all 8 valid combinations). Selecting Month 1–6 automatically filters Month 7–12 to guarantee 1 Medical + 1 Surgical discipline.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {/* + Add Choice (Up to 8) button */}
            {choices.length < 8 && (
              <button
                type="button"
                onClick={handleAddChoice}
                disabled={!canAddMore}
                className={`flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border transition shadow-xs ${
                  canAddMore
                    ? 'bg-[#EEF2FF] hover:bg-[#3B5BDB] text-[#3B5BDB] hover:text-white border-[#C5D2FB] cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                }`}
                title={
                  remainingCombinationsCount === 0
                    ? 'All 8 valid rotation combinations have already been added'
                    : 'Add another rotation choice card'
                }
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Choice (Up to 8)</span>
              </button>
            )}

            {/* Submit & Lock Preferences button */}
            <button
              onClick={handleOpenConfirmModal}
              disabled={!canSubmit}
              className={`flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition ${
                canSubmit
                  ? 'bg-[#3B5BDB] hover:bg-[#2B4ACB] text-white cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Submit &amp; Lock Preferences</span>
            </button>
          </div>
        </div>
      )}

      {/* Duplicate Warning Banner */}
      {!isLocked && hasDuplicates && (
        <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl p-4 sm:p-5 flex items-start space-x-3 text-xs text-[#BE123C] font-semibold shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-[#F43F5E] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sm block">Duplicate Choices Detected</span>
            {duplicateWarnings.map((w, idx) => (
              <p key={idx} className="leading-relaxed">
                • {w}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Guarantee Note if doctor ranked all 8 combinations */}
      {choices.length === 8 && !hasDuplicates && (
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-4 flex items-center justify-between text-xs text-[#047857] shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-4 h-4 text-[#10B981] shrink-0" />
            <span className="font-semibold">
              Full Spectrum Ranked (8/8 Choices): Feasibility lookahead guarantees you an immediate confirmed rotation allocation without entering the unassigned alternatives pool.
            </span>
          </div>
          <span className="hidden sm:inline font-mono font-bold text-[11px] bg-white/80 border border-[#A7F3D0] px-2.5 py-0.5 rounded-full">
            100% Granted Coverage
          </span>
        </div>
      )}

      {/* =========================================================================
          2. INLINE CHOICE CARDS (grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5)
      ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {choices.map((choice, idx) => {
          const choiceNum = idx + 1;
          const otherUsedPairsMap = getOtherUsedPairsMap(idx);
          const permittedH2 = getPermittedH2Specialties(choice.h1);
          const duplicateOfEarlier = getDuplicateOfEarlierRank(idx);
          const isCardIncomplete = !choice.h2;

          return (
            <div
              key={idx}
              className={`rounded-2xl border transition shadow-xs flex flex-col justify-between overflow-hidden ${
                isLocked
                  ? 'bg-slate-50/70 border-slate-200'
                  : isCardIncomplete
                  ? 'bg-white border-amber-300 ring-2 ring-amber-200/50'
                  : duplicateOfEarlier
                  ? 'bg-white border-rose-300 ring-2 ring-rose-200/50'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Card Header: Choice Title + Badge + Remove Button (for #4..#8) */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-lg bg-[#3B5BDB] text-white font-extrabold text-xs flex items-center justify-center shadow-2xs">
                    #{choiceNum}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 tracking-wider uppercase block leading-none">
                      Choice #{choiceNum}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Preference Rank {choiceNum}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  {/* Remove Button for Choice #4 through #8 */}
                  {!isLocked && idx >= 3 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChoice(idx)}
                      className="w-6 h-6 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 flex items-center justify-center transition"
                      title={`Remove Choice #${choiceNum}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isLocked && (
                    <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                </div>
              </div>

              {/* Live Selected Summary Badge / Duplicate Indicator */}
              <div className="px-4 pt-3 pb-1 flex flex-wrap items-center justify-between gap-1.5">
                {choice.h2 ? (
                  <span className="text-[11px] font-bold text-slate-800 bg-slate-100/80 border border-slate-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1 font-mono">
                    <span className="text-slate-900">{choice.h1}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-900">{choice.h2}</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1 animate-pulse">
                    <span className="text-slate-900">{choice.h1}</span>
                    <ArrowRight className="w-3 h-3 text-amber-500" />
                    <span className="text-amber-700">Select Month 7–12</span>
                  </span>
                )}

                {duplicateOfEarlier !== null && (
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-rose-500" />
                    Already ranked in #{duplicateOfEarlier}
                  </span>
                )}
              </div>

              {/* Card Body: Inline Selectors for H1 and H2 */}
              <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                {/* --- 1ST 6 MONTHS (H1) --- */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 tracking-wide uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3B5BDB]" />
                      1st 6 Months (H1)
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Month 1–6</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {CORE_SPECIALTIES.map((spec) => {
                      const isSelected = choice.h1 === spec;
                      const style = SPECIALTY_COLOR_STYLES[spec];
                      const group = getSpecialtyGroup(spec);

                      // Smart dead-end check: Are all permitted cross-group H2 pairings already used in other cards?
                      const permittedForSpec = getPermittedH2Specialties(spec);
                      const isAllPairsUsed =
                        !isSelected && permittedForSpec.every((h2) => otherUsedPairsMap.has(`${spec}->${h2}`));
                      const isDisabled = isLocked || isAllPairsUsed;

                      return (
                        <button
                          key={spec}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleSelectH1(idx, spec)}
                          title={
                            isAllPairsUsed
                              ? 'Both valid cross-group pairings for this specialty are already ranked in other choices'
                              : undefined
                          }
                          className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                            isAllPairsUsed
                              ? 'bg-slate-100/70 border-slate-200/50 text-slate-400 opacity-45 cursor-not-allowed'
                              : isSelected
                              ? style.active
                              : isLocked
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                              : style.inactive
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[8px] uppercase tracking-wider opacity-75 font-semibold">
                              {group === 'Group A' ? 'Med' : 'Surg'}
                            </span>
                            {isAllPairsUsed ? (
                              <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-tight bg-slate-200/60 px-1 py-0.5 rounded">
                                All pairs used
                              </span>
                            ) : isSelected ? (
                              <Check className="w-3 h-3 text-white" />
                            ) : null}
                          </div>
                          <span className="text-[11px] font-bold leading-tight truncate">
                            {spec}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* --- 2ND 6 MONTHS (H2) --- */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 tracking-wide uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F43F5E]" />
                      2nd 6 Months (H2)
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Month 7–12</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {CORE_SPECIALTIES.map((spec) => {
                      const isPermitted = permittedH2.includes(spec);
                      const isSelected = choice.h2 === spec;
                      const style = SPECIALTY_COLOR_STYLES[spec];
                      const group = getSpecialtyGroup(spec);

                      const pairKey = `${choice.h1}->${spec}`;
                      const usedInRank = otherUsedPairsMap.get(pairKey);
                      const isAlreadyUsed = isPermitted && usedInRank !== undefined;

                      const isDisabled = isLocked || !isPermitted || isAlreadyUsed;

                      return (
                        <button
                          key={spec}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleSelectH2(idx, spec)}
                          title={
                            !isPermitted
                              ? 'Cannot pair with same-group specialty (MOH 1 Med + 1 Surg requirement)'
                              : isAlreadyUsed
                              ? `Rotation ${choice.h1} → ${spec} is already ranked in Choice #${usedInRank}`
                              : undefined
                          }
                          className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                            !isPermitted
                              ? 'bg-slate-100/70 border-slate-200/50 text-slate-300 opacity-40 cursor-not-allowed'
                              : isAlreadyUsed
                              ? 'bg-slate-100/70 border-slate-200/50 text-slate-400 opacity-45 cursor-not-allowed'
                              : isSelected
                              ? style.active
                              : isLocked
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                              : style.inactive
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[8px] uppercase tracking-wider opacity-75 font-semibold">
                              {group === 'Group A' ? 'Med' : 'Surg'}
                            </span>
                            {!isPermitted ? (
                              <span className="text-[8px] font-bold text-slate-400 uppercase">
                                Blocked
                              </span>
                            ) : isAlreadyUsed ? (
                              <span className="text-[7.5px] font-bold text-amber-700 uppercase tracking-tight bg-amber-100/80 px-1 py-0.5 rounded">
                                Used in #{usedInRank}
                              </span>
                            ) : isSelected ? (
                              <Check className="w-3 h-3 text-white" />
                            ) : null}
                          </div>
                          <span className="text-[11px] font-bold leading-tight truncate">
                            {spec}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card Footer: MOH Compliance Check */}
              <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                <span className="flex items-center gap-1 text-[#047857]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>1 Med + 1 Surg</span>
                </span>
                <span className="font-mono text-slate-400 text-[10px]">
                  {choice.h1.slice(0, 3)}/{choice.h2 ? choice.h2.slice(0, 3) : '---'}
                </span>
              </div>
            </div>
          );
        })}

        {/* Empty Add Slot Card (When choices < 8 and can add more) */}
        {!isLocked && choices.length < 8 && canAddMore && (
          <div
            onClick={handleAddChoice}
            className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#3B5BDB]/50 hover:bg-[#EEF2FF]/20 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition min-h-[320px] space-y-3 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] border border-[#C5D2FB] group-hover:bg-[#3B5BDB] group-hover:text-white flex items-center justify-center text-[#3B5BDB] transition shadow-xs">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 group-hover:text-[#3B5BDB] block transition">
                + Add Choice #{choices.length + 1}
              </span>
              <span className="text-xs text-slate-400 mt-1 block">
                Rank up to all 8 valid rotation combinations ({remainingCombinationsCount} remaining)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Bar (Only when unlocked) */}
      {!isLocked && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-xs text-slate-600">
            <Info className="w-4 h-4 text-[#3B5BDB] shrink-0" />
            <span>
              {incompleteCardIndex !== -1 ? (
                <span className="text-amber-800 font-semibold">
                  Choice #{incompleteCardIndex + 1} requires a 2nd 6 Months (Month 7–12) specialty selection.
                </span>
              ) : (
                <>
                  You have ranked <strong className="text-slate-900 font-bold">{completedChoicesCount} choices</strong>. Each preference must be a distinct rotation pairing. Once submitted, your choices will be permanently locked against changes.
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {choices.length < 8 && (
              <button
                type="button"
                onClick={handleAddChoice}
                disabled={!canAddMore}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border transition shadow-xs ${
                  canAddMore
                    ? 'bg-[#EEF2FF] text-[#3B5BDB] hover:bg-[#3B5BDB] hover:text-white border-[#C5D2FB] cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                }`}
                title={
                  remainingCombinationsCount === 0
                    ? 'All 8 valid combinations have already been ranked'
                    : 'Add another rotation choice card'
                }
              >
                <Plus className="w-4 h-4" />
                <span>Add Choice</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenConfirmModal}
              disabled={!canSubmit}
              className={`flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition ${
                canSubmit
                  ? 'bg-[#3B5BDB] hover:bg-[#2B4ACB] text-white cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Submit &amp; Lock Preferences</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. MANDATORY CONFIRMATION & LOCK MODAL
      ========================================================================= */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <Lock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Confirm &amp; Lock Rotation Preferences
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentStudent?.name} • All-Island Rank #{currentStudent?.meritRank} • {choices.length} Ranked Choices
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
                title="Cancel and close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Choices Summary Cards */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Your {choices.length} Ranked Rotation Choices:
                </span>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {choices.map((c, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-md bg-[#3B5BDB] text-white text-[10px] font-bold flex items-center justify-center">
                          #{i + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          Choice #{i + 1}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 font-mono text-xs font-bold text-slate-900">
                        <SpecialtyBadge specialty={c.h1} size="sm" showGroup={false} />
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        {c.h2 && <SpecialtyBadge specialty={c.h2} size="sm" showGroup={false} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* High-Clarity Warning Box */}
              <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-start space-x-3 text-xs text-[#92400E]">
                <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-[#B45309]">
                    Final Submission Warning:
                  </p>
                  <p className="leading-relaxed">
                    Once confirmed, your rotation preferences are <span className="font-bold underline">permanently locked</span> and CANNOT be edited or changed later. The allocation engine will strictly evaluate these {choices.length} preferences in order of your All-Island merit rank.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition"
              >
                Go Back &amp; Review
              </button>

              <button
                type="button"
                onClick={handleConfirmLock}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#3B5BDB] hover:bg-[#2B4ACB] transition shadow-xs disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>Locking...</span>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Yes, Confirm &amp; Lock Choices</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
