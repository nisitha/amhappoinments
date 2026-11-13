import {
  HospitalUnitConfig,
  RHOUnitCandidateInput,
  ConsultantPreferences,
  RHOUnitAllocationResult
} from './types';

/**
 * Stage 3 Matcher: RHO Unit / Consultant Matching (Two-Sided Matching)
 *
 * Priority Rules:
 * 1. Mutual Preferences First: Candidates who ranked Unit U AND Consultant U selected them.
 * 2. Oversubscription Tie-Break: When more candidates mutually match than unit capacity,
 *    tie-break strictly by RHO Merit Order.
 * 3. Residual Fill: Remaining unassigned candidates are allocated to open slots strictly
 *    in RHO Merit Order following candidate unit preferences.
 */
export function matchRHOUnits(
  units: HospitalUnitConfig[],
  candidates: RHOUnitCandidateInput[],
  consultantPrefs: ConsultantPreferences[]
): {
  allocatedCount: number;
  unallocatedCount: number;
  unitUtilization: Record<string, number>;
  unitCapacities: Record<string, number>;
  results: RHOUnitAllocationResult[];
} {
  // Sort candidates strictly by Merit Rank
  const sortedCandidates = [...candidates].sort((a, b) => a.meritRank - b.meritRank);

  // Map units and capacities
  const unitMap = new Map<string, HospitalUnitConfig>();
  const unitRemaining = new Map<string, number>();
  const unitCapacities: Record<string, number> = {};
  const unitUtilization: Record<string, number> = {};

  for (const u of units) {
    unitMap.set(u.unitId, u);
    unitRemaining.set(u.unitId, u.capacity);
    unitCapacities[u.unitId] = u.capacity;
    unitUtilization[u.unitId] = 0;
  }

  // Map consultant preferences by unitId
  const consultantSelectionMap = new Map<string, Set<string>>();
  for (const cp of consultantPrefs) {
    consultantSelectionMap.set(cp.unitId, new Set(cp.rankedCandidateIds));
  }

  const assignedMap = new Map<string, RHOUnitAllocationResult>();

  // Pass 1: Mutual Preference Matching in Candidate Merit Order
  // Candidate checks their unit preferences; if consultant also selected candidate and unit has space -> match
  for (const cand of sortedCandidates) {
    for (let pIdx = 0; pIdx < cand.unitPreferences.length; pIdx++) {
      const uId = cand.unitPreferences[pIdx];
      const unit = unitMap.get(uId);
      if (!unit) continue;

      const remainingSlots = unitRemaining.get(uId) ?? 0;
      const consultantPicks = consultantSelectionMap.get(uId);
      const isMutual = consultantPicks ? consultantPicks.has(cand.id) : false;

      if (remainingSlots > 0 && isMutual) {
        // Matched mutually!
        unitRemaining.set(uId, remainingSlots - 1);
        unitUtilization[uId] = (unitUtilization[uId] || 0) + 1;

        assignedMap.set(cand.id, {
          candidateId: cand.id,
          meritRank: cand.meritRank,
          candidateName: cand.name,
          assignedUnitId: unit.unitId,
          assignedUnitName: unit.unitName,
          consultantName: unit.consultantName,
          specialty: unit.specialty,
          matchType: 'MUTUAL_TOP',
          auditReason: `Mutual Top Match: Doctor ranked unit #${pIdx + 1} and Consultant ${unit.consultantName} selected doctor. Secured by Merit Rank #${cand.meritRank}.`
        });
        break; // matched
      }
    }
  }

  // Pass 2: Residual Merit Fill for Unmatched Candidates
  for (const cand of sortedCandidates) {
    if (assignedMap.has(cand.id)) continue;

    let matched = false;
    for (let pIdx = 0; pIdx < cand.unitPreferences.length; pIdx++) {
      const uId = cand.unitPreferences[pIdx];
      const unit = unitMap.get(uId);
      if (!unit) continue;

      const remainingSlots = unitRemaining.get(uId) ?? 0;
      if (remainingSlots > 0) {
        // Assign via Merit Order
        unitRemaining.set(uId, remainingSlots - 1);
        unitUtilization[uId] = (unitUtilization[uId] || 0) + 1;

        assignedMap.set(cand.id, {
          candidateId: cand.id,
          meritRank: cand.meritRank,
          candidateName: cand.name,
          assignedUnitId: unit.unitId,
          assignedUnitName: unit.unitName,
          consultantName: unit.consultantName,
          specialty: unit.specialty,
          matchType: 'MERIT_RESIDUAL',
          auditReason: `Merit Residual Match: Allocated preference #${pIdx + 1} (${unit.unitName} - ${unit.consultantName}) by Merit Rank #${cand.meritRank}.`
        });
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Could not match to any preferred unit with open slots
      assignedMap.set(cand.id, {
        candidateId: cand.id,
        meritRank: cand.meritRank,
        candidateName: cand.name,
        assignedUnitId: null,
        assignedUnitName: null,
        consultantName: null,
        specialty: cand.assignedSpecialty,
        matchType: 'UNMATCHED',
        auditReason: `Unmatched: All preferred units filled prior to Merit Rank #${cand.meritRank}.`
      });
    }
  }

  const results: RHOUnitAllocationResult[] = sortedCandidates.map(c => assignedMap.get(c.id)!);
  const allocatedCount = results.filter(r => r.assignedUnitId !== null).length;
  const unallocatedCount = results.length - allocatedCount;

  return {
    allocatedCount,
    unallocatedCount,
    unitUtilization,
    unitCapacities,
    results
  };
}

