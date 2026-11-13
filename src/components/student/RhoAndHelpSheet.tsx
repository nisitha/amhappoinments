'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { SpecialtyBadge } from '../common/SpecialtyBadge';
import { AMH_HOSPITAL_DETAILS } from '@/lib/utils/rotationDates';
import { Specialty, getEligibleRHO3MonthSpecialties } from '@/lib/algorithms';
import {
  Phone,
  Mail,
  MapPin,
  Sparkles,
  CheckCircle2,
  Stethoscope,
  Building2,
  Calendar,
  Save,
  ShieldCheck
} from 'lucide-react';

export const RhoAndHelpSheet: React.FC = () => {
  const { currentStudent, rhoCandidates, updateRHOCandidateChoices, currentStudentMilestones } = useApp();

  const currentRho = rhoCandidates.find((c) => c.id === currentStudent?.id);

  const eligible: [Specialty, Specialty] = currentRho?.completedHOSpecialties
    ? getEligibleRHO3MonthSpecialties(currentRho.completedHOSpecialties)
    : ['Medicine', 'Surgery'];

  const eligible1 = eligible[0];
  const eligible2 = eligible[1];

  const [choice1, setChoice1] = useState<Specialty>(currentRho?.rankedChoices[0] || eligible1);
  const [choice2, setChoice2] = useState<Specialty>(currentRho?.rankedChoices[1] || eligible2);
  const [saved, setSaved] = useState(false);

  const handleSaveRho = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStudent) {
      updateRHOCandidateChoices(currentStudent.id, [choice1, choice2]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* =========================================================================
          LEFT: STAGE 2 & STAGE 3 RHO PREFERENCES (lg:col-span-7)
      ========================================================================= */}
      <div className="lg:col-span-7 space-y-6">
        {/* Stage 2: RHO 3-Month Choices Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 space-y-5">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#3B5BDB] border border-[#C5D2FB]">
              Stage 2 RHO Rotation
            </span>
            <span className="text-xs text-slate-400">Post-Internship</span>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              RHO Initial 3-Month Preferences
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Upon completing your 12-month House Officer internship, select your preference between your remaining 2 uncompleted specialties for the mandatory 3-month Senior House Officer term.
            </p>
          </div>

          {/* Active Milestone Term Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#3B5BDB]" />
              <span className="text-slate-600 font-medium">Scheduled Term Window:</span>
            </div>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {currentStudentMilestones.rho3Month.startFormatted} – {currentStudentMilestones.rho3Month.endFormatted}
            </span>
          </div>

          <form onSubmit={handleSaveRho} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  1st Preference (Primary)
                </label>
                <select
                  value={choice1}
                  onChange={(e) => {
                    const next1 = e.target.value as Specialty;
                    setChoice1(next1);
                    setChoice2(next1 === eligible1 ? eligible2 : eligible1);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-[#3B5BDB]"
                >
                  <option value={eligible1}>{eligible1}</option>
                  <option value={eligible2}>{eligible2}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  2nd Preference (Alternate)
                </label>
                <input
                  type="text"
                  readOnly
                  value={choice2}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Auto-assigned by All-Island Merit Order &amp; Downstream Feasibility
              </span>

              <button
                type="submit"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#3B5BDB] hover:bg-[#2B4ACB] active:scale-[0.98] text-white text-xs font-semibold transition shadow-xs"
              >
                {saved ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                <span>{saved ? 'Preferences Saved!' : 'Save RHO Choices'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Stage 3: Hospital Units Overview Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
              Stage 3 Unit Matching
            </span>
            <span className="text-xs text-slate-400">Consultant Teams</span>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">
              AMH Kalmunai Clinical Units &amp; Consultant Terms
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Following the initial 3-month rotation, House Officers are assigned to hospital wards under Supervising Consultants. Unit matching is executed via a two-sided mutual matching mechanism (Consultant preference rankings + Doctor merit order).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Unit Posting Start Date:</span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              Starts {currentStudentMilestones.rhoUnit.startFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT: HOSPITAL HELP & CONTACTS DIRECTORY (lg:col-span-5)
      ========================================================================= */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 space-y-5">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D5C3A] to-[#107C41] flex items-center justify-center text-white font-black text-sm shadow-xs ring-1 ring-emerald-600/30">
              AMH
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ashraff Memorial Hospital
              </h3>
              <p className="text-xs text-slate-500">
                Kalmunai • Ministry of Health, Sri Lanka
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Direct Telephone Contact Lines:
            </span>

            {AMH_HOSPITAL_DETAILS.telephones.map((tel, idx) => (
              <a
                key={idx}
                href={tel.telUrl}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 hover:border-[#3B5BDB] hover:bg-slate-100/70 transition"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#3B5BDB] shadow-2xs border border-slate-200">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">{tel.label}</span>
                    <span className="text-[10px] text-slate-400">Tap to call</span>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-[#3B5BDB] tabular-nums">
                  {tel.number}
                </span>
              </a>
            ))}

            <a
              href={AMH_HOSPITAL_DETAILS.emailUrl}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 hover:border-[#3B5BDB] hover:bg-slate-100/70 transition"
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-600 shadow-2xs border border-slate-200">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">Official Inquiries</span>
                  <span className="text-[10px] text-slate-400">Documentation &amp; HR</span>
                </div>
              </div>
              <span className="text-xs font-bold text-[#3B5BDB]">
                {AMH_HOSPITAL_DETAILS.email}
              </span>
            </a>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-2 text-xs text-slate-500">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{AMH_HOSPITAL_DETAILS.address}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
