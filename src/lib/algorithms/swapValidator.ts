import { HOPair, SwapRequestInput, SwapValidationResult, pairToString, isValidHOPair } from './types';

/**
 * Validates a mutual swap request between two students.
 * Supports:
 *  - 'full': Swap both H1 and H2
 *  - 'h1_only': Swap H1 half only
 *  - 'h2_only': Swap H2 half only
 *
 * Strict Constraints:
 * 1. Neither student can end up with the same specialty in both H1 and H2.
 * 2. Every student must complete exactly 1 Medical (Group A) + 1 Surgical (Group B) specialty.
 *    Forbidden: Medicine + Pediatrics, Surgery + Gyn & Obs.
 */
export function validateMutualSwap(input: SwapRequestInput): SwapValidationResult {
  const { type, studentA, studentB } = input;

  if (!studentA?.currentPair || !studentB?.currentPair) {
    return {
      isValid: false,
      studentANewPair: null,
      studentBNewPair: null,
      errorCode: 'INVALID_INPUT',
      reason: 'Missing current allocation pairs for student A or student B.'
    };
  }

  const aPair = studentA.currentPair;
  const bPair = studentB.currentPair;

  // Check if they are trying to swap identical schedules
  if (aPair.h1 === bPair.h1 && aPair.h2 === bPair.h2) {
    return {
      isValid: false,
      studentANewPair: null,
      studentBNewPair: null,
      errorCode: 'NO_CHANGE',
      reason: 'Both students currently hold the exact same rotation schedule. No change would occur.'
    };
  }

  let newAPair: HOPair;
  let newBPair: HOPair;

  switch (type) {
    case 'full':
      newAPair = { h1: bPair.h1, h2: bPair.h2 };
      newBPair = { h1: aPair.h1, h2: aPair.h2 };
      break;

    case 'h1_only':
      // A gets B's H1, keeps A's H2
      newAPair = { h1: bPair.h1, h2: aPair.h2 };
      // B gets A's H1, keeps B's H2
      newBPair = { h1: aPair.h1, h2: bPair.h2 };
      break;

    case 'h2_only':
      // A keeps A's H1, gets B's H2
      newAPair = { h1: aPair.h1, h2: bPair.h2 };
      // B keeps B's H1, gets A's H2
      newBPair = { h1: bPair.h1, h2: aPair.h2 };
      break;

    default:
      return {
        isValid: false,
        studentANewPair: null,
        studentBNewPair: null,
        errorCode: 'INVALID_INPUT',
        reason: `Unsupported swap type: ${type}`
      };
  }

  // 1. Check duplicate specialty violations (H1 == H2)
  const aDuplicate = newAPair.h1 === newAPair.h2;
  const bDuplicate = newBPair.h1 === newBPair.h2;

  if (aDuplicate && bDuplicate) {
    return {
      isValid: false,
      studentANewPair: null,
      studentBNewPair: null,
      errorCode: 'IDENTICAL_BOTH',
      reason: `Swap rejected: Both ${studentA.name} and ${studentB.name} would have duplicate specialty (${newAPair.h1}).`
    };
  }

  if (aDuplicate) {
    return {
      isValid: false,
      studentANewPair: null,
      studentBNewPair: null,
      errorCode: 'IDENTICAL_HALVES_STUDENT_A',
      reason: `Swap rejected: ${studentA.name} would end up with duplicate specialty (${newAPair.h1}) in both H1 and H2.`
    };
  }

  if (bDuplicate) {
    return {
      isValid: false,
      studentANewPair: null,
      studentBNewPair: null,
      errorCode: 'IDENTICAL_HALVES_STUDENT_B',
      reason: `Swap rejected: ${studentB.name} would end up with duplicate specialty (${newBPair.h1}) in both H1 and H2.`
    };
  }

  // 2. Check forbidden group pairing violations (Med+Ped or Surg+Gyn)
  const aValidGroup = isValidHOPair(newAPair.h1, newAPair.h2);
  const bValidGroup = isValidHOPair(newBPair.h1, newBPair.h2);

  if (!aValidGroup && !bValidGroup) {
    return {
      isValid: false,
      studentANewPair: null,
      studentBNewPair: null,
      errorCode: 'FORBIDDEN_PAIR_BOTH',
      reason: `Swap rejected: Both students would end up with forbidden combinations (must have 1 Medical [Group A] + 1 Surgical [Group B]).`
    };
  }

  if (!aValidGroup) {
    return {
      isValid: false,
      studentANewPair: null,
      studentBNewPair: null,
      errorCode: 'FORBIDDEN_PAIR_STUDENT_A',
      reason: `Swap rejected: ${studentA.name} would end up with forbidden combination [${pairToString(newAPair)}]. Must pair 1 Medical (Group A) + 1 Surgical (Group B).`
    };
  }

  if (!bValidGroup) {
    return {
      isValid: false,
      studentANewPair: null,
      studentBNewPair: null,
      errorCode: 'FORBIDDEN_PAIR_STUDENT_B',
      reason: `Swap rejected: ${studentB.name} would end up with forbidden combination [${pairToString(newBPair)}]. Must pair 1 Medical (Group A) + 1 Surgical (Group B).`
    };
  }

  // Check no-op
  if (
    newAPair.h1 === aPair.h1 &&
    newAPair.h2 === aPair.h2 &&
    newBPair.h1 === bPair.h1 &&
    newBPair.h2 === bPair.h2
  ) {
    return {
      isValid: false,
      studentANewPair: null,
      studentBNewPair: null,
      errorCode: 'NO_CHANGE',
      reason: 'Swap results in no change to current allocations.'
    };
  }

  return {
    isValid: true,
    studentANewPair: newAPair,
    studentBNewPair: newBPair,
    reason: `Valid ${type.replace('_', ' ')} swap approved: ${studentA.name} gets [${pairToString(newAPair)}], ${studentB.name} gets [${pairToString(newBPair)}].`
  };
}
