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

export async function getTodaysWorkout(userId: string): Promise<{
  session: WorkoutSession;
  exercises: SessionExercise[];
} | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  // Get user's program assignment
  const assignment = await getUserProgramAssignment(userId);
  if (!assignment) {
    // No program assigned - assign default "Post-Holiday Reset 5-Day"
    const { data: defaultProgram } = await supabase
      .from('workout_programs')
      .select('id')
      .eq('name', 'Post-Holiday Reset 5-Day')
      .single();

    if (defaultProgram) {
      // Auto-assign user to default program
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_program_assignments')
          .insert({
            user_id: user.id,
            program_id: defaultProgram.id,
            start_date: new Date().toISOString().split('T')[0],
            current_week: 1,
          });
        
        // Recursively call to get workout after assignment
        return getTodaysWorkout(userId);
      }
    }
    return null;
  }

  // Get today's day number (1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 0=Sun)
  const today = new Date().getDay();
  let dayNumber: number;
  
  if (today === 0) dayNumber = 1; // Sunday = Monday workout
  else if (today === 6) dayNumber = 5; // Saturday = Friday workout
  else dayNumber = today; // Mon=1, Tue=2, Wed=3, Thu=4, Fri=5

  // Get session for this day
  const { data: session, error: sessionError } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('program_id', assignment.program_id)
    .eq('day_number', dayNumber)
    .single();

  if (sessionError || !session) return null;

  // Get exercises for this session
  const exercises = await getSessionExercises(session.id);

  return {
    session: session as WorkoutSession,
    exercises,
  };
}