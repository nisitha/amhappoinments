import { HOQuotas, Specialty, CORE_SPECIALTIES } from './types';

/**
 * Dynamic Auto-Quota Calculator for Stage 1 (HO Year)
 *
 * Rules:
 * - Base capacity: floor(N / 4) per specialty per half.
 * - Remainder slots (N % 4) are allocated by demand priority:
 *   Priority 1: Medicine (Group A)
 *   Priority 2: Surgery (Group B)
 *   Priority 3: Pediatrics (Group A)
 *   Priority 4: Gyn & Obs (Group B)
 * - Strict Bipartite Balance Invariant:
 *   1. H1[Med] + H1[Ped] == H2[Surg] + H2[Gyn] (Students doing Group A in H1 must do Group B in H2)
 *   2. H1[Surg] + H1[Gyn] == H2[Med] + H2[Ped] (Students doing Group B in H1 must do Group A in H2)
 *   3. Sum(H1) == Sum(H2) == N
 */
export function calculateAutoQuotas(totalStudents: number): HOQuotas {
  if (totalStudents <= 0) {
    throw new Error(`Total students must be greater than 0, got ${totalStudents}`);
  }

  const base = Math.floor(totalStudents / 4);
  const remainder = totalStudents % 4;

  const h1 = {
    Medicine: base,
    Surgery: base,
    Pediatrics: base,
    'Gyn & Obs': base
  };

  const h2 = {
    Medicine: base,
    Surgery: base,
    Pediatrics: base,
    'Gyn & Obs': base
  };

  switch (remainder) {
    case 0:
      // Even division (e.g. N = 40): 10 / 10 / 10 / 10 in both halves
      break;

    case 1:
      // N = 21: Base 5, remainder 1
      // H1: +1 to Medicine (highest demand in Group A) -> Group A sum = 2b + 1, Group B sum = 2b
      // H2: Group B must equal 2b + 1 -> +1 to Surgery (highest demand in Group B)
      h1.Medicine += 1;
      h2.Surgery += 1;
      break;

    case 2:
      // N = 42: Base 10, remainder 2
      // Priority 1: Medicine (+1), Priority 2: Surgery (+1)
      // H1: Med +1, Surg +1 -> Group A = 2b + 1, Group B = 2b + 1
      // H2: Group B must equal 2b + 1 (Surg +1), Group A must equal 2b + 1 (Med +1)
      h1.Medicine += 1;
      h1.Surgery += 1;
      h2.Medicine += 1;
      h2.Surgery += 1;
      break;

    case 3:
      // N = 23: Base 5, remainder 3
      // H1: Med +1, Surg +1, Ped +1 -> Group A = 2b + 2, Group B = 2b + 1
      // H2: Group B must equal 2b + 2 (Surg +1, Gyn +1), Group A must equal 2b + 1 (Med +1)
      h1.Medicine += 1;
      h1.Surgery += 1;
      h1.Pediatrics += 1;

      h2.Surgery += 1;
      h2['Gyn & Obs'] += 1;
      h2.Medicine += 1;
      break;
  }

  return { h1, h2 };
}

/**
 * Validates HO Quotas against strict mathematical domain invariants.
 */
export function validateBipartiteQuotas(
  quotas: HOQuotas,
  totalStudents: number
): { valid: boolean; error?: string } {
  let sumH1 = 0;
  let sumH2 = 0;

  for (const spec of CORE_SPECIALTIES) {
    const q1 = quotas.h1[spec] ?? 0;
    const q2 = quotas.h2[spec] ?? 0;
    if (q1 < 0 || q2 < 0) {
      return { valid: false, error: `Quota for ${spec} cannot be negative.` };
    }
    sumH1 += q1;
    sumH2 += q2;
  }

  if (sumH1 !== totalStudents) {
    return {
      valid: false,
      error: `Sum of H1 quotas (${sumH1}) must equal total batch size (${totalStudents}).`
    };
  }

  if (sumH2 !== totalStudents) {
    return {
      valid: false,
      error: `Sum of H2 quotas (${sumH2}) must equal total batch size (${totalStudents}).`
    };
  }

  // Bipartite Invariant 1: Group A in H1 == Group B in H2
  const h1GroupA = quotas.h1.Medicine + quotas.h1.Pediatrics;
  const h2GroupB = quotas.h2.Surgery + quotas.h2['Gyn & Obs'];
  if (h1GroupA !== h2GroupB) {
    return {
      valid: false,
      error: `Section Capacity Unbalanced: Section 1 Medical Group (${h1GroupA} slots) must equal Section 2 Surgical Group (${h2GroupB} slots).`
    };
  }

  // Section Invariant 2: Group B in H1 == Group A in H2
  const h1GroupB = quotas.h1.Surgery + quotas.h1['Gyn & Obs'];
  const h2GroupA = quotas.h2.Medicine + quotas.h2.Pediatrics;
  if (h1GroupB !== h2GroupA) {
    return {
      valid: false,
      error: `Section Capacity Unbalanced: Section 1 Surgical Group (${h1GroupB} slots) must equal Section 2 Medical Group (${h2GroupA} slots).`
    };
  }

  // Single specialty feasibility
  for (const spec of CORE_SPECIALTIES) {
    const combined = quotas.h1[spec] + quotas.h2[spec];
    if (combined > totalStudents) {
      return {
        valid: false,
        error: `Feasibility violation: Combined quota for ${spec} (${combined}) exceeds batch size (${totalStudents}).`
      };
    }
  }

  return { valid: true };
}

