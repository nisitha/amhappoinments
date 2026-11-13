import {
  Specialty,
  CORE_SPECIALTIES,
  ALL_8_HO_PAIRS,
  getPermittedH2Specialties
} from '../src/lib/algorithms';

type ChoiceSlot = { h1: Specialty; h2: Specialty | null };

function testProgressiveChoiceLogic() {
  console.log('Testing Progressive Gray-Out & Conflict Auto-Resolution Logic...\n');

  let choices: ChoiceSlot[] = [
    { h1: 'Medicine', h2: 'Surgery' },
    { h1: 'Surgery', h2: 'Medicine' },
    { h1: 'Pediatrics', h2: 'Gyn & Obs' }
  ];

  const getOtherUsedPairsMap = (cardIdx: number) => {
    const map = new Map<string, number>();
    choices.forEach((c, idx) => {
      if (idx !== cardIdx && c.h1 && c.h2) {
        map.set(`${c.h1}->${c.h2}`, idx + 1);
      }
    });
    return map;
  };

  const getRemainingCount = () => {
    const set = new Set<string>();
    choices.forEach((c) => {
      if (c.h1 && c.h2) set.add(`${c.h1}->${c.h2}`);
    });
    return Math.max(0, 8 - set.size);
  };

  // Test 1: Initial state
  console.log('1. Initial State: 3 choices ranked');
  const remaining1 = getRemainingCount();
  console.log(`   Remaining combinations: ${remaining1} (Expected: 5)`);
  if (remaining1 !== 5) throw new Error(`Expected 5 remaining, got ${remaining1}`);

  // Test 2: In Choice #2 (Surgery -> Medicine), check what H2 options are available
  const map2 = getOtherUsedPairsMap(1); // Card index 1 (Choice #2)
  console.log('2. In Choice #2, check H2 options for Surgery:');
  const permittedSurg = getPermittedH2Specialties('Surgery'); // ['Medicine', 'Pediatrics']
  permittedSurg.forEach(h2 => {
    const usedIn = map2.get(`Surgery->${h2}`);
    console.log(`   Surgery -> ${h2}: ${usedIn ? `Used in #${usedIn}` : 'AVAILABLE'}`);
  });
  // In Choice #2, Surgery->Medicine is NOT used in other cards (it is on Choice #2 itself)
  if (map2.get('Surgery->Medicine') !== undefined) throw new Error('Choice #2 should not see itself in otherMap');
  // Medicine->Surgery is used in #1
  if (map2.get('Medicine->Surgery') !== 1) throw new Error('Choice #2 should see Medicine->Surgery used in #1');

  // Test 3: Dead-End Prevention:
  // Add Choice #4 with Medicine -> Gyn & Obs
  // Now BOTH Medicine pairs are taken:
  // Choice #1: Medicine -> Surgery
  // Choice #4: Medicine -> Gyn & Obs
  choices.push({ h1: 'Medicine', h2: 'Gyn & Obs' });
  console.log('\n3. Added Choice #4 (Medicine -> Gyn & Obs):');
  console.log(`   Remaining combinations: ${getRemainingCount()} (Expected: 4)`);

  // Now inspect Choice #3 (Card index 2): Can it pick Medicine for H1?
  const map3 = getOtherUsedPairsMap(2); // Card index 2 (Choice #3)
  const permittedMed = getPermittedH2Specialties('Medicine'); // ['Surgery', 'Gyn & Obs']
  const isMedAllUsed = permittedMed.every(h2 => map3.has(`Medicine->${h2}`));
  console.log(`   In Choice #3: Is Medicine dead-ended (all pairs used)? ${isMedAllUsed}`);
  if (!isMedAllUsed) throw new Error('Medicine should be marked dead-ended (all pairs used) in Choice #3');

  // Test 4: Conflict Auto-Resolution:
  // Suppose doctor changes Choice #1 to Surgery -> Medicine
  // Choice #2 already has Surgery -> Medicine.
  // Conflict resolution should clear Choice #2's H2 to null!
  console.log('\n4. Conflict Auto-Resolution Test:');
  console.log('   Changing Choice #1 to Surgery -> Medicine');
  const newH1: Specialty = 'Surgery';
  const newH2: Specialty = 'Medicine';
  const pairKey = `${newH1}->${newH2}`;
  choices[0] = { h1: newH1, h2: newH2 };
  // Trigger conflict resolution across other cards
  for (let i = 0; i < choices.length; i++) {
    if (i !== 0 && choices[i].h1 && choices[i].h2 && `${choices[i].h1}->${choices[i].h2}` === pairKey) {
      console.log(`   Conflict detected in Choice #${i + 1}! Clearing H2 to null.`);
      choices[i] = { ...choices[i], h2: null };
    }
  }

  if (choices[1].h2 !== null) throw new Error('Choice #2 H2 was not cleared on duplicate conflict!');
  console.log('   Choice #2 is now:', choices[1]);

  // Test 5: In Choice #2, Surgery -> Medicine is now Used in #1, but Surgery -> Pediatrics is available!
  const mapChoice2 = getOtherUsedPairsMap(1);
  const surgMedUsed = mapChoice2.get('Surgery->Medicine');
  const surgPedUsed = mapChoice2.get('Surgery->Pediatrics');
  console.log(`   Choice #2 Surgery -> Medicine used in: #${surgMedUsed}`);
  console.log(`   Choice #2 Surgery -> Pediatrics used in: ${surgPedUsed ? `#${surgPedUsed}` : 'AVAILABLE'}`);
  if (surgMedUsed !== 1) throw new Error('Surgery->Medicine should be tagged as Used in #1');
  if (surgPedUsed !== undefined) throw new Error('Surgery->Pediatrics should be AVAILABLE');

  // Fill Choice #2 with Surgery -> Pediatrics
  choices[1].h2 = 'Pediatrics';
  console.log('   Resolved Choice #2 to Surgery -> Pediatrics');

  // Test 6: Complete all 8 combinations
  console.log('\n6. Full Spectrum (8/8 choices):');
  choices = [...ALL_8_HO_PAIRS];
  const remaining8 = getRemainingCount();
  console.log(`   Remaining combinations for all 8: ${remaining8} (Expected: 0)`);
  if (remaining8 !== 0) throw new Error(`Expected 0 remaining, got ${remaining8}`);

  console.log('\nALL PROGRESSIVE CHOICES TESTS PASSED! (100% SUCCESS)\n');
}

testProgressiveChoiceLogic();

