'use client';

import React from 'react';

interface AmhLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const AmhLogo: React.FC<AmhLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true
}) => {
  const iconSizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* AMH Medical Shield Crest */}
      <div
        className={`${iconSizes[size]} rounded-xl bg-gradient-to-br from-[#0D5C3A] via-[#107C41] to-[#0D5C3A] flex items-center justify-center text-white font-black shadow-sm ring-2 ring-[#F7C948]/40 shrink-0 relative overflow-hidden`}
      >
        {/* Subtle decorative inner ring */}
        <div className="absolute inset-0 rounded-xl border border-white/20" />
        <div className="flex flex-col items-center justify-center leading-none">
          <span className="text-[10px] sm:text-xs font-black tracking-tighter text-[#FEF7E0]">AMH</span>
          <span className="text-[7px] font-bold text-white/90">KLM</span>
        </div>
      </div>

      <div className="leading-tight">
        <div className="flex items-center space-x-1.5">
          <span className="font-bold text-[#1B2559] text-sm sm:text-base tracking-tight">
            AMH Kalmunai
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#E6F9EE] text-[#249B55] border border-[#38C976]/30">
            MOH SL
          </span>
        </div>
        {showSubtitle && (
          <p className="text-[11px] text-[#8F9BBA] font-medium truncate max-w-[200px] sm:max-w-none">
            Ashraff Memorial Hospital • HO & RHO Portal
          </p>
        )}
      </div>
    </div>
  );
};

