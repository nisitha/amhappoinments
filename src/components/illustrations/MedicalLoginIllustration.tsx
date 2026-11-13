import React from 'react';

export const MedicalLoginIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-auto max-w-sm' }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 340 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="loginBlob" x1="20" y1="20" x2="320" y2="300" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EBF3FE" />
          <stop stopColor="#F4F7FE" />
        </linearGradient>
        <linearGradient id="heroBlue" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#5A9BF6" />
          <stop stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#FFFFFF" />
          <stop stopColor="#F8FAFC" />
        </linearGradient>
        <filter id="softShadow" x="-10" y="-10" width="160" height="200" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#7090B0" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Main Soft Backdrop Shape */}
      <rect x="20" y="20" width="300" height="280" rx="36" fill="url(#loginBlob)" />

      {/* Background Decorative Rings & Dots */}
      <circle cx="270" cy="65" r="28" stroke="#D6E7FD" strokeWidth="3" strokeDasharray="6 6" />
      <circle cx="55" cy="240" r="18" fill="#E6F9EE" />
      <circle cx="285" cy="225" r="8" fill="#FEF7E0" />
      <circle cx="70" cy="70" r="6" fill="#5A9BF6" />
      <circle cx="230" cy="275" r="4" fill="#7B7CE6" />

      {/* Floating Hospital Stethoscope Crest Badge */}
      <g transform="translate(40, 50)">
        <rect width="48" height="48" rx="16" fill="#FFFFFF" filter="url(#softShadow)" />
        <circle cx="24" cy="24" r="16" fill="#EBF3FE" />
        <path
          d="M19 18V21C19 23.7614 21.2386 26 24 26C26.7614 26 29 23.7614 29 21V18"
          stroke="#5A9BF6"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="24" cy="29" r="2.5" fill="#5A9BF6" />
      </g>

      {/* Floating Success Allocation Card */}
      <g transform="translate(190, 190)">
        <rect width="115" height="68" rx="14" fill="#FFFFFF" filter="url(#softShadow)" />
        <circle cx="22" cy="24" r="10" fill="#E6F9EE" />
        <path d="M19 24L21 26L25 21" stroke="#38C976" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="38" y="18" width="55" height="5" rx="2.5" fill="#1B2559" />
        <rect x="38" y="26" width="35" height="4" rx="2" fill="#8F9BBA" />
        <rect x="14" y="44" width="87" height="12" rx="6" fill="#EBF3FE" />
        <rect x="22" y="48" width="50" height="4" rx="2" fill="#5A9BF6" />
      </g>

      {/* Central Medical Document / Roster Board */}
      <g transform="translate(95, 75)">
        {/* Main Board */}
        <rect width="150" height="180" rx="18" fill="url(#cardGrad)" stroke="#E2E8F0" strokeWidth="1" filter="url(#softShadow)" />

        {/* Board Top Clamp */}
        <rect x="45" y="-10" width="60" height="20" rx="8" fill="#1B2559" />
        <circle cx="75" cy="0" r="4" fill="#FFFFFF" />

        {/* Header Bar */}
        <rect x="20" y="25" width="110" height="12" rx="6" fill="#EBF3FE" />
        <rect x="25" y="29" width="50" height="4" rx="2" fill="#5A9BF6" />

        {/* Allocation Rows */}
        {/* Row 1 */}
        <rect x="20" y="50" width="110" height="24" rx="8" fill="#F8FAFC" />
        <circle cx="32" cy="62" r="5" fill="#5A9BF6" />
        <rect x="44" y="58" width="40" height="4" rx="2" fill="#1B2559" />
        <rect x="44" y="64" width="25" height="3" rx="1.5" fill="#8F9BBA" />
        <rect x="94" y="57" width="28" height="10" rx="5" fill="#E6F9EE" />
        <rect x="99" y="61" width="18" height="2" rx="1" fill="#38C976" />

        {/* Row 2 */}
        <rect x="20" y="80" width="110" height="24" rx="8" fill="#F8FAFC" />
        <circle cx="32" cy="92" r="5" fill="#7B7CE6" />
        <rect x="44" y="88" width="45" height="4" rx="2" fill="#1B2559" />
        <rect x="44" y="94" width="20" height="3" rx="1.5" fill="#8F9BBA" />
        <rect x="94" y="87" width="28" height="10" rx="5" fill="#EBF3FE" />
        <rect x="99" y="91" width="18" height="2" rx="1" fill="#5A9BF6" />

        {/* Row 3 */}
        <rect x="20" y="110" width="110" height="24" rx="8" fill="#F8FAFC" />
        <circle cx="32" cy="122" r="5" fill="#F7C948" />
        <rect x="44" y="118" width="38" height="4" rx="2" fill="#1B2559" />
        <rect x="44" y="124" width="30" height="3" rx="1.5" fill="#8F9BBA" />
        <rect x="94" y="117" width="28" height="10" rx="5" fill="#FEF7E0" />
        <rect x="99" y="121" width="18" height="2" rx="1" fill="#F7C948" />

        {/* SLMC Official Seal / Checkmark */}
        <g transform="translate(100, 140)">
          <circle cx="18" cy="18" r="16" fill="url(#heroBlue)" />
          <path d="M13 18L17 22L24 14" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
};

