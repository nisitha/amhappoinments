import React from 'react';

export const DoctorWelcomeIllustration: React.FC<{ className?: string }> = ({ className = 'w-48 h-40' }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 280 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bgGlow" x1="0" y1="0" x2="280" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EBF3FE" stopOpacity="0.8" />
          <stop stopColor="#F4F7FE" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#5A9BF6" />
          <stop stopColor="#3874E0" />
        </linearGradient>
        <linearGradient id="mintGrad" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#38C976" />
          <stop stopColor="#25A45C" />
        </linearGradient>
        <linearGradient id="coatGrad" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#FFFFFF" />
          <stop stopColor="#EDF2F9" />
        </linearGradient>
      </defs>

      {/* Background Soft Blobs */}
      <circle cx="200" cy="100" r="70" fill="url(#bgGlow)" />
      <circle cx="90" cy="60" r="45" fill="#EBF3FE" />
      <circle cx="240" cy="50" r="14" fill="#E6F9EE" />

      {/* Floating Sparkles & Badges */}
      <circle cx="50" cy="90" r="4" fill="#5A9BF6" />
      <circle cx="70" cy="35" r="3" fill="#F7C948" />
      <circle cx="230" cy="140" r="5" fill="#7B7CE6" />

      {/* Floating Medical Cross Badge */}
      <g transform="translate(45, 120)">
        <rect width="32" height="32" rx="10" fill="#FFFFFF" filter="drop-shadow(0 4px 10px rgba(90,155,246,0.15))" />
        <rect x="14" y="9" width="4" height="14" rx="2" fill="#5A9BF6" />
        <rect x="9" y="14" width="14" height="4" rx="2" fill="#5A9BF6" />
      </g>

      {/* Floating Chart Metric Card */}
      <g transform="translate(195, 25)">
        <rect width="64" height="42" rx="10" fill="#FFFFFF" filter="drop-shadow(0 4px 12px rgba(27,37,89,0.06))" />
        <circle cx="16" cy="16" r="6" fill="#E6F9EE" />
        <path d="M14 16L16 18L19 14" stroke="#38C976" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="26" y="12" width="26" height="4" rx="2" fill="#1B2559" />
        <rect x="26" y="20" width="18" height="3" rx="1.5" fill="#8F9BBA" />
        <rect x="10" y="29" width="44" height="3" rx="1.5" fill="#EBF3FE" />
        <rect x="10" y="29" width="32" height="3" rx="1.5" fill="#5A9BF6" />
      </g>

      {/* Doctor Character */}
      {/* Torso / Lab Coat */}
      <path
        d="M105 185 C105 140 120 125 150 125 C180 125 195 140 195 185 Z"
        fill="url(#coatGrad)"
      />
      {/* Blue Inner Scrub */}
      <path d="M138 125 L150 148 L162 125 Z" fill="url(#blueGrad)" />

      {/* Stethoscope */}
      <path
        d="M135 128 C135 155 165 155 165 128"
        stroke="#1B2559"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="150" cy="158" r="4.5" fill="#5A9BF6" stroke="#FFFFFF" strokeWidth="1.5" />

      {/* Head & Hair */}
      <circle cx="150" cy="85" r="22" fill="#F8D3B4" />
      {/* Modern Hair */}
      <path
        d="M130 80 C130 60 140 50 156 50 C170 50 174 62 174 74 C170 72 165 72 160 76 C150 82 142 82 130 80 Z"
        fill="#1B2559"
      />
      {/* Friendly Smile & Eyes */}
      <circle cx="144" cy="84" r="2" fill="#1B2559" />
      <circle cx="156" cy="84" r="2" fill="#1B2559" />
      <path d="M146 93 C148 96 152 96 154 93" stroke="#1B2559" strokeWidth="1.5" strokeLinecap="round" />

      {/* Doctor Arms & Digital Tablet */}
      {/* Left arm holding tablet */}
      <path d="M110 150 C110 170 125 178 140 178" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" />
      {/* Right arm */}
      <path d="M190 150 C190 170 175 178 160 178" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" />

      {/* Tablet */}
      <rect
        x="126"
        y="145"
        width="48"
        height="36"
        rx="6"
        fill="#1B2559"
        filter="drop-shadow(0 6px 14px rgba(27,37,89,0.18))"
      />
      <rect x="130" y="149" width="40" height="28" rx="4" fill="#FFFFFF" />
      {/* Tablet content */}
      <rect x="134" y="154" width="16" height="3" rx="1.5" fill="#5A9BF6" />
      <rect x="134" y="160" width="32" height="2" rx="1" fill="#EBF3FE" />
      <rect x="134" y="164" width="24" height="2" rx="1" fill="#EBF3FE" />
      <circle cx="158" cy="155" r="3" fill="#38C976" />

      {/* Hands holding tablet */}
      <circle cx="126" cy="162" r="5" fill="#F8D3B4" />
      <circle cx="174" cy="162" r="5" fill="#F8D3B4" />
    </svg>
  );
};

