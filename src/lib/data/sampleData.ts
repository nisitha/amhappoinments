import {
  HOCandidateInput,
  HOQuotas,
  ALL_8_HO_PAIRS,
  HospitalUnitConfig,
  RHO3MonthCandidateInput,
  RHO3MonthQuotas,
  Specialty,
  ConsultantPreferences,
  calculateAutoQuotas
} from '../algorithms';

export const SRI_LANKAN_DOCTOR_NAMES: readonly string[] = [
  'Dr. Kasun Perera',
  'Dr. Nimanthi Silva',
  'Dr. Ashen Fernando',
  'Dr. Dinuka Jayawardena',
  'Dr. Tharushi Wickramasinghe',
  'Dr. Sachith Dissanayake',
  'Dr. Chamari Bandara',
  'Dr. Nuwan Senaratne',
  'Dr. Kavindi Samarasinghe',
  'Dr. Lahiru Rathnayake',
  'Dr. Dilani Weerasinghe',
  'Dr. Roshan Gunawardena',
  'Dr. Hiruni Wijesinghe',
  'Dr. Isuru Karunaratne',
  'Dr. Anoma Jayasundara',
  'Dr. Ruwan Pathirana',
  'Dr. Shalini Ranasinghe',
  'Dr. Dinesh Abeywickrama',
  'Dr. Malki Siriwardena',
  'Dr. Dhanushka Peiris',
  'Dr. Chathurika Mendis',
  'Dr. Supun Ekanayake',
  'Dr. Hansani De Silva',
  'Dr. Gayan Jayakody',
  'Dr. Nadeeka Tennakoon',
  'Dr. Mahesh Liyanage',
  'Dr. Rashmi Gamage',
  'Dr. Janaka Mallawarachchi',
  'Dr. Piyumi Kulatunga',
  'Dr. Samantha Wanniarachchi',
  'Dr. Oshadhi Seneviratne',
  'Dr. Pradeep Hettiarachchi',
  'Dr. Madhavi Vithanage',
  'Dr. Ravindu Edirisinghe',
  'Dr. Sanduni Nanayakkara',
  'Dr. Charith Atapattu',
  'Dr. Nelum Rajapaksa',
  'Dr. Kusal Mendis',
  'Dr. Thisuri Wickramasinghe',
  'Dr. Aruna Somaratne',
  'Dr. Malsha Alahakoon',
  'Dr. Kaveen Jayawardena'
];

export const INITIAL_HO_QUOTAS: HOQuotas = calculateAutoQuotas(40);

export const INITIAL_RHO_3MONTH_QUOTAS: RHO3MonthQuotas = {
  Medicine: 10,
  Surgery: 10,
  Pediatrics: 10,
  'Gyn & Obs': 10
};

export const HOSPITAL_UNITS: HospitalUnitConfig[] = [
  { unitId: 'unit-med-1', unitName: 'General Medicine Unit 1', specialty: 'Medicine', consultantName: 'Prof. Vajira Senanayake', capacity: 3, magicPin: '1001' },
  { unitId: 'unit-med-2', unitName: 'General Medicine Unit 2', specialty: 'Medicine', consultantName: 'Dr. Chathura Wickramasinghe', capacity: 3, magicPin: '1002' },
  { unitId: 'unit-surg-1', unitName: 'General Surgical Unit A', specialty: 'Surgery', consultantName: 'Dr. Ranjan Jayasuriya', capacity: 3, magicPin: '2001' },
  { unitId: 'unit-surg-2', unitName: 'General Surgical Unit B', specialty: 'Surgery', consultantName: 'Dr. Anura Gunasekara', capacity: 3, magicPin: '2002' },
  { unitId: 'unit-peds-1', unitName: 'Professorial Pediatric Unit', specialty: 'Pediatrics', consultantName: 'Dr. Shanthi Alwis', capacity: 3, magicPin: '3001' },
  { unitId: 'unit-peds-2', unitName: 'General Pediatric Unit 2', specialty: 'Pediatrics', consultantName: 'Dr. Priyantha Dissanayake', capacity: 3, magicPin: '3002' },
  { unitId: 'unit-gyn-1', unitName: 'Obstetrics & Gyn Unit A', specialty: 'Gyn & Obs', consultantName: 'Dr. Nalinda Fernando', capacity: 3, magicPin: '4001' },
  { unitId: 'unit-gyn-2', unitName: 'Obstetrics & Gyn Unit B', specialty: 'Gyn & Obs', consultantName: 'Dr. Kanthi Samaraweera', capacity: 3, magicPin: '4002' }
];

export function generateSampleCandidates(count = 40, intakeId = 'intake-2026-nov'): HOCandidateInput[] {
  return Array.from({ length: count }, (_, i) => {
    const meritRank = i + 1;
    const name = SRI_LANKAN_DOCTOR_NAMES[i] || `Dr. Candidate #${meritRank}`;

    // Cycle through the 8 valid combinations
    const shift = (i * 2) % 8;
    const prefs = [...ALL_8_HO_PAIRS.slice(shift), ...ALL_8_HO_PAIRS.slice(0, shift)];

    return {
      id: `doc-${intakeId}-${meritRank}`,
      name,
      meritRank,
      mobileNumber: `077${String(1200000 + i * 11111).slice(0, 7)}`,
      intakeId,
      pin: '1234',
      preferences: prefs
    };
  });
}

export function generateExtremeContentionCandidates(count = 40): HOCandidateInput[] {
  return Array.from({ length: count }, (_, i) => {
    const meritRank = i + 1;
    const name = SRI_LANKAN_DOCTOR_NAMES[i] || `Dr. Candidate #${meritRank}`;
    return {
      id: `doc-${meritRank}`,
      name,
      meritRank,
      preferences: [
        { h1: 'Medicine', h2: 'Surgery' },
        { h1: 'Surgery', h2: 'Medicine' },
        { h1: 'Medicine', h2: 'Gyn & Obs' },
        { h1: 'Gyn & Obs', h2: 'Medicine' },
        { h1: 'Pediatrics', h2: 'Surgery' },
        { h1: 'Surgery', h2: 'Pediatrics' },
        { h1: 'Pediatrics', h2: 'Gyn & Obs' },
        { h1: 'Gyn & Obs', h2: 'Pediatrics' }
      ]
    };
  });
}

export function generateInitialRHO3MonthCandidates(
  hoCandidates: HOCandidateInput[],
  assignedPairs?: Map<string, { h1: Specialty; h2: Specialty }>
): RHO3MonthCandidateInput[] {
  return hoCandidates.map((c) => {
    const hoAssigned = assignedPairs?.get(c.id) || {
      h1: c.preferences[0]?.h1 || 'Medicine',
      h2: c.preferences[0]?.h2 || 'Surgery'
    };

    const completed: [Specialty, Specialty] = [hoAssigned.h1, hoAssigned.h2];
    const completedSet = new Set(completed);
    const uncompleted = (['Medicine', 'Surgery', 'Pediatrics', 'Gyn & Obs'] as Specialty[]).filter(
      (s) => !completedSet.has(s)
    );

    return {
      id: c.id,
      name: c.name,
      meritRank: c.meritRank,
      completedHOSpecialties: completed,
      rankedChoices: [uncompleted[0] || 'Pediatrics', uncompleted[1] || 'Gyn & Obs']
    };
  });
}

export const SAMPLE_CONSULTANT_PREFERENCES: ConsultantPreferences[] = [
  { unitId: 'unit-med-1', consultantName: 'Prof. Vajira Senanayake', rankedCandidateIds: ['doc-1', 'doc-3', 'doc-5'] },
  { unitId: 'unit-med-2', consultantName: 'Dr. Chathura Wickramasinghe', rankedCandidateIds: ['doc-2', 'doc-4', 'doc-6'] },
  { unitId: 'unit-surg-1', consultantName: 'Dr. Ranjan Jayasuriya', rankedCandidateIds: ['doc-1', 'doc-7', 'doc-8'] },
  { unitId: 'unit-surg-2', consultantName: 'Dr. Anura Gunasekara', rankedCandidateIds: ['doc-2', 'doc-9', 'doc-10'] },
  { unitId: 'unit-peds-1', consultantName: 'Dr. Shanthi Alwis', rankedCandidateIds: ['doc-11', 'doc-12'] },
  { unitId: 'unit-peds-2', consultantName: 'Dr. Priyantha Dissanayake', rankedCandidateIds: ['doc-13', 'doc-14'] },
  { unitId: 'unit-gyn-1', consultantName: 'Dr. Nalinda Fernando', rankedCandidateIds: ['doc-15', 'doc-16'] },
  { unitId: 'unit-gyn-2', consultantName: 'Dr. Kanthi Samaraweera', rankedCandidateIds: ['doc-17', 'doc-18'] }
];
