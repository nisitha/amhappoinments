import {
  Specialty,
  CORE_SPECIALTIES,
  HOPair,
  HOQuotas,
  HOCandidateInput,
  HOAllocationResult,
  HOAllocationBatchSummary,
  CandidateAuditEntry,
  pairToString,
  isValidHOPair,
  ALL_8_HO_PAIRS
} from './types';
import { validateBipartiteQuotas } from './quotaCalculator';

/**
 * Quick-helper filter that auto-sorts the 8 valid combinations based on
 * student's "Preferred H1" and/or "Preferred H2".
 */
export function generateHelperOrderedPairs(
  preferredH1?: Specialty | null,
  preferredH2?: Specialty | null
): HOPair[] {
  return ALL_8_HO_PAIRS.slice().sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (preferredH1) {
      if (a.h1 === preferredH1) scoreA += 10;
      if (b.h1 === preferredH1) scoreB += 10;
    }
    if (preferredH2) {
      if (a.h2 === preferredH2) scoreA += 5;
      if (b.h2 === preferredH2) scoreB += 5;
    }

    return scoreB - scoreA;
  });
}

/**
 * Helper to check whether assigning a pair to a candidate is feasible for remaining M students.
 */
function isPairFeasibleForRemaining(
  pair: HOPair,
  remainingH1: Record<Specialty, number>,
  remainingH2: Record<Specialty, number>,
  unassignedCountAfter: number
): { feasible: boolean; reason?: string } {
  if (remainingH1[pair.h1] <= 0 || remainingH2[pair.h2] <= 0) {
    return { feasible: false, reason: 'Raw capacity exhausted in H1 or H2.' };
  }

  const nextH1: Record<Specialty, number> = {
    ...remainingH1,
    [pair.h1]: remainingH1[pair.h1] - 1
  };
  const nextH2: Record<Specialty, number> = {
    ...remainingH2,
    [pair.h2]: remainingH2[pair.h2] - 1
  };

  // 1. Single specialty bound
  for (const spec of CORE_SPECIALTIES) {
    const combined = nextH1[spec] + nextH2[spec];
    if (combined > unassignedCountAfter) {
      return {
        feasible: false,
        reason: `Combined slots for ${spec} (${combined}) would exceed remaining students (${unassignedCountAfter}).`
      };
    }
  }

  // 2. Bipartite balance invariant
  const nextGroupA_H1 = nextH1.Medicine + nextH1.Pediatrics;
  const nextGroupB_H2 = nextH2.Surgery + nextH2['Gyn & Obs'];
  const nextGroupB_H1 = nextH1.Surgery + nextH1['Gyn & Obs'];
  const nextGroupA_H2 = nextH2.Medicine + nextH2.Pediatrics;

  if (nextGroupA_H1 !== nextGroupB_H2 || nextGroupB_H1 !== nextGroupA_H2) {
    return {
      feasible: false,
      reason: `Clinical section capacity would be unbalanced: Section 1 Medical Group (${nextGroupA_H1}) does not balance with Section 2 Surgical Group (${nextGroupB_H2}).`
    };
  }

  return { feasible: true };
}

/**
 * Finds all valid and feasible alternative combinations from ALL_8_HO_PAIRS
 * for a candidate given current remaining capacities and unassigned count.
 */
export function getFeasibleAlternatives(
  remainingH1: Record<Specialty, number>,
  remainingH2: Record<Specialty, number>,
  unassignedCountAfter: number
): HOPair[] {
  const alternatives: HOPair[] = [];

  for (const pair of ALL_8_HO_PAIRS) {
    const test = isPairFeasibleForRemaining(
      pair,
      remainingH1,
      remainingH2,
      unassignedCountAfter
    );
    if (test.feasible) {
      alternatives.push(pair);
    }
  }

  return alternatives;
}

/**
 * Stage 1 Serial Dictatorship with Bipartite Feasibility Lookahead Allocator.
 *
 * "Granted vs. Available Alternatives" Logic:
 * - Iterates strictly from Merit Rank 1 to N.
 * - If one of the student's requested choices is available and passes feasibility lookahead:
 *   Assigns it immediately with status 'GRANTED'.
 * - If NONE of their requested choices can be granted:
 *   Sets status to 'ALTERNATIVES_AVAILABLE', returns the exact list of remaining valid &
 *   feasible combinations the student can claim without causing downstream clashes.
 */
export function allocateHOYear(
  candidates: HOCandidateInput[],
  initialQuotas: HOQuotas
): HOAllocationBatchSummary {
  const totalStudents = candidates.length;

  const quotaValidation = validateBipartiteQuotas(initialQuotas, totalStudents);
  if (!quotaValidation.valid) {
    throw new Error(`Invalid Quota Configuration: ${quotaValidation.error}`);
  }

  // Sort candidates strictly by Merit Rank (1 .. N)
  const sortedCandidates = [...candidates].sort((a, b) => a.meritRank - b.meritRank);

  // Track remaining slots
  const remainingH1: Record<Specialty, number> = { ...initialQuotas.h1 };
  const remainingH2: Record<Specialty, number> = { ...initialQuotas.h2 };

  const results: HOAllocationResult[] = [];
  const choiceRankDistribution: Record<number, number> = {};

  for (let i = 0; i < sortedCandidates.length; i++) {
    const candidate = sortedCandidates[i];
    const candidateAudit: CandidateAuditEntry[] = [];
    const unassignedCountAfter = totalStudents - i - 1; // M

    let assigned: HOPair | null = null;
    let assignedChoiceRank: number | null = null;

    // 1. If candidate has already claimed a feasible alternative, prioritize it
    if (candidate.claimedAlternative && isValidHOPair(candidate.claimedAlternative.h1, candidate.claimedAlternative.h2)) {
      const alt = candidate.claimedAlternative;
      const test = isPairFeasibleForRemaining(alt, remainingH1, remainingH2, unassignedCountAfter);
      if (test.feasible) {
        assigned = alt;
        assignedChoiceRank = 1;
        remainingH1[alt.h1] -= 1;
        remainingH2[alt.h2] -= 1;

        candidateAudit.push({
          testedPair: alt,
          preferenceRank: 1,
          status: 'ACCEPTED',
          reason: `Assigned claimed alternative rotation (${pairToString(alt)}).`
        });
      }
    }

    // 2. Otherwise, evaluate preferences in rank order (1st, 2nd, 3rd choice or up to 8)
    if (!assigned) {
      const prefs = candidate.preferences.length > 0 ? candidate.preferences : [];

      for (let pIdx = 0; pIdx < prefs.length; pIdx++) {
        const pair = prefs[pIdx];
        const prefNum = pIdx + 1;

        // Check group validity
        if (!isValidHOPair(pair.h1, pair.h2)) {
          candidateAudit.push({
            testedPair: pair,
            preferenceRank: prefNum,
            status: 'REJECTED_INVALID_PAIR',
            reason: `Invalid pairing: ${pair.h1} and ${pair.h2} belong to the same group or duplicate.`
          });
          continue;
        }

        // Check capacity & feasibility lookahead
        const test = isPairFeasibleForRemaining(pair, remainingH1, remainingH2, unassignedCountAfter);
        if (!test.feasible) {
          const isCapacity = remainingH1[pair.h1] <= 0 || remainingH2[pair.h2] <= 0;
          candidateAudit.push({
            testedPair: pair,
            preferenceRank: prefNum,
            status: isCapacity ? 'REJECTED_CAPACITY' : 'REJECTED_FEASIBILITY',
            reason: test.reason || 'Capacity exhausted or feasibility check failed.'
          });
          continue;
        }

        // ACCEPT choice!
        assigned = pair;
        assignedChoiceRank = prefNum;
        remainingH1[pair.h1] -= 1;
        remainingH2[pair.h2] -= 1;

        candidateAudit.push({
          testedPair: pair,
          preferenceRank: prefNum,
          status: 'ACCEPTED',
          reason: `Allocated choice #${prefNum} (${pairToString(pair)}). Quotas available, 1 Group A + 1 Group B verified.`
        });
        break; // Stop evaluating lower preferences
      }
    }

    if (assigned && assignedChoiceRank !== null) {
      choiceRankDistribution[assignedChoiceRank] = (choiceRankDistribution[assignedChoiceRank] || 0) + 1;

      const bypassCount = assignedChoiceRank - 1;
      const summaryExplanation =
        bypassCount === 0
          ? `Granted 1st choice (${pairToString(assigned)}) based on Merit Rank #${candidate.meritRank}.`
          : `Granted choice #${assignedChoiceRank} (${pairToString(assigned)}): ${bypassCount} higher preference(s) bypassed due to quota exhaustion.`;

      results.push({
        candidateId: candidate.id,
        meritRank: candidate.meritRank,
        candidateName: candidate.name,
        assignedPair: assigned,
        choiceRank: assignedChoiceRank,
        status: 'GRANTED',
        availableAlternatives: [],
        auditTrail: candidateAudit,
        summaryExplanation
      });
    } else {
      // Requested choices could not be granted
      // Calculate exact list of remaining valid & feasible combinations
      const alternatives = getFeasibleAlternatives(remainingH1, remainingH2, unassignedCountAfter);

      results.push({
        candidateId: candidate.id,
        meritRank: candidate.meritRank,
        candidateName: candidate.name,
        assignedPair: null,
        choiceRank: null,
        status: 'ALTERNATIVES_AVAILABLE',
        availableAlternatives: alternatives,
        auditTrail: candidateAudit,
        summaryExplanation:
          candidate.preferences.length > 0
            ? `All ${candidate.preferences.length} requested choices were filled by higher merit ranks. ${alternatives.length} feasible alternatives are available to claim.`
            : `No choices were submitted. ${alternatives.length} feasible alternatives are available to claim.`
      });
    }
  }

  // Calculate final utilization
  const h1Utilization: Record<Specialty, number> = {
    Medicine: initialQuotas.h1.Medicine - remainingH1.Medicine,
    Surgery: initialQuotas.h1.Surgery - remainingH1.Surgery,
    Pediatrics: initialQuotas.h1.Pediatrics - remainingH1.Pediatrics,
    'Gyn & Obs': initialQuotas.h1['Gyn & Obs'] - remainingH1['Gyn & Obs']
  };

  const h2Utilization: Record<Specialty, number> = {
    Medicine: initialQuotas.h2.Medicine - remainingH2.Medicine,
    Surgery: initialQuotas.h2.Surgery - remainingH2.Surgery,
    Pediatrics: initialQuotas.h2.Pediatrics - remainingH2.Pediatrics,
    'Gyn & Obs': initialQuotas.h2['Gyn & Obs'] - remainingH2['Gyn & Obs']
  };

  const clashesCount = results.filter(
    (r) => r.assignedPair && r.assignedPair.h1 === r.assignedPair.h2
  ).length;

  const forbiddenPairCount = results.filter(
    (r) => r.assignedPair && !isValidHOPair(r.assignedPair.h1, r.assignedPair.h2)
  ).length;

  const grantedCount = results.filter((r) => r.status === 'GRANTED').length;
  const alternativesAvailableCount = results.filter((r) => r.status === 'ALTERNATIVES_AVAILABLE').length;

  return {
    totalStudents,
    grantedCount,
    alternativesAvailableCount,
    clashesCount,
    forbiddenPairCount,
    h1Utilization,
    h2Utilization,
    h1Remaining: remainingH1,
    h2Remaining: remainingH2,
    choiceRankDistribution,
    results
  };
}

/**
 * Independent verification function for test suites and admin sanity checks.
 */
export function verifyAllocationCorrectness(
  summary: HOAllocationBatchSummary,
  expectedQuotas: HOQuotas
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Clashes check
  if (summary.clashesCount > 0) {
    errors.push(`Found ${summary.clashesCount} duplicate half violations (H1 == H2).`);
  }

  // 2. Forbidden pairs check (Med+Ped or Surg+Gyn)
  if (summary.forbiddenPairCount > 0) {
    errors.push(`Found ${summary.forbiddenPairCount} forbidden group combination violations.`);
  }

  // 3. For any candidate with status ALTERNATIVES_AVAILABLE, verify all alternatives are valid
  for (const res of summary.results) {
    if (res.status === 'ALTERNATIVES_AVAILABLE') {
      for (const alt of res.availableAlternatives) {
        if (!isValidHOPair(alt.h1, alt.h2)) {
          errors.push(`Candidate #${res.meritRank} has invalid alternative: ${pairToString(alt)}`);
        }
      }
    }
  }

  // 4. Individual integrity check
  for (const res of summary.results) {
    if (res.status === 'GRANTED' && res.assignedPair) {
      if (!isValidHOPair(res.assignedPair.h1, res.assignedPair.h2)) {
        errors.push(
          `Student #${res.meritRank} (${res.candidateName}) has forbidden combination [${pairToString(res.assignedPair)}].`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
