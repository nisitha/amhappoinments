import {
  Specialty,
  CORE_SPECIALTIES,
  RHO3MonthQuotas,
  RHO3MonthCandidateInput,
  RHO3MonthAllocationResult
} from './types';

/**
 * Computes the 2 eligible specialties for an RHO candidate based on their completed HO Year specialties.
 */
export function getEligibleRHO3MonthSpecialties(
  completed: [Specialty, Specialty]
): [Specialty, Specialty] {
  const completedSet = new Set(completed);
  const eligible = CORE_SPECIALTIES.filter(s => !completedSet.has(s)) as Specialty[];

  if (eligible.length !== 2) {
    throw new Error(
      `Invalid completed specialties: [${completed.join(', ')}]. Exactly 2 uncompleted specialties expected, found ${eligible.length}.`
    );
  }

  return [eligible[0], eligible[1]];
}

/**
 * Stage 2 Allocator: RHO Initial Rotation (First 3 Months)
 * - Restricts choices to the 2 uncompleted specialties.
 * - Allocates by Merit Order (Serial Dictatorship).
 * - Feasibility Lookahead: Ensures remaining quotas can cover at least one eligible specialty for all remaining candidates.
 */
export function allocateRHO3Month(
  candidates: RHO3MonthCandidateInput[],
  initialQuotas: RHO3MonthQuotas
): {
  allocatedCount: number;
  unallocatedCount: number;
  utilization: RHO3MonthQuotas;
  remaining: RHO3MonthQuotas;
  results: RHO3MonthAllocationResult[];
} {
  const total = candidates.length;
  const quotaSum =
    initialQuotas.Medicine +
    initialQuotas.Surgery +
    initialQuotas.Pediatrics +
    initialQuotas['Gyn & Obs'];

  if (quotaSum !== total) {
    throw new Error(`Total 3-month quotas (${quotaSum}) do not equal candidate count (${total}).`);
  }

  // Sort strictly by merit rank
  const sorted = [...candidates].sort((a, b) => a.meritRank - b.meritRank);
  const remaining: RHO3MonthQuotas = { ...initialQuotas };
  const results: RHO3MonthAllocationResult[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const candidate = sorted[i];
    const eligible = getEligibleRHO3MonthSpecialties(candidate.completedHOSpecialties);

    // Validate ranked choices are from eligible set
    const candidateChoices: Specialty[] = candidate.rankedChoices.filter(c => eligible.includes(c));
    // Fallback if candidate didn't specify properly
    for (const e of eligible) {
      if (!candidateChoices.includes(e)) candidateChoices.push(e);
    }

    let assigned: Specialty | null = null;
    let assignedChoiceRank: number | null = null;
    let auditReason = '';

    for (let cIdx = 0; cIdx < candidateChoices.length; cIdx++) {
      const choice = candidateChoices[cIdx];
      const choiceRank = cIdx + 1;

      // Check capacity
      if (remaining[choice] <= 0) {
        continue;
      }

      // Lookahead check: if candidate takes `choice`, does any downstream candidate lose both eligible specialties?
      const simulatedRemaining = { ...remaining, [choice]: remaining[choice] - 1 };
      let downstreamFeasible = true;

      for (let j = i + 1; j < sorted.length; j++) {
        const nextCandidate = sorted[j];
        const nextEligible = getEligibleRHO3MonthSpecialties(nextCandidate.completedHOSpecialties);
        const hasAvailableOption =
          simulatedRemaining[nextEligible[0]] > 0 || simulatedRemaining[nextEligible[1]] > 0;

        if (!hasAvailableOption) {
          downstreamFeasible = false;
          break;
        }
      }

      if (!downstreamFeasible) {
        continue; // Bypassed by lookahead to protect downstream candidate
      }

      // Feasible and available
      assigned = choice;
      assignedChoiceRank = choiceRank;
      remaining[choice] -= 1;

      if (choiceRank === 1) {
        auditReason = `Assigned 1st choice (${choice}) based on Merit Rank #${candidate.meritRank}.`;
      } else {
        auditReason = `Assigned 2nd choice (${choice}): 1st choice (${candidateChoices[0]}) quota exhausted or held for downstream feasibility.`;
      }
      break;
    }

    if (assigned && assignedChoiceRank) {
      results.push({
        candidateId: candidate.id,
        meritRank: candidate.meritRank,
        candidateName: candidate.name,
        eligibleSpecialties: eligible,
        assignedSpecialty: assigned,
        choiceRank: assignedChoiceRank,
        status: 'allocated',
        auditReason
      });
    } else {
      results.push({
        candidateId: candidate.id,
        meritRank: candidate.meritRank,
        candidateName: candidate.name,
        eligibleSpecialties: eligible,
        assignedSpecialty: null,
        choiceRank: null,
        status: 'unallocated',
        auditReason: 'Could not allocate either eligible specialty due to quota exhaustion.'
      });
    }
  }

  const utilization: RHO3MonthQuotas = {
    Medicine: initialQuotas.Medicine - remaining.Medicine,
    Surgery: initialQuotas.Surgery - remaining.Surgery,
    Pediatrics: initialQuotas.Pediatrics - remaining.Pediatrics,
    'Gyn & Obs': initialQuotas['Gyn & Obs'] - remaining['Gyn & Obs']
  };

  const allocatedCount = results.filter(r => r.status === 'allocated').length;

  return {
    allocatedCount,
    unallocatedCount: total - allocatedCount,
    utilization,
    remaining,
    results
  };
}

