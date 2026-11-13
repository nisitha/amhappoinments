export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'admin' | 'student' | 'consultant';
export type SpecialtyType = 'Medicine' | 'Surgery' | 'Pediatrics' | 'Gyn & Obs';
export type SpecialtyGroup = 'Group A' | 'Group B';
export type BatchStatus = 'open' | 'closed' | 'registration_open' | 'allocated' | 'swap_window_open' | 'finalized';
export type HOAllocationStatus = 'GRANTED' | 'ALTERNATIVES_AVAILABLE';
export type SwapType = 'full' | 'h1_only' | 'h2_only';
export type SwapStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type UnitMatchType = 'MUTUAL_TOP' | 'CONSULTANT_PREFERRED_MERIT' | 'MERIT_RESIDUAL';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          intake_id?: string;
          full_name: string;
          role: UserRole;
          merit_rank: number | null;
          pin: string;
          slmc_reg_no: string | null;
          phone: string | null;
          mobile_number: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          intake_id?: string;
          full_name: string;
          role?: UserRole;
          merit_rank?: number | null;
          pin: string;
          slmc_reg_no?: string | null;
          phone?: string | null;
          mobile_number?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          intake_id?: string;
          full_name?: string;
          role?: UserRole;
          merit_rank?: number | null;
          pin?: string;
          slmc_reg_no?: string | null;
          phone?: string | null;
          mobile_number?: string | null;
          created_at?: string;
        };
      };
      ho_batches: {
        Row: {
          id: string;
          name: string;
          academic_year: string;
          appointment_start_date?: string;
          total_hos?: number;
          total_students: number;
          status: BatchStatus;
          registration_closes_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          academic_year?: string;
          appointment_start_date?: string;
          total_hos?: number;
          total_students?: number;
          status?: BatchStatus;
          registration_closes_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          academic_year?: string;
          appointment_start_date?: string;
          total_hos?: number;
          total_students?: number;
          status?: BatchStatus;
          registration_closes_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      ho_quotas: {
        Row: {
          id: string;
          batch_id: string;
          half: 'H1' | 'H2';
          medicine: number;
          surgery: number;
          pediatrics: number;
          gyn_obs: number;
        };
        Insert: {
          id?: string;
          batch_id: string;
          half: 'H1' | 'H2';
          medicine?: number;
          surgery?: number;
          pediatrics?: number;
          gyn_obs?: number;
        };
        Update: {
          id?: string;
          batch_id?: string;
          half?: 'H1' | 'H2';
          medicine?: number;
          surgery?: number;
          pediatrics?: number;
          gyn_obs?: number;
        };
      };
      ho_preferences: {
        Row: {
          id: string;
          batch_id: string;
          student_id: string;
          preference_rank: number; // 1, 2, or 3 (or up to 8)
          h1_specialty: SpecialtyType;
          h2_specialty: SpecialtyType;
          created_at: string;
        };
        Insert: {
          id?: string;
          batch_id: string;
          student_id: string;
          preference_rank: number;
          h1_specialty: SpecialtyType;
          h2_specialty: SpecialtyType;
          created_at?: string;
        };
        Update: {
          id?: string;
          batch_id?: string;
          student_id?: string;
          preference_rank?: number;
          h1_specialty?: SpecialtyType;
          h2_specialty?: SpecialtyType;
          created_at?: string;
        };
      };
      ho_allocations: {
        Row: {
          id: string;
          batch_id: string;
          student_id: string;
          status: HOAllocationStatus;
          assigned_h1: SpecialtyType | null;
          assigned_h2: SpecialtyType | null;
          choice_rank: number | null;
          available_alternatives: Json;
          audit_trail: Json;
          summary_explanation: string;
          allocated_at: string;
        };
        Insert: {
          id?: string;
          batch_id: string;
          student_id: string;
          status: HOAllocationStatus;
          assigned_h1?: SpecialtyType | null;
          assigned_h2?: SpecialtyType | null;
          choice_rank?: number | null;
          available_alternatives?: Json;
          audit_trail?: Json;
          summary_explanation: string;
          allocated_at?: string;
        };
        Update: {
          id?: string;
          batch_id?: string;
          student_id?: string;
          status?: HOAllocationStatus;
          assigned_h1?: SpecialtyType | null;
          assigned_h2?: SpecialtyType | null;
          choice_rank?: number | null;
          available_alternatives?: Json;
          audit_trail?: Json;
          summary_explanation?: string;
          allocated_at?: string;
        };
      };
      ho_swap_requests: {
        Row: {
          id: string;
          batch_id: string;
          initiator_id: string;
          target_id: string;
          swap_type: SwapType;
          status: SwapStatus;
          initiator_new_h1: SpecialtyType;
          initiator_new_h2: SpecialtyType;
          target_new_h1: SpecialtyType;
          target_new_h2: SpecialtyType;
          audit_reason: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          batch_id: string;
          initiator_id: string;
          target_id: string;
          swap_type: SwapType;
          status?: SwapStatus;
          initiator_new_h1: SpecialtyType;
          initiator_new_h2: SpecialtyType;
          target_new_h1: SpecialtyType;
          target_new_h2: SpecialtyType;
          audit_reason: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          batch_id?: string;
          initiator_id?: string;
          target_id?: string;
          swap_type?: SwapType;
          status?: SwapStatus;
          initiator_new_h1?: SpecialtyType;
          initiator_new_h2?: SpecialtyType;
          target_new_h1?: SpecialtyType;
          target_new_h2?: SpecialtyType;
          audit_reason?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      rho_batches: {
        Row: {
          id: string;
          name: string;
          status: string;
          medicine_quota: number;
          surgery_quota: number;
          pediatrics_quota: number;
          gyn_obs_quota: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          status?: string;
          medicine_quota?: number;
          surgery_quota?: number;
          pediatrics_quota?: number;
          gyn_obs_quota?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          status?: string;
          medicine_quota?: number;
          surgery_quota?: number;
          pediatrics_quota?: number;
          gyn_obs_quota?: number;
          created_at?: string;
        };
      };
      rho_allocations: {
        Row: {
          id: string;
          rho_batch_id: string;
          student_id: string;
          assigned_specialty: SpecialtyType;
          choice_rank: number | null;
          audit_reason: string;
          allocated_at: string;
        };
        Insert: {
          id?: string;
          rho_batch_id: string;
          student_id: string;
          assigned_specialty: SpecialtyType;
          choice_rank?: number | null;
          audit_reason: string;
          allocated_at?: string;
        };
        Update: {
          id?: string;
          rho_batch_id?: string;
          student_id?: string;
          assigned_specialty?: SpecialtyType;
          choice_rank?: number | null;
          audit_reason?: string;
          allocated_at?: string;
        };
      };
      rho_units: {
        Row: {
          id: string;
          unit_name: string;
          specialty: SpecialtyType;
          consultant_name: string;
          capacity: number;
          magic_pin: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          unit_name: string;
          specialty: SpecialtyType;
          consultant_name: string;
          capacity?: number;
          magic_pin: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          unit_name?: string;
          specialty?: SpecialtyType;
          consultant_name?: string;
          capacity?: number;
          magic_pin?: string;
          created_at?: string;
        };
      };
      consultant_selections: {
        Row: {
          id: string;
          unit_id: string;
          student_id: string;
          selection_rank: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          unit_id: string;
          student_id: string;
          selection_rank: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          unit_id?: string;
          student_id?: string;
          selection_rank?: number;
          created_at?: string;
        };
      };
      rho_unit_preferences: {
        Row: {
          id: string;
          student_id: string;
          unit_id: string;
          preference_rank: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          unit_id: string;
          preference_rank: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          unit_id?: string;
          preference_rank?: number;
          created_at?: string;
        };
      };
      rho_unit_allocations: {
        Row: {
          id: string;
          student_id: string;
          unit_id: string;
          match_type: UnitMatchType;
          audit_reason: string;
          allocated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          unit_id: string;
          match_type: UnitMatchType;
          audit_reason: string;
          allocated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          unit_id?: string;
          match_type?: UnitMatchType;
          audit_reason?: string;
          allocated_at?: string;
        };
      };
    };
  };
}
