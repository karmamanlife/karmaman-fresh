// FILE: C:\Users\sngaw\karmaman-fresh\lib\workouts.ts
import { supabase } from './supabase';

export type Workout = {
  id: string;
  user_id: string;
  name: string;
  sets: number;
  reps: number;
  created_at: string;
};

export type WorkoutLog = {
  id: string;
  user_id: string;
  workout_id: string;
  for_date: string;   // 'YYYY-MM-DD'
  completed: boolean; // true when logged
  created_at: string;
};

// Fetch all workouts
export async function fetchWorkouts(): Promise<Workout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Create a workout owned by the current user
export async function addWorkout(name: string, sets = 5, reps = 5): Promise<Workout> {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('workouts')
    .insert({ user_id: user.id, name, sets, reps })
    .select('*')
    .single();
  if (error) throw error;
  return data as Workout;
}

// Log a completion for "today" (unique per user/workout/for_date)
export async function completeWorkoutToday(workoutId: string): Promise<WorkoutLog> {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error('Not signed in');

  const today = new Date();
  const yyyy = today.getUTCFullYear();
  const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(today.getUTCDate()).padStart(2, '0');
  const for_date = `${yyyy}-${mm}-${dd}`;

  const { data, error } = await supabase
    .from('workout_logs')
    .insert({ user_id: user.id, workout_id: workoutId, for_date, completed: true })
    .select('*')
    .single();

  if (error) {
    if ((error as any).code === '23505') throw new Error('Already completed this workout today');
    throw error;
  }
  return data as WorkoutLog;
}

// Get recent logs (last N days) for current user
export async function fetchRecentLogs(days = 30): Promise<WorkoutLog[]> {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error('Not signed in');

  const from = new Date();
  from.setUTCDate(from.getUTCDate() - days);

  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .gte('for_date', from.toISOString().slice(0, 10))
    .eq('user_id', user.id)
    .eq('completed', true)
    .order('for_date', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// Client-side fallback streak (UTC) based on for_date
export function computeDailyStreak(logs: WorkoutLog[]): number {
  const daysWithLogs = new Set(logs.filter(l => l.completed).map((l) => l.for_date)); // YYYY-MM-DD
  let streak = 0;
  const utcDate = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  let cur = utcDate(new Date());
  for (;;) {
    const yyyy = cur.getUTCFullYear();
    const mm = String(cur.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(cur.getUTCDate()).padStart(2, '0');
    const key = `${yyyy}-${mm}-${dd}`;
    if (daysWithLogs.has(key)) {
      streak++;
      cur = new Date(cur.getTime() - 24 * 60 * 60 * 1000);
    } else break;
  }
  return streak;
}

// Server-side (timezone-aware) streak via Supabase RPC
export async function fetchServerStreak(tz = 'Australia/Sydney'): Promise<number> {
  const { data, error } = await supabase.rpc('get_daily_streak', { tz });
  if (error) throw error;
  return (data ?? 0) as number;
}
