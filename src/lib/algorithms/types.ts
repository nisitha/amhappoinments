export type Specialty = 'Medicine' | 'Surgery' | 'Pediatrics' | 'Gyn & Obs';

export type SpecialtyGroup = 'Group A' | 'Group B';

export const GROUP_A_SPECIALTIES: readonly Specialty[] = ['Medicine', 'Pediatrics'] as const;
export const GROUP_B_SPECIALTIES: readonly Specialty[] = ['Surgery', 'Gyn & Obs'] as const;

export const CORE_SPECIALTIES: readonly Specialty[] = [
  'Medicine',
  'Surgery',
  'Pediatrics',
  'Gyn & Obs'
] as const;

export function getSpecialtyGroup(spec: Specialty): SpecialtyGroup {
  if (spec === 'Medicine' || spec === 'Pediatrics') return 'Group A';
  return 'Group B';
}

export interface HOPair {
  h1: Specialty;
  h2: Specialty;
}

export function pairToString(pair: HOPair): string {
  return `${pair.h1} -> ${pair.h2}`;
}

export function parsePair(str: string): HOPair {
  const parts = str.split('->').map(s => s.trim()) as Specialty[];
  if (parts.length !== 2 || !CORE_SPECIALTIES.includes(parts[0]) || !CORE_SPECIALTIES.includes(parts[1])) {
    throw new Error(`Invalid HOPair string format: "${str}"`);
  }
  return { h1: parts[0], h2: parts[1] };
}

/**
 * Validates whether an (H1, H2) combination is permitted.
 * Rules:
 * 1. H1 != H2 (No duplicate half)
 * 2. Exactly 1 specialty from Medical Group (Group A: Medicine, Pediatrics)
 * 3. Exactly 1 specialty from Surgical Group (Group B: Surgery, Gyn & Obs)
 * Forbidden: Medicine + Pediatrics (either order), Surgery + Gyn & Obs (either order).
 */
export function isValidHOPair(h1: Specialty, h2: Specialty): boolean {
  if (h1 === h2) return false;
  const group1 = getSpecialtyGroup(h1);
  const group2 = getSpecialtyGroup(h2);
  return group1 !== group2;
}

/**
 * Returns the permitted H2 specialties given an H1 choice.
 * Tapping H1 automatically disables same-group and duplicate specialties for H2.
 */
export function getPermittedH2Specialties(h1: Specialty): Specialty[] {
  const h1Group = getSpecialtyGroup(h1);
  return CORE_SPECIALTIES.filter(s => getSpecialtyGroup(s) !== h1Group);
}

// Strictly 8 valid non-repeating pairs complying with 1 Group A + 1 Group B
export const ALL_8_HO_PAIRS: readonly HOPair[] = [
  { h1: 'Medicine', h2: 'Surgery' },
  { h1: 'Surgery', h2: 'Medicine' },
  { h1: 'Medicine', h2: 'Gyn & Obs' },
  { h1: 'Gyn & Obs', h2: 'Medicine' },
  { h1: 'Pediatrics', h2: 'Surgery' },
  { h1: 'Surgery', h2: 'Pediatrics' },
  { h1: 'Pediatrics', h2: 'Gyn & Obs' },
  { h1: 'Gyn & Obs', h2: 'Pediatrics' }
] as const;

export interface QuotaMap {
  Medicine: number;
  Surgery: number;
  Pediatrics: number;
  'Gyn & Obs': number;
}

export interface HOQuotas {
  h1: QuotaMap;
  h2: QuotaMap;
}

export interface Intake {
  id: string; // e.g., 'intake-2026-nov'
  name: string; // e.g., '2026 November Intake'
  appointmentStartDate: string; // '2026-11-16'
  totalHOs: number; // e.g., 40
  status: 'open' | 'closed'; // 'open' allows doctor registration
  createdAt: string;
}

export interface HOCandidateInput {
  id: string;
  name: string;
  meritRank: number;
  mobileNumber?: string; // Sri Lankan mobile number e.g. 0771234567
  intakeId?: string; // Associated intake ID
  pin?: string; // 4-digit PIN for self-registration & login
  preferences: HOPair[]; // 1st, 2nd, and 3rd choice from 2-tap UI (or up to 8)
  claimedAlternative?: HOPair | null; // Set when student claims an available alternative
  isLocked?: boolean; // When true, preferences are permanently locked
  submittedAt?: string | null; // Timestamp of submission lock
}

export interface CandidateAuditEntry {
  testedPair: HOPair;
  preferenceRank: number; // 1-indexed
  status: 'ACCEPTED' | 'REJECTED_CAPACITY' | 'REJECTED_FEASIBILITY' | 'REJECTED_INVALID_PAIR';
  reason: string;
}

export type HOAllocationStatus = 'GRANTED' | 'ALTERNATIVES_AVAILABLE';

export interface HOAllocationResult {
  candidateId: string;
  meritRank: number;
  candidateName: string;
  assignedPair: HOPair | null;
  choiceRank: number | null; // 1, 2, or 3 (or null if alternatives available)
  status: HOAllocationStatus;
  availableAlternatives: HOPair[]; // Feasible alternatives if status is ALTERNATIVES_AVAILABLE
  auditTrail: CandidateAuditEntry[];
  summaryExplanation: string;
}

export interface HOAllocationBatchSummary {
  totalStudents: number;
  grantedCount: number;
  alternativesAvailableCount: number;
  clashesCount: number;
  forbiddenPairCount: number;
  h1Utilization: QuotaMap;
  h2Utilization: QuotaMap;
  h1Remaining: QuotaMap;
  h2Remaining: QuotaMap;
  choiceRankDistribution: Record<number, number>; // Choice 1, 2, 3..
  results: HOAllocationResult[];
}

// Stage 1 Swap Models
export type SwapType = 'full' | 'h1_only' | 'h2_only';

export interface SwapRequestInput {
  type: SwapType;
  studentA: {
    id: string;
    name: string;
    currentPair: HOPair;
  };
  studentB: {
    id: string;
    name: string;
    currentPair: HOPair;
  };
}

export interface SwapValidationResult {
  isValid: boolean;
  studentANewPair: HOPair | null;
  studentBNewPair: HOPair | null;
  errorCode?:
    | 'IDENTICAL_HALVES_STUDENT_A'
    | 'IDENTICAL_HALVES_STUDENT_B'
    | 'IDENTICAL_BOTH'
    | 'FORBIDDEN_PAIR_STUDENT_A'
    | 'FORBIDDEN_PAIR_STUDENT_B'
    | 'FORBIDDEN_PAIR_BOTH'
    | 'NO_CHANGE'
    | 'INVALID_INPUT';
  reason: string;
}

// Stage 2 RHO Models
export interface RHO3MonthQuotas {
  Medicine: number;
  Surgery: number;
  Pediatrics: number;
  'Gyn & Obs': number;
}

export interface RHO3MonthCandidateInput {
  id: string;
  name: string;
  meritRank: number;
  completedHOSpecialties: [Specialty, Specialty]; // 1 Group A + 1 Group B
  rankedChoices: [Specialty, Specialty]; // 1st & 2nd choice from the remaining (1 Group A + 1 Group B)
}

export interface RHO3MonthAllocationResult {
  candidateId: string;
  meritRank: number;
  candidateName: string;
  eligibleSpecialties: [Specialty, Specialty];
  assignedSpecialty: Specialty | null;
  choiceRank: number | null; // 1 or 2
  status: 'allocated' | 'unallocated';
  auditReason: string;
}

// Stage 3 RHO Unit Models
export interface HospitalUnitConfig {
  unitId: string;
  unitName: string;
  specialty: Specialty;
  consultantName: string;
  capacity: number;
  magicPin: string; // 4-digit PIN for frictionless login
}

export interface RHOUnitCandidateInput {
  id: string;
  name: string;
  meritRank: number;
  assignedSpecialty: Specialty; // from Stage 2
  unitPreferences: string[]; // unitIds in order of preference
}

export interface ConsultantPreferences {
  unitId: string;
  consultantName: string;
  rankedCandidateIds: string[]; // candidate IDs ranked by consultant
}

export interface RHOUnitAllocationResult {
  candidateId: string;
  meritRank: number;
  candidateName: string;
  assignedUnitId: string | null;
  assignedUnitName: string | null;
  consultantName: string | null;
  specialty: Specialty;
  matchType: 'MUTUAL_TOP' | 'CONSULTANT_PREFERRED_MERIT' | 'MERIT_RESIDUAL' | 'UNMATCHED';
  auditReason: string;
}
