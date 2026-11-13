'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { AMH_HOSPITAL_DETAILS } from '@/lib/utils/rotationDates';
import {
  Stethoscope,
  LogIn,
  UserPlus,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  Clock,
  Lock
} from 'lucide-react';

export const DoctorAuthCard: React.FC = () => {
  const {
    registerStudent,
    loginStudent,
    openIntakes,
    intakes,
    activeIntakeId,
    allCandidates,
    isLiveSyncing,
    getRegistrationCountdown
  } = useApp();

  // Mode: Default to 'login' if no intakes are open within 48 hours, otherwise 'register'
  const [mode, setMode] = useState<'register' | 'login'>(() => {
    return openIntakes.length > 0 ? 'register' : 'login';
  });

  // Switch to login if no open intakes exist
  useEffect(() => {
    if (openIntakes.length === 0) {
      setMode('login');
    }
  }, [openIntakes.length]);

  // Selected intake for registration (strictly open & within 48h)
  const [selectedRegIntakeId, setSelectedRegIntakeId] = useState<string>(
    openIntakes[0]?.id || ''
  );

  // Sync selectedRegIntakeId when openIntakes changes
  useEffect(() => {
    if (openIntakes.length > 0 && !openIntakes.some((i) => i.id === selectedRegIntakeId)) {
      setSelectedRegIntakeId(openIntakes[0].id);
    }
  }, [openIntakes, selectedRegIntakeId]);

  // Selected intake for login (any registered intake in the system)
  const [selectedLoginIntakeId, setSelectedLoginIntakeId] = useState<string>(
    activeIntakeId || intakes[0]?.id || ''
  );

  useEffect(() => {
    if (intakes.length > 0 && !intakes.some((i) => i.id === selectedLoginIntakeId)) {
      setSelectedLoginIntakeId(intakes[0].id);
    }
  }, [intakes, selectedLoginIntakeId]);

  // Target intake for the currently active tab
  const currentTargetIntake = useMemo(() => {
    if (mode === 'register') {
      return openIntakes.find((i) => i.id === selectedRegIntakeId) || openIntakes[0];
    }
    return intakes.find((i) => i.id === selectedLoginIntakeId) || intakes[0];
  }, [mode, openIntakes, selectedRegIntakeId, intakes, selectedLoginIntakeId]);

  // Headcount capacity for the target intake
  const registeredCount = useMemo(() => {
    if (!currentTargetIntake) return 0;
    return allCandidates.filter(
      (c) => (c.intakeId || 'none') === currentTargetIntake.id
    ).length;
  }, [allCandidates, currentTargetIntake]);

  const isCapacityReached = currentTargetIntake
    ? registeredCount >= currentTargetIntake.totalHOs
    : false;

  // Countdown timer for registration
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const regCountdown = useMemo(() => {
    if (!currentTargetIntake?.registrationClosesAt) {
      return { isExpired: false, text: 'Open for Registration', shortText: 'Open' };
    }
    return getRegistrationCountdown(currentTargetIntake.registrationClosesAt);
  }, [currentTargetIntake?.registrationClosesAt, getRegistrationCountdown, now]);

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regRank, setRegRank] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regError, setRegError] = useState<string | null>(null);

  // Login Form State
  const [loginRank, setLoginRank] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!currentTargetIntake) {
      setRegError('No open intake is available for registration.');
      return;
    }

    const rankNum = parseInt(regRank, 10);
    if (isNaN(rankNum) || rankNum < 1) {
      setRegError('Please enter a valid Merit Rank (1 or greater).');
      return;
    }

    if (registeredCount >= currentTargetIntake.totalHOs) {
      setRegError(
        `This intake has reached its maximum capacity of ${currentTargetIntake.totalHOs} House Officers. Please contact AMH Kalmunai Administration.`
      );
      return;
    }

    if (!regPin || regPin.length !== 4 || !/^\d{4}$/.test(regPin)) {
      setRegError('4-Digit PIN must be exactly 4 numeric digits.');
      return;
    }

    const result = registerStudent(regName, rankNum, regPin, regMobile, currentTargetIntake.id);
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

    const result = loginStudent(rankNum, loginPin, selectedLoginIntakeId);
    if (!result.success) {
      setLoginError(result.error || 'Login failed. Please verify your credentials.');
    }
  };

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
                {currentTargetIntake ? currentTargetIntake.name : 'Cohort'}{' '}
                <span className="font-mono text-white/90">
                  ({registeredCount}/{currentTargetIntake?.totalHOs || 0} Filled)
                </span>
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

        {/* Content Container */}
        <div className="p-6">
          {/* Tab Switcher: New Doctor vs. Sign In */}
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

          {/* =========================================================================
              REGISTER MODE
          ========================================================================= */}
          {mode === 'register' && (
            <>
              {openIntakes.length === 0 ? (
                /* Notice When No Intakes are Open within 48 Hours */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#FEF7E0] border border-[#F7C948]/40 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-[#F7C948]/20 flex items-center justify-center text-[#B8870A] mx-auto">
                      <Lock className="w-5 h-5 text-[#B8870A]" />
                    </div>
                    <h3 className="text-sm font-bold text-[#1B2559]">
                      New HO Registration is Closed
                    </h3>
                    <p className="text-xs text-[#8F9BBA] leading-relaxed">
                      The 48-hour registration window has ended or no active intake is currently open. Already registered doctors can sign in using the <strong>Sign In</strong> tab.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full min-h-[48px] py-3 rounded-2xl bg-[#3B5BDB] hover:bg-[#2B4ACB] active:scale-[0.98] text-white text-xs font-bold transition flex items-center justify-center space-x-2 shadow-soft"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Go to Sign In</span>
                  </button>
                </div>
              ) : (
                /* Registration Form with Strictly Open Intakes */
                <form onSubmit={handleRegister} className="space-y-3.5">
                  {/* Select Open Intake */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[#1B2559]">
                        Select Appointment Intake
                      </label>
                      <span className="text-[10px] font-semibold text-[#047857] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#10B981]" />
                        <span>{regCountdown.shortText}</span>
                      </span>
                    </div>

                    <select
                      value={selectedRegIntakeId}
                      onChange={(e) => setSelectedRegIntakeId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#F4F7FE] border border-[#E2E8F0] text-[#1B2559] focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]"
                    >
                      {openIntakes.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name} (N = {it.totalHOs})
                        </option>
                      ))}
                    </select>

                    <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-[#3B5BDB]" />
                      <span>{regCountdown.text}</span>
                    </p>
                  </div>

                  {isCapacityReached && (
                    <div className="p-3.5 rounded-xl bg-[#FEF7E0] border border-[#F7C948]/40 text-xs text-[#B8870A] font-semibold flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        This intake has reached its maximum capacity of {currentTargetIntake?.totalHOs} House Officers. If you have already registered, please switch to <strong>Sign In</strong>.
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
                        All-Island Rank
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
                        4-Digit PIN
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
                    disabled={isCapacityReached}
                    className={`w-full min-h-[52px] py-3.5 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-soft mt-2 ${
                      !isCapacityReached
                        ? 'bg-[#3B5BDB] hover:bg-[#2B4ACB] active:scale-[0.98] text-white cursor-pointer'
                        : 'bg-[#E2E8F0] text-[#8F9BBA] cursor-not-allowed'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {isCapacityReached
                        ? `Intake Full (${currentTargetIntake?.totalHOs} HOs Registered)`
                        : 'Complete Registration & Rank Choices'}
                    </span>
                  </button>
                </form>
              )}
            </>
          )}

          {/* =========================================================================
              LOGIN MODE (Always Available for Already-Registered Doctors)
          ========================================================================= */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="p-3 rounded-xl bg-[#FEECEC] border border-[#F66B6B]/20 text-xs text-[#F66B6B] font-semibold flex items-start space-x-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Select Intake for Login */}
              {intakes.length > 1 && (
                <div>
                  <label className="block text-xs font-bold text-[#1B2559] mb-1">
                    Your Appointment Intake
                  </label>
                  <select
                    value={selectedLoginIntakeId}
                    onChange={(e) => setSelectedLoginIntakeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#F4F7FE] border border-[#E2E8F0] text-[#1B2559] focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]"
                  >
                    {intakes.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#1B2559] mb-1">
                  Your Registered All-Island Merit Rank
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
                className="w-full min-h-[52px] py-3.5 rounded-2xl bg-[#3B5BDB] hover:bg-[#2B4ACB] active:scale-[0.98] text-white text-xs font-bold transition flex items-center justify-center space-x-2 shadow-soft mt-2 cursor-pointer"
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
      </div>
    </div>
  );
};
