'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { SpecialtyBadge } from '../common/SpecialtyBadge';
import {
  KeyRound,
  CheckCircle2,
  Sparkles,
  Award,
  Users,
  ShieldCheck,
  Star,
  Save,
  Lock,
  ChevronRight,
  LogOut
} from 'lucide-react';

interface ConsultantPortalProps {
  initialPin?: string;
}

export const ConsultantPortal: React.FC<ConsultantPortalProps> = ({ initialPin }) => {
  const {
    units,
    candidates,
    rhoCandidates,
    consultantPrefs,
    selectedConsultantPin,
    setSelectedConsultantPin,
    submitConsultantPicks,
    showToast
  } = useApp();

  const [pinInput, setPinInput] = useState(initialPin || selectedConsultantPin || '');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (!initialPin) return false;
    return units.some((u) => u.magicPin === initialPin.trim());
  });

  // Authenticate by PIN
  const matchedUnit = useMemo(() => {
    return units.find((u) => u.magicPin === pinInput.trim());
  }, [units, pinInput]);

  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>(() => {
    if (!initialPin) return [];
    const unit = units.find((u) => u.magicPin === initialPin.trim());
    if (!unit) return [];
    const existing = consultantPrefs.find((p) => p.unitId === unit.unitId);
    return existing ? existing.rankedCandidateIds : [];
  });

  // When unit authenticates, load existing selections if any
  const handleLogin = (pinToUse?: string) => {
    const pin = pinToUse || pinInput;
    const unit = units.find((u) => u.magicPin === pin.trim());
    if (unit) {
      setIsAuthenticated(true);
      const existing = consultantPrefs.find((p) => p.unitId === unit.unitId);
      setSelectedCandidateIds(existing ? existing.rankedCandidateIds : []);
      showToast(`Welcome, ${unit.consultantName}! Frictionless PIN verified.`);
    } else {
      showToast('Invalid 4-Digit Consultant PIN.');
    }
  };

  const handleToggleCandidate = (candidateId: string) => {
    setSelectedCandidateIds((prev) => {
      if (prev.includes(candidateId)) {
        return prev.filter((id) => id !== candidateId);
      } else {
        return [...prev, candidateId];
      }
    });
  };

  const handleSavePicks = () => {
    if (!matchedUnit) return;
    submitConsultantPicks(matchedUnit.unitId, selectedCandidateIds);
    showToast(`Saved ${selectedCandidateIds.length} candidate preference(s) for ${matchedUnit.unitName}.`);
  };

  // Filter candidate pool: doctors rotating into this specialty
  const eligibleCandidates = useMemo(() => {
    if (!matchedUnit) return [];
    return candidates.filter((c) => {
      const rhoInfo = rhoCandidates.find((r) => r.id === c.id);
      return rhoInfo?.rankedChoices.includes(matchedUnit.specialty) ?? true;
    });
  }, [candidates, rhoCandidates, matchedUnit]);

  if (!isAuthenticated || !matchedUnit) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-2xl bg-white border border-[#F4F7FE] shadow-card">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#FEF7E0] text-[#B8870A] flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#1B2559]">Consultant Frictionless Access</h2>
          <p className="text-xs text-[#8F9BBA] mt-1">
            Zero password or registration required. Enter your departmental 4-digit Magic PIN.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#8F9BBA] block mb-1.5">
              Enter 4-Digit Departmental PIN
            </label>
            <input
              type="text"
              maxLength={4}
              placeholder="e.g. 1001"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full text-center text-2xl font-mono tracking-widest px-4 py-3 rounded-xl bg-[#F4F7FE] border border-[#E2E8F0] text-[#1B2559] focus:outline-hidden focus:border-[#5A9BF6] font-bold"
            />
          </div>

          <button
            onClick={() => handleLogin()}
            className="w-full py-3 rounded-xl bg-[#5A9BF6] hover:bg-[#4385E8] text-white text-xs font-bold transition shadow-soft"
          >
            Access RHO Candidate Pool
          </button>

          {/* Quick Demo Selector */}
          <div className="pt-4 border-t border-[#F4F7FE]">
            <span className="text-[11px] font-bold text-[#8F9BBA] block mb-2">
              Department Demo PINs:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {units.slice(0, 4).map((u) => (
                <button
                  key={u.unitId}
                  onClick={() => {
                    setPinInput(u.magicPin);
                    handleLogin(u.magicPin);
                  }}
                  className="p-2.5 rounded-xl bg-[#F4F7FE] hover:bg-[#EBF3FE] text-left border border-[#E2E8F0] transition"
                >
                  <span className="font-mono text-[#5A9BF6] font-bold block">{u.magicPin}</span>
                  <span className="text-[10px] text-[#1B2559] truncate block font-semibold">{u.consultantName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Consultant Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-white border border-[#F4F7FE] shadow-soft">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF7E0] text-[#B8870A] border border-[#FCEBB8]">
              ONE-TIME MAGIC LINK AUTHENTICATED
            </span>
            <span className="text-xs text-[#8F9BBA]">Department of Health</span>
          </div>
          <h2 className="text-2xl font-black text-[#1B2559] mt-1.5">
            {matchedUnit.consultantName}
          </h2>
          <div className="flex items-center space-x-3 mt-1 text-xs text-[#8F9BBA]">
            <span className="font-bold text-[#1B2559]">{matchedUnit.unitName}</span>
            <span>•</span>
            <SpecialtyBadge specialty={matchedUnit.specialty} size="sm" />
            <span>•</span>
            <span className="font-mono font-bold text-[#5A9BF6]">
              Slot Capacity: {matchedUnit.capacity} Doctors
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSavePicks}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#5A9BF6] hover:bg-[#4385E8] text-white text-xs font-bold shadow-soft transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Unit Selections ({selectedCandidateIds.length})</span>
          </button>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="p-2.5 rounded-xl bg-[#F4F7FE] hover:bg-[#FEECEC] text-[#8F9BBA] hover:text-[#F66B6B] transition border border-[#E2E8F0]"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Matching Rules Info */}
      <div className="p-4 rounded-xl bg-white border border-[#F4F7FE] shadow-soft text-xs text-[#8F9BBA] flex items-start space-x-3">
        <Sparkles className="w-4 h-4 text-[#5A9BF6] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#1B2559]">Merit-Prioritized Stable Matching: </span>
          <span>
            Select and rank your preferred candidates. If you select more candidates than your unit capacity ({matchedUnit.capacity}),
            slots are awarded strictly by <strong className="text-[#5A9BF6]">RHO Official Merit Order</strong>. Unmatched slots are filled via candidate merit preferences.
          </span>
        </div>
      </div>

      {/* Candidate Pool */}
      <div className="bg-white rounded-2xl shadow-soft p-6 border border-[#F4F7FE] space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#1B2559] uppercase tracking-wider">
            Available Candidate Pool for {matchedUnit.specialty} ({eligibleCandidates.length} Doctors)
          </span>
          <span className="text-xs text-[#5A9BF6] font-mono font-bold">
            {selectedCandidateIds.length} Selected of {matchedUnit.capacity} Slots
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {eligibleCandidates.map((cand) => {
            const isSelected = selectedCandidateIds.includes(cand.id);
            const selectionIndex = selectedCandidateIds.indexOf(cand.id);

            return (
              <div
                key={cand.id}
                onClick={() => handleToggleCandidate(cand.id)}
                className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#EBF3FE]/70 border-[#5A9BF6] shadow-soft'
                    : 'bg-[#F4F7FE]/60 border-[#E2E8F0] hover:bg-[#F4F7FE]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                      isSelected
                        ? 'bg-[#5A9BF6] text-white'
                        : 'bg-white text-[#8F9BBA] border border-[#E2E8F0]'
                    }`}
                  >
                    #{cand.meritRank}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-[#1B2559]">{cand.name}</h4>
                    <span className="text-[11px] text-[#8F9BBA]">
                      ERPM Merit Rank #{cand.meritRank}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isSelected ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-[#5A9BF6] border border-[#D6E7FD]">
                      <Star className="w-3.5 h-3.5 fill-[#5A9BF6] text-[#5A9BF6]" />
                      <span>Rank #{selectionIndex + 1}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-[#8F9BBA] hover:text-[#5A9BF6]">
                      Click to Select
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
