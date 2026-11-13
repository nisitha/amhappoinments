'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { SpecialtyBadge } from '../common/SpecialtyBadge';
import { HOCandidateInput } from '@/lib/algorithms';
import {
  Users,
  PlayCircle,
  Edit2,
  Trash2,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  Search,
  Zap,
  Lock,
  Unlock
} from 'lucide-react';

export const CandidateReviewTable: React.FC = () => {
  const {
    candidates,
    runHOAllocation,
    editCandidate,
    removeCandidate,
    registerStudent,
    unlockStudentPreferences,
    hoSummary
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingCandidate, setEditingCandidate] = useState<HOCandidateInput | null>(null);
  const [editName, setEditName] = useState('');
  const [editRank, setEditRank] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addRank, setAddRank] = useState('');
  const [addPin, setAddPin] = useState('1234');
  const [addMobile, setAddMobile] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredCandidates = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.meritRank.toString() === searchQuery ||
      (c.mobileNumber && c.mobileNumber.includes(searchQuery))
  );

  const startEdit = (c: HOCandidateInput) => {
    setEditingCandidate(c);
    setEditName(c.name);
    setEditRank(c.meritRank.toString());
    setEditMobile(c.mobileNumber || '');
    setErrorMsg(null);
  };

  const handleSaveEdit = () => {
    if (!editingCandidate) return;
    const rankNum = parseInt(editRank, 10);
    const res = editCandidate(editingCandidate.id, editName, rankNum, editMobile);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to update candidate.');
    } else {
      setEditingCandidate(null);
    }
  };

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    const rankNum = parseInt(addRank, 10);
    const res = registerStudent(addName, rankNum, addPin, addMobile);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to add candidate.');
    } else {
      setShowAddModal(false);
      setAddName('');
      setAddRank('');
      setAddMobile('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#3B5BDB] border border-[#C5D2FB]">
              Candidate Roster
            </span>
            <span className="text-xs text-slate-500">Unique Merit Rank Constraint Enforced</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1.5">
            Registered House Officers &amp; Pre-Allocation Review
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Inspect, edit, or adjust candidate registrations. Verify rotation preferences prior to triggering official merit-order allocation.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={() => {
              setErrorMsg(null);
              setShowAddModal(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition border border-slate-200 shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#3B5BDB]" />
            <span>Add Candidate</span>
          </button>

          <button
            onClick={runHOAllocation}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-[#3B5BDB] hover:bg-[#2B4ACB] text-white text-xs font-semibold shadow-xs transition"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-white" />
            <span>Generate Allocations</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="relative max-w-sm w-full">
            <input
              type="text"
              placeholder="Search candidate name, rank, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#3B5BDB] transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2 pointer-events-none" />
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span>Showing <strong className="text-slate-900 tabular-nums">{filteredCandidates.length}</strong> of <span className="tabular-nums">{candidates.length}</span> candidates</span>
          </div>
        </div>

        {/* Candidate Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Merit Rank</th>
                <th className="py-3 px-4">Doctor Name</th>
                <th className="py-3 px-4">Choice #1</th>
                <th className="py-3 px-4">Choice #2</th>
                <th className="py-3 px-4">Choice #3</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    <Users className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                    <span className="font-semibold text-slate-700 block text-sm">No Registered Doctors Yet</span>
                    <span className="text-slate-400 mt-1 block max-w-sm mx-auto">
                      Doctors can self-register their merit rank on the Doctor Portal (<code className="text-slate-600 font-mono">/</code>) or you can manually add a doctor using the button above.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((cand) => {
                  const res = hoSummary?.results.find((r) => r.candidateId === cand.id);
                  const isGranted = res?.status === 'GRANTED';
                  const hasAlternatives = res?.status === 'ALTERNATIVES_AVAILABLE';

                  return (
                    <tr key={cand.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-4 font-mono font-bold text-[#3B5BDB] tabular-nums">
                      #{cand.meritRank}
                    </td>

                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900">{cand.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center space-x-1.5 tabular-nums">
                        <span>{cand.mobileNumber || 'No phone'}</span>
                        <span>•</span>
                        <span>PIN: ••••</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-4">
                      {cand.preferences && cand.preferences[0] ? (
                        <div className="flex items-center space-x-1">
                          <SpecialtyBadge specialty={cand.preferences[0].h1} size="sm" />
                          <span className="text-slate-400">→</span>
                          <SpecialtyBadge specialty={cand.preferences[0].h2} size="sm" />
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not set</span>
                      )}
                    </td>

                    <td className="py-2.5 px-4">
                      {cand.preferences && cand.preferences[1] ? (
                        <div className="flex items-center space-x-1">
                          <SpecialtyBadge specialty={cand.preferences[1].h1} size="sm" />
                          <span className="text-slate-400">→</span>
                          <SpecialtyBadge specialty={cand.preferences[1].h2} size="sm" />
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not set</span>
                      )}
                    </td>

                    <td className="py-2.5 px-4">
                      {cand.preferences && cand.preferences[2] ? (
                        <div>
                          <div className="flex items-center space-x-1">
                            <SpecialtyBadge specialty={cand.preferences[2].h1} size="sm" />
                            <span className="text-slate-400">→</span>
                            <SpecialtyBadge specialty={cand.preferences[2].h2} size="sm" />
                          </div>
                          {cand.preferences.length > 3 && (
                            <span className="text-[10px] text-[#3B5BDB] font-semibold block mt-0.5 font-mono">
                              +{cand.preferences.length - 3} more ranked ({cand.preferences.length} total)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not set</span>
                      )}
                    </td>

                    <td className="py-2.5 px-4">
                      {res ? (
                        isGranted ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-[#10B981]" />
                            Choice #{res.choiceRank}
                          </span>
                        ) : hasAlternatives ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]">
                            <AlertTriangle className="w-3 h-3 mr-1 text-[#F43F5E]" />
                            Alternatives Open
                          </span>
                        ) : null
                      ) : cand.isLocked ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]"
                          title={cand.submittedAt ? `Submitted & Locked: ${new Date(cand.submittedAt).toLocaleString()}` : 'Submitted & Locked'}
                        >
                          <Lock className="w-3 h-3 mr-1 text-[#10B981]" />
                          Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Draft
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {cand.isLocked && (
                          <button
                            onClick={() => unlockStudentPreferences(cand.id)}
                            className="p-1 rounded-md text-amber-600 hover:text-amber-800 hover:bg-amber-50 transition"
                            title="Unlock candidate preferences for re-editing"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => startEdit(cand)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
                          title="Edit candidate"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeCandidate(cand.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Remove candidate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Candidate Modal */}
      {editingCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Edit Candidate Information</h3>
              <button
                onClick={() => setEditingCandidate(null)}
                className="text-slate-400 hover:text-slate-900 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-[#FFF1F2] border border-[#FECDD3] text-xs text-[#BE123C] font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Doctor Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-[#3B5BDB]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">ERPM Merit Rank</label>
                <input
                  type="number"
                  min={1}
                  value={editRank}
                  onChange={(e) => setEditRank(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-[#3B5BDB]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile Contact</label>
                <input
                  type="tel"
                  placeholder="e.g. 077 123 4567"
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-[#3B5BDB]"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3">
              <button
                onClick={() => setEditingCandidate(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3.5 py-1.5 rounded-lg bg-[#3B5BDB] hover:bg-[#2B4ACB] text-white text-xs font-semibold shadow-xs transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Add Candidate Manually</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-900 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-[#FFF1F2] border border-[#FECDD3] text-xs text-[#BE123C] font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddCandidate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Doctor Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Kasun Perera"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-[#3B5BDB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Merit Rank</label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="e.g. 425"
                    value={addRank}
                    onChange={(e) => setAddRank(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-[#3B5BDB]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={addPin}
                    onChange={(e) => setAddPin(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono tracking-widest text-center text-slate-900 focus:outline-hidden focus:border-[#3B5BDB]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile Contact Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 077 123 4567"
                  value={addMobile}
                  onChange={(e) => setAddMobile(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-[#3B5BDB]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-[#3B5BDB] hover:bg-[#2B4ACB] text-white text-xs font-semibold shadow-xs transition"
                >
                  Add to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
