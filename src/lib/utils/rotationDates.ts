/**
 * Utility functions for calculating official 6-Month and RHO milestone dates
 * for Ashraff Memorial Hospital (AMH), Kalmunai.
 */

export interface RotationMilestoneDates {
  appointmentDateRaw: string;
  appointmentFormatted: string; // e.g. "16 Nov 2026"
  h1: {
    startDateRaw: string;
    endDateRaw: string;
    startFormatted: string; // "16 Nov 2026"
    endFormatted: string; // "15 May 2027"
  };
  h2: {
    startDateRaw: string;
    endDateRaw: string;
    startFormatted: string; // "16 May 2027"
    endFormatted: string; // "15 Nov 2027"
  };
  rho3Month: {
    startDateRaw: string;
    endDateRaw: string;
    startFormatted: string; // "16 Nov 2027"
    endFormatted: string; // "15 Feb 2028"
  };
  rhoUnit: {
    startDateRaw: string;
    startFormatted: string; // "16 Feb 2028"
  };
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Format a Date object as "DD Mon YYYY" (e.g., "16 Nov 2026")
 */
export function formatDate(d: Date): string {
  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatDateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parses YYYY-MM-DD string into a local Date without timezone offset shift.
 * Fallback to 16 Nov 2026 if empty or malformed during live typing.
 */
export function parseISODate(dateStr: string): Date {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date(2026, 10, 16);
  }
  const parts = dateStr.trim().split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return new Date(2026, 10, 16);
  }
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

/**
 * Adds months to a date and adjusts for end-of-month boundaries.
 */
function addMonths(baseDate: Date, monthsToAdd: number): Date {
  const d = new Date(baseDate.getTime());
  const targetMonth = d.getMonth() + monthsToAdd;
  d.setMonth(targetMonth);
  return d;
}

/**
 * Subtracts specified number of days from a date.
 */
function subtractDays(baseDate: Date, days: number): Date {
  const d = new Date(baseDate.getTime());
  d.setDate(d.getDate() - days);
  return d;
}

/**
 * Adds specified number of days to a date.
 */
function addDays(baseDate: Date, days: number): Date {
  const d = new Date(baseDate.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Calculates all official AMH Kalmunai rotation milestone dates from the appointment start date.
 */
export function calculateRotationDates(startDateStr: string): RotationMilestoneDates {
  const start = parseISODate(startDateStr || '2026-11-16');

  // H1: Start to +6 months - 1 day
  const h1Start = new Date(start.getTime());
  const h1End = subtractDays(addMonths(h1Start, 6), 1);

  // H2: H1 End + 1 day to +12 months - 1 day from start
  const h2Start = addDays(h1End, 1);
  const h2End = subtractDays(addMonths(h1Start, 12), 1);

  // RHO 3 Months: H2 End + 1 day to +15 months - 1 day from start
  const rho3Start = addDays(h2End, 1);
  const rho3End = subtractDays(addMonths(h1Start, 15), 1);

  // RHO Unit: RHO 3M End + 1 day
  const rhoUnitStart = addDays(rho3End, 1);

  return {
    appointmentDateRaw: startDateStr,
    appointmentFormatted: formatDate(start),
    h1: {
      startDateRaw: formatDateToISO(h1Start),
      endDateRaw: formatDateToISO(h1End),
      startFormatted: formatDate(h1Start),
      endFormatted: formatDate(h1End)
    },
    h2: {
      startDateRaw: formatDateToISO(h2Start),
      endDateRaw: formatDateToISO(h2End),
      startFormatted: formatDate(h2Start),
      endFormatted: formatDate(h2End)
    },
    rho3Month: {
      startDateRaw: formatDateToISO(rho3Start),
      endDateRaw: formatDateToISO(rho3End),
      startFormatted: formatDate(rho3Start),
      endFormatted: formatDate(rho3End)
    },
    rhoUnit: {
      startDateRaw: formatDateToISO(rhoUnitStart),
      startFormatted: formatDate(rhoUnitStart)
    }
  };
}

export const AMH_HOSPITAL_DETAILS = {
  name: 'Ashraff Memorial Hospital (AMH), Kalmunai',
  shortName: 'AMH Kalmunai',
  subheading: 'Ministry of Health — Sri Lanka',
  address: 'Main Street (A4), Kalmunai 32300, Eastern Province',
  telephones: [
    { number: '067 222 9496', label: 'Administration Office', telUrl: 'tel:0672229496' },
    { number: '067 222 2261', label: 'General Hospital Line', telUrl: 'tel:0672222261' },
    { number: '067 222 3261', label: 'Medical Superintendent', telUrl: 'tel:0672223261' }
  ],
  email: 'info@amhkalmunai.lk',
  emailUrl: 'mailto:info@amhkalmunai.lk'
};

