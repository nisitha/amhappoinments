'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  HOCandidateInput,
  HOQuotas,
  HOAllocationBatchSummary,
  HOAllocationResult,
  CandidateAuditEntry,
  SwapRequestInput,
  SwapValidationResult,
  RHO3MonthCandidateInput,
  RHO3MonthQuotas,
  RHO3MonthAllocationResult,
  HospitalUnitConfig,
  RHOUnitCandidateInput,
  ConsultantPreferences,
  RHOUnitAllocationResult,
  HOPair,
  Specialty,
  Intake,
  allocateHOYear,
  validateMutualSwap,
  allocateRHO3Month,
  matchRHOUnits,
  calculateAutoQuotas,
  pairToString
} from '@/lib/algorithms';
import {
  generateSampleCandidates,
  INITIAL_HO_QUOTAS,
  INITIAL_RHO_3MONTH_QUOTAS,
  HOSPITAL_UNITS,
  generateInitialRHO3MonthCandidates,
  SAMPLE_CONSULTANT_PREFERENCES
} from '@/lib/data/sampleData';
import { calculateRotationDates, RotationMilestoneDates } from '@/lib/utils/rotationDates';
import { supabase } from '@/lib/supabaseClient';

export type UserRole = 'admin' | 'student' | 'consultant';

export type ActiveTab =
  | 'admin-overview'
  | 'admin-candidates'
  | 'admin-quotas'
  | 'admin-allocator'
  | 'admin-simulator'
  | 'admin-stage2'
  | 'admin-stage3'
  | 'student-ranker'
  | 'student-result'
  | 'student-swaps'
  | 'consultant-view';

export interface SwapRecord {
  id: string;
  type: 'full' | 'h1_only' | 'h2_only';
  studentA: { id: string; name: string; currentPair: HOPair; meritRank: number };
  studentB: { id: string; name: string; currentPair: HOPair; meritRank: number };
  proposedANewPair: HOPair;
  proposedBNewPair: HOPair;
  status: 'pending' | 'approved' | 'rejected';
  auditReason: string;
  createdAt: string;
}

export const INITIAL_INTAKES: Intake[] = [
  {
    id: 'intake-2026-nov',
    name: '2026 November Intake',
    appointmentStartDate: '2026-11-16',
    totalHOs: 40,
    status: 'open',
    createdAt: '2026-11-01'
  },
  {
    id: 'intake-2026-may',
    name: '2026 May Intake',
    appointmentStartDate: '2026-05-15',
    totalHOs: 24,
    status: 'closed',
    createdAt: '2026-05-01'
  }
];

// Supabase row mapping & parsing helpers
function mapBatchRowToIntake(row: {
  id: string;
  name: string;
  appointment_start_date?: string;
  total_hos?: number;
  total_students?: number;
  status?: string;
  created_at?: string;
}): Intake {
  return {
    id: row.id,
    name: row.name,
    appointmentStartDate: row.appointment_start_date || '2026-11-16',
    totalHOs: row.total_hos || row.total_students || 40,
    status: row.status === 'open' || row.status === 'registration_open' ? 'open' : 'closed',
    createdAt: row.created_at || new Date().toISOString()
  };
}

function parseQuotasForBatch(
  quotaRows: Array<{
    batch_id: string;
    half: string;
    medicine?: number;
    surgery?: number;
    pediatrics?: number;
    gyn_obs?: number;
  }>,
  batchId: string,
  totalHOs: number
): HOQuotas {
  const h1Row = quotaRows.find((q) => q.batch_id === batchId && q.half === 'H1');
  const h2Row = quotaRows.find((q) => q.batch_id === batchId && q.half === 'H2');
  const fallback = calculateAutoQuotas(totalHOs);

  return {
    h1: {
      Medicine: h1Row?.medicine ?? fallback.h1.Medicine,
      Surgery: h1Row?.surgery ?? fallback.h1.Surgery,
      Pediatrics: h1Row?.pediatrics ?? fallback.h1.Pediatrics,
      'Gyn & Obs': h1Row?.gyn_obs ?? fallback.h1['Gyn & Obs']
    },
    h2: {
      Medicine: h2Row?.medicine ?? fallback.h2.Medicine,
      Surgery: h2Row?.surgery ?? fallback.h2.Surgery,
      Pediatrics: h2Row?.pediatrics ?? fallback.h2.Pediatrics,
      'Gyn & Obs': h2Row?.gyn_obs ?? fallback.h2['Gyn & Obs']
    }
  };
}

function parseCandidatesFromSupabase(
  profiles: Array<{
    id: string;
    full_name: string;
    merit_rank: number | null;
    mobile_number: string | null;
    intake_id?: string;
    pin: string;
    is_locked?: boolean;
    submitted_at?: string | null;
  }>,
  prefs: Array<{
    student_id: string;
    preference_rank: number;
    h1_specialty: string;
    h2_specialty: string;
    is_locked?: boolean;
    submitted_at?: string | null;
  }>
): HOCandidateInput[] {
  return profiles.map((p) => {
    const userPrefs = prefs.filter((pr) => pr.student_id === p.id);
    const studentPrefs = userPrefs
      .sort((a, b) => a.preference_rank - b.preference_rank)
      .map((pr) => ({
        h1: pr.h1_specialty as Specialty,
        h2: pr.h2_specialty as Specialty
      }));

    let isLocked = p.is_locked === true || userPrefs.some((pr) => pr.is_locked === true);
    let submittedAt = p.submitted_at || userPrefs.find((pr) => pr.submitted_at)?.submitted_at || null;

    if (!isLocked && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`amh_locked_pref_${p.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.isLocked === true) {
            isLocked = true;
            submittedAt = parsed.submittedAt || null;
          }
        }
      } catch {}
    }

    return {
      id: p.id,
      name: p.full_name,
      meritRank: p.merit_rank || 1,
      mobileNumber: p.mobile_number || '',
      intakeId: p.intake_id || 'intake-2026-nov',
      pin: p.pin,
      preferences:
        studentPrefs.length > 0
          ? studentPrefs
          : ([
              { h1: 'Medicine', h2: 'Surgery' },
              { h1: 'Surgery', h2: 'Medicine' },
              { h1: 'Pediatrics', h2: 'Gyn & Obs' }
            ] as HOPair[]),
      isLocked,
      submittedAt
    };
  }).sort((a, b) => a.meritRank - b.meritRank);
}

function parseAllocationsForBatch(
  allocRows: Array<{
    batch_id: string;
    student_id: string;
    status: string;
    assigned_h1: string | null;
    assigned_h2: string | null;
    choice_rank: number | null;
    available_alternatives: unknown;
    audit_trail: unknown;
    summary_explanation: string;
  }>,
  batchId: string,
  quotas: HOQuotas,
  candidates: HOCandidateInput[]
): HOAllocationBatchSummary | null {
  const batchAllocs = allocRows.filter((a) => a.batch_id === batchId);
  if (batchAllocs.length === 0) return null;

  const results: HOAllocationResult[] = batchAllocs.map((a) => {
    const cand = candidates.find((c) => c.id === a.student_id);
    const assignedPair: HOPair | null =
      a.assigned_h1 && a.assigned_h2
        ? { h1: a.assigned_h1 as Specialty, h2: a.assigned_h2 as Specialty }
        : null;

    return {
      candidateId: a.student_id,
      candidateName: cand?.name || 'Doctor',
      meritRank: cand?.meritRank || 1,
      status: a.status as 'GRANTED' | 'ALTERNATIVES_AVAILABLE',
      assignedPair,
      choiceRank: a.choice_rank ?? null,
      availableAlternatives: Array.isArray(a.available_alternatives)
        ? (a.available_alternatives as unknown as HOPair[])
        : [],
      auditTrail: Array.isArray(a.audit_trail)
        ? (a.audit_trail as unknown as CandidateAuditEntry[])
        : [],
      summaryExplanation: a.summary_explanation || ''
    };
  });

  const grantedCount = results.filter((r) => r.status === 'GRANTED').length;
  const alternativesAvailableCount = results.filter((r) => r.status === 'ALTERNATIVES_AVAILABLE').length;
  const choiceRankDistribution: Record<number, number> = {};
  for (const r of results) {
    if (r.choiceRank) {
      choiceRankDistribution[r.choiceRank] = (choiceRankDistribution[r.choiceRank] || 0) + 1;
    }
  }

  const h1Util: Record<Specialty, number> = { Medicine: 0, Surgery: 0, Pediatrics: 0, 'Gyn & Obs': 0 };
  const h2Util: Record<Specialty, number> = { Medicine: 0, Surgery: 0, Pediatrics: 0, 'Gyn & Obs': 0 };
  for (const r of results) {
    if (r.assignedPair) {
      h1Util[r.assignedPair.h1] = (h1Util[r.assignedPair.h1] || 0) + 1;
      h2Util[r.assignedPair.h2] = (h2Util[r.assignedPair.h2] || 0) + 1;
    }
  }

  return {
    totalStudents: results.length,
    grantedCount,
    alternativesAvailableCount,
    clashesCount: 0,
    forbiddenPairCount: 0,
    h1Utilization: h1Util,
    h2Utilization: h2Util,
    h1Remaining: {
      Medicine: Math.max(0, quotas.h1.Medicine - h1Util.Medicine),
      Surgery: Math.max(0, quotas.h1.Surgery - h1Util.Surgery),
      Pediatrics: Math.max(0, quotas.h1.Pediatrics - h1Util.Pediatrics),
      'Gyn & Obs': Math.max(0, quotas.h1['Gyn & Obs'] - h1Util['Gyn & Obs'])
    },
    h2Remaining: {
      Medicine: Math.max(0, quotas.h2.Medicine - h2Util.Medicine),
      Surgery: Math.max(0, quotas.h2.Surgery - h2Util.Surgery),
      Pediatrics: Math.max(0, quotas.h2.Pediatrics - h2Util.Pediatrics),
      'Gyn & Obs': Math.max(0, quotas.h2['Gyn & Obs'] - h2Util['Gyn & Obs'])
    },
    choiceRankDistribution,
    results
  };
}

function parseSwapsForBatch(
  swapRows: Array<{
    id: string;
    batch_id: string;
    initiator_id: string;
    target_id: string;
    swap_type: string;
    status: string;
    initiator_new_h1: string;
    initiator_new_h2: string;
    target_new_h1: string;
    target_new_h2: string;
    audit_reason: string;
    created_at?: string;
  }>,
  batchId: string,
  candidates: HOCandidateInput[]
): SwapRecord[] {
  return swapRows
    .filter((s) => s.batch_id === batchId)
    .map((s) => {
      const candA = candidates.find((c) => c.id === s.initiator_id);
      const candB = candidates.find((c) => c.id === s.target_id);

      return {
        id: s.id,
        type: s.swap_type as 'full' | 'h1_only' | 'h2_only',
        studentA: {
          id: s.initiator_id,
          name: candA?.name || 'Initiating Doctor',
          currentPair: { h1: s.initiator_new_h2 as Specialty, h2: s.initiator_new_h1 as Specialty },
          meritRank: candA?.meritRank || 1
        },
        studentB: {
          id: s.target_id,
          name: candB?.name || 'Target Doctor',
          currentPair: { h1: s.target_new_h2 as Specialty, h2: s.target_new_h1 as Specialty },
          meritRank: candB?.meritRank || 2
        },
        proposedANewPair: { h1: s.initiator_new_h1 as Specialty, h2: s.initiator_new_h2 as Specialty },
        proposedBNewPair: { h1: s.target_new_h1 as Specialty, h2: s.target_new_h2 as Specialty },
        status: s.status as 'pending' | 'approved' | 'rejected',
        auditReason: s.audit_reason || '',
        createdAt: s.created_at || ''
      };
    });
}

function getStoredActiveIntakeId(): string | null {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('amh_active_intake_id');
    } catch {
      return null;
    }
  }
  return null;
}

function setStoredActiveIntakeId(id: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('amh_active_intake_id', id);
    } catch {
      // ignore
    }
  }
}

interface IntakeScopedStore {
  quotas: HOQuotas;
  hoSummary: HOAllocationBatchSummary | null;
  swapRecords: SwapRecord[];
  rhoCandidates: RHO3MonthCandidateInput[];
  rhoQuotas: RHO3MonthQuotas;
  rhoSummary: {
    allocatedCount: number;
    unallocatedCount: number;
    utilization: RHO3MonthQuotas;
    results: RHO3MonthAllocationResult[];
  } | null;
  rhoUnitSummary: {
    allocatedCount: number;
    unallocatedCount: number;
    unitUtilization: Record<string, number>;
    unitCapacities: Record<string, number>;
    results: RHOUnitAllocationResult[];
  } | null;
}

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Realtime & Live Sync
  isLiveSyncing: boolean;
  realtimeStatus: 'connected' | 'connecting' | 'disconnected';
  refreshData: () => Promise<void>;

  // Intakes
  intakes: Intake[];
  activeIntakeId: string;
  activeIntake: Intake;
  openIntakes: Intake[];
  isDbLoaded: boolean;
  rotationMilestones: RotationMilestoneDates;
  currentStudentMilestones: RotationMilestoneDates;
  createIntake: (name: string, appointmentStartDate: string, totalHOs: number, status: 'open' | 'closed') => Intake;
  updateActiveIntake: (updates: Partial<Intake>) => void;
  deleteIntake: (intakeId: string) => { success: boolean; remainingCount: number; error?: string };
  switchIntake: (intakeId: string) => void;
  toggleIntakeStatus: (intakeId: string) => void;

  // Candidates & Self-Registration
  candidates: HOCandidateInput[];
  setCandidates: React.Dispatch<React.SetStateAction<HOCandidateInput[]>>;
  allCandidates: HOCandidateInput[];
  registerStudent: (
    name: string,
    meritRank: number,
    pin: string,
    mobileNumber?: string,
    intakeId?: string
  ) => { success: boolean; error?: string };
  loginStudent: (
    meritRank: number,
    pin: string,
    intakeId?: string
  ) => { success: boolean; error?: string };
  editCandidate: (id: string, name: string, meritRank: number, mobileNumber?: string) => { success: boolean; error?: string };
  removeCandidate: (id: string) => void;
  claimAlternative: (studentId: string, pair: HOPair) => void;

  // Quotas & Allocator
  quotas: HOQuotas;
  setQuotas: React.Dispatch<React.SetStateAction<HOQuotas>>;
  applyAutoQuotas: (count?: number) => void;
  hoSummary: HOAllocationBatchSummary | null;
  selectedAuditCandidate: HOAllocationResult | null;
  setSelectedAuditCandidate: (cand: HOAllocationResult | null) => void;

  // Active Student
  currentStudentId: string | null;
  setCurrentStudentId: (id: string | null) => void;
  logoutStudent: () => void;
  currentStudent: HOCandidateInput | undefined;
  currentStudentResult: HOAllocationResult | undefined;
  saveThreeChoices: (studentId: string, choices: HOPair[]) => void;
  updateStudentPreferences: (studentId: string, prefs: HOPair[]) => void;
  submitAndLockPreferences: (studentId: string, choices: HOPair[]) => Promise<{ success: boolean; error?: string }>;
  unlockStudentPreferences: (studentId: string) => Promise<void>;

  // Swaps & Allocations
  runHOAllocation: () => void;
  resetAllocations: () => void;
  isAllocated: boolean;
  swapRecords: SwapRecord[];
  submitSwapRequest: (
    type: 'full' | 'h1_only' | 'h2_only',
    targetStudentId: string
  ) => SwapValidationResult;
  respondToSwap: (swapId: string, approve: boolean) => void;

  // Stage 2 RHO 3-Month
  rhoCandidates: RHO3MonthCandidateInput[];
  rhoQuotas: RHO3MonthQuotas;
  setRhoQuotas: React.Dispatch<React.SetStateAction<RHO3MonthQuotas>>;
  rhoSummary: {
    allocatedCount: number;
    unallocatedCount: number;
    utilization: RHO3MonthQuotas;
    results: RHO3MonthAllocationResult[];
  } | null;
  runRHO3MonthAllocation: () => void;
  updateRHOCandidateChoices: (candidateId: string, choices: [Specialty, Specialty]) => void;

  // Stage 3 RHO Units
  units: HospitalUnitConfig[];
  consultantPrefs: ConsultantPreferences[];
  selectedConsultantPin: string;
  setSelectedConsultantPin: (pin: string) => void;
  rhoUnitSummary: {
    allocatedCount: number;
    unallocatedCount: number;
    unitUtilization: Record<string, number>;
    unitCapacities: Record<string, number>;
    results: RHOUnitAllocationResult[];
  } | null;
  submitConsultantPicks: (unitId: string, candidateIds: string[]) => void;
  runRHOUnitMatching: () => void;

  // Simulator
  loadScenario: (scenario: 'even_40' | 'odd_21' | 'remainder_42' | 'extreme_contention') => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('admin');
  const [activeTab, setActiveTab] = useState<ActiveTab>('admin-overview');

  // Intakes State
  const [intakes, setIntakes] = useState<Intake[]>(INITIAL_INTAKES);
  const [activeIntakeId, setActiveIntakeId] = useState<string>('intake-2026-nov');
  const [isDbLoaded, setIsDbLoaded] = useState<boolean>(false);

  // All registered candidates across all intakes (Starts clean: 0 mock candidates)
  const [allCandidates, setAllCandidates] = useState<HOCandidateInput[]>([]);

  // Per-intake scoped state store
  const [intakeStores, setIntakeStores] = useState<Record<string, IntakeScopedStore>>(() => {
    return {
      'intake-2026-nov': {
        quotas: calculateAutoQuotas(40),
        hoSummary: null,
        swapRecords: [],
        rhoCandidates: [],
        rhoQuotas: { ...INITIAL_RHO_3MONTH_QUOTAS },
        rhoSummary: null,
        rhoUnitSummary: null
      },
      'intake-2026-may': {
        quotas: calculateAutoQuotas(24),
        hoSummary: null,
        swapRecords: [],
        rhoCandidates: [],
        rhoQuotas: { Medicine: 6, Surgery: 6, Pediatrics: 6, 'Gyn & Obs': 6 },
        rhoSummary: null,
        rhoUnitSummary: null
      }
    };
  });

  const [selectedAuditCandidate, setSelectedAuditCandidate] = useState<HOAllocationResult | null>(null);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);

  // Stage 3 Units (Hospital-wide)
  const [units] = useState<HospitalUnitConfig[]>(HOSPITAL_UNITS);
  const [consultantPrefs, setConsultantPrefs] = useState<ConsultantPreferences[]>(SAMPLE_CONSULTANT_PREFERENCES);
  const [selectedConsultantPin, setSelectedConsultantPin] = useState<string>('1001');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Realtime & Live Sync States & References
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cross-client broadcast notification helper
  const notifyRealtimeChange = useCallback((table: string, action: string) => {
    if (realtimeChannelRef.current) {
      try {
        realtimeChannelRef.current.send({
          type: 'broadcast',
          event: 'data_changed',
          payload: { table, action, timestamp: Date.now() }
        });
      } catch (err) {
        console.warn('Realtime broadcast notice skipped:', err);
      }
    }
  }, []);

  // Canonical full state rehydration from Supabase database
  const refreshAllDataFromDb = useCallback(async () => {
    try {
      const { data: batchData, error: batchErr } = await supabase
        .from('ho_batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (batchErr) {
        console.warn('Notice: Supabase batches fetch error:', batchErr.message);
        return;
      }

      if (!batchData || batchData.length === 0) return;

      const loadedIntakes: Intake[] = batchData.map(mapBatchRowToIntake);
      setIntakes(loadedIntakes);

      setActiveIntakeId((prevActiveId) => {
        if (loadedIntakes.some((it) => it.id === prevActiveId)) {
          return prevActiveId;
        }
        const currentSaved = getStoredActiveIntakeId();
        if (currentSaved && loadedIntakes.some((it) => it.id === currentSaved)) {
          return currentSaved;
        }
        return loadedIntakes[0]?.id || prevActiveId;
      });

      // Fetch quotas, profiles, preferences, allocations, swaps
      const [quotaRes, profileRes, prefRes, allocRes, swapRes] = await Promise.all([
        supabase.from('ho_quotas').select('*'),
        supabase.from('profiles').select('*').eq('role', 'student').order('merit_rank', { ascending: true }),
        supabase.from('ho_preferences').select('*').order('preference_rank', { ascending: true }),
        supabase.from('ho_allocations').select('*'),
        supabase.from('ho_swap_requests').select('*')
      ]);

      const loadedCandidates = parseCandidatesFromSupabase(profileRes.data || [], prefRes.data || []);
      setAllCandidates(loadedCandidates);

      setIntakeStores((prevStores) => {
        const newStores: Record<string, IntakeScopedStore> = { ...prevStores };
        for (const it of loadedIntakes) {
          const itQuotas = parseQuotasForBatch(quotaRes.data || [], it.id, it.totalHOs);
          const itSummary = parseAllocationsForBatch(allocRes.data || [], it.id, itQuotas, loadedCandidates);
          const itSwaps = parseSwapsForBatch(swapRes.data || [], it.id, loadedCandidates);
          const perSpecialty = Math.floor(it.totalHOs / 4);

          const prevStore = prevStores[it.id];
          newStores[it.id] = {
            quotas: itQuotas,
            hoSummary: itSummary,
            swapRecords: itSwaps,
            rhoCandidates: prevStore?.rhoCandidates?.length ? prevStore.rhoCandidates : [],
            rhoQuotas: prevStore?.rhoQuotas || {
              Medicine: perSpecialty,
              Surgery: perSpecialty,
              Pediatrics: perSpecialty,
              'Gyn & Obs': perSpecialty
            },
            rhoSummary: prevStore?.rhoSummary || null,
            rhoUnitSummary: prevStore?.rhoUnitSummary || null
          };
        }
        return newStores;
      });

      setIsDbLoaded(true);
    } catch (err) {
      console.error('Failed to sync state from Supabase:', err);
    }
  }, []);

  // Debounced sync trigger (150ms debounce coalesces concurrent mutations)
  const triggerDebouncedSync = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      refreshAllDataFromDb();
    }, 150);
  }, [refreshAllDataFromDb]);

  // Unified Supabase Realtime channel subscription across all core tables
  useEffect(() => {
    let isMounted = true;

    // 1. Initial hydration on mount
    refreshAllDataFromDb();

    // 2. Setup Realtime channel
    const tablesToWatch = [
      'ho_batches',
      'profiles',
      'ho_quotas',
      'ho_preferences',
      'ho_allocations',
      'ho_swap_requests',
      'rho_batches',
      'rho_units',
      'consultant_selections',
      'rho_unit_preferences',
      'rho_unit_allocations'
    ];

    const channel = supabase.channel('amh-realtime-sync');
    realtimeChannelRef.current = channel;

    // Listen to postgres changes across all core tables
    tablesToWatch.forEach((tbl) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tbl },
        () => {
          if (!isMounted) return;
          triggerDebouncedSync();
        }
      );
    });

    // Listen to cross-client broadcast events for zero-latency multi-tab updates
    channel.on('broadcast', { event: 'data_changed' }, () => {
      if (!isMounted) return;
      triggerDebouncedSync();
    });

    channel.subscribe((status, err) => {
      if (!isMounted) return;
      if (status === 'SUBSCRIBED') {
        setRealtimeStatus('connected');
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setRealtimeStatus('disconnected');
        if (err) console.warn('Supabase Realtime status note:', err.message);
      } else {
        setRealtimeStatus('connecting');
      }
    });

    return () => {
      isMounted = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [refreshAllDataFromDb, triggerDebouncedSync]);

  // Derive active intake object
  const activeIntake = useMemo(() => {
    return intakes.find((it) => it.id === activeIntakeId) || intakes[0] || INITIAL_INTAKES[0];
  }, [intakes, activeIntakeId]);

  const openIntakes = useMemo(() => {
    return intakes.filter((it) => it.status === 'open');
  }, [intakes]);

  // Calculate rotation dates for active intake
  const rotationMilestones = useMemo(() => {
    return calculateRotationDates(activeIntake.appointmentStartDate);
  }, [activeIntake.appointmentStartDate]);

  // Current active intake store
  const activeStore = useMemo<IntakeScopedStore>(() => {
    if (intakeStores[activeIntakeId]) {
      return intakeStores[activeIntakeId];
    }
    // Fallback if not initialized
    return {
      quotas: calculateAutoQuotas(activeIntake.totalHOs),
      hoSummary: null,
      swapRecords: [],
      rhoCandidates: [],
      rhoQuotas: { Medicine: 10, Surgery: 10, Pediatrics: 10, 'Gyn & Obs': 10 },
      rhoSummary: null,
      rhoUnitSummary: null
    };
  }, [intakeStores, activeIntakeId, activeIntake.totalHOs]);

  // Intake-scoped candidates (sorted strictly by ascending meritRank)
  const candidates = useMemo(() => {
    return allCandidates
      .filter((c) => (c.intakeId || 'intake-2026-nov') === activeIntakeId)
      .sort((a, b) => a.meritRank - b.meritRank);
  }, [allCandidates, activeIntakeId]);

  const setCandidates: React.Dispatch<React.SetStateAction<HOCandidateInput[]>> = (action) => {
    setAllCandidates((prevAll) => {
      const currentIntakeCands = prevAll.filter((c) => (c.intakeId || 'intake-2026-nov') === activeIntakeId);
      const otherIntakeCands = prevAll.filter((c) => (c.intakeId || 'intake-2026-nov') !== activeIntakeId);
      const updated = typeof action === 'function' ? action(currentIntakeCands) : action;
      return [...otherIntakeCands, ...updated].sort((a, b) => a.meritRank - b.meritRank);
    });
  };

  // Intake-scoped active fields
  const quotas = activeStore.quotas;
  const setQuotas: React.Dispatch<React.SetStateAction<HOQuotas>> = (action) => {
    setIntakeStores((prev) => {
      const current = prev[activeIntakeId] || activeStore;
      const updatedQuotas = typeof action === 'function' ? action(current.quotas) : action;

      (async () => {
        try {
          await supabase.from('ho_quotas').upsert([
            {
              batch_id: activeIntakeId,
              half: 'H1',
              medicine: updatedQuotas.h1.Medicine,
              surgery: updatedQuotas.h1.Surgery,
              pediatrics: updatedQuotas.h1.Pediatrics,
              gyn_obs: updatedQuotas.h1['Gyn & Obs']
            },
            {
              batch_id: activeIntakeId,
              half: 'H2',
              medicine: updatedQuotas.h2.Medicine,
              surgery: updatedQuotas.h2.Surgery,
              pediatrics: updatedQuotas.h2.Pediatrics,
              gyn_obs: updatedQuotas.h2['Gyn & Obs']
            }
          ], { onConflict: 'batch_id,half' });
          notifyRealtimeChange('ho_quotas', 'setQuotas');
        } catch (err) {
          console.error('setQuotas persist error:', err);
        }
      })();

      return {
        ...prev,
        [activeIntakeId]: { ...current, quotas: updatedQuotas }
      };
    });
  };

  const hoSummary = activeStore.hoSummary;
  const setHoSummary = (summary: HOAllocationBatchSummary | null) => {
    setIntakeStores((prev) => {
      const current = prev[activeIntakeId] || activeStore;
      return {
        ...prev,
        [activeIntakeId]: { ...current, hoSummary: summary }
      };
    });
  };

  const swapRecords = activeStore.swapRecords;
  const setSwapRecords = (action: React.SetStateAction<SwapRecord[]>) => {
    setIntakeStores((prev) => {
      const current = prev[activeIntakeId] || activeStore;
      const updatedSwaps = typeof action === 'function' ? action(current.swapRecords) : action;
      return {
        ...prev,
        [activeIntakeId]: { ...current, swapRecords: updatedSwaps }
      };
    });
  };

  const rhoCandidates = activeStore.rhoCandidates;
  const setRhoCandidates = (cands: RHO3MonthCandidateInput[]) => {
    setIntakeStores((prev) => {
      const current = prev[activeIntakeId] || activeStore;
      return {
        ...prev,
        [activeIntakeId]: { ...current, rhoCandidates: cands }
      };
    });
  };

  const rhoQuotas = activeStore.rhoQuotas;
  const setRhoQuotas: React.Dispatch<React.SetStateAction<RHO3MonthQuotas>> = (action) => {
    setIntakeStores((prev) => {
      const current = prev[activeIntakeId] || activeStore;
      const updated = typeof action === 'function' ? action(current.rhoQuotas) : action;
      return {
        ...prev,
        [activeIntakeId]: { ...current, rhoQuotas: updated }
      };
    });
  };

  const rhoSummary = activeStore.rhoSummary;
  const setRhoSummary = (summary: IntakeScopedStore['rhoSummary']) => {
    setIntakeStores((prev) => {
      const current = prev[activeIntakeId] || activeStore;
      return {
        ...prev,
        [activeIntakeId]: { ...current, rhoSummary: summary }
      };
    });
  };

  const rhoUnitSummary = activeStore.rhoUnitSummary;
  const setRhoUnitSummary = (summary: IntakeScopedStore['rhoUnitSummary']) => {
    setIntakeStores((prev) => {
      const current = prev[activeIntakeId] || activeStore;
      return {
        ...prev,
        [activeIntakeId]: { ...current, rhoUnitSummary: summary }
      };
    });
  };

  const isAllocated = useMemo(() => {
    return hoSummary !== null && hoSummary.results.length > 0;
  }, [hoSummary]);

  // Intake Management
  const createIntake = (
    name: string,
    appointmentStartDate: string,
    totalHOs: number,
    status: 'open' | 'closed'
  ): Intake => {
    const newId = `intake-${Date.now()}`;
    const newIntake: Intake = {
      id: newId,
      name: name.trim() || `Intake Starting ${appointmentStartDate}`,
      appointmentStartDate,
      totalHOs,
      status,
      createdAt: new Date().toISOString()
    };

    setIntakes((prev) => [newIntake, ...prev]);

    const initialQ = calculateAutoQuotas(totalHOs);
    const perSpecialty = Math.floor(totalHOs / 4);

    setIntakeStores((prev) => ({
      ...prev,
      [newId]: {
        quotas: initialQ,
        hoSummary: null,
        swapRecords: [],
        rhoCandidates: [],
        rhoQuotas: {
          Medicine: perSpecialty,
          Surgery: perSpecialty,
          Pediatrics: perSpecialty,
          'Gyn & Obs': perSpecialty
        },
        rhoSummary: null,
        rhoUnitSummary: null
      }
    }));

    setActiveIntakeId(newId);
    setStoredActiveIntakeId(newId);

    // Persist immediately to Supabase
    (async () => {
      try {
        const { error: bErr } = await supabase.from('ho_batches').insert({
          id: newId,
          name: newIntake.name,
          academic_year: '2026/2027',
          appointment_start_date: appointmentStartDate,
          total_hos: totalHOs,
          total_students: totalHOs,
          status
        });

        if (bErr) {
          console.error('Supabase batch insert error:', bErr);
          showToast(`Database Error: ${bErr.message}`);
          return;
        }

        const { error: qErr } = await supabase.from('ho_quotas').insert([
          {
            batch_id: newId,
            half: 'H1',
            medicine: initialQ.h1.Medicine,
            surgery: initialQ.h1.Surgery,
            pediatrics: initialQ.h1.Pediatrics,
            gyn_obs: initialQ.h1['Gyn & Obs']
          },
          {
            batch_id: newId,
            half: 'H2',
            medicine: initialQ.h2.Medicine,
            surgery: initialQ.h2.Surgery,
            pediatrics: initialQ.h2.Pediatrics,
            gyn_obs: initialQ.h2['Gyn & Obs']
          }
        ]);

        if (qErr) {
          console.error('Supabase quotas insert error:', qErr);
          showToast(`Warning: Quotas could not be synced: ${qErr.message}`);
        } else {
          showToast('Intake saved to database.');
          notifyRealtimeChange('ho_batches', 'createIntake');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('Failed to persist intake:', err);
        showToast(`Database error: ${msg}`);
      }
    })();

    showToast(`Created intake "${newIntake.name}" with capacity N = ${totalHOs}.`);
    return newIntake;
  };

  const updateActiveIntake = (updates: Partial<Intake>) => {
    let capacityChanged = false;
    let newCapacity = 0;

    setIntakes((prev) =>
      prev.map((it) => {
        if (it.id !== activeIntakeId) return it;
        if (updates.totalHOs !== undefined && updates.totalHOs !== it.totalHOs) {
          capacityChanged = true;
          newCapacity = updates.totalHOs;
        }
        return { ...it, ...updates };
      })
    );

    if (capacityChanged && newCapacity > 0) {
      const newQ = calculateAutoQuotas(newCapacity);
      const perSpecialty = Math.floor(newCapacity / 4);
      setIntakeStores((stores) => {
        const current = stores[activeIntakeId] || activeStore;
        return {
          ...stores,
          [activeIntakeId]: {
            ...current,
            quotas: newQ,
            hoSummary: null, // Clear stale allocations when capacity changes
            rhoQuotas: {
              Medicine: perSpecialty,
              Surgery: perSpecialty,
              Pediatrics: perSpecialty,
              'Gyn & Obs': perSpecialty
            }
          }
        };
      });
      setSelectedAuditCandidate(null);
    }

    // Persist to Supabase
    (async () => {
      try {
        const payload: {
          updated_at: string;
          name?: string;
          appointment_start_date?: string;
          total_hos?: number;
          total_students?: number;
          status?: string;
        } = { updated_at: new Date().toISOString() };

        if (updates.name !== undefined) payload.name = updates.name.trim();
        if (updates.appointmentStartDate !== undefined) payload.appointment_start_date = updates.appointmentStartDate;
        if (updates.totalHOs !== undefined) {
          payload.total_hos = updates.totalHOs;
          payload.total_students = updates.totalHOs;
        }
        if (updates.status !== undefined) payload.status = updates.status;

        const { error: bErr } = await supabase
          .from('ho_batches')
          .update(payload)
          .eq('id', activeIntakeId);

        if (bErr) {
          console.error('Supabase batch update error:', bErr);
          showToast(`Database Update Error: ${bErr.message}`);
          return;
        }

        if (capacityChanged && newCapacity > 0) {
          const newQ = calculateAutoQuotas(newCapacity);
          const { error: qErr } = await supabase.from('ho_quotas').upsert([
            {
              batch_id: activeIntakeId,
              half: 'H1',
              medicine: newQ.h1.Medicine,
              surgery: newQ.h1.Surgery,
              pediatrics: newQ.h1.Pediatrics,
              gyn_obs: newQ.h1['Gyn & Obs']
            },
            {
              batch_id: activeIntakeId,
              half: 'H2',
              medicine: newQ.h2.Medicine,
              surgery: newQ.h2.Surgery,
              pediatrics: newQ.h2.Pediatrics,
              gyn_obs: newQ.h2['Gyn & Obs']
            }
          ], { onConflict: 'batch_id,half' });

          if (qErr) {
            console.error('Supabase quotas update error:', qErr);
            showToast(`Quotas sync warning: ${qErr.message}`);
          }
        }

        showToast('Intake saved to database.');
        notifyRealtimeChange('ho_batches', 'updateActiveIntake');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('Failed to update intake:', err);
        showToast(`Database error: ${msg}`);
      }
    })();
  };

  const switchIntake = (intakeId: string) => {
    const target = intakes.find((it) => it.id === intakeId);
    if (!target) return;
    setActiveIntakeId(intakeId);
    setStoredActiveIntakeId(intakeId);
    setSelectedAuditCandidate(null);
    showToast(`Switched active view to: ${target.name}.`);
  };

  const deleteIntake = (intakeId: string): { success: boolean; remainingCount: number; error?: string } => {
    const target = intakes.find((it) => it.id === intakeId);
    if (!target) {
      return { success: false, remainingCount: intakes.length, error: 'Intake not found.' };
    }

    const remainingIntakes = intakes.filter((it) => it.id !== intakeId);
    setIntakes(remainingIntakes);

    // Remove candidates associated with this intake
    setAllCandidates((prev) => prev.filter((c) => (c.intakeId || 'intake-2026-nov') !== intakeId));

    // Remove intake-scoped store
    setIntakeStores((prev) => {
      const next = { ...prev };
      delete next[intakeId];
      return next;
    });

    // If the active intake was deleted, switch to the first remaining intake
    if (activeIntakeId === intakeId) {
      if (remainingIntakes.length > 0) {
        const nextActiveId = remainingIntakes[0].id;
        setActiveIntakeId(nextActiveId);
        setStoredActiveIntakeId(nextActiveId);
      } else {
        setActiveIntakeId('');
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('amh_active_intake_id');
          } catch {}
        }
      }
    }

    setSelectedAuditCandidate(null);

    // Database deletion in Supabase (delete child records first for FK safety)
    (async () => {
      try {
        await supabase.from('ho_swap_requests').delete().eq('batch_id', intakeId);
        await supabase.from('ho_allocations').delete().eq('batch_id', intakeId);
        await supabase.from('ho_preferences').delete().eq('batch_id', intakeId);
        await supabase.from('ho_quotas').delete().eq('batch_id', intakeId);
        await supabase.from('profiles').delete().eq('intake_id', intakeId);

        const { error: bErr } = await supabase.from('ho_batches').delete().eq('id', intakeId);
        if (bErr) {
          console.error('Supabase batch delete error:', bErr);
          showToast(`Database Delete Warning: ${bErr.message}`);
          return;
        }
        notifyRealtimeChange('ho_batches', 'deleteIntake');
      } catch (err: unknown) {
        console.error('deleteIntake database error:', err);
      }
    })();

    showToast('Intake deleted successfully.');
    return { success: true, remainingCount: remainingIntakes.length };
  };

  const toggleIntakeStatus = (intakeId: string) => {
    let nextStatus: 'open' | 'closed' = 'open';
    setIntakes((prev) =>
      prev.map((it) => {
        if (it.id !== intakeId) return it;
        nextStatus = it.status === 'open' ? 'closed' : 'open';
        showToast(`${it.name} is now ${nextStatus === 'open' ? 'OPEN for Registration' : 'CLOSED'}.`);
        return { ...it, status: nextStatus };
      })
    );

    (async () => {
      try {
        const { error } = await supabase
          .from('ho_batches')
          .update({ status: nextStatus, updated_at: new Date().toISOString() })
          .eq('id', intakeId);
        if (error) {
          console.error('toggleIntakeStatus error:', error);
          showToast(`Status sync error: ${error.message}`);
        } else {
          showToast(`Gate status saved to database.`);
          notifyRealtimeChange('ho_batches', 'toggleIntakeStatus');
        }
      } catch (err) {
        console.error('toggleIntakeStatus error:', err);
      }
    })();
  };

  const resetAllocations = () => {
    setHoSummary(null);
    setSelectedAuditCandidate(null);
    setSwapRecords([]);
    showToast('Allocations have been reset for this intake.');

    (async () => {
      try {
        await supabase.from('ho_allocations').delete().eq('batch_id', activeIntakeId);
        await supabase.from('ho_swap_requests').delete().eq('batch_id', activeIntakeId);
        notifyRealtimeChange('ho_allocations', 'resetAllocations');
      } catch (err) {
        console.error('resetAllocations error:', err);
      }
    })();
  };

  const logoutStudent = () => {
    setCurrentStudentId(null);
    showToast('Logged out of Doctor Portal.');
  };

  const currentStudent = useMemo(() => {
    if (!currentStudentId) return undefined;
    return allCandidates.find((c) => c.id === currentStudentId);
  }, [allCandidates, currentStudentId]);

  const currentStudentIntake = useMemo(() => {
    if (!currentStudent) return activeIntake;
    return intakes.find((it) => it.id === currentStudent.intakeId) || activeIntake;
  }, [currentStudent, intakes, activeIntake]);

  const currentStudentMilestones = useMemo(() => {
    return calculateRotationDates(currentStudentIntake.appointmentStartDate);
  }, [currentStudentIntake.appointmentStartDate]);

  const currentStudentResult = useMemo(() => {
    if (!currentStudentId || !hoSummary) return undefined;
    return hoSummary.results.find((r) => r.candidateId === currentStudentId);
  }, [hoSummary, currentStudentId]);

  // Doctor Registration
  const registerStudent = (
    name: string,
    meritRank: number,
    pin: string,
    mobileNumber = '',
    intakeId?: string
  ) => {
    const targetIntakeId = intakeId || activeIntakeId;
    const targetIntake = intakes.find((it) => it.id === targetIntakeId);

    if (!targetIntake) {
      return { success: false, error: 'Target appointment intake was not found.' };
    }

    if (targetIntake.status !== 'open') {
      return {
        success: false,
        error: `Registration is currently CLOSED for ${targetIntake.name}. Please contact AMH Kalmunai administration.`
      };
    }

    if (!name.trim()) return { success: false, error: 'Doctor Full Name is required.' };
    if (!meritRank || meritRank < 1) {
      return {
        success: false,
        error: 'Please enter a valid Merit Rank (1 or greater).'
      };
    }

    // Enforce total_hos as the registration headcount cap
    const registeredCount = allCandidates.filter(
      (c) => (c.intakeId || 'intake-2026-nov') === targetIntakeId
    ).length;
    if (registeredCount >= targetIntake.totalHOs) {
      return {
        success: false,
        error: `This intake has reached its maximum capacity of ${targetIntake.totalHOs} House Officers. Please contact AMH Kalmunai Administration.`
      };
    }
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return { success: false, error: 'Personal PIN must be exactly 4 digits.' };
    }

    const existing = allCandidates.find(
      (c) => (c.intakeId || 'intake-2026-nov') === targetIntakeId && c.meritRank === meritRank
    );
    if (existing) {
      return {
        success: false,
        error: `Merit Rank #${meritRank} is already registered in ${targetIntake.name} to ${existing.name}. Please sign in with your 4-digit PIN.`
      };
    }

    const newCandidate: HOCandidateInput = {
      id: `doc-${targetIntakeId}-${meritRank}`,
      name: name.trim(),
      meritRank,
      mobileNumber: mobileNumber.trim(),
      intakeId: targetIntakeId,
      pin,
      preferences: [
        { h1: 'Medicine', h2: 'Surgery' },
        { h1: 'Surgery', h2: 'Medicine' },
        { h1: 'Pediatrics', h2: 'Gyn & Obs' }
      ]
    };

    setAllCandidates((prev) => [...prev, newCandidate].sort((a, b) => a.meritRank - b.meritRank));
    setActiveIntakeId(targetIntakeId);
    setStoredActiveIntakeId(targetIntakeId);
    setCurrentStudentId(newCandidate.id);
    setRole('student');
    setActiveTab('student-ranker');

    // Persist to Supabase
    (async () => {
      try {
        const { error: profErr } = await supabase.from('profiles').insert({
          id: newCandidate.id,
          intake_id: targetIntakeId,
          full_name: newCandidate.name,
          merit_rank: newCandidate.meritRank,
          pin,
          mobile_number: newCandidate.mobileNumber || null,
          role: 'student'
        });

        if (profErr) {
          console.error('Supabase profile registration error:', profErr);
          showToast(`Profile sync error: ${profErr.message}`);
          return;
        }

        const prefRows = newCandidate.preferences.map((p, idx) => ({
          batch_id: targetIntakeId,
          student_id: newCandidate.id,
          preference_rank: idx + 1,
          h1_specialty: p.h1,
          h2_specialty: p.h2
        }));

        await supabase.from('ho_preferences').insert(prefRows);
        notifyRealtimeChange('profiles', 'registerStudent');
      } catch (err: unknown) {
        console.error('registerStudent persistence error:', err);
      }
    })();

    showToast(`Welcome, Dr. ${name.replace(/^Dr\.\s*/i, '')}! Registered for ${targetIntake.name} (#${meritRank}).`);
    return { success: true };
  };

  const loginStudent = (meritRank: number, pin: string, intakeId?: string) => {
    const targetIntakeId = intakeId || activeIntakeId;
    const candidate = allCandidates.find(
      (c) => (c.intakeId || 'intake-2026-nov') === targetIntakeId && c.meritRank === meritRank
    );

    if (!candidate) {
      return {
        success: false,
        error: `No registered doctor found with Merit Rank #${meritRank} in this intake.`
      };
    }
    if (candidate.pin && candidate.pin !== pin) {
      return { success: false, error: 'Incorrect 4-Digit PIN. Please check your credentials.' };
    }

    setActiveIntakeId(targetIntakeId);
    setStoredActiveIntakeId(targetIntakeId);
    setCurrentStudentId(candidate.id);
    setRole('student');
    setActiveTab(hoSummary?.results.some((r) => r.candidateId === candidate.id) ? 'student-result' : 'student-ranker');
    showToast(`Welcome back, ${candidate.name}! (Rank #${candidate.meritRank})`);
    return { success: true };
  };

  const editCandidate = (id: string, name: string, meritRank: number, mobileNumber?: string) => {
    const current = allCandidates.find((c) => c.id === id);
    const targetIntakeId = current?.intakeId || activeIntakeId;

    if (!meritRank || meritRank < 1) {
      return { success: false, error: 'Please enter a valid Merit Rank (1 or greater).' };
    }

    const conflict = allCandidates.find(
      (c) => c.id !== id && (c.intakeId || 'intake-2026-nov') === targetIntakeId && c.meritRank === meritRank
    );
    if (conflict) {
      return { success: false, error: `Merit Rank #${meritRank} is already assigned to ${conflict.name}.` };
    }

    setAllCandidates((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, name, meritRank, ...(mobileNumber !== undefined ? { mobileNumber } : {}) } : c))
        .sort((a, b) => a.meritRank - b.meritRank)
    );

    (async () => {
      try {
        await supabase.from('profiles').update({
          full_name: name.trim(),
          merit_rank: meritRank,
          mobile_number: mobileNumber?.trim() || null
        }).eq('id', id);
        notifyRealtimeChange('profiles', 'editCandidate');
      } catch (err) {
        console.error('editCandidate persist error:', err);
      }
    })();

    showToast(`Updated doctor profile for ${name}.`);
    return { success: true };
  };

  const removeCandidate = (id: string) => {
    setAllCandidates((prev) => prev.filter((c) => c.id !== id));

    (async () => {
      try {
        await supabase.from('profiles').delete().eq('id', id);
        notifyRealtimeChange('profiles', 'removeCandidate');
      } catch (err) {
        console.error('removeCandidate persist error:', err);
      }
    })();

    showToast('Doctor removed from registration roster.');
  };

  const saveThreeChoices = (studentId: string, choices: HOPair[]) => {
    const candidate = allCandidates.find((c) => c.id === studentId);
    if (candidate?.isLocked) {
      showToast('Your choices are permanently locked and cannot be changed.');
      return;
    }

    setAllCandidates((prev) =>
      prev.map((c) => (c.id === studentId ? { ...c, preferences: choices } : c))
    );

    (async () => {
      try {
        await supabase.from('ho_preferences').delete().eq('student_id', studentId);
        const rows = choices.map((c, idx) => ({
          batch_id: activeIntakeId,
          student_id: studentId,
          preference_rank: idx + 1,
          h1_specialty: c.h1,
          h2_specialty: c.h2
        }));
        const { error } = await supabase.from('ho_preferences').insert(rows);
        if (error) {
          console.error('Supabase save preferences error:', error);
          showToast(`Preferences sync error: ${error.message}`);
        } else {
          showToast('Your 3 rotation choices have been saved.');
          notifyRealtimeChange('ho_preferences', 'saveThreeChoices');
        }
      } catch (err) {
        console.error('saveThreeChoices error:', err);
      }
    })();
  };

  const submitAndLockPreferences = async (
    studentId: string,
    choices: HOPair[]
  ): Promise<{ success: boolean; error?: string }> => {
    const candidate = allCandidates.find((c) => c.id === studentId);
    if (candidate?.isLocked) {
      showToast('Your rotation preferences are already locked.');
      return { success: false, error: 'Preferences are already locked.' };
    }

    const submittedAt = new Date().toISOString();

    setAllCandidates((prev) =>
      prev.map((c) =>
        c.id === studentId
          ? { ...c, preferences: choices, isLocked: true, submittedAt }
          : c
      )
    );

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          `amh_locked_pref_${studentId}`,
          JSON.stringify({ isLocked: true, submittedAt, choices })
        );
      } catch {}
    }

    (async () => {
      try {
        await supabase.from('ho_preferences').delete().eq('student_id', studentId);
        const rowsWithLock = choices.map((c, idx) => ({
          batch_id: activeIntakeId,
          student_id: studentId,
          preference_rank: idx + 1,
          h1_specialty: c.h1,
          h2_specialty: c.h2,
          is_locked: true,
          submitted_at: submittedAt
        }));

        const { error } = await supabase.from('ho_preferences').insert(rowsWithLock);
        if (error) {
          if (error.code === '42703' || error.message.includes('column')) {
            const fallbackRows = choices.map((c, idx) => ({
              batch_id: activeIntakeId,
              student_id: studentId,
              preference_rank: idx + 1,
              h1_specialty: c.h1,
              h2_specialty: c.h2
            }));
            await supabase.from('ho_preferences').insert(fallbackRows);
          } else {
            console.error('Supabase lock insert error:', error);
          }
        }

        // Also update profiles table
        try {
          await supabase
            .from('profiles')
            .update({ is_locked: true, submitted_at: submittedAt })
            .eq('id', studentId);
        } catch {}

        notifyRealtimeChange('ho_preferences', 'submitAndLockPreferences');
      } catch (err) {
        console.error('submitAndLockPreferences persist error:', err);
      }
    })();

    showToast('Your rotation preferences have been locked and submitted.');
    return { success: true };
  };

  const unlockStudentPreferences = async (studentId: string): Promise<void> => {
    setAllCandidates((prev) =>
      prev.map((c) =>
        c.id === studentId
          ? { ...c, isLocked: false, submittedAt: null }
          : c
      )
    );

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`amh_locked_pref_${studentId}`);
      } catch {}
    }

    (async () => {
      try {
        const { error } = await supabase
          .from('ho_preferences')
          .update({ is_locked: false, submitted_at: null })
          .eq('student_id', studentId);

        try {
          await supabase
            .from('profiles')
            .update({ is_locked: false, submitted_at: null })
            .eq('id', studentId);
        } catch {}

        if (!error) {
          notifyRealtimeChange('ho_preferences', 'unlockStudentPreferences');
        }
      } catch (err) {
        console.error('unlockStudentPreferences error:', err);
      }
    })();

    showToast('Preferences unlocked for doctor editing.');
  };

  const updateStudentPreferences = (studentId: string, prefs: HOPair[]) => {
    saveThreeChoices(studentId, prefs);
  };

  const claimAlternative = (studentId: string, pair: HOPair) => {
    setAllCandidates((prev) =>
      prev.map((c) => (c.id === studentId ? { ...c, claimedAlternative: pair } : c))
    );

    setTimeout(() => {
      runHOAllocation();
      showToast(`Rotation confirmed: ${pairToString(pair)}!`);
    }, 50);

    (async () => {
      try {
        await supabase
          .from('ho_allocations')
          .update({
            status: 'GRANTED',
            assigned_h1: pair.h1,
            assigned_h2: pair.h2,
            summary_explanation: `Claimed alternative rotation: ${pairToString(pair)}`
          })
          .eq('student_id', studentId);
        notifyRealtimeChange('ho_allocations', 'claimAlternative');
      } catch (err) {
        console.error('claimAlternative persist error:', err);
      }
    })();
  };

  const applyAutoQuotas = (count?: number) => {
    const total = count ?? activeIntake.totalHOs;
    const newQ = calculateAutoQuotas(total);
    setQuotas(newQ);
    showToast(`Clinical section capacities updated for N = ${total}.`);
  };

  const runHOAllocation = () => {
    try {
      const summary = allocateHOYear(candidates, quotas);
      setHoSummary(summary);

      const assignedMap = new Map<string, { h1: Specialty; h2: Specialty }>();
      for (const res of summary.results) {
        if (res.assignedPair) {
          assignedMap.set(res.candidateId, res.assignedPair);
        }
      }
      setRhoCandidates(generateInitialRHO3MonthCandidates(candidates, assignedMap));

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      showToast(`Rotations Assigned: ${summary.grantedCount} Confirmed, ${summary.alternativesAvailableCount} with Alternatives.`);

      // Persist allocations to Supabase
      (async () => {
        try {
          await supabase.from('ho_allocations').delete().eq('batch_id', activeIntakeId);
          const rows = summary.results.map((r) => ({
            batch_id: activeIntakeId,
            student_id: r.candidateId,
            status: r.status,
            assigned_h1: r.assignedPair?.h1 || null,
            assigned_h2: r.assignedPair?.h2 || null,
            choice_rank: r.choiceRank || null,
            available_alternatives: r.availableAlternatives || [],
            audit_trail: r.auditTrail || [],
            summary_explanation: r.summaryExplanation || ''
          }));
          const { error } = await supabase.from('ho_allocations').insert(rows);
          if (error) {
            console.error('Supabase allocations insert error:', error);
            showToast(`Allocations sync error: ${error.message}`);
          } else {
            notifyRealtimeChange('ho_allocations', 'runHOAllocation');
          }
        } catch (err) {
          console.error('runHOAllocation persist error:', err);
        }
      })();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showToast(`Allocation Error: ${message}`);
    }
  };

  const submitSwapRequest = (
    type: 'full' | 'h1_only' | 'h2_only',
    targetStudentId: string
  ): SwapValidationResult => {
    if (!hoSummary) {
      return {
        isValid: false,
        studentANewPair: null,
        studentBNewPair: null,
        errorCode: 'INVALID_INPUT',
        reason: 'Rotations have not been allocated yet.'
      };
    }

    const resA = hoSummary.results.find((r) => r.candidateId === currentStudentId);
    const resB = hoSummary.results.find((r) => r.candidateId === targetStudentId);

    if (!resA?.assignedPair || !resB?.assignedPair) {
      return {
        isValid: false,
        studentANewPair: null,
        studentBNewPair: null,
        errorCode: 'INVALID_INPUT',
        reason: 'Both doctors must have confirmed rotation postings to propose an exchange.'
      };
    }

    const swapInput: SwapRequestInput = {
      type,
      studentA: { id: resA.candidateId, name: resA.candidateName, currentPair: resA.assignedPair },
      studentB: { id: resB.candidateId, name: resB.candidateName, currentPair: resB.assignedPair }
    };

    const validation = validateMutualSwap(swapInput);

    if (!validation.isValid) {
      showToast(`Swap Blocked: ${validation.reason}`);
      return validation;
    }

    const newRecord: SwapRecord = {
      id: `swap-${Date.now()}`,
      type,
      studentA: {
        id: resA.candidateId,
        name: resA.candidateName,
        currentPair: resA.assignedPair,
        meritRank: resA.meritRank
      },
      studentB: {
        id: resB.candidateId,
        name: resB.candidateName,
        currentPair: resB.assignedPair,
        meritRank: resB.meritRank
      },
      proposedANewPair: validation.studentANewPair!,
      proposedBNewPair: validation.studentBNewPair!,
      status: 'pending',
      auditReason: validation.reason,
      createdAt: new Date().toLocaleTimeString()
    };

    setSwapRecords((prev) => [newRecord, ...prev]);
    showToast(`Exchange request submitted to ${resB.candidateName}.`);

    (async () => {
      try {
        await supabase.from('ho_swap_requests').insert({
          id: newRecord.id,
          batch_id: activeIntakeId,
          initiator_id: resA.candidateId,
          target_id: resB.candidateId,
          swap_type: type,
          status: 'pending',
          initiator_new_h1: validation.studentANewPair!.h1,
          initiator_new_h2: validation.studentANewPair!.h2,
          target_new_h1: validation.studentBNewPair!.h1,
          target_new_h2: validation.studentBNewPair!.h2,
          audit_reason: validation.reason
        });
        notifyRealtimeChange('ho_swap_requests', 'submitSwapRequest');
      } catch (err) {
        console.error('submitSwapRequest persist error:', err);
      }
    })();

    return validation;
  };

  const respondToSwap = (swapId: string, approve: boolean) => {
    setSwapRecords((prev) =>
      prev.map((s) => {
        if (s.id !== swapId) return s;
        return {
          ...s,
          status: approve ? 'approved' : 'rejected'
        };
      })
    );

    const record = swapRecords.find((s) => s.id === swapId);

    (async () => {
      try {
        await supabase
          .from('ho_swap_requests')
          .update({
            status: approve ? 'approved' : 'rejected',
            updated_at: new Date().toISOString()
          })
          .eq('id', swapId);

        if (approve && record) {
          await supabase
            .from('ho_allocations')
            .update({
              assigned_h1: record.proposedANewPair.h1,
              assigned_h2: record.proposedANewPair.h2,
              summary_explanation: `Updated via approved mutual exchange with ${record.studentB.name}.`
            })
            .eq('student_id', record.studentA.id);

          await supabase
            .from('ho_allocations')
            .update({
              assigned_h1: record.proposedBNewPair.h1,
              assigned_h2: record.proposedBNewPair.h2,
              summary_explanation: `Updated via approved mutual exchange with ${record.studentA.name}.`
            })
            .eq('student_id', record.studentB.id);
        }
        notifyRealtimeChange('ho_swap_requests', 'respondToSwap');
      } catch (err) {
        console.error('respondToSwap persist error:', err);
      }
    })();

    if (approve) {
      if (record && hoSummary) {
        const updatedResults = hoSummary.results.map((r) => {
          if (r.candidateId === record.studentA.id) {
            return {
              ...r,
              assignedPair: record.proposedANewPair,
              summaryExplanation: `Updated via approved mutual exchange with ${record.studentB.name}.`
            };
          }
          if (r.candidateId === record.studentB.id) {
            return {
              ...r,
              assignedPair: record.proposedBNewPair,
              summaryExplanation: `Updated via approved mutual exchange with ${record.studentA.name}.`
            };
          }
          return r;
        });

        setHoSummary({
          ...hoSummary,
          results: updatedResults
        });

        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.5 }
        });

        showToast(`Mutual Exchange Approved! Rotation schedules updated.`);
      }
    } else {
      showToast('Exchange request declined.');
    }
  };

  // Stage 2 RHO
  const updateRHOCandidateChoices = (candidateId: string, choices: [Specialty, Specialty]) => {
    setRhoCandidates(
      rhoCandidates.map((c) => (c.id === candidateId ? { ...c, rankedChoices: choices } : c))
    );
  };

  const runRHO3MonthAllocation = () => {
    try {
      const summary = allocateRHO3Month(rhoCandidates, rhoQuotas);
      setRhoSummary(summary);
      confetti({ particleCount: 70, spread: 60 });
      showToast(`Stage 2 Allocated: ${summary.allocatedCount} doctors assigned 3-month clinical term.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showToast(`Allocation Error: ${message}`);
    }
  };

  // Stage 3 RHO Units
  const submitConsultantPicks = (unitId: string, candidateIds: string[]) => {
    setConsultantPrefs((prev) => {
      const unit = units.find((u) => u.unitId === unitId);
      const existing = prev.filter((p) => p.unitId !== unitId);
      return [
        ...existing,
        {
          unitId,
          consultantName: unit?.consultantName || 'Consultant',
          rankedCandidateIds: candidateIds
        }
      ];
    });
    showToast(`Consultant preferences recorded.`);
  };

  const runRHOUnitMatching = () => {
    try {
      const rhoUnitCandidates: RHOUnitCandidateInput[] = candidates.map((c) => {
        const stage2Assigned = rhoSummary?.results.find((r) => r.candidateId === c.id)?.assignedSpecialty || 'Medicine';
        const matchingUnits = units.filter((u) => u.specialty === stage2Assigned);
        const otherUnits = units.filter((u) => u.specialty !== stage2Assigned);
        const unitPreferences = [...matchingUnits.map((u) => u.unitId), ...otherUnits.map((u) => u.unitId)];

        return {
          id: c.id,
          name: c.name,
          meritRank: c.meritRank,
          assignedSpecialty: stage2Assigned,
          unitPreferences
        };
      });

      const summary = matchRHOUnits(units, rhoUnitCandidates, consultantPrefs);
      setRhoUnitSummary(summary);
      confetti({ particleCount: 80, spread: 70 });
      showToast(`Stage 3 Matched: ${summary.allocatedCount} doctors placed in hospital clinical units.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showToast(`Stage 3 Matching Error: ${message}`);
    }
  };

  // Benchmark Scenarios (Simulator sandbox handler; keeps real intakes completely clean)
  const loadScenario = (scenario: 'even_40' | 'odd_21' | 'remainder_42' | 'extreme_contention') => {
    showToast(`Simulation sandbox scenario "${scenario.replace('_', ' ').toUpperCase()}" executed.`);
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        activeTab,
        setActiveTab,

        // Realtime & Live Sync
        isLiveSyncing: realtimeStatus === 'connected',
        realtimeStatus,
        refreshData: refreshAllDataFromDb,

        // Intakes
        intakes,
        activeIntakeId,
        activeIntake,
        openIntakes,
        isDbLoaded,
        rotationMilestones,
        currentStudentMilestones,
        createIntake,
        updateActiveIntake,
        deleteIntake,
        switchIntake,
        toggleIntakeStatus,

        // Candidates
        candidates,
        setCandidates,
        allCandidates,
        registerStudent,
        loginStudent,
        editCandidate,
        removeCandidate,
        claimAlternative,

        // Quotas
        quotas,
        setQuotas,
        applyAutoQuotas,
        hoSummary,
        selectedAuditCandidate,
        setSelectedAuditCandidate,

        // Active Student
        currentStudentId,
        setCurrentStudentId,
        logoutStudent,
        currentStudent,
        currentStudentResult,
        saveThreeChoices,
        updateStudentPreferences,
        submitAndLockPreferences,
        unlockStudentPreferences,

        // Swaps & Allocations
        runHOAllocation,
        resetAllocations,
        isAllocated,
        swapRecords,
        submitSwapRequest,
        respondToSwap,

        // Stage 2
        rhoCandidates,
        rhoQuotas,
        setRhoQuotas,
        rhoSummary,
        runRHO3MonthAllocation,
        updateRHOCandidateChoices,

        // Stage 3
        units,
        consultantPrefs,
        selectedConsultantPin,
        setSelectedConsultantPin,
        rhoUnitSummary,
        submitConsultantPicks,
        runRHOUnitMatching,

        // Simulator
        loadScenario,
        toastMessage,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
