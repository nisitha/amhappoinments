import React from 'react';
import { Specialty, getSpecialtyGroup } from '@/lib/algorithms';
import { Stethoscope, Scissors, Baby, HeartPulse } from 'lucide-react';

interface SpecialtyBadgeProps {
  specialty: Specialty;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showGroup?: boolean;
}

export const SpecialtyBadge: React.FC<SpecialtyBadgeProps> = ({
  specialty,
  size = 'md',
  showIcon = true,
  showGroup = false
}) => {
  const group = getSpecialtyGroup(specialty);

  const getStyle = () => {
    switch (specialty) {
      case 'Medicine':
        return {
          bg: 'bg-[#EEF2FF]',
          border: 'border-[#C5D2FB]',
          text: 'text-[#2B4ACB]',
          icon: <Stethoscope strokeWidth={1.75} className="w-3.5 h-3.5 mr-1.5 shrink-0 text-[#3B5BDB]" />
        };
      case 'Surgery':
        return {
          bg: 'bg-[#FFF1F2]',
          border: 'border-[#FECDD3]',
          text: 'text-[#BE123C]',
          icon: <Scissors strokeWidth={1.75} className="w-3.5 h-3.5 mr-1.5 shrink-0 text-[#F43F5E]" />
        };
      case 'Pediatrics':
        return {
          bg: 'bg-[#ECFDF5]',
          border: 'border-[#A7F3D0]',
          text: 'text-[#047857]',
          icon: <Baby strokeWidth={1.75} className="w-3.5 h-3.5 mr-1.5 shrink-0 text-[#10B981]" />
        };
      case 'Gyn & Obs':
        return {
          bg: 'bg-[#FFFBEB]',
          border: 'border-[#FDE68A]',
          text: 'text-[#B45309]',
          icon: <HeartPulse strokeWidth={1.75} className="w-3.5 h-3.5 mr-1.5 shrink-0 text-[#F59E0B]" />
        };
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          text: 'text-slate-700',
          icon: null
        };
    }
  };

  const style = getStyle();

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-medium',
    md: 'text-xs px-2.5 py-0.5 rounded-md font-medium',
    lg: 'text-sm px-3 py-1 rounded-md font-semibold'
  };

  return (
    <span
      className={`inline-flex items-center font-medium border whitespace-nowrap shrink-0 ${style.bg} ${style.border} ${style.text} ${sizeClasses[size]} transition`}
    >
      {showIcon && style.icon}
      <span>{specialty}</span>
      {showGroup && (
        <span className="ml-1.5 px-1 py-0.2 rounded text-[9px] font-bold uppercase opacity-80">
          ({group === 'Group A' ? 'Grp A' : 'Grp B'})
        </span>
      )}
    </span>
  );
};
