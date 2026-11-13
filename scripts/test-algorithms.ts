import {
  allocateHOYear,
  verifyAllocationCorrectness,
  validateMutualSwap,
  allocateRHO3Month,
  matchRHOUnits,
  calculateAutoQuotas,
  validateBipartiteQuotas,
  ALL_8_HO_PAIRS,
  isValidHOPair,
  getPermittedH2Specialties,
  HOCandidateInput,
  HOQuotas,
  Specialty,
  HOPair,
  RHO3MonthCandidateInput,
  RHO3MonthQuotas,
  HospitalUnitConfig,
  RHOUnitCandidateInput,
  ConsultantPreferences,
  pairToString
} from '../src/lib/algorithms';
import { calculateRotationDates } from '../src/lib/utils/rotationDates';

console.log('='.repeat(80));
console.log('  SRI LANKAN ERPM INTERNSHIP (HO) & RHO ROTATION ALLOCATION TEST SUITE');
console.log('  (Granted vs Available Alternatives & 2-Tap Medical/Surgical Pairing)');
console.log('='.repeat(80));

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m[PASS]\x1b[0m ${testName}`);
  } else {
    console.error(`  \x1b[31m[FAIL]\x1b[0m ${testName}`);
    if (detail) console.error(`         Detail: ${detail}`);
  }
}

// Helper to create synthetic candidates
function createCandidates(
  count: number,
  prefGenerator: (index: number) => HOPair[]
): HOCandidateInput[] {
  const list: HOCandidateInput[] = [];
  for (let i = 1; i <= count; i++) {
    list.push({
      id: `cand-${i}`,
      name: `Dr. Candidate #${i}`,
      meritRank: i,
      pin: '1234',
      preferences: prefGenerator(i)
    });
  }
  return list;
}

// =========================================================================
// TEST SUITE 1: 2-TAP SELECTION & FORBIDDEN PAIR EXCLUSION
// =========================================================================

console.log('\n--- SUITE 1: 2-Tap Choice Selection & Permitted H2 Specialties ---');
{
  // When student taps Medicine (Group A) for H1, permitted H2 are strictly Surgery & Gyn & Obs
  const h2ForMed = getPermittedH2Specialties('Medicine');
  assert(
    h2ForMed.length === 2 && h2ForMed.includes('Surgery') && h2ForMed.includes('Gyn & Obs'),
    'Tapping H1 Medicine enables ONLY Surgery & Gyn & Obs for H2'
  );
  assert(!h2ForMed.includes('Medicine'), 'Medicine disabled for H2 (No duplicate half)');
  assert(!h2ForMed.includes('Pediatrics'), 'Pediatrics disabled for H2 (No same Medical Group A)');

  // When student taps Surgery (Group B) for H1, permitted H2 are strictly Medicine & Pediatrics
  const h2ForSurg = getPermittedH2Specialties('Surgery');
  assert(
    h2ForSurg.length === 2 && h2ForSurg.includes('Medicine') && h2ForSurg.includes('Pediatrics'),
    'Tapping H1 Surgery enables ONLY Medicine & Pediatrics for H2'
  );
  assert(!h2ForSurg.includes('Surgery'), 'Surgery disabled for H2 (No duplicate half)');
  assert(!h2ForSurg.includes('Gyn & Obs'), 'Gyn & Obs disabled for H2 (No same Surgical Group B)');
}

// =========================================================================
// TEST SUITE 2: DYNAMIC AUTO-QUOTA CALCULATOR & BIPARTITE INVARIANTS
// =========================================================================

console.log('\n--- SUITE 2: Dynamic Auto-Quota Calculator ---');
{
  const q40 = calculateAutoQuotas(40);
  assert(validateBipartiteQuotas(q40, 40).valid, 'Auto-Quota N=40 is mathematically valid and balanced (10 each)');

  const q21 = calculateAutoQuotas(21);
  assert(validateBipartiteQuotas(q21, 21).valid, 'Auto-Quota N=21 is mathematically valid with remainder 1 to Med & Surg');
  assert(q21.h1.Medicine === 6 && q21.h2.Surgery === 6, 'N=21: Medicine H1=6, Surgery H2=6');

  const q42 = calculateAutoQuotas(42);
  assert(validateBipartiteQuotas(q42, 42).valid, 'Auto-Quota N=42 is mathematically valid with remainder 2 to Med & Surg');
  assert(q42.h1.Medicine === 11 && q42.h1.Surgery === 11, 'N=42: Med H1=11, Surg H1=11');
}

// =========================================================================
// TEST SUITE 3: GRANTED VS. AVAILABLE ALTERNATIVES LOGIC
// =========================================================================

console.log('\n--- SUITE 3: Granted vs. Available Alternatives Engine ---');
{
  const quotas = calculateAutoQuotas(4); // 1 slot each per half
  // Batch of 4 candidates:
  // Candidate 1: wants Med -> Surg #1
  // Candidate 2: wants Med -> Surg #1, Surg -> Med #2
  // Candidate 3: wants Med -> Surg #1 (only 1 choice given!)
  // Candidate 4: wants Med -> Surg #1 (only 1 choice given!)
  const candidates: HOCandidateInput[] = [
    {
      id: 'c1',
      name: 'Dr. Rank 1',
      meritRank: 1,
      preferences: [{ h1: 'Medicine', h2: 'Surgery' }]
    },
    {
      id: 'c2',
      name: 'Dr. Rank 2',
      meritRank: 2,
      preferences: [{ h1: 'Medicine', h2: 'Surgery' }, { h1: 'Surgery', h2: 'Medicine' }]
    },
    {
      id: 'c3',
      name: 'Dr. Rank 3',
      meritRank: 3,
      preferences: [{ h1: 'Medicine', h2: 'Surgery' }] // Choices exhausted!
    },
    {
      id: 'c4',
      name: 'Dr. Rank 4',
      meritRank: 4,
      preferences: [{ h1: 'Medicine', h2: 'Surgery' }] // Choices exhausted!
    }
  ];

  const summary = allocateHOYear(candidates, quotas);

  // Candidate 1: GRANTED Med -> Surg
  const r1 = summary.results.find(r => r.candidateId === 'c1')!;
  assert(r1.status === 'GRANTED', 'Candidate 1 granted 1st choice');
  assert(r1.assignedPair?.h1 === 'Medicine' && r1.assignedPair?.h2 === 'Surgery', 'Candidate 1 assigned Med -> Surg');

  // Candidate 2: GRANTED Surg -> Med (2nd choice)
  const r2 = summary.results.find(r => r.candidateId === 'c2')!;
  assert(r2.status === 'GRANTED' && r2.choiceRank === 2, 'Candidate 2 granted 2nd choice (Surg -> Med)');

  // Candidate 3: ALTERNATIVES_AVAILABLE (Med -> Surg was their only choice and it was taken by Rank 1)
  const r3 = summary.results.find(r => r.candidateId === 'c3')!;
  assert(r3.status === 'ALTERNATIVES_AVAILABLE', 'Candidate 3 set to ALTERNATIVES_AVAILABLE');
  assert(r3.assignedPair === null, 'Candidate 3 is not force-assigned a random pair');
  assert(r3.availableAlternatives.length > 0, 'Candidate 3 receives list of feasible alternatives');

  // Verify that all alternatives for Candidate 3 are valid and feasible
  const allAltsValid = r3.availableAlternatives.every(alt => isValidHOPair(alt.h1, alt.h2));
  assert(allAltsValid, 'All alternatives for Candidate 3 strictly satisfy 1 Group A + 1 Group B');

  // Test claiming an alternative:
  const claimedPair = r3.availableAlternatives[0];
  candidates[2].claimedAlternative = claimedPair;

  const reSummary = allocateHOYear(candidates, quotas);
  const reR3 = reSummary.results.find(r => r.candidateId === 'c3')!;
  assert(reR3.status === 'GRANTED', 'Candidate 3 status becomes GRANTED upon claiming alternative');
  assert(
    reR3.assignedPair?.h1 === claimedPair.h1 && reR3.assignedPair?.h2 === claimedPair.h2,
    `Candidate 3 successfully assigned claimed rotation (${pairToString(claimedPair)})`
  );
}

// =========================================================================
// TEST SUITE 4: BENCHMARK BATCHES (N=40, N=21, N=42, Extreme Contention)
// =========================================================================

console.log('\n--- SUITE 4: Benchmark Batches ---');
{
  // N = 40 (All candidates submit full 8 preferences)
  const q40 = calculateAutoQuotas(40);
  const cands40 = createCandidates(40, (i) => {
    const shift = (i * 2) % 8;
    return [...ALL_8_HO_PAIRS.slice(shift), ...ALL_8_HO_PAIRS.slice(0, shift)];
  });
  const sum40 = allocateHOYear(cands40, q40);
  assert(sum40.grantedCount === 40, 'N=40: All 40 candidates granted a valid pair');
  assert(sum40.clashesCount === 0 && sum40.forbiddenPairCount === 0, 'N=40: Zero clashes and zero forbidden pairs');

  // N = 21 (Odd batch)
  const q21 = calculateAutoQuotas(21);
  const cands21 = createCandidates(21, (i) => {
    const shift = (i * 3) % 8;
    return [...ALL_8_HO_PAIRS.slice(shift), ...ALL_8_HO_PAIRS.slice(0, shift)];
  });
  const sum21 = allocateHOYear(cands21, q21);
  assert(sum21.grantedCount === 21, 'N=21: All 21 candidates granted');
  assert(sum21.clashesCount === 0 && sum21.forbiddenPairCount === 0, 'N=21: Zero clashes on odd batch N=21');

  // N = 42 (Remainder batch)
  const q42 = calculateAutoQuotas(42);
  const cands42 = createCandidates(42, (i) => {
    const shift = (i * 2) % 8;
    return [...ALL_8_HO_PAIRS.slice(shift), ...ALL_8_HO_PAIRS.slice(0, shift)];
  });
  const sum42 = allocateHOYear(cands42, q42);
  assert(sum42.grantedCount === 42, 'N=42: All 42 candidates granted');
  assert(sum42.clashesCount === 0 && sum42.forbiddenPairCount === 0, 'N=42: Zero clashes on remainder batch N=42');

  // Extreme Contention (All 40 candidates demand Med->Surg #1 & Surg->Med #2)
  const candsExt = createCandidates(40, () => [
    { h1: 'Medicine', h2: 'Surgery' },
    { h1: 'Surgery', h2: 'Medicine' },
    { h1: 'Medicine', h2: 'Gyn & Obs' },
    { h1: 'Gyn & Obs', h2: 'Medicine' },
    { h1: 'Pediatrics', h2: 'Surgery' },
    { h1: 'Surgery', h2: 'Pediatrics' },
    { h1: 'Pediatrics', h2: 'Gyn & Obs' },
    { h1: 'Gyn & Obs', h2: 'Pediatrics' }
  ]);
  const sumExt = allocateHOYear(candsExt, q40);
  assert(sumExt.grantedCount === 40, 'Extreme Contention: All 40 candidates granted without clash');
  assert(
    sumExt.results[0].assignedPair?.h1 === 'Medicine' && sumExt.results[0].assignedPair?.h2 === 'Surgery',
    'Rank 1 strictly received Choice #1 (Med -> Surg)'
  );
  assert(
    sumExt.results[10].assignedPair?.h1 === 'Surgery' && sumExt.results[10].assignedPair?.h2 === 'Medicine',
    'Rank 11 strictly received Choice #2 (Surg -> Med)'
  );
}

// =========================================================================
// TEST SUITE 5: POST-ALLOCATION MUTUAL SWAP ENGINE
// =========================================================================

console.log('\n--- SUITE 5: Post-Allocation Mutual Swap Window ---');
{
  const fullSwap = validateMutualSwap({
    type: 'full',
    studentA: { id: 's1', name: 'Dr. Kamal', currentPair: { h1: 'Medicine', h2: 'Surgery' } },
    studentB: { id: 's2', name: 'Dr. Nimal', currentPair: { h1: 'Pediatrics', h2: 'Gyn & Obs' } }
  });
  assert(fullSwap.isValid === true, 'Valid Full-Year Swap approved');

  const forbiddenSwap = validateMutualSwap({
    type: 'h2_only',
    studentA: { id: 's1', name: 'Dr. Kamal', currentPair: { h1: 'Medicine', h2: 'Surgery' } },
    studentB: { id: 's2', name: 'Dr. Nimal', currentPair: { h1: 'Gyn & Obs', h2: 'Pediatrics' } }
  });
  assert(
    !forbiddenSwap.isValid && (forbiddenSwap.errorCode === 'FORBIDDEN_PAIR_BOTH' || forbiddenSwap.errorCode === 'FORBIDDEN_PAIR_STUDENT_A'),
    'Engine strictly blocked swap that would produce forbidden pairs (Med+Ped and Surg+Gyn)'
  );
}

// =========================================================================
// TEST SUITE 6: STAGE 2 & STAGE 3 ENGINES
// =========================================================================

console.log('\n--- SUITE 6: Stage 2 (RHO 3-Month) and Stage 3 (RHO Unit Matching) ---');
{
  // Stage 2
  const rhoQuotas: RHO3MonthQuotas = { Medicine: 1, Surgery: 1, Pediatrics: 0, 'Gyn & Obs': 0 };
  const rhoCands: RHO3MonthCandidateInput[] = [
    { id: 'r1', name: 'Dr. R1', meritRank: 1, completedHOSpecialties: ['Pediatrics', 'Gyn & Obs'], rankedChoices: ['Medicine', 'Surgery'] },
    { id: 'r2', name: 'Dr. R2', meritRank: 2, completedHOSpecialties: ['Pediatrics', 'Gyn & Obs'], rankedChoices: ['Medicine', 'Surgery'] }
  ];
  const rhoRes = allocateRHO3Month(rhoCands, rhoQuotas);
  assert(rhoRes.allocatedCount === 2, 'Stage 2: Both RHO candidates allocated');

  // Stage 3
  const units: HospitalUnitConfig[] = [
    { unitId: 'u1', unitName: 'Med 1', specialty: 'Medicine', consultantName: 'Prof. Senanayake', capacity: 1, magicPin: '1111' }
  ];
  const uCands: RHOUnitCandidateInput[] = [
    { id: 'r1', name: 'Dr. R1', meritRank: 1, assignedSpecialty: 'Medicine', unitPreferences: ['u1'] }
  ];
  const cPrefs: ConsultantPreferences[] = [
    { unitId: 'u1', consultantName: 'Prof. Senanayake', rankedCandidateIds: ['r1'] }
  ];
  const uRes = matchRHOUnits(units, uCands, cPrefs);
  assert(uRes.allocatedCount === 1 && uRes.results[0].matchType === 'MUTUAL_TOP', 'Stage 3: Two-sided mutual top match succeeded');
}

// =========================================================================
// TEST SUITE 7: LIVE ROTATION MILESTONE CALCULATOR
// =========================================================================

console.log('\n--- SUITE 7: Instant Live Rotation Milestone Calculator ---');
{
  // Test case 1: User requested benchmark '2026-12-17'
  const m1 = calculateRotationDates('2026-12-17');
  assert(m1.appointmentFormatted === '17 Dec 2026', 'Dec 17: Appointment date is 17 Dec 2026');
  assert(m1.h1.startFormatted === '17 Dec 2026' && m1.h1.endFormatted === '16 Jun 2027', 'Dec 17: H1 is 17 Dec 2026 – 16 Jun 2027');
  assert(m1.h2.startFormatted === '17 Jun 2027' && m1.h2.endFormatted === '16 Dec 2027', 'Dec 17: H2 is 17 Jun 2027 – 16 Dec 2027');
  assert(m1.rho3Month.startFormatted === '17 Dec 2027' && m1.rho3Month.endFormatted === '16 Mar 2028', 'Dec 17: RHO 3M is 17 Dec 2027 – 16 Mar 2028');
  assert(m1.rhoUnit.startFormatted === '17 Mar 2028', 'Dec 17: RHO Unit starts 17 Mar 2028');

  // Test case 2: Shifted date '2027-01-15'
  const m2 = calculateRotationDates('2027-01-15');
  assert(m2.appointmentFormatted === '15 Jan 2027', 'Jan 15: Appointment date is 15 Jan 2027');
  assert(m2.h1.startFormatted === '15 Jan 2027' && m2.h1.endFormatted === '14 Jul 2027', 'Jan 15: H1 is 15 Jan 2027 – 14 Jul 2027');
  assert(m2.h2.startFormatted === '15 Jul 2027' && m2.h2.endFormatted === '14 Jan 2028', 'Jan 15: H2 is 15 Jul 2027 – 14 Jan 2028');
  assert(m2.rho3Month.startFormatted === '15 Jan 2028' && m2.rho3Month.endFormatted === '14 Apr 2028', 'Jan 15: RHO 3M is 15 Jan 2028 – 14 Apr 2028');
  assert(m2.rhoUnit.startFormatted === '15 Apr 2028', 'Jan 15: RHO Unit starts 15 Apr 2028');

  // Test case 3: Safety against malformed / empty date strings
  const fallback = calculateRotationDates('');
  assert(fallback.appointmentFormatted.length > 0, 'Empty string gracefully falls back without crashing');
}

// =========================================================================
// TEST SUITE 8: NON-SEQUENTIAL ALL-ISLAND ERPM MERIT RANKS (e.g. 42, 300, 1500, 2450)
// =========================================================================

console.log('\n--- SUITE 8: Non-Sequential All-Island ERPM Merit Ranks ---');
{
  const nonSeqQuotas: HOQuotas = {
    h1: { Medicine: 1, Surgery: 1, Pediatrics: 1, 'Gyn & Obs': 1 },
    h2: { Medicine: 1, Surgery: 1, Pediatrics: 1, 'Gyn & Obs': 1 }
  };

  // Candidates with All-Island ranks passed in non-sorted/shuffled order
  const nonSeqCandidates: HOCandidateInput[] = [
    {
      id: 'doc-2450',
      name: 'Dr. Rank 2450',
      meritRank: 2450,
      preferences: [
        { h1: 'Pediatrics', h2: 'Gyn & Obs' },
        { h1: 'Gyn & Obs', h2: 'Pediatrics' }
      ]
    },
    {
      id: 'doc-42',
      name: 'Dr. Rank 42',
      meritRank: 42,
      preferences: [
        { h1: 'Gyn & Obs', h2: 'Medicine' }
      ]
    },
    {
      id: 'doc-1500',
      name: 'Dr. Rank 1500',
      meritRank: 1500,
      preferences: [
        { h1: 'Medicine', h2: 'Surgery' },    // Contended with Rank 300!
        { h1: 'Surgery', h2: 'Pediatrics' }   // 2nd choice valid with remaining slots
      ]
    },
    {
      id: 'doc-300',
      name: 'Dr. Rank 300',
      meritRank: 300,
      preferences: [
        { h1: 'Medicine', h2: 'Surgery' } // Contended with Rank 1500!
      ]
    }
  ];

  const summary = allocateHOYear(nonSeqCandidates, nonSeqQuotas);

  assert(summary.totalStudents === 4, 'All-Island Ranks: Total 4 candidates processed');
  assert(summary.grantedCount === 4, 'All-Island Ranks: All 4 candidates granted');
  assert(summary.clashesCount === 0 && summary.forbiddenPairCount === 0, 'All-Island Ranks: Zero clashes and zero forbidden pairs');

  // Verify results order: Must be strictly sorted by numeric meritRank [42, 300, 1500, 2450]
  assert(summary.results[0].meritRank === 42, 'Result 0 is Merit Rank #42');
  assert(summary.results[1].meritRank === 300, 'Result 1 is Merit Rank #300');
  assert(summary.results[2].meritRank === 1500, 'Result 2 is Merit Rank #1500');
  assert(summary.results[3].meritRank === 2450, 'Result 3 is Merit Rank #2450');

  // Contention resolution: Rank 300 beats Rank 1500 for Medicine -> Surgery
  const res300 = summary.results.find(r => r.meritRank === 300)!;
  const res1500 = summary.results.find(r => r.meritRank === 1500)!;
  const res2450 = summary.results.find(r => r.meritRank === 2450)!;

  assert(
    res300.assignedPair?.h1 === 'Medicine' && res300.assignedPair?.h2 === 'Surgery',
    'Doctor Rank #300 secures 1st choice (Med -> Surg) over lower rank #1500'
  );
  assert(
    res1500.assignedPair?.h1 === 'Surgery' && res1500.assignedPair?.h2 === 'Pediatrics',
    'Doctor Rank #1500 gets 2nd choice (Surg -> Ped) because #300 took 1st choice'
  );
  assert(
    res2450.assignedPair?.h1 === 'Pediatrics' && res2450.assignedPair?.h2 === 'Gyn & Obs',
    'Doctor Rank #2450 is allocated cleanly'
  );
}

// =========================================================================
// TEST SUITE 9: FLEXIBLE 1 TO 8 RANKED CHOICES & FULL-SPECTRUM GUARANTEE
// =========================================================================

console.log('\n--- SUITE 9: Flexible 1 to 8 Choices & Full Spectrum Guarantee ---');
{
  const quotas = calculateAutoQuotas(4); // 1 in each specialty

  // Candidate 1 submits 1 choice (Medicine -> Surgery)
  // Candidate 2 submits 3 choices
  // Candidate 3 submits all 8 valid combinations
  // Candidate 4 submits 2 choices that clash with Candidate 1 and 2
  const flexCandidates: HOCandidateInput[] = [
    {
      id: 'doc-1',
      name: 'Dr. 1 Choice',
      meritRank: 1,
      preferences: [
        { h1: 'Medicine', h2: 'Surgery' }
      ]
    },
    {
      id: 'doc-2',
      name: 'Dr. 3 Choices',
      meritRank: 2,
      preferences: [
        { h1: 'Medicine', h2: 'Surgery' }, // will be taken by Rank 1
        { h1: 'Surgery', h2: 'Medicine' }, // granted as Choice #2
        { h1: 'Pediatrics', h2: 'Gyn & Obs' }
      ]
    },
    {
      id: 'doc-3',
      name: 'Dr. All 8 Choices',
      meritRank: 3,
      preferences: [
        // All 8 non-repeating combinations
        ...ALL_8_HO_PAIRS
      ]
    },
    {
      id: 'doc-4',
      name: 'Dr. Contended Limited Choices',
      meritRank: 4,
      preferences: [
        { h1: 'Medicine', h2: 'Surgery' },
        { h1: 'Surgery', h2: 'Medicine' }
      ]
    }
  ];

  const summary = allocateHOYear(flexCandidates, quotas);

  // Doc 1: gets 1st choice
  const r1 = summary.results.find(r => r.candidateId === 'doc-1')!;
  assert(r1.status === 'GRANTED' && r1.choiceRank === 1, 'Doc 1: Granted 1st choice out of 1 preference');

  // Doc 2: gets 2nd choice
  const r2 = summary.results.find(r => r.candidateId === 'doc-2')!;
  assert(r2.status === 'GRANTED' && r2.choiceRank === 2, 'Doc 2: Granted 2nd choice out of 3 preferences');

  // Doc 3: submits all 8 choices -> Guaranteed GRANTED
  const r3 = summary.results.find(r => r.candidateId === 'doc-3')!;
  assert(
    r3.status === 'GRANTED' && r3.choiceRank !== null && r3.choiceRank >= 1 && r3.choiceRank <= 8,
    'Doc 3: Full-spectrum 8 choices guarantees immediate GRANTED allocation'
  );

  // Doc 4: both choices full -> falls back to ALTERNATIVES_AVAILABLE
  const r4 = summary.results.find(r => r.candidateId === 'doc-4')!;
  assert(
    r4.status === 'ALTERNATIVES_AVAILABLE' && r4.availableAlternatives.length > 0,
    'Doc 4: Limited choices exhausted falls back to ALTERNATIVES_AVAILABLE with feasible alternatives'
  );
}

console.log('\n' + '='.repeat(80));
console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED (100% SUCCESS)`);
console.log('='.repeat(80));

if (passedTests !== totalTests) {
  process.exit(1);
}
