// src/services/workoutApi.ts
import { getSupabase } from '../lib/supabase';

export type WorkoutProgram = {
  id: string;
  name: string;
  goal: string;
  days_per_week: number;
  location: string;
  description: string;
  guidance: any;
};

export type WorkoutSession = {
  id: string;
  program_id: string;
  day_number: number;
  name: string;
  estimated_minutes: number;
  finisher: any;
};

export type SessionExercise = {
  id: string;
  session_id: string;
  order_index: number;
  exercise_name: string;
  sets: number;
  reps: string;
  rpe: string;
  rest_seconds: number;
  notes: string;
  equipment_needed: string;
};

export type UserProgramAssignment = {
  id: string;
  user_id: string;
  program_id: string;
  start_date: string;
  current_week: number;
};

export async function getUserProgramAssignment(userId: string): Promise<UserProgramAssignment | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_program_assignments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function getProgramWithSessions(programId: string): Promise<{
  program: WorkoutProgram;
  sessions: WorkoutSession[];
}> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not initialized');

  const { data: program, error: programError } = await supabase
    .from('workout_programs')
    .select('*')
    .eq('id', programId)
    .single();

  if (programError) throw programError;

  const { data: sessions, error: sessionsError } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('program_id', programId)
    .order('day_number');

  if (sessionsError) throw sessionsError;

  return {
    program: program as WorkoutProgram,
    sessions: (sessions || []) as WorkoutSession[],
  };
}

export async function getSessionExercises(sessionId: string): Promise<SessionExercise[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase not initialized');

  const { data, error } = await supabase
    .from('session_exercises')
    .select('*')
    .eq('session_id', sessionId)
    .order('order_index');

  if (error) throw error;
  return data || [];
}