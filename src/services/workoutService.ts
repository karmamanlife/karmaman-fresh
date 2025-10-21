import { getSupabase } from '../lib/supabase';

export type ExerciseSet = {
  id?: string;
  workout_log_id: string;
  exercise_name: string;
  set_number: number;
  reps: number;
  weight: number | null;
  rpe: number | null;
};

export type WorkoutLog = {
  id: string;
  user_id: string;
  session_id: string | null;
  logged_at: string;
  duration_minutes: number | null;
  notes: string | null;
};

export type SessionExercise = {
  id: string;
  session_id: string;
  order_index: number;
  exercise_name: string;
  sets: number;
  reps: string;
  rpe: string | null;
  rest_seconds: number | null;
  notes: string | null;
  equipment_needed: string | null;
};

// Create a new workout log when user starts a workout
export async function createWorkoutLog(sessionId: string | null): Promise<string | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_workout_logs')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        logged_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating workout log:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error in createWorkoutLog:', error);
    return null;
  }
}

// Save individual set data
export async function saveExerciseSet(setData: Omit<ExerciseSet, 'id'>): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
      .from('user_exercise_sets')
      .insert(setData);

    if (error) {
      console.error('Error saving exercise set:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveExerciseSet:', error);
    return false;
  }
}

// Load exercises for a workout session
export async function loadSessionExercises(sessionId: string): Promise<SessionExercise[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('session_exercises')
      .select('*')
      .eq('session_id', sessionId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error loading session exercises:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in loadSessionExercises:', error);
    return [];
  }
}

// Load previous workout data for an exercise (to show "Last time" info)
export async function loadPreviousExerciseSets(exerciseName: string): Promise<ExerciseSet[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get the most recent workout log for this user
    const { data: recentLog } = await supabase
      .from('user_workout_logs')
      .select('id')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(1)
      .single();

    if (!recentLog) return [];

    // Get sets for this exercise from that workout
    const { data, error } = await supabase
      .from('user_exercise_sets')
      .select('*')
      .eq('workout_log_id', recentLog.id)
      .eq('exercise_name', exerciseName)
      .order('set_number', { ascending: true });

    if (error) {
      console.error('Error loading previous sets:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in loadPreviousExerciseSets:', error);
    return [];
  }
}

// Update workout log duration when user finishes
export async function completeWorkoutLog(workoutLogId: string, durationMinutes: number): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { error } = await supabase
      .from('user_workout_logs')
      .update({ duration_minutes: durationMinutes })
      .eq('id', workoutLogId);

    if (error) {
      console.error('Error completing workout log:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in completeWorkoutLog:', error);
    return false;
  }
}

// Check if today's workout is complete (all exercises marked done)
export async function isTodaysWorkoutComplete(totalExercises: number): Promise<boolean> {
  try {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Get today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get today's workout log
    const { data: workoutLog } = await supabase
      .from('user_workout_logs')
      .select('id')
      .eq('user_id', user.id)
      .gte('logged_at', todayStart.toISOString())
      .lte('logged_at', todayEnd.toISOString())
      .order('logged_at', { ascending: false })
      .limit(1)
      .single();

    if (!workoutLog) return false;

    // Count distinct exercises logged
    const { data: exercises } = await supabase
      .from('user_exercise_sets')
      .select('exercise_name')
      .eq('workout_log_id', workoutLog.id);

    if (!exercises) return false;

    // Get unique exercise names
    const uniqueExercises = new Set(exercises.map(e => e.exercise_name));
    
    return uniqueExercises.size >= totalExercises;
  } catch (error) {
    console.error('Error checking workout completion:', error);
    return false;
  }
}