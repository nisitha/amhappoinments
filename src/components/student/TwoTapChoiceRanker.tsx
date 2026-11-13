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
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Edit3,
  ArrowUp,
  ArrowDown,
  Save,
  Clock,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Visual color mapping for specialty buttons
const SPECIALTY_COLOR_STYLES: Record<
  Specialty,
  {
    active: string;
    inactive: string;
    dot: string;
    lightBg: string;
    border: string;
  }
> = {
  Medicine: {
    active: 'bg-[#3B5BDB] text-white border-[#3B5BDB] shadow-xs font-bold',
    inactive: 'bg-white text-slate-800 border-slate-200 hover:border-[#3B5BDB] hover:bg-[#EEF2FF]/60 hover:text-[#3B5BDB]',
    dot: 'bg-[#3B5BDB]',
    lightBg: 'bg-[#EEF2FF]',
    border: 'border-[#C5D2FB]'
  },
  Surgery: {
    active: 'bg-[#F43F5E] text-white border-[#F43F5E] shadow-xs font-bold',
    inactive: 'bg-white text-slate-800 border-slate-200 hover:border-[#F43F5E] hover:bg-[#FFF1F2]/60 hover:text-[#F43F5E]',
    dot: 'bg-[#F43F5E]',
    lightBg: 'bg-[#FFF1F2]',
    border: 'border-[#FECDD3]'
  },
  Pediatrics: {
    active: 'bg-[#10B981] text-white border-[#10B981] shadow-xs font-bold',
    inactive: 'bg-white text-slate-800 border-slate-200 hover:border-[#10B981] hover:bg-[#ECFDF5]/60 hover:text-[#10B981]',
    dot: 'bg-[#10B981]',
    lightBg: 'bg-[#ECFDF5]',
    border: 'border-[#A7F3D0]'
  },
  'Gyn & Obs': {
    active: 'bg-[#F59E0B] text-white border-[#F59E0B] shadow-xs font-bold',
    inactive: 'bg-white text-slate-800 border-slate-200 hover:border-[#F59E0B] hover:bg-[#FFFBEB]/60 hover:text-[#F59E0B]',
    dot: 'bg-[#F59E0B]',
    lightBg: 'bg-[#FFFBEB]',
    border: 'border-[#FDE68A]'
  }
};

export const TwoTapChoiceRanker: React.FC = () => {
  const {
    currentStudent,
    isPreferencesLocked,
    savePreferences,
    showToast
  } = useApp();

  // Local choices state: starts empty or loaded from student preferences
  const [choices, setChoices] = useState<HOPair[]>(() => {
    if (currentStudent?.preferences && currentStudent.preferences.length > 0) {
      return [...currentStudent.preferences];
    }
    return [];
  });

  // Track the choice index currently being configured (0-indexed)
  // If choices are empty -> starts at 0 (Choice #1)
  // If doctor already has all 8 choices -> -1 (completed summary view)
  const [activeChoiceIndex, setActiveChoiceIndex] = useState<number>(() => {
    if (currentStudent?.preferences && currentStudent.preferences.length >= 8) {
      return -1;
    }
    return currentStudent?.preferences?.length || 0;
  });

  // Active step inside the choice card:
  // selectedH1: selected specialty for 1st 6 Months (Step A)
  // When selectedH1 is set, card transitions to Step B (2nd 6 Months)
  const [selectedH1, setSelectedH1] = useState<Specialty | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [hasSavedLocally, setHasSavedLocally] = useState(false);

  // Synchronize when current student changes
  useEffect(() => {
    if (currentStudent?.preferences) {
      setChoices([...currentStudent.preferences]);
      if (currentStudent.preferences.length >= 8) {
        setActiveChoiceIndex(-1);
      } else {
        setActiveChoiceIndex(currentStudent.preferences.length);
      }
      setSelectedH1(null);
    }
  }, [currentStudent?.id, currentStudent?.preferences]);

  // Map of configured pairs outside the current active choice: "H1->H2" => choice rank (1-indexed)
  const otherUsedPairsMap = useMemo(() => {
    const map = new Map<string, number>();
    choices.forEach((c, idx) => {
      if (idx !== activeChoiceIndex && c.h1 && c.h2) {
        map.set(`${c.h1}->${c.h2}`, idx + 1);
      }
    });
    return map;
  }, [choices, activeChoiceIndex]);

  // Set of all configured pairs across all choices
  const allConfiguredPairs = useMemo(() => {
    const set = new Set<string>();
    choices.forEach((c) => {
      if (c.h1 && c.h2) {
        set.add(`${c.h1}->${c.h2}`);
      }
    });
    return set;
  }, [choices]);

  const remainingCombinationsCount = Math.max(0, 8 - allConfiguredPairs.size);
  const isAllEightRanked = choices.length >= 8 && allConfiguredPairs.size >= 8;

  // Handle Step A: Doctor clicks 1st 6 Months (H1) specialty
  const handleSelectH1 = (spec: Specialty) => {
    if (isPreferencesLocked) return;

    // Check if both cross-group pairings for this specialty are already taken in other choices
    const permittedH2 = getPermittedH2Specialties(spec);
    const isAllPairsUsed = permittedH2.every((h2) => otherUsedPairsMap.has(`${spec}->${h2}`));
    if (isAllPairsUsed) return;

    setSelectedH1(spec);
  };

  // Handle Step B: Doctor clicks 2nd 6 Months (H2) specialty
  const handleSelectH2 = (spec: Specialty) => {
    if (isPreferencesLocked || !selectedH1) return;

    // Must satisfy MOH cross-group rule
    const permittedH2 = getPermittedH2Specialties(selectedH1);
    if (!permittedH2.includes(spec)) return;

    // Must not duplicate an already ranked pair in another choice
    const pairKey = `${selectedH1}->${spec}`;
    if (otherUsedPairsMap.has(pairKey)) return;

    const completedChoice: HOPair = { h1: selectedH1, h2: spec };

    let nextChoices: HOPair[];
    if (activeChoiceIndex < choices.length) {
      // Editing an existing choice
      nextChoices = [...choices];
      nextChoices[activeChoiceIndex] = completedChoice;
    } else {
      // Appending a new choice
      nextChoices = [...choices, completedChoice];
    }

    setChoices(nextChoices);
    setSelectedH1(null);

    // Auto-advance to next choice if more combinations remain and < 8
    if (nextChoices.length < 8) {
      setActiveChoiceIndex(nextChoices.length);
    } else {
      setActiveChoiceIndex(-1);
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  };

  // Step backward inside the current active choice: from Step B back to Step A
  const handleBackToH1 = () => {
    setSelectedH1(null);
  };

  // Step backward to previous Choice (Choice #[N - 1])
  const handleBackToPreviousChoice = () => {
    if (activeChoiceIndex <= 0) return;
    const prevIdx = activeChoiceIndex - 1;
    setActiveChoiceIndex(prevIdx);
    const existing = choices[prevIdx];
    if (existing) {
      setSelectedH1(existing.h1);
    } else {
      setSelectedH1(null);
    }
  };

  // Jump to edit a specific choice from the Ranked Choices Summary list
  const handleStartEditChoice = (index: number) => {
    if (isPreferencesLocked) return;
    setActiveChoiceIndex(index);
    const existing = choices[index];
    if (existing) {
      setSelectedH1(existing.h1);
    } else {
      setSelectedH1(null);
    }
  };

  // Remove a choice from the ranked list
  const handleRemoveChoice = (indexToRemove: number) => {
    if (isPreferencesLocked) return;
    const nextChoices = choices.filter((_, idx) => idx !== indexToRemove);
    setChoices(nextChoices);

    if (activeChoiceIndex === indexToRemove) {
      setSelectedH1(null);
      setActiveChoiceIndex(nextChoices.length);
    } else if (activeChoiceIndex > indexToRemove) {
      setActiveChoiceIndex(activeChoiceIndex - 1);
    }
    showToast(`Removed Choice #${indexToRemove + 1}.`);
  };

  // Move choice up in priority order
  const handleMoveUp = (index: number) => {
    if (isPreferencesLocked || index <= 0) return;
    const updated = [...choices];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setChoices(updated);
  };

  // Move choice down in priority order
  const handleMoveDown = (index: number) => {
    if (isPreferencesLocked || index >= choices.length - 1) return;
    const updated = [...choices];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setChoices(updated);
  };

  // Start adding next choice
  const handleAddNextChoice = () => {
    if (isPreferencesLocked || choices.length >= 8) return;
    setActiveChoiceIndex(choices.length);
    setSelectedH1(null);
  };

  // Reset / Clear all choices
  const handleClearAll = () => {
    if (isPreferencesLocked) return;
    if (window.confirm('Are you sure you want to clear all your rotation preferences?')) {
      setChoices([]);
      setActiveChoiceIndex(0);
      setSelectedH1(null);
    }
  };

  // Save Preferences to Supabase
  const handleSavePreferences = async () => {
    if (!currentStudent) return;
    if (choices.length === 0) {
      showToast('Please configure at least 1 rotation choice before saving.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const res = await savePreferences(currentStudent.id, choices);
      if (res.success) {
        setHasSavedLocally(true);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } finally {
      setIsSaving(false);
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
          1. TOP BANNER: LOCKED NOTICE OR INTERACTIVE STATUS
      ========================================================================= */}
      {isPreferencesLocked ? (
        <div className="bg-[#FFF1F2] border-2 border-[#F43F5E]/40 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F43F5E] text-white shadow-xs">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Preferences Locked</span>
                </span>
                {formattedSubmittedAt && (
                  <span className="text-xs text-rose-800 font-medium">
                    Recorded on {formattedSubmittedAt}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-rose-950 tracking-tight">
                Preferences Locked — Allocations have been generated (or intake closed by administration).
              </h2>
              <p className="text-xs text-rose-800 leading-relaxed max-w-2xl">
                Your submitted rotation choices below are strictly sealed for the official central merit allocation run. If an urgent administrative adjustment is required, please contact hospital management.
              </p>
            </div>

            <div className="shrink-0 flex items-center space-x-2 bg-white/80 backdrop-blur-xs border border-rose-200 px-3.5 py-2 rounded-xl text-xs text-rose-900 font-semibold shadow-2xs">
              <Phone className="w-3.5 h-3.5 text-rose-600" />
              <span>Admin: 067 222 9496</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs p-5 sm:p-6 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#3B5BDB] border border-[#C5D2FB]">
                Step-by-Step Choice Flow
              </span>
              <span className="text-xs text-slate-500 font-medium font-mono">
                All-Island Rank #{currentStudent?.meritRank}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-700">
                {choices.length} of 8 Combinations Ranked
              </span>
              <span className="text-slate-300">•</span>
              {remainingCombinationsCount > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                  {remainingCombinationsCount} combinations remaining
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-[#10B981]" />
                  All 8 combinations ranked (100% Guaranteed)
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Select &amp; Rank Your Rotation Preferences
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Step through your choices one by one (1st to 8th). Select Month 1–6 (H1), then Month 7–12 (H2). You can freely re-edit, reorder, or update your saved preferences at any time before central allocations are generated.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {/* Save / Update Preferences Button */}
            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={isSaving || choices.length === 0}
              className={`flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition ${
                choices.length > 0 && !isSaving
                  ? 'bg-[#3B5BDB] hover:bg-[#2B4ACB] text-white cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>
                {isSaving
                  ? 'Saving to Database...'
                  : hasSavedLocally || currentStudent?.submittedAt
                  ? 'Update Saved Preferences'
                  : 'Save / Submit Preferences'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Re-editing Note if preferences already saved */}
      {!isPreferencesLocked && (currentStudent?.submittedAt || hasSavedLocally) && (
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#047857] shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
            <div>
              <span className="font-bold">Preferences Saved in Hospital Database</span>
              <span className="text-slate-600 block mt-0.5">
                {choices.length} choices recorded. You can edit any choice, add more combinations, or change rankings anytime before allocations are officially run.
              </span>
            </div>
          </div>
          {formattedSubmittedAt && (
            <span className="text-[11px] text-emerald-800 font-mono shrink-0 bg-white/70 border border-[#A7F3D0] px-2.5 py-1 rounded-lg">
              Saved {formattedSubmittedAt}
            </span>
          )}
        </div>
      )}

      {/* =========================================================================
          2. RANKED CHOICES SUMMARY LIST (SHOWN WHEN CHOICES > 0)
      ========================================================================= */}
      {choices.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <span className="w-7 h-7 rounded-lg bg-[#3B5BDB] text-white text-xs font-bold flex items-center justify-center shadow-2xs">
                {choices.length}
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Your Ranked Preferences ({choices.length} of 8 Configured)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Evaluated strictly in priority order during central merit-order matching.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              {!isPreferencesLocked && choices.length < 8 && activeChoiceIndex === -1 && (
                <button
                  type="button"
                  onClick={handleAddNextChoice}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#EEF2FF] text-[#3B5BDB] hover:bg-[#3B5BDB] hover:text-white border border-[#C5D2FB] transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Choice #{choices.length + 1}</span>
                </button>
              )}

              {!isPreferencesLocked && choices.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition"
                  title="Clear all preferences"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Table / List of Ranked Choices */}
          <div className="divide-y divide-slate-100">
            {choices.map((choice, idx) => {
              const rankNum = idx + 1;
              const isCurrentlyEditing = activeChoiceIndex === idx;

              return (
                <div
                  key={idx}
                  className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    isCurrentlyEditing
                      ? 'bg-[#EEF2FF]/50 border-l-4 border-l-[#3B5BDB]'
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  {/* Left: Rank Badge + Rotation Specialties */}
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-7 h-7 rounded-lg text-xs font-bold font-mono flex items-center justify-center shrink-0 ${
                        isCurrentlyEditing
                          ? 'bg-[#3B5BDB] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      #{rankNum}
                    </span>

                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
                        Choice #{rankNum}:
                      </span>
                      <SpecialtyBadge specialty={choice.h1} size="sm" showGroup={false} />
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <SpecialtyBadge specialty={choice.h2} size="sm" showGroup={false} />
                    </div>
                  </div>

                  {/* Middle: MOH Verification Pill */}
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                    <span className="hidden md:inline-flex items-center gap-1 text-[#047857] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md font-medium">
                      <ShieldCheck className="w-3 h-3 text-[#10B981]" />
                      <span>1 Med + 1 Surg Verified</span>
                    </span>
                  </div>

                  {/* Right: Actions (Move Up / Down / Edit / Remove) */}
                  {!isPreferencesLocked && (
                    <div className="flex items-center space-x-1.5 self-end sm:self-auto shrink-0">
                      {/* Move Up */}
                      <button
                        type="button"
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === choices.length - 1}
                        className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleStartEditChoice(idx)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition ${
                          isCurrentlyEditing
                            ? 'bg-[#3B5BDB] text-white border-[#3B5BDB]'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-[#EEF2FF] hover:text-[#3B5BDB] hover:border-[#C5D2FB]'
                        }`}
                        title="Edit this choice"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveChoice(idx)}
                        className="w-7 h-7 rounded-lg border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition"
                        title="Remove choice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          3. ACTIVE PROGRESSIVE CHOICE CONFIGURATOR STEP
          (Only shown when not locked and activeChoiceIndex is valid)
      ========================================================================= */}
      {!isPreferencesLocked && activeChoiceIndex >= 0 && activeChoiceIndex <= 8 && remainingCombinationsCount > 0 && (
        <div className="bg-white rounded-2xl border-2 border-[#3B5BDB]/30 shadow-md overflow-hidden animate-in fade-in duration-200">
          {/* Card Step Header */}
          <div className="p-5 bg-gradient-to-r from-[#EEF2FF] to-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#3B5BDB] text-white font-extrabold text-base flex items-center justify-center shadow-xs">
                #{activeChoiceIndex + 1}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-extrabold text-[#3B5BDB] uppercase tracking-wider">
                    {activeChoiceIndex < choices.length ? 'Editing' : 'Configuring'} Choice #{activeChoiceIndex + 1}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-bold text-slate-600">
                    Preference Rank {activeChoiceIndex + 1}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  {!selectedH1
                    ? 'Step 1: Choose 1st 6 Months (Month 1–6)'
                    : 'Step 2: Choose 2nd 6 Months (Month 7–12)'}
                </h3>
              </div>
            </div>

            {/* Back to Choice #[N-1] button if activeChoiceIndex > 0 */}
            <div className="flex items-center space-x-2">
              {activeChoiceIndex > 0 && (
                <button
                  type="button"
                  onClick={handleBackToPreviousChoice}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                  <span>← Back to Choice #{activeChoiceIndex}</span>
                </button>
              )}

              {activeChoiceIndex < choices.length && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveChoiceIndex(choices.length < 8 ? choices.length : -1);
                    setSelectedH1(null);
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>

          {/* Card Body: Step A vs Step B */}
          <div className="p-5 sm:p-6 space-y-6">
            {/* -------------------------------------------------------------
                STEP A: 1ST 6 MONTHS (H1)
            ------------------------------------------------------------- */}
            {!selectedH1 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#3B5BDB]" />
                      Select 1st 6 Months (H1) Specialty
                    </span>
                    <p className="text-xs text-slate-500">
                      Tap a clinical specialty below to begin configuring Choice #{activeChoiceIndex + 1}.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#3B5BDB] bg-[#EEF2FF] border border-[#C5D2FB] px-2.5 py-0.5 rounded-md">
                    Month 1–6
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {CORE_SPECIALTIES.map((spec) => {
                    const style = SPECIALTY_COLOR_STYLES[spec];
                    const group = getSpecialtyGroup(spec);

                    // Dead-end progressive gray out check:
                    // Are all 2 permitted cross-group pairings for this spec already used in other choices?
                    const permittedForSpec = getPermittedH2Specialties(spec);
                    const isAllPairsUsed = permittedForSpec.every((h2) =>
                      otherUsedPairsMap.has(`${spec}->${h2}`)
                    );

                    return (
                      <button
                        key={spec}
                        type="button"
                        disabled={isAllPairsUsed}
                        onClick={() => handleSelectH1(spec)}
                        title={
                          isAllPairsUsed
                            ? `Both valid pairings starting with ${spec} are already ranked in other choices`
                            : `Select ${spec} for 1st 6 Months`
                        }
                        className={`p-4 rounded-xl border text-left transition flex flex-col justify-between min-h-[96px] ${
                          isAllPairsUsed
                            ? 'bg-slate-100/70 border-slate-200/50 text-slate-400 opacity-45 cursor-not-allowed'
                            : style.inactive + ' cursor-pointer shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase tracking-wider font-extrabold opacity-75">
                            {group === 'Group A' ? 'Medical (Group A)' : 'Surgical (Group B)'}
                          </span>
                          {isAllPairsUsed && (
                            <span className="text-[8px] font-bold text-slate-400 uppercase bg-slate-200/70 px-1.5 py-0.5 rounded">
                              All pairs used
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold leading-tight">{spec}</span>
                          <span className="text-xs font-semibold text-slate-400">
                            Select →
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* -------------------------------------------------------------
                 STEP B: 2ND 6 MONTHS (H2) WITH "← BACK TO 1ST 6 MONTHS"
              ------------------------------------------------------------- */
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Step B Header with Selected H1 Summary & Change Button */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      1st 6 Months Selected:
                    </span>
                    <SpecialtyBadge specialty={selectedH1} size="md" showGroup={true} />
                  </div>

                  {/* Explicit "← Back to 1st 6 Months" button */}
                  <button
                    type="button"
                    onClick={handleBackToH1}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-[#EEF2FF] hover:text-[#3B5BDB] hover:border-[#C5D2FB] transition self-start sm:self-auto shadow-2xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-[#3B5BDB]" />
                    <span>← Back to 1st 6 Months</span>
                  </button>
                </div>

                {/* Step B Specialty Selectors */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
                        Select 2nd 6 Months (H2) Specialty
                      </span>
                      <p className="text-xs text-slate-500">
                        Select a complementary cross-group discipline to complete Choice #{activeChoiceIndex + 1}.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#F43F5E] bg-[#FFF1F2] border border-[#FECDD3] px-2.5 py-0.5 rounded-md">
                      Month 7–12
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {CORE_SPECIALTIES.map((spec) => {
                      const permittedH2 = getPermittedH2Specialties(selectedH1);
                      const isPermitted = permittedH2.includes(spec);
                      const style = SPECIALTY_COLOR_STYLES[spec];
                      const group = getSpecialtyGroup(spec);

                      const pairKey = `${selectedH1}->${spec}`;
                      const usedInRank = otherUsedPairsMap.get(pairKey);
                      const isAlreadyUsed = isPermitted && usedInRank !== undefined;

                      const isDisabled = !isPermitted || isAlreadyUsed;

                      return (
                        <button
                          key={spec}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleSelectH2(spec)}
                          title={
                            !isPermitted
                              ? 'Forbidden: cannot pair with same-group specialty (MOH 1 Med + 1 Surg requirement)'
                              : isAlreadyUsed
                              ? `Already ranked in Choice #${usedInRank}`
                              : `Select ${spec} for 2nd 6 Months`
                          }
                          className={`p-4 rounded-xl border text-left transition flex flex-col justify-between min-h-[96px] ${
                            !isPermitted
                              ? 'bg-slate-100/70 border-slate-200/50 text-slate-300 opacity-40 cursor-not-allowed'
                              : isAlreadyUsed
                              ? 'bg-slate-100/70 border-slate-200/50 text-slate-400 opacity-45 cursor-not-allowed'
                              : style.inactive + ' cursor-pointer shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-wider font-extrabold opacity-75">
                              {group === 'Group A' ? 'Medical' : 'Surgical'}
                            </span>
                            {!isPermitted ? (
                              <span className="text-[8px] font-bold text-slate-400 uppercase bg-slate-200/50 px-1.5 py-0.5 rounded">
                                Blocked (Same Group)
                              </span>
                            ) : isAlreadyUsed ? (
                              <span className="text-[8px] font-bold text-amber-700 uppercase bg-amber-100/80 px-1.5 py-0.5 rounded">
                                Used in #{usedInRank}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold leading-tight">{spec}</span>
                            {!isDisabled && (
                              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Add Choice</span>
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          4. ALL 8 COMBINATIONS COMPLETED BANNER
      ========================================================================= */}
      {isAllEightRanked && (
        <div className="bg-[#ECFDF5] border-2 border-[#10B981]/40 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-[#10B981] text-white shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>All 8 Combinations Ranked</span>
              </span>
              <span className="text-xs text-[#047857] font-semibold">
                100% Full-Spectrum Coverage
              </span>
            </div>
            <h3 className="text-lg font-bold text-emerald-950">
              Feasibility lookahead guarantees you an immediate confirmed allocation!
            </h3>
            <p className="text-xs text-emerald-800 max-w-2xl leading-relaxed">
              Because you have ranked every possible valid medical/surgical permutation, AMH Kalmunai central allocation lookahead guarantees an immediate confirmed placement without ever entering the unassigned alternatives pool.
            </p>
          </div>

          {!isPreferencesLocked && (
            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#0D5C3A] hover:bg-[#09432A] text-white font-semibold text-xs transition shadow-xs shrink-0 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save 8/8 Preferences'}</span>
            </button>
          )}
        </div>
      )}

      {/* Bottom Information Tip */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-[#3B5BDB] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-800 font-semibold">Ministry of Health Sri Lanka Regulations:</strong>{' '}
          House Officers are mandated to complete exactly 1 Medical discipline (Medicine or Pediatrics) and 1 Surgical discipline (Surgery or Gyn &amp; Obs) across their 12-month internship. AMH Kalmunai central merit order guarantees strict compliance.
        </p>
      </div>
    </div>
  );
};
