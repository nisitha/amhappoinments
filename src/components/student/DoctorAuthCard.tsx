'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { AmhLogo } from '../common/AmhLogo';
import { AMH_HOSPITAL_DETAILS } from '@/lib/utils/rotationDates';
import {
  Stethoscope,
  LogIn,
  UserPlus,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  Lock,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const DoctorAuthCard: React.FC = () => {
  const { registerStudent, loginStudent, openIntakes, intakes, activeIntakeId, allCandidates, isLiveSyncing } = useApp();
  const [mode, setMode] = useState<'register' | 'login'>('register');

  // Selected intake for registration/login
  const [selectedIntakeId, setSelectedIntakeId] = useState<string>(
    openIntakes[0]?.id || activeIntakeId || 'intake-2026-nov'
  );

  const effectiveIntakeId = openIntakes.some((i) => i.id === selectedIntakeId)
    ? selectedIntakeId
    : openIntakes[0]?.id || activeIntakeId || 'intake-2026-nov';

  const targetIntake = intakes.find((i) => i.id === effectiveIntakeId) || intakes[0];
  const isTargetOpen = targetIntake?.status === 'open';

  // Headcount capacity for the selected intake
  const registeredCount = allCandidates.filter(
    (c) => (c.intakeId || 'intake-2026-nov') === effectiveIntakeId
  ).length;
  const isCapacityReached = targetIntake ? registeredCount >= targetIntake.totalHOs : false;

  // Registration State
  const [regName, setRegName] = useState('');
  const [regRank, setRegRank] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regError, setRegError] = useState<string | null>(null);

  // Login State
  const [loginRank, setLoginRank] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const rankNum = parseInt(regRank, 10);
    if (isNaN(rankNum) || rankNum < 1) {
      setRegError('Please enter a valid Merit Rank (1 or greater).');
      return;
    }

    if (targetIntake && registeredCount >= targetIntake.totalHOs) {
      setRegError(
        `This intake has reached its maximum capacity of ${targetIntake.totalHOs} House Officers. Please contact AMH Kalmunai Administration.`
      );
      return;
    }

    if (!regPin || regPin.length !== 4 || !/^\d{4}$/.test(regPin)) {
      setRegError('4-Digit PIN must be exactly 4 numeric digits.');
      return;
    }

    const result = registerStudent(regName, rankNum, regPin, regMobile, effectiveIntakeId);
    if (!result.success) {
      setRegError(result.error || 'Registration failed.');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const rankNum = parseInt(loginRank, 10);
    if (isNaN(rankNum) || rankNum < 1) {
      setLoginError('Please enter your valid ERPM Merit Rank.');
      return;
    }

    const result = loginStudent(rankNum, loginPin, effectiveIntakeId);
    if (!result.success) {
      setLoginError(result.error || 'Login failed. Please verify your credentials.');
    }
  };

  // If no open intake and in register mode, show the official hospital notice
  const showClosedNotice = openIntakes.length === 0 && mode === 'register';

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-3xl shadow-card border border-[#E2E8F0]/80 overflow-hidden">
        {/* App Header Banner */}
        <div className="bg-gradient-to-br from-[#0D5C3A] via-[#107C41] to-[#0D5C3A] p-6 text-white text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mx-auto flex items-center justify-center mb-3 shadow-inner">
            <Stethoscope className="w-6 h-6 text-[#FEF7E0]" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FEF7E0]/90 block">
            Ministry of Health — Sri Lanka
          </span>
          <h1 className="text-xl font-black tracking-tight mt-0.5">
            Ashraff Memorial Hospital
          </h1>
          <p className="text-xs text-white/80 font-medium mt-0.5">
            Kalmunai • HO &amp; RHO Rotation Portal
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 backdrop-blur-sm border border-white/20">
              <Calendar className="w-3.5 h-3.5 text-[#FEF7E0]" />
              <span>
                {targetIntake ? targetIntake.name : 'Active Cohort'}{' '}
                <span className="font-mono text-white/90">({registeredCount}/{targetIntake?.totalHOs || 0} Filled)</span>
              </span>
            </div>

            <div
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm border ${
                isLiveSyncing
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-200 border-amber-400/30'
              }`}
              title={isLiveSyncing ? 'Realtime Database Sync Active' : 'Connecting to database...'}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isLiveSyncing ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>{isLiveSyncing ? 'Live Sync' : 'Connecting'}</span>
            </div>
          </div>
        </div>

        {/* Closed Notice Screen */}
        {showClosedNotice ? (
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-[#FEF7E0] border border-[#F7C948]/40 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#F7C948]/20 flex items-center justify-center text-[#B8870A] mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#1B2559]">
                HO Self-Registration is Currently Closed
              </h3>
              <p className="text-xs text-[#8F9BBA] leading-relaxed">
                Registration will open once official appointment letters are published by the Ministry of Health.
              </p>
            </div>

            {/* Hospital Contact Info Sheet */}
            <div className="bg-[#F4F7FE] rounded-2xl p-4 border border-[#E2E8F0] space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#1B2559] uppercase tracking-wider">
                <Phone className="w-3.5 h-3.5 text-[#3B5BDB]" />
                <span>Hospital Administration Contacts</span>
              </div>

              <div className="space-y-2 text-xs">
                {AMH_HOSPITAL_DETAILS.telephones.map((tel, idx) => (
                  <a
                    key={idx}
                    href={tel.telUrl}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#1B2559] hover:border-[#3B5BDB] transition font-medium"
                  >
                    <span>{tel.label}</span>
                    <span className="font-bold text-[#3B5BDB]">{tel.number}</span>
                  </a>
                ))}

                <a
                  href={AMH_HOSPITAL_DETAILS.emailUrl}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#1B2559] hover:border-[#3B5BDB] transition font-medium"
                >
                  <span className="flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#8F9BBA]" />
                    <span>General Email</span>
                  </span>
                  <span className="font-bold text-[#3B5BDB]">{AMH_HOSPITAL_DETAILS.email}</span>
                </a>
              </div>

              <div className="pt-2 text-[11px] text-[#8F9BBA] flex items-start space-x-1.5 border-t border-[#E2E8F0]/70">
                <MapPin className="w-3.5 h-3.5 text-[#8F9BBA] shrink-0 mt-0.5" />
                <span>{AMH_HOSPITAL_DETAILS.address}</span>
              </div>
            </div>

            <button
              onClick={() => setMode('login')}
              className="w-full min-h-[50px] py-3 rounded-2xl bg-[#3B5BDB] hover:bg-[#2B4ACB] active:scale-[0.98] text-white text-xs font-bold transition flex items-center justify-center space-x-2 shadow-soft"
            >
              <LogIn className="w-4 h-4" />
              <span>Already Registered? Sign In with PIN</span>
            </button>
          </div>
        ) : (
          /* Normal Auth Tabs: Register vs. Login */
          <div className="p-6">
            {/* Tab Switcher */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#F4F7FE] mb-6">
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  mode === 'register'
                    ? 'bg-white text-[#1B2559] shadow-soft'
                    : 'text-[#8F9BBA] hover:text-[#1B2559]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New Doctor</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                  mode === 'login'
                    ? 'bg-white text-[#1B2559] shadow-soft'
                    : 'text-[#8F9BBA] hover:text-[#1B2559]'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>

            {/* Target Intake Selector (if multiple available) */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-[#1B2559] mb-1">
                Select Appointment Intake
              </label>
              <select
                value={selectedIntakeId}
                onChange={(e) => setSelectedIntakeId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#F4F7FE] border border-[#E2E8F0] text-[#1B2559] focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]"
              >
                {intakes.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name} {it.status === 'open' ? '(Open)' : '(Closed)'}
                  </option>
                ))}
              </select>
            </div>

            {/* REGISTER FORM */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                {isCapacityReached && (
                  <div className="p-3.5 rounded-xl bg-[#FEF7E0] border border-[#F7C948]/40 text-xs text-[#B8870A] font-semibold flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      This intake has reached its maximum capacity of {targetIntake.totalHOs} House Officers. If you have already registered, please switch to <strong>Sign In</strong>.
                    </span>
                  </div>
                )}

                {regError && (
                  <div className="p-3 rounded-xl bg-[#FEECEC] border border-[#F66B6B]/20 text-xs text-[#F66B6B] font-semibold flex items-start space-x-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{regError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#1B2559] mb-1">
                    Doctor Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Kasun Perera"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl text-xs bg-[#F4F7FE] border border-[#E2E8F0] text-[#1B2559] focus:outline-none focus:ring-2 focus:ring-[#5A9BF6]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1B2559] mb-1">
                      ERPM Merit Rank
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="e.g. 425"
                      value={regRank}
                      onChange={(e) => setRegRank(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl text-xs font-mono font-bold bg-[#F4F7FE] border border-[#E2E8F0] text-[#1B2559] focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1B2559] mb-1">
                      4-Digit Secret PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      placeholder="••••"
                      value={regPin}
                      onChange={(e) => setRegPin(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl text-xs font-mono text-center tracking-widest bg-[#F4F7FE] border border-[#E2E8F0] text-[#1B2559] focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1B2559] mb-1">
                    Mobile Contact Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 077 123 4567"
                    value={regMobile}
                    onChange={(e) => setRegMobile(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl text-xs bg-[#F4F7FE] border border-[#E2E8F0] text-[#1B2559] focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]"
                  />
                  <span className="text-[10px] text-[#8F9BBA] mt-0.5 block">
                    Used for peer mutual rotation swap coordination
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={!isTargetOpen || isCapacityReached}
                  className={`w-full min-h-[52px] py-3.5 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-soft mt-2 ${
                    isTargetOpen && !isCapacityReached
                      ? 'bg-[#3B5BDB] hover:bg-[#2B4ACB] active:scale-[0.98] text-white'
                      : 'bg-[#E2E8F0] text-[#8F9BBA] cursor-not-allowed'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {!isTargetOpen
                      ? 'Registration Closed for this Intake'
                      : isCapacityReached
                      ? `Intake Full (${targetIntake.totalHOs} HOs Registered)`
                      : 'Complete Registration & Rank Choices'}
                  </span>
                </button>
              </form>
            )}

            {/* LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <div className="p-3 rounded-xl bg-[#FEECEC] border border-[#F66B6B]/20 text-xs text-[#F66B6B] font-semibold flex items-start space-x-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#1B2559] mb-1">
                    Your Registered ERPM Merit Rank
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="e.g. 425"
                    value={loginRank}
                    onChange={(e) => setLoginRank(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl text-sm font-mono font-bold bg-[#F4F7FE] border border-[#E2E8F0] text-[#1B2559] focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1B2559] mb-1">
                    4-Digit Personal PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="••••"
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl text-sm font-mono text-center tracking-widest bg-[#F4F7FE] border border-[#E2E8F0] text-[#1B2559] focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[52px] py-3.5 rounded-2xl bg-[#3B5BDB] hover:bg-[#2B4ACB] active:scale-[0.98] text-white text-xs font-bold transition flex items-center justify-center space-x-2 shadow-soft mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Access Doctor Dashboard</span>
                </button>
              </form>
            )}

            {/* Direct Hospital Contact Footer */}
            <div className="mt-6 pt-4 border-t border-[#E2E8F0]/70 text-center text-[11px] text-[#8F9BBA] space-y-1">
              <p className="font-semibold text-[#1B2559]">Need Assistance?</p>
              <p>
                Hospital Administration:{' '}
                <a href="tel:0672229496" className="font-bold text-[#3B5BDB] hover:underline">
                  067 222 9496
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
