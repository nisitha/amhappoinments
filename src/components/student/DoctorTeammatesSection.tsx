'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { SpecialtyBadge } from '../common/SpecialtyBadge';
import {
  Users,
  Calendar,
  Phone,
  ShieldCheck,
  Award,
  Sparkles,
  Stethoscope,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export const DoctorTeammatesSection: React.FC = () => {
  const {
    currentStudent,
    currentStudentResult,
    hoSummary,
    candidates,
    currentStudentMilestones,
    isLiveSyncing
  } = useApp();

  // Only display section groups once the doctor has a confirmed GRANTED rotation allocation
  if (
    !currentStudent ||
    !currentStudentResult ||
    currentStudentResult.status !== 'GRANTED' ||
    !currentStudentResult.assignedPair
  ) {
    return null;
  }

  const assigned = currentStudentResult.assignedPair;
  const myH1 = assigned.h1;
  const myH2 = assigned.h2;

  // Filter and sort teammates for H1 and H2 by ascending merit rank
  const allResults = hoSummary?.results || [];

  const h1Teammates = allResults
    .filter((r) => r.status === 'GRANTED' && r.assignedPair?.h1 === myH1)
    .sort((a, b) => a.meritRank - b.meritRank);

  const h2Teammates = allResults
    .filter((r) => r.status === 'GRANTED' && r.assignedPair?.h2 === myH2)
    .sort((a, b) => a.meritRank - b.meritRank);

  // Helper to look up candidate mobile number
  const getCandidatePhone = (candidateId: string): string => {
    const cand = candidates.find((c) => c.id === candidateId);
    return cand?.mobileNumber?.trim() || '';
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
              <Users className="w-3.5 h-3.5" />
              <span>Ward Roster Cohort</span>
            </span>
            <div
              className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                isLiveSyncing
                  ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isLiveSyncing ? 'bg-[#10B981] animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span>Live Realtime Sync</span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>My Allocated Section Groups (Live Team)</span>
          </h2>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            Real-time clinical teammates sharing your ward postings at Ashraff Memorial Hospital Kalmunai. Sorted strictly by ERPM merit order and synchronized live across all active sessions.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs text-slate-700 font-semibold shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-[#0D5C3A]" />
          <span>MOH Official Deployment</span>
        </div>
      </div>

      {/* 2-Column Responsive Cards: H1 Teammates & H2 Teammates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* =====================================================================
            CARD 1: 1st 6 MONTHS (H1) TEAMMATES
        ===================================================================== */}
        <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-xs">
          {/* Card Top Banner */}
          <div className="p-4 sm:p-5 bg-white border-b border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3B5BDB]" />
                1st 6 Months (H1)
              </span>
              <span className="text-[11px] font-mono font-bold text-[#3B5BDB] bg-[#EEF2FF] border border-[#C5D2FB] px-2.5 py-0.5 rounded-md">
                Month 1–6
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <SpecialtyBadge specialty={myH1} size="lg" showGroup={true} />
              </div>

              <div className="flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {currentStudentMilestones.h1.startFormatted} – {currentStudentMilestones.h1.endFormatted}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Primary Internship Posting</span>
              <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                {h1Teammates.length} {h1Teammates.length === 1 ? 'Doctor' : 'Doctors'} Allocated
              </span>
            </div>
          </div>

          {/* Doctors Table */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-4 w-16">Rank</th>
                  <th className="py-2.5 px-4">House Officer</th>
                  <th className="py-2.5 px-4 text-right">Mobile Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 bg-white">
                {h1Teammates.map((teammate) => {
                  const isMe = teammate.candidateId === currentStudent.id;
                  const phone = getCandidatePhone(teammate.candidateId);

                  return (
                    <tr
                      key={teammate.candidateId}
                      className={`transition ${
                        isMe
                          ? 'bg-[#EEF2FF]/60 font-semibold'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Merit Rank */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${
                            isMe
                              ? 'bg-[#3B5BDB] text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          #{teammate.meritRank}
                        </span>
                      </td>

                      {/* Doctor Name & "You" Badge */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-semibold text-slate-900 ${
                              isMe ? 'text-[#3B5BDB] font-bold' : ''
                            }`}
                          >
                            {teammate.candidateName}
                          </span>
                          {isMe && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#3B5BDB] text-white shadow-2xs">
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Phone Contact */}
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        {phone ? (
                          <a
                            href={`tel:${phone}`}
                            className="inline-flex items-center space-x-1.5 text-slate-700 hover:text-[#3B5BDB] font-mono text-[11px] font-medium bg-slate-50 hover:bg-[#EEF2FF] px-2.5 py-1 rounded-lg border border-slate-200 hover:border-[#C5D2FB] transition"
                            title={`Call ${teammate.candidateName}`}
                          >
                            <Phone className="w-3 h-3 text-[#3B5BDB]" />
                            <span>{phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            No phone
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {h1Teammates.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">
                      No doctors allocated to this section yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Card Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Ward Roster Confirmed</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Half 1 • 6 Months
            </span>
          </div>
        </div>

        {/* =====================================================================
            CARD 2: 2nd 6 MONTHS (H2) TEAMMATES
        ===================================================================== */}
        <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-xs">
          {/* Card Top Banner */}
          <div className="p-4 sm:p-5 bg-white border-b border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
                2nd 6 Months (H2)
              </span>
              <span className="text-[11px] font-mono font-bold text-[#F43F5E] bg-[#FFF1F2] border border-[#FECDD3] px-2.5 py-0.5 rounded-md">
                Month 7–12
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <SpecialtyBadge specialty={myH2} size="lg" showGroup={true} />
              </div>

              <div className="flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {currentStudentMilestones.h2.startFormatted} – {currentStudentMilestones.h2.endFormatted}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Complementary Internship Posting</span>
              <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                {h2Teammates.length} {h2Teammates.length === 1 ? 'Doctor' : 'Doctors'} Allocated
              </span>
            </div>
          </div>

          {/* Doctors Table */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-4 w-16">Rank</th>
                  <th className="py-2.5 px-4">House Officer</th>
                  <th className="py-2.5 px-4 text-right">Mobile Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 bg-white">
                {h2Teammates.map((teammate) => {
                  const isMe = teammate.candidateId === currentStudent.id;
                  const phone = getCandidatePhone(teammate.candidateId);

                  return (
                    <tr
                      key={teammate.candidateId}
                      className={`transition ${
                        isMe
                          ? 'bg-[#EEF2FF]/60 font-semibold'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Merit Rank */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${
                            isMe
                              ? 'bg-[#3B5BDB] text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          #{teammate.meritRank}
                        </span>
                      </td>

                      {/* Doctor Name & "You" Badge */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-semibold text-slate-900 ${
                              isMe ? 'text-[#3B5BDB] font-bold' : ''
                            }`}
                          >
                            {teammate.candidateName}
                          </span>
                          {isMe && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#3B5BDB] text-white shadow-2xs">
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Phone Contact */}
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        {phone ? (
                          <a
                            href={`tel:${phone}`}
                            className="inline-flex items-center space-x-1.5 text-slate-700 hover:text-[#3B5BDB] font-mono text-[11px] font-medium bg-slate-50 hover:bg-[#EEF2FF] px-2.5 py-1 rounded-lg border border-slate-200 hover:border-[#C5D2FB] transition"
                            title={`Call ${teammate.candidateName}`}
                          >
                            <Phone className="w-3 h-3 text-[#3B5BDB]" />
                            <span>{phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            No phone
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {h2Teammates.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">
                      No doctors allocated to this section yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Card Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Ward Roster Confirmed</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Half 2 • 6 Months
            </span>
          </div>
        </div>
      </div>

      {/* Team Coordination Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-3 text-xs text-slate-600">
        <Stethoscope className="w-4 h-4 text-[#0D5C3A] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-800 font-semibold">Clinical Duty Coordination:</strong>{' '}
          Please connect with your unit colleagues above prior to rotation orientation. On-call rosters, clinical unit assignments, and handover schedules are managed collaboratively under the supervision of the respective Clinical Consultant and Chief Resident at AMH Kalmunai.
        </p>
      </div>
    </section>
  );
};
